/**
 * lib/finance/investor-projections.ts
 *
 * Расчёт прогнозов для отдельного инвестора.
 *
 * Подход:
 *   Для каждого депозита инвестора запускаем cohort-simulator
 *   с двумя сторонами: компания (своя доля) + этот депозит как инвестор-капитал.
 *   Используем admin-policy: markup/inflation/defaultRate/recovery/opex/deploy
 *   (то есть тот же финдвижок, что и для главной симуляции).
 *
 *   Затем суммируем результаты по всем депозитам инвестора:
 *     - ожидаемая прибыль за срок депозита
 *     - годовой ROI
 *     - месячные cash flow по всем депозитам инвестора
 *
 *   Принципы:
 *     • Депозит считается активным, если сейчас < startDate + termMonths
 *     • После окончания срока — возврат тела + накопленная прибыль
 *     • Withdrawal'ы вычитаются из накопленной прибыли (или body если её нет)
 */

import { simulateCohorts, type CohortSimParams } from "@/lib/finance/cohort-simulator";
import { markupRounded } from "@/lib/finance/iso-irr";
import type { Investor, Deposit } from "./investors-store";

export interface AdminPolicy {
  expectedInflationAnnual: number;
  defaultDealCost:    number;
  defaultTermMonths:  number;
  defaultDownPct:     number;
  defaultRate:        number;   // доля дефолтов
  recoveryRate:       number;
  opExRate:           number;
  deployRate:         number;
  /** Капитал компании (для расчёта общего пула в симуляции). По умолчанию 2М */
  companyCapital:     number;
}

export const DEFAULT_POLICY: AdminPolicy = {
  expectedInflationAnnual: 0.12,
  defaultDealCost:    60_000,
  defaultTermMonths:  6,
  defaultDownPct:     0.25,
  defaultRate:        0.06,
  recoveryRate:       0.20,
  opExRate:           0.25,
  deployRate:         0.75,
  companyCapital:     2_000_000,
};

export interface DepositProjection {
  depositId:           string;
  amount:              number;
  termMonths:          number;
  monthsElapsed:       number;       // сколько месяцев прошло
  monthsRemaining:     number;
  startDate:           string;
  maturityDate:        string;
  /** Ожидаемая прибыль инвестора за полный срок депозита */
  expectedProfit:      number;
  /** Ожидаемый годовой ROI */
  expectedRoiAnnual:   number;
  /** Уже заработанная (расчётная) прибыль на сегодняшний день */
  accruedProfit:       number;
  /** Ежемесячные платежи инвестору (cash flow) — массив длиной termMonths */
  monthlyCashFlow:     number[];
  /** Общая сумма к возврату инвестору на дату maturity (тело + прибыль) */
  totalReturn:         number;
}

export interface InvestorProjection {
  investorId:       string;
  fullName:         string;

  /* Capital aggregates */
  totalDeposited:   number;
  totalWithdrawn:   number;
  activePrincipal:  number;       // тело в работе (без выведенного)
  netInvestment:    number;       // deposits - withdrawals

  /* Profit aggregates */
  expectedProfitTotal: number;    // суммарная ожидаемая прибыль за все депозиты
  accruedProfitTotal:  number;    // суммарная прибыль на сегодня
  /** Текущий баланс (тело + прибыль − выводы) */
  currentBalance:      number;

  /* Returns */
  weightedAvgRoiAnnual: number;   // средневзвешенная по сумме доходность

  /* Срок */
  earliestMaturity:    string | null;
  latestMaturity:      string | null;

  /* Per-deposit detail */
  deposits: DepositProjection[];

  /* Месячный денежный поток инвестору (на ближайшие 24 мес от today) */
  upcomingPayouts: Array<{ monthOffset: number; date: string; amount: number }>;
}

function monthsBetween(fromIso: string, toIso: string): number {
  const a = new Date(fromIso);
  const b = new Date(toIso);
  const ym = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  const dayDelta = b.getDate() - a.getDate();
  return ym + (dayDelta >= 0 ? 0 : -1);
}

