"use client";

import { useState, useEffect } from "react";
import {
  calcInstallment,
  fmtRub,
  getMinDownPct,
  MIN_PRICE,
  MAX_PRICE,
  MIN_TERM,
  MAX_TERM,
  HIGH_PRICE_THRESHOLD,
} from "@/lib/calculator-logic";
import { useAppModal } from "@/lib/modal-context";

// ─── Форматирование ───────────────────────────────────────────

/** 30000 → «30 000» (неразрывный пробел как разделитель тысяч) */
function addSpaces(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "0";
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** «30 000» или «30000» → 30000 */
function stripSpaces(s: string): number {
  return Number(s.replace(/[\s ]/g, ""));
}

// ─── Максимальный взнос ────────────────────────────────────────

const MAX_DOWN_PCT = 0.60;   // 60 %

// ─── Props ────────────────────────────────────────────────────

interface Props {
  withLink?:     boolean;
  initialPrice?: number;
}

// ─── Главный компонент ────────────────────────────────────────

export function Calculator({ withLink = false, initialPrice }: Props) {
  const startPrice = initialPrice ?? 30_000;

  const [price,     setPrice]     = useState(startPrice);
  const [down,      setDown]      = useState(Math.ceil(startPrice * getMinDownPct(startPrice)));
  const [term,      setTerm]      = useState(6);
  const [wbUrl,     setWbUrl]     = useState("");
  const { openModal } = useAppModal();

  const result = calcInstallment({ price, down, term });

  // При смене цены: подтягиваем взнос к минимуму, если ушёл ниже
  function handlePriceChange(v: number) {
    setPrice(v);
    const minD = Math.ceil(v * getMinDownPct(v));
    const maxD = Math.floor(v * MAX_DOWN_PCT);
    const clamped = Math.max(minD, Math.min(maxD, down));
    setDown(clamped);
  }

  // Прогресс слайдеров (для зелёной заливки)
  const pricePct = ((price - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;
  const termPct  = ((term  - MIN_TERM)  / (MAX_TERM  - MIN_TERM))  * 100;

  // Лейбл взноса
  const isHighPrice = price > HIGH_PRICE_THRESHOLD;
  const downLabel   = isHighPrice
    ? "Первоначальный взнос (мин. 25%):"
    : "Первоначальный взнос (необязательный):";

  const maxDown = Math.floor(price * MAX_DOWN_PCT);

  return (
    <div
      id="calculator"
      className="rounded-3xl p-6 md:p-10"
      style={{ background: "linear-gradient(135deg, #0E2344 0%, #1E4582 50%, #0C7A58 100%)" }}
    >
      {/* Заголовок */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <CalcIcon />
        </div>
        <h2 className="text-xl md:text-2xl font-extrabold text-white">
          Рассчитайте рассрочку
        </h2>
      </div>

      {/* Поле ссылки (только /wb) */}
      {withLink && (
        <div className="mb-6">
          <label className="block text-white/75 text-xs font-medium mb-2">
            Ссылка на товар(ы) или корзину:
          </label>
          <input
            type="url"
            value={wbUrl}
            onChange={(e) => setWbUrl(e.target.value)}
            placeholder="https://www.wildberries.ru/catalog/..."
            className="w-full rounded-xl bg-white/15 border border-white/20 text-white
                       placeholder-white/35 px-4 py-3 text-sm outline-none
                       focus:border-white/60 transition-colors"
          />
        </div>
      )}

      {/* Слайдеры */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

        {/* Стоимость */}
        <NumberSlider
          label="Стоимость товара или услуги:"
          value={price}
          unit="руб."
          trackPct={pricePct}
          min={MIN_PRICE}
          max={MAX_PRICE}
          step={500}
          format
          onChange={handlePriceChange}
        />

        {/* Взнос — без зелёной линии */}
        <NumberSlider
          label={downLabel}
          value={down}
          unit="руб."
          trackPct={0}
          noTrack
          min={result.minDown}
          max={maxDown}
          step={500}
          format
          onChange={setDown}
          warn={!result.isValidDown}
        />

        {/* Срок */}
        <NumberSlider
          label="Срок рассрочки:"
          value={term}
          unit="мес."
          trackPct={termPct}
          min={MIN_TERM}
          max={MAX_TERM}
          step={1}
          onChange={setTerm}
        />
      </div>

      {/* Предупреждение о минимальном взносе */}
      {!result.isValidDown && (
        <div className="mb-5 flex items-start gap-2 bg-orange-500/20 border border-orange-400/40
                        rounded-xl px-4 py-3 text-white/90 text-sm">
          <span className="shrink-0">⚠️</span>
          Минимальный взнос — {fmtRub(result.minDown)} руб.&nbsp;
          ({Math.round(result.minDownPct * 100)}% от стоимости)
        </div>
      )}

      {/* Кнопка «Рассчитать» (акцентный элемент) */}
      <div className="flex justify-center mb-6">
        <button
          type="button"
          className="px-10 py-3 rounded-full font-bold text-sm text-white
                     border-2 border-white/40 hover:border-white hover:bg-white/10
                     active:scale-95 transition-all"
        >
          Рассчитать
        </button>
      </div>

      {/* Результаты */}
      <div className="grid grid-cols-3 gap-3 md:gap-6 mb-8
                      bg-white/10 rounded-2xl p-5 border border-white/15">
        <ResultCell label="Ежемесячный платёж:" value={result.monthly} />
        <ResultCell label="Наценка:"             value={result.markup}  />
        <ResultCell label="Итоговая стоимость:"  value={result.total}   />
      </div>

      {/* Кнопка заявки */}
      <div className="flex justify-center">
        <button
          onClick={() => openModal({ price, down, term, monthly: result.monthly, wbUrl: wbUrl || undefined })}
          className="w-full md:w-2/3 py-4 bg-white text-[#0A1628] font-extrabold text-base
                     rounded-full hover:bg-white/90 active:scale-95 transition-all shadow-lg"
        >
          Подать заявку
        </button>
      </div>

    </div>
  );
}

// ─── Слайдер с форматированным числовым вводом ────────────────

interface SliderProps {
  label:    string;
  value:    number;
  unit:     string;
  trackPct: number;
  min:      number;
  max:      number;
  step:     number;
  onChange: (v: number) => void;
  warn?:    boolean;
  /** Форматировать тысячи пробелами */
  format?:  boolean;
  /** Убрать зелёную заливку трека */
  noTrack?: boolean;
}

function NumberSlider({
  label, value, unit, trackPct,
  min, max, step, onChange,
  warn = false, format = false, noTrack = false,
}: SliderProps) {
  const toDisplay = (n: number) => (format ? addSpaces(n) : String(n));

  const [raw,     setRaw]     = useState(toDisplay(value));
  const [focused, setFocused] = useState(false);

  // Синхронизируем отображение когда value меняется снаружи (слайдер / смена цены)
  useEffect(() => {
    if (!focused) setRaw(toDisplay(value));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function parse(s: string): number {
    return format ? stripSpaces(s) : Number(s);
  }

  function handleFocus() {
    setFocused(true);
    // На фокусе: показываем чистые цифры без пробелов — удобно редактировать
    if (format) setRaw(String(value));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const str = e.target.value;
    setRaw(str);
    if (str === "") return;           // разрешаем стереть
    const n = parse(str);
    if (!isNaN(n) && n >= 0) onChange(Math.max(min, Math.min(max, n)));
  }

  function handleBlur() {
    setFocused(false);
    const n = parse(raw);
    if (raw === "" || isNaN(n) || n < 0) {
      setRaw(toDisplay(value));       // восстановить
    } else {
      const clamped = Math.max(min, Math.min(max, n));
      setRaw(toDisplay(clamped));
      onChange(clamped);
    }
  }

  const trackStyle = noTrack
    ? { background: "rgba(255,255,255,0.20)" }
    : { background: `linear-gradient(to right, #10B981 ${trackPct}%, rgba(255,255,255,0.20) ${trackPct}%)` };

  return (
    <div>
      <p className="text-white/70 text-xs font-medium mb-2 leading-snug">{label}</p>

      {/* Поле ввода */}
      <div
        className={`flex items-center bg-white rounded-xl overflow-hidden border mb-3 transition-colors
                    ${warn ? "border-orange-400" : "border-transparent"}`}
      >
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
          {unit}
        </span>
      </div>

      {/* Слайдер */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={trackStyle}
      />
    </div>
  );
}

// ─── Ячейка результата ────────────────────────────────────────

function ResultCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-lg md:text-2xl lg:text-4xl font-extrabold text-white leading-tight">
        {fmtRub(value)}
        <span className="text-xs md:text-sm font-medium text-white/60 ml-1">руб.</span>
      </p>
      <p className="text-white/55 text-[10px] md:text-[11px] mt-1.5 leading-tight">{label}</p>
    </div>
  );
}

// ─── Иконка ───────────────────────────────────────────────────

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
