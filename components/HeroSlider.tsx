"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { HERO_SLIDES } from "@/lib/data";

export function HeroSlider() {
  const [cur, setCur]  = useState(0);
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const startXRef      = useRef(0);

  function startTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCur((c) => (c + 1) % HERO_SLIDES.length);
    }, 4500);
  }

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function go(idx: number) {
    setCur(idx);
    startTimer();
  }

  function onPointerDown(e: React.PointerEvent) { startXRef.current = e.clientX; }
  function onPointerUp(e: React.PointerEvent) {
    const diff = startXRef.current - e.clientX;
    if (Math.abs(diff) > 40)
      go((cur + (diff > 0 ? 1 : -1) + HERO_SLIDES.length) % HERO_SLIDES.length);
  }

  return (
    <section className="w-full bg-white py-4 sm:py-6 px-4 sm:px-6 lg:px-10">
      <div className="max-w-[1400px] mx-auto">

        {/* Track */}
        <div
          className="relative overflow-hidden rounded-2xl select-none"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${cur * 100}%)` }}
          >
            {HERO_SLIDES.map((slide) => (
              <Slide key={slide.id} slide={slide} />
            ))}
          </div>

          {/* Arrow navigation — desktop only */}
          <button
            onClick={() => go((cur - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-30
                       w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm border border-white/30
                       items-center justify-center text-white hover:bg-white/35 transition-colors"
            aria-label="Предыдущий слайд"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={() => go((cur + 1) % HERO_SLIDES.length)}
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-30
                       w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm border border-white/30
                       items-center justify-center text-white hover:bg-white/35 transition-colors"
            aria-label="Следующий слайд"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mt-3">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Слайд ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === cur
                  ? "w-6 h-2 bg-[#1A3C6E]"
                  : "w-2 h-2 bg-[#D8E2F0] hover:bg-[#1A3C6E]/40"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Single slide ─────────────────────────────────────────────── */
function Slide({ slide }: { slide: (typeof HERO_SLIDES)[number] }) {
  return (
    <div
      className={`min-w-full h-[240px] sm:h-[290px] md:h-[360px] lg:h-[420px]
                  bg-gradient-to-br ${slide.gradient}
                  relative overflow-hidden flex items-stretch`}
    >
      {/* Subtle decorative circles */}
      <div className="absolute -top-28 -left-28 w-96 h-96 rounded-full bg-white/[0.04] pointer-events-none" />
      <div className="absolute -bottom-16 left-[35%] w-64 h-64 rounded-full bg-white/[0.04] pointer-events-none hidden md:block" />

      {/* ── Right-side image — full height, edge-to-edge, blends into gradient ── */}
      <div className="absolute right-0 top-0 bottom-0 w-[46%] hidden md:block pointer-events-none">
        {/* Gradient overlay that bleeds from slide bg into the photo */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent z-10" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={slide.imgUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* ── Text content ── */}
      <div className="relative z-20 flex items-center
                      px-5 sm:px-8 md:px-12 lg:px-16
                      w-full md:w-[58%]">
        <div className="w-full">
          <span className="inline-block px-3 py-1 rounded-full bg-white/20
                           backdrop-blur-sm text-white text-[10px] sm:text-xs
                           font-semibold mb-2 sm:mb-3 md:mb-4 tracking-wide">
            {slide.badge}
          </span>

          <h2 className="font-extrabold text-white leading-snug mb-2 sm:mb-3
                         text-base sm:text-xl md:text-2xl lg:text-[28px]
                         max-w-xs sm:max-w-sm md:max-w-none">
            {slide.headline}
          </h2>

          <p className="text-white/75 leading-relaxed mb-3 sm:mb-5
                        text-xs sm:text-sm md:text-base max-w-sm
                        hidden sm:block">
            {slide.sub}
          </p>

          <Link
            href={slide.cta.href}
            className="inline-flex items-center gap-2
                       px-4 py-2 sm:px-5 sm:py-2.5
                       bg-white text-[#0A1628] font-semibold
                       text-xs sm:text-sm rounded-full
                       hover:bg-white/90 active:scale-95 transition-all"
          >
            {slide.cta.label}
            <svg width="12" height="12" viewBox="0 0 13 13" fill="none">
              <path d="M4 2l5 4.5L4 11" stroke="currentColor"
                    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
