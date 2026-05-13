#!/usr/bin/env bash
# scripts/fetch-biggeek-images.sh
#
# Скачивает картинки товаров с biggeek.ru CDN (images.biggeek.ru) и
# сохраняет их в public/images/phones/ под именами, ожидаемыми
# каталогом (lib/data.ts).
#
# Использование: ./scripts/fetch-biggeek-images.sh
#
# Для каждой записи в MAP идём на страницу товара, ищем первый
# <img src="//images.biggeek.ru/..."> и скачиваем его как нашу-имя.jpg.

set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/public/images/phones"
mkdir -p "$DEST"

UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

# ── Маппинг: наше_имя_файла → biggeek_url_path ───────────────
declare -a MAP=(
  # iPhones — apple- префикс для всех
  "iphone-17-pro-max|catalog/apple-iphone-17-pro-max"
  "iphone-17-pro|catalog/apple-iphone-17-pro"
  "iphone-17|catalog/apple-iphone-17"
  "iphone-air|catalog/apple-iphone-air"
  "iphone-16-pro-max|catalog/iphone-16-pro-max"
  "iphone-16-pro|catalog/iphone-16-pro"
  "iphone-16-plus|catalog/iphone-16-plus"
  "iphone-16|catalog/iphone-16"
  "iphone-15-pro-max|catalog/apple-iphone-15-pro-max"
  "iphone-15-pro|catalog/apple-iphone-15-pro"
  "iphone-15-plus|catalog/apple-iphone-15-plus"
  "iphone-15|catalog/apple-iphone-15"
  "iphone-14-pro-max|catalog/apple-iphone-14-pro-max"
  "iphone-14-pro|catalog/apple-iphone-14-pro"
  "iphone-14-plus|catalog/apple-iphone-14-plus"
  "iphone-14|catalog/apple-iphone-14"
  "iphone-13-pro-max|catalog/apple-iphone-13-pro-max"
  "iphone-13-pro|catalog/apple-iphone-13-pro"
  "iphone-13|catalog/apple-iphone-13"
  "iphone-12-pro-max|catalog/apple-iphone-12-pro-max"
  "iphone-12-pro|catalog/apple-iphone-12-pro"
  "iphone-12|catalog/apple-iphone-12"
  "iphone-11-pro-max|catalog/apple-iphone-11-pro-max"
  "iphone-11-pro|catalog/apple-iphone-11-pro"
  "iphone-11|catalog/apple-iphone-11"

  # iPad — даты в URL, используем последние
  "ipad-pro|catalog/ipad-pro-11-2025"
  "ipad-air|catalog/ipad-air-13-2025"

  # AirPods
  "airpods-pro3|catalog/apple-airpods-pro-3"
  "airpods4-anc|catalog/apple-airpods-4-2024"
  "airpods4|catalog/apple-airpods-4-2024"
  "airpods-max2|catalog/apple-airpods-max"

  # MacBook
  "macbook-air-13|catalog/macbook-air-13-m4-2025"
  "macbook-air-15|catalog/macbook-air-15-m4-2025"
  "macbook-pro-14|catalog/macbook-pro-14"
  "macbook-pro-16|catalog/macbook-pro-16"

  # iMac — для всех вариантов цветов используем общий
  "imac-silver|catalog/apple-imac-24-2024"
  "imac-blue|catalog/apple-imac-24-2024"
  "imac-pink|catalog/apple-imac-24-2024"
  "imac-purple|catalog/apple-imac-24-2024"

  # Mac
  "mac-mini|catalog/apple-mac-mini-2024"
  "mac-studio|catalog/apple-mac-studio"
  "mac-pro|catalog/apple-mac-pro"

  # Honor
  "honor-200|catalog/honor-200"
  "honor-200-pro|catalog/honor-200-pro"
)

OK=0
FAIL=0
FAILED=()

for entry in "${MAP[@]}"; do
  name="${entry%%|*}"
  path="${entry#*|}"
  url="https://biggeek.ru/$path"
  out="$DEST/$name.jpg"

  # 1) HTML страницы товара
  html=$(curl -sL --max-time 15 -A "$UA" "$url" 2>/dev/null) || { FAIL=$((FAIL+1)); FAILED+=("$name (curl fail)"); continue; }

  # 2) Первый <img src> с CDN biggeek
  img=$(echo "$html" | grep -oE 'src="//images\.biggeek\.ru/[^"]*\.(jpg|jpeg|png|webp)[^"]*"' | head -1 | sed -E 's/^src="//; s/"$//')
  if [ -z "$img" ]; then
    img=$(echo "$html" | grep -oE 'src="https://images\.biggeek\.ru/[^"]*\.(jpg|jpeg|png|webp)[^"]*"' | head -1 | sed -E 's/^src="//; s/"$//')
  fi

  if [ -z "$img" ]; then
    FAIL=$((FAIL+1))
    FAILED+=("$name (no image)")
    echo "  ✗ $name → no image found at $url"
    continue
  fi

  # Префикс scheme
  case "$img" in
    //*) img="https:$img" ;;
  esac

  # URL-encoding пробелов (часто встречаются в именах файлов biggeek)
  img_enc="${img// /%20}"

  # 3) Скачиваем
  if curl -sL --max-time 20 -A "$UA" -e "$url" -o "$out" "$img_enc" 2>/dev/null; then
    size=$(stat -f%z "$out" 2>/dev/null || stat -c%s "$out" 2>/dev/null || echo 0)
    if [ "$size" -gt 1000 ]; then
      OK=$((OK+1))
      echo "  ✓ $name ← $(basename "$img") ($((size/1024)) КБ)"
    else
      rm -f "$out"
      FAIL=$((FAIL+1))
      FAILED+=("$name (size $size)")
      echo "  ✗ $name → file too small ($size B), removed"
    fi
  else
    FAIL=$((FAIL+1))
    FAILED+=("$name (download fail)")
    echo "  ✗ $name → download failed"
  fi

  # вежливая пауза
  sleep 0.5
done

echo ""
echo "═════════════════════════════════════"
echo "Готово: ✓ $OK успешно, ✗ $FAIL не получилось"
echo "═════════════════════════════════════"
if [ "$FAIL" -gt 0 ]; then
  printf 'Не получилось:\n'
  for x in "${FAILED[@]}"; do printf '  • %s\n' "$x"; done
fi
