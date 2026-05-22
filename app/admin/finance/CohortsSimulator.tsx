"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { simulateCohorts, type MonthSnapshot, type CohortSimResult } from "@/lib/finance/cohort-simulator";
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
  /* ── Базовые (новые дефолты по запросу) ──── */
  const [capital, setCapital]     = useState(10_000_000);
  const [dealCost, setDealCost]   = useState(50_000);
  const [termMonths, setTerm]     = useState(6);
  const [downPct, setDown]        = useState(0.25);
  const [horizon, setHorizon]     = useState(12);

  /* ── Стресс-тест (новые дефолты) ─────────── */
  const [defaultRate, setDefaultRate]   = useState(0.06);
  const [recoveryRate, setRecoveryRate] = useState(0.25);
  const [opExRate, setOpExRate]         = useState(0.20);
  const [deployRate, setDeployRate]     = useState(0.80);
  const [delayRate, setDelayRate]       = useState(0.10);   /* 10% платежей с задержкой на 1 мес */

  /* ── Стратегия (для pro-rata/carried) — 2 слайдера ─ */
  const [companyReinvestPct,  setCompanyReinvestPct]  = useState(1.0);
  const [investorReinvestPct, setInvestorReinvestPct] = useState(1.0);

  /* ── Стратегия (для isolated) — 4 слайдера ─ */
  const [companyReinvestPool1Pct, setCompanyReinvestPool1Pct]   = useState(1.0);
  const [companyReinvestPool2Pct, setCompanyReinvestPool2Pct]   = useState(1.0);
  const [investorReinvestPool2Pct, setInvestorReinvestPool2Pct] = useState(1.0);
  const [investorReinvestPool3Pct, setInvestorReinvestPool3Pct] = useState(1.0);

  /* ── Инвестор ────────────────────────────── */
  const [investorCapitalPct, setInvestorCapitalPct] = useState(0.8);
  const [investorProfitShare, setInvestorProfitShare] = useState(0.4);
  const [profitSplitMode, setProfitSplitMode] = useState<"prorata" | "carried" | "isolated">("isolated");

  /* Наценка — авто из iso-IRR матрицы (округлённая) или ручной override */
  const autoMarkup = useMemo(
    () => markupRounded(termMonths, downPct, inflationAnnual),
    [termMonths, downPct, inflationAnnual],
  );
  const [manualMarkup, setManualMarkup] = useState<number | null>(null);
  const markupPct = manualMarkup ?? autoMarkup;
  const isMarkupAuto = manualMarkup === null;

  const sim = useMemo(() => simulateCohorts({
    capital, monthsToSimulate: horizon,
    dealCost, termMonths, downPct, markupPct,
    defaultRate, recoveryRate, opExRate, deployRate, delayRate,
    companyReinvestPct, investorReinvestPct,
    companyReinvestPool1Pct, companyReinvestPool2Pct,
    investorReinvestPool2Pct, investorReinvestPool3Pct,
    investorCapitalPct, investorProfitShare,
    profitSplitMode,
  }), [
    capital, horizon, dealCost, termMonths, downPct, markupPct,
    defaultRate, recoveryRate, opExRate, deployRate, delayRate,
    companyReinvestPct, investorReinvestPct,
    companyReinvestPool1Pct, companyReinvestPool2Pct,
    investorReinvestPool2Pct, investorReinvestPool3Pct,
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
        Наценка <b>{fmtPctInt(markupPct)}</b>{" "}
        {isMarkupAuto
          ? <>берётся из iso-IRR матрицы автоматически.</>
          : <>задана вручную (<button onClick={() => setManualMarkup(null)} className="underline text-[#0C7A58] hover:text-[#0A1628]">вернуть авто {fmtPctInt(autoMarkup)}</button>).</>}
      </p>

      {/* ════════ Блок 1: Базовые параметры ════════ */}
      <Group title="1. Базовые параметры" accent="#0A1628">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SliderField label="Стартовый капитал" value={capital}
            min={100_000} max={50_000_000} step={100_000}
            onChange={setCapital} format={v => fmtRub(v) + " ₽"}
            tooltip="Общая сумма денег, с которой стартует бизнес. Складывается из капитала компании и инвестора." />
          <SliderField label="Стоимость сделки" value={dealCost}
            min={10_000} max={500_000} step={5_000}
            onChange={setDealCost} format={v => fmtRub(v) + " ₽"}
            tooltip="Цена товара у партнёра, которую мы оплачиваем поставщику. Потом возвращаем через платежи клиента." />
          <SliderField label="Срок" value={termMonths}
            min={3} max={24} step={1}
            onChange={setTerm} format={v => `${v} мес`}
            tooltip="Количество ежемесячных платежей клиента после первоначального взноса. Чем больше срок — тем дольше наш капитал заморожен в одной сделке." />
          <SliderField label="Взнос" value={downPct}
            min={0} max={0.5} step={0.05}
            onChange={setDown} format={v => fmtPctInt(v)}
            tooltip="Процент от стоимости товара, который клиент платит сразу. Чем больше взнос, тем меньше наших денег нужно вложить в одну сделку." />
          <SliderField label="Горизонт" value={horizon}
            min={6} max={36} step={1}
            onChange={setHorizon} format={v => `${v} мес`}
            tooltip="Сколько месяцев симулируем активную выдачу новых сделок. После окончания горизонта запускается wind-down — доплата по уже выданным сделкам без новых выдач." />
          <SliderField
            label={isMarkupAuto ? "Наценка (авто)" : "Наценка (ручная)"}
            value={markupPct}
            min={0.05} max={1.0} step={0.01}
            onChange={v => setManualMarkup(v)}
            format={v => fmtPctInt(v)}
            tooltip="Процент наценки сверх стоимости сделки — наша валовая маржа. Авто-значение берётся из iso-IRR матрицы по сроку/взносу/инфляции. Сдвинь слайдер чтобы переопределить вручную; вернуть к авто можно ссылкой выше." />
        </div>
      </Group>

      {/* ════════ Блок 2: Стресс-тест ════════ */}
      <Group title="2. Реалистичные допущения (стресс-тест)" accent="#dc2626">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <SliderField label="Доля дефолтов"
            value={defaultRate}
            min={0} max={0.15} step={0.005}
            onChange={setDefaultRate} format={v => fmtPct(v, 1)}
            tooltip="Процент клиентов, которые полностью перестали платить. Эти деньги не вернутся (за вычетом частичного возврата). Бенчмарк: 3-5% потребкредит РФ, 5-15% микрофинансы, 1-3% community-based." />
          <SliderField label="Возврат с дефолта"
            value={recoveryRate}
            min={0} max={1} step={0.05}
            onChange={setRecoveryRate} format={v => fmtPctInt(v)}
            tooltip="Какую долю запланированных платежей мы успели получить ДО дефолта клиента. Например, 25% значит клиент сделал 25% от всех платежей и перестал. Бенчмарк: 25-50% обычно для consumer-сегмента." />
          <SliderField label="Просрочка 30+ DPD"
            value={delayRate}
            min={0} max={0.30} step={0.01}
            onChange={setDelayRate} format={v => fmtPctInt(v)}
            tooltip="Процент платежей, приходящих с опозданием на 1 месяц (но всё-таки приходящих). Уменьшает оборачиваемость капитала и эффективную IRR, но не теряем деньги. Бенчмарк: РФ потребкредит 5-8%, BNPL 8-12%, community-based 8-15%." />
          <SliderField label="OpEx (% от gross)"
            value={opExRate}
            min={0} max={0.5} step={0.01}
            onChange={setOpExRate} format={v => fmtPctInt(v)}
            tooltip="Операционные расходы (зарплаты, маркетинг, аренда, эквайринг, налоги) как процент от валовой прибыли каждой сделки. Бенчмарк для финтеха: 15-30% от gross profit." />
          <SliderField label="Эффективность деплоя"
            value={deployRate}
            min={0.5} max={1.0} step={0.05}
            onChange={setDeployRate} format={v => fmtPctInt(v)}
            tooltip="Какой процент доступного кеша мы успеваем развернуть в новые сделки каждый месяц. Значения <100% — буфер ликвидности или задержка поиска клиентов. Идеал 100% бывает редко." />
        </div>
        <div className="text-[10px] text-[#9CA3AF] mt-2 leading-relaxed space-y-1">
          <p>
            <b>Дефолт</b> — клиент совсем перестал платить. <b>Возврат с дефолта</b> — какой % платежей успел сделать (обычно 30-60%).
          </p>
          <p>
            <b>Просрочка 30+ DPD</b> — какой % платежей приходит на 1 мес позже плана (платят, но с опозданием).
            Уменьшает оборачиваемость капитала, не теряем деньги. Бенчмарки: РФ потребкредит 5-8%, BNPL 8-12%, Murabaha 5-10%, community-based 8-15%.
          </p>
          <p>
            <b>Эффективность деплоя</b> &lt;100% — буфер ликвидности или задержка поиска клиентов.
          </p>
        </div>
      </Group>

      {/* ════════ Блок 3: Стратегия (раздельный реинвест) ════════ */}
      <Group title="3. Стратегия капитала — раздельный реинвест" accent="#0C7A58">
        {profitSplitMode === "isolated" ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <SliderField label="🏢 Pool 1 (свой капитал) → реинвест компании"
                value={companyReinvestPool1Pct}
                min={0} max={1} step={0.05}
                onChange={setCompanyReinvestPool1Pct}
                format={v => fmtPctInt(v)}
                parse={s => parseFloat(s) / 100}
                tooltip="Какой процент прибыли с Pool 1 (ваш собственный капитал, 100% ваш) остаётся работать в Pool 1. 100% = всё в работу для компаундинга, 0% = вся прибыль на руки сразу." />
              <SliderField label={`🏢 Pool 2 → доля компании (${fmtPctInt(1 - investorProfitShare)}) → реинвест в Pool 1`}
                value={companyReinvestPool2Pct}
                min={0} max={1} step={0.05}
                onChange={setCompanyReinvestPool2Pct}
                format={v => fmtPctInt(v)}
                parse={s => parseFloat(s) / 100}
                tooltip="Полученную долю прибыли компании с Pool 2 можно реинвестировать. При реинвесте эти деньги ФИЗИЧЕСКИ переходят в Pool 1 (где работают на компанию 100%). При выводе — уходят на руки." />
              <SliderField label={`💼 Pool 2 → доля инвестора (${fmtPctInt(investorProfitShare)}) → реинвест в Pool 3`}
                value={investorReinvestPool2Pct}
                min={0} max={1} step={0.05}
                onChange={setInvestorReinvestPool2Pct}
                format={v => fmtPctInt(v)}
                parse={s => parseFloat(s) / 100}
                tooltip="Полученную долю прибыли инвестора с Pool 2 можно реинвестировать. При реинвесте эти деньги ФИЗИЧЕСКИ переходят в Pool 3 (где работают на инвестора 100%). При выводе — уходят на руки инвестору." />
              <SliderField label="💼 Pool 3 (накопительный) → реинвест инвестора"
                value={investorReinvestPool3Pct}
                min={0} max={1} step={0.05}
                onChange={setInvestorReinvestPool3Pct}
                format={v => fmtPctInt(v)}
                parse={s => parseFloat(s) / 100}
                tooltip="Какой процент прибыли с Pool 3 (накопления инвестора, 100% его) остаётся работать дальше. Аналог Pool 1, но для инвестора." />
            </div>

            <div className="flex flex-wrap gap-2">
              <PresetBtn label="🔁 Всё реинвест"
                onClick={() => { setCompanyReinvestPool1Pct(1); setCompanyReinvestPool2Pct(1); setInvestorReinvestPool2Pct(1); setInvestorReinvestPool3Pct(1); }} />
              <PresetBtn label="💵 Всё выводим"
                onClick={() => { setCompanyReinvestPool1Pct(0); setCompanyReinvestPool2Pct(0); setInvestorReinvestPool2Pct(0); setInvestorReinvestPool3Pct(0); }} />
              <PresetBtn label="🏢 Компания реинвест · 💸 Инвестор вывод"
                onClick={() => { setCompanyReinvestPool1Pct(1); setCompanyReinvestPool2Pct(1); setInvestorReinvestPool2Pct(0); setInvestorReinvestPool3Pct(0); }} />
              <PresetBtn label="🏢 Компания вывод · 💼 Инвестор реинвест"
                onClick={() => { setCompanyReinvestPool1Pct(0); setCompanyReinvestPool2Pct(0); setInvestorReinvestPool2Pct(1); setInvestorReinvestPool3Pct(1); }} />
            </div>

            <p className="mt-3 text-[11px] text-[#6B7280] leading-relaxed">
              <b>4 независимых слайдера</b> — каждый управляет реинвестом из своего пула.
              При реинвесте Pool 2 деньги физически перемещаются: компания → в Pool 1, инвестор → в Pool 3.
              Это даёт полную изоляцию: ваше решение реинвестировать вашу долю влияет только на ваш будущий профит.
            </p>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <SliderField label="Реинвест прибыли КОМПАНИИ"
                value={companyReinvestPct}
                min={0} max={1} step={0.05}
                onChange={setCompanyReinvestPct}
                format={v => fmtPctInt(v)}
                parse={s => parseFloat(s) / 100}
                tooltip="Какая часть прибыли, начисленной компании, остаётся в общем cash-пуле и снова идёт в новые сделки. 100% = всё работает, 0% = вся доля компании выводится на руки каждый месяц." />
              <SliderField label="Реинвест прибыли ИНВЕСТОРА"
                value={investorReinvestPct}
                min={0} max={1} step={0.05}
                onChange={setInvestorReinvestPct}
                format={v => fmtPctInt(v)}
                parse={s => parseFloat(s) / 100}
                tooltip="Какая часть прибыли, начисленной инвестору, остаётся в общем cash-пуле для новых сделок. 100% = инвестор не снимает ничего и наращивает баланс, 0% = инвестор выводит всю свою долю прибыли каждый месяц." />
            </div>

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
            </p>
          </>
        )}
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
          <div className="inline-flex rounded-lg border border-[#E5E7EB] p-0.5 bg-[#F9FAFB] flex-wrap">
            <button
              onClick={() => setProfitSplitMode("isolated")}
              className="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors"
              style={{
                background: profitSplitMode === "isolated" ? "#7c3aed" : "transparent",
                color: profitSplitMode === "isolated" ? "#fff" : "#0A1628",
              }}
            >
              🛡 Isolated Pools
            </button>
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
            {profitSplitMode === "isolated" ? (
              <>
                <b>Isolated Pools:</b> 3 независимых кошелька. Pool 1 — ваш собственный капитал (100% профит вам).
                Pool 2 — инвесторские деньги, профит делится по контракту (например 60/40), при реинвесте перемещается в Pool 1 (компания) или Pool 3 (инвестор).
                Pool 3 — инвесторский накопительный (100% его, генерирует профит только ему).
                <b> Решения каждой стороны изолированы.</b>
              </>
            ) : profitSplitMode === "prorata" ? (
              <>
                <b>Pro-rata:</b> прибыль каждый месяц делится пропорционально <b>текущему балансу</b> каждой стороны.
                Реинвест растит ваш баланс → растёт ваша доля будущей прибыли. Изначальная доля = доля капитала.
              </>
            ) : (
              <>
                <b>Carried interest:</b> прибыль делится по <b>фиксированному контракту</b> (для VC/PE-моделей,
                где инвестор пассивный, а оператор активный → получает carried).
              </>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SliderField label="Доля инвестора в капитале" value={investorCapitalPct}
            min={0} max={1} step={0.05}
            onChange={setInvestorCapitalPct} format={v => fmtPctInt(v)}
            tooltip="Какую часть стартового капитала вносит инвестор, а какую — компания. Например, 80% — это 8 млн из 10 млн дал инвестор, 2 млн — собственные деньги компании. От этой доли отсчитываются балансы и (в pro-rata) пропорция деления прибыли." />
          {(profitSplitMode === "carried" || profitSplitMode === "isolated") && (
            <SliderField
              label={
                profitSplitMode === "isolated"
                  ? "Доля инвестора в прибыли Pool 2 / доля компании"
                  : "Контрактная доля инвестора в прибыли"
              }
              value={investorProfitShare}
              min={0} max={1} step={0.05}
              onChange={setInvestorProfitShare}
              format={v => `${fmtPctInt(v)} / ${fmtPctInt(1 - v)}`}
              parse={s => {
                const n = parseFloat(s.replace(",", "."));
                return isNaN(n) ? investorProfitShare : n / 100;
              }}
              tooltip={
                profitSplitMode === "isolated"
                  ? "Контрактная пропорция деления чистой прибыли с Pool 2 (деньги инвестора в работе) между инвестором и компанией. Pool 1 и Pool 3 делятся 100/0 в свою сторону — этот слайдер на них не влияет."
                  : "Фиксированная контрактная доля инвестора в чистой прибыли (carried interest). Не зависит от текущего соотношения балансов — действует на протяжении всего срока договора."
              } />
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
            subValue="до вычетов"
            tooltip="Валовая прибыль за весь горизонт — сумма markup'ов по всем закрывшимся сделкам, без вычета дефолтов и OpEx. Это 'потолок' доходности." />
          <MetricCell label="− Дефолты"
            value={"−" + fmtRubFull(sim.totalDefaultLoss) + " ₽"}
            subValue={fmtPct(sim.totalGrossProfit > 0 ? sim.totalDefaultLoss / sim.totalGrossProfit : 0, 1) + " от gross"}
            negative
            tooltip="Совокупные потери от просроченных клиентов: доля дефолтов × (1 − recovery) × средний долг по сделке. Эти деньги не вернутся." />
          <MetricCell label="− OpEx"
            value={"−" + fmtRubFull(sim.totalOpEx) + " ₽"}
            subValue={fmtPct(opExRate, 0) + " от gross"}
            negative
            tooltip="Совокупные операционные расходы за горизонт: ФОТ, аренда, реклама, эквайринг, налоги. Считаются как процент от gross markup." />
          <MetricCell label="= Net profit"
            value={fmtRubFull(sim.totalNetProfit) + " ₽"}
            accent
            tooltip="Чистая прибыль = gross − дефолты − OpEx. Именно эта сумма делится между компанией и инвестором по выбранному режиму распределения." />
        </div>

        {/* Компания: прибыль / извлечено / реинвестировано / баланс */}
        <div className="rounded-xl p-4 mb-3" style={{ background: "#F0FDF4", border: "1px solid #86EFAC" }}>
          <h4 className="text-[10px] uppercase font-bold tracking-wider text-[#065F46] mb-2">🏢 Компания</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
            <MetricCell label="Капитал внесён" value={fmtRubFull(sim.companyCapital) + " ₽"}
              tooltip="Стартовый капитал компании — её доля от общего капитала на момент старта симуляции." />
            <MetricCell label="Полная прибыль" value={fmtRubFull(sim.companyProfit) + " ₽"} accent
              tooltip="Net profit, который достался компании за весь горизонт. В режиме pro-rata = доля капитала × net profit, в carried = контрактная доля × net profit, в isolated = вся прибыль с Pool 1 + доля с Pool 2." />
            <MetricCell label="Извлечено (cash)"
              value={fmtRubFull(sim.companyWithdrawn) + " ₽"}
              subValue={`${fmtPctInt(companyReinvestPct === 1 ? 0 : 1 - companyReinvestPct)} от прибыли`}
              tooltip="Сколько компания физически забрала на руки — зависит от слайдера реинвеста. То, что не реинвестируется, уходит как cash." />
            <MetricCell label="В работе (reinvest)"
              value={fmtRubFull(sim.companyReinvested) + " ₽"}
              subValue={`${fmtPctInt(companyReinvestPct)} от прибыли · ROI ${fmtPct(sim.companyRoiAnnual, 1)}/год`} accent
              tooltip="Реинвестированная прибыль компании. ROI — годовая доходность на её стартовый капитал. Создаёт компаунд-эффект." />
          </div>
          {hasInvestor && (
            <div className="grid grid-cols-2 gap-3">
              <MetricCell label="Финальный баланс капитала"
                value={fmtRubFull(sim.companyBalanceFinal) + " ₽"}
                subValue={`${fmtRubFull(sim.companyCapital)} → ${fmtRubFull(sim.companyBalanceFinal)} (рост ${fmtRub(sim.companyBalanceFinal - sim.companyCapital)} ₽)`}
                accent
                tooltip="Капитал компании в конце горизонта = стартовый + реинвестированная прибыль. Растёт за счёт компаундинга." />
              <MetricCell label="Доля владения"
                value={`${fmtPctInt(1 - sim.investorShareInitial)} → ${fmtPctInt(1 - sim.investorShareFinal)}`}
                subValue={profitSplitMode === "prorata" ? "динамическая" : "контрактная (зафиксирована)"}
                tooltip="Доля компании в общем капитале. В pro-rata меняется в зависимости от реинвестов сторон; в carried/isolated зафиксирована контрактом." />
            </div>
          )}
        </div>

        {/* Инвестор: прибыль / извлечено / реинвестировано / баланс */}
        {hasInvestor && (
          <div className="rounded-xl p-4 mb-3" style={{ background: "#F5F3FF", border: "1px solid #C4B5FD" }}>
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-[#5b21b6] mb-2">💼 Инвестор</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
              <MetricCell label="Капитал внесён" value={fmtRubFull(sim.investorCapital) + " ₽"} investor
                tooltip="Стартовый капитал инвестора — то, что он внёс при старте. Не путать с прибылью." />
              <MetricCell label="Полная прибыль" value={fmtRubFull(sim.investorProfit) + " ₽"} investor
                tooltip="Net profit инвестора за горизонт. Не включает возврат основного капитала — только заработок сверху." />
              <MetricCell label="Извлечено (cash)"
                value={fmtRubFull(sim.investorWithdrawn) + " ₽"}
                subValue={`${fmtPctInt(investorReinvestPct === 1 ? 0 : 1 - investorReinvestPct)} от прибыли`}
                tooltip="Сумма, которую инвестор забрал на руки. То, что не реинвестировано по слайдерам — выводится наличными." />
              <MetricCell label="В работе (reinvest)"
                value={fmtRubFull(sim.investorReinvested) + " ₽"}
                subValue={`${fmtPctInt(investorReinvestPct)} от прибыли · ROI ${fmtPct(sim.investorRoiAnnual, 1)}/год`} investor
                tooltip="Реинвестированная прибыль инвестора. ROI — годовая доходность на стартовый капитал инвестора. Удобно сравнивать с депозитом." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MetricCell label="Финальный баланс капитала"
                value={fmtRubFull(sim.investorBalanceFinal) + " ₽"}
                subValue={`${fmtRubFull(sim.investorCapital)} → ${fmtRubFull(sim.investorBalanceFinal)} (рост ${fmtRub(sim.investorBalanceFinal - sim.investorCapital)} ₽)`}
                investor
                tooltip="Капитал инвестора в конце горизонта = стартовый + реинвестированная прибыль. Если выводил всё — баланс остаётся на стартовом." />
              <MetricCell label="Доля владения"
                value={`${fmtPctInt(sim.investorShareInitial)} → ${fmtPctInt(sim.investorShareFinal)}`}
                subValue={profitSplitMode === "prorata" ? "динамическая" : "контрактная (зафиксирована)"}
                tooltip="Доля инвестора в общем капитале. В pro-rata она меняется (если стороны реинвестируют по-разному); в carried/isolated — зафиксирована контрактом." />
            </div>
          </div>
        )}

        {/* Bottom row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <MetricCell label="Закрыто сделок"      value={sim.totalDealsClosed.toString()}
            tooltip="Сколько сделок дозрело за горизонт — клиенты полностью выплатили долг или ушли в дефолт. Только эти сделки реализовали профит." />
          <MetricCell label="Steady state"         value={sim.steadyStateMonth !== null ? `M${sim.steadyStateMonth}` : "—"}
            tooltip="Месяц, после которого месячный денежный поток стабилизировался (нет роста активных сделок). До этого — фаза разгона; после — стабильный режим. '—' = ещё не достигнут на горизонте." />
          <MetricCell label="Кеш в конце"          value={fmtRub(sim.finalCash) + " ₽"}
            tooltip="Свободный cash на всех пулах в последний месяц симуляции — деньги, которые не успели быть деплоены в новые сделки (например, потому что меньше стоимости одной сделки)." />
          <MetricCell label="Total извлечено"      value={fmtRub(sim.totalWithdrawn) + " ₽"} accent
            tooltip="Совокупный денежный поток на руки обеих сторон за горизонт. Показывает 'живые' деньги, выведенные из системы." />
          <MetricCell
            label={`Annualized ROI (${horizon}мес)`}
            value={fmtPct(annualizedRealized, 1)}
            subValue="by net profit"
            accent
            tooltip="Годовая доходность по net profit на весь капитал. Считается как (net profit / общий капитал) × (12 / горизонт). Главная метрика для сравнения с другими инвестициями." />
        </div>

        {sim.totalWithdrawn > 0 && (
          <p className="text-[11px] text-[#6B7280] mt-3 italic">
            ℹ️ За {horizon} мес извлечено <b>{fmtRub(sim.totalWithdrawn)} ₽</b> (среднее <b>{fmtRub(sim.totalWithdrawn / horizon)} ₽/мес</b> денежный поток).
            Equity на конец: <b>{fmtRub(sim.finalEquity)} ₽</b>{annualizedEquity > 0 ? ` → equity-доходность ${fmtPct(annualizedEquity, 1)}/год` : ""}.
          </p>
        )}
      </div>

      {/* ════════ Итог для инвестора — выжимка из симуляции ════════ */}
      {hasInvestor && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold uppercase text-[#6B7280] mb-3">
            💎 Итог для инвестора
          </h3>
          <div
            className="rounded-xl p-5"
            style={{ background: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)", border: "1px solid #C4B5FD" }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#7C3AED] font-bold mb-1">Вклад</div>
                <div className="text-2xl font-extrabold text-[#5B21B6]">
                  {fmtRubFull(sim.investorCapital)}&nbsp;₽
                </div>
                <div className="text-[11px] text-[#7C3AED]/70 mt-0.5">на {horizon} мес</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#7C3AED] font-bold mb-1">Доходность</div>
                <div className="text-2xl font-extrabold text-[#5B21B6]">
                  {fmtPct(sim.investorRoiAnnual, 1)}{" "}
                  <span className="text-base font-bold">/ год</span>
                </div>
                <div className="text-[11px] text-[#7C3AED]/70 mt-0.5">
                  режим:{" "}
                  {profitSplitMode === "prorata"
                    ? "pro-rata"
                    : profitSplitMode === "carried"
                      ? `carried ${fmtPctInt(investorProfitShare)} / ${fmtPctInt(1 - investorProfitShare)}`
                      : `isolated · сплит Pool 2 ${fmtPctInt(investorProfitShare)} / ${fmtPctInt(1 - investorProfitShare)}`}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#7C3AED] font-bold mb-1">Прибыль</div>
                <div className="text-2xl font-extrabold text-[#5B21B6]">
                  {fmtRubFull(sim.investorProfit)}&nbsp;₽
                </div>
                <div className="text-[11px] text-[#7C3AED]/70 mt-0.5">за {horizon} мес</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-[#C4B5FD]/50">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#7C3AED]/80 font-bold mb-0.5">
                  Выплачено на руки
                </div>
                <div className="text-base font-extrabold text-[#5B21B6]">
                  {fmtRubFull(sim.investorWithdrawn)}&nbsp;₽
                  {sim.investorWithdrawn > 0 && horizon > 0 && (
                    <span className="text-[11px] font-normal text-[#7C3AED]/70 ml-2">
                      ≈ {fmtRubFull(sim.investorWithdrawn / horizon)}&nbsp;₽/мес
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#7C3AED]/80 font-bold mb-0.5">
                  Финальный баланс капитала
                </div>
                <div className="text-base font-extrabold text-[#5B21B6]">
                  {fmtRubFull(sim.investorBalanceFinal)}&nbsp;₽
                  <span className="text-[11px] font-normal text-[#7C3AED]/70 ml-2">
                    (старт + реинвест)
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-[#7C3AED]/70 mt-4 italic leading-snug">
              ℹ️ Меняйте сплит и реинвест в полях выше — здесь сразу видно итог. Это та цифра доходности, которую разумно предлагать инвестору (с поправкой на запас).
            </p>
          </div>
        </div>
      )}

      {/* ════════ Isolated Pools — детальная декомпозиция ════════ */}
      {sim.isolated && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold uppercase text-[#6B7280] mb-3">
            🛡 Декомпозиция по пулам (Isolated Mode)
          </h3>

          {/* Pool 1 */}
          <div className="rounded-xl p-4 mb-3" style={{ background: "#F0FDF4", border: "1px solid #86EFAC" }}>
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-[#065F46] mb-2">
              🏢 Pool 1 · Капитал компании ({fmtRub(sim.isolated.pool1.capitalAtStart)} ₽) → 100% профит компании
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCell label="Прибыль с Pool 1"
                value={fmtRubFull(sim.isolated.companyFromP1) + " ₽"} accent
                tooltip="Net profit, заработанный на капитале Pool 1 (собственные деньги компании). Идёт компании 100% — здесь нет деления с инвестором." />
              <MetricCell label="Реинвест Pool 1 → Pool 1"
                value={fmtRubFull(sim.isolated.companyP1Reinvested) + " ₽"}
                tooltip="Прибыль с Pool 1, оставленная работать в самом Pool 1. Управляется слайдером 'Pool 1 → реинвест компании'." />
              <MetricCell label="Вывод из Pool 1"
                value={fmtRubFull(sim.isolated.companyP1Withdrawn) + " ₽"}
                tooltip="Прибыль с Pool 1, выведенная на руки компании. Что не реинвестируется — выводится." />
              <MetricCell label="Cash в конце Pool 1"
                value={fmtRubFull(sim.isolated.pool1.cash) + " ₽"}
                tooltip="Свободные деньги в Pool 1 на конец горизонта, ещё не вложенные в сделки. Если меньше стоимости одной сделки — копятся до следующего месяца." />
            </div>
            <div className="grid grid-cols-3 gap-3 mt-2">
              <MetricCell label="Активных сделок"
                value={sim.isolated.pool1.activeDeals.toString()}
                tooltip="Количество сделок Pool 1, по которым клиенты ещё платят на конец горизонта." />
              <MetricCell label="Сделок в работе на конец"
                value={fmtRubFull(sim.isolated.pool1.receivables) + " ₽"}
                tooltip="Сумма будущих платежей по активным сделкам Pool 1 (принципал + markup). Эти деньги поступят после конца горизонта." />
              <MetricCell label="Всего выдано / закрыто"
                value={`${sim.isolated.pool1.totalDeployed} / ${sim.isolated.pool1.closures}`}
                tooltip="Сколько сделок Pool 1 вообще было выдано за горизонт и сколько из них закрылось (полностью выплачено или ушло в дефолт)." />
            </div>
          </div>

          {/* Pool 2 */}
          <div className="rounded-xl p-4 mb-3" style={{ background: "#FEF3C7", border: "1px solid #FCD34D" }}>
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-[#92400E] mb-2">
              💰 Pool 2 · Инвесторский оригинал ({fmtRub(sim.isolated.pool2.capitalAtStart)} ₽, заблокирован, возврат инвестору в конце срока)
              — профит делится {fmtPctInt(1 - investorProfitShare)} / {fmtPctInt(investorProfitShare)} (компания / инвестор)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCell label={`Компании (${fmtPctInt(1 - investorProfitShare)})`}
                value={fmtRubFull(sim.isolated.companyFromP2) + " ₽"}
                subValue={`из них ${fmtRubFull(sim.isolated.companyP2Reinvested)} → Pool 1, ${fmtRubFull(sim.isolated.companyP2Withdrawn)} вывод`} accent
                tooltip="Доля компании в чистой прибыли с Pool 2 (контрактная пропорция). При реинвесте эти деньги физически перетекают в Pool 1 — становятся капиталом компании." />
              <MetricCell label={`Инвестору (${fmtPctInt(investorProfitShare)})`}
                value={fmtRubFull(sim.isolated.investorFromP2) + " ₽"}
                subValue={`из них ${fmtRubFull(sim.isolated.investorP2Reinvested)} → Pool 3, ${fmtRubFull(sim.isolated.investorP2Withdrawn)} вывод`} investor
                tooltip="Доля инвестора в чистой прибыли с Pool 2 (контрактная пропорция). При реинвесте эти деньги перетекают в Pool 3 — накопительный пул инвестора." />
              <MetricCell label="Cash в Pool 2 в конце"
                value={fmtRubFull(sim.isolated.pool2.cash) + " ₽"}
                subValue="≈ исходный капитал (циклически работает)"
                tooltip="Свободный cash в Pool 2 на конец. Стремится к нулю в режиме full deploy — деньги постоянно крутятся в новых сделках. Возвращается инвестору в wind-down." />
              <MetricCell label="Сделок в работе"
                value={fmtRubFull(sim.isolated.pool2.receivables) + " ₽"}
                subValue={`${sim.isolated.pool2.activeDeals} активных`}
                tooltip="Будущие поступления по активным сделкам Pool 2. Большая часть — возврат оригинального капитала инвестора, меньшая — будущий markup (делится с компанией)." />
            </div>
          </div>

          {/* Pool 3 */}
          <div className="rounded-xl p-4 mb-3" style={{ background: "#F5F3FF", border: "1px solid #C4B5FD" }}>
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-[#5b21b6] mb-2">
              💼 Pool 3 · Инвестор-накопительный (стартует с 0, растёт из реинвестов Pool 2) → 100% профит инвестору
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCell label="Прибыль с Pool 3"
                value={fmtRubFull(sim.isolated.investorFromP3) + " ₽"} investor
                tooltip="Net profit, заработанный на капитале Pool 3 (накопительный пул инвестора). Идёт инвестору 100% — здесь нет деления с компанией." />
              <MetricCell label="Реинвест Pool 3 → Pool 3"
                value={fmtRubFull(sim.isolated.investorP3Reinvested) + " ₽"}
                tooltip="Прибыль с Pool 3, оставленная работать в самом Pool 3. Управляется слайдером 'Pool 3 → реинвест инвестора'." />
              <MetricCell label="Вывод из Pool 3"
                value={fmtRubFull(sim.isolated.investorP3Withdrawn) + " ₽"}
                tooltip="Прибыль с Pool 3, выведенная на руки инвестору. Накопительный пул удобен тем, что инвестор может выводить отсюда без касания оригинального капитала Pool 2." />
              <MetricCell label="Cash в конце Pool 3"
                value={fmtRubFull(sim.isolated.pool3.cash) + " ₽"} investor
                tooltip="Свободный cash в Pool 3 на конец. Может быть выведен инвестору в любой момент — это его 'живые' деньги от реинвестов." />
            </div>
            <div className="grid grid-cols-3 gap-3 mt-2">
              <MetricCell label="Активных сделок"
                value={sim.isolated.pool3.activeDeals.toString()}
                tooltip="Количество сделок Pool 3, по которым клиенты ещё платят. Сделки в Pool 3 выдаются только когда там накопится cash на полную сделку." />
              <MetricCell label="Сделок в работе на конец"
                value={fmtRubFull(sim.isolated.pool3.receivables) + " ₽"}
                tooltip="Будущие поступления по активным сделкам Pool 3. Эти деньги полностью принадлежат инвестору (включая markup)." />
              <MetricCell label="Всего выдано / закрыто"
                value={`${sim.isolated.pool3.totalDeployed} / ${sim.isolated.pool3.closures}`}
                tooltip="Сколько сделок Pool 3 было выдано за горизонт / сколько уже закрылось. Pool 3 начинается с 0, поэтому первые сделки появляются только после первых реинвестов из Pool 2." />
            </div>
          </div>
        </div>
      )}

      {/* ════════ 📊 Резюме — что в итоге кому достанется ════════ */}
      <SimulationSummary sim={sim} horizon={horizon} termMonths={termMonths} investorProfitShare={investorProfitShare} />

      {/* ════════ 🏁 Wind-down — что будет если прекратить выдачу ════════ */}
      <WindDownSection sim={sim} horizon={horizon} investorProfitShare={investorProfitShare} />

      {/* ════════ На конец периода — общая сводка ════════ */}
      <div className="mb-6 rounded-xl p-4" style={{ background: "#F9FAFB", border: "1px solid #D1D5DB" }}>
        <h3 className="text-xs font-semibold uppercase text-[#6B7280] mb-2">
          📅 На конец периода ({horizon} мес)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCell label="Cash на всех счетах"
            value={fmtRubFull(sim.finalCash) + " ₽"}
            tooltip="Совокупный свободный cash в Pool 1 + Pool 2 + Pool 3 на последний месяц симуляции." />
          <MetricCell label="Активных сделок"
            value={sim.finalActiveDeals.toString()}
            tooltip="Общее количество сделок (по всем пулам), по которым клиенты ещё платят на конец горизонта." />
          <MetricCell label="Сделок в работе (receivables)"
            value={fmtRubFull(sim.finalEquity - sim.finalCash - sim.totalWithdrawn) + " ₽"}
            subValue="face value (без дефолтов)"
            tooltip="Будущие поступления по всем активным сделкам — face value, то есть сумма как если бы все клиенты заплатили полностью. Реальный приход будет меньше на default loss." />
          <MetricCell label="Total equity (cash + receivables + извлечено)"
            value={fmtRubFull(sim.finalEquity) + " ₽"} accent
            tooltip="Полная стоимость бизнеса = свободный cash + ожидаемые поступления по сделкам + всё, что уже выведено на руки. Это total value created с момента старта." />
        </div>
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

function MetricCell({ label, value, subValue, accent, negative, investor, tooltip }:
  { label: string; value: string; subValue?: string;
    accent?: boolean; negative?: boolean; investor?: boolean; tooltip?: string }) {
  let bg = "#F9FAFB";
  let border = "#E5E7EB";
  let fg = "#0A1628";
  if (accent)   { bg = "#ECFDF5"; border = "#A7F3D0"; fg = "#065F46"; }
  if (negative) { bg = "#FEF2F2"; border = "#FCA5A5"; fg = "#991B1B"; }
  if (investor) { bg = "#F5F3FF"; border = "#C4B5FD"; fg = "#5b21b6"; }
  return (
    <div className="rounded-lg p-3" style={{ background: bg, border: `1px solid ${border}` }}>
      <div className="text-[10px] uppercase tracking-wide text-[#6B7280] leading-tight inline-flex items-center gap-1">
        {label}
        {tooltip && <InfoTooltip text={tooltip} />}
      </div>
      <div className="text-sm font-extrabold mt-0.5 leading-tight" style={{ color: fg }}>{value}</div>
      {subValue && <div className="text-[10px] mt-0.5 leading-tight text-[#6B7280]">{subValue}</div>}
    </div>
  );
}

/**
 * InfoTooltip — кликабельная иконка ⓘ, по нажатию показывает попап-подсказку.
 * Используется и в слайдерах, и в карточках результата.
 */
function InfoTooltip({ text, align = "left" }: { text: string; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold text-[#6B7280] bg-[#E5E7EB] hover:bg-[#0A1628] hover:text-white transition-colors leading-none"
        aria-label="Подсказка"
        title="Подсказка"
      >
        i
      </button>
      {open && (
        <span
          className="absolute z-50"
          style={{
            bottom: "calc(100% + 8px)",
            ...(align === "right" ? { right: 0 } : { left: 0 }),
            minWidth: 240,
            maxWidth: 320,
            width: "max-content",
            background: "#0A1628",
            color: "#fff",
            padding: "10px 12px",
            borderRadius: "8px",
            fontSize: "11px",
            lineHeight: 1.5,
            fontWeight: 400,
            textTransform: "none",
            letterSpacing: 0,
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            whiteSpace: "normal",
          }}
        >
          {text}
          <span
            style={{
              position: "absolute",
              top: "100%",
              ...(align === "right" ? { right: 6 } : { left: 6 }),
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid #0A1628",
            }}
          />
        </span>
      )}
    </span>
  );
}

function SliderField({ label, value, min, max, step, onChange, format, parse, tooltip }: {
  label: string; value: number;
  min: number; max: number; step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
  parse?: (s: string) => number;   /* для парсинга введённого вручную значения */
  tooltip?: string;                /* подсказка по клику на ⓘ */
}) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState("");

  const dec = () => onChange(Math.max(min, +(value - step).toFixed(6)));
  const inc = () => onChange(Math.min(max, +(value + step).toFixed(6)));

  const startEdit = () => {
    setRaw(format(value).replace(/[^\d.,−-]/g, "").replace(",", "."));
    setEditing(true);
  };
  const commitEdit = () => {
    setEditing(false);
    const n = parse ? parse(raw) : parseFloat(raw.replace(",", "."));
    if (!isNaN(n) && isFinite(n)) onChange(Math.max(min, Math.min(max, n)));
  };

  return (
    <div className="relative">
      <label className="text-xs font-medium text-[#6B7280] flex justify-between items-center mb-1.5">
        <span className="leading-tight inline-flex items-center gap-1.5">
          {label}
          {tooltip && <InfoTooltip text={tooltip} />}
        </span>
        {editing ? (
          <input
            autoFocus
            value={raw}
            onChange={e => setRaw(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={e => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") setEditing(false);
            }}
            className="w-24 text-right border border-[#0C7A58] rounded px-1.5 py-0.5 text-xs font-mono outline-none"
          />
        ) : (
          <button
            onClick={startEdit}
            className="font-mono text-xs font-bold text-[#0A1628] hover:bg-[#F3F4F6] px-1.5 py-0.5 rounded transition-colors"
            title="Кликни чтобы ввести значение вручную"
          >
            {format(value)}
          </button>
        )}
      </label>
      <div className="flex items-center gap-2">
        <button
          onClick={dec}
          className="w-7 h-7 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#0A1628] font-bold text-base flex items-center justify-center shrink-0 transition-colors"
          aria-label="Уменьшить"
        >−</button>
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="flex-1 slider-enhanced"
        />
        <button
          onClick={inc}
          className="w-7 h-7 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#0A1628] font-bold text-base flex items-center justify-center shrink-0 transition-colors"
          aria-label="Увеличить"
        >+</button>
      </div>
      <div className="flex justify-between text-[9px] text-[#9CA3AF] mt-0.5 px-1">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   📊 SimulationSummary — человеческое резюме
   ════════════════════════════════════════════════════════════ */
function SimulationSummary({
  sim, horizon, termMonths, investorProfitShare,
}: {
  sim: CohortSimResult;
  horizon: number;
  termMonths: number;
  investorProfitShare: number;
}) {
  const isolated = sim.isolated;
  const hasInvestor = sim.investorCapital > 0;

  /* Когда последняя сделка завершится */
  const lastSnap = sim.months[sim.months.length - 1];
  const allCohortLastClose = (lastSnap?.activeCohorts ?? []).length > 0
    ? Math.max(...(lastSnap?.activeCohorts ?? []).map(c => c.startMonth + termMonths))
    : horizon;
  const monthsAfterHorizon = Math.max(0, allCohortLastClose - horizon);

  /* Хелперы */
  const word = (n: number, one: string, few: string, many: string): string => {
    const mod10 = n % 10, mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 14) return many;
    if (mod10 === 1) return one;
    if (mod10 >= 2 && mod10 <= 4) return few;
    return many;
  };
  const monthWord = (n: number) => word(n, "месяц", "месяца", "месяцев");
  const dealWord  = (n: number) => word(n, "сделка", "сделки", "сделок");

  /* Pool 1 (компания) */
  const p1Active = isolated?.pool1.activeDeals ?? 0;
  const p1Recv   = isolated?.pool1.receivables ?? 0;
  const p1Cash   = isolated?.pool1.cash ?? sim.finalCash;

  /* Pool 2 (инвесторский оригинал) */
  const p2Active = isolated?.pool2.activeDeals ?? 0;
  const p2Recv   = isolated?.pool2.receivables ?? 0;
  const p2Cash   = isolated?.pool2.cash ?? 0;

  /* Pool 3 (инвесторский накопительный) */
  const p3Active = isolated?.pool3.activeDeals ?? 0;
  const p3Recv   = isolated?.pool3.receivables ?? 0;
  const p3Cash   = isolated?.pool3.cash ?? 0;

  /* Декомпозиция профита для отображения */
  const companyTotal     = sim.companyProfit;
  const companyOnHand    = sim.companyWithdrawn;
  const companyReinvested = sim.companyReinvested;
  const companyROI       = sim.companyRoiAnnual;

  const investorTotal     = sim.investorProfit;
  const investorOnHand    = sim.investorWithdrawn;
  const investorReinvested = sim.investorReinvested;
  const investorROI       = sim.investorRoiAnnual;

  const dataExists = sim.totalDealsClosed > 0 || sim.totalGrossProfit > 0;
  if (!dataExists) {
    return (
      <div className="mb-6 bg-[#FEF3C7] border border-[#FCD34D] rounded-2xl p-5">
        <h3 className="text-base font-bold text-[#92400E] mb-2">📊 Резюме симуляции</h3>
        <p className="text-sm text-[#78350F]">
          За {horizon} {monthWord(horizon)} ни одна сделка не успела закрыться (срок сделки {termMonths} мес).
          Прибыли пока нет. Увеличьте горизонт симуляции до как минимум {termMonths + 1} мес, чтобы увидеть результаты.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 bg-white border-2 border-[#0C7A58] rounded-2xl p-6 shadow-sm">
      <h3 className="text-base font-extrabold text-[#0A1628] mb-1">
        📊 Резюме симуляции — что кому достанется
      </h3>
      <p className="text-xs text-[#6B7280] mb-5">
        Human-language вывод по итогам {horizon} {monthWord(horizon)} работы при текущих параметрах.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── 🏢 КОМПАНИЯ ──────────────────────────────── */}
        <div className="rounded-xl p-5" style={{ background: "#F0FDF4", border: "1px solid #86EFAC" }}>
          <h4 className="text-sm font-extrabold text-[#065F46] mb-3 flex items-center gap-2">
            🏢 Компания
          </h4>

          <p className="text-sm text-[#0A1628] leading-relaxed mb-3">
            За <b>{horizon} {monthWord(horizon)}</b> компания заработала{" "}
            <b className="text-[#065F46]">{fmtRubFull(companyTotal)} ₽</b>{" "}
            <span className="inline-flex items-center gap-1">прибыли <InfoTooltip text="Чистая прибыль компании = её доля от gross markup минус потери от дефолтов и операционные расходы (OpEx). Это деньги, реально доступные для распределения." /></span>{" "}
            {isFinite(companyROI) && companyROI > 0 && (
              <>(<span className="inline-flex items-center gap-1">годовая доходность <InfoTooltip text="Annualized ROI на капитал компании. Считается как (прибыль / стартовый капитал компании) × (12 / горизонт). Показывает, сколько годовых приносит вложенный капитал." /></span> <b>{fmtPct(companyROI, 1)}</b>)</>
            )}.
          </p>

          {isolated && (
            <div className="text-[12px] text-[#374151] mb-3 space-y-1">
              <div className="inline-flex items-center gap-1">📦 Источники прибыли: <InfoTooltip text="В режиме изолированных пулов компания зарабатывает из двух источников: Pool 1 (её собственный капитал, 100% прибыли её) и Pool 2 (инвесторский капитал, делится с инвестором по контрактной пропорции)." /></div>
              <ul className="list-none space-y-0.5 ml-3">
                <li>• <span className="inline-flex items-center gap-1">Pool 1 <InfoTooltip text="Pool 1 — деньги, принадлежащие компании. Сюда входят: её стартовый капитал и реинвестированная прибыль (как со своего пула, так и из доли в Pool 2). Вся прибыль с Pool 1 идёт компании 100%." /></span> (свой капитал {fmtRubFull(isolated.pool1.capitalAtStart)} ₽): <b>{fmtRubFull(isolated.companyFromP1)} ₽</b></li>
                <li>• <span className="inline-flex items-center gap-1">Pool 2 <InfoTooltip text="Pool 2 — деньги инвестора в работе. Капитал заблокирован (не реинвестируется наружу), а прибыль с него делится в контрактной пропорции между компанией и инвестором." /></span> (доля {fmtPctInt(1 - investorProfitShare)} от инвесторского пула): <b>{fmtRubFull(isolated.companyFromP2)} ₽</b></li>
              </ul>
            </div>
          )}

          <div className="text-[12px] text-[#374151] mb-3 space-y-0.5">
            <div>💰 Что произошло с этими деньгами:</div>
            <ul className="list-none space-y-0.5 ml-3">
              <li>
                • <span className="inline-flex items-center gap-1"><b>На руки выведено:</b> <InfoTooltip text="Сумма, которую компания фактически забрала наличными за горизонт симуляции (не вернулась в работу). Зависит от слайдера реинвеста компании — что не реинвестируется, выводится." /></span> {fmtRubFull(companyOnHand)} ₽{" "}
                {companyOnHand > 0 && <span className="text-[#9CA3AF]">(средне {fmtRub(companyOnHand / horizon)} ₽/мес)</span>}
              </li>
              <li>
                • <span className="inline-flex items-center gap-1"><b>Реинвестировано:</b> <InfoTooltip text="Прибыль, которая осталась работать в пулах вместо вывода на руки. Создаёт эффект компаундинга — растёт капитал в работе, растут будущие сделки." /></span> {fmtRubFull(companyReinvested)} ₽
                {isolated && (
                  <span className="text-[#9CA3AF]"> — {fmtRubFull(isolated.companyP1Reinvested)} в Pool 1, {fmtRubFull(isolated.companyP2Reinvested)} перемещено из Pool 2 в Pool 1</span>
                )}
              </li>
            </ul>
          </div>

          {(p1Active > 0 || p1Recv > 0) && (
            <div className="text-[12px] text-[#374151] mb-3 space-y-0.5">
              <div>⏳ В работе на конец периода (Pool 1):</div>
              <ul className="list-none space-y-0.5 ml-3">
                <li>• <span className="inline-flex items-center gap-1"><b>{p1Active} {dealWord(p1Active)}</b> активны <InfoTooltip text="Сделки, которые ещё не закрылись на момент конца горизонта. По ним продолжаются ежемесячные платежи клиентов, но они не успели дозреть до полного возврата капитала+маржи." /></span></li>
                <li>• <span className="inline-flex items-center gap-1">Ожидаемые поступления: <InfoTooltip text="Receivables — сумма, которую ещё должны заплатить клиенты по активным сделкам (оставшийся принципал + markup). Это будущий cash, но не сегодняшняя прибыль." /></span> <b>{fmtRubFull(p1Recv)} ₽</b></li>
                <li>• <span className="inline-flex items-center gap-1">Свободный cash в Pool 1: <InfoTooltip text="Деньги, которые не находятся в активных сделках и доступны для деплоя в новые. Если cash > стоимости сделки, можно выдать новую." /></span> <b>{fmtRubFull(p1Cash)} ₽</b></li>
              </ul>
            </div>
          )}

          {monthsAfterHorizon > 0 && (
            <p className="text-[12px] text-[#065F46] italic">
              📅 Все активные сделки закроются за следующие <b>{monthsAfterHorizon} {monthWord(monthsAfterHorizon)}</b>{" "}
              после конца симуляции. Это деньги, которые ещё «дозреют» вне горизонта.
            </p>
          )}
        </div>

        {/* ── 💼 ИНВЕСТОР ──────────────────────────────── */}
        {hasInvestor ? (
          <div className="rounded-xl p-5" style={{ background: "#F5F3FF", border: "1px solid #C4B5FD" }}>
            <h4 className="text-sm font-extrabold text-[#5b21b6] mb-3 flex items-center gap-2">
              💼 Инвестор
            </h4>

            <p className="text-sm text-[#0A1628] leading-relaxed mb-3">
              За <b>{horizon} {monthWord(horizon)}</b> инвестор заработал{" "}
              <b className="text-[#5b21b6]">{fmtRubFull(investorTotal)} ₽</b>{" "}
              <span className="inline-flex items-center gap-1">прибыли <InfoTooltip text="Чистая прибыль инвестора = его доля от gross markup минус доля в потерях от дефолтов и OpEx. Не путать с возвратом основного капитала — это именно заработок сверху." /></span>{" "}
              {isFinite(investorROI) && investorROI > 0 && (
                <>(<span className="inline-flex items-center gap-1">годовая доходность <InfoTooltip text="Annualized ROI на капитал инвестора. (прибыль / стартовый капитал инвестора) × (12 / горизонт). Удобно сравнивать с банковским депозитом или другими инструментами." /></span> <b>{fmtPct(investorROI, 1)}</b>)</>
              )}.
            </p>

            {isolated && (
              <div className="text-[12px] text-[#374151] mb-3 space-y-1">
                <div className="inline-flex items-center gap-1">📦 Источники прибыли: <InfoTooltip text="В режиме изолированных пулов инвестор зарабатывает из двух источников: его доля прибыли с Pool 2 (контрактная) и весь профит с Pool 3 (накопительный пул реинвестов, 100% его)." /></div>
                <ul className="list-none space-y-0.5 ml-3">
                  <li>• <span className="inline-flex items-center gap-1">Pool 2 <InfoTooltip text="Pool 2 — оригинальные деньги инвестора в работе. Капитал заблокирован, делится только прибыль по контракту. Возвращается инвестору только в wind-down." /></span> (доля {fmtPctInt(investorProfitShare)} от инвесторского пула): <b>{fmtRubFull(isolated.investorFromP2)} ₽</b></li>
                  <li>• <span className="inline-flex items-center gap-1">Pool 3 <InfoTooltip text="Pool 3 — накопительный пул инвестора. Сюда переходит его реинвестированная прибыль из Pool 2. Этот пул работает на 100% инвестора (нет деления с компанией) и доступен для вывода." /></span> (накопительный, его собственный): <b>{fmtRubFull(isolated.investorFromP3)} ₽</b></li>
                </ul>
              </div>
            )}

            <div className="text-[12px] text-[#374151] mb-3 space-y-0.5">
              <div>💰 Что произошло с этими деньгами:</div>
              <ul className="list-none space-y-0.5 ml-3">
                <li>
                  • <span className="inline-flex items-center gap-1"><b>На руки выведено:</b> <InfoTooltip text="Сумма, которую инвестор фактически забрал наличными за горизонт. Зависит от его слайдеров реинвеста (Pool 2 → Pool 3 и Pool 3 → реинвест). Что не реинвестируется — выводится сразу." /></span> {fmtRubFull(investorOnHand)} ₽{" "}
                  {investorOnHand > 0 && <span className="text-[#9CA3AF]">(средне {fmtRub(investorOnHand / horizon)} ₽/мес)</span>}
                </li>
                <li>
                  • <span className="inline-flex items-center gap-1"><b>Реинвестировано:</b> <InfoTooltip text="Прибыль инвестора, которая осталась в работе (главным образом в Pool 3). Растит его собственный накопительный капитал и приносит компаунд-эффект." /></span> {fmtRubFull(investorReinvested)} ₽
                  {isolated && (
                    <span className="text-[#9CA3AF]"> — {fmtRubFull(isolated.investorP2Reinvested)} перемещено в Pool 3, {fmtRubFull(isolated.investorP3Reinvested)} осталось в Pool 3</span>
                  )}
                </li>
              </ul>
            </div>

            {(p2Active > 0 || p3Active > 0 || p2Recv > 0 || p3Recv > 0) && (
              <div className="text-[12px] text-[#374151] mb-3 space-y-0.5">
                <div>⏳ В работе на конец периода:</div>
                <ul className="list-none space-y-0.5 ml-3">
                  {(p2Active > 0 || p2Recv > 0) && (
                    <li>• Pool 2: <b>{p2Active} {dealWord(p2Active)}</b>, ожидаемые поступления <b>{fmtRubFull(p2Recv)} ₽</b></li>
                  )}
                  {(p3Active > 0 || p3Recv > 0) && (
                    <li>• Pool 3: <b>{p3Active} {dealWord(p3Active)}</b>, ожидаемые поступления <b>{fmtRubFull(p3Recv)} ₽</b></li>
                  )}
                  <li>• Cash в Pool 3 (накопительный, доступен инвестору): <b>{fmtRubFull(p3Cash)} ₽</b></li>
                </ul>
              </div>
            )}

            {/* Декомпозиция Pool 2 receivables: что инвестор реально получит */}
            {p2Recv > 0 && isolated && (() => {
              const cost = sim.params.dealCost;
              const downAmt = cost * sim.params.downPct;
              const capPerDeal = cost - downAmt;
              const markupAmt = cost * sim.params.markupPct;
              const totalPay = capPerDeal + markupAmt;
              const principalShare = capPerDeal / totalPay;
              const markupShare = markupAmt / totalPay;
              const principalFromRecv = p2Recv * principalShare;
              const markupFromRecv = p2Recv * markupShare;

              const dRate = sim.params.defaultRate ?? 0;
              const rRate = sim.params.recoveryRate ?? 0.5;
              const opRate = sim.params.opExRate ?? 0;
              const grossFromActive = p2Active * markupAmt;
              const defaultLoss = p2Active * dRate * (1 - rRate) * totalPay;
              const opex = grossFromActive * opRate;
              const netFromActive = grossFromActive - defaultLoss - opex;
              const investorNetShare = netFromActive * investorProfitShare;
              const companyNetShare = netFromActive * (1 - investorProfitShare);

              return (
                <div className="text-[12px] text-[#374151] mb-3 rounded-lg p-2.5"
                     style={{ background: "rgba(124, 58, 237, 0.08)", border: "1px solid rgba(124, 58, 237, 0.2)" }}>
                  <div className="font-bold text-[#5b21b6] mb-1.5 inline-flex items-center gap-1">
                    🔍 Откуда возьмутся {fmtRubFull(p2Recv)} в работе (Pool 2)?
                    <InfoTooltip text="Эта декомпозиция показывает, что 'деньги в работе' Pool 2 — это не вся прибыль инвестора. Большая часть — возврат его собственного капитала (принципал), и только меньшая — будущая прибыль (markup), которая ещё делится с компанией." />
                  </div>
                  <div className="space-y-0.5 ml-1">
                    <div>📦 <b>{fmtRubFull(p2Recv)} ₽</b> — это будущий cash от {p2Active} активных сделок:</div>
                    <ul className="list-none space-y-0.5 ml-3 text-[11.5px]">
                      <li>
                        ├─ <span className="inline-flex items-center gap-1"><b>Принципал (~{fmtPct(principalShare, 0)}):</b> <InfoTooltip text="Принципал — оставшаяся часть капитала клиента, которую он ещё должен вернуть. Это НЕ прибыль, а возврат тела займа. Для инвестора это его собственные деньги, которые он получит обратно." /></span> <b>{fmtRubFull(principalFromRecv)} ₽</b>
                        {" "}<span className="text-[#6B7280]">→ оседает в Pool 2 cash → возвращается инвестору как часть его капитала</span>
                      </li>
                      <li>
                        └─ <span className="inline-flex items-center gap-1"><b>Markup (~{fmtPct(markupShare, 0)}):</b> <InfoTooltip text="Markup — наценка сверху капитала клиента (наша маржа по сделке). Это валовая прибыль, из которой ещё надо вычесть дефолты и OpEx. Делится между инвестором и компанией по контракту." /></span> <b>{fmtRubFull(markupFromRecv)} ₽</b>
                        {" "}<span className="text-[#6B7280]">— это распределённый markup за оставшиеся платежи</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-2 pt-2 border-t border-[#7c3aed]/20">
                    <div className="mb-1">📐 <b>Полный gross markup</b> для {p2Active} активных при закрытии (за вычетом дефолтов/opex):</div>
                    <ul className="list-none space-y-0.5 ml-3 text-[11.5px]">
                      <li><span className="inline-flex items-center gap-1">Gross markup: <InfoTooltip text="Валовая прибыль — суммарный markup по всем сделкам без вычета потерь. Это 'потолок' доходности; реальная прибыль будет меньше." /></span> <b>{fmtRubFull(grossFromActive)} ₽</b></li>
                      <li><span className="inline-flex items-center gap-1">− Default loss <InfoTooltip text="Потери от дефолтов = доля дефолтов × (1 − recovery) × средний долг по сделке. Это деньги, которые мы не вернём с проблемных клиентов." /></span> ({fmtPct(dRate, 1)} × {fmtPct(1 - rRate, 0)}): <b>−{fmtRubFull(defaultLoss)} ₽</b></li>
                      <li><span className="inline-flex items-center gap-1">− OpEx <InfoTooltip text="Операционные расходы — комиссии, ФОТ, эквайринг, реклама. Считаются как процент от gross markup и снижают чистую прибыль." /></span> ({fmtPct(opRate, 0)}): <b>−{fmtRubFull(opex)} ₽</b></li>
                      <li className="font-bold text-[#0A1628]"><span className="inline-flex items-center gap-1">= Net markup <InfoTooltip text="Чистый markup для Pool 2 = gross − дефолты − OpEx. Именно эта сумма потом делится между инвестором и компанией в контрактной пропорции." /></span> для Pool 2: <b>{fmtRubFull(netFromActive)} ₽</b></li>
                      <li>
                        Распределяется {fmtPctInt(1 - investorProfitShare)} / {fmtPctInt(investorProfitShare)}:
                        <ul className="list-none ml-3">
                          <li>├─ <b className="text-[#065F46]">Компании ({fmtPctInt(1 - investorProfitShare)}):</b> <b>{fmtRubFull(companyNetShare)} ₽</b> (через Pool 1 в её хвост)</li>
                          <li>└─ <b className="text-[#5b21b6]">Вам ({fmtPctInt(investorProfitShare)}):</b> <b>{fmtRubFull(investorNetShare)} ₽</b> ← это ваш доход за wind-down</li>
                        </ul>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-2 pt-2 border-t border-[#7c3aed]/20 text-[11px] text-[#6B7280] leading-relaxed">
                    <b>Вывод:</b> большая часть 11.5М в работе — это <b>возврат вашего собственного капитала</b>,
                    а не «новая прибыль». Реальный новый доход за wind-down — это {fmtRubFull(investorNetShare)} ₽
                    (≈ {fmtPctInt(investorNetShare / p2Recv)} от 11.5М в работе).
                  </div>
                </div>
              );
            })()}

            {/* Возврат основного капитала */}
            {isolated && (
              <div className="rounded-lg p-2.5 mt-3" style={{ background: "rgba(124, 58, 237, 0.1)", border: "1px dashed #7c3aed" }}>
                <div className="text-[11px] font-bold text-[#5b21b6] mb-0.5 inline-flex items-center gap-1">🏦 Возврат основного капитала инвестора <InfoTooltip text="Это деньги, которые принадлежат инвестору изначально (его 8 млн из 10), но крутятся в активных сделках. Они НЕ являются прибылью — это возврат тела вклада. Полный возврат происходит, когда все сделки закрываются (wind-down)." /></div>
                <p className="text-[12px] text-[#374151] leading-relaxed">
                  Pool 2 содержит <b>{fmtRubFull(p2Cash + p2Recv)} ₽</b> (cash + receivables) — это
                  оригинальные <b>{fmtRubFull(isolated.pool2.capitalAtStart)} ₽</b> инвестора, которые
                  работают циклически. По истечении инвестиционного срока эти деньги возвращаются инвестору.
                  {p2Recv > 0 && (
                    <> Из них <b>{fmtRubFull(p2Recv)} ₽</b> ещё в активных сделках Pool 2 — поступят в течение {monthsAfterHorizon || termMonths} {monthWord(monthsAfterHorizon || termMonths)}.</>
                  )}
                </p>
              </div>
            )}

            {monthsAfterHorizon > 0 && (
              <p className="text-[12px] text-[#5b21b6] italic mt-3">
                📅 Все его активные сделки закроются за следующие <b>{monthsAfterHorizon} {monthWord(monthsAfterHorizon)}</b>{" "}
                после конца периода.
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-xl p-5" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
            <h4 className="text-sm font-extrabold text-[#9CA3AF] mb-3">💼 Инвестор</h4>
            <p className="text-xs text-[#6B7280]">
              Инвестор не задан (доля капитала инвестора = 0). Вся прибыль идёт компании.
            </p>
          </div>
        )}
      </div>

      {/* Итоговая строка */}
      <div className="mt-5 pt-4 border-t border-[#E5E7EB] text-sm text-[#0A1628]">
        <b>Итого за {horizon} {monthWord(horizon)}:</b>{" "}
        <span className="inline-flex items-center gap-1">совокупная прибыль <InfoTooltip text="Сумма чистой прибыли компании и инвестора за весь горизонт. Net profit = gross markup − дефолты − OpEx. Не включает возврат основного капитала." /></span>{" "}
        <b className="text-[#065F46]">{fmtRubFull(sim.totalNetProfit)} ₽</b>.
        {" "}<span className="inline-flex items-center gap-1">Извлечено наличными: <InfoTooltip text="Total withdrawn — сколько денег физически ушло из системы на руки сторон. Остальная прибыль крутится в работе." /></span> <b>{fmtRubFull(sim.totalWithdrawn)} ₽</b>.
        {" "}<span className="inline-flex items-center gap-1">Реинвестировано в работу: <InfoTooltip text="Часть прибыли, оставленная в пулах для новых сделок. Это создаёт компаунд-эффект — каждый месяц растёт капитал, и значит, объём бизнеса." /></span> <b>{fmtRubFull(sim.totalNetProfit - sim.totalWithdrawn)} ₽</b>.
        {" "}<span className="inline-flex items-center gap-1">В активных сделках: <InfoTooltip text="Количество сделок, по которым клиенты ещё платят на конец горизонта. Они принесут будущий cash и прибыль за пределами симуляции." /></span> <b>{sim.finalActiveDeals} {dealWord(sim.finalActiveDeals)}</b>,{" "}
        <span className="inline-flex items-center gap-1">ожидаемые поступления <InfoTooltip text="Receivables — сумма будущих платежей по всем активным сделкам. Складывается из остатка принципала и markup. Эти деньги придут после конца горизонта." /></span>{" "}
        <b>{fmtRubFull(sim.finalEquity - sim.finalCash - sim.totalWithdrawn)} ₽</b>.
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   🏁 WindDownSection — что будет если прекратить выдачу
   ════════════════════════════════════════════════════════════ */
function WindDownSection({
  sim, horizon,
}: {
  sim: CohortSimResult;
  horizon: number;
  investorProfitShare: number;
}) {
  const wd = sim.windDown;
  if (!wd || wd.months.length === 0) return null;

  const wdHorizon = horizon + wd.totalMonths;
  const horizonCompWithdrawn = sim.companyWithdrawn;
  const horizonInvWithdrawn = sim.investorWithdrawn;

  const word = (n: number, one: string, few: string, many: string) => {
    const mod10 = n % 10, mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 14) return many;
    if (mod10 === 1) return one;
    if (mod10 >= 2 && mod10 <= 4) return few;
    return many;
  };
  const monthWord = (n: number) => word(n, "месяц", "месяца", "месяцев");

  const fmtR = (x: number) => fmtRubFull(x) + " ₽";

  /* Cumulative arrays для прогресс-бара */
  let cumComp = 0, cumInv = 0;
  const cumData = wd.months.map(m => {
    cumComp += m.companyReceives;
    cumInv  += m.investorReceives;
    return { ...m, cumComp, cumInv };
  });

  const maxCum = Math.max(cumComp, cumInv, 1);

  return (
    <div className="mb-6 bg-white border-2 border-[#dc2626] rounded-2xl p-6 shadow-sm">
      <h3 className="text-base font-extrabold text-[#0A1628] mb-1">
        🏁 Что будет если прекратить выдачу новых сделок
      </h3>
      <p className="text-xs text-[#6B7280] mb-5 leading-relaxed">
        Симуляция «wind-down»: после M{horizon} новых сделок не выдаём, только ждём пока активные сделки доплатят свой график.
        Каждый месяц приходят платежи, закрываются когорты, признаётся прибыль, она <b>сразу уходит «в руки»</b> компании и инвестору.
        Продлится <b>{wd.totalMonths} {monthWord(wd.totalMonths)}</b> (до M{wdHorizon}), пока все активные сделки не отплатят свой срок.
      </p>

      {/* Сводка по итогу wind-down */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* Company */}
        <div className="rounded-xl p-4" style={{ background: "#F0FDF4", border: "1px solid #86EFAC" }}>
          <h4 className="text-[10px] uppercase font-bold tracking-wider text-[#065F46] mb-2">
            🏢 Компания получит в итоге
          </h4>
          <div className="text-2xl font-extrabold text-[#065F46] mb-2">{fmtR(wd.companyHandTotal)}</div>
          <div className="text-[11px] text-[#374151] space-y-0.5">
            <div>= уже извлечено за {horizon} мес: <b>{fmtR(horizonCompWithdrawn)}</b></div>
            <div>+ доплатят в wind-down ({wd.totalMonths} мес): <b>{fmtR(wd.totalCompanyReceives)}</b></div>
            <div>+ остаток в Pool 1 после wind-down: <b>{fmtR(wd.finalPool1Cash)}</b></div>
            <div className="text-[#9CA3AF] mt-1 italic">
              ROI от 2М своих: {fmtPct((wd.companyHandTotal - sim.companyCapital) / sim.companyCapital, 1)} за {wdHorizon} мес
            </div>
          </div>
        </div>

        {/* Investor */}
        <div className="rounded-xl p-4" style={{ background: "#F5F3FF", border: "1px solid #C4B5FD" }}>
          <h4 className="text-[10px] uppercase font-bold tracking-wider text-[#5b21b6] mb-2">
            💼 Инвестор получит в итоге
          </h4>
          <div className="text-2xl font-extrabold text-[#5b21b6] mb-2">{fmtR(wd.investorHandTotal)}</div>
          <div className="text-[11px] text-[#374151] space-y-0.5">
            <div>= уже извлечено за {horizon} мес: <b>{fmtR(horizonInvWithdrawn)}</b></div>
            <div>+ доплатят в wind-down ({wd.totalMonths} мес): <b>{fmtR(wd.totalInvestorReceives)}</b></div>
            <div>+ Pool 2 (его капитал назад): <b>{fmtR(wd.finalPool2Cash)}</b></div>
            <div>+ Pool 3 (его накопления): <b>{fmtR(wd.finalPool3Cash)}</b></div>
            <div className="text-[#9CA3AF] mt-1 italic">
              ROI от {fmtRubFull(sim.investorCapital)} ₽: {fmtPct((wd.investorHandTotal - sim.investorCapital) / sim.investorCapital, 1)} за {wdHorizon} мес
            </div>
          </div>
        </div>
      </div>

      {/* Помесячный график wind-down */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[10px] uppercase text-[#9CA3AF] border-b border-[#E5E7EB]">
              <th className="text-left p-2">Месяц</th>
              <th className="text-right p-2">Inflow</th>
              <th className="text-right p-2">Закрылось</th>
              <th className="text-right p-2">OpEx</th>
              <th className="text-right p-2">Net profit</th>
              <th className="text-right p-2">🏢 Получит</th>
              <th className="text-right p-2">💼 Получит</th>
              <th className="text-left p-2 pl-3">🏢 Кумулятив</th>
              <th className="text-left p-2 pl-3">💼 Кумулятив</th>
              <th className="text-right p-2">Активно P1/P2/P3</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {cumData.map(m => (
              <tr key={m.monthOffset} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB]">
                <td className="p-2 font-bold text-[#0A1628]">M{m.absoluteMonth}
                  <span className="text-[9px] text-[#9CA3AF] font-normal ml-1">(+{m.monthOffset})</span>
                </td>
                <td className="text-right p-2">{fmtRub(m.totalInflow)}</td>
                <td className="text-right p-2" style={{ color: m.closures > 0 ? "#dc2626" : "#9CA3AF" }}>
                  {m.closures > 0 ? m.closures : "—"}
                </td>
                <td className="text-right p-2 text-[#9CA3AF]">
                  {m.opEx > 0 ? "−" + fmtRub(m.opEx) : "—"}
                </td>
                <td className="text-right p-2 font-bold" style={{ color: m.netProfit > 0 ? "#0C7A58" : "#9CA3AF" }}>
                  {m.netProfit > 0 ? "+" + fmtRub(m.netProfit) : "—"}
                </td>
                <td className="text-right p-2 font-bold text-[#065F46]">
                  +{fmtRub(m.companyReceives)}
                </td>
                <td className="text-right p-2 font-bold text-[#5b21b6]">
                  +{fmtRub(m.investorReceives)}
                </td>
                <td className="p-2 pl-3" style={{ width: 100 }}>
                  <div className="flex items-center gap-1">
                    <div className="flex-1 bg-[#F3F4F6] rounded-full overflow-hidden" style={{ height: 5 }}>
                      <div style={{ width: `${(m.cumComp / maxCum) * 100}%`, height: "100%", background: "#065F46" }} />
                    </div>
                    <span className="text-[9px] text-[#065F46] font-mono tabular-nums shrink-0">{fmtRub(m.cumComp)}</span>
                  </div>
                </td>
                <td className="p-2 pl-3" style={{ width: 100 }}>
                  <div className="flex items-center gap-1">
                    <div className="flex-1 bg-[#F3F4F6] rounded-full overflow-hidden" style={{ height: 5 }}>
                      <div style={{ width: `${(m.cumInv / maxCum) * 100}%`, height: "100%", background: "#5b21b6" }} />
                    </div>
                    <span className="text-[9px] text-[#5b21b6] font-mono tabular-nums shrink-0">{fmtRub(m.cumInv)}</span>
                  </div>
                </td>
                <td className="text-right p-2 text-[#6B7280]">
                  {m.pool1?.activeAtEnd ?? 0} / {m.pool2?.activeAtEnd ?? 0} / {m.pool3?.activeAtEnd ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Человеческое объяснение */}
      <div className="mt-4 text-[12px] text-[#374151] leading-relaxed">
        <p className="mb-2">
          📅 <b>Расшифровка:</b> за следующие <b>{wd.totalMonths} {monthWord(wd.totalMonths)}</b> после M{horizon}
          будут постепенно дозревать <b>{(sim.isolated?.pool1.activeDeals ?? 0) + (sim.isolated?.pool2.activeDeals ?? 0) + (sim.isolated?.pool3.activeDeals ?? 0)}</b> активных сделок.
          Каждый месяц приходят инсталменты, opex {fmtPct(sim.params.opExRate ?? 0, 0)} вычитается, дефолты ({fmtPct(sim.params.defaultRate ?? 0, 1)} ставка)
          уже учтены в эффективных платежах. Прибыль <b>сразу извлекается на руки</b>: компании из Pool 1 и её 60% доли с Pool 2, инвестору 40% с Pool 2 и его Pool 3.
        </p>
        <p className="mb-2">
          🏦 <b>Возврат капитала инвестора:</b> на конец wind-down Pool 2 содержит <b>{fmtR(wd.finalPool2Cash)}</b>
          — это его исходный капитал, физически возвращённый. Pool 3 содержит ещё <b>{fmtR(wd.finalPool3Cash)}</b>
          — это его накопления, которые он вёл всё время.
        </p>
        <p>
          🏢 <b>Возврат капитала компании:</b> Pool 1 содержит <b>{fmtR(wd.finalPool1Cash)}</b> — это компанийский исходный капитал
          плюс реинвестированная прибыль за основной период.
        </p>
      </div>
    </div>
  );
}
