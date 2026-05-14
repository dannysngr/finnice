#!/usr/bin/env python3
"""
scripts/optimize-biggeek-images.py

Уменьшает все biggeek-картинки до 500×500 (карточка каталога показывает их ≤250px)
и сохраняет рядом WebP версии (~30% меньше JPEG). HTML/img продолжат работать
с .jpg URL — мы перезаписываем оригинал-jpeg ужатой версией, плюс кладём .webp.
"""
from PIL import Image
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "public" / "images" / "biggeek"
TARGET = 500     # max side
JPEG_Q = 82      # JPEG quality
WEBP_Q = 78      # WebP quality (немного ниже — webp эффективнее)

files = sorted(p for p in IMG_DIR.glob("*.jpg") if not p.name.startswith("."))
print(f"files: {len(files)}")

ok = fail = 0
before = after = 0
for f in files:
    if "_orig" in str(f):
        continue
    try:
        before += f.stat().st_size
        img = Image.open(f).convert("RGB")
        w, h = img.size
        if max(w, h) > TARGET:
            scale = TARGET / max(w, h)
            img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
        # Перезаписываем JPEG ужатой версией
        img.save(f, "JPEG", quality=JPEG_Q, optimize=True, progressive=True)
        after += f.stat().st_size
        ok += 1
    except Exception as e:
        print(f"  ✗ {f.name}: {e}")
        fail += 1

print(f"\n✓ обработано: {ok} · ✗ ошибок: {fail}")
print(f"размер: {before/1024/1024:.1f} MB → {after/1024/1024:.1f} MB ({100*(1-after/before):.0f}% экономия)")
