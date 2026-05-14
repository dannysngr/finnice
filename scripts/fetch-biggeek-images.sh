#!/usr/bin/env bash
# scripts/fetch-biggeek-images.sh
#
# Скачивает до 4 уникальных цветовых вариантов товара с biggeek.ru
# и сохраняет в public/images/phones/ с именами <name>-1.jpg, -2.jpg, ...
#
# Дедупликация по цвету: имя файла biggeek заканчивается на _color@2x.jpg
# (orange, darkblue, silver и т.п.). Берём первое вхождение каждого цвета.
# Если на странице вообще одно фото — будет только <name>-1.jpg.
#
# Использование: ./scripts/fetch-biggeek-images.sh

set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/public/images/phones"
mkdir -p "$DEST"

UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
MAX_COLORS=4

declare -a MAP=(
  # iPhones
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

  # iPad
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

  # iMac
  "imac-silver|catalog/apple-imac-24-2024"
  "imac-blue|catalog/apple-imac-24-2024"
  "imac-pink|catalog/apple-imac-24-2024"
  "imac-purple|catalog/apple-imac-24-2024"

  # Mac
  "mac-mini|catalog/apple-mac-mini-2024"
  "mac-studio|catalog/apple-mac-studio"

  # Honor
  "honor-200|catalog/honor-200"
  "honor-200-pro|catalog/honor-200-pro"
)

OK=0
TOTAL=0
FAIL=0
FAILED=()
MANIFEST="$DEST/manifest.json"
declare -a MANIFEST_LINES=()

for entry in "${MAP[@]}"; do
  name="${entry%%|*}"
  path="${entry#*|}"
  url="https://biggeek.ru/$path"

  html=$(curl -sL --max-time 15 -A "$UA" "$url" 2>/dev/null) || { FAIL=$((FAIL+1)); FAILED+=("$name (curl fail)"); continue; }

  # Все image URLs
  raw_urls=$(echo "$html" | grep -oE 'src="//images\.biggeek\.ru/[^"]*\.(jpg|jpeg|png|webp)[^"]*"' \
              | sed -E 's|^src="//|https://|; s|"$||')

  if [ -z "$raw_urls" ]; then
    FAIL=$((FAIL+1))
    FAILED+=("$name (no images)")
    echo "  ✗ $name → no images at $url"
    continue
  fi

  # Дедупликация по цвету (суффикс перед @2x)
  unique=()
  seen_colors=""
  while IFS= read -r u; do
    [ -z "$u" ] && continue
    bn=$(basename "$u")
    # обрезаем @2x.xxx или .xxx
    trimmed="${bn%@2x*}"
    trimmed="${trimmed%.*}"
    # последняя часть после _ = цвет
    color="${trimmed##*_}"
    color=$(echo "$color" | tr '[:upper:]' '[:lower:]')
    if [[ "$seen_colors" != *"|$color|"* ]]; then
      seen_colors="$seen_colors|$color|"
      unique+=("$u")
    fi
    [ ${#unique[@]} -ge $MAX_COLORS ] && break
  done <<< "$raw_urls"

  # Удаляем старые версии — только точные совпадения по индексу 1..9
  # (иначе "iphone-17-*" удалит "iphone-17-pro-*" и "iphone-17-pro-max-*")
  rm -f "$DEST/$name.jpg" "$DEST/$name.jpeg" "$DEST/$name.png" 2>/dev/null
  for j in 1 2 3 4 5 6 7 8 9; do
    rm -f "$DEST/$name-$j.jpg" "$DEST/$name-$j.jpeg" "$DEST/$name-$j.png" 2>/dev/null
  done

  ok_count=0
  i=0
  for u in "${unique[@]}"; do
    i=$((i+1))
    out="$DEST/$name-$i.jpg"
    u_enc="${u// /%20}"
    if curl -sL --max-time 20 -A "$UA" -e "$url" -o "$out" "$u_enc" 2>/dev/null; then
      size=$(stat -f%z "$out" 2>/dev/null || stat -c%s "$out" 2>/dev/null || echo 0)
      if [ "$size" -gt 1000 ]; then
        ok_count=$((ok_count+1))
        TOTAL=$((TOTAL+1))
      else
        rm -f "$out"
      fi
    fi
  done

  if [ $ok_count -gt 0 ]; then
    OK=$((OK+1))
    MANIFEST_LINES+=("  \"$name\": $ok_count")
    echo "  ✓ $name → $ok_count цвет(а)"
  else
    FAIL=$((FAIL+1))
    FAILED+=("$name (download all fail)")
    echo "  ✗ $name → не удалось скачать ни одного файла"
  fi

  sleep 0.3
done

# Записываем манифест: { "iphone-17-pro-max": 3, ... }
{
  echo "{"
  joined=$(IFS=$',\n'; echo "${MANIFEST_LINES[*]}")
  printf '%s\n' "$joined"
  echo "}"
} > "$MANIFEST"
echo ""
echo "📋 Manifest written: $MANIFEST"

echo ""
echo "═════════════════════════════════════════════"
echo "✓ Товаров: $OK · Картинок всего: $TOTAL · ✗ Неуспехов: $FAIL"
echo "═════════════════════════════════════════════"
if [ "$FAIL" -gt 0 ]; then
  printf 'Не получилось:\n'
  for x in "${FAILED[@]}"; do printf '  • %s\n' "$x"; done
fi
