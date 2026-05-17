#!/usr/bin/env python3
"""
scripts/import-biggeek-macbooks.py

Импортирует MacBook'и с biggeek.ru с полными характеристиками.
В отличие от import-biggeek-products.py фетчит детальную страницу каждого
товара и парсит structured-data (Серия, Процессор, ОЗУ, SSD, Цвет, Экран, …)
из блока <div class="product-characteristics">.

Группирует по (Серия, Процессор, ОЗУ, SSD). Цвета одной конфигурации
склеиваются в массив img. Цена группы — минимальная среди цветов.

Запуск:
  python3 scripts/import-biggeek-macbooks.py
"""

import re
import sys
import time
import html as html_lib
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "public" / "images" / "biggeek"
OUT_TS = ROOT / "lib" / "biggeek-macbooks.ts"
IMG_DIR.mkdir(parents=True, exist_ok=True)

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
      "AppleWebKit/537.36 Chrome/126.0 Safari/537.36")

CATEGORIES = [
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
]

# Порядок групп на детальной странице (как на biggeek).
GROUP_ORDER = [
    "Общие характеристики", "Конструкция", "Память и процессор",
    "Экран", "Звук", "Связь", "Интерфейсы",
    "Устройства ввода", "Устройства хранения данных",
    "Мультимедийные возможности", "Питание", "Другие функции", "Прочее",
]


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read().decode("utf-8", errors="ignore")


def fetch_all_pages(category_path: str):
    base = f"https://biggeek.ru/catalog/{category_path}"
    try:
        first = fetch(base)
    except Exception as e:
        print(f"   ✗ fetch fail: {e}")
        return [], base
    htmls = [first]
    pages = re.findall(rf'/catalog/{re.escape(category_path)}\?page=(\d+)', first)
    max_p = max([int(x) for x in pages], default=1)
    for p in range(2, max_p + 1):
        try:
            htmls.append(fetch(f"{base}?page={p}"))
            time.sleep(0.2)
        except Exception:
            pass
    return htmls, base


def parse_product_hrefs(htmls):
    hrefs, seen = [], set()
    for h in htmls:
        for href in re.findall(r'href="(/products/[a-z0-9-]+)"', h):
            slug = href.rsplit("/", 1)[-1]
            if slug.startswith("service-"):
                continue
            if href not in seen:
                seen.add(href)
                hrefs.append(href)
    return hrefs


def find_price_in_card(html_text: str, href: str):
    idx = html_text.find(f'href="{href}"')
    if idx < 0:
        return None
    window = html_text[idx:idx + 3500]
    m = re.search(r'cart-modal-count">\s*([\d\s]{3,12})\s*<span>\s*₽', window)
    if not m:
        m = re.search(r'>\s*([\d][\d\s]{3,12})\s*<span>\s*₽', window)
    if not m:
        return None
    digits = re.sub(r"\D", "", m.group(1))
    if not digits:
        return None
    val = int(digits)
    return val if 1000 <= val <= 9999999 else None


def find_card_image(html_text: str, href: str):
    idx = html_text.find(f'href="{href}"')
    if idx < 0:
        return None
    chunk = html_text[max(0, idx - 200):idx + 3500]
    m = re.search(
        r'src="((?://|https://)images\.biggeek\.ru/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
        chunk, re.I,
    )
    return m.group(1) if m else None


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
        print(f"      ⚠ image fail {url[:80]}: {e}")
    return False


