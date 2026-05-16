#!/usr/bin/env python3
"""
fetch-mistore-prices.py
─────────────────────────────────────────────────────────────────────────────
Phase 1 фундамент: автоматически тянет цены из публичного канала @mistore095,
парсит строки, матчит к нашему каталогу, обновляет lib/tg-prices.ts.

Запуск: python3 scripts/fetch-mistore-prices.py
Конфиг — список POST_IDS ниже. По мере появления новых постов от партнёра
просто добавь сюда ID — остальное автоматически.

Зачем не TS: переиспользуем матчер из match-tg-prices.py (тот же стиль regex
парсинга data.ts / biggeek-products.ts). В Phase 2 портируем в API-endpoint.
"""
from __future__ import annotations
import re, sys, html, urllib.request
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent
DATA_TS = ROOT / "lib" / "data.ts"
BIG_TS  = ROOT / "lib" / "biggeek-products.ts"
ADD_TS  = ROOT / "lib" / "tg-additions.ts"
OUT_TS  = ROOT / "lib" / "tg-prices.ts"

# Markup к каждой TG-цене (₽) — наша наценка партнёра
MARKUP = 1000

# Список постов канала @mistore095 для парсинга.
# Получить ID: Telegram → пост → Copy Link → последний сегмент URL.
POST_IDS = [1203, 1207, 1103, 1104, 1105, 1106, 1107, 1108, 1112]
CHANNEL  = "mistore095"


# ═══════════════════════════════════════════════════════════════════════════
# 1. Fetch & extract — публичная веб-версия Telegram-канала
# ═══════════════════════════════════════════════════════════════════════════

def fetch_post_text(post_id: int) -> str:
    """Получает текст поста по ID. Возвращает '' если не удалось."""
    url = f"https://t.me/{CHANNEL}/{post_id}?embed=1&mode=tme"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15) as r:
        raw = r.read().decode("utf-8", errors="replace")
    m = re.search(
        r'<div class="tgme_widget_message_text[^"]*"[^>]*>(.*?)</div>',
        raw, re.S,
    )
    if not m:
        return ""
    txt = re.sub(r"<br/?>", "\n", m.group(1))
    txt = re.sub(r"<[^>]+>", "", txt)
    return html.unescape(txt)


# ═══════════════════════════════════════════════════════════════════════════
# 2. Parser — превращает строки постов в (raw_name, price)
# ═══════════════════════════════════════════════════════════════════════════

# Цена: 5-6 цифр (с возможным пробелом-разделителем тысяч), в конце строки.
# Разделитель имени и цены: -, –, —, ─, либо комбинации с пробелами и тире.
PRICE_LINE = re.compile(
    r"^(?P<name>.+?)\s*[-–—─]\s*(?P<price>\d{1,3}(?:[  ]?\d{3})+|\d{4,6})"
    r"(?:[,\.]00)?\s*$"
)

# Заголовки секций / категорий — пропускаем
HEADER_HINTS = (
    "APPLE", "SAMSUNG", "GALAXY", "XIAOMI", "POCO", "REDMI", "ONEPLUS",
    "OPPO", "REALMI", "REALME", "NOTHING", "HONOR", "HUAWEI", "GOOGLE",
    "ASUS", "Red Magic", "Наушники", "СМАРТ ЧАСЫ", "Планшеты", "Ноутбуки",
    "ИГРОВЫЕ", "MacBook", "iPad", "Watch", "OnePlus Watch", "Garmin",
    "Amazfit", "OPPO RENO", "ONEPLUS / REALME",
)

def parse_post(text: str) -> list[tuple[str, int]]:
    """Извлекает (raw_name, price). Все цены — int (рубли)."""
    items: list[tuple[str, int]] = []
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("📱") or line.startswith("🎧"):
            line = re.sub(r"^[^\w]+", "", line)  # снять emoji в начале
        if not line:
            continue
        m = PRICE_LINE.match(line)
        if not m:
            continue
        name = m.group("name").strip(" -–—─\t")
        price_raw = m.group("price").replace(" ", "").replace(" ", "")
        try:
            price = int(price_raw)
        except ValueError:
            continue
        # Фильтр: цены меньше 1000₽ — почти наверняка мусор (или артефакт парсинга)
        if price < 1000:
            continue
        items.append((name, price))
    return items


