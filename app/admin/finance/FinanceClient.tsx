"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { TARIFF_RATES, irrForRate } from "@/lib/calculator-logic";
import { annualFromMonthly } from "@/lib/finance/iso-irr";

const TERMS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

type TKey = "small" | "medium" | "large";

const TARIFFS: { key: TKey; label: string; range: string }[] = [
  { key: "small",  label: "Small",  range: "8 000 – 70 000 ₽" },
  { key: "medium", label: "Medium", range: "70 000 – 150 000 ₽" },
  { key: "large",  label: "Large",  range: "150 000 – 1 000 000 ₽" },
];

/** 6,6 — процент с одним знаком, запятая */
function pct1(x: number): string {
  if (!isFinite(x)) return "—";
  return (x * 100).toFixed(1).replace(".", ",");
}
/** 138 — процент без знаков */
function pct0(x: number): string {
  if (!isFinite(x)) return "—";
  return Math.round(x * 100).toString();
}

export function FinanceClient() {
  /* 3 ставки — прикидка «что-если», по умолчанию = живые ставки сайта */
  const [rates, setRates] = useState<Record<TKey, number>>({
    small:  TARIFF_RATES.small,
    medium: TARIFF_RATES.medium,
    large:  TARIFF_RATES.large,
  });

  const isLive =
    rates.small  === TARIFF_RATES.small &&
    rates.medium === TARIFF_RATES.medium &&
    rates.large  === TARIFF_RATES.large;

  /* Сетка IRR: для каждого тарифа — IRR/мес по всем срокам + средний */
  const grid = useMemo(() => {
    return TARIFFS.map(t => {
      const cells = TERMS.map(term => irrForRate(rates[t.key], term));
      const avg   = cells.reduce((a, b) => a + b, 0) / cells.length;
      return { ...t, cells, avg };
    });
  }, [rates]);

  const overallAvg = useMemo(() => {
    const all = grid.flatMap(g => g.cells);
    return all.reduce((a, b) => a + b, 0) / all.length;
  }, [grid]);

  function setRate(key: TKey, pctValue: number) {
    const v = Number.isFinite(pctValue) ? Math.max(0, pctValue) : 0;
    setRates(r => ({ ...r, [key]: v / 100 }));
  }

  return (
    <main className="min-h-screen bg-[#f6f7fb] py-8">
      <div className="max-w-[1100px] mx-auto px-6 space-y-6">

        {/* ── Header ─────────────────────────────────────── */}
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#0A1628]">
              IRR-монитор · доходность тарифов
            </h1>
            <p className="text-sm text-[#6B7280]">
              Прикидка «что-если»: меняйте ставки наценки — смотрите, как двигается IRR.
            </p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 text-sm font-semibold text-[#0A1628] border border-[#D1D5DB]
                       rounded-lg hover:border-[#0A1628] transition-colors whitespace-nowrap"
          >
            ← В админку
          </Link>
        </header>

        {/* ── Ставки тарифов ─────────────────────────────── */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-[#0A1628] mb-1">Ставки наценки</h2>
          <p className="text-xs text-[#6B7280] mb-4">
            Это прикидка — на сайт не влияет. Живые ставки заданы в коде:{" "}
            <code>TARIFF_RATES</code> в <code>lib/calculator-logic.ts</code>.
            {!isLive && (
              <button
                onClick={() => setRates({ ...TARIFF_RATES })}
                className="ml-2 text-[#1A3C6E] underline font-semibold"
              >
                сбросить к живым
              </button>
            )}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {TARIFFS.map(t => (
              <div key={t.key} className="rounded-lg p-3 bg-[#F9FAFB] border border-[#E5E7EB]">
                <div className="text-[12px] font-bold text-[#0A1628]">{t.label}</div>
                <div className="text-[10px] text-[#9CA3AF] mb-2">{t.range}</div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number" step={0.1} min={0} max={20}
                    value={Math.round(rates[t.key] * 10000) / 100}
                    onChange={e => setRate(t.key, Number(e.target.value))}
                    className="w-20 px-2 py-1.5 text-sm font-bold text-right rounded
                               border border-[#D1D5DB] outline-none focus:border-[#1A3C6E]"
                  />
                  <span className="text-sm text-[#6B7280]">% / мес</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Сетка IRR ──────────────────────────────────── */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-[#0A1628] mb-1">Сетка IRR · % / мес</h2>
          <p className="text-xs text-[#6B7280] mb-4">
            IRR на вложенный капитал при взносе 25%, по количеству платежей.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-[#6B7280]">
                  <th className="text-left p-2">Тариф</th>
                  {TERMS.map(t => (
                    <th key={t} className="text-center p-2 font-semibold">{t}</th>
                  ))}
                  <th className="text-center p-2 font-bold text-[#1A3C6E] border-l border-[#E5E7EB]">
                    средн.
                  </th>
                </tr>
              </thead>
              <tbody>
                {grid.map(g => (
                  <tr key={g.key} className="border-t border-[#F3F4F6]">
                    <td className="p-2 font-bold text-[#0A1628] whitespace-nowrap">{g.label}</td>
                    {g.cells.map((irr, i) => (
                      <td key={i} className="text-center p-2 tabular-nums text-[#0A1628]">
                        {pct1(irr)}
                      </td>
                    ))}
                    <td className="text-center p-2 tabular-nums font-extrabold text-[#1A3C6E]
                                   border-l border-[#E5E7EB]">
                      {pct1(g.avg)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Средние по тарифам + общий */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {grid.map(g => (
              <Stat
                key={g.key}
                label={`${g.label} · средний IRR`}
                value={`${pct1(g.avg)}% мес · ${pct0(annualFromMonthly(g.avg))}% год`}
              />
            ))}
            <Stat
              label="Средний IRR портфеля"
              value={`${pct1(overallAvg)}% мес · ${pct0(annualFromMonthly(overallAvg))}% год`}
              accent
            />
          </div>
        </section>

      </div>
    </main>
  );
}

/* ────────────────────────────────────────────────────── */

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className="rounded-lg p-3"
      style={{
        background: accent ? "#ECFDF5" : "#F9FAFB",
        border: `1px solid ${accent ? "#A7F3D0" : "#E5E7EB"}`,
      }}
    >
      <div className="text-[10px] uppercase tracking-wide text-[#6B7280]">{label}</div>
      <div className="text-sm font-extrabold mt-0.5" style={{ color: accent ? "#065F46" : "#0A1628" }}>
        {value}
      </div>
    </div>
  );
}
