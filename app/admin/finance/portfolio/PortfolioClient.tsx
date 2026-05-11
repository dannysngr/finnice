"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { EnrichedLoan, CohortStats, PortfolioSummary } from "@/lib/finance/portfolio";

function fmtRub(x: number): string {
  if (!isFinite(x)) return "—";
  if (Math.abs(x) >= 1_000_000) return (x / 1_000_000).toFixed(2) + " М";
  if (Math.abs(x) >= 1_000)     return (x / 1_000).toFixed(0) + " К";
  return Math.round(x).toString();
}
function fmtRubFull(x: number): string {
  if (!isFinite(x)) return "—";
  return Math.round(x).toLocaleString("ru-RU");
}
function fmtPct(x: number, digits = 1): string {
  if (!isFinite(x)) return "—";
  return (x * 100).toFixed(digits) + "%";
}
function fmtMonth(s: string): string {
  // "2026-05" → "Май 2026"
  const months = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
  const [y, m] = s.split("-").map(Number);
  return `${months[m - 1] ?? m} ${y}`;
}

interface Props {
  initialLoans:    EnrichedLoan[];
  initialCohorts:  CohortStats[];
  initialSummary:  PortfolioSummary;
  targetIrrAnnual: number;
  inflationAnnual: number;
}

export function PortfolioClient({
  initialLoans, initialCohorts, initialSummary, targetIrrAnnual,
}: Props) {
  const [loans,   setLoans]   = useState(initialLoans);
  const [cohorts, setCohorts] = useState(initialCohorts);
  const [summary, setSummary] = useState(initialSummary);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/portfolio", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setLoans(data.loans);
        setCohorts(data.cohorts);
        setSummary(data.summary);
      }
    } finally {
      setRefreshing(false);
    }
  };

  /* ── Фильтры ─────────────────────────────────────────── */
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed" | "overdue">("all");

  const filteredLoans = useMemo(() => {
    if (statusFilter === "all")      return loans;
    if (statusFilter === "overdue")  return loans.filter(l => l.isOverdue);
    return loans.filter(l => l.status === statusFilter);
  }, [loans, statusFilter]);

  const irrDelta = summary.weightedPlannedIrr - targetIrrAnnual;

  return (
    <main className="min-h-screen bg-[#f6f7fb] py-8">
      <div className="max-w-[1400px] mx-auto px-6 space-y-6">

        {/* ── Header ─────────────────────────────────── */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[#0A1628]">
              Реальный портфель
              <span className="ml-2 text-xs font-normal px-2 py-1 rounded-md uppercase"
                    style={{ background: "#ECFDF5", color: "#065F46" }}>
                Live data
              </span>
            </h1>
            <p className="text-sm text-[#6B7280]">
              Аналитика по фактическим сделкам из БД. Целевой IRR эталона: <b>{fmtPct(targetIrrAnnual, 1)}/год</b>.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={refresh} disabled={refreshing}
              className="px-3 py-2 text-xs font-semibold text-[#0A1628] border border-[#D1D5DB] rounded-lg hover:border-[#0A1628] transition-colors">
              {refreshing ? "⟳..." : "↻ Обновить"}
            </button>
            <Link href="/admin/finance"
              className="px-4 py-2 text-sm font-semibold text-[#0A1628] border border-[#D1D5DB] rounded-lg hover:border-[#0A1628] transition-colors">
              ← В Sandbox
            </Link>
          </div>
        </header>

        {summary.totalDeals === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <div className="text-5xl mb-3">📭</div>
            <h2 className="text-base font-bold text-[#0A1628] mb-2">Сделок пока нет</h2>
            <p className="text-sm text-[#6B7280]">
              Здесь появятся данные после одобрения первых заявок.<br />
              Перейдите в админку → «Новые заявки» → одобрите заявку.
            </p>
          </div>
        )}

        {summary.totalDeals > 0 && (
          <>
            {/* ── KPIs ─────────────────────────────────── */}
            <section className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-[#0A1628] mb-4">Ключевые метрики</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <Kpi label="Всего сделок"         value={summary.totalDeals.toString()} />
                <Kpi label="Активных"             value={summary.activeDeals.toString()} />
                <Kpi label="Завершено"            value={summary.completedDeals.toString()} accent />
                <Kpi label="Просрочка"            value={summary.overdueDeals.toString()} warn={summary.overdueDeals > 0} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <Kpi label="Капитал развёрнут"    value={fmtRubFull(summary.totalCapitalDeployed) + " ₽"} />
                <Kpi label="Outstanding (в работе)" value={fmtRubFull(summary.totalOutstanding) + " ₽"} />
                <Kpi label="Реализованная прибыль" value={fmtRubFull(summary.realizedProfit) + " ₽"} accent />
                <Kpi label="Ожидаемая прибыль"    value={fmtRubFull(summary.expectedProfit) + " ₽"} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Kpi label="Receivables (актив)"   value={fmtRubFull(summary.totalReceivables) + " ₽"} />
                <Kpi label="NPL ratio"             value={fmtPct(summary.nplRatio, 1)} warn={summary.nplRatio > 0.05} />
                <Kpi label="Avg planned IRR"       value={fmtPct(summary.avgPlannedIrr, 1)} />
                <Kpi
                  label="Weighted IRR vs target"
                  value={fmtPct(summary.weightedPlannedIrr, 1)}
                  subValue={`Δ ${irrDelta >= 0 ? "+" : ""}${(irrDelta * 100).toFixed(1)}пп vs ${fmtPct(targetIrrAnnual, 0)}`}
                  accent={Math.abs(irrDelta) < 0.05}
                  warn={Math.abs(irrDelta) >= 0.05}
                />
              </div>
            </section>

            {/* ── Chart: динамика когорт ──────────────── */}
            <section className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-[#0A1628] mb-3">Динамика портфеля</h2>
              <CohortsChart cohorts={cohorts} />
            </section>

            {/* ── Cohorts ──────────────────────────────── */}
            <section className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-[#0A1628] mb-1">Когорты по месяцам выдачи</h2>
              <p className="text-xs text-[#6B7280] mb-4">
                Каждая строка — все сделки, выданные в один месяц. Когорта «живёт» до полного погашения всех сделок.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase text-[#9CA3AF] border-b border-[#E5E7EB]">
                      <th className="text-left p-2">Когорта</th>
                      <th className="text-right p-2">Сделок</th>
                      <th className="text-right p-2">Капитал</th>
                      <th className="text-right p-2">Markup ожид.</th>
                      <th className="text-right p-2">Активно</th>
                      <th className="text-right p-2">Завершено</th>
                      <th className="text-right p-2">Просрочка</th>
                      <th className="text-right p-2">Realized</th>
                      <th className="text-right p-2">Avg IRR</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {cohorts.map(c => (
                      <tr key={c.cohortMonth} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB]">
                        <td className="p-2 font-bold text-[#0A1628]">{fmtMonth(c.cohortMonth)}</td>
                        <td className="text-right p-2">{c.count}</td>
                        <td className="text-right p-2 text-[#6B7280]">{fmtRub(c.totalCapital)} ₽</td>
                        <td className="text-right p-2 text-[#6B7280]">{fmtRub(c.totalMarkup)} ₽</td>
                        <td className="text-right p-2 text-[#0A1628]">{c.active}</td>
                        <td className="text-right p-2 text-[#065F46]">{c.completed}</td>
                        <td className="text-right p-2" style={{ color: c.overdue > 0 ? "#dc2626" : "#9CA3AF" }}>
                          {c.overdue > 0 ? c.overdue : "—"}
                        </td>
                        <td className="text-right p-2 font-bold text-[#0C7A58]">{fmtRub(c.realizedProfit)} ₽</td>
                        <td className="text-right p-2">{fmtPct(c.avgIrr, 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ── Deals list ───────────────────────────── */}
            <section className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-[#0A1628]">Все сделки</h2>
                <div className="flex gap-1">
                  {(["all", "active", "completed", "overdue"] as const).map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors"
                      style={{
                        background: statusFilter === s ? "#0A1628" : "#F3F4F6",
                        color: statusFilter === s ? "#fff" : "#0A1628",
                      }}>
                      {s === "all" ? "Все" : s === "active" ? "Активные" : s === "completed" ? "Завершено" : "Просрочка"}
                      <span className="ml-1 opacity-60">
                        {s === "all" ? loans.length :
                         s === "active" ? summary.activeDeals :
                         s === "completed" ? summary.completedDeals :
                         summary.overdueDeals}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[10px] uppercase text-[#9CA3AF] border-b border-[#E5E7EB]">
                      <th className="text-left p-2">Дата</th>
                      <th className="text-left p-2">Клиент</th>
                      <th className="text-left p-2">Товар</th>
                      <th className="text-right p-2">Стоим.</th>
                      <th className="text-right p-2">Markup</th>
                      <th className="text-right p-2">Срок</th>
                      <th className="text-right p-2">Платёж/мес</th>
                      <th className="text-right p-2">Прогресс</th>
                      <th className="text-right p-2">Outstanding</th>
                      <th className="text-right p-2">Plan IRR</th>
                      <th className="text-right p-2">Actual IRR</th>
                      <th className="text-left p-2">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {filteredLoans.length === 0 && (
                      <tr><td colSpan={11} className="p-4 text-center text-[#9CA3AF] italic">Нет сделок по этому фильтру</td></tr>
                    )}
                    {filteredLoans.map(l => (
                      <tr key={l.id} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB]">
                        <td className="p-2 text-[#6B7280]">{l.startDate}</td>
                        <td className="p-2 text-[#0A1628]">{l.phone}</td>
                        <td className="p-2 text-[#0A1628] max-w-[160px] truncate" title={l.product}>{l.product}</td>
                        <td className="text-right p-2">{fmtRub(l.costAmount)}</td>
                        <td className="text-right p-2">{fmtRub(l.markupAmount)} ({fmtPct(l.markupPct, 0)})</td>
                        <td className="text-right p-2">{l.termMonths}м</td>
                        <td className="text-right p-2">{fmtRub(l.monthlyPayment)}</td>
                        <td className="text-right p-2">
                          <ProgressBar made={l.paymentsMadeEstimated} total={l.termMonths} expected={l.paymentsExpectedNow} />
                        </td>
                        <td className="text-right p-2">{fmtRub(l.outstandingPrincipal)}</td>
                        <td className="text-right p-2">{fmtPct(l.irrAnnualPlanned, 0)}</td>
                        <td className="text-right p-2"
                            style={{
                              color: !l.irrAnnualActual ? "#9CA3AF" :
                                     l.irrAnnualActual >= targetIrrAnnual ? "#0C7A58" : "#dc2626"
                            }}>
                          {l.irrAnnualActual ? fmtPct(l.irrAnnualActual, 0) : "—"}
                        </td>
                        <td className="p-2">
                          <StatusBadge loan={l} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

      </div>
    </main>
  );
}

/* ────────────────────────────────────────────────────── */

function Kpi({ label, value, subValue, accent, warn }:
  { label: string; value: string; subValue?: string; accent?: boolean; warn?: boolean }) {
  let bg = "#F9FAFB";
  let border = "#E5E7EB";
  let fg = "#0A1628";
  if (accent) { bg = "#ECFDF5"; border = "#A7F3D0"; fg = "#065F46"; }
  if (warn)   { bg = "#FEF2F2"; border = "#FCA5A5"; fg = "#991B1B"; }
  return (
    <div className="rounded-lg p-3" style={{ background: bg, border: `1px solid ${border}` }}>
      <div className="text-[10px] uppercase tracking-wide text-[#6B7280] leading-tight">{label}</div>
      <div className="text-base font-extrabold mt-0.5 leading-tight" style={{ color: fg }}>{value}</div>
      {subValue && <div className="text-[10px] mt-0.5 leading-tight text-[#6B7280]">{subValue}</div>}
    </div>
  );
}

function ProgressBar({ made, total, expected }: { made: number; total: number; expected: number }) {
  const madePct     = (made / total) * 100;
  const expectedPct = (expected / total) * 100;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 bg-[#F3F4F6] rounded-full overflow-hidden relative" style={{ height: 6, minWidth: 60 }}>
        <div
          className="absolute top-0 bottom-0"
          style={{ left: 0, width: `${madePct}%`, background: "#0C7A58" }}
        />
        {expected > made && (
          <div
            className="absolute top-0 bottom-0"
            style={{
              left: `${madePct}%`,
              width: `${expectedPct - madePct}%`,
              background: "#dc2626",
              opacity: 0.4,
            }}
          />
        )}
      </div>
      <span className="text-[10px] text-[#6B7280] tabular-nums shrink-0">{made}/{total}</span>
    </div>
  );
}

function StatusBadge({ loan }: { loan: EnrichedLoan }) {
  let color = "#6B7280", bg = "#F3F4F6", label = "Активна";
  if (loan.status === "completed") { color = "#065F46"; bg = "#D1FAE5"; label = "Завершена"; }
  if (loan.isOverdue)             { color = "#991B1B"; bg = "#FEE2E2"; label = "Просрочка"; }
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase whitespace-nowrap"
          style={{ background: bg, color }}>
      {label}
    </span>
  );
}

/* ─── Bar + line chart по когортам ───────────────────── */
function CohortsChart({ cohorts }: { cohorts: CohortStats[] }) {
  if (cohorts.length === 0) return null;

  /* Подсчёт кумулятивной realized */
  const data = cohorts.map((c, i) => {
    const cumRealized = cohorts.slice(0, i + 1).reduce((s, x) => s + x.realizedProfit, 0);
    const cumExpected = cohorts.slice(0, i + 1).reduce((s, x) => s + x.expectedProfit, 0);
    return { ...c, cumRealized, cumExpected };
  });

  const maxCount = Math.max(1, ...data.map(d => d.count));
  const maxCum   = Math.max(1, ...data.map(d => d.cumExpected));

  const W = 720;
  const H = 220;
  const padL = 50, padR = 20, padT = 20, padB = 50;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

  const pathRealized = data.map((d, i) =>
    `${i === 0 ? "M" : "L"} ${padL + i * stepX} ${padT + innerH - (d.cumRealized / maxCum) * innerH}`
  ).join(" ");
  const pathExpected = data.map((d, i) =>
    `${i === 0 ? "M" : "L"} ${padL + i * stepX} ${padT + innerH - (d.cumExpected / maxCum) * innerH}`
  ).join(" ");

  const barW = data.length > 0 ? Math.min(40, (innerW / data.length) * 0.4) : 20;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 600, maxHeight: 260 }}>
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
          <line key={i}
            x1={padL} x2={W - padR}
            y1={padT + innerH * (1 - f)} y2={padT + innerH * (1 - f)}
            stroke="#E5E7EB" strokeDasharray={i > 0 ? "2 2" : ""}
          />
        ))}

        {/* Y-axis labels (left, cumulative profit) */}
        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
          <text key={i}
            x={padL - 6} y={padT + innerH * (1 - f) + 3}
            textAnchor="end" fontSize="9" fill="#9CA3AF"
          >
            {(maxCum * f / 1000).toFixed(0)}к
          </text>
        ))}

        {/* Bars: deals count */}
        {data.map((d, i) => {
          const x = padL + i * stepX - barW / 2;
          const h = (d.count / maxCount) * innerH * 0.5;
          return (
            <g key={i}>
              <rect x={x} y={padT + innerH - h} width={barW} height={h}
                fill="#1A3C6E" opacity={0.6}>
                <title>{d.cohortMonth}: {d.count} сделок</title>
              </rect>
              <text x={padL + i * stepX} y={padT + innerH - h - 3}
                textAnchor="middle" fontSize="9" fill="#1A3C6E" fontWeight="bold">
                {d.count}
              </text>
            </g>
          );
        })}

        {/* Lines */}
        <path d={pathExpected} fill="none" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4 3" />
        <path d={pathRealized} fill="none" stroke="#0C7A58" strokeWidth="2.5" />

        {/* Points */}
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={padL + i * stepX} cy={padT + innerH - (d.cumRealized / maxCum) * innerH}
              r={3.5} fill="#0C7A58" stroke="#fff" strokeWidth="1.5">
              <title>{d.cohortMonth} · realized {Math.round(d.cumRealized).toLocaleString("ru-RU")} ₽</title>
            </circle>
          </g>
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => (
          <text key={i}
            x={padL + i * stepX} y={H - padB + 16}
            textAnchor="middle" fontSize="9" fill="#6B7280"
          >
            {d.cohortMonth.slice(2)}
          </text>
        ))}

        {/* Legend */}
        <g transform={`translate(${padL}, ${H - 12})`}>
          <rect x={0} y={-7} width={10} height={2} fill="#0C7A58" />
          <text x={14} y={-5} fontSize="9" fill="#0A1628">Реализованная прибыль (кумулятив)</text>
          <line x1={210} y1={-6} x2={222} y2={-6} stroke="#94A3B8" strokeWidth="2" strokeDasharray="4 3" />
          <text x={226} y={-5} fontSize="9" fill="#0A1628">Ожидаемая (по плану)</text>
          <rect x={395} y={-9} width={8} height={6} fill="#1A3C6E" opacity={0.6} />
          <text x={407} y={-5} fontSize="9" fill="#0A1628">Сделок в когорте</text>
        </g>
      </svg>
    </div>
  );
}
