#!/usr/bin/env python3
"""
scripts/dedupe-biggeek.py

Дедуп сырого выгруза BIGGEEK_PRODUCTS (~669 SKU) по МОДЕЛИ (без цвета и
SKU-кодов). Картинки всех цветовых вариантов собираются в массив img: [...].

Результат: 1 продукт = 1 модель/конфиг, со слайдшоу всех цветов.
"""
import re
import html
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PATH = ROOT / "lib" / "biggeek-products.ts"

content = PATH.read_text()
rows = re.findall(
    r'\{ id:"([^"]+)", name:"([^"]+)", slug:"([^"]+)", category:"([^"]+)", '
    r'brand:"([^"]+)", price:(\d+), emoji:"([^"]+)", img:"([^"]+)"',
    content,
)
print(f"parsed: {len(rows)}")


# Цвета — все формы, что попадаются в названиях biggeek
COLOR_TOKENS = [
    # Apple iPhone-стиль (на всякий случай)
    r"чёрный", r"черный", r"белый", r"серебристый", r"silver", r"space\s*black",
    r"чёрный\s*космос", r"серый\s*космос", r"space\s*gray", r"space\s*grey",
    r"тёмная\s*ночь", r"midnight", r"сияющая\s*звезда", r"starlight",
    r"тёмный\s*шторм", r"storm\s*blue",
    r"голубой", r"blue", r"синий", r"deep\s*blue", r"pacific\s*blue",
    r"фиолетовый", r"purple", r"розовый", r"pink",
    r"оранжевый", r"orange", r"жёлтый", r"желтый", r"yellow",
    r"зелёный", r"зеленый", r"green", r"красный", r"red", r"product\s*red",
    r"титан", r"titanium", r"титановый", r"чёрный\s*титан", r"белый\s*титан",
    r"натуральный\s*титан", r"natural\s*titanium",
    r"бронзовый", r"bronze", r"золотой", r"gold",
    r"графит", r"graphite", r"тёмный", r"alpine\s*green",
    r"sky\s*blue", r"небесно[-\s]голубой",
    # Dyson colors
    r"никель", r"nickel", r"медный", r"copper", r"prussian", r"vinca",
    r"fuchsia", r"фуксия", r"iron", r"стальной", r"топаз", r"topaz",
    r"бордовый", r"red\s*rust",
    # Garmin colors
    r"slate", r"карбон", r"carbon", r"бежевый", r"olive", r"оливковый",
    r"графитовый",
]


