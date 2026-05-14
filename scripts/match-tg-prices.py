#!/usr/bin/env python3
"""
Матчит цены из TG-канала (вручную набранный список) на наш каталог.
Берёт max-of-colors по (model, memory), добавляет +1000₽, выводит
lib/tg-prices.ts с override-картой id→цена.

Запуск: python3 scripts/match-tg-prices.py
"""
import re
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent
DATA_TS = ROOT / "lib" / "data.ts"
BIG_TS  = ROOT / "lib" / "biggeek-products.ts"
OUT_TS  = ROOT / "lib" / "tg-prices.ts"

MARKUP = 1000  # +1000₽ к каждой TG-цене

# ─── 1. TG-данные (model_key, memory, price). model_key — нормализованный. ───

# (key, price) — где key = "{brand}|{model}|{memory}".
# Несколько цветов одного SKU свернутся через max при загрузке.
TG_RAW = [
    # ── iPhone ──
    ("Apple|iPhone 13|128 ГБ",            43500),
    ("Apple|iPhone 14|256 ГБ",            49000),
    ("Apple|iPhone 15|128 ГБ",            49500),
    ("Apple|iPhone 15|128 ГБ",            49000),
    ("Apple|iPhone 15|256 ГБ",            57000),
    ("Apple|iPhone 16|128 ГБ",            54500),
    ("Apple|iPhone 16|128 ГБ",            55000),
    ("Apple|iPhone 16|128 ГБ",            54400),
    ("Apple|iPhone 16|128 ГБ",            54700),
    ("Apple|iPhone 16|256 ГБ",            61500),
    ("Apple|iPhone 16 Plus|256 ГБ",       67900),
    ("Apple|iPhone 16e|128 ГБ",           45000),
    ("Apple|iPhone 16 Pro Max|256 ГБ",    98000),
    ("Apple|iPhone 16 Pro Max|256 ГБ",    91500),
    ("Apple|iPhone 16 Pro Max|256 ГБ",    98500),
    ("Apple|iPhone 16 Pro Max|512 ГБ",   108000),
    ("Apple|iPhone Air|256 ГБ",           73500),
    ("Apple|iPhone Air|256 ГБ",           72500),
    ("Apple|iPhone Air|256 ГБ",           71500),
    ("Apple|iPhone Air|512 ГБ",           83000),
    ("Apple|iPhone Air|1 ТБ",            102000),
    ("Apple|iPhone 17e|256 ГБ",           52000),
    ("Apple|iPhone 17e|256 ГБ",           51400),
    ("Apple|iPhone 17|256 ГБ",            66500),
    ("Apple|iPhone 17|256 ГБ",            65900),
    ("Apple|iPhone 17|512 ГБ",            82500),
    ("Apple|iPhone 17 Pro|256 ГБ",       102500),
    ("Apple|iPhone 17 Pro|256 ГБ",       100000),
    ("Apple|iPhone 17 Pro|256 ГБ",       100900),
    ("Apple|iPhone 17 Pro|512 ГБ",       119500),
    ("Apple|iPhone 17 Pro|1 ТБ",         135000),
    ("Apple|iPhone 17 Pro Max|256 ГБ",   112500),
    ("Apple|iPhone 17 Pro Max|256 ГБ",   111500),
    ("Apple|iPhone 17 Pro Max|256 ГБ",   109500),
    ("Apple|iPhone 17 Pro Max|512 ГБ",   134500),
    ("Apple|iPhone 17 Pro Max|512 ГБ",   132900),
    ("Apple|iPhone 17 Pro Max|1 ТБ",     146500),
    ("Apple|iPhone 17 Pro Max|2 ТБ",     174000),

    # ── Apple Watch ──
    ("Apple|Apple Watch SE 3|44 мм",      28500),
    ("Apple|Apple Watch Series 10|46 мм", 27000),
    ("Apple|Apple Watch Series 11|42 мм", 34500),
    ("Apple|Apple Watch Series 11|46 мм", 38500),
    ("Apple|Apple Watch Ultra 2|49 мм",   68500),
    ("Apple|Apple Watch Ultra 3|49 мм",   69500),

    # ── AirPods ──
    ("Apple|AirPods Max|нет",             43700),    # max USB-C
    ("Apple|AirPods 4 ANC|нет",           14600),
    ("Apple|AirPods 4|нет",               10300),
    ("Apple|AirPods Pro 2|нет",           16500),

    # ── MacBook ──
    # NB: TG-канал указывает M3 8/512 и M3 15" 16/256 — у нас в каталоге
    # биггиковские M3 только 8/256, конфигурации не совпадают, не матчим.
    ("Apple|MacBook Air 13 M4|256 ГБ",    85500),    # max(84500, 85500) — нет в каталоге

    # ── iPad ──
    ("Apple|iPad Air 11 M2|128 ГБ Wi-Fi", 48200),
    ("Apple|iPad Air 11 M2|256 ГБ Wi-Fi", 58000),
    ("Apple|iPad Air 13 M3|128 ГБ Wi-Fi", 72500),
    ("Apple|iPad Pro 13|256 ГБ Cellular", 99000),
]


