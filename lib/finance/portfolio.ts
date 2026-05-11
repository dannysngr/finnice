/* ================================================================
   portfolio.ts — сбор и агрегация реальных сделок из Redis
   ----------------------------------------------------------------
   Источник данных: ключи `loans:{phone}` (массив LoanRecord).
   Недостающие поля (cost, markupPct) реконструируем из totalAmount
   с дефолтным markupPct = 25%.
   ================================================================ */

import { getRedis } from "@/lib/redis";
import { irrMonthly, annualFromMonthly, BASELINE_MARKUP } from "@/lib/finance/iso-irr";
import { readLedger, actualXirr, type LedgerEntry } from "@/lib/finance/ledger";
import type { LoanRecord } from "@/app/api/lk/me/route";

export interface EnrichedLoan {
  phone:          string;
  id:             string;
  product:        string;
  status:         "active" | "completed" | "overdue" | "default";

  /* Деньги клиента */
  totalAmount:    number;     // итого для клиента (cost + markup)
  paidAmount:     number;     // фактически выплачено
  monthlyPayment: number;     // ежемесячный платёж
  termMonths:     number;
  downAmount:     number;     // первый платёж (взнос)

  /* Наши деньги */
  costAmount:     number;     // что отдали поставщику
  markupAmount:   number;     // наша прибыль (gross)
  markupPct:      number;     // от costAmount
  capitalT0:      number;     // что вышло с нашего счёта на T0

  /* Времена */
  startDate:      string;     // YYYY-MM-DD
  createdAt:      number;
  cohortMonth:    string;     // YYYY-MM
  monthsElapsed:  number;     // сколько месяцев прошло с выдачи

  /* Прогресс */
  paymentsMadeEstimated: number;  // из paidAmount
  paymentsExpectedNow:   number;  // сколько ДОЛЖНО быть сделано к сегодня
  isOverdue:             boolean;
  remainingPayments:     number;
  outstandingPrincipal:  number;  // = capitalT0 − (paid сейчас вне взноса)

  /* IRR */
  irrAnnualPlanned: number;   // плановая IRR, если всё пойдёт по графику
  irrAnnualActual?: number;   // фактическая IRR (если есть ledger с actual платежами)
  hasLedger?:       boolean;
}

/* ── Реконструкция полей одной сделки ─────────────────────── */
export function reconstructLoan(loan: LoanRecord, phone: string): EnrichedLoan {
  /* Восстанавливаем cost и markup, если их нет */
  const markupPct    = (loan as Partial<EnrichedLoan>).markupPct ?? BASELINE_MARKUP;
  const costAmount   = (loan as Partial<EnrichedLoan>).costAmount ??
                       loan.totalAmount / (1 + markupPct);
  const markupAmount = loan.totalAmount - costAmount;

  /* Восстанавливаем взнос: down = total − monthly × (term − 1) */
  const downAmount = Math.max(0, loan.totalAmount - loan.monthlyPayment * (loan.termMonths - 1));

  const capitalT0 = costAmount - downAmount;

  /* Сколько платежей сделано (грубая оценка) */
  let paymentsMadeEstimated = 0;
  if (loan.paidAmount >= downAmount && downAmount > 0) {
    paymentsMadeEstimated = 1 + Math.floor((loan.paidAmount - downAmount) / loan.monthlyPayment);
  } else if (downAmount === 0) {
    paymentsMadeEstimated = Math.floor(loan.paidAmount / loan.monthlyPayment);
  } else if (loan.paidAmount >= downAmount * 0.5) {
    paymentsMadeEstimated = 0; // взнос частично, но не полностью
  }
  paymentsMadeEstimated = Math.min(paymentsMadeEstimated, loan.termMonths);

  /* Сколько месяцев прошло */
  const start = new Date(loan.startDate);
  const now   = new Date();
  const monthsElapsed = Math.max(0,
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth()    - start.getMonth())
  );
  const paymentsExpectedNow = Math.min(loan.termMonths, monthsElapsed);

  /* Просрочка: если ожидалось больше, чем сделано */
  const isOverdue = paymentsExpectedNow - paymentsMadeEstimated >= 1 && loan.status !== "completed";

  /* Outstanding (сколько ещё наших денег "висит") */
  const principalPaidBack = Math.min(capitalT0, loan.paidAmount - downAmount * (paymentsMadeEstimated > 0 ? 1 : 0));
  const outstandingPrincipal = Math.max(0, capitalT0 - Math.max(0, principalPaidBack));

  /* Плановая IRR */
  const flows: number[] = [-capitalT0];
  for (let i = 0; i < loan.termMonths; i++) flows.push(loan.monthlyPayment);
  const irrM = irrMonthly(flows);
  const irrAnnualPlanned = isFinite(irrM) ? annualFromMonthly(irrM) : NaN;

  /* Cohort month */
  const cohortMonth = loan.startDate.slice(0, 7); // YYYY-MM

  return {
    phone,
    id: loan.id,
    product: loan.product,
    status: loan.status as EnrichedLoan["status"],
    totalAmount: loan.totalAmount,
    paidAmount:  loan.paidAmount,
    monthlyPayment: loan.monthlyPayment,
    termMonths: loan.termMonths,
    downAmount,
    costAmount,
    markupAmount,
    markupPct,
    capitalT0,
    startDate: loan.startDate,
    createdAt: loan.createdAt,
    cohortMonth,
    monthsElapsed,
    paymentsMadeEstimated,
    paymentsExpectedNow,
    isOverdue,
    remainingPayments: Math.max(0, loan.termMonths - paymentsMadeEstimated),
    outstandingPrincipal,
    irrAnnualPlanned,
  };
}

