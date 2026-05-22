"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  markupExact,
  markupRounded,
  targetIrrMonthlyForTerm,
  inflationPremiumInfo,
  annualFromMonthly,
  monthlyFromAnnual,
  realFromNominal,
  computeDealMetrics,
  BASELINE_TERM,
  BASELINE_DOWN,
} from "@/lib/finance/iso-irr";
import type { FinanceConfig } from "@/lib/finance/config-store";
import { CohortsSimulator } from "./CohortsSimulator";

const TERMS    = [3, 6, 9, 12, 18, 24];
const DOWN_PCT = [0, 0.10, 0.25, 0.40, 0.50];

function fmtPct(x: number, digits = 1): string {
  if (!isFinite(x)) return "—";
  return (x * 100).toFixed(digits) + "%";
}
function fmtPctInt(x: number): string {
  if (!isFinite(x)) return "—";
  return Math.round(x * 100) + "%";
}
function fmtRub(x: number): string {
  if (!isFinite(x)) return "—";
  return Math.round(x).toLocaleString("ru-RU");
}

interface BaselineInfo {
  annualIrr:  number;
  monthlyIrr: number;
}

export function FinanceClient({
  initial,
  baseline,
}: {
  initial: FinanceConfig;
  baseline: BaselineInfo;
}) {
  const [cfg, setCfg]       = useState<FinanceConfig>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  /* ── Целевой IRR — редактируемый (прикидка, на боевой сайт не влияет) ── */
  const [targetIrr, setTargetIrr] = useState<number>(baseline.monthlyIrr);
  const irrEdited = Math.abs(targetIrr - baseline.monthlyIrr) > 1e-9;

  /* ── Сохранение ──────────────────────────────────────── */
  const save = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/finance-config", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedInflationAnnual: cfg.expectedInflationAnnual,
          minTerm: cfg.minTerm,
          maxTerm: cfg.maxTerm,
          minDownPct: cfg.minDownPct,
          maxDownPct: cfg.maxDownPct,
          matrixOverrides: cfg.matrixOverrides,
        }),
      });
      if (res.ok) {
        const fresh = await res.json();
        setCfg(fresh);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  }, [cfg]);

  /* ── Матрица ─────────────────────────────────────────── */
  const matrix = useMemo(() => {
    return TERMS.map(n => {
      const premium = inflationPremiumInfo(n, cfg.expectedInflationAnnual, targetIrr);
      const cells = DOWN_PCT.map(d => {
        const key = `${n}:${d}`;
        const override = cfg.matrixOverrides?.[key];
        const exact    = markupExact(n, d, cfg.expectedInflationAnnual, targetIrr);
        const rounded  = override !== undefined ? override : markupRounded(n, d, cfg.expectedInflationAnnual, targetIrr);
        return { n, d, exact, rounded, isOverride: override !== undefined };
      });
      return { n, premium, cells };
    });
  }, [cfg.expectedInflationAnnual, cfg.matrixOverrides, targetIrr]);

  /* ── Preview сделки (со слайдерами) ─────────────────── */
  const [pvCost, setPvCost] = useState(100_000);
  const [pvTerm, setPvTerm] = useState(6);
  const [pvDown, setPvDown] = useState(0.25);

  const pvPremium  = inflationPremiumInfo(pvTerm, cfg.expectedInflationAnnual, targetIrr);
  const pvMarkupExact = useMemo(() => markupExact(pvTerm, pvDown, cfg.expectedInflationAnnual, targetIrr), [pvTerm, pvDown, cfg.expectedInflationAnnual, targetIrr]);
  const pvMarkupRounded = useMemo(() => {
    const key = `${pvTerm}:${pvDown}`;
    return cfg.matrixOverrides?.[key] ?? markupRounded(pvTerm, pvDown, cfg.expectedInflationAnnual, targetIrr);
  }, [pvTerm, pvDown, cfg.expectedInflationAnnual, cfg.matrixOverrides, targetIrr]);

  const pvMetrics = useMemo(() => computeDealMetrics({
    costAmount:  pvCost,
    termMonths:  pvTerm,
    downPct:     pvDown,
    markupPct:   pvMarkupRounded,
  }), [pvCost, pvTerm, pvDown, pvMarkupRounded]);

  /* ── Override ────────────────────────────────────────── */
  const toggleOverride = (n: number, d: number, value: number | null) => {
    setCfg(c => {
      const m = { ...(c.matrixOverrides ?? {}) };
      const key = `${n}:${d}`;
      if (value === null) delete m[key];
      else m[key] = value;
      return { ...c, matrixOverrides: m };
    });
  };

  return (
    <main className="min-h-screen bg-[#f6f7fb] py-8">
      <div className="max-w-[1200px] mx-auto px-6 space-y-6">

        {/* ── Header ─────────────────────────────────────── */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[#0A1628]">
              Pricing Policy · iso-IRR
            </h1>
            <p className="text-sm text-[#6B7280]">
              Эталонная сделка фиксирована. Наценки выводятся автоматически. Инфляция влияет только на сделки длиннее эталона.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/finance/portfolio"
              className="px-4 py-2 text-sm font-bold text-white rounded-lg
                         transition-opacity hover:opacity-90 whitespace-nowrap"
              style={{ background: "linear-gradient(135deg, #0C7A58, #0a6449)" }}
            >
              📊 Портфель →
            </Link>
            <Link
              href="/admin"
              className="px-4 py-2 text-sm font-semibold text-[#0A1628] border border-[#D1D5DB] rounded-lg hover:border-[#0A1628] transition-colors"
            >
              ← В админку
            </Link>
          </div>
        </header>

        {/* ── Эталон / целевой IRR (редактируемый) ───────── */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-[#0A1628] mb-1">
            Эталон модели (анкер)
          </h2>
          <p className="text-xs text-[#6B7280] mb-4">
            Целевой IRR — «север-звезда» модели. Правьте поля «IRR / мес» или «IRR / год» — вся матрица и расчёты подстроятся.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <DerivedCell label="Срок"   value={`${BASELINE_TERM} мес`} />
            <DerivedCell label="Взнос"  value={fmtPctInt(BASELINE_DOWN)} />
            <DerivedCell
              label="Наценка"
              value={fmtPctInt(markupRounded(BASELINE_TERM, BASELINE_DOWN, cfg.expectedInflationAnnual, targetIrr))}
            />
            <EditableIrrCell
              label="IRR / мес" pctValue={targetIrr * 100} digits={2}
              onCommit={(f) => setTargetIrr(f)}
            />
            <EditableIrrCell
              label="IRR / год" pctValue={annualFromMonthly(targetIrr) * 100} digits={1}
              onCommit={(f) => setTargetIrr(monthlyFromAnnual(f))}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg p-3 bg-[#F9FAFB] border border-[#E5E7EB]">
              <span className="text-[#6B7280]">Реальная доходность (после инфляции {fmtPct(cfg.expectedInflationAnnual, 0)}):</span>
              {" "}
              <b className="text-[#0A1628]">
                {fmtPct(realFromNominal(annualFromMonthly(targetIrr), cfg.expectedInflationAnnual), 1)} год.
              </b>
            </div>
            <div className="rounded-lg p-3 bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E3A8A] flex items-center justify-between gap-3">
              <span>ℹ️ Это прикидка — на боевой сайт не влияет (сайт считает по фикс-ставкам).</span>
              {irrEdited && (
                <button
                  onClick={() => setTargetIrr(baseline.monthlyIrr)}
                  className="shrink-0 px-2.5 py-1 rounded bg-white border border-[#BFDBFE] font-semibold hover:border-[#1E3A8A] transition-colors"
                >
                  сброс
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── Inflation slider ───────────────────────────── */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-[#0A1628] mb-1">Инфляция / девальвация</h2>
          <p className="text-xs text-[#6B7280] mb-4">
            Применяется только к сделкам длиннее эталона ({BASELINE_TERM} мес). Каждый месяц сверх эталона добавляет премиум <code>inflation/12</code> к целевому IRR.
          </p>

          <div>
            <label className="text-xs font-medium text-[#6B7280] flex justify-between mb-1">
              <span>Ожидаемая годовая инфляция</span>
              <span className="font-mono text-[#dc2626]">{fmtPct(cfg.expectedInflationAnnual, 0)}</span>
            </label>
            <input
              type="range"
              min={0} max={0.40} step={0.005}
              value={cfg.expectedInflationAnnual}
              onChange={e => setCfg(c => ({ ...c, expectedInflationAnnual: Number(e.target.value) }))}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-[#9CA3AF] mt-1">
              <span>0%</span><span>10%</span><span>20%</span><span>30%</span><span>40%</span>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold rounded-lg text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #0C7A58, #0a6449)" }}
            >
              {saving ? "Сохраняю..." : "Сохранить настройки"}
            </button>
            {saved && <span className="text-xs text-[#0C7A58] font-semibold">✓ Сохранено</span>}
          </div>
        </section>

        {/* ── Matrix ─────────────────────────────────────── */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-[#0A1628] mb-1">Матрица наценок</h2>
          <p className="text-xs text-[#6B7280] mb-4">
            Округлено до целых процентов. Наведите курсор на ячейку — увидите точное значение и расшифровку. Сделки {`>`} {BASELINE_TERM} мес помечены меткой <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: "#FEF3C7", color: "#92400E" }}>+инфл</span>.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-2 text-[11px] font-semibold text-[#6B7280] uppercase">Срок ↓ \ Взнос →</th>
                  {DOWN_PCT.map(d => (
                    <th key={d} className="text-center p-2 text-[11px] font-semibold text-[#6B7280]">
                      {fmtPctInt(d)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map(row => (
                  <tr key={row.n} className="border-t border-[#F3F4F6]">
                    <td className="p-2 text-xs font-semibold text-[#0A1628]">
                      <div className="flex items-center gap-1.5">
                        {row.n} мес
                        {row.premium.applied && (
                          <span
                            className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold"
                            style={{ background: "#FEF3C7", color: "#92400E" }}
                            title={`+${fmtPct(row.premium.premiumPct, 1)} инфляционный премиум, IRR=${fmtPct(row.premium.adjustedAnnualIrr, 0)}/год`}
                          >
                            +инфл
                          </span>
                        )}
                      </div>
                    </td>
                    {row.cells.map(c => (
                      <MatrixCellTd
                        key={c.d}
                        n={c.n}
                        d={c.d}
                        rounded={c.rounded}
                        exact={c.exact}
                        isOverride={c.isOverride}
                        onSetOverride={(val) => toggleOverride(c.n, c.d, val)}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Preview сделки ─────────────────────────────── */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-[#0A1628] mb-4">Превью сделки</h2>

          {/* Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
            <SliderField
              label="Стоимость товара"
              value={pvCost}
              min={1000} max={1_000_000} step={1000}
              onChange={setPvCost}
              format={(v) => fmtRub(v) + " ₽"}
            />
            <SliderField
              label="Срок"
              value={pvTerm}
              min={3} max={24} step={1}
              onChange={setPvTerm}
              format={(v) => `${v} мес`}
            />
            <SliderField
              label="Первоначальный взнос"
              value={pvDown}
              min={0} max={0.5} step={0.05}
              onChange={setPvDown}
              format={(v) => fmtPctInt(v)}
            />
          </div>

          {/* Inflation premium info */}
          {pvPremium.applied && (
            <div className="mb-4 rounded-lg p-3 text-xs"
                 style={{ background: "#FEF3C7", border: "1px solid #FCD34D", color: "#78350F" }}>
              <b>ℹ️ Применён инфляционный премиум:</b> срок {pvTerm} мес превышает эталон ({BASELINE_TERM} мес).
              Доп. месяцев: <b>{pvPremium.extraMonths}</b>. Премиум: <b>+{fmtPct(pvPremium.premiumPct, 1)}</b> к IRR.
              Целевой IRR: <b>{fmtPct(pvPremium.adjustedAnnualIrr, 1)}/год</b> ({fmtPct(pvPremium.adjustedMonthlyIrr, 2)}/мес).
            </div>
          )}
          {!pvPremium.applied && pvTerm < BASELINE_TERM && (
            <div className="mb-4 rounded-lg p-3 text-xs"
                 style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#065F46" }}>
              ✓ Срок {pvTerm} мес ≤ эталон. Используется базовый IRR без премиума: <b>{fmtPct(annualFromMonthly(targetIrr), 1)}/год</b>.
            </div>
          )}

          {/* Markup display */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <DerivedCell label="Наценка (округл.)" value={fmtPctInt(pvMarkupRounded)} accent />
            <DerivedCell label="Точно по формуле" value={fmtPct(pvMarkupExact, 2)} />
            <DerivedCell label="Итого для клиента, ₽" value={fmtRub(pvMetrics.totalPrice)} />
            <DerivedCell label="Платёж/мес, ₽"        value={fmtRub(pvMetrics.monthlyPayment)} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <DerivedCell label="Прибыль сделки, ₽" value={fmtRub(pvMetrics.markupAmount)} accent />
            <DerivedCell label="Наш капитал T0, ₽" value={fmtRub(pvMetrics.capitalInvestedT0)} />
            <DerivedCell label="Факт. IRR/мес"  value={fmtPct(pvMetrics.irrMonthly, 2)} accent />
            <DerivedCell label="Факт. IRR/год"  value={fmtPct(pvMetrics.irrAnnual, 1)} accent />
          </div>

          <details className="text-xs">
            <summary className="cursor-pointer font-semibold text-[#6B7280] hover:text-[#0A1628]">
              Денежный поток сделки →
            </summary>
            <div className="mt-2 flex flex-wrap gap-1.5 font-mono">
              {pvMetrics.cashFlows.map((cf, i) => (
                <div
                  key={i}
                  className="text-center px-2 py-1.5 rounded shrink-0"
                  style={{
                    background: cf < 0 ? "#FEE2E2" : "#D1FAE5",
                    color:      cf < 0 ? "#991B1B" : "#065F46",
                    minWidth: 72,
                  }}
                >
                  <div className="text-[9px] uppercase">T{i}</div>
                  <div className="text-[11px] font-bold">{cf > 0 ? "+" : ""}{Math.round(cf).toLocaleString("ru-RU")}</div>
                </div>
              ))}
            </div>
          </details>
        </section>

        {/* ── Когорты ───────────────────────────────────── */}
        <CohortsSimulator inflationAnnual={cfg.expectedInflationAnnual} />

        {/* ── История изменений политики ─────────────────── */}
        <PolicyHistorySection />

        {/* ── Sanity check ───────────────────────────────── */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-[#0A1628] mb-3">Sanity check</h2>
          <p className="text-xs text-[#6B7280] mb-3">
            Сравнение <b>целевого IRR</b> (по формуле) и <b>фактического</b> (после округления наценки до целого %).
            Δ &lt; 0.5пп — норма.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] uppercase text-[#9CA3AF]">
                  <th className="text-left p-1.5">Срок</th>
                  <th className="text-left p-1.5">Взнос</th>
                  <th className="text-right p-1.5">Точная наценка</th>
                  <th className="text-right p-1.5">Округл.</th>
                  <th className="text-right p-1.5">Target IRR/год</th>
                  <th className="text-right p-1.5">Факт IRR/год</th>
                  <th className="text-right p-1.5">Δ</th>
                </tr>
              </thead>
              <tbody>
                {matrix.flatMap(r => r.cells).map(c => {
                  const targetMonthly = targetIrrMonthlyForTerm(c.n, cfg.expectedInflationAnnual, targetIrr);
                  const targetAnnual  = annualFromMonthly(targetMonthly);
                  const dm = computeDealMetrics({
                    costAmount: 100_000, termMonths: c.n, downPct: c.d, markupPct: c.rounded,
                  });
                  const delta = dm.irrAnnual - targetAnnual;
                  const absDelta = Math.abs(delta);
                  const color = absDelta < 0.005 ? "#0C7A58" : absDelta < 0.02 ? "#92400E" : "#dc2626";
                  return (
                    <tr key={`${c.n}:${c.d}`} className="border-t border-[#F3F4F6] font-mono">
                      <td className="p-1.5">{c.n}</td>
                      <td className="p-1.5">{fmtPctInt(c.d)}</td>
                      <td className="p-1.5 text-right">{fmtPct(c.exact, 2)}</td>
                      <td className="p-1.5 text-right font-bold">{fmtPctInt(c.rounded)}</td>
                      <td className="p-1.5 text-right">{fmtPct(targetAnnual, 1)}</td>
                      <td className="p-1.5 text-right">{fmtPct(dm.irrAnnual, 1)}</td>
                      <td className="p-1.5 text-right" style={{ color }}>
                        {delta > 0 ? "+" : ""}{(delta * 100).toFixed(2)}пп
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </main>
  );
}

/* ════════════════════════════════════════════════════════════
   UI HELPERS
   ════════════════════════════════════════════════════════════ */

function DerivedCell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className="rounded-lg p-3"
      style={{
        background: accent ? "#ECFDF5" : "#F9FAFB",
        border: `1px solid ${accent ? "#A7F3D0" : "#E5E7EB"}`,
      }}
    >
      <div className="text-[10px] uppercase tracking-wide text-[#6B7280]">{label}</div>
      <div className="text-base font-extrabold mt-0.5" style={{ color: accent ? "#065F46" : "#0A1628" }}>
        {value}
      </div>
    </div>
  );
}

/** Редактируемая ячейка IRR в процентах. onCommit получает долю (v/100). */
function EditableIrrCell({
  label, pctValue, digits, onCommit,
}: {
  label: string;
  pctValue: number;
  digits: number;
  onCommit: (fraction: number) => void;
}) {
  const [raw, setRaw] = useState(pctValue.toFixed(digits));
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setRaw(pctValue.toFixed(digits));
  }, [pctValue, focused, digits]);

  const commit = () => {
    setFocused(false);
    const v = parseFloat(raw.replace(",", "."));
    if (isFinite(v) && v > 0) onCommit(v / 100);
    else setRaw(pctValue.toFixed(digits));
  };

  return (
    <div className="rounded-lg p-3" style={{ background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
      <div className="text-[10px] uppercase tracking-wide text-[#6B7280]">{label}</div>
      <div className="flex items-baseline gap-0.5 mt-0.5">
        <input
          value={raw}
          inputMode="decimal"
          onFocus={() => setFocused(true)}
          onChange={e => setRaw(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
          className="w-14 bg-transparent text-base font-extrabold text-[#065F46] outline-none
                     border-b border-[#A7F3D0] focus:border-[#065F46]"
        />
        <span className="text-base font-extrabold text-[#065F46]">%</span>
      </div>
    </div>
  );
}

function MatrixCellTd({
  n, d, rounded, exact, isOverride, onSetOverride,
}: {
  n: number; d: number; rounded: number; exact: number;
  isOverride: boolean; onSetOverride: (v: number | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState<string>(Math.round(rounded * 100).toString());

  const commit = () => {
    setEditing(false);
    const v = Number(raw) / 100;
    if (isNaN(v) || v < 0 || v > 5) return;
    const autoRounded = Math.round(exact * 100) / 100;
    if (Math.abs(v - autoRounded) < 1e-4) onSetOverride(null);
    else onSetOverride(v);
  };

  if (editing) {
    return (
      <td className="p-1">
        <input
          autoFocus
          value={raw}
          onChange={e => setRaw(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
          className="w-full text-center px-1 py-1.5 text-xs font-bold rounded border border-[#1A3C6E] outline-none"
        />
      </td>
    );
  }

  const isBaseline = n === 6 && Math.abs(d - 0.25) < 1e-4;
  const bg = isOverride ? "#FEF3C7" : (isBaseline ? "#D1FAE5" : "transparent");
  const fg = isOverride ? "#92400E" : "#0A1628";

  return (
    <td className="p-1">
      <button
        onClick={() => { setRaw(Math.round(rounded * 100).toString()); setEditing(true); }}
        className="w-full text-center px-2 py-1.5 rounded text-xs font-bold transition-colors hover:bg-[#F3F4F6]"
        style={{
          background: bg,
          color:      fg,
          border:     isOverride ? "1px solid #FCD34D" : "1px solid transparent",
        }}
        title={`Точно: ${fmtPct(exact, 2)} · Округлено до ${fmtPctInt(rounded)}${isOverride ? ` · ⚠ override (авто: ${fmtPctInt(Math.round(exact * 100) / 100)})` : ""}`}
      >
        {fmtPctInt(rounded)}
      </button>
    </td>
  );
}

function SliderField({
  label, value, min, max, step, onChange, format,
}: {
  label: string;
  value: number;
  min: number; max: number; step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-[#6B7280] flex justify-between mb-1">
        <span>{label}</span>
        <span className="font-mono text-[#0A1628] font-bold">{format(value)}</span>
      </label>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between text-[10px] text-[#9CA3AF] mt-1">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────── */
function PolicyHistorySection() {
  const [history, setHistory] = useState<Array<{ at: string; by: string; inflation: number; overrides: number; diff?: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/finance-config?history=1")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (Array.isArray(d?.history)) setHistory(d.history);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (history.length === 0) return null;

  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="text-base font-bold text-[#0A1628] mb-1">История изменений политики</h2>
      <p className="text-xs text-[#6B7280] mb-4">
        Audit-log изменений настроек (последние {history.length}).
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[10px] uppercase text-[#9CA3AF] border-b border-[#E5E7EB]">
              <th className="text-left p-2">Когда</th>
              <th className="text-left p-2">Кто</th>
              <th className="text-right p-2">Инфляция</th>
              <th className="text-right p-2">Overrides</th>
              <th className="text-left p-2">Что изменилось</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {history.map((h, i) => (
              <tr key={i} className="border-b border-[#F3F4F6]">
                <td className="p-2 text-[#6B7280]">{new Date(h.at).toLocaleString("ru-RU")}</td>
                <td className="p-2 text-[#0A1628]">{h.by}</td>
                <td className="p-2 text-right">{(h.inflation * 100).toFixed(1)}%</td>
                <td className="p-2 text-right">{h.overrides}</td>
                <td className="p-2 text-[#0A1628]">{h.diff ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