def parse_detail(html_text: str):
    """Returns dict with: name, specs (list of {key,val}), description (str)."""
    # Имя — из <h1>
    name = ""
    name_m = re.search(
        r'<h1[^>]*class="[^"]*product-view__title[^"]*"[^>]*>(.+?)</h1>',
        html_text, re.DOTALL,
    )
    if not name_m:
        name_m = re.search(r'<h1[^>]*>(.+?)</h1>', html_text, re.DOTALL)
    if name_m:
        name = re.sub(r"<[^>]+>", " ", name_m.group(1))
        name = re.sub(r"\s+", " ", name).strip()
        name = html_lib.unescape(name)

    # Specs: на value-div есть все три атрибута — group, name, value
    specs = []
    seen_keys = set()
    for m in re.finditer(
        r'data-group-name="([^"]+)"[^>]*data-option-name="([^"]+)"[^>]*data-option-value="([^"]+)"',
        html_text,
    ):
        group = html_lib.unescape(m.group(1)).strip()
        key = html_lib.unescape(m.group(2)).strip()
        val = html_lib.unescape(m.group(3)).strip()
        if key in seen_keys:
            continue
        seen_keys.add(key)
        specs.append({"key": key, "val": val, "group": group})
    # Fallback — specs без обёртки с группой
    for m in re.finditer(
        r'data-option-name="([^"]+)"[^>]*data-option-value="([^"]+)"',
        html_text,
    ):
        key = html_lib.unescape(m.group(1)).strip()
        val = html_lib.unescape(m.group(2)).strip()
        if key in seen_keys:
            continue
        seen_keys.add(key)
        specs.append({"key": key, "val": val, "group": "Прочее"})

    # Description: блок Обзор
    desc = ""
    ov_m = re.search(
        r'<div\s+id="product-overview".+?<div class="tabs-content__inner">(.+?)</div>\s*</div>\s*<div\s+id="product-characteristics"',
        html_text, re.DOTALL,
    )
    if ov_m:
        raw = ov_m.group(1)
        raw = re.sub(r"<iframe.*?</iframe>", "", raw, flags=re.DOTALL)
        raw = re.sub(r"<img[^>]*/?>", "", raw)
        raw = re.sub(r"<h3[^>]*>(.*?)</h3>", r"\n\n\1\n", raw, flags=re.DOTALL)
        raw = re.sub(r"<p[^>]*>(.*?)</p>", r"\1\n", raw, flags=re.DOTALL)
        raw = re.sub(r"<br\s*/?>", " ", raw)
        raw = re.sub(r"<[^>]+>", "", raw)
        raw = html_lib.unescape(raw)
        raw = re.sub(r"\n{3,}", "\n\n", raw)
        desc = raw.strip()

    return {"name": name, "specs": specs, "description": desc}


def spec_get(specs, key):
    for s in specs:
        if s["key"] == key:
            return s["val"]
    return None


def normalize_storage(val: str):
    if not val:
        return None
    v = val.strip().replace(" ", "").lower()
    n = re.sub(r"\D", "", v)
    if not n:
        return None
    if "тб" in v or "tb" in v:
        return f"{n} ТБ"
    return f"{n} ГБ"


def normalize_ram(val: str):
    if not val:
        return None
    n = re.sub(r"\D", "", val)
    return f"{n} ГБ" if n else None


def normalize_chip(val: str):
    """'Apple M5' / 'Apple M5 Pro' / 'Apple M4 Max' → 'M5' / 'M5 Pro' / 'M4 Max'."""
    if not val:
        return None
    m = re.search(r"(M[1-5])(?:\s+(Pro|Max|Ultra))?", val, re.I)
    if not m:
        return val
    base = m.group(1).upper()
    suf = m.group(2)
    return f"{base} {suf.title()}" if suf else base


def year_from_cat(cat: str) -> int:
    m = re.search(r"(\d{4})", cat)
    return int(m.group(1)) if m else 2025


def series_short(series: str) -> str:
    return {
        "MacBook Air 13": "mba13",
        "MacBook Air 15": "mba15",
        "MacBook Pro 14": "mbp14",
        "MacBook Pro 16": "mbp16",
    }.get(series, re.sub(r"[^a-z0-9]+", "-", series.lower()).strip("-"))


