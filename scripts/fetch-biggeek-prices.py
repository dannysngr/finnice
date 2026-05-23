#!/usr/bin/env python3
"""
fetch-biggeek-prices.py
─────────────────────────────────────────────────────────────────────────────
Тянет актуальные цены с biggeek.ru (категорийные страницы) и возвращает
{slug: {price, name}}. Используется как display-only источник в
fetch-mistore-prices.py — biggeek НЕ влияет на финальную цену (MAX берётся
только из TG-каналов партнёров), но показывается в админ-таблице как
третья колонка для сравнения.

Цена берётся из <b class="cart-modal-count">28 990 <span>₽</span></b> —
это та цена, которую видит покупатель (уже со скидкой/промо, если есть).
<span class="old-price">…</span> игнорируется.

Запуск отдельно (для отладки):
    python3 scripts/fetch-biggeek-prices.py
"""
from __future__ import annotations
import re, sys, time, html as html_mod, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
      "AppleWebKit/537.36 Chrome/126.0 Safari/537.36")

# ── Категории biggeek для парсинга цен ───────────────────────────────
# Должны быть синхронизированы со списком в import-biggeek-products.py
# (минус то, что бесполезно для сравнения с TG — там нет аксессуаров).
# Плюс apple-airpods, которого нет в import-* (AirPods живут в data.ts).
CATEGORIES: list[str] = [
    # MacBook / Mac
    "macbook-air-13-m5-2026",
    "macbook-air-15-m5-2026",
    "macbook-air-13-m4-2025",
    "macbook-air-15-m4-2025",
    "macbook-air-13-m3-2024",
    "macbook-air-15-m3-2024",
    "macbook-pro-14-m5-2025",
    "macbook-pro-14-m5-pro-2026",
    "macbook-pro-14-m5-max-2026",
    "macbook-pro-16-m5-pro-2026-preorder",
    "macbook-pro-16-m5-max-2026",
    "macbook-pro-14-m4-2024",
    "macbook-pro-14-m4-pro-2024",
    "macbook-pro-14-m4-max-2024",
    "macbook-pro-16-m4-pro-2024",
    "macbook-pro-16-m4-max-2024",
    "apple-imac-24-2024",
    "apple-mac-mini-2024",
    "apple-mac-studio",
    # iPad
    "ipad-pro-11-2025",
    "ipad-pro-13-2025",
    "ipad-air-11-2025",
    "ipad-air-13-2025",
    "ipad-mini-2024",
    "ipad-2025",
    # Apple Watch
    "apple-watch-series-11-alyuminij",
    "apple-watch-series-11-titan",
    "apple-watch-ultra-3-titan",
    "apple-watch-se-3-2025-alyuminij",
    "apple-watch-series-10-alyuminij",
    "apple-watch-series-10-titan",
    "apple-watch-ultra-2-titan",
    # AirPods (нет в biggeek-products.ts — матчим по имени)
    "apple-airpods",
    # iPhones — матчим по имени через normalize_iphone() в основном скрипте.
    # У biggeek 4 разных URL-паттерна для iPhone-категорий, перечисляем все.
    "apple-iphone-13",
    "apple-iphone-13-mini",
    "apple-iphone-14",
    "apple-iphone-14-plus",
    "apple-iphone-15",
    "apple-iphone-15-plus",
    "apple-iphone-15-pro",
    "apple-iphone-15-pro-max",
    "iphone-16",
    "iphone-16-plus",
    "iphone-16-pro",
    "iphone-16-pro-max",
    "iphone-16e",
    "apple-iphone-17",
    "apple-iphone-17-pro",
    "apple-iphone-17-pro-max",
    "apple-iphone-air",
    "iphone-17e",
    # Apple-аксессуары (чехлы, ремешки, MagSafe, AirTag, переходники).
    # Структура карточек та же — обычный biggeek catalog-card.
    "aksessuary-dlya-apple-airpods",      # чехлы для AirPods
    "aksessuary-dlya--apple-watch",       # ремешки и чехлы для Apple Watch (двойной дефис — так на biggeek)
    "aksessuary-magsafe",                 # держатели/зарядки/павербанки MagSafe
    "aksessuary-dlya-airtag",             # брелоки/петли для AirTag
    "apple-airtag",                       # сам AirTag (1-pack / 4-pack)
    "adaptery-i-perekhodniki-apple",      # Apple-переходники Lightning/USB-C/3.5мм
]


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read().decode("utf-8", errors="ignore")