# ═══════════════════════════════════════════════════════════════════════════
# 3. Нормализатор — превращает raw_name в ключ "Brand|Model|Memory"
# ═══════════════════════════════════════════════════════════════════════════

def normalize_iphone(raw: str) -> tuple[str, str] | None:
    """Возвращает ('Apple|iPhone 16 Pro Max', '256 ГБ') или None."""
    s = raw.replace("—", "-").replace("–", "-")
    # Память
    mem = None
    m = re.search(r"\b(\d+)\s*(?:GB|gb|ГБ)\b", s)
    if m: mem = f"{m.group(1)} ГБ"
    if not mem:
        m = re.search(r"\b(\d+)\s*(?:TB|tb|ТБ|ТB)\b", s)
        if m: mem = f"{m.group(1)} ТБ"
    if not mem:
        # Просто 128 / 256 / 512 / 1024 в строке (без явного GB)
        m = re.search(r"\b(128|256|512)\b", s)
        if m: mem = f"{m.group(1)} ГБ"
        else:
            m = re.search(r"\b1\s*TB\b|\b1TB\b|\b1\s*ТБ\b|\b1ТБ\b|\b1024\b", s, re.I)
            if m: mem = "1 ТБ"
            else:
                m = re.search(r"\b2\s*TB\b|\b2TB\b|\b2\s*ТБ\b|\b2ТБ\b", s, re.I)
                if m: mem = "2 ТБ"
    if not mem: return None

    sl = s.lower()
    # Проверяем e-варианты строго: «iphone 17e» / «iphone 16e» (с пробелом + e)
    has_17e = bool(re.search(r"\biphone\s*17e\b", sl))
    has_16e = bool(re.search(r"\biphone\s*16e\b", sl))
    if "17 pro max" in sl: model = "iPhone 17 Pro Max"
    elif "17 pro"   in sl: model = "iPhone 17 Pro"
    elif has_17e:          model = "iPhone 17e"
    elif "17"       in sl and "pro" not in sl:
        model = "iPhone 17"
    elif "iphone air" in sl or sl.startswith("air"): model = "iPhone Air"
    elif "16 pro max" in sl: model = "iPhone 16 Pro Max"
    elif "16 pro"     in sl: model = "iPhone 16 Pro"
    elif has_16e:          model = "iPhone 16e"
    elif "16 +" in sl or "16+" in sl or "16 plus" in sl: model = "iPhone 16 Plus"
    elif "16"         in sl: model = "iPhone 16"
    elif "15 pro max" in sl: model = "iPhone 15 Pro Max"
    elif "15 pro"     in sl: model = "iPhone 15 Pro"
    elif "15"         in sl: model = "iPhone 15"
    elif "14 pro max" in sl: model = "iPhone 14 Pro Max"
    elif "14 pro"     in sl: model = "iPhone 14 Pro"
    elif "14"         in sl: model = "iPhone 14"
    elif "13"         in sl: model = "iPhone 13"
    else: return None

    return (f"Apple|{model}", mem)


def normalize_apple_watch(raw: str) -> tuple[str, str] | None:
    """'Watch SE 3 44mm Midnight 2025' → ('Apple|Apple Watch SE 3', '44 мм')."""
    s = raw.replace("мм", "мм")
    m = re.search(r"\b(\d{2})\s*(?:mm|мм)\b", s, re.I)
    if not m: return None
    size = f"{m.group(1)} мм"
    sl = s.lower()
    if "ultra 3" in sl:      model = "Apple Watch Ultra 3"
    elif "ultra 2" in sl:    model = "Apple Watch Ultra 2"
    elif "ultra"   in sl:    model = "Apple Watch Ultra"
    elif "se 3"    in sl:    model = "Apple Watch SE 3"
    elif "watch se" in sl:   model = "Apple Watch SE"
    elif "s10"     in sl or "series 10" in sl: model = "Apple Watch Series 10"
    elif "11"      in sl:    model = "Apple Watch Series 11"
    else: return None
    return (f"Apple|{model}", size)


