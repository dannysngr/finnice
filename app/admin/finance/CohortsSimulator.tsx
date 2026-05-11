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

  /* ── Стратегия (раздельный реинвест) ─────── */
  const [companyReinvestPct,  setCompanyReinvestPct]  = useState(1.0);
  const [investorReinvestPct, setInvestorReinvestPct] = useState(1.0);

  /* ── Инвестор ────────────────────────────── */
  const [investorCapitalPct, setInvestorCapitalPct] = useState(0);
  const [investorProfitShare, setInvestorProfitShare] = useState(0.5);
  const [profitSplitMode, setProfitSplitMode] = useState<"prorata" | "carried">("prorata");

  /* Наценка — из iso-IRR матрицы (округлённая) */
  const markupPct = useMemo(
    () => markupRounded(termMonths, downPct, inflationAnnual),
    [termMonths, downPct, inflationAnnual],
  );

  const sim = useMemo(() => simulateCohorts({
    capital, monthsToSimulate: horizon,
    dealCost, termMonths, downPct, markupPct,
    defaultRate, recoveryRate, opExRate, deployRate,
    companyReinvestPct, investorReinvestPct,
    investorCapitalPct, investorProfitShare,
    profitSplitMode,
  }), [
    capital, horizon, dealCost, termMonths, downPct, markupPct,
    defaultRate, recoveryRate, opExRate, deployRate,
    companyReinvestPct, investorReinvestPct,
    investorCapitalPct, investorProfitShare, profitSplitMode,
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

      {/* ════════ Блок 3: Стратегия (раздельный реинвест) ════════ */}
      <Group title="3. Стратегия капитала — раздельный реинвест" accent="#0C7A58">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <SliderField label="Реинвест прибыли КОМПАНИИ"
            value={companyReinvestPct}
            min={0} max={1} step={0.05}
            onChange={setCompanyReinvestPct}
            format={v => fmtPctInt(v)} />
          <SliderField label="Реинвест прибыли ИНВЕСТОРА"
            value={investorReinvestPct}
            min={0} max={1} step={0.05}
            onChange={setInvestorReinvestPct}
            format={v => fmtPctInt(v)} />
        </div>

        {/* Пресеты */}
        <div className="flex flex-wrap gap-2">
          <PresetBtn label="🔁 Всё реинвест"
            onClick={() => { setCompanyReinvestPct(1); setInvestorReinvestPct(1); }} />
          <PresetBtn label="💵 Всё выводим"
            onClick={() => { setCompanyReinvestPct(0); setInvestorReinvestPct(0); }} />
          <PresetBtn label="🏢 Компания реинвест · 💸 Инвестор вывод"
            onClick={() => { setCompanyReinvestPct(1); setInvestorReinvestPct(0); }} />
          <PresetBtn label="🏢 Компания вывод · 💼 Инвестор реинвест"
            onClick={() => { setCompanyReinvestPct(0); setInvestorReinvestPct(1); }} />
          <PresetBtn label="½ ½"
            onClick={() => { setCompanyReinvestPct(0.5); setInvestorReinvestPct(0.5); }} />
        </div>

        <p className="mt-3 text-[11px] text-[#6B7280] leading-relaxed">
          <b>Реинвест 100%</b> — вся прибыль идёт в новые сделки → капитал растёт компаундом.
          <b> Реинвест 0%</b> — прибыль извлекается → стабильный денежный поток.
          Можно настроить независимо: например, инвестор получает прибыль каждый месяц на руки, а мы остаёмся в работе.
        </p>
      </Group>

      {/* ════════ Блок 4: Инвестор ════════ */}
      <Group title="4. Инвестор-капитал и модель распределения" accent="#7c3aed">
        {/* Toggle режима */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#6B7280]">
              Модель распределения прибыли:
            </span>
          </div>
          <div className="inline-flex rounded-lg border border-[#E5E7EB] p-0.5 bg-[#F9FAFB]">
            <button
              onClick={() => setProfitSplitMode("prorata")}
              className="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors"
              style={{
                background: profitSplitMode === "prorata" ? "#7c3aed" : "transparent",
                color: profitSplitMode === "prorata" ? "#fff" : "#0A1628",
              }}
            >
              Pro-rata по балансу
            </button>
            <button
              onClick={() => setProfitSplitMode("carried")}
              className="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors"
              style={{
                background: profitSplitMode === "carried" ? "#7c3aed" : "transparent",
                color: profitSplitMode === "carried" ? "#fff" : "#0A1628",
              }}
            >
              Carried interest
            </button>
          </div>
          <p className="text-[11px] text-[#6B7280] leading-relaxed mt-2">
            {profitSplitMode === "prorata" ? (
              <>
                <b>Pro-rata:</b> прибыль каждый месяц делится пропорционально <b>текущему балансу</b> каждой стороны.
                Реинвест растит ваш баланс → растёт ваша доля будущей прибыли. Решения сторон <b>изолированы</b>.
                Изначальная доля = доля капитала.
              </>
            ) : (
              <>
                <b>Carried interest:</b> прибыль делится по <b>фиксированному контракту</b> (для VC/PE-моделей,
                где инвестор пассивный, а оператор активный → получает carried). Балансы тоже отслеживаются для прозрачности.
              </>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SliderField label="Доля инвестора в капитале" value={investorCapitalPct}
            min={0} max={1} step={0.05}
            onChange={setInvestorCapitalPct} format={v => fmtPctInt(v)} />
          {profitSplitMode === "carried" && (
            <SliderField label="Контрактная доля инвестора в прибыли" value={investorProfitShare}
              min={0} max={1} step={0.05}
              onChange={setInvestorProfitShare}
              format={v => `${fmtPctInt(v)} / ${fmtPctInt(1 - v)}`} />
          )}
          {profitSplitMode === "prorata" && hasInvestor && (
            <div className="rounded-lg p-3 bg-[#F5F3FF] border border-[#C4B5FD] text-xs">
              <div className="text-[10px] uppercase text-[#6B7280] mb-1">Изначальная доля инвестора в прибыли</div>
              <div className="text-base font-extrabold text-[#5b21b6]">
                = доле капитала ({fmtPctInt(investorCapitalPct)})
              </div>
              <div className="text-[10px] text-[#6B7280] mt-0.5">
                Финальная: <b>{fmtPctInt(sim.investorShareFinal)}</b>
                {Math.abs(sim.investorShareFinal - investorCapitalPct) > 0.001 && (
                  <span className="ml-1" style={{ color: sim.investorShareFinal > investorCapitalPct ? "#0C7A58" : "#dc2626" }}>
                    ({sim.investorShareFinal > investorCapitalPct ? "+" : ""}{((sim.investorShareFinal - investorCapitalPct) * 100).toFixed(1)}пп)
                  </span>
                )}
              </div>
            </div>
          )}
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

        {/* Компания: прибыль / извлечено / реинвестировано / баланс */}
        <div className="rounded-xl p-4 mb-3" style={{ background: "#F0FDF4", border: "1px solid #86EFAC" }}>
          <h4 className="text-[10px] uppercase font-bold tracking-wider text-[#065F46] mb-2">🏢 Компания</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
            <MetricCell label="Капитал внесён" value={fmtRubFull(sim.companyCapital) + " ₽"} />
            <MetricCell label="Полная прибыль" value={fmtRubFull(sim.companyProfit) + " ₽"} accent />
            <MetricCell label="Извлечено (cash)"
              value={fmtRubFull(sim.companyWithdrawn) + " ₽"}
              subValue={`${fmtPctInt(companyReinvestPct === 1 ? 0 : 1 - companyReinvestPct)} от прибыли`} />
            <MetricCell label="В работе (reinvest)"
              value={fmtRubFull(sim.companyReinvested) + " ₽"}
              subValue={`${fmtPctInt(companyReinvestPct)} от прибыли · ROI ${fmtPct(sim.companyRoiAnnual, 1)}/год`} accent />
          </div>
          {hasInvestor && (
            <div className="grid grid-cols-2 gap-3">
              <MetricCell label="Финальный баланс капитала"
                value={fmtRubFull(sim.companyBalanceFinal) + " ₽"}
                subValue={`${fmtRubFull(sim.companyCapital)} → ${fmtRubFull(sim.companyBalanceFinal)} (рост ${fmtRub(sim.companyBalanceFinal - sim.companyCapital)} ₽)`}
                accent />
              <MetricCell label="Доля владения"
                value={`${fmtPctInt(1 - sim.investorShareInitial)} → ${fmtPctInt(1 - sim.investorShareFinal)}`}
                subValue={profitSplitMode === "prorata" ? "динамическая" : "контрактная (зафиксирована)"} />
            </div>
          )}
        </div>

        {/* Инвестор: прибыль / извлечено / реинвестировано / баланс */}
        {hasInvestor && (
          <div className="rounded-xl p-4 mb-3" style={{ background: "#F5F3FF", border: "1px solid #C4B5FD" }}>
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-[#5b21b6] mb-2">💼 Инвестор</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
              <MetricCell label="Капитал внесён" value={fmtRubFull(sim.investorCapital) + " ₽"} investor />
              <MetricCell label="Полная прибыль" value={fmtRubFull(sim.investorProfit) + " ₽"} investor />
              <MetricCell label="Извлечено (cash)"
                value={fmtRubFull(sim.investorWithdrawn) + " ₽"}
                subValue={`${fmtPctInt(investorReinvestPct === 1 ? 0 : 1 - investorReinvestPct)} от прибыли`} />
              <MetricCell label="В работе (reinvest)"
                value={fmtRubFull(sim.investorReinvested) + " ₽"}
                subValue={`${fmtPctInt(investorReinvestPct)} от прибыли · ROI ${fmtPct(sim.investorRoiAnnual, 1)}/год`} investor />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MetricCell label="Финальный баланс капитала"
                value={fmtRubFull(sim.investorBalanceFinal) + " ₽"}
                subValue={`${fmtRubFull(sim.investorCapital)} → ${fmtRubFull(sim.investorBalanceFinal)} (рост ${fmtRub(sim.investorBalanceFinal - sim.investorCapital)} ₽)`}
                investor />
              <MetricCell label="Доля владения"
                value={`${fmtPctInt(sim.investorShareInitial)} → ${fmtPctInt(sim.investorShareFinal)}`}
                subValue={profitSplitMode === "prorata" ? "динамическая" : "контрактная (зафиксирована)"} />
            </div>
          </div>
        )}

        {/* Bottom row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <MetricCell label="Закрыто сделок"      value={sim.totalDealsClosed.toString()} />
          <MetricCell label="Steady state"         value={sim.steadyStateMonth !== null ? `M${sim.steadyStateMonth}` : "—"} />
          <MetricCell label="Кеш в конце"          value={fmtRub(sim.finalCash) + " ₽"} />
          <MetricCell label="Total извлечено"      value={fmtRub(sim.totalWithdrawn) + " ₽"} accent />
          <MetricCell
            label={`Annualized ROI (${horizon}мес)`}
            value={fmtPct(annualizedRealized, 1)}
            subValue="by net profit"
            accent />
        </div>

        {sim.totalWithdrawn > 0 && (
          <p className="text-[11px] text-[#6B7280] mt-3 italic">
            ℹ️ За {horizon} мес извлечено <b>{fmtRub(sim.totalWithdrawn)} ₽</b> (среднее <b>{fmtRub(sim.totalWithdrawn / horizon)} ₽/мес</b> денежный поток).
            Equity на конец: <b>{fmtRub(sim.finalEquity)} ₽</b>{annualizedEquity > 0 ? ` → equity-доходность ${fmtPct(annualizedEquity, 1)}/год` : ""}.
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
                <th className="text-right p-2">🏢 вывод</th>
                {hasInvestor && <th className="text-right p-2">💼 вывод</th>}
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
                  hasInvestor={hasInvestor}
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

function PresetBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-[11px] font-semibold rounded-lg
                 border border-[#D1D5DB] text-[#0A1628] bg-white
                 hover:border-[#0C7A58] hover:bg-[#F0FDF4] transition-colors"
    >
      {label}
    </button>
  );
}

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
  m, maxCumProfit, maxActiveDeals, isSteadyState, hasInvestor,
}: {
  m: MonthSnapshot;
  maxCumProfit: number;
  maxActiveDeals: number;
  isSteadyState: boolean;
  hasInvestor: boolean;
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
      <td className="text-right p-2" style={{ color: m.companyWithdrawnThisMonth > 0 ? "#065F46" : "#9CA3AF" }}>
        {m.companyWithdrawnThisMonth > 0 ? "−" + fmtRub(m.companyWithdrawnThisMonth) : "—"}
      </td>
      {hasInvestor && (
        <td className="text-right p-2" style={{ color: m.investorWithdrawnThisMonth > 0 ? "#5b21b6" : "#9CA3AF" }}>
          {m.investorWithdrawnThisMonth > 0 ? "−" + fmtRub(m.investorWithdrawnThisMonth) : "—"}
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
