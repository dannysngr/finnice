"use client";

import { useState, useEffect, useRef } from "react";
import {
  calcInstallment,
  fmtRub,
  pluralPayment,
  getMinDownPct,
  getGuarantors,
  MIN_PRICE,
  MAX_PRICE,
  MIN_TERM,
  MAX_TERM,
} from "@/lib/calculator-logic";
import { useAppModal } from "@/lib/modal-context";

// helpers

function addSpaces(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "0";
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
function stripSpaces(s: string): number {
  return Number(s.replace(/[\s ]/g, ""));
}

const MAX_DOWN_PCT = 0.90;
const round100 = (n: number) => Math.round(n / 100) * 100;

interface Props {
  withLink?:     boolean;
  initialPrice?: number;
}

export function Calculator({ withLink = false, initialPrice }: Props) {
  const startPrice   = initialPrice ?? 30_000;
  const prevPriceRef = useRef(startPrice);

  const [price, setPrice] = useState(startPrice);
  const [down,  setDown]  = useState(Math.ceil(startPrice * getMinDownPct(startPrice)));
  const [term,  setTerm]  = useState(6);
  const [wbUrl, setWbUrl] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const { openModal } = useAppModal();

  /* Проверяем роль: ставку показываем только админам/модерам */
  useEffect(() => {
    fetch("/api/lk/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.adminRole) setIsAdmin(true); })
      .catch(() => {});
  }, []);

  /* Расчёт по модели khalim (тариф Light убран, взнос 25% обязателен) */
  const result = calcInstallment({ price, down, term });

  function handlePriceChange(v: number) {
    const oldPrice = prevPriceRef.current;
    prevPriceRef.current = v;
    setPrice(v);
    // Взнос тянется пропорционально, удерживаясь в рамках 25–90%
    const minD = round100(v * 0.25);
    const maxD = Math.floor(v * MAX_DOWN_PCT);
    setDown(d => {
      const ratio  = oldPrice > 0 ? d / oldPrice : 0.25;
      const scaled = Math.round((v * Math.max(0.25, ratio)) / 500) * 500;
      return Math.max(minD, Math.min(maxD, scaled));
    });
  }

  const maxDown    = Math.floor(price * MAX_DOWN_PCT);
  const pricePct   = ((price - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;
  const termPct    = ((term  - MIN_TERM)  / (MAX_TERM  - MIN_TERM))  * 100;
  const guarantors = getGuarantors(price);

  return (
    <div
      id="calculator"
      className="rounded-2xl p-4 md:p-6 flex flex-col overflow-hidden relative"
      style={{
        background: `
          radial-gradient(ellipse at 85% 15%, rgba(12,122,88,0.40), transparent 55%),
          radial-gradient(ellipse at 15% 85%, rgba(237,231,218,0.08), transparent 60%),
          linear-gradient(135deg, #03101F 0%, #082848 22%, #054238 58%, #0A5440 100%)
        `,
        height:     "100%",
        width:      "100%",
        alignSelf:  "stretch",
        boxShadow:  "0 30px 80px -20px rgba(3,16,31,0.45), inset 0 1px 0 rgba(237,231,218,0.08)",
        border:     "1px solid rgba(237,231,218,0.10)",
      }}
    >
      {/* Заголовок */}
      <div className="flex items-center gap-2 mb-3 sm:mb-5">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0"
             style={{ background: "rgba(237,231,218,0.10)", border: "1px solid rgba(237,231,218,0.18)" }}>
          <CalcIcon />
        </div>
        <h2 className="text-sm sm:text-base md:text-lg font-extrabold text-white">
          Калькулятор рассрочки
        </h2>
      </div>

      {/* Ссылка WB */}
      {withLink && (
        <div className="mb-6">
          <label className="block text-white/75 text-xs font-medium mb-2">
            Ссылка на товар(ы) или корзину:
          </label>
          <input
            type="url"
            value={wbUrl}
            onChange={e => setWbUrl(e.target.value)}
            placeholder="https://www.wildberries.ru/catalog/..."
            className="w-full rounded-xl bg-white/15 border border-white/20 text-white
                       placeholder-white/35 px-4 py-3 text-sm outline-none
                       focus:border-white/60 transition-colors"
          />
        </div>
      )}

      {/* Слайдеры */}
      <style>{`
        .calc-inputs-row { display: flex; flex-direction: column; gap: 12px; }
        @media (min-width: 640px) {
          .calc-inputs-row {
            flex-direction: row !important;
            align-items: flex-end !important;
            gap: 20px !important;
          }
          .calc-inputs-row > * { flex: 1 1 0; min-width: 0; }
          .slider-label { min-height: 3rem !important; }
          .slider-hint { min-height: 14px !important; }
        }
        .slider-hint { min-height: 0; }
      `}</style>
      <div className="calc-inputs-row mb-4">

        {/* Стоимость */}
        <NumberSlider
          label="Стоимость товара или услуги:"
          value={price} unit="₽" trackPct={pricePct}
          min={MIN_PRICE} max={MAX_PRICE} step={500}
          format onChange={handlePriceChange}
        />

        {/* Первоначальный взнос — от 25%, можно поднять до 90%. */}
        <NumberSlider
          label="Первоначальный взнос (от 25%):"
          value={down} unit="₽" trackPct={0} noTrack
          min={result.minDown} max={maxDown} step={500}
          format onChange={setDown}
          warn={!result.isValidDown}
          hint={result.bonus > 0
            ? `Бонус за крупный взнос: −${fmtRub(result.bonus)} ₽ с наценки`
            : `Минимум ${fmtRub(result.minDown)} ₽ (25%) · больше взнос — меньше переплата`}
        />

        {/* Количество платежей */}
        <NumberSlider
          label="Количество платежей:"
          value={term} unit="платежей" trackPct={termPct}
          min={MIN_TERM} max={MAX_TERM} step={1}
          onChange={setTerm}
          hint="1-й платёж — взнос, остальные ежемесячно"
        />
      </div>

      {/* Предупреждение: взнос ниже минимума */}
      {!result.isValidDown && (
        <div className="mb-4 flex items-start gap-2 bg-orange-500/20 border border-orange-400/40
                        rounded-xl px-4 py-3 text-white/90 text-sm">
          <span className="shrink-0">⚠️</span>
          Взнос ниже минимума — {fmtRub(result.minDown)}&nbsp;₽&nbsp;
          ({Math.round(result.minDownPct * 100)}% от стоимости)
        </div>
      )}

      {/* Результаты — 2 главные карточки */}
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mb-2 sm:mb-3">
        <ResultCell label="Платёж / мес" value={result.monthly} />
        <ResultCell label="Итого"        value={result.total}   />
      </div>

      {/* Наценка · Ставка (только для админов) · Поручители — строкой текстом */}
      <p className="text-white/55 text-[11px] sm:text-xs mb-3 sm:mb-4 text-center leading-relaxed">
        Наценка:{" "}
        <span className="text-white font-semibold tabular-nums">
          {fmtRub(result.markup)}&nbsp;₽
        </span>
        {isAdmin && (
          <>
            <span className="text-white/30 mx-2">·</span>
            Ставка:{" "}
            <span className="text-white font-semibold tabular-nums">
              {(result.rate * 100).toFixed(1)}%/мес
            </span>
          </>
        )}
        <span className="text-white/30 mx-2">·</span>
        Поручители:{" "}
        <span className="text-white font-semibold">
          {guarantors === 0
            ? "не требуются"
            : guarantors === 1
              ? "1 поручитель"
              : "2 поручителя"}
        </span>
      </p>

      {/* Кнопка заявки */}
      <div className="flex justify-center">
        <button
          onClick={() =>
            openModal({ price, down, term, monthly: result.monthly, wbUrl: wbUrl || undefined })
          }
          className="px-8 sm:px-12 py-2 sm:py-2.5 font-extrabold text-xs sm:text-sm
                     rounded-full hover:opacity-90 active:scale-95 transition-all shadow-md"
          style={{ background: "#EDE7DA", color: "#03101F" }}
        >
          Подать заявку
        </button>
      </div>
    </div>
  );
}

// Слайдер

interface SliderProps {
  label:        string;
  value:        number;
  unit:         string;
  trackPct:     number;
  min:          number;
  max:          number;
  step:         number;
  onChange:     (v: number) => void;
  warn?:        boolean;
  format?:      boolean;
  noTrack?:     boolean;
  hint?:        string;
  /** Опц. слот между label и input — для алерта/подсказки прямо под подписью. */
  belowLabel?:  React.ReactNode;
}

function NumberSlider({
  label, value, unit, trackPct,
  min, max, step, onChange,
  warn = false, format = false, noTrack = false, hint, belowLabel,
}: SliderProps) {
  const toDisplay = (n: number) => (format ? addSpaces(n) : String(n));
  const [raw,     setRaw]     = useState(toDisplay(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setRaw(toDisplay(value));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function parse(s: string): number {
    return format ? stripSpaces(s) : Number(s);
  }

  function handleFocus() {
    setFocused(true);
    if (format) setRaw(String(value));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const str = e.target.value;
    setRaw(str);
    if (str === "") return;
    const n = parse(str);
    if (!isNaN(n) && n >= 0) onChange(Math.max(min, Math.min(max, n)));
  }

  function handleBlur() {
    setFocused(false);
    const n = parse(raw);
    if (raw === "" || isNaN(n) || n < 0) {
      setRaw(toDisplay(value));
    } else {
      const clamped = Math.max(min, Math.min(max, n));
      setRaw(toDisplay(clamped));
      onChange(clamped);
    }
  }

  // Для слайдера "Количество платежей" показываем склонение в unit-бейдже
  const displayUnit = unit === "платежей" ? pluralPayment(value).split(" ")[1] : unit;

  const trackStyle = noTrack
    ? { background: "rgba(237,231,218,0.20)", accentColor: "#EDE7DA" as const }
    : { background: `linear-gradient(to right, #EDE7DA ${trackPct}%, rgba(237,231,218,0.18) ${trackPct}%)`, accentColor: "#EDE7DA" as const };

  return (
    <div
      className="flex flex-col w-full"
      style={{ marginTop: 0, paddingTop: 0, paddingBottom: 0 }}
    >
      <p
        className="slider-label text-white/70 text-[11px] sm:text-xs font-medium mb-1.5 sm:mb-2 leading-snug line-clamp-2"
        style={{
          marginTop:  0,
          paddingTop: 0,
          display:    "flex",
          alignItems: "flex-end",
        }}
      >
        {label}
      </p>
      {belowLabel}
      <div className={`flex items-center bg-white rounded-xl overflow-hidden border mb-3 transition-colors
                       ${warn ? "border-orange-400" : "border-transparent"}`}>
        <input
          type="text"
          inputMode="numeric"
          value={raw}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="flex-1 min-w-0 px-3 py-2.5 text-[#0A1628] text-sm font-bold
                     text-right outline-none bg-transparent"
        />
        <span className="px-3 text-[#6B7280] text-xs font-medium border-l border-[#D8E2F0] shrink-0">
          {displayUnit}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full"
        style={trackStyle}
      />
      {/* Hint placeholder — рендерится всегда для одинакового низа всех слайдеров */}
      <p className="slider-hint text-white/40 text-[10px] mt-1.5 leading-snug">
        {hint || " "}
      </p>
    </div>
  );
}

// Ячейка результата

function ResultCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 bg-white/10 border border-white/15 rounded-xl px-2 py-2.5 text-center">
      <p className="text-white/55 text-[10px] leading-tight mb-1 whitespace-nowrap">{label}</p>
      <p className="text-base sm:text-lg lg:text-xl font-extrabold text-white leading-tight tabular-nums">
        {fmtRub(value)}<span className="text-[9px] sm:text-[10px] font-medium text-white/50"> ₽</span>
      </p>
    </div>
  );
}

// Иконка

function CalcIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="16" height="16" rx="3" stroke="white" strokeWidth="1.5" />
      <line x1="5"  y1="7"  x2="15" y2="7"  stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="5"  y1="11" x2="9"  y2="11" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="5"  y1="14" x2="9"  y2="14" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="12" y1="11" x2="15" y2="11" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="12" y1="14" x2="15" y2="14" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