def normalize_airpods(raw: str) -> str | None:
    """Возвращает ключ 'Apple|AirPods X|нет' или None."""
    sl = raw.lower().replace(" ", "")
    if "max"    in sl: return "Apple|AirPods Max|нет"
    if "pro3"   in sl: return "Apple|AirPods Pro 3|нет"
    if "pro2"   in sl: return "Apple|AirPods Pro 2|нет"
    if "pro"    in sl: return "Apple|AirPods Pro 2|нет"   # fallback
    if "anc"    in sl: return "Apple|AirPods 4 ANC|нет"
    if "airpods4" in sl or "airpod4" in sl: return "Apple|AirPods 4|нет"
    if "airpods3" in sl: return "Apple|AirPods 3|нет"
    return None


def normalize_ipad(raw: str) -> tuple[str, str] | None:
    """iPad parsing → ('Apple|iPad ...', 'XXX ГБ Wi-Fi|Cellular')."""
    sl = raw.lower()
    # Память
    m = re.search(r"\b(128|256|512|1024)\b", sl)
    if m:
        v = int(m.group(1))
        mem = "1 ТБ" if v == 1024 else f"{v} ГБ"
    else:
        m = re.search(r"\b1\s*tb\b", sl)
        if m: mem = "1 ТБ"
        else: return None
    # Wi-Fi / Cellular
    net = "Cellular" if ("lte" in sl or "cellular" in sl or "4g" in sl or "5g" in sl) else "Wi-Fi"

    if "ipad pro 13" in sl:   base = "iPad Pro 13"
    elif "ipad pro 11" in sl: base = "iPad Pro 11"
    elif "ipad air 13" in sl: base = "iPad Air 13 M3"
    elif "ipad air 11" in sl: base = "iPad Air 11 M2"
    elif "ipad a16"    in sl: base = "iPad 11"     # iPad A16 — это наш iPad 11
    elif "ipad mini"   in sl: base = "iPad mini"
    else: return None
    return (f"Apple|{base}", f"{mem} {net}")


def normalize_macbook(raw: str) -> tuple[str, str] | None:
    sl = raw.lower()
    chip = None
    for c in ("m5", "m4", "m3", "m2", "m1"):
        if re.search(rf"\b{c}\b", sl):
            chip = c.upper(); break
    if not chip: return None
    if "macbook air 13" in sl:    model = f"MacBook Air 13 {chip}"
    elif "macbook air 15" in sl:  model = f"MacBook Air 15 {chip}"
    elif "macbook pro 14" in sl:  model = f"MacBook Pro 14 {chip}"
    elif "macbook pro 16" in sl:  model = f"MacBook Pro 16 {chip}"
    else: return None
    # Память: 256 / 512 / 1 TB
    if "/1 tb" in sl or "/1tb" in sl: mem = "1 ТБ"
    elif "/512" in sl: mem = "512 ГБ"
    elif "/256" in sl: mem = "256 ГБ"
    else: return None
    return (f"Apple|{model}", mem)


