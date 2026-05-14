#!/usr/bin/env python3
"""Стилизованные картинки Wayfarer-style очков для каталога.
Рендерим в 4× и даунскейлим для антиалиаса."""
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "images" / "products"
OUT_DIR.mkdir(parents=True, exist_ok=True)

S = 4               # supersample factor
OUT = 500           # итоговый размер
W = H = OUT * S


def draw_wayfarer(out_path: Path, frame, lens, highlight, dot=None):
    img = Image.new("RGB", (W, H), (250, 251, 252))

    # Базовые координаты в пикселях итоговой картинки (×S при рисовании)
    cx, cy = OUT // 2, int(OUT * 0.52)
    lens_w, lens_h = 145, 105
    gap = 22
    radius = 22
    frame_thick = 11
    temple_ext = 28

    lx_center = cx - gap // 2 - lens_w // 2
    rx_center = cx + gap // 2 + lens_w // 2

    def box(center_x):
        return (
            (center_x - lens_w // 2) * S, (cy - lens_h // 2) * S,
            (center_x + lens_w // 2) * S, (cy + lens_h // 2) * S,
        )
    L, R = box(lx_center), box(rx_center)

    # ── Тень под очками ──────────────────────────────────────────
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sh)
    sh_off = 10 * S
    for b in (L, R):
        sd.rounded_rectangle((b[0], b[1] + sh_off, b[2], b[3] + sh_off),
                             radius=radius * S, fill=(0, 0, 0, 80))
    sh = sh.filter(ImageFilter.GaussianBlur(radius=10 * S))
    img = Image.alpha_composite(img.convert("RGBA"), sh).convert("RGB")
    draw = ImageDraw.Draw(img)

    # ── Перемычка ────────────────────────────────────────────────
    bt = 6 * S
    by = (cy + 4) * S
    draw.rectangle((L[2] - 2 * S, by - bt // 2, R[0] + 2 * S, by + bt // 2),
                   fill=frame)

    # ── Дужки (наружу от верхних углов линз) ─────────────────────
    # Левая дужка
    draw.polygon([
        (L[0] + 4 * S, L[1] + 12 * S),
        (L[0] + 8 * S, L[1] + 20 * S),
        (L[0] - temple_ext * S, L[1] + 6 * S),
        (L[0] - temple_ext * S, L[1] + 1 * S),
    ], fill=frame)
    # Правая дужка
    draw.polygon([
        (R[2] - 4 * S, R[1] + 12 * S),
        (R[2] - 8 * S, R[1] + 20 * S),
        (R[2] + temple_ext * S, R[1] + 6 * S),
        (R[2] + temple_ext * S, R[1] + 1 * S),
    ], fill=frame)

    # ── Линзы: заливка + вертикальный градиент ──────────────────
    lens_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ld = ImageDraw.Draw(lens_layer)
    for b in (L, R):
        ld.rounded_rectangle(b, radius=radius * S, fill=lens + (255,))

    # Лёгкий градиент-блеск сверху
    grad = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    for b in (L, R):
        steps = 30
        for i in range(steps):
            y0 = b[1] + (b[3] - b[1]) * i // steps
            y1 = b[1] + (b[3] - b[1]) * (i + 1) // steps
            alpha = int(80 * (1 - i / steps) ** 2)
            gd.rectangle((b[0], y0, b[2], y1), fill=highlight + (alpha,))

    mask = Image.new("L", (W, H), 0)
    md = ImageDraw.Draw(mask)
    for b in (L, R):
        md.rounded_rectangle(b, radius=radius * S, fill=255)

    grad_masked = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    grad_masked.paste(grad, (0, 0), mask)
    lens_layer = Image.alpha_composite(lens_layer, grad_masked)
    img = Image.alpha_composite(img.convert("RGBA"), lens_layer).convert("RGB")
    draw = ImageDraw.Draw(img)

    # ── Толстая Wayfarer-рамка ───────────────────────────────────
    for b in (L, R):
        draw.rounded_rectangle(b, radius=radius * S,
                               outline=frame, width=frame_thick * S)

    # ── Диагональный блик внутри линз ────────────────────────────
    gloss = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd2 = ImageDraw.Draw(gloss)
    for b in (L, R):
        gd2.polygon([
            (b[0] + 20 * S, b[1] + 16 * S),
            (b[0] + 55 * S, b[1] + 16 * S),
            (b[0] + 32 * S, b[3] - 20 * S),
            (b[0] + 14 * S, b[3] - 20 * S),
        ], fill=(255, 255, 255, 80))
    gloss = gloss.filter(ImageFilter.GaussianBlur(radius=2 * S))
    gloss_m = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gloss_m.paste(gloss, (0, 0), mask)
    img = Image.alpha_composite(img.convert("RGBA"), gloss_m).convert("RGB")
    draw = ImageDraw.Draw(img)

    # ── Точка-индикатор камеры (Meta-style) ──────────────────────
    if dot:
        r = 3 * S
        ax = R[2] - 14 * S
        ay = R[1] + 14 * S
        draw.ellipse((ax - r, ay - r, ax + r, ay + r), fill=dot)
        # На другой линзе — серая "вторая камера"
        ax2 = L[0] + 14 * S
        ay2 = L[1] + 14 * S
        rr = r - S
        draw.ellipse((ax2 - rr, ay2 - rr, ax2 + rr, ay2 + rr),
                     fill=(160, 160, 165))

    final = img.resize((OUT, OUT), Image.LANCZOS)
    final.save(out_path, "JPEG", quality=90, optimize=True, progressive=True)
    print(f"  ✓ {out_path.relative_to(ROOT)}")


# Glasses 2025 — Shiny Black
draw_wayfarer(
    OUT_DIR / "rayban-meta-gen4.jpg",
    frame=(12, 13, 17),
    lens=(34, 38, 50),
    highlight=(160, 170, 200),
    dot=(225, 30, 60),
)

# Smart Glasses Gen3 — Shiny Havana (тёплый коричневый)
draw_wayfarer(
    OUT_DIR / "rayban-meta-gen3.jpg",
    frame=(72, 40, 22),
    lens=(58, 38, 26),
    highlight=(210, 170, 110),
    dot=(225, 30, 60),
)

print("done")