/* ── Сбор всех сделок ─────────────────────────────────────── */
export async function getAllLoans(): Promise<EnrichedLoan[]> {
  const redis = getRedis();
  const profileKeys = await redis.keys("profile:*");
  const all: EnrichedLoan[] = [];

  for (const pk of profileKeys) {
    const phone = pk.replace("profile:", "");
    const loans = await redis.get<LoanRecord[]>(`loans:${phone}`);
    if (!Array.isArray(loans)) continue;
    for (const l of loans) {
      const enriched = reconstructLoan(l, phone);
      /* Подмешиваем actual XIRR из ledger, если есть */
      try {
        const ledger = await readLedger(phone, l.id);
        if (ledger.length > 0) {
          enriched.hasLedger = true;
          const hasActuals = ledger.some(e => e.kind === "installment_actual");
          if (hasActuals) {
            enriched.irrAnnualActual = actualXirr(ledger);
          }
        }
      } catch {}
      all.push(enriched);
    }
  }

  return all.sort((a, b) => b.createdAt - a.createdAt);
}

/* ── Ledger для конкретной сделки (для UI) ─────────────── */
export async function getLoanLedger(phone: string, loanId: string): Promise<LedgerEntry[]> {
  return readLedger(phone, loanId);
}

/* ── Когорты ──────────────────────────────────────────────── */
export interface CohortStats {
  cohortMonth:   string;
  count:         number;
  totalCapital:  number;
  totalMarkup:   number;
  active:        number;
  completed:     number;
  overdue:       number;
  realizedProfit: number;
  expectedProfit: number;
  avgIrr:        number;
}

export function groupByCohort(loans: EnrichedLoan[]): CohortStats[] {
  const map = new Map<string, EnrichedLoan[]>();
  for (const l of loans) {
    if (!map.has(l.cohortMonth)) map.set(l.cohortMonth, []);
    map.get(l.cohortMonth)!.push(l);
  }
  const stats: CohortStats[] = [];
  for (const [month, items] of Array.from(map.entries())) {
    const completed = items.filter(l => l.status === "completed").length;
    const active    = items.filter(l => l.status === "active").length;
    const overdue   = items.filter(l => l.isOverdue).length;
    const totalCapital  = items.reduce((s, l) => s + l.capitalT0, 0);
    const totalMarkup   = items.reduce((s, l) => s + l.markupAmount, 0);
    const realizedProfit = items.filter(l => l.status === "completed").reduce((s, l) => s + l.markupAmount, 0);
    const expectedProfit = items.reduce((s, l) => s + l.markupAmount, 0);
    const avgIrr = items.length > 0
      ? items.reduce((s, l) => s + (isFinite(l.irrAnnualPlanned) ? l.irrAnnualPlanned : 0), 0) / items.length
      : 0;
    stats.push({
      cohortMonth: month,
      count: items.length,
      totalCapital, totalMarkup,
      active, completed, overdue,
      realizedProfit, expectedProfit,
      avgIrr,
    });
  }
  return stats.sort((a, b) => a.cohortMonth.localeCompare(b.cohortMonth));
}

/* ── Портфельная сводка ───────────────────────────────────── */
export interface PortfolioSummary {
  totalDeals:         number;
  activeDeals:        number;
  completedDeals:     number;
  overdueDeals:       number;
  totalCapitalDeployed: number;
  totalOutstanding:   number;
  realizedProfit:     number;
  expectedProfit:     number;
  totalReceivables:   number;
  nplRatio:           number;          // overdue / active
  avgPlannedIrr:      number;
  weightedPlannedIrr: number;          // взвешенный по капиталу
}

export function computePortfolioSummary(loans: EnrichedLoan[]): PortfolioSummary {
  const totalDeals     = loans.length;
  const activeDeals    = loans.filter(l => l.status === "active").length;
  const completedDeals = loans.filter(l => l.status === "completed").length;
  const overdueDeals   = loans.filter(l => l.isOverdue).length;

  const totalCapitalDeployed = loans.reduce((s, l) => s + l.capitalT0, 0);
  const totalOutstanding     = loans
    .filter(l => l.status === "active")
    .reduce((s, l) => s + l.outstandingPrincipal, 0);
  const realizedProfit = loans
    .filter(l => l.status === "completed")
    .reduce((s, l) => s + l.markupAmount, 0);
  const expectedProfit = loans.reduce((s, l) => s + l.markupAmount, 0);
  const totalReceivables = loans
    .filter(l => l.status === "active")
    .reduce((s, l) => s + l.remainingPayments * l.monthlyPayment, 0);

  const nplRatio = activeDeals > 0 ? overdueDeals / activeDeals : 0;

  const validIrrs = loans.filter(l => isFinite(l.irrAnnualPlanned));
  const avgPlannedIrr = validIrrs.length > 0
    ? validIrrs.reduce((s, l) => s + l.irrAnnualPlanned, 0) / validIrrs.length
    : 0;
  const weightedPlannedIrr = totalCapitalDeployed > 0
    ? validIrrs.reduce((s, l) => s + l.irrAnnualPlanned * l.capitalT0, 0) / totalCapitalDeployed
    : 0;

  return {
    totalDeals, activeDeals, completedDeals, overdueDeals,
    totalCapitalDeployed, totalOutstanding,
    realizedProfit, expectedProfit, totalReceivables,
    nplRatio, avgPlannedIrr, weightedPlannedIrr,
  };
}
