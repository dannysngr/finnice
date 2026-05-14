#!/usr/bin/env python3
"""Генерирует стилизованные картинки очков Ray-Ban Meta для каталога:
    public/images/products/rayban-meta-gen4.jpg
    public/images/products/rayban-meta-gen3.jpg
"""
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "images" / "products"
OUT_DIR.mkdir(parents=True, exist_ok=True)


def draw_sunglasses(out_path: Path, frame_color, lens_color, accent=None):
    W = H = 500
    img = Image.new("RGB", (W, H), (248, 249, 250))
    draw = ImageDraw.Draw(img)

    # Геометрия: два округлых "квадрата" линзы + перемычка + дужки
    cx, cy = W // 2, int(H * 0.55)
    lens_w = 130
    lens_h = 100
    gap = 30                 # перемычка
    radius = 28              # скругление линзы

    left_box = (cx - gap // 2 - lens_w, cy - lens_h // 2,
                cx - gap // 2,          cy + lens_h // 2)
    right_box = (cx + gap // 2,         cy - lens_h // 2,
                 cx + gap // 2 + lens_w, cy + lens_h // 2)

    # Тонкая мягкая тень
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    for box in (left_box, right_box):
        sdraw.rounded_rectangle((box[0], box[1] + 14, box[2], box[3] + 14),
                                radius=radius, fill=(0, 0, 0, 55))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=16))
    img.paste(Image.alpha_composite(img.convert("RGBA"), shadow).convert("RGB"))
    draw = ImageDraw.Draw(img)

    # Перемычка (тонкая)
    bridge_y = cy
    draw.rectangle((left_box[2], bridge_y - 4, right_box[0], bridge_y + 6),
                   fill=frame_color)

    # Дужки (исходят из верхних углов линз наружу)
    temple_w = 8
    # Левая дужка
    draw.line((left_box[0] + 6, left_box[1] + 14, left_box[0] - 35, left_box[1] + 6),
              fill=frame_color, width=temple_w)
    # Правая дужка
    draw.line((right_box[2] - 6, right_box[1] + 14, right_box[2] + 35, right_box[1] + 6),
              fill=frame_color, width=temple_w)

    # Линзы (фоновая заливка)
    for box in (left_box, right_box):
        draw.rounded_rectangle(box, radius=radius, fill=lens_color)
    # Рамка вокруг линз
    for box in (left_box, right_box):
        draw.rounded_rectangle(box, radius=radius, outline=frame_color, width=10)

    # Блик в верхней части линз (диагональная белая полоса)
    gloss = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(gloss)
    for box in (left_box, right_box):
        gdraw.polygon([
            (box[0] + 18, box[1] + 12),
            (box[0] + 48, box[1] + 12),
            (box[0] + 22, box[3] - 18),
            (box[0] + 8,  box[3] - 18),
        ], fill=(255, 255, 255, 60))
    gloss = gloss.filter(ImageFilter.GaussianBlur(radius=3))
    img = Image.alpha_composite(img.convert("RGBA"), gloss).convert("RGB")

    # Акцент Meta-точка (если задана)
    if accent:
        adraw = ImageDraw.Draw(img)
        r = 5
        # маленькая точка-индикатор в правом верхнем углу правой линзы (камера)
        ax = right_box[2] - 18
        ay = right_box[1] + 16
        adraw.ellipse((ax - r, ay - r, ax + r, ay + r), fill=accent)
        # маленькая точка слева (вторая камера / LED)
        ax2 = left_box[0] + 12
        ay2 = left_box[1] + 16
        adraw.ellipse((ax2 - r + 1, ay2 - r + 1, ax2 + r - 1, ay2 + r - 1),
                      fill=(180, 180, 180))

    img.save(out_path, "JPEG", quality=88, optimize=True)
    print(f"  ✓ {out_path.relative_to(ROOT)}")


# Ray-Ban Meta (2025) — глянцевый чёрный с тёмно-серыми линзами + индикатор
draw_sunglasses(
    OUT_DIR / "rayban-meta-gen4.jpg",
    frame_color=(15, 15, 17),
    lens_color=(38, 42, 52),
    accent=(220, 30, 60),       # Meta-красный индикатор
)

# Ray-Ban Meta Smart Glasses — классический Wayfarer Shiny Black, чёрные линзы
draw_sunglasses(
    OUT_DIR / "rayban-meta-gen3.jpg",
    frame_color=(20, 20, 22),
    lens_color=(28, 30, 36),
    accent=(220, 30, 60),
)

print("done")
