#!/usr/bin/env python3
"""
scripts/import-biggeek-products.py

Скачивает товары с категорийных страниц biggeek.ru, выгружает картинки
в public/images/biggeek/ и генерирует TypeScript-фрагмент с описаниями
для вставки в PRODUCTS массив в lib/data.ts.

Запуск:
  python3 scripts/import-biggeek-products.py
"""

import re
import sys
import os
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "public" / "images" / "biggeek"
OUT_TS = ROOT / "lib" / "biggeek-products.ts"
IMG_DIR.mkdir(parents=True, exist_ok=True)

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0 Safari/537.36"

# ── Категории biggeek и их соответствие нашему каталогу ─────────
CATEGORIES = [
    # (biggeek_path,                            our_category,    brand_hint, type_label)
    # Ноутбуки
    ("macbook-air-13-m5-2026",                  "noutbuki",      "Apple",   "MacBook Air"),
    ("macbook-air-15-m5-2026",                  "noutbuki",      "Apple",   "MacBook Air"),
    ("macbook-air-13-m4-2025",                  "noutbuki",      "Apple",   "MacBook Air"),
    ("macbook-air-15-m4-2025",                  "noutbuki",      "Apple",   "MacBook Air"),
    ("macbook-air-13-m3-2024",                  "noutbuki",      "Apple",   "MacBook Air"),
    ("macbook-air-15-m3-2024",                  "noutbuki",      "Apple",   "MacBook Air"),
    ("macbook-pro-14-m5-2025",                  "noutbuki",      "Apple",   "MacBook Pro"),
    ("macbook-pro-14-m5-pro-2026",              "noutbuki",      "Apple",   "MacBook Pro"),
    ("macbook-pro-14-m5-max-2026",              "noutbuki",      "Apple",   "MacBook Pro"),
    ("macbook-pro-16-m5-pro-2026-preorder",     "noutbuki",      "Apple",   "MacBook Pro"),
    ("macbook-pro-16-m5-max-2026",              "noutbuki",      "Apple",   "MacBook Pro"),
    ("macbook-pro-14-m4-2024",                  "noutbuki",      "Apple",   "MacBook Pro"),
    ("macbook-pro-14-m4-pro-2024",              "noutbuki",      "Apple",   "MacBook Pro"),
    ("macbook-pro-14-m4-max-2024",              "noutbuki",      "Apple",   "MacBook Pro"),
    ("macbook-pro-16-m4-pro-2024",              "noutbuki",      "Apple",   "MacBook Pro"),
    ("macbook-pro-16-m4-max-2024",              "noutbuki",      "Apple",   "MacBook Pro"),
    # iMac / Mac mini / Studio
    ("apple-imac-24-2024",                      "noutbuki",      "Apple",   "iMac 24"),
    ("apple-mac-mini-2024",                     "noutbuki",      "Apple",   "Mac mini"),
    ("apple-mac-studio",                        "noutbuki",      "Apple",   "Mac Studio"),
    # iPad
    ("ipad-pro-11-2025",                        "planshety",     "Apple",   "iPad Pro"),
    ("ipad-pro-13-2025",                        "planshety",     "Apple",   "iPad Pro"),
    ("ipad-air-11-2025",                        "planshety",     "Apple",   "iPad Air"),
    ("ipad-air-13-2025",                        "planshety",     "Apple",   "iPad Air"),
    ("ipad-mini-2024",                          "planshety",     "Apple",   "iPad mini"),
    ("ipad-2025",                               "planshety",     "Apple",   "iPad"),
    # Apple Watch
    ("apple-watch-series-11-alyuminij",         "smart_chasy",   "Apple",   "Apple Watch Series 11"),
    ("apple-watch-series-11-titan",             "smart_chasy",   "Apple",   "Apple Watch Series 11"),
    ("apple-watch-ultra-3-titan",               "smart_chasy",   "Apple",   "Apple Watch Ultra 3"),
    ("apple-watch-se-3-2025-alyuminij",         "smart_chasy",   "Apple",   "Apple Watch SE 3"),
    ("apple-watch-series-10-alyuminij",         "smart_chasy",   "Apple",   "Apple Watch Series 10"),
    ("apple-watch-series-10-titan",             "smart_chasy",   "Apple",   "Apple Watch Series 10"),
    ("apple-watch-ultra-2-titan",               "smart_chasy",   "Apple",   "Apple Watch Ultra 2"),
    # Apple TV / AirTag
    ("apple-tv",                                "gadzety_i_konsoli", "Apple", "Apple TV"),
    ("apple-airtag",                            "aksessuary",    "Apple",   "AirTag"),
    # Аксессуары — основные
    ("apple-pencil",                            "aksessuary",    "Apple",   "Apple Pencil"),
    ("magic-keyboard",                          "aksessuary",    "Apple",   "Magic Keyboard"),
    ("magic-mouse",                             "aksessuary",    "Apple",   "Magic Mouse"),
    ("magic-trackpad",                          "aksessuary",    "Apple",   "Magic Trackpad"),

    # ── Apple-аксессуары: куратированная подборка с biggeek ─────
    ("aksessuary-apple",                        "aksessuary",    "Apple",   "Apple-аксессуар"),
    ("adaptery-i-perekhodniki-apple",           "aksessuary",    "Apple",   "Адаптер Apple"),
    ("aksessuary-magsafe",                      "aksessuary",    "Apple",   "MagSafe"),
    ("aksessuary-dlya-apple-airpods",           "aksessuary",    "Apple",   "Аксессуар AirPods"),
    ("aksessuary-dlya--apple-watch",            "aksessuary",    "Apple",   "Ремешок Apple Watch"),

    # ── Гаджеты и консоли ────────────────────────────────────────
    ("sony-playstation",                        "gadzety_i_konsoli", "Sony",      "PlayStation"),
    ("microsoft-xbox",                          "gadzety_i_konsoli", "Microsoft", "Xbox"),
    ("nintendo-switch",                         "gadzety_i_konsoli", "Nintendo",  "Switch"),
    ("apple-vision-pro",                        "gadzety_i_konsoli", "Apple",     "Vision Pro"),

    # ── Garmin (smart_chasy) ─────────────────────────────────────
    ("umnye-chasy-garmin",                      "smart_chasy",       "Garmin",    "Часы Garmin"),

    # ── Dyson — распределяем по категориям ───────────────────────
    ("besprovodnye-pylesosy-dyson",             "bytovaya_tekhnika", "Dyson",     "Пылесос"),
    ("feny-dyson",                              "bytovaya_tekhnika", "Dyson",     "Фен"),
    ("stajlery-dyson",                          "bytovaya_tekhnika", "Dyson",     "Стайлер"),
    ("vypryamiteli-dlya-volos-dyson",           "bytovaya_tekhnika", "Dyson",     "Выпрямитель"),
    ("ochistiteli-vozdukha-dyson",              "dlya_doma_i_sada",  "Dyson",     "Очиститель воздуха"),

    # ── Умные колонки Apple ──────────────────────────────────────
    ("apple-homepod",                           "aksessuary",        "Apple",     "HomePod"),
    ("apple-homepod-mini",                      "aksessuary",        "Apple",     "HomePod mini"),
]