def fetch_all_pages(category_path: str) -> list[str]:
    """Возвращает HTML всех страниц категории. Пустой список при ошибке."""
    url = f"https://biggeek.ru/catalog/{category_path}"
    try:
        first = fetch(url)
    except Exception as e:
        print(f"   ✗ {category_path}: fetch failed: {e}", file=sys.stderr)
        return []
    htmls = [first]
    # Пагинация: ищем максимальный ?page=N в HTML
    pages = re.findall(rf'/catalog/{re.escape(category_path)}\?page=(\d+)', first)
    max_page = max((int(p) for p in pages), default=1)
    for p in range(2, max_page + 1):
        try:
            htmls.append(fetch(f"{url}?page={p}"))
            time.sleep(0.2)
        except Exception:
            pass
    return htmls


# Карточка товара начинается с <div class="catalog-card">
# и содержит slug в href="/products/SLUG", имя в alt="..." или title-ссылке,
# и текущую цену в <b class="cart-modal-count">28 990 <span>₽</span></b>.
CARD_SPLIT = re.compile(r'<div class="catalog-card">')
HREF_RE    = re.compile(r'href="/products/([a-z0-9-]+)"', re.I)
PRICE_RE   = re.compile(
    r'cart-modal-count">\s*(?:от\s+)?([\d\s ]{3,12})\s*<span>\s*₽',
    re.I,
)
ALT_RE     = re.compile(r'alt="([^"]+)"')
TITLE_RE   = re.compile(
    r'class="catalog-card__title[^"]*"[^>]*>([^<]+)<', re.I,
)


def parse_card(card_html: str) -> tuple[str, str, int] | None:
    """Возвращает (slug, name, price) или None если что-то не нашлось."""
    href_m = HREF_RE.search(card_html)
    if not href_m:
        return None
    slug = href_m.group(1)

    price_m = PRICE_RE.search(card_html)
    if not price_m:
        return None
    digits = re.sub(r"\D", "", price_m.group(1))
    if not digits:
        return None
    price = int(digits)
    if price < 1000 or price > 9_999_999:
        return None

    # Имя: сначала пробуем alt, потом текст в catalog-card__title.
    name = ""
    alt_m = ALT_RE.search(card_html)
    if alt_m:
        name = html_mod.unescape(alt_m.group(1).strip())
    if not name:
        title_m = TITLE_RE.search(card_html)
        if title_m:
            name = html_mod.unescape(title_m.group(1).strip())
    if not name:
        name = slug.replace("-", " ")
    return slug, name, price


def parse_category_html(html: str) -> dict[str, dict]:
    """Из HTML страницы → {slug: {price, name}}.
    Для дублей берём минимальную цену (страница повторяется по слугам редко,
    но если случилось — берём наименьшую как самую честную)."""
    out: dict[str, dict] = {}
    chunks = CARD_SPLIT.split(html)[1:]  # пропускаем хедер до первой карточки
    for chunk in chunks:
        parsed = parse_card(chunk)
        if not parsed:
            continue
        slug, name, price = parsed
        if slug in out and out[slug]["price"] <= price:
            continue
        out[slug] = {"price": price, "name": name}
    return out


def fetch_biggeek_prices(
    categories: list[str] | None = None,
    verbose: bool = True,
) -> dict[str, dict]:
    """Главная точка входа. Возвращает {slug: {price, name}}."""
    cats = categories if categories is not None else CATEGORIES
    all_prices: dict[str, dict] = {}
    for i, cat in enumerate(cats, 1):
        if verbose:
            print(f"  [{i}/{len(cats)}] {cat}")
        htmls = fetch_all_pages(cat)
        for html in htmls:
            page_prices = parse_category_html(html)
            for slug, data in page_prices.items():
                # Если slug уже встречался в другой категории — берём min
                if slug in all_prices and all_prices[slug]["price"] <= data["price"]:
                    continue
                all_prices[slug] = data
        time.sleep(0.15)  # вежливость к biggeek
    return all_prices


def main():
    print(f"→ Парсю {len(CATEGORIES)} категорий biggeek.ru…")
    prices = fetch_biggeek_prices()
    print(f"\n✓ Собрано {len(prices)} уникальных SKU с ценами")
    # Топ 10 самых дорогих — sanity check
    top = sorted(prices.items(), key=lambda x: -x[1]["price"])[:10]
    print("\nТоп 10 по цене:")
    for slug, d in top:
        print(f"  {d['price']:>9,}₽  {d['name'][:70]}")
    # Распределение по «семействам» — по префиксу slug
    by_prefix: dict[str, int] = {}
    for slug in prices:
        prefix = slug.split("-", 2)[0]
        by_prefix[prefix] = by_prefix.get(prefix, 0) + 1
    print("\nРаспределение по slug-префиксу:")
    for prefix, n in sorted(by_prefix.items(), key=lambda x: -x[1])[:15]:
        print(f"  {n:>4}  {prefix}-…")


if __name__ == "__main__":
    main()
