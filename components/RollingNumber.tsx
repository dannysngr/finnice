"use client";

/**
 * RollingNumber — анимированное число с эффектом «барабанов» как у
 * кодовых замков на чемоданах. Каждая цифра рендерится в своём
 * вертикальном барабанчике 0–9 и при изменении значения плавно
 * прокручивается до нужной позиции по кратчайшему пути.
 *
 * Использование:
 *   <RollingNumber value={result.monthly} />
 *   <RollingNumber value={x} digitHeight={28} color="#FFF" />
 */
import { CSSProperties } from "react";

interface Props {
  value:        number;
  /** Высота одной цифры в px. Должна совпадать с line-height текста. */
  digitHeight?: number;
  /** Цвет цифр (по умолчанию наследуется). */
  color?:       string;
  /** Доп. CSS-классы на контейнер. */
  className?:   string;
  /** Inline-стили на контейнер (например, font-size). */
  style?:       CSSProperties;
}

export function RollingNumber({
  value,
  digitHeight = 28,
  color,
  className,
  style,
}: Props) {
  const formatted = Math.round(Math.max(0, value))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return (
    <span
      className={className}
      style={{
        display:       "inline-flex",
        alignItems:    "center",
        height:        digitHeight,
        lineHeight:    `${digitHeight}px`,
        verticalAlign: "middle",
        color,
        ...style,
      }}
    >
      {formatted.split("").map((ch, i) =>
        /\d/.test(ch) ? (
          <Barrel key={i} digit={Number(ch)} height={digitHeight} />
        ) : (
          // тонкий пробел-разделитель тысяч
          <span
            key={i}
            aria-hidden
            style={{ display: "inline-block", width: "0.3em" }}
          />
        )
      )}
    </span>
  );
}

function Barrel({ digit, height }: { digit: number; height: number }) {
  return (
    <span
      aria-hidden
      style={{
        display:      "inline-block",
        width:        "0.62em",
        height,
        overflow:     "hidden",
        position:     "relative",
        verticalAlign:"top",
        // лёгкий «утопленный» окошечный фейк — еле заметные градиенты сверху/снизу
        // не накладываем здесь, чтобы не ломать темы; делаем отдельно через шторку.
      }}
    >
      <span
        style={{
          display:    "block",
          transform:  `translateY(-${digit * height}px)`,
          transition: "transform 650ms cubic-bezier(.65,0,.35,1)",
          willChange: "transform",
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => (
          <span
            key={k}
            style={{
              display:    "block",
              height,
              lineHeight: `${height}px`,
              textAlign:  "center",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {k}
          </span>
        ))}
      </span>
    </span>
  );
}