def clean_name(name: str):
    """Возвращает (display_name, model_key).
    display_name — для карточки (без цвета, спец-кода).
    model_key — для группировки (нормализованный).
    """
    s = html.unescape(name)
    # Спец-скобки (GB/TB/Core/M5/SSD/Wi-Fi/Поколения/Generation)
    s = re.sub(r"\s*\([^)]*(?:GB|ГБ|ТБ|TB|Core|M\d|SSD|Wi-Fi|Generation|поколени)[^)]*\)", "", s, flags=re.I)
    # SKU-коды Apple: 4-7 символов из [A-Z0-9], содержащие минимум 1 букву и 1 цифру
    # (MDH74, MRXV3, MC654, MW0W3, MGEA4 — все ловятся).
    s = re.sub(r"\s+\b(?=[A-Z0-9]*\d)(?=[A-Z0-9]*[A-Z])[A-Z0-9]{4,7}\b", "", s)
    # «кастомный»
    s = re.sub(r"\s+кастомный\b", "", s, flags=re.I)
    s = re.sub(r"\s+", " ", s).strip(" -—,")

    # Ключ группировки = убираем все цветовые признаки
    key = s
    # 1) Кавычки-ёлочки «...» и обычные кавычки "..." — обычно цвет
    key = re.sub(r"«[^»]+»", "", key)
    key = re.sub(r"\"[^\"]+\"", "", key)
    # 2) Скобки с цветовыми токенами
    color_re = "|".join(COLOR_TOKENS)
    key = re.sub(rf"\s*\([^)]*\b(?:{color_re})\b[^)]*\)", "", key, flags=re.I)
    # 3) Любые скобки, оставшиеся (год, поколение и т.п.)
    key = re.sub(r"\s*\([^)]*\)", "", key)
    # 4) Watch: всё от слова «алюминий|титан|нержавеющая» до конца — это материал+цвет+ремешок
    key = re.sub(r",\s*(?:алюминий|титан|нержавеющая)\b.*$", "", key, flags=re.I)
    # 5) Прямые упоминания цвета inline (через «цвета X» или просто цвет в конце)
    key = re.sub(rf"\s+\b(?:{color_re})\b.*$", "", key, flags=re.I)
    # 6) Хвост ", ... ремешок/браслет/ремень ..." (с любым прилагательным перед)
    key = re.sub(r",[^,]*\b(?:ремешок|браслет|ремень|нейлоновый|кожаный)\b.*$", "", key, flags=re.I)
    # 7) Хвост "Gift Edition", "коллекция", "Origin" — не различающие признаки
    key = re.sub(r",\s*коллекция\b.*$", "", key, flags=re.I)
    key = re.sub(r"\s+Gift\s+Edition\b.*$", "", key, flags=re.I)
    # Нормализуем кавычки/дюймы: ”, “, " → одну форму, чтобы не двоилось
    key = re.sub(r"[\"”“″]", "\"", key)
    key = re.sub(r"\s+", " ", key).strip(' -—,"')

    # display: убираем все прямые кавычки и добавляем дюйм-знак ″ для диагоналей
    disp = key.replace('"', "") if key else s
    disp = re.sub(r"\b(13|14|15|16|24|27)\b(?=\s|$)", r"\1″", disp)
    disp = re.sub(r"\s+", " ", disp).strip(" -—,")
    return disp, key.lower()


groups: dict = {}
for r in rows:
    id_, name, slug, category, brand, price, emoji, img = r
    price = int(price)
    display, key = clean_name(name)
    gkey = (category, key)
    if gkey not in groups:
        groups[gkey] = dict(
            id=id_, name=display, slug=slug, category=category, brand=brand,
            price=price, emoji=emoji, imgs=[img],
        )
    else:
        g = groups[gkey]
        # Минимальная цена
        if price < g["price"]:
            g["price"] = price
            g["id"]   = id_     # id — от самой дешёвой
            g["slug"] = slug
        # Картинки — собираем уникальные
        if img not in g["imgs"]:
            g["imgs"].append(img)

products = list(groups.values())
print(f"after color-dedup: {len(products)}")

from collections import Counter
for cat, n in Counter(p["category"] for p in products).most_common():
    print(f"  {cat}: {n}")

# Сортируем: категория, цена
products.sort(key=lambda p: (p["category"], p["price"]))

# Лимит картинок на товар — 4 максимум (слайдшоу не нужно длиннее)
for p in products:
    p["imgs"] = p["imgs"][:4]

lines = [
    "/* AUTO-GENERATED by scripts/import-biggeek-products.py + dedupe-biggeek.py.",
    "   Цены и изображения с biggeek.ru. Не править вручную. */",
    "",
    'import type { Product } from "./data";',
    "",
    "export const BIGGEEK_PRODUCTS: Product[] = [",
]
for p in products:
    name_esc = p["name"].replace("\\", "\\\\").replace('"', '\\"')
    imgs_ts  = "[" + ", ".join(f'"{u}"' for u in p["imgs"]) + "]"
    lines.append(
        f'  {{ id:"{p["id"]}", name:"{name_esc}", slug:"{p["slug"]}",'
        f' category:"{p["category"]}", brand:"{p["brand"]}", price:{p["price"]},'
        f' emoji:"{p["emoji"]}", img:{imgs_ts}, inStock:true, rating:5,'
        f' reviewCount:0, description:"", specs:[] }},'
    )
lines.append("];")
PATH.write_text("\n".join(lines))
print(f"📝 wrote: {PATH}")
