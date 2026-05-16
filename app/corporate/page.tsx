"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useAppModal } from "@/lib/modal-context";
import { calcInstallment, calcInstallmentIsoIRR, getMinDownPct } from "@/lib/calculator-logic";
import { corporateMarkupRounded, corporateIrrMonthly, corporateIrrAnnual } from "@/lib/finance/iso-irr";
const MAX_PRICE           = 150_000;
const MIN_PRICE           = 5_000;
const MAX_TERM            = 6;
const MIN_TERM            = 3;
const MAX_DOWN_PCT        = 0.60;
const HIGH_PRICE_THRESHOLD = 50_000;
const MIN_DOWN_PCT_HIGH    = 0.20;

function fmt(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "0";
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function addSpaces(n: number): string {
  return fmt(n);
}

function stripSpaces(s: string): number {
  return Number(s.replace(/[\s ]/g, ""));
}

export default function CorporateCalculatorPage() {
  const [price, setPrice] = useState(50_000);
  const [down,  setDown]  = useState(0);
  const [term,  setTerm]  = useState(6);
  const [isAdmin, setIsAdmin] = useState(false);

  const { openModal } = useAppModal();

  /* Проверяем роль: ставку показываем только админам/модерам */
  useEffect(() => {
    fetch("/api/lk/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.adminRole) setIsAdmin(true);
      })
      .catch(() => {});
  }, []);

  const result = useMemo(() => {
    const downPct   = price > 0 ? down / price : 0;
    const markupPct = corporateMarkupRounded(term, downPct);
    const markup    = Math.round(price * markupPct);
    const total     = price + markup;
    const monthly   = down > 0
      ? Math.ceil((total - down) / Math.max(1, term - 1))
      : Math.ceil(total / term);
    return { markup, total, monthly, markupPct };
  }, [price, down, term]);

  /* Загружаем iso-IRR политику (как на главной) для честного сравнения */
  const [policy, setPolicy] = useState<{ inflation: number; overrides: Record<string, number>; loaded: boolean }>({
    inflation: 0.12, overrides: {}, loaded: false,
  });
  useEffect(() => {
    fetch("/api/finance/public-config")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && typeof d.expectedInflationAnnual === "number") {
          setPolicy({ inflation: d.expectedInflationAnnual, overrides: d.matrixOverrides ?? {}, loaded: true });
        }
      })
      .catch(() => {});
  }, []);

  /* Стандартный сценарий: тот же расчёт что на главной + требуемый стандартом
     минимальный взнос (25% при ≥50к), т.к. с меньшим стандарт не дал бы рассрочку */
  const standard = useMemo(() => {
    const stdMinDown = Math.ceil(price * getMinDownPct(price));
    const stdDown    = Math.max(down, stdMinDown);
    return policy.loaded
      ? calcInstallmentIsoIRR(price, stdDown, term, policy.inflation, policy.overrides)
      : calcInstallment({ price, down: stdDown, term });
  }, [price, down, term, policy]);

  const savingsTotal = Math.max(0, standard.total - result.total);

  const isHighPrice  = price > HIGH_PRICE_THRESHOLD;
  const minDown      = isHighPrice ? Math.ceil(price * MIN_DOWN_PCT_HIGH) : 0;
  const maxDown      = Math.floor(price * MAX_DOWN_PCT);
  const isValidDown  = down >= minDown;
  const pricePct     = ((price - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;
  const termPct      = ((term  - MIN_TERM)  / (MAX_TERM  - MIN_TERM))  * 100;

  function handlePriceChange(v: number) {
    setPrice(v);
    const wasHigh = price > HIGH_PRICE_THRESHOLD;
    const isHigh  = v > HIGH_PRICE_THRESHOLD;
    const newMinD = isHigh ? Math.ceil(v * MIN_DOWN_PCT_HIGH) : 0;
    const newMaxD = Math.floor(v * MAX_DOWN_PCT);
    if (!wasHigh && isHigh) {
      setDown(newMinD);
    } else {
      setDown(d => Math.max(newMinD, Math.min(newMaxD, d)));
    }
  }

  return (
    <main className="min-h-screen py-6 sm:py-10"
          style={{ background: "linear-gradient(160deg, #EBF5F0 0%, #F4F7FC 55%, #EDF1F8 100%)" }}>
      <div className="max-w-[760px] mx-auto px-4 sm:px-6">

        {/* Header — компактный */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1.5"
                  style={{ background: "rgba(12,122,88,0.10)", color: "#0C7A58", border: "1px solid rgba(12,122,88,0.25)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#0C7A58] animate-pulse" />
              Корпоративный тариф
            </span>
            <h1 className="text-lg sm:text-xl font-extrabold text-[#0A1628] tracking-tight">
              Калькулятор для сотрудников
            </h1>
          </div>
        </div>

        {/* Disclaimer — тонкий */}
        <div className="mb-3 rounded-xl px-3 py-2 flex items-center gap-2 text-xs"
             style={{ background: "rgba(200,151,43,0.10)", border: "1px solid rgba(200,151,43,0.25)", color: "#5C4516" }}>
          <span className="text-[#C8972B] shrink-0">⚠️</span>
          <span>Доступно <b>только для сотрудников Rise, Maximum и Mayralla</b>.</span>
        </div>

        {/* Calculator card — deep emerald */}
        <div
          className="rounded-2xl p-4 sm:p-5 flex flex-col overflow-hidden relative"
          style={{
            background: `
              radial-gradient(ellipse at 85% 15%, rgba(12,122,88,0.40), transparent 55%),
              radial-gradient(ellipse at 15% 85%, rgba(237,231,218,0.08), transparent 60%),
              linear-gradient(135deg, #03101F 0%, #082848 22%, #054238 58%, #0A5440 100%)
            `,
            boxShadow: "0 24px 60px -20px rgba(3,16,31,0.45), inset 0 1px 0 rgba(237,231,218,0.08)",
            border:    "1px solid rgba(237,231,218,0.10)",
          }}
        >
          {/* Title row */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                 style={{ background: "rgba(237,231,218,0.10)", border: "1px solid rgba(237,231,218,0.18)" }}>
              <CalcIcon />
            </div>
            <h2 className="text-sm sm:text-base font-extrabold" style={{ color: "#EDE7DA" }}>
              Калькулятор рассрочки
            </h2>
          </div>

          {/* Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <Slider
              label="Стоимость товара или услуги"
              value={price} unit="₽" trackPct={pricePct}
              min={MIN_PRICE} max={MAX_PRICE} step={500}
              format onChange={handlePriceChange}
              hint={`до ${fmt(MAX_PRICE)} ₽`}
            />
            <Slider
              label={isHighPrice ? "Первоначальный взнос (мин. 20%)" : "Первоначальный взнос"}
              value={down} unit="₽" trackPct={0} noTrack
              min={minDown} max={maxDown} step={500}
              format onChange={setDown}
              hint={isHighPrice ? `мин. ${fmt(minDown)} ₽` : "по желанию"}
              warn={!isValidDown}
            />
            <Slider
              label="Количество платежей"
              value={term} unit="мес" trackPct={termPct}
              min={MIN_TERM} max={MAX_TERM} step={1}
              onChange={setTerm}
              hint={`до ${MAX_TERM} мес`}
            />
          </div>

          {/* Info banner — компактный */}
          <div className={`mb-2 flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px]
                           ${isHighPrice
                             ? "bg-[#C8972B]/15 border border-[#C8972B]/35 text-[#E8B84B]"
                             : ""}`}
               style={isHighPrice ? undefined : { background: "rgba(237,231,218,0.05)", border: "1px solid rgba(237,231,218,0.08)", color: "rgba(237,231,218,0.6)" }}>
            <span className="shrink-0">{isHighPrice ? "⚠️" : "ⓘ"}</span>
            <span>
              При сумме свыше <b>{fmt(HIGH_PRICE_THRESHOLD)} ₽</b> взнос от 20%
              {isHighPrice && <>{" "}· мин. <b>{fmt(minDown)} ₽</b></>}
            </span>
          </div>

          {!isValidDown && (
            <div className="mb-2 flex items-center gap-2 bg-orange-500/20 border border-orange-400/40 rounded-lg px-2.5 py-1.5 text-white/90 text-[11px]">
              <span className="shrink-0">⚠️</span>
              Взнос ниже минимума — {fmt(minDown)} ₽
            </div>
          )}

          {/* Results — компактные ячейки */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            {/* Платёж / мес */}
            <div className="min-w-0 rounded-lg px-3 py-2 text-center"
                 style={{ background: "rgba(237,231,218,0.06)", border: "1px solid rgba(237,231,218,0.10)" }}>
              <p className="text-[10px] leading-tight mb-0.5" style={{ color: "rgba(237,231,218,0.5)" }}>Платёж / мес</p>
              <p className="text-base sm:text-lg font-extrabold leading-tight tabular-nums" style={{ color: "#EDE7DA" }}>
                {fmt(result.monthly)}<span className="text-[10px] font-medium" style={{ color: "rgba(237,231,218,0.5)" }}> ₽</span>
              </p>
            </div>
            {/* Итого — с перечёркнутой стандартной суммой */}
            <div className="min-w-0 rounded-lg px-3 py-2 text-center"
                 style={{ background: "rgba(237,231,218,0.06)", border: "1px solid rgba(237,231,218,0.10)" }}>
              <p className="text-[10px] leading-tight mb-0.5" style={{ color: "rgba(237,231,218,0.5)" }}>Итого</p>
              <p className="text-base sm:text-lg font-extrabold leading-tight tabular-nums" style={{ color: "#EDE7DA" }}>
                {savingsTotal > 0 && (
                  <span className="line-through mr-1.5" style={{ color: "rgba(237,231,218,0.35)" }}>
                    {fmt(standard.total)}
                  </span>
                )}
                {fmt(result.total)}<span className="text-[10px] font-medium" style={{ color: "rgba(237,231,218,0.5)" }}> ₽</span>
              </p>
            </div>
          </div>

          {/* Наценка · Ставка (только для админов) · Поручители — одна строка */}
          <p className="text-[10px] sm:text-[11px] mb-3 text-center"
             style={{ color: "rgba(237,231,218,0.5)" }}>
            Наценка <b style={{ color: "#EDE7DA" }}>{fmt(result.markup)} ₽</b>
            {" "}({(result.markupPct * 100).toFixed(0)}%)
            {isAdmin && (
              <>
                <span className="mx-1.5" style={{ color: "rgba(237,231,218,0.25)" }}>·</span>
                Таргет IRR <b style={{ color: "#EDE7DA" }}>{(corporateIrrMonthly() * 100).toFixed(1)}%/мес</b>
                {" "}({(corporateIrrAnnual() * 100).toFixed(0)}%/год)
              </>
            )}
            <span className="mx-1.5" style={{ color: "rgba(237,231,218,0.25)" }}>·</span>
            <b style={{ color: "#EDE7DA" }}>Без поручителей</b>
          </p>

          {/* Savings — компактный */}
          {savingsTotal > 0 && (
            <div
              className="mb-3 rounded-xl px-3 sm:px-4 py-2 flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, rgba(63,207,165,0.12) 0%, rgba(63,207,165,0.04) 100%)",
                border: "1px solid rgba(63,207,165,0.30)",
              }}
            >
              <span className="text-[10px] uppercase tracking-wider font-extrabold" style={{ color: "#3FCFA5" }}>
                Меньше на
              </span>
              <span className="font-extrabold tabular-nums tracking-tight text-lg sm:text-xl" style={{ color: "#EDE7DA" }}>
                {fmt(savingsTotal)} ₽
              </span>
              <span className="text-[10px] uppercase tracking-wider font-extrabold" style={{ color: "#3FCFA5" }}>
                для сотрудников
              </span>
            </div>
          )}

          {/* CTA */}
          <div className="flex justify-center">
            <button
              onClick={() =>
                openModal({
                  price, down, term,
                  monthly:   result.monthly,
                  productName: "Корпоративная рассрочка (Rise / Maximum / Mayralla)",
                })
              }
              className="px-8 sm:px-10 py-2 sm:py-2.5 font-extrabold text-xs sm:text-sm
                         rounded-full hover:opacity-90 active:scale-95 transition-all shadow-md"
              style={{ background: "#EDE7DA", color: "#03101F" }}
            >
              Подать заявку
            </button>
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-5 text-xs text-[#9CA3AF] text-center">
          Не являетесь сотрудником этих компаний?{" "}
          <Link href="/" className="text-[#0C7A58] hover:underline font-semibold">
            Откройте обычный калькулятор →
          </Link>
        </p>

      </div>
    </main>
  );
}

/* ─── Slider ─── */
interface SliderProps {
  label: string;
  value: number;
  unit: string;
  trackPct: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: boolean;
  noTrack?: boolean;
  hint?: string;
  warn?: boolean;
}

function Slider({ label, value, unit, trackPct, min, max, step, onChange, format = false, noTrack = false, hint, warn = false }: SliderProps) {
  const toDisplay = (n: number) => format ? addSpaces(n) : String(n);
  const [raw, setRaw] = useState(toDisplay(value));
  const [focused, setFocused] = useState(false);

  if (!focused && raw !== toDisplay(value)) {
    setRaw(toDisplay(value));
  }

  const trackStyle = noTrack
    ? { background: "rgba(237,231,218,0.20)", accentColor: "#EDE7DA" as const }
    : { background: `linear-gradient(to right, #EDE7DA ${trackPct}%, rgba(237,231,218,0.18) ${trackPct}%)`, accentColor: "#EDE7DA" as const };

  return (
    <div className="flex flex-col">
      <p className="text-[11px] sm:text-xs font-medium mb-1.5" style={{ color: "rgba(237,231,218,0.7)" }}>
        {label}:
      </p>
      <div className={`flex items-center bg-white rounded-xl overflow-hidden mb-2.5 border transition-colors ${warn ? "border-orange-400" : "border-transparent"}`}>
        <input
          type="text"
          inputMode="numeric"
          value={raw}
          onChange={e => {
            setRaw(e.target.value);
            const n = format ? stripSpaces(e.target.value) : Number(e.target.value);
            if (!isNaN(n) && n >= 0) onChange(Math.max(min, Math.min(max, n)));
          }}
          onFocus={() => { setFocused(true); if (format) setRaw(String(value)); }}
          onBlur={() => {
            setFocused(false);
            const n = format ? stripSpaces(raw) : Number(raw);
            if (raw === "" || isNaN(n) || n < 0) setRaw(toDisplay(value));
            else {
              const c = Math.max(min, Math.min(max, n));
              setRaw(toDisplay(c));
              onChange(c);
            }
          }}
          className="flex-1 min-w-0 px-3 py-2.5 text-[#0A1628] text-sm font-bold text-right outline-none bg-transparent"
        />
        <span className="px-3 text-[#6B7280] text-xs font-medium border-l border-[#D8E2F0] shrink-0">{unit}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full"
        style={trackStyle}
      />
      <p className="text-[10px] mt-1.5" style={{ color: "rgba(237,231,218,0.40)" }}>
        {hint || " "}
      </p>
    </div>
  );
}


function CalcIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="16" height="16" rx="3" stroke="#EDE7DA" strokeWidth="1.5" />
      <line x1="5"  y1="7"  x2="15" y2="7"  stroke="#EDE7DA" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="5"  y1="11" x2="9"  y2="11" stroke="#EDE7DA" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="5"  y1="14" x2="9"  y2="14" stroke="#EDE7DA" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="12" y1="11" x2="15" y2="11" stroke="#EDE7DA" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="12" y1="14" x2="15" y2="14" stroke="#EDE7DA" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