def make_keys(items: list[tuple[str, int]]) -> dict[str, int]:
    """raw → нормализованные ключи `brand|model|memory` → max цена."""
    agg: dict[str, int] = {}
    unmatched: list[tuple[str, int]] = []
    for raw, price in items:
        key = None
        rl = raw.lower()
        if "iphone" in rl:
            r = normalize_iphone(raw)
            if r: key = f"{r[0]}|{r[1]}"
        elif "watch" in rl and ("apple" not in rl or "watch" in rl):
            # Apple Watch
            if any(w in rl for w in ("se ", "ultra", "series", "s10", "watch s", "11")) and \
               not any(w in rl for w in ("samsung", "galaxy", "huawei", "oneplus", "honor", "garmin", "amazfit", "nothing")):
                r = normalize_apple_watch(raw)
                if r: key = f"{r[0]}|{r[1]}"
        elif "air pod" in rl or "airpod" in rl:
            key = normalize_airpods(raw)
        elif "ipad" in rl:
            r = normalize_ipad(raw)
            if r: key = f"{r[0]}|{r[1]}"
        elif "macbook" in rl:
            r = normalize_macbook(raw)
            if r: key = f"{r[0]}|{r[1]}"
        if key:
            agg[key] = max(agg.get(key, 0), price)
        else:
            unmatched.append((raw, price))
    return agg, unmatched


# ═══════════════════════════════════════════════════════════════════════════
# 4. Парсинг текущего каталога (тот же стиль что в match-tg-prices.py)
# ═══════════════════════════════════════════════════════════════════════════

def load_catalog() -> tuple[list[dict], list[dict]]:
    data_text = DATA_TS.read_text()
    big_text  = BIG_TS.read_text()
    phone_re = re.compile(
        r'\{\s*id:\s*"([^"]+)",\s*brand:\s*"([^"]+)",\s*model:\s*"([^"]+)",'
        r'\s*memory:\s*"([^"]+)",\s*sim:\s*"([^"]+)",\s*price:\s*(\d+)',
        re.DOTALL,
    )
    phones = [
        {"id": m[0], "brand": m[1], "model": m[2], "memory": m[3],
         "sim": m[4], "price": int(m[5])}
        for m in phone_re.findall(data_text)
    ]
    big_re = re.compile(
        r'\{\s*id:"([^"]+)",\s*name:"([^"]+)",[^}]*?category:"([^"]+)",'
        r'\s*brand:"([^"]+)",\s*price:(\d+)'
    )
    bigs = [
        {"id": m[0], "name": m[1], "category": m[2], "brand": m[3],
         "price": int(m[4])}
        for m in big_re.findall(big_text)
    ]
    return phones, bigs


# ═══════════════════════════════════════════════════════════════════════════
# 5. Матчер каталога к ключам TG (повторяет логику match-tg-prices.py)
# ═══════════════════════════════════════════════════════════════════════════

