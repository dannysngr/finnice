"use client";

import { useState, useMemo } from "react";
import { simulateCohorts, type MonthSnapshot } from "@/lib/finance/cohort-simulator";
import { markupRounded } from "@/lib/finance/iso-irr";

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
function fmtPctInt(x: number): string {
  return Math.round(x * 100) + "%";
}

interface Props {
  inflationAnnual: number;
}

export function CohortsSimulator({ inflationAnnual }: Props) {
  /* ── Базовые ─────────────────────────────── */
  const [capital, setCapital]     = useState(1_000_000);
  const [dealCost, setDealCost]   = useState(100_000);
  const [termMonths, setTerm]     = useState(6);
  const [downPct, setDown]        = useState(0.25);
  const [horizon, setHorizon]     = useState(18);

  /* ── Стресс-тест ─────────────────────────── */
  const [defaultRate, setDefaultRate]   = useState(0.03);
  const [recoveryRate, setRecoveryRate] = useState(0.5);
  const [opExRate, setOpExRate]         = useState(0.20);
  const [deployRate, setDeployRate]     = useState(1.0);

  /* ── Стратегия ───────────────────────────── */
  const [reinvestProfit, setReinvestProfit] = useState(true);

  /* ── Инвестор ────────────────────────────── */
  const [investorCapitalPct, setInvestorCapitalPct] = useState(0);
  const [investorProfitShare, setInvestorProfitShare] = useState(0.5);

  /* Наценка — из iso-IRR матрицы (округлённая) */
  const markupPct = useMemo(
    () => markupRounded(termMonths, downPct, inflationAnnual),
    [termMonths, downPct, inflationAnnual],
  );

  const sim = useMemo(() => simulateCohorts({
    capital, monthsToSimulate: horizon,
    dealCost, termMonths, downPct, markupPct,
    defaultRate, recoveryRate, opExRate, deployRate,
    reinvestProfit,
    investorCapitalPct, investorProfitShare,
  }), [
    capital, horizon, dealCost, termMonths, downPct, markupPct,
    defaultRate, recoveryRate, opExRate, deployRate,
    reinvestProfit, investorCapitalPct, investorProfitShare,
  ]);

  const allCohorts = useMemo(() => {
    const map = new Map<number, { startMonth: number; count: number }>();
    for (const m of sim.months) {
      if (m.newDeals > 0) map.set(m.month, { startMonth: m.month, count: m.newDeals });
    }
    return Array.from(map.values()).sort((a, b) => a.startMonth - b.startMonth);
  }, [sim]);

  const maxCumProfit   = Math.max(1, ...sim.months.map(m => m.cumulativeNetProfit));
  const maxActiveDeals = Math.max(1, ...sim.months.map(m => m.activeDeals));

  const annualizedRealized = sim.params.capital > 0
    ? Math.pow(1 + sim.totalNetProfit / sim.params.capital, 12 / horizon) - 1
    : 0;
  const annualizedEquity = sim.params.capital > 0
    ? Math.pow(sim.finalEquity / sim.params.capital, 12 / horizon) - 1
    : 0;

  const hasInvestor = investorCapitalPct > 0;

  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="text-base font-bold text-[#0A1628] mb-1">
        Симулятор когорт <span className="text-[11px] font-normal text-[#6B7280]">(Sandbox)</span>
      </h2>
      <p className="text-xs text-[#6B7280] mb-5">
        Полная модель: дефолты, opex, дисциплина деплоя, реинвест/вывод прибыли, инвестор-капитал.
        Наценка <b>{fmtPctInt(markupPct)}</b> берётся из iso-IRR матрицы автоматически.
      </p>

      {/* ════════ Блок 1: Базовые параметры ════════ */}
      <Group title="1. Базовые параметры" accent="#0A1628">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <SliderField label="Стартовый капитал" value={capital}
            min={100_000} max={50_000_000} step={100_000}
            onChange={setCapital} format={v => fmtRub(v) + " ₽"} />
          <SliderField label="Стоимость сделки" value={dealCost}
            min={10_000} max={500_000} step={5_000}
            onChange={setDealCost} format={v => fmtRub(v) + " ₽"} />
          <SliderField label="Срок" value={termMonths}
            min={3} max={24} step={1}
            onChange={setTerm} format={v => `${v} мес`} />
          <SliderField label="Взнос" value={downPct}
            min={0} max={0.5} step={0.05}
            onChange={setDown} format={v => fmtPctInt(v)} />
          <SliderField label="Горизонт" value={horizon}
            min={6} max={36} step={1}
            onChange={setHorizon} format={v => `${v} мес`} />
        </div>
      </Group>

      {/* ════════ Блок 2: Стресс-тест ════════ */}
      <Group title="2. Реалистичные допущения (стресс-тест)" accent="#dc2626">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SliderField label="Доля дефолтов" value={defaultRate}
            min={0} max={0.15} step={0.005}
            onChange={setDefaultRate} format={v => fmtPct(v, 1)} />
          <SliderField label="Возврат с дефолта" value={recoveryRate}
            min={0} max={1} step={0.05}
            onChange={setRecoveryRate} format={v => fmtPctInt(v)} />
          <SliderField label="OpEx (% от gross)" value={opExRate}
            min={0} max={0.5} step={0.01}
            onChange={setOpExRate} format={v => fmtPctInt(v)} />
          <SliderField label="Эффективность деплоя" value={deployRate}
            min={0.5} max={1.0} step={0.05}
            onChange={setDeployRate} format={v => fmtPctInt(v)} />
        </div>
        <p className="text-[10px] text-[#9CA3AF] mt-2 leading-relaxed">
          <b>Возврат с дефолта</b> — какой % всех платежей мы получили, когда клиент перестал платить (обычно 30-60%).
          {" "}<b>Эффективность деплоя</b> &lt;100% — буфер ликвидности или задержка поиска клиентов.
        </p>
      </Group>

      {/* ════════ Блок 3: Стратегия ════════ */}
      <Group title="3. Стратегия капитала" accent="#0C7A58">
        <div className="flex items-start gap-4">
          <button
            onClick={() => setReinvestProfit(v => !v)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div
              className="w-12 h-7 rounded-full transition-colors relative"
              style={{ background: reinvestProfit ? "#0C7A58" : "#D1D5DB" }}
            >
              <div
                className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform"
                style={{ transform: reinvestProfit ? "translateX(24px)" : "translateX(2px)" }}
              />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-[#0A1628]">
                {reinvestProfit ? "Реинвестируем прибыль" : "Выводим прибыль помесячно"}
              </div>
              <div className="text-[10px] text-[#9CA3AF]">
                {reinvestProfit
                  ? "Прибыль остаётся в работе → капитал растёт компаундом"
                  : "Прибыль каждый месяц выводится → капитал ≈ constant"}
              </div>
            </div>
          </button>
        </div>
      </Group>

      {/* ════════ Блок 4: Инвестор ════════ */}
      <Group title="4. Инвестор-капитал и профит-шеринг" accent="#7c3aed">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SliderField label="Доля инвестора в капитале" value={investorCapitalPct}
            min={0} max={1} step={0.05}
            onChange={setInvestorCapitalPct} format={v => fmtPctInt(v)} />
          <SliderField label="Доля инвестора в прибыли" value={investorProfitShare}
            min={0} max={1} step={0.05}
            onChange={setInvestorProfitShare}
            format={v => `${fmtPctInt(v)} / ${fmtPctInt(1 - v)}`} />
        </div>
        {hasInvestor && (
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg p-2.5" style={{ background: "#F5F3FF", border: "1px solid #C4B5FD" }}>
              <span className="text-[#6B7280] text-[10px] uppercase">Инвестор внёс:</span>
              <div className="font-bold text-[#5b21b6]">{fmtRubFull(sim.investorCapital)} ₽</div>
            </div>
            <div className="rounded-lg p-2.5" style={{ background: "#F0FDF4", border: "1px solid #86EFAC" }}>
              <span className="text-[#6B7280] text-[10px] uppercase">Компания внесла:</span>
              <div className="font-bold text-[#065F46]">{fmtRubFull(sim.companyCapital)} ₽</div>
            </div>
          </div>
        )}
      </Group>

      {/* ════════ Сводные метрики ════════ */}
      <div className="mb-6 mt-2">
        <h3 className="text-xs font-semibold uppercase text-[#6B7280] mb-3">Итоги симуляции</h3>

        {/* Profit waterfall */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <MetricCell label="Gross profit"
            value={fmtRubFull(sim.totalGrossProfit) + " ₽"}
            subValue="до вычетов" />
          <MetricCell label="− Дефолты"
            value={"−" + fmtRubFull(sim.totalDefaultLoss) + " ₽"}
            subValue={fmtPct(sim.totalGrossProfit > 0 ? sim.totalDefaultLoss / sim.totalGrossProfit : 0, 1) + " от gross"}
            negative />
          <MetricCell label="− OpEx"
            value={"−" + fmtRubFull(sim.totalOpEx) + " ₽"}
            subValue={fmtPct(opExRate, 0) + " от gross"}
            negative />
          <MetricCell label="= Net profit"
            value={fmtRubFull(sim.totalNetProfit) + " ₽"}
            accent />
        </div>

        {/* Investor & company split */}
        {hasInvestor && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <MetricCell label="Прибыль инвестору"
              value={fmtRubFull(sim.investorProfit) + " ₽"}
              subValue={`ROI ${fmtPct(sim.investorRoiAnnual, 1)}/год`}
              investor />
            <MetricCell label="Прибыль компании"
              value={fmtRubFull(sim.companyProfit) + " ₽"}
              subValue={`ROI ${fmtPct(sim.companyRoiAnnual, 1)}/год`}
              accent />
            <MetricCell label="ROI капитала инвестора"
              value={fmtPct(sim.investorRoiAnnual, 1) + "/год"}
              investor />
            <MetricCell label="ROI капитала компании"
              value={fmtPct(sim.companyRoiAnnual, 1) + "/год"}
              accent />
          </div>
        )}

        {/* Bottom row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <MetricCell label="Закрыто сделок"      value={sim.totalDealsClosed.toString()} />
          <MetricCell label="Steady state"         value={sim.steadyStateMonth !== null ? `M${sim.steadyStateMonth}` : "—"} />
          <MetricCell label="Кеш в конце"          value={fmtRub(sim.finalCash) + " ₽"} />
          {reinvestProfit
            ? <MetricCell label="Equity на конец" value={fmtRub(sim.finalEquity) + " ₽"} accent />
            : <MetricCell label="Выведено за период" value={fmtRub(sim.totalWithdrawn) + " ₽"} accent />}
          <MetricCell
            label={`Annualized ROI (${horizon}мес)`}
            value={fmtPct(annualizedRealized, 1)}
            subValue={reinvestProfit ? "by net profit" : "by withdrawn"}
            accent />
        </div>

        {!reinvestProfit && (
          <p className="text-[11px] text-[#0C7A58] mt-3 italic">
            ℹ️ Прибыль выводится помесячно → капитал не растёт компаундом. {fmtRub(sim.totalWithdrawn)} ₽ извлечено за {horizon} мес ≈ {fmtRub(sim.totalWithdrawn / horizon)} ₽/мес средний денежный поток.
          </p>
        )}
        {reinvestProfit && annualizedEquity > 0 && (
          <p className="text-[11px] text-[#0C7A58] mt-3 italic">
            ℹ️ С учётом неполученных платежей по активным сделкам equity-доходность: <b>{fmtPct(annualizedEquity, 1)}/год</b>.
          </p>
        )}
      </div>

      {/* ════════ Лесенка когорт ════════ */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold uppercase text-[#6B7280] mb-2">Лесенка когорт</h3>
        <p className="text-[11px] text-[#9CA3AF] mb-3">
          Каждая строка — когорта (запуск месяца M_X). ▶ — деплой, ✓ — закрытие. Цвет шкалы от красного (только что развёрнуто) к зелёному (почти выплачено).
        </p>
        <CohortStaircase
          months={horizon}
          cohorts={allCohorts}
          termMonths={termMonths}
          capitalPerDeal={sim.capitalPerDeal}
          monthlyPayment={sim.monthlyPayment}
          maxCohortCount={Math.max(1, ...allCohorts.map(c => c.count))}
        />
      </div>

      {/* ════════ Помесячная таблица ════════ */}
      <div>
        <h3 className="text-xs font-semibold uppercase text-[#6B7280] mb-2">Помесячная динамика</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] uppercase text-[#9CA3AF] border-b border-[#E5E7EB]">
                <th className="text-left p-2">Мес</th>
                <th className="text-right p-2">Кеш ⇨</th>
                <th className="text-right p-2">Получено</th>
                <th className="text-right p-2">Развёрн.</th>
                <th className="text-right p-2">Закрылось</th>
                <th className="text-right p-2">Gross/мес</th>
                <th className="text-right p-2">Net/мес</th>
                {!reinvestProfit && <th className="text-right p-2">Выведено</th>}
                <th className="text-right p-2">Net ∑</th>
                <th className="text-right p-2">Активно</th>
                <th className="text-left p-2 pl-4">Прибыль</th>
                <th className="text-left p-2 pl-4">Активы</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {sim.months.map(m => (
                <MonthRow
                  key={m.month}
                  m={m}
                  maxCumProfit={maxCumProfit}
                  maxActiveDeals={maxActiveDeals}
                  isSteadyState={sim.steadyStateMonth !== null && m.month >= sim.steadyStateMonth}
                  showWithdraw={!reinvestProfit}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════ */

function Group({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 rounded-xl border" style={{ borderColor: "#E5E7EB" }}>
      <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wide rounded-t-xl"
           style={{ background: `${accent}10`, color: accent, borderBottom: "1px solid #E5E7EB" }}>
        {title}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function CohortStaircase({
  months, cohorts, termMonths, capitalPerDeal, monthlyPayment, maxCohortCount,
}: {
  months: number;
  cohorts: { startMonth: number; count: number }[];
  termMonths: number;
  capitalPerDeal: number;
  monthlyPayment: number;
  maxCohortCount: number;
}) {
  if (cohorts.length === 0) return <p className="text-xs text-[#9CA3AF] italic">Когорт нет.</p>;

  const cellWidth = 30;
  return (
    <div className="overflow-x-auto">
      <div className="flex items-center mb-1" style={{ minWidth: 110 + (months + 1) * cellWidth }}>
        <div style={{ width: 110 }} className="text-[10px] uppercase text-[#9CA3AF]">когорта</div>
        {Array.from({ length: months + 1 }, (_, i) => (
          <div key={i} style={{ width: cellWidth }} className="text-center text-[10px] text-[#9CA3AF]">
            M{i}
          </div>
        ))}
      </div>
      {cohorts.map(c => {
        const intensity = c.count / maxCohortCount;
        return (
          <div key={c.startMonth} className="flex items-center mb-0.5"
               style={{ minWidth: 110 + (months + 1) * cellWidth }}>
            <div style={{ width: 110 }} className="text-[10px] text-[#0A1628] font-mono shrink-0">
              <b>M{c.startMonth}</b>·{c.count}×{fmtRub(capitalPerDeal)}
            </div>
            {Array.from({ length: months + 1 }, (_, t) => {
              const age = t - c.startMonth;
              if (age < 0 || age > termMonths) return <div key={t} style={{ width: cellWidth }} />;
              const remaining = Math.max(0, capitalPerDeal - age * monthlyPayment);
              const remainingFrac = remaining / capitalPerDeal;
              const isClosing = age === termMonths;
              const isStart = age === 0;
              const opacity = 0.25 + 0.7 * intensity;
              let bg = "";
              if (isClosing) bg = "#0C7A58";
              else if (isStart) bg = "#dc2626";
              else {
                const hue = 35 + (1 - remainingFrac) * 100;
                bg = `hsl(${hue}, 70%, 50%)`;
              }
              return (
                <div key={t}
                  style={{ width: cellWidth - 2, marginRight: 2, height: 20, background: bg, opacity, borderRadius: 3 }}
                  className="text-center text-[8px] text-white font-bold flex items-center justify-center"
                  title={`M${c.startMonth} · ${c.count} сделок · возраст ${age}`}>
                  {isClosing ? "✓" : isStart ? "▶" : ""}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function MonthRow({
  m, maxCumProfit, maxActiveDeals, isSteadyState, showWithdraw,
}: {
  m: MonthSnapshot;
  maxCumProfit: number;
  maxActiveDeals: number;
  isSteadyState: boolean;
  showWithdraw: boolean;
}) {
  const cumPct = (m.cumulativeNetProfit / maxCumProfit) * 100;
  const activePct = (m.activeDeals / maxActiveDeals) * 100;
  return (
    <tr className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB]">
      <td className="p-2 font-bold" style={{ color: isSteadyState ? "#0C7A58" : "#0A1628" }}>
        M{m.month}{isSteadyState && <span className="ml-1 text-[8px] uppercase text-[#0C7A58]">SS</span>}
      </td>
      <td className="text-right p-2 text-[#6B7280]">{fmtRub(m.cashStart)}</td>
      <td className="text-right p-2" style={{ color: m.inflow > 0 ? "#065F46" : "#9CA3AF" }}>
        {m.inflow > 0 ? "+" + fmtRub(m.inflow) : "—"}
      </td>
      <td className="text-right p-2" style={{ color: m.newDeals > 0 ? "#0A1628" : "#9CA3AF" }}>
        {m.newDeals > 0 ? `${m.newDeals}×` : "—"}
      </td>
      <td className="text-right p-2" style={{ color: m.closedThisMonth > 0 ? "#dc2626" : "#9CA3AF" }}>
        {m.closedThisMonth > 0 ? m.closedThisMonth : "—"}
      </td>
      <td className="text-right p-2" style={{ color: m.grossProfit > 0 ? "#0C7A58" : "#9CA3AF" }}>
        {m.grossProfit > 0 ? "+" + fmtRub(m.grossProfit) : "—"}
      </td>
      <td className="text-right p-2 font-bold" style={{ color: m.netProfit > 0 ? "#0C7A58" : m.netProfit < 0 ? "#dc2626" : "#9CA3AF" }}>
        {m.netProfit !== 0 ? (m.netProfit > 0 ? "+" : "") + fmtRub(m.netProfit) : "—"}
      </td>
      {showWithdraw && (
        <td className="text-right p-2" style={{ color: m.withdrawnThisMonth > 0 ? "#7c3aed" : "#9CA3AF" }}>
          {m.withdrawnThisMonth > 0 ? "−" + fmtRub(m.withdrawnThisMonth) : "—"}
        </td>
      )}
      <td className="text-right p-2 font-bold text-[#0A1628]">{fmtRub(m.cumulativeNetProfit)}</td>
      <td className="text-right p-2 text-[#6B7280]">{m.activeDeals}</td>
      <td className="p-2 pl-4" style={{ width: 80 }}>
        <div className="bg-[#F3F4F6] rounded-full overflow-hidden" style={{ height: 5 }}>
          <div style={{ width: `${cumPct}%`, height: "100%", background: "#0C7A58" }} />
        </div>
      </td>
      <td className="p-2 pl-4" style={{ width: 80 }}>
        <div className="bg-[#F3F4F6] rounded-full overflow-hidden" style={{ height: 5 }}>
          <div style={{ width: `${activePct}%`, height: "100%", background: "#1A3C6E" }} />
        </div>
      </td>
    </tr>
  );
}

function MetricCell({ label, value, subValue, accent, negative, investor }:
  { label: string; value: string; subValue?: string;
    accent?: boolean; negative?: boolean; investor?: boolean }) {
  let bg = "#F9FAFB";
  let border = "#E5E7EB";
  let fg = "#0A1628";
  if (accent)   { bg = "#ECFDF5"; border = "#A7F3D0"; fg = "#065F46"; }
  if (negative) { bg = "#FEF2F2"; border = "#FCA5A5"; fg = "#991B1B"; }
  if (investor) { bg = "#F5F3FF"; border = "#C4B5FD"; fg = "#5b21b6"; }
  return (
    <div className="rounded-lg p-3" style={{ background: bg, border: `1px solid ${border}` }}>
      <div className="text-[10px] uppercase tracking-wide text-[#6B7280] leading-tight">{label}</div>
      <div className="text-sm font-extrabold mt-0.5 leading-tight" style={{ color: fg }}>{value}</div>
      {subValue && <div className="text-[10px] mt-0.5 leading-tight text-[#6B7280]">{subValue}</div>}
    </div>
  );
}

function SliderField({ label, value, min, max, step, onChange, format }: {
  label: string; value: number;
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
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))} className="w-full" />
      <div className="flex justify-between text-[9px] text-[#9CA3AF] mt-0.5">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}