# Авто-определение бренда по имени товара (для смешанных категорий)
BRAND_PATTERNS = [
    (r"\bPlayStation|PS5|PS4|DualSense\b", "Sony"),
    (r"\bXbox\b",                          "Microsoft"),
    (r"\bNintendo|Switch\b",               "Nintendo"),
    (r"\bGarmin|Fenix|Forerunner|Instinct|Venu|Vivoactive|Epix\b", "Garmin"),
    (r"\bDyson\b",                         "Dyson"),
    (r"\bApple\b",                         "Apple"),
    (r"\bSonos\b",                         "Sonos"),
    (r"\bJBL\b",                           "JBL"),
    (r"\bMarshall\b",                      "Marshall"),
    (r"\bBose\b",                          "Bose"),
    (r"\bSony\b",                          "Sony"),
]


def detect_brand(name: str, fallback: str) -> str:
    for pat, br in BRAND_PATTERNS:
        if re.search(pat, name, re.I):
            return br
    return fallback


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read().decode("utf-8", errors="ignore")


def slugify(s: str) -> str:
    """Транслит + lowercase + dash-separated"""
    table = str.maketrans({
        "а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"yo","ж":"zh","з":"z","и":"i",
        "й":"y","к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t",
        "у":"u","ф":"f","х":"h","ц":"ts","ч":"ch","ш":"sh","щ":"sch","ъ":"","ы":"y","ь":"",
        "э":"e","ю":"yu","я":"ya",
    })
    s = s.lower().translate(table)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def parse_products(html: str):
    """Возвращает list[{href,img,name}] из категорийной страницы biggeek."""
    out = []
    # Карточки товаров на biggeek начинаются с /products/<slug>
    product_hrefs = re.findall(r'href="(/products/[a-z0-9-]+)"', html, re.IGNORECASE)
    # Дедуп с сохранением порядка
    seen = set()
    ordered_hrefs = []
    for h in product_hrefs:
        if h not in seen:
            seen.add(h)
            ordered_hrefs.append(h)

    for href in ordered_hrefs:
        # Найдём позицию в HTML и возьмём окрестность для парсинга имени/картинки
        idx = html.find(f'href="{href}"')
        if idx < 0:
            continue
        chunk = html[max(0, idx-200):idx+3500]

        img_m = re.search(r'src="(?P<u>(?://|https://)images\.biggeek\.ru/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"', chunk, re.I)
        if not img_m:
            continue

        # Имя: пробуем alt="" / title="" / текст в ссылке
        name = None
        m = re.search(r'alt="([^"]{4,200})"', chunk)
        if m: name = m.group(1).strip()
        if not name:
            m = re.search(r'title="([^"]{4,200})"', chunk)
            if m: name = m.group(1).strip()
        if not name:
            # Текст внутри тега <a>...</a> — берём текст без HTML
            link_m = re.search(rf'<a [^>]*href="{re.escape(href)}"[^>]*>(.+?)</a>', chunk, re.DOTALL)
            if link_m:
                text = re.sub(r'<[^>]+>', ' ', link_m.group(1))
                text = re.sub(r'\s+', ' ', text).strip()
                if 5 < len(text) < 200:
                    name = text
        if not name:
            # Fallback: используем slug
            slug = href.rsplit('/', 1)[-1]
            name = slug.replace('-', ' ').title()

        out.append({"href": href, "img": img_m.group("u"), "name": name})
    return out


