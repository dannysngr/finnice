"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  TARIFFS, TARIFF_ORDER,
  MIN_PRICE_TARIFF, MAX_PRICE_TARIFF, MIN_TERM_TARIFF,
  LIGHT_MAX_PRICE, LIGHT_MAX_TERM, FULL_MAX_TERM,
  calcByTariff, downForPrice, resolveTariff, lightAvailable,
  pluralPayments, pluralGuarantors,
} from "@/lib/calculator-tariffs";
import { useAppModal } from "@/lib/modal-context";

function addSpaces(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
function stripSpaces(s: string): number {
  const cleaned = s.replace(/\s| /g, "");
  return parseInt(cleaned, 10) || 0;
}

export default function CalculatorTariffsPage() {
  const { openModal } = useAppModal();
  const [price,   setPrice]   = useState(70_000);
  const [hasDown, setHasDown] = useState(true);
  const [term,    setTerm]    = useState(6);

  // Тариф определяется суммой + наличием взноса
  const tariff  = useMemo(() => resolveTariff(price, hasDown), [price, hasDown]);
  const spec    = TARIFFS[tariff];
  const down    = downForPrice(price, hasDown);
  const maxTerm = hasDown ? FULL_MAX_TERM : LIGHT_MAX_TERM;
  const canSkipDown = lightAvailable(price);

  const result = useMemo(
    () => calcByTariff({ tariff, price, down, term }),
    [tariff, price, down, term],
  );

  // Сумма выше 100 000 ₽ — взнос обязателен (Light недоступен)
  function handlePriceChange(v: number) {
    const clamped = Math.min(MAX_PRICE_TARIFF, Math.max(MIN_PRICE_TARIFF, v));
    setPrice(clamped);
    if (clamped > LIGHT_MAX_PRICE && !hasDown) setHasDown(true);
  }

  // Переключение взноса: без взноса → Light, со взносом → Small/Medium/Large
  function handleDownToggle(next: boolean) {
    if (!next && !canSkipDown) return;        // выше 100к взнос убрать нельзя
    setHasDown(next);
    if (!next && term > LIGHT_MAX_TERM) setTerm(LIGHT_MAX_TERM);  // Light — макс 10
  }

  function handleTermChange(v: number) {
    setTerm(Math.min(maxTerm, Math.max(MIN_TERM_TARIFF, v)));
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

      <div className="section py-8 max-w-5xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0A1628] mb-2">
          Калькулятор рассрочки
        </h1>
        <p className="text-[#6B7280] text-sm mb-6">
          Один калькулятор. Введите сумму и решите, вносить ли первоначальный
          взнос — тариф и ставка подберутся автоматически.
        </p>

        <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
        {/* ── Карточка калькулятора ── */}
        <div className="rounded-3xl bg-gradient-to-br from-[#0E2344] to-[#0A1628] text-white p-6 sm:p-8">
          {/* Сумма */}
          <NumField
            label="Стоимость товара или услуги:"
            value={price}
            onChange={handlePriceChange}
            min={MIN_PRICE_TARIFF} max={MAX_PRICE_TARIFF} step={1_000}
            hint={`от ${addSpaces(MIN_PRICE_TARIFF)} ₽ до ${addSpaces(MAX_PRICE_TARIFF)} ₽`}
          />

          {/* Первоначальный взнос — переключатель */}
          <div className="mb-5">
            <p className="text-white/70 text-xs font-medium mb-2">Первоначальный взнос:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDownToggle(false)}
                disabled={!canSkipDown}
                className={`rounded-xl px-3 py-3 text-center transition-all border-2
                  ${!hasDown
                    ? "bg-white text-[#0A1628] border-white shadow-md"
                    : canSkipDown
                      ? "bg-white/8 text-white border-white/15 hover:border-white/40"
                      : "bg-white/5 text-white/30 border-white/10 cursor-not-allowed"}`}>
                <span className="block font-extrabold text-sm">Без взноса</span>
                <span className={`block text-[10px] mt-0.5
                  ${!hasDown ? "text-[#1A3C6E]/70" : "text-white/45"}`}>
                  тариф Light · 4,5% / мес
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleDownToggle(true)}
                className={`rounded-xl px-3 py-3 text-center transition-all border-2
                  ${hasDown
                    ? "bg-white text-[#0A1628] border-white shadow-md"
                    : "bg-white/8 text-white border-white/15 hover:border-white/40"}`}>
                <span className="block font-extrabold text-sm">
                  Взнос 25% · {addSpaces(downForPrice(price, true))} ₽
                </span>
                <span className={`block text-[10px] mt-0.5
                  ${hasDown ? "text-[#1A3C6E]/70" : "text-white/45"}`}>
                  ставка ниже · до 12 платежей
                </span>
              </button>
            </div>
            {!canSkipDown && (
              <p className="text-[#F0C674] text-[10px] mt-1.5 leading-snug">
                ⓘ Для суммы свыше {addSpaces(LIGHT_MAX_PRICE)} ₽ первоначальный взнос обязателен.
              </p>
            )}
          </div>

          {/* Количество платежей */}
          <NumField
            label="Количество платежей:"
            value={term}
            onChange={handleTermChange}
            min={MIN_TERM_TARIFF} max={maxTerm} step={1}
            unitLabel={pluralPayments(term)}
            hint={hasDown
              ? "1-й платёж — взнос, остальные равные ежемесячные"
              : "Без взноса — максимум 10 платежей"}
          />

          {/* Подсказка про 12 платежей */}
          {!hasDown && (
            <div className="mb-5 flex items-start gap-2 bg-[#1A3C6E]/40 border border-white/15
                            rounded-xl px-4 py-3 text-white/85 text-[12px] leading-snug">
              <span className="shrink-0">💡</span>
              <span>
                Чтобы увеличить количество платежей до 12 и снизить ставку —
                сделайте первоначальный взнос 25%.
              </span>
            </div>
          )}

          {/* Результаты */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <ResultCard label="Платёж / мес"   value={result.monthly} />
            <ResultCard label="Наценка / платёж" value={result.feePerMonth} />
            <ResultCard label="Итого"          value={result.total} />
          </div>

          <p className="text-white/55 text-xs text-center leading-relaxed mb-4">
            Тариф{" "}
            <span className="text-white font-semibold">{spec.label}</span>
            {" · "}наценка{" "}
            <span className="text-white font-semibold">
              {(spec.monthRate * 100).toFixed(1)}% / мес
            </span>
            {" · "}
            <span className="text-white font-semibold">
              {pluralGuarantors(spec.guarantors)}
            </span>
          </p>

          <button onClick={handleBuy}
            className="w-full py-3.5 rounded-full text-sm font-extrabold text-white
                       bg-[#0C7A58] hover:bg-[#0A6347] active:scale-[0.99]
                       transition-all shadow-md">
            Подать заявку
          </button>
        </div>

        {/* ── Справка по тарифам (сайдбар справа) ── */}
        <aside className="rounded-2xl bg-white border border-[#E5E7EB] p-4 lg:sticky lg:top-4">
          <h2 className="font-extrabold text-[#0A1628] text-base mb-1">Тарифы</h2>
          <p className="text-[11px] text-[#6B7280] mb-3 leading-snug">
            Загорается тот, что подобран под вашу сумму и взнос.
          </p>
          <div className="space-y-2">
            {TARIFF_ORDER.map(key => {
              const t = TARIFFS[key];
              const active = key === tariff;
              return (
                <div key={key}
                  className={`rounded-xl px-4 py-3 border-2 transition-all
                    ${active
                      ? "bg-gradient-to-br from-[#0E2344] to-[#0A1628] border-[#C8972B] shadow-lg"
                      : "bg-[#F9FAFB] border-transparent"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-extrabold text-sm
                      ${active ? "text-white" : "text-[#0A1628]"}`}>
                      {t.label}
                    </span>
                    <span className={`font-extrabold text-sm tabular-nums
                      ${active ? "text-[#C8972B]" : "text-[#1A3C6E]"}`}>
                      {(t.monthRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className={`text-[11px] mt-1 tabular-nums
                    ${active ? "text-white/75" : "text-[#6B7280]"}`}>
                    {addSpaces(t.minPrice)} – {addSpaces(t.maxPrice)} ₽
                  </div>
                  <div className={`text-[10px] mt-0.5 leading-snug
                    ${active ? "text-white/55" : "text-[#9CA3AF]"}`}>
                    {t.description} · {t.minTerm}–{t.maxTerm} платежей
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
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

  const pct = ((Math.min(max, Math.max(min, value)) - min) / Math.max(1, max - min)) * 100;

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
        type="range" min={min} max={max} step={step} value={Math.min(max, Math.max(min, value))}
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
    <div className="rounded-xl bg-[#EDE7DA] text-[#0A1628] px-2 sm:px-3 py-3 text-center">
      <p className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold text-[#1A3C6E]/70 mb-0.5">
        {label}
      </p>
      <p className="font-extrabold text-sm sm:text-lg tabular-nums leading-tight">
        {addSpaces(value)}&nbsp;₽
      </p>
    </div>
  );
}