def match_catalog(agg: dict[str, int], phones: list[dict], bigs: list[dict]):
    overrides: dict[str, int] = {}
    matched: set[str] = set()

    # Phones по точному ключу brand|model|memory
    for p in phones:
        key = f"{p['brand']}|{p['model']}|{p['memory']}"
        if key in agg:
            overrides[p["id"]] = agg[key] + MARKUP
            matched.add(key)

    # TG-новинки (iPhone 16e/17e и т.п.) в tg-additions.ts
    if ADD_TS.exists():
        add_text = ADD_TS.read_text()
        # Парсим PhoneItem из TG_NEW_PHONES
        for block in re.finditer(
            r'id:\s*"([^"]+)",[^}]*?brand:\s*"([^"]+)",[^}]*?'
            r'model:\s*"([^"]+)",[^}]*?memory:\s*"([^"]+)"',
            add_text, re.DOTALL,
        ):
            pid, brand, model, mem = block.groups()
            key = f"{brand}|{model}|{mem}"
            # Алиасы: канал пишет iPhone 16E, а в каталоге iPhone 16e
            for alias in (key, key.replace("16e", "16E"), key.replace("17e", "17E")):
                if alias in agg:
                    overrides[pid] = agg[alias] + MARKUP
                    matched.add(alias)
                    break

    # Watches из biggeek
    for p in bigs:
        if p["category"] != "smart_chasy" or p["brand"] != "Apple": continue
        m_sz = re.search(r"(\d{2})\s*мм", p["name"])
        if not m_sz: continue
        size = f"{m_sz.group(1)} мм"
        n = p["name"].lower()
        if "ultra 3"   in n: model = "Apple Watch Ultra 3"
        elif "ultra 2" in n: model = "Apple Watch Ultra 2"
        elif "series 11" in n: model = "Apple Watch Series 11"
        elif "series 10" in n: model = "Apple Watch Series 10"
        elif "se 3"    in n: model = "Apple Watch SE 3"
        elif "se"      in n: model = "Apple Watch SE"
        else: continue
        key = f"Apple|{model}|{size}"
        if key in agg:
            overrides[p["id"]] = agg[key] + MARKUP
            matched.add(key)

    # AirPods — id-pattern в data.ts
    data_text = DATA_TS.read_text()
    for line in data_text.splitlines():
        m = re.search(r'id:"(airpods-?[a-z0-9-]+)"[^,]*,\s*name:"([^"]+)"', line)
        if not m: continue
        pid, name = m.group(1), m.group(2)
        n = name.lower()
        ap_key = None
        if "max"   in n: ap_key = "Apple|AirPods Max|нет"
        elif "pro 3" in n: ap_key = "Apple|AirPods Pro 3|нет"
        elif "pro 2" in n: ap_key = "Apple|AirPods Pro 2|нет"
        elif "anc"   in n or "активным шумоподавлением" in n:
            ap_key = "Apple|AirPods 4 ANC|нет"
        elif "airpods 4" in n: ap_key = "Apple|AirPods 4|нет"
        elif "airpods 3" in n: ap_key = "Apple|AirPods 3|нет"
        if ap_key and ap_key in agg:
            overrides[pid] = agg[ap_key] + MARKUP
            matched.add(ap_key)

    # MacBook
    for p in bigs:
        if p["category"] != "noutbuki": continue
        n = p["name"].lower()
        slug = p["id"].lower()
        chip = None
        for c in ("m5", "m4", "m3", "m2", "m1"):
            if c in slug: chip = c.upper(); break
        if not chip: continue
        if "macbook air 13"   in n: model = f"MacBook Air 13 {chip}"
        elif "macbook air 15" in n: model = f"MacBook Air 15 {chip}"
        elif "macbook pro 14" in n: model = f"MacBook Pro 14 {chip}"
        elif "macbook pro 16" in n: model = f"MacBook Pro 16 {chip}"
        else: continue
        if "256gb" in slug or "256-gb" in slug: mem = "256 ГБ"
        elif "512gb" in slug or "512-gb" in slug: mem = "512 ГБ"
        elif "1tb" in slug:                       mem = "1 ТБ"
        else: continue
        key = f"Apple|{model}|{mem}"
        if key in agg:
            overrides[p["id"]] = agg[key] + MARKUP
            matched.add(key)

    # iPad
    for p in bigs:
        if p["category"] != "planshety": continue
        n = p["name"]
        if "iPad Pro 13"   in n: base = "iPad Pro 13"
        elif "iPad Pro 11" in n: base = "iPad Pro 11"
        elif "iPad Air 13" in n: base = "iPad Air 13 M3"
        elif "iPad Air 11" in n: base = "iPad Air 11 M2"
        elif "iPad mini"   in n: base = "iPad mini"
        elif "iPad 11"     in n: base = "iPad 11"
        else: continue
        mem = ""
        m = re.search(r"(\d{3})\s*ГБ", n)
        if m: mem = f"{m.group(1)} ГБ"
        else:
            m = re.search(r"(\d)\s*ТБ", n)
            if m: mem = f"{m.group(1)} ТБ"
        net = "Cellular" if "Wi-Fi + Cellular" in n else "Wi-Fi"
        key = f"Apple|{base}|{mem} {net}"
        if key in agg:
            overrides[p["id"]] = agg[key] + MARKUP
            matched.add(key)

    return overrides, matched


# ═══════════════════════════════════════════════════════════════════════════
# 6. Запись lib/tg-prices.ts (с diff vs предыдущей версии)
# ═══════════════════════════════════════════════════════════════════════════