def fetch_all_pages(category_path: str):
    """Возвращает HTML всех страниц категории (склеенный)."""
    url = f"https://biggeek.ru/catalog/{category_path}"
    htmls = []
    try:
        html = fetch(url)
        htmls.append(html)
    except Exception as e:
        print(f"   ✗ fetch failed: {e}")
        return [], url

    # Найти максимальный page=N в HTML
    pages = re.findall(rf'/catalog/{re.escape(category_path)}\?page=(\d+)', html)
    max_page = max([int(p) for p in pages], default=1)
    for p in range(2, max_page + 1):
        try:
            htmls.append(fetch(f"{url}?page={p}"))
            time.sleep(0.2)
        except Exception:
            pass
    return htmls, url


def find_price_for_card(html: str, href: str):
    """Ищет цену рядом с указанной карточкой. На biggeek цена внутри
       <b class="cart-modal-count">189 990 <span>₽</span></b>."""
    idx = html.find(f'href="{href}"')
    if idx < 0:
        return None
    window = html[idx:idx+3500]
    # Главный паттерн biggeek
    pm = re.search(r'cart-modal-count">\s*([\d\s]{3,12})\s*<span>\s*₽', window)
    if pm:
        digits = re.sub(r"\D", "", pm.group(1))
        if digits and 1000 <= int(digits) <= 9999999:
            return int(digits)
    # Fallback: число + ₽
    pm = re.search(r'>\s*([\d][\d\s]{3,12})\s*<span>\s*₽', window)
    if pm:
        digits = re.sub(r"\D", "", pm.group(1))
        if digits and 1000 <= int(digits) <= 9999999:
            return int(digits)
    return None


def download_image(url: str, out_path: Path, referer: str) -> bool:
    if out_path.exists() and out_path.stat().st_size > 1000:
        return True
    if url.startswith("//"):
        url = "https:" + url
    url = url.replace(" ", "%20")
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Referer": referer})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            data = r.read()
            if len(data) > 1000:
                out_path.write_bytes(data)
                return True
    except Exception as e:
        print(f"      ⚠ image download fail {url[:80]}: {e}", file=sys.stderr)
    return False


