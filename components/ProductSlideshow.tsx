"use client";

/**
 * components/ProductSlideshow.tsx
 *
 * Карточечный slideshow для товара: принимает массив URL картинок,
 * автоматически листает их с плавным fade. Если картинка одна — просто
 * показывает её. Если ноль — выводит fallback emoji.
 *
 * Особенности:
 *   • auto-cycle с интервалом ~2.5s (со стаггером на стартовый offset,
 *     чтобы соседние карточки не моргали в унисон)
 *   • при наведении мышью на десктопе остановка цикла + появление точек
 *   • точки-индикаторы внизу при >1 картинке
 *   • respect prefers-reduced-motion → показывает первое изображение без цикла
 */

import { useEffect, useState, useRef } from "react";

interface Props {
  /** Одиночная картинка или массив URL'ов */
  images:    string | string[] | undefined;
  alt:       string;
  /** Fallback (emoji или произвольный JSX) если картинок нет */
  fallback?: React.ReactNode;
  /** Tailwind-классы внешнего контейнера */
  className?: string;
  /** Tailwind-классы img-элемента */
  imgClassName?: string;
  /** Стиль контейнера */
  style?:     React.CSSProperties;
  /** Интервал цикла, ms (default 4500 — спокойный) */
  intervalMs?: number;
  /** Длительность fade-перехода, ms (default 1200 — мягкий crossfade) */
  fadeMs?:    number;
  /** Случайный offset чтобы соседи не моргали синхронно (default true) */
  stagger?:   boolean;
}

export function ProductSlideshow({
  images, alt, fallback, className, imgClassName, style,
  intervalMs = 4500, fadeMs = 1200, stagger = true,
}: Props) {
  const list = Array.isArray(images) ? images : images ? [images] : [];
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [broken, setBroken] = useState<Set<number>>(new Set());
  const offset = useRef<number>(stagger ? Math.random() * intervalMs : 0);

  useEffect(() => {
    if (list.length <= 1 || paused) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const tick = () => setIdx(i => (i + 1) % list.length);
    const initial = setTimeout(() => {
      tick();
      const t = setInterval(tick, intervalMs);
      (initial as unknown as { interval?: ReturnType<typeof setInterval> }).interval = t;
    }, offset.current);

    return () => {
      clearTimeout(initial);
      const t = (initial as unknown as { interval?: ReturnType<typeof setInterval> }).interval;
      if (t) clearInterval(t);
    };
  }, [list.length, paused, intervalMs]);

  if (list.length === 0) {
    return (
      <div className={className} style={style}
           onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        {fallback}
      </div>
    );
  }

  /* Все картинки сломались → показываем fallback */
  const allBroken = broken.size >= list.length;
  if (allBroken && fallback) {
    return (
      <div className={className} style={style}>
        {fallback}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{ position: "relative", ...style }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {list.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src + i}
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setBroken(b => new Set(b).add(i))}
          className={imgClassName}
          style={{
            position:   list.length > 1 ? "absolute" : "static",
            inset:      0,
            width:      "100%",
            height:     "100%",
            objectFit:  "contain",
            opacity:    i === idx && !broken.has(i) ? 1 : 0,
            transition: `opacity ${fadeMs}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            pointerEvents: "none",
          }}
        />
      ))}

      {list.length > 1 && (
        <div
          className="absolute left-0 right-0 bottom-1.5 flex items-center justify-center gap-1 pointer-events-none"
          style={{ zIndex: 2 }}
        >
          {list.map((_, i) => (
            <span
              key={i}
              style={{
                width:      i === idx ? 14 : 5,
                height:     5,
                borderRadius: 999,
                background: i === idx ? "#0C7A58" : "rgba(0,0,0,0.18)",
                transition: "all 300ms ease",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