def load_old_prices() -> dict[str, int]:
    if not OUT_TS.exists(): return {}
    txt = OUT_TS.read_text()
    return {m[0]: int(m[1]) for m in re.findall(r'"([^"]+)":\s*(\d+)', txt)}


def write_prices(overrides: dict[str, int]):
    lines = [
        "/* lib/tg-prices.ts — AUTO-GENERATED by scripts/fetch-mistore-prices.py",
        " * Цены подтянуты автоматически из публичного TG-канала @mistore095.",
        " * Markup: +1000₽ к каждой. Max-of-colors внутри одной модели/памяти. */",
        "",
        "export const TG_PRICES: Record<string, number> = {",
    ]
    for pid, price in sorted(overrides.items()):
        lines.append(f'  "{pid}": {price},')
    lines.append("};")
    OUT_TS.write_text("\n".join(lines) + "\n")


# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

def main():
    print(f"→ Загружаю {len(POST_IDS)} постов из @{CHANNEL}…")
    all_items: list[tuple[str, int]] = []
    for pid in POST_IDS:
        try:
            text = fetch_post_text(pid)
        except Exception as e:
            print(f"  ⚠️  пост {pid}: {e}")
            continue
        items = parse_post(text)
        print(f"  пост {pid}: {len(items)} строк с ценой")
        all_items.extend(items)

    agg, unmatched_lines = make_keys(all_items)
    print(f"\n→ Нормализовано в {len(agg)} уникальных ключей "
          f"(brand|model|memory)")

    phones, bigs = load_catalog()
    print(f"→ Каталог: {len(phones)} телефонов + {len(bigs)} biggeek-SKU")

    overrides, matched_keys = match_catalog(agg, phones, bigs)
    print(f"→ Матч найден для {len(overrides)} SKU "
          f"({len(matched_keys)} TG-ключей)")

    # Diff vs текущий tg-prices.ts
    old = load_old_prices()
    added   = sorted(set(overrides) - set(old))
    removed = sorted(set(old) - set(overrides))
    changed = sorted([k for k in overrides if k in old and overrides[k] != old[k]])

    if added:
        print(f"\n  + Новых SKU: {len(added)}")
        for k in added[:15]: print(f"      + {k}: {overrides[k]:,}₽")
        if len(added) > 15: print(f"      … и ещё {len(added) - 15}")
    if removed:
        print(f"\n  - Убрано SKU: {len(removed)}")
        for k in removed[:15]: print(f"      - {k} (был {old[k]:,}₽)")
    if changed:
        print(f"\n  ~ Изменилось цен: {len(changed)}")
        for k in changed[:30]:
            print(f"      ~ {k}: {old[k]:,}₽ → {overrides[k]:,}₽ "
                  f"({overrides[k] - old[k]:+,}₽)")
        if len(changed) > 30: print(f"      … и ещё {len(changed) - 30}")

    # Какие TG-ключи остались без матча
    unmatched_keys = sorted(set(agg.keys()) - matched_keys)
    if unmatched_keys:
        print(f"\n⚠️  TG-ключи БЕЗ матча в нашем каталоге ({len(unmatched_keys)}):")
        for k in unmatched_keys[:30]:
            print(f"      {k}  ≈{agg[k]:,}₽")
        if len(unmatched_keys) > 30:
            print(f"      … и ещё {len(unmatched_keys) - 30}")

    if unmatched_lines:
        print(f"\nℹ️  Строки канала, которые НЕ удалось нормализовать "
              f"({len(unmatched_lines)}):")
        for raw, price in unmatched_lines[:20]:
            print(f"      «{raw[:60]}»  →  {price:,}₽")
        if len(unmatched_lines) > 20:
            print(f"      … и ещё {len(unmatched_lines) - 20} (Samsung/Xiaomi/etc — пока не парсим)")

    write_prices(overrides)
    print(f"\n📝 Записано {OUT_TS} ({len(overrides)} цен)")


if __name__ == "__main__":
    main()
