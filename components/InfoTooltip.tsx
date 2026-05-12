"use client";

/**
 * components/InfoTooltip.tsx
 *
 * Кликабельная иконка «i», по нажатию показывает попап-подсказку.
 * Поддерживает two color schemes: light (для светлых страниц портфеля)
 * и dark (для тёмных страниц/модалок симулятора).
 *
 * Закрывается по клику вне, по Escape или повторному клику.
 */

import { useState, useEffect, useRef } from "react";

export function InfoTooltip({
  text,
  align = "left",
  scheme = "light",
}: {
  text: string;
  align?: "left" | "right";
  scheme?: "light" | "dark";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const btnBg = scheme === "dark" ? "#2A4B7A" : "#E5E7EB";
  const btnFg = scheme === "dark" ? "#cbd5e1" : "#6B7280";

  return (
    <span ref={ref} className="relative inline-flex" onClick={e => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold leading-none transition-colors"
        style={{ background: btnBg, color: btnFg }}
        aria-label="Подсказка"
        title="Подсказка"
      >
        i
      </button>
      {open && (
        <span
          className="absolute z-50"
          style={{
            bottom: "calc(100% + 8px)",
            ...(align === "right" ? { right: 0 } : { left: 0 }),
            minWidth: 240,
            maxWidth: 320,
            width: "max-content",
            background: "#0A1628",
            color: "#fff",
            padding: "10px 12px",
            borderRadius: "8px",
            fontSize: "11px",
            lineHeight: 1.5,
            fontWeight: 400,
            textTransform: "none",
            letterSpacing: 0,
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            whiteSpace: "normal",
          }}
        >
          {text}
          <span
            style={{
              position: "absolute",
              top: "100%",
              ...(align === "right" ? { right: 6 } : { left: 6 }),
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid #0A1628",
            }}
          />
        </span>
      )}
    </span>
  );
}