# ─── 2. Сворачиваем по ключу — max — и добавляем markup ─────────────────────

agg: dict = {}
for key, price in TG_RAW:
    agg[key] = max(agg.get(key, 0), price)
agg = {k: v + MARKUP for k, v in agg.items()}
print(f"уникальных моделей в TG: {len(agg)}")


# ─── 3. Загружаем наши SKU из data.ts и biggeek-products.ts ─────────────────

data_text = DATA_TS.read_text()
big_text  = BIG_TS.read_text()

# Парсим PHONES_CATALOG записи (формат: id, brand, model, memory, sim, price)
phone_re = re.compile(
    r'\{\s*id:\s*"([^"]+)",\s*brand:\s*"([^"]+)",\s*model:\s*"([^"]+)",'
    r'\s*memory:\s*"([^"]+)",\s*sim:\s*"([^"]+)",\s*price:\s*(\d+)',
    re.DOTALL
)
phones = [
    {"id": m[0], "brand": m[1], "model": m[2], "memory": m[3], "sim": m[4],
     "price": int(m[5])}
    for m in phone_re.findall(data_text)
]
print(f"PHONES_CATALOG: {len(phones)} SKU")

# Парсим biggeek-продукты (для AirPods/Watch/MacBook/iPad)
big_re = re.compile(
    r'\{\s*id:"([^"]+)",\s*name:"([^"]+)",[^}]*?category:"([^"]+)",'
    r'\s*brand:"([^"]+)",\s*price:(\d+)'
)
bigs = [
    {"id": m[0], "name": m[1], "category": m[2], "brand": m[3], "price": int(m[4])}
    for m in big_re.findall(big_text)
]
print(f"BIGGEEK: {len(bigs)} SKU")


# ─── 4. Матчер ───────────────────────────────────────────────────────────────

overrides: dict = {}        # id -> price (final, with markup)
matched_keys: set = set()   # какие TG-ключи нашли матч

def match_phones():
    """iPhone в PHONES_CATALOG: { brand, model, memory, sim }. TG-key=brand|model|memory."""
    for p in phones:
        key = f"{p['brand']}|{p['model']}|{p['memory']}"
        if key in agg:
            overrides[p["id"]] = agg[key]
            matched_keys.add(key)


def match_watches():
    """Apple Watch с biggeek: name содержит модель и диаметр."""
    for p in bigs:
        if p["category"] != "smart_chasy" or p["brand"] != "Apple":
            continue
        # Достаём диагональ и серию из name типа "Часы Apple Watch SE 3, 44 мм"
        m_sz = re.search(r"(\d{2})\s*мм", p["name"])
        if not m_sz: continue
        size = f"{m_sz.group(1)} мм"
        # Серия / тип
        n = p["name"].lower()
        if "ultra 3" in n:    model = "Apple Watch Ultra 3"
        elif "ultra 2" in n:  model = "Apple Watch Ultra 2"
        elif "series 11" in n: model = "Apple Watch Series 11"
        elif "series 10" in n: model = "Apple Watch Series 10"
        elif "se 3" in n:     model = "Apple Watch SE 3"
        elif "se" in n:       model = "Apple Watch SE"
        else: continue
        key = f"Apple|{model}|{size}"
        if key in agg:
            overrides[p["id"]] = agg[key]
            matched_keys.add(key)