def main():
    all_skus = []
    print(f"Fetching {len(CATEGORIES)} MacBook categories from biggeek.ru\n")

    for cat in CATEGORIES:
        print(f"▶ {cat}")
        htmls, base_url = fetch_all_pages(cat)
        if not htmls:
            continue
        hrefs = parse_product_hrefs(htmls)
        print(f"   hrefs: {len(hrefs)}")

        for href in hrefs:
            slug = href.rsplit("/", 1)[-1]

            # Цена и картинка — из карточки каталога
            price = None
            img_url = None
            for h in htmls:
                price = price or find_price_in_card(h, href)
                img_url = img_url or find_card_image(h, href)
                if price and img_url:
                    break
            if not price:
                print(f"   ⚠ skip {slug}: no price in card")
                continue

            # Детальная страница — для specs/description
            try:
                detail_html = fetch(f"https://biggeek.ru{href}")
            except Exception as e:
                print(f"   ✗ detail fail {slug}: {e}")
                continue
            detail = parse_detail(detail_html)
            time.sleep(0.15)

            series = spec_get(detail["specs"], "Серия")
            chip = normalize_chip(spec_get(detail["specs"], "Процессор") or "")
            ram = normalize_ram(spec_get(detail["specs"], "Объем оперативной памяти") or "")
            ssd = normalize_storage(spec_get(detail["specs"], "Объем встроенной памяти") or "")
            color = spec_get(detail["specs"], "Цвет") or ""
            # Biggeek иногда возвращает мусор в Цвет (напр. «зве» вместо
            # «Сияющая звезда»). Если коротко — пробуем восстановить из слага.
            if len(color) < 4:
                sl = slug.lower()
                if "starlight" in sl or "siausaa-zvezda" in sl: color = "Сияющая звезда"
                elif "midnight" in sl: color = "Тёмная ночь"
                elif "space-gray" in sl or "kosmos" in sl and "seryj" in sl: color = "Серый космос"
                elif "space-black" in sl or "cernyj-kosmos" in sl: color = "Чёрный космос"
                elif "silver" in sl or "serebristyj" in sl: color = "Серебристый"
                elif "sky-blue" in sl or "nebesno" in sl: color = "Небесно-голубой"
                elif "blue" in sl or "goluboj" in sl: color = "Голубой"
                elif "gold" in sl or "zolot" in sl: color = "Золотой"
                elif "black" in sl or "cernyj" in sl: color = "Чёрный"

            if not (series and chip and ram and ssd):
                print(f"   ⚠ skip {slug}: incomplete spec ({series}/{chip}/{ram}/{ssd})")
                continue

            # Картинка
            local_img = IMG_DIR / f"{slug}.jpg"
            if img_url:
                download_image(img_url, local_img, referer=base_url)

            all_skus.append({
                "slug": slug,
                "name": detail["name"] or slug,
                "price": price,
                "color": color,
                "series": series,
                "chip": chip,
                "ram": ram,
                "ssd": ssd,
                "specs": detail["specs"],
                "description": detail["description"],
                "img": f"/images/biggeek/{slug}.jpg" if local_img.exists() else None,
                "category_path": cat,
            })
            print(f"   ✓ {slug[:55]:55} {price:>7}₽  {series}/{chip}/{ram}/{ssd}/{color}")

        time.sleep(0.3)

    # Группировка по (series, chip) — все конфигурации одной модели в одной карточке
    groups: dict = {}
    for s in all_skus:
        key = (s["series"], s["chip"])
        g = groups.setdefault(key, {
            "items": [],
            "min_price": s["price"],
            "cheapest": s,
        })
        g["items"].append(s)
        if s["price"] < g["min_price"]:
            g["min_price"] = s["price"]
            g["cheapest"] = s

    print(f"\n✅ Raw SKUs: {len(all_skus)}, groups: {len(groups)}\n")

    # Сборка списка продуктов
    products = []
    for (series, chip), g in groups.items():
        c = g["cheapest"]

        # Цвета: уникальные, в порядке появления
        colors_seen, colors = set(), []
        for it in g["items"]:
            col = it["color"]
            if col and col not in colors_seen:
                colors_seen.add(col)
                colors.append(col)

        # Картинки: по одной на цвет (первая попавшаяся)
        img_by_color: dict = {}
        for it in g["items"]:
            col, img = it["color"], it.get("img")
            if col and img and col not in img_by_color:
                img_by_color[col] = img
        imgs = [img_by_color[c] for c in colors if c in img_by_color]
        # Если совсем нет — fallback на любую из группы
        if not imgs:
            any_img = next((x["img"] for x in g["items"] if x.get("img")), None)
            if any_img:
                imgs = [any_img]
        # Ограничим 4 для слайдера каталога
        imgs_for_card = imgs[:4]

        # Память (RAM/SSD пары) — уникальные, отсортированы
        def _ram_n(s_): return int(re.sub(r"\D", "", s_["ram"]) or 0)
        def _ssd_n(s_):
            n = int(re.sub(r"\D", "", s_["ssd"]) or 0)
            return n * 1000 if "ТБ" in s_["ssd"] else n
        memory_combos = sorted({(it["ram"], it["ssd"]) for it in g["items"]},
                               key=lambda t: (int(re.sub(r"\D", "", t[0]) or 0),
                                              (int(re.sub(r"\D", "", t[1]) or 0) *
                                               (1000 if "ТБ" in t[1] else 1))))
        memory_labels = [f"{r} / {ss}" for r, ss in memory_combos]

        # Variants — все доступные конфигурации
        variants = []
        seen_var = set()
        for it in g["items"]:
            key_v = (it["ram"], it["ssd"], it["color"])
            if key_v in seen_var:
                continue
            seen_var.add(key_v)
            variants.append({
                "ram": it["ram"],
                "ssd": it["ssd"],
                "color": it["color"],
                "price": it["price"],
                "img": it.get("img") or "",
            })

        # Все specs от cheapest SKU (полный набор)
        specs_full = list(c["specs"])

        name = f'{series}" {chip}'
        slug_id = f"{series_short(series)}-{chip.lower().replace(' ', '')}"

        products.append({
            "id": slug_id,
            "name": name,
            "slug": slug_id,
            "category": "noutbuki",
            "brand": "Apple",
            "price": g["min_price"],
            "year": year_from_cat(c["category_path"]),
            "emoji": "💻",
            "imgs": imgs_for_card,
            "memories": memory_labels,
            "colors": colors,
            "variants": variants,
            "specs": specs_full,
            "description": c["description"][:3000] if c["description"] else "",
            "chip": chip,
        })

    # Сортировка: чип-поколение ↓ → размер ↓ → цена ↑
    chip_order = {
        "M5 Max": 0, "M5 Pro": 1, "M5": 2,
        "M4 Max": 3, "M4 Pro": 4, "M4": 5,
        "M3 Max": 6, "M3 Pro": 7, "M3": 8,
    }
    size_order = {"MacBook Pro 16": 0, "MacBook Pro 14": 1, "MacBook Air 15": 2, "MacBook Air 13": 3}

    def sort_key(p):
        return (
            -p["year"],
            chip_order.get(p["chip"], 99),
            size_order.get(p["name"].split('"')[0], 99),
            p["price"],
        )

    products.sort(key=sort_key)

    # TS-вывод
    def esc(s: str) -> str:
        if s is None:
            return ""
        return (s.replace("\\", "\\\\")
                 .replace('"', '\\"')
                 .replace("\r", "\\r")
                 .replace("\t", "\\t")
                 .replace("\n", "\\n"))

    lines = [
        "/* AUTO-GENERATED by scripts/import-biggeek-macbooks.py — не править вручную.",
        "   Данные и картинки взяты с biggeek.ru. Запусти скрипт снова, чтобы обновить. */",
        "",
        'import type { Product } from "./data";',
        "",
        "export const BIGGEEK_MACBOOKS: Product[] = [",
    ]
    for p in products:
        img_arr = "[" + ", ".join(f'"{i}"' for i in p["imgs"]) + "]" if p["imgs"] else "[]"
        col_arr = "[" + ", ".join(f'"{esc(c)}"' for c in p["colors"]) + "]"
        mem_arr = "[" + ", ".join(f'"{esc(m)}"' for m in p["memories"]) + "]"
        spec_items = ", ".join(
            f'{{key:"{esc(s["key"])}",val:"{esc(s["val"])}",group:"{esc(s.get("group") or "Прочее")}"}}'
            for s in p["specs"]
        )
        var_items = ", ".join(
            f'{{ram:"{esc(v["ram"])}",ssd:"{esc(v["ssd"])}",color:"{esc(v["color"])}",'
            f'price:{v["price"]},img:"{v["img"]}"}}'
            for v in p["variants"]
        )
        lines.append(
            f'  {{ id:"{p["id"]}", name:"{esc(p["name"])}", slug:"{p["slug"]}",'
            f' category:"{p["category"]}", brand:"{p["brand"]}",'
            f' price:{p["price"]}, year:{p["year"]}, emoji:"{p["emoji"]}",'
            f' img:{img_arr}, memories:{mem_arr}, colors:{col_arr},'
            f' inStock:true, rating:5, reviewCount:0,'
            f' description:"{esc(p["description"])}",'
            f' specs:[{spec_items}], variants:[{var_items}] }},'
        )
    lines.append("];")
    OUT_TS.write_text("\n".join(lines) + "\n")
    print(f"📝 Wrote {OUT_TS}  ({len(products)} конфигураций)")


if __name__ == "__main__":
    main()
