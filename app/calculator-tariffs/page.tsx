"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  TARIFFS, TARIFF_SCALE, type TariffKey,
  MIN_PRICE_TARIFF, MAX_PRICE_TARIFF,
  MIN_TERM_TARIFF, MAX_TERM_TARIFF,
  calcByTariff, pluralPayments, tariffForPrice,
} from "@/lib/calculator-tariffs";
import { useAppModal } from "@/lib/modal-context";

function addSpaces(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
function stripSpaces(s: string): number {
  const cleaned = s.replace(/\s| /g, "");
  return parseInt(cleaned, 10) || 0;
}

/** Короткая подпись диапазона сумм под шкалой тарифов. */
const SCALE_RANGE: Record<TariffKey, string> = {
  light:  "8–50 тыс ₽",
  small:  "50–200 тыс ₽",
  medium: "200–500 тыс ₽",
  large:  "0,5–1 млн ₽",
};

export default function CalculatorTariffsPage() {
  const { openModal } = useAppModal();
  const [price, setPrice] = useState(100_000);
  const [down,  setDown]  = useState(25_000);
  const [term,  setTerm]  = useState(6);

  // Тариф определяется суммой автоматически — переключать ничего не нужно
  const tariff = useMemo(() => tariffForPrice(price), [price]);
  const spec   = TARIFFS[tariff];

  const minDown = spec.needsDown ? Math.round(price / 4) : 0;
  const maxDown = Math.round(price * 0.6);

  const result = useMemo(
    () => calcByTariff({ tariff, price, down, term }),
    [tariff, price, down, term],
  );

  // Изменение цены: пересобираем взнос под новый тариф (доля сохраняется)
  function handlePriceChange(v: number) {
    const clamped  = Math.min(MAX_PRICE_TARIFF, Math.max(MIN_PRICE_TARIFF, v));
    const newSpec  = TARIFFS[tariffForPrice(clamped)];
    setPrice(clamped);
    if (!newSpec.needsDown) {
      setDown(0);
    } else {
      const newMin = Math.round(clamped / 4);
      const newMax = Math.round(clamped * 0.6);
      setDown(d => {
        const ratio  = price > 0 && d > 0 ? d / price : 0.25;
        const scaled = Math.round((clamped * Math.max(0.25, ratio)) / 500) * 500;
        return Math.max(newMin, Math.min(newMax, scaled));
      });
    }
  }

  function handleBuy() {
    openModal({
      productName: `Расчёт рассрочки · тариф ${spec.label}`,
      price,
      down,
      term,
      monthly: result.monthly,
    });
  }

  return (
    <main>
      <div className="bg-[#F4F7FC] border-b border-[#D8E2F0]">
        <div className="section py-3 text-xs text-[#9CA3AF] flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-[#1A3C6E] transition-colors">Главная</Link>
          <span>/</span>
          <span className="text-[#0A1628]">Калькулятор рассрочки</span>
        </div>
      </div>

      <div className="section py-8 max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0A1628] mb-2">
          Калькулятор рассрочки
        </h1>
        <p className="text-[#6B7280] text-sm mb-6">
          Один калькулятор — ставка наценки подбирается автоматически по сумме
          покупки: от 3% до 4,5% в месяц. Переключать тарифы не нужно.
        </p>

        {/* ── Шкала тарифов (только индикатор, не переключатель) ── */}
        <div className="rounded-2xl bg-white border border-[#E5E7EB] p-4 mb-4">
          <p className="text-xs font-semibold text-[#6B7280] mb-3">
            Чем больше сумма — тем ниже ставка наценки:
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {TARIFF_SCALE.map(key => {
              const t = TARIFFS[key];
              const active = key === tariff;
              return (
                <div key={key}
                  className={`rounded-xl px-2 py-2.5 text-center transition-all border
                    ${active
                      ? "bg-[#0A1628] border-[#0A1628] shadow-md"
                      : "bg-[#F4F7FC] border-transparent"}`}>
                  <div className={`font-extrabold text-[11px]
                    ${active ? "text-white" : "text-[#9CA3AF]"}`}>
                    {t.label}
                  </div>
                  <div className={`text-[14px] font-extrabold tabular-nums my-0.5
                    ${active ? "text-[#C8972B]" : "text-[#9CA3AF]"}`}>
                    {(t.monthRate * 100).toFixed(1)}%
                  </div>
                  <div className={`text-[9px] leading-tight
                    ${active ? "text-white/60" : "text-[#9CA3AF]"}`}>
                    {SCALE_RANGE[key]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Карточка с ползунками ── */}
        <div className="rounded-3xl bg-gradient-to-br from-[#0E2344] to-[#0A1628] text-white p-6 sm:p-8 mb-6">
          {/* Price */}
          <NumField
            label="Стоимость товара или услуги:"
            value={price}
            onChange={handlePriceChange}
            min={MIN_PRICE_TARIFF} max={MAX_PRICE_TARIFF} step={1_000}
            hint={`Тариф ${spec.label} · наценка ${(spec.monthRate * 100).toFixed(1)}% / мес`}
          />

          {/* Down (если нужен по тарифу) */}
          {spec.needsDown ? (
            <NumField
              label="Первоначальный взнос (мин. 25%):"
              value={down}
              onChange={setDown}
              min={minDown} max={maxDown} step={500}
              hint={
                result.bonus > 0
                  ? `Бонус за крупный взнос: −${addSpaces(result.bonus)} ₽ с наценки`
                  : `Минимум ${addSpaces(minDown)} ₽ · больше взнос — меньше наценка`
              }
            />
          ) : (
            <div className="mb-5 px-4 py-3 rounded-xl bg-white/8 border border-white/15 text-[12px] text-white/70">
              ℹ️ Для суммы до 50 000 ₽ первоначальный взнос не требуется.
            </div>
          )}

          {/* Term */}
          <NumField
            label="Количество платежей:"
            value={term}
            onChange={setTerm}
            min={MIN_TERM_TARIFF} max={MAX_TERM_TARIFF} step={1}
            unitLabel={pluralPayments(term)}
            hint={spec.needsDown
              ? "1-й платёж — взнос, остальные ежемесячно"
              : "Все платежи равные ежемесячные"}
          />

          {/* Validation */}
          {spec.needsDown && !result.isValidDown && (
            <div className="mb-4 flex items-start gap-2 bg-orange-500/20 border border-orange-400/40
                            rounded-xl px-4 py-3 text-white/90 text-sm">
              <span className="shrink-0">⚠️</span>
              Минимальный взнос для этой суммы: {addSpaces(result.minDown)} ₽
            </div>
          )}

          {/* Results */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <ResultCard label="Платёж / мес" value={result.monthly} />
            <ResultCard label="Итого" value={result.total} />
          </div>

          <p className="text-white/55 text-xs text-center leading-relaxed mb-4">
            Наценка:{" "}
            <span className="text-white font-semibold tabular-nums">
              {addSpaces(result.markup)}&nbsp;₽
            </span>
            {" · "}
            На 1 платёж:{" "}
            <span className="text-white font-semibold tabular-nums">
              {addSpaces(result.feePerMonth)}&nbsp;₽
            </span>
            {spec.guarantors > 0 && (
              <>
                {" · "}
                Поручители:{" "}
                <span className="text-white font-semibold">
                  {spec.guarantors === 1 ? "1 поручитель" : `${spec.guarantors} поручителя`}
                </span>
              </>
            )}
          </p>

          <button onClick={handleBuy}
            className="w-full py-3.5 rounded-full text-sm font-extrabold text-white
                       bg-[#0C7A58] hover:bg-[#0A6347] active:scale-[0.99]
                       transition-all shadow-md">
            Подать заявку
          </button>
        </div>

        {/* ── Условия текущего тарифа ── */}
        <div className="rounded-2xl bg-white border border-[#E5E7EB] p-5">
          <h2 className="font-extrabold text-[#0A1628] text-base mb-3">
            Условия для суммы {addSpaces(price)} ₽ — тариф {spec.label}
          </h2>
          <ul className="text-sm text-[#6B7280] space-y-1.5">
            <li>• Наценка <strong className="text-[#0A1628]">{(spec.monthRate * 100).toFixed(1)}% / мес</strong> × количество платежей</li>
            <li>• {spec.needsDown ? "Первоначальный взнос — от 25% суммы" : "Без первоначального взноса"}</li>
            <li>• {spec.guarantors === 0
              ? "Без поручителей"
              : spec.guarantors === 1 ? "1 поручитель" : "2 поручителя"}</li>
            <li>• Сумма покупки — до {addSpaces(spec.maxPrice)} ₽</li>
            {spec.needsDown && (
              <li>• Взнос больше минимума → 10% от превышения возвращается скидкой с наценки</li>
            )}
          </ul>
        </div>
      </div>
    </main>
  );
}

/* ── Small inline UI helpers ──────────────────────────────────────────── */

function NumField({ label, value, onChange, min, max, step, hint, unitLabel }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  hint?: string;
  unitLabel?: string;
}) {
  const [raw, setRaw] = useState(addSpaces(value));
  const [focused, setFocused] = useState(false);
  useEffect(() => { if (!focused) setRaw(addSpaces(value)); }, [value, focused]);

  const pct = ((value - min) / Math.max(1, max - min)) * 100;

  return (
    <div className="mb-5">
      <p className="text-white/70 text-xs font-medium mb-2">{label}</p>
      <div className="flex items-center bg-white rounded-xl overflow-hidden border-2 border-transparent mb-3
                      focus-within:border-[#C8972B]/60">
        <input
          type="text" inputMode="numeric"
          value={raw}
          onFocus={() => { setFocused(true); setRaw(String(value)); }}
          onBlur={() => {
            setFocused(false);
            const n = stripSpaces(raw);
            const clamped = Math.max(min, Math.min(max, n));
            setRaw(addSpaces(clamped));
            onChange(clamped);
          }}
          onChange={e => {
            setRaw(e.target.value);
            const n = stripSpaces(e.target.value);
            if (n >= 0) onChange(Math.max(min, Math.min(max, n)));
          }}
          className="flex-1 min-w-0 px-3 py-2.5 text-[#0A1628] text-sm font-bold
                     text-right outline-none bg-transparent"
        />
        <span className="px-3 py-2.5 text-[#9CA3AF] text-sm font-semibold border-l border-[#E5E7EB]">
          {unitLabel ?? "₽"}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full"
        style={{
          background: `linear-gradient(to right, #EDE7DA ${pct}%, rgba(237,231,218,0.18) ${pct}%)`,
          accentColor: "#EDE7DA",
        }}
      />
      {hint && <p className="text-white/40 text-[10px] mt-1.5 leading-snug">{hint}</p>}
    </div>
  );
}

function ResultCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-[#EDE7DA] text-[#0A1628] px-3 sm:px-4 py-3 text-center">
      <p className="text-[10px] uppercase tracking-wider font-bold text-[#1A3C6E]/70 mb-0.5">
        {label}
      </p>
      <p className="font-extrabold text-base sm:text-xl tabular-nums">
        {addSpaces(value)}&nbsp;₽
      </p>
    </div>
  );
}