def main():
    all_products = []

    # Категории-аксессуары: брать только топ-15 первой страницы (популярные),
    # иначе наберём 600+ кейсов/кабелей и засрём каталог.
    ACCESSORY_LIMIT = 15
    ACCESSORY_PATHS = {
        "aksessuary-apple", "adaptery-i-perekhodniki-apple",
        "aksessuary-magsafe", "aksessuary-dlya-apple-airpods",
        "aksessuary-dlya--apple-watch",
    }

    seen_slugs = set()
    for path, category, brand, type_label in CATEGORIES:
        print(f"▶ {path}")
        htmls, base_url = fetch_all_pages(path)
        if not htmls:
            continue
        # Для аксессуарных подборок — только первая страница
        if path in ACCESSORY_PATHS:
            htmls = htmls[:1]

        products_total = 0
        limit_hit = False
        for html in htmls:
            if limit_hit:
                break
            products = parse_products(html)
            if not products:
                continue
            for p in products:
                if path in ACCESSORY_PATHS and products_total >= ACCESSORY_LIMIT:
                    limit_hit = True
                    break
                slug = p["href"].rstrip("/").split("/")[-1]
                if slug in seen_slugs:
                    continue
                price = find_price_for_card(html, p["href"])
                if not price:
                    continue
                local_img = IMG_DIR / f"{slug}.jpg"
                ok = download_image(p["img"], local_img, referer=base_url)
                if not ok:
                    continue

                seen_slugs.add(slug)
                products_total += 1
                actual_brand = detect_brand(p["name"], brand)
                all_products.append({
                    "id":        slug,   # full slug — обрезка до 60 ломала уникальность
                    "name":      p["name"],
                    "slug":      slug,
                    "category":  category,
                    "brand":     actual_brand,
                    "type":      type_label,
                    "price":     price,
                    "img":       f"/images/biggeek/{slug}.jpg",
                })
                time.sleep(0.05)

        print(f"   ✓ {products_total} новых товаров")
        time.sleep(0.3)

    print(f"\n✅ ВСЕГО: {len(all_products)} товаров")

    # Пишем TypeScript-файл с массивом
    ts_lines = [
        "/* AUTO-GENERATED by scripts/import-biggeek-products.py — не править вручную.",
        "   Цены и изображения взяты с biggeek.ru. Запусти скрипт снова, чтобы обновить. */",
        "",
        'import type { Product } from "./data";',
        "",
        "export const BIGGEEK_PRODUCTS: Product[] = [",
    ]
    for p in all_products:
        # Лучший emoji по категории (с уточнением для геймпадов/Apple TV)
        cat = p["category"]
        name_lc = p["name"].lower()
        if cat == "gadzety_i_konsoli":
            if "vision pro" in name_lc or "vr" in name_lc:
                emoji = "🥽"
            elif "apple tv" in name_lc or "медиаплеер" in name_lc:
                emoji = "📺"
            else:
                emoji = "🎮"
        elif cat == "bytovaya_tekhnika":
            if "фен" in name_lc:           emoji = "💨"
            elif "пылесос" in name_lc:     emoji = "🧹"
            elif "стайлер" in name_lc or "выпрямит" in name_lc: emoji = "💇"
            else:                           emoji = "🏠"
        elif cat == "dlya_doma_i_sada":
            emoji = "🌿"
        else:
            emoji = {
                "noutbuki":    "💻",
                "planshety":   "📱",
                "smart_chasy": "⌚",
                "aksessuary":  "🎧",
            }.get(cat, "📦")
        name_esc = p["name"].replace("\\", "\\\\").replace('"', '\\"')
        ts_lines.append(
            f'  {{ id:"{p["id"]}", name:"{name_esc}", slug:"{p["slug"]}",'
            f' category:"{p["category"]}", brand:"{p["brand"]}", price:{p["price"]},'
            f' emoji:"{emoji}", img:"{p["img"]}", inStock:true, rating:5, reviewCount:0,'
            f' description:"", specs:[] }},'
        )
    ts_lines.append("];")
    OUT_TS.write_text("\n".join(ts_lines))
    print(f"📝 Записано: {OUT_TS}")


if __name__ == "__main__":
    main()