def match_airpods():
    """AirPods через biggeek/data — мы знаем только airpods-max2 в lib/data.ts.
    Остальные AirPods через ID-pattern в data.ts."""
    for line in data_text.splitlines():
        m = re.search(r'id:"(airpods-[a-z0-9]+)"[^,]*,\s*name:"([^"]+)"', line)
        if not m: continue
        pid, name = m.group(1), m.group(2)
        n = name.lower()
        if "max"   in n and "AirPods Max"    in agg.get("dummy", {}):  pass
        # ключ — точный
        ap_key = None
        if "max"            in n: ap_key = "Apple|AirPods Max|нет"
        elif "pro 3"        in n: continue           # не было в TG
        elif "pro 2"        in n: ap_key = "Apple|AirPods Pro 2|нет"
        elif "anc"          in n or "активным шумоподавлением" in n:
            ap_key = "Apple|AirPods 4 ANC|нет"
        elif "airpods 4"    in n: ap_key = "Apple|AirPods 4|нет"
        elif "airpods 3"    in n: ap_key = "Apple|AirPods 3|нет"
        if ap_key and ap_key in agg:
            overrides[pid] = agg[ap_key]
            matched_keys.add(ap_key)


def match_macbooks():
    """Биггиковские MacBook: name = 'Ноутбук Apple MacBook Air 13″' и т.п.
    Считаем что m3/m4 определяем по slug."""
    for p in bigs:
        if p["category"] != "noutbuki": continue
        n = p["name"].lower()
        slug = p["id"].lower()
        chip = None
        if "m5" in slug: chip = "M5"
        elif "m4" in slug: chip = "M4"
        elif "m3" in slug: chip = "M3"
        elif "m2" in slug: chip = "M2"
        elif "m1" in slug: chip = "M1"
        else: continue
        if "macbook air 13" in n:    model = f"MacBook Air 13 {chip}"
        elif "macbook air 15" in n:  model = f"MacBook Air 15 {chip}"
        elif "macbook pro 14" in n:  model = f"MacBook Pro 14 {chip}"
        elif "macbook pro 16" in n:  model = f"MacBook Pro 16 {chip}"
        else: continue
        # memory из slug (256/512/1tb)
        if "256gb" in slug or "256-gb" in slug:  mem = "256 ГБ"
        elif "512gb" in slug or "512-gb" in slug: mem = "512 ГБ"
        elif "1tb" in slug:                       mem = "1 ТБ"
        else: continue
        key = f"Apple|{model}|{mem}"
        if key in agg:
            overrides[p["id"]] = agg[key]
            matched_keys.add(key)


def match_ipads():
    """Биггиковские iPad: name='Планшет Apple iPad Air 11, 128 ГБ, Wi-Fi'."""
    for p in bigs:
        if p["category"] != "planshety": continue
        n = p["name"]
        # Модель
        if "iPad Pro 13" in n:   base = "iPad Pro 13"
        elif "iPad Pro 11" in n: base = "iPad Pro 11"
        elif "iPad Air 13" in n: base = "iPad Air 13 M3"      # все 13"-Air в каталоге это M3
        elif "iPad Air 11" in n: base = "iPad Air 11 M2"
        elif "iPad mini"   in n: base = "iPad mini"
        elif "iPad 11"     in n: base = "iPad 11"
        else: continue
        # Память
        mem = ""
        m = re.search(r"(\d{3})\s*ГБ", n)
        if m: mem = f"{m.group(1)} ГБ"
        else:
            m = re.search(r"(\d)\s*ТБ", n)
            if m: mem = f"{m.group(1)} ТБ"
        # Wi-Fi / Cellular
        if "Wi-Fi + Cellular" in n: net = "Cellular"
        else: net = "Wi-Fi"
        key = f"Apple|{base}|{mem} {net}"
        if key in agg:
            overrides[p["id"]] = agg[key]
            matched_keys.add(key)


match_phones()
match_watches()
match_airpods()
match_macbooks()
match_ipads()

print(f"\n=== матч {len(overrides)} SKU ===")
unmatched = sorted(set(agg.keys()) - matched_keys)
if unmatched:
    print(f"\n=== ключи TG БЕЗ матча ({len(unmatched)}): ===")
    for k in unmatched:
        print(f"  {k}  →  ≈{agg[k]:,}₽")


# ─── 5. Пишем lib/tg-prices.ts ───────────────────────────────────────────────

ts_lines = [
    "/* lib/tg-prices.ts — AUTO-GENERATED by scripts/match-tg-prices.py",
    " * Цены подобраны по партнёрскому TG-каналу @mistore095.",
    " * Markup: +1000₽ к каждой. Max-of-colors внутри одной модели/памяти. */",
    "",
    "export const TG_PRICES: Record<string, number> = {",
]
for pid, price in sorted(overrides.items()):
    ts_lines.append(f'  "{pid}": {price},')
ts_lines.append("};")
OUT_TS.write_text("\n".join(ts_lines) + "\n")
print(f"\n📝 wrote {OUT_TS}")