function addMonths(iso: string, months: number): string {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

/**
 * Прогноз для одного депозита: запускаем симуляцию на termMonths,
 * капитал = depositAmount (инвестор) + policy.companyCapital (компания).
 * investorCapitalPct = depositAmount / totalCapital.
 */
function projectDeposit(dep: Deposit, policy: AdminPolicy, today: string): DepositProjection {
  const totalCapital = dep.amount + policy.companyCapital;
  const investorCapitalPct = totalCapital > 0 ? dep.amount / totalCapital : 0;

  const markupPct = markupRounded(
    policy.defaultTermMonths,
    policy.defaultDownPct,
    policy.expectedInflationAnnual,
  );

  const params: CohortSimParams = {
    capital:          totalCapital,
    monthsToSimulate: dep.termMonths,
    dealCost:         policy.defaultDealCost,
    termMonths:       policy.defaultTermMonths,
    downPct:          policy.defaultDownPct,
    markupPct,
    defaultRate:      policy.defaultRate,
    recoveryRate:     policy.recoveryRate,
    opExRate:         policy.opExRate,
    deployRate:       policy.deployRate,
    companyReinvestPct:  1,   // полный реинвест для оценки потолка
    investorReinvestPct: 1,
    investorCapitalPct,
    investorProfitShare: dep.profitSharePct,
    profitSplitMode:  "carried",
  };

  let sim;
  try {
    sim = simulateCohorts(params);
  } catch {
    sim = null;
  }

  const expectedProfit = sim?.investorProfit ?? 0;
  const expectedRoi = sim?.investorRoiAnnual ?? 0;

  const startDate = dep.date;
  const maturityDate = addMonths(startDate, dep.termMonths);
  const monthsElapsed = Math.max(0, Math.min(dep.termMonths, monthsBetween(startDate, today)));
  const monthsRemaining = Math.max(0, dep.termMonths - monthsElapsed);

  /* Линейная аппроксимация накопленной прибыли */
  const accruedProfit = dep.termMonths > 0
    ? (expectedProfit * monthsElapsed) / dep.termMonths
    : 0;

  /* Месячный cash flow для отображения — равномерное распределение прибыли */
  const monthlyProfit = dep.termMonths > 0 ? expectedProfit / dep.termMonths : 0;
  const monthlyCashFlow: number[] = [];
  for (let i = 1; i <= dep.termMonths; i++) {
    /* В последний месяц возвращаем тело депозита */
    if (i === dep.termMonths) {
      monthlyCashFlow.push(monthlyProfit + dep.amount);
    } else {
      monthlyCashFlow.push(monthlyProfit);
    }
  }

  return {
    depositId:         dep.id,
    amount:            dep.amount,
    termMonths:        dep.termMonths,
    monthsElapsed,
    monthsRemaining,
    startDate,
    maturityDate,
    expectedProfit,
    expectedRoiAnnual: expectedRoi,
    accruedProfit,
    monthlyCashFlow,
    totalReturn:       dep.amount + expectedProfit,
  };
}

export function projectInvestor(
  investor: Investor,
  policy: AdminPolicy = DEFAULT_POLICY,
  today: string = new Date().toISOString().slice(0, 10),
): InvestorProjection {
  const depositProjections = investor.deposits.map(d => projectDeposit(d, policy, today));

  const totalDeposited = investor.deposits.reduce((s, d) => s + d.amount, 0);
  const totalWithdrawn = investor.withdrawals.reduce((s, w) => s + w.amount, 0);
  const netInvestment = totalDeposited - totalWithdrawn;

  const expectedProfitTotal = depositProjections.reduce((s, p) => s + p.expectedProfit, 0);
  const accruedProfitTotal  = depositProjections.reduce((s, p) => s + p.accruedProfit, 0);

  /* Активное тело = сумма депозитов, чей срок ещё не истёк */
  const activePrincipal = depositProjections
    .filter(p => p.monthsRemaining > 0)
    .reduce((s, p) => s + p.amount, 0);

  /* Текущий баланс = чистое тело + накопленная прибыль − выведенные деньги */
  const currentBalance = netInvestment + accruedProfitTotal;

  /* Средневзвешенный годовой ROI (по сумме депозитов) */
  const totalWeight = depositProjections.reduce((s, p) => s + p.amount, 0);
  const weightedAvgRoiAnnual = totalWeight > 0
    ? depositProjections.reduce((s, p) => s + p.expectedRoiAnnual * p.amount, 0) / totalWeight
    : 0;

  const maturities = depositProjections.map(p => p.maturityDate).sort();
  const earliestMaturity = maturities[0] ?? null;
  const latestMaturity   = maturities[maturities.length - 1] ?? null;

  /* Upcoming payouts — суммируем месячные cash flow всех активных депозитов */
  const upcomingPayouts: InvestorProjection["upcomingPayouts"] = [];
  const HORIZON = 24;
  for (let m = 1; m <= HORIZON; m++) {
    const date = addMonths(today, m);
    let amount = 0;
    for (const p of depositProjections) {
      const monthIdx = monthsBetween(p.startDate, date); // 1-based: how many months since start
      if (monthIdx >= 1 && monthIdx <= p.termMonths) {
        amount += p.monthlyCashFlow[monthIdx - 1];
      }
    }
    if (amount > 0) {
      upcomingPayouts.push({ monthOffset: m, date, amount });
    }
  }

  return {
    investorId:           investor.id,
    fullName:             investor.fullName,
    totalDeposited,
    totalWithdrawn,
    activePrincipal,
    netInvestment,
    expectedProfitTotal,
    accruedProfitTotal,
    currentBalance,
    weightedAvgRoiAnnual,
    earliestMaturity,
    latestMaturity,
    deposits: depositProjections,
    upcomingPayouts,
  };
}

export interface PortfolioAggregate {
  totalInvestors:       number;
  totalCapitalRaised:   number;     // всего поднято
  totalWithdrawnAll:    number;
  totalActivePrincipal: number;
  totalExpectedProfit:  number;
  totalAccruedProfit:   number;
  weightedAvgRoiAnnual: number;
  upcomingPayouts:      Array<{ monthOffset: number; date: string; amount: number }>;
}

export function aggregatePortfolio(
  investors: Investor[],
  policy: AdminPolicy = DEFAULT_POLICY,
  today: string = new Date().toISOString().slice(0, 10),
): { aggregate: PortfolioAggregate; projections: InvestorProjection[] } {
  const projections = investors.map(i => projectInvestor(i, policy, today));

  const totalCapitalRaised   = projections.reduce((s, p) => s + p.totalDeposited, 0);
  const totalWithdrawnAll    = projections.reduce((s, p) => s + p.totalWithdrawn, 0);
  const totalActivePrincipal = projections.reduce((s, p) => s + p.activePrincipal, 0);
  const totalExpectedProfit  = projections.reduce((s, p) => s + p.expectedProfitTotal, 0);
  const totalAccruedProfit   = projections.reduce((s, p) => s + p.accruedProfitTotal, 0);

  const weightedAvgRoiAnnual = totalCapitalRaised > 0
    ? projections.reduce((s, p) => s + p.weightedAvgRoiAnnual * p.totalDeposited, 0) / totalCapitalRaised
    : 0;

  /* Aggregate upcoming payouts по месяцам */
  const acc = new Map<number, { date: string; amount: number }>();
  for (const p of projections) {
    for (const u of p.upcomingPayouts) {
      const prev = acc.get(u.monthOffset);
      if (prev) prev.amount += u.amount;
      else acc.set(u.monthOffset, { date: u.date, amount: u.amount });
    }
  }
  const upcomingPayouts = Array.from(acc.entries())
    .map(([monthOffset, v]) => ({ monthOffset, date: v.date, amount: v.amount }))
    .sort((a, b) => a.monthOffset - b.monthOffset);

  return {
    aggregate: {
      totalInvestors: investors.length,
      totalCapitalRaised,
      totalWithdrawnAll,
      totalActivePrincipal,
      totalExpectedProfit,
      totalAccruedProfit,
      weightedAvgRoiAnnual,
      upcomingPayouts,
    },
    projections,
  };
}
