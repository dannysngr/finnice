#!/usr/bin/env python3
"""
scripts/rebrand-watch-images.py

Закрашивает надпись "Big Geek" на картинках Apple Watch с biggeek.ru и пишет
"Finnice". Подход: ищет в центральной зоне самые яркие строки белого текста
на тёмном фоне (это циферблат при входящем звонке) и накрывает их чёрным
прямоугольником, поверх — белый "Finnice" в шрифте Helvetica Bold.

Сохраняет оригиналы в public/images/biggeek/_orig/<name>.jpg перед перезаписью.
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import glob
import shutil

ROOT = Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "public" / "images" / "biggeek"
BACKUP = IMG_DIR / "_orig"
BACKUP.mkdir(exist_ok=True)

FONT = "/System/Library/Fonts/HelveticaNeue.ttc"

# Подбираем все картинки часов
patterns = ["*apple-watch*.jpg", "casy-apple-watch*.jpg", "*watch-ultra*.jpg", "*watch-series*.jpg", "*watch-se*.jpg"]
files = set()
for pat in patterns:
    for f in IMG_DIR.glob(pat):
        files.add(f)
files = sorted(files)
print(f"watch files: {len(files)}")


def is_white(px):
    r, g, b = px[:3]
    return r > 200 and g > 200 and b > 200


def is_dark(px):
    r, g, b = px[:3]
    return r < 40 and g < 40 and b < 40


def find_watch_face_xbounds(img: Image.Image, y: int):
    """В заданном ряду y возвращает (x_left, x_right) — горизонтальные границы
    тёмной зоны (циферблата). Сканируем от центра наружу."""
    w, _ = img.size
    px = img.load()
    cx = w // 2
    # Если в центре уже не тёмный — циферблат не нашли
    if not is_dark(px[cx, y]):
        return None
    xl = cx
    while xl > 0 and is_dark(px[xl, y]):
        xl -= 1
    xr = cx
    while xr < w - 1 and is_dark(px[xr, y]):
        xr += 1
    return xl, xr


def find_watch_face_bbox(img: Image.Image):
    """Возвращает (x0, y0, x1, y1) — bbox циферблата (большая тёмная зона в центре).
    Определяется по строкам/колонкам с долей >50% тёмных пикселей."""
    w, h = img.size
    px = img.load()

    def row_dark_frac(y, x_from, x_to):
        c = sum(1 for x in range(x_from, x_to) if is_dark(px[x, y]))
        return c / max(1, x_to - x_from)

    def col_dark_frac(x, y_from, y_to):
        c = sum(1 for y in range(y_from, y_to) if is_dark(px[x, y]))
        return c / max(1, y_to - y_from)

    # Ищем диапазон y, где центральная полоса (40-60% по x) преимущественно тёмная
    xc0, xc1 = int(w * 0.4), int(w * 0.6)
    yc0, yc1 = int(h * 0.4), int(h * 0.6)

    ys = [y for y in range(int(h * 0.1), int(h * 0.9)) if row_dark_frac(y, xc0, xc1) > 0.5]
    xs = [x for x in range(int(w * 0.1), int(w * 0.9)) if col_dark_frac(x, yc0, yc1) > 0.5]
    if not ys or not xs:
        # fallback: центральные 60%
        return (int(w * 0.20), int(h * 0.20), int(w * 0.80), int(h * 0.80))
    return (min(xs), min(ys), max(xs), max(ys))


def find_text_band(img: Image.Image):
    """Возвращает (x0, y0, x1, y1) — bbox блока белого текста в верхней половине
    циферблата (имя звонящего, может быть в 1 или 2 строки)."""
    w, h = img.size
    px = img.load()

    # Сначала определяем bbox самого циферблата
    fx0, fy0, fx1, fy1 = find_watch_face_bbox(img)
    fw = fx1 - fx0
    fh = fy1 - fy0
    if fw < 100 or fh < 100:
        return None

    # Ограничиваем зону поиска ВЕРХНЕЙ половиной циферблата (выше кнопок)
    inner_pad = max(15, fw // 30)
    xa = fx0 + inner_pad
    xb = fx1 - inner_pad
    ya = fy0 + int(fh * 0.20)
    yb = fy0 + int(fh * 0.55)

    row_counts = []
    for y in range(ya, yb):
        cnt = 0
        for x in range(xa, xb):
            if is_white(px[x, y]):
                cnt += 1
        row_counts.append((y, cnt))

    if not row_counts:
        return None

    max_cnt = max(c for _, c in row_counts)
    if max_cnt < 15:
        return None
    threshold = max(8, int(max_cnt * 0.18))

    text_ys = [y for y, c in row_counts if c >= threshold]
    if not text_ys:
        return None

    # Группируем подряд идущие (gap≤25 px чтобы объединить "Big"/"Geek" двух-строчного варианта,
    # но не включить ползунок громкости/таймер).
    groups = []
    cur = [text_ys[0]]
    for y in text_ys[1:]:
        if y - cur[-1] <= 25:
            cur.append(y)
        else:
            groups.append(cur)
            cur = [y]
    groups.append(cur)

    # Выбираем группу с максимальным суммарным "белым весом"
    counts_by_y = dict(row_counts)
    def score(g): return sum(counts_by_y.get(y, 0) for y in g)
    best = max(groups, key=score)
    y0, y1 = best[0], best[-1]

    # Горизонтальные границы — по всем белым пикселям внутри полосы
    xs = []
    for y in range(y0, y1 + 1):
        for x in range(xa, xb):
            if is_white(px[x, y]):
                xs.append(x)
    if not xs:
        return None
    x0, x1 = min(xs), max(xs)

    x0 = max(x0 - 10, xa)
    x1 = min(x1 + 10, xb)
    y0 = y0 - 8
    y1 = y1 + 8

    return (x0, y0, x1, y1)


def overlay(img: Image.Image, bbox):
    x0, y0, x1, y1 = bbox
    draw = ImageDraw.Draw(img)
    # Закрашиваем чёрным
    draw.rectangle([x0, y0, x1, y1], fill=(0, 0, 0))

    box_h = y1 - y0
    box_w = x1 - x0
    text = "Finnice"

    # Подбираем размер шрифта: вписываем в bbox с запасом
    size = max(20, int(box_h * 0.55))
    while size > 20:
        font = ImageFont.truetype(FONT, size, index=1)
        bt = draw.textbbox((0, 0), text, font=font)
        tw = bt[2] - bt[0]
        th = bt[3] - bt[1]
        if tw <= box_w * 0.85 and th <= box_h * 0.75:
            break
        size -= 2
    font = ImageFont.truetype(FONT, size, index=1)
    bt = draw.textbbox((0, 0), text, font=font)
    tw = bt[2] - bt[0]
    th = bt[3] - bt[1]
    cx = (x0 + x1) // 2
    cy = (y0 + y1) // 2
    draw.text((cx - tw // 2 - bt[0], cy - th // 2 - bt[1]), text, fill=(255, 255, 255), font=font)


ok = fail = 0
for f in files:
    try:
        img = Image.open(f).convert("RGB")
    except Exception as e:
        print(f"  ✗ {f.name}: {e}")
        fail += 1
        continue
    bbox = find_text_band(img)
    if bbox is None:
        print(f"  ⚠ {f.name}: text band not found, skipping")
        fail += 1
        continue
    # Бэкап оригинала
    backup_path = BACKUP / f.name
    if not backup_path.exists():
        shutil.copy2(f, backup_path)
    overlay(img, bbox)
    img.save(f, "JPEG", quality=88)
    ok += 1

print(f"\n✓ переписано: {ok} · ✗ пропущено/ошибок: {fail}")
print(f"Бэкап оригиналов: {BACKUP}")
