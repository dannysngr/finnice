/**
 * components/FinniceLogo.tsx
 *
 * Единый компонент логотипа Finnice — стилизованная буква F с
 * градиентом «глубокий тил → светлый тил».
 *
 * Используется во всех ячейках, где раньше был placeholder "NF":
 * шапка, футер, модалки, e-mail, страница входа.
 *
 *   <FinniceLogo size={28} />           ← квадратная иконка
 *   <FinniceLogo variant="mark" />      ← только знак
 *   <FinniceLogo variant="wordmark" />  ← знак + текст «finnice»
 *   <FinniceLogo variant="full" />      ← знак + текст + подзаголовок
 */

import React from "react";

interface Props {
  size?:    number;                                   // px, ширина/высота знака (default 32)
  variant?: "mark" | "wordmark" | "full";             // default "mark"
  color?:   "gradient" | "white" | "dark";            // default "gradient"
  className?: string;
}

let _idSeed = 0;
function uniqueId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 8);
  }
  return `g${++_idSeed}`;
}

export function FinniceLogo({
  size = 32, variant = "mark", color = "gradient", className,
}: Props) {
  /* Уникальные id для градиентов — чтобы несколько логотипов
     на одной странице не конфликтовали. */
  const gid = React.useMemo(() => uniqueId(), []);
  const gradId   = `finnice-grad-${gid}`;
  const shadowId = `finnice-shadow-${gid}`;

  const fillTop = color === "white" ? "#ffffff" : color === "dark" ? "#0E2344" : `url(#${gradId})`;
  const fillBot = color === "white" ? "rgba(255,255,255,0.78)"
                : color === "dark"  ? "#1A3C6E"
                                    : `url(#${gradId})`;

  const Mark = (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none"
         xmlns="http://www.w3.org/2000/svg" aria-label="Finnice"
         style={{ display: "block" }}>
      <defs>
        {color === "gradient" && (
          <linearGradient id={gradId} x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0%"  stopColor="#3FCFA5" />
            <stop offset="55%" stopColor="#0FA079" />
            <stop offset="100%" stopColor="#0C7A58" />
          </linearGradient>
        )}
        <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#062E22" floodOpacity="0.35"/>
        </filter>
      </defs>

      {/* Вертикальная стойка F */}
      <path
        d="M16 8 L26 8 L26 56 L16 56 Z"
        fill={fillBot}
        filter={`url(#${shadowId})`}
      />
      {/* Верхняя «лента» — основная характерная черта */}
      <path
        d="M16 8 L52 8 C52 8 56 8 56 14 L56 20 C56 20 50 20 46 20 L26 20 L26 8 Z"
        fill={fillTop}
        filter={`url(#${shadowId})`}
      />
      {/* Центральная перекладина — короче и тоньше */}
      <path
        d="M26 28 L44 28 C44 28 47 28 47 32 L47 36 C47 36 44 36 42 36 L26 36 L26 28 Z"
        fill={fillTop}
        opacity={0.96}
      />
      {/* Мягкий блик в верхнем правом углу для глубины */}
      <path
        d="M40 8 L52 8 C54.8 8 56 10 56 12 L56 16 L50 16 Z"
        fill="white"
        opacity={color === "gradient" ? 0.15 : 0}
      />
    </svg>
  );

  if (variant === "mark") {
    return <span className={className} style={{ display: "inline-flex", lineHeight: 0 }}>{Mark}</span>;
  }

  /* wordmark + full варианты */
  const textColor = color === "white" ? "#ffffff" : "#0A1628";
  return (
    <span className={className}
          style={{ display: "inline-flex", alignItems: "center", gap: size * 0.28, lineHeight: 1 }}>
      {Mark}
      <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1 }}>
        <span style={{
          fontWeight: 700,
          fontSize:   size * 0.7,
          letterSpacing: "-0.02em",
          color:      textColor,
          fontFamily: "var(--font-sans, system-ui, -apple-system, 'Segoe UI', Roboto, Inter, sans-serif)",
        }}>
          finnice
        </span>
        {variant === "full" && (
          <span style={{
            fontWeight: 600,
            fontSize:   size * 0.22,
            letterSpacing: "0.18em",
            color:      "#0C7A58",
            marginTop:  size * 0.08,
            textTransform: "uppercase",
          }}>
            Finance.&nbsp;Simplified.
          </span>
        )}
      </span>
    </span>
  );
}
