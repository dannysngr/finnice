/**
 * lib/finance/investor-real-metrics.ts
 *
 * Атрибуция РЕАЛЬНЫХ сделок (EnrichedLoan) на инвесторов.
 *
 * Загвоздка: сделки не привязаны к конкретному инвестору — финансируются из общего
 * пула. Поэтому используется time-weighted proportional attribution:
 *
 *   Для каждой сделки в момент её выдачи (startDate):
 *     1. Берём все депозиты, чей период активности (date..date+termMonths) накрывает
 *        дату выдачи сделки.
 *     2. Для каждого такого депозита claim = depositAmount × profitSharePct.
 *     3. Считаем total_claim (включая claim "компании": её капитал × (1 − avg_share)).
 *     4. Доля сделки, приходящаяся инвестору = depositAmount × profitSharePct
 *                                              ÷ (sum_investor_claims + company_claim)
 *
 *   Реальные метрики которые считаем:
 *     • realizedProfit  — доля в markup закрытых сделок
 *     • expectedProfit  — доля в markup активных сделок (если всё пройдёт по плану)
 *     • defaultLoss     — доля в outstanding overdue/default × (1 − recovery)
 *     • opExCharge      — доля в realized × opExRate
 *     • netProfit       — realizedProfit − defaultLoss − opExCharge
 *     • capitalTurnover — total_capital_deployed_attributed ÷ avg_capital_active
 *     • realRoiAnnual   — netProfit / capitalDeposited × 12 / monthsElapsed
 *     • loansBacked     — # сделок, в финансировании которых участвовал инвестор
 */

import type { Investor } from "./investors-store";
import type { EnrichedLoan } from "./portfolio";
import type { AdminPolicy } from "./investor-projections";

export interface InvestorRealMetrics {
  investorId:           string;
  loansBacked:          number;       // # сделок, в которых был активен капитал инвестора
  capitalDeployed:      number;       // ∑ доли сделок × cost — суммарный оборот, который "обслужил" его капитал
  realizedGrossProfit:  number;       // markup закрытых сделок × его доля
  expectedGrossProfit:  number;       // markup активных сделок × его доля (если выплатят)
  defaultLossEstimate:  number;       // потери от overdue/default × его доля
  opExCharge:           number;       // OpEx × его доля от realized (policy rate)
  realizedNetProfit:    number;       // realizedGross − defaultLoss − opEx
  overdueExposure:      number;       // outstanding principal overdue сделок × его доля
  capitalTurnover:      number;       // capitalDeployed / avg_active_capital (раз за период)
  realRoiAnnual:        number;       // realizedNetProfit / capital × 12 / monthsActive
  monthsActive:         number;       // средний срок, в течение которого его капитал работал
}

export interface RealAggregate {
  realRevenueGross:     number;       // сумма markup всех сделок
  realRealizedProfit:   number;       // markup закрытых
  realExpectedProfit:   number;       // markup всех (текущее ожидание)
  realDefaultLoss:      number;       // суммарные потери от overdue
  realOpEx:             number;       // OpEx начисленный
  realNetProfit:        number;       // realized − default − opex
  totalCapitalDeployed: number;       // ∑ cost
  loansAttributed:      number;       // сколько сделок было атрибутировано хоть на кого-то
  unattributedLoans:    number;       // сделки в период, когда инвесторов не было — относим компании
  asOf:                 string;       // YYYY-MM-DD
}

function isoDate(s: string): Date { return new Date(s); }
function addMonths(date: Date, m: number): Date {
  const d = new Date(date); d.setMonth(d.getMonth() + m); return d;
}
function isDepositActiveAt(
  deposit: { date: string; termMonths: number }, at: Date,
): boolean {
  const start = isoDate(deposit.date);
  const end   = addMonths(start, deposit.termMonths);
  return at >= start && at < end;
}
function monthsBetween(from: Date, to: Date): number {
  return Math.max(0,
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth()    - from.getMonth())
  );
}

/**
 * Главная функция: атрибутировать сделки на инвесторов.
 *
 *   companyCapitalConst — капитал компании, используется как "противовес"
 *      для атрибуции. Берётся из policy.companyCapital.
 *   today — точка отсчёта (default = now).
 */
export function computeRealInvestorMetrics(
  investors: Investor[],
  loans:     EnrichedLoan[],
  policy:    AdminPolicy,
  today:     Date = new Date(),
): { perInvestor: Map<string, InvestorRealMetrics>; aggregate: RealAggregate } {

  const companyClaim = policy.companyCapital;   // постоянная "доля" компании
  const opExRate    = policy.opExRate;
  const recoveryRate = policy.recoveryRate;

  /* Инициализируем структуры */
  const perInvestor = new Map<string, InvestorRealMetrics>();
  for (const inv of investors) {
    perInvestor.set(inv.id, {
      investorId:           inv.id,
      loansBacked:          0,
      capitalDeployed:      0,
      realizedGrossProfit:  0,
      expectedGrossProfit:  0,
      defaultLossEstimate:  0,
      opExCharge:           0,
      realizedNetProfit:    0,
      overdueExposure:      0,
      capitalTurnover:      0,
      realRoiAnnual:        0,
      monthsActive:         0,
    });
  }

  const aggregate: RealAggregate = {
    realRevenueGross:     0,
    realRealizedProfit:   0,
    realExpectedProfit:   0,
    realDefaultLoss:      0,
    realOpEx:             0,
    realNetProfit:        0,
    totalCapitalDeployed: 0,
    loansAttributed:      0,
    unattributedLoans:    0,
    asOf:                 today.toISOString().slice(0, 10),
  };

  /* Для каждой сделки */
  for (const loan of loans) {
    const T = isoDate(loan.startDate);
    aggregate.realRevenueGross     += loan.markupAmount;
    aggregate.realExpectedProfit   += loan.markupAmount;
    aggregate.totalCapitalDeployed += loan.costAmount;

    /* Default/overdue estimate */
    const lossOnThisLoan = loan.isOverdue || loan.status === "default"
      ? loan.outstandingPrincipal * (1 - recoveryRate)
      : 0;
    aggregate.realDefaultLoss += lossOnThisLoan;

    if (loan.status === "completed") {
      aggregate.realRealizedProfit += loan.markupAmount;
    }

    /* Соберём все активные депозиты в момент T */
    const activeContribs: Array<{
      investorId: string; depositAmount: number; profitSharePct: number;
    }> = [];
    for (const inv of investors) {
      for (const dep of inv.deposits) {
        if (isDepositActiveAt(dep, T)) {
          activeContribs.push({
            investorId:     inv.id,
            depositAmount:  dep.amount,
            profitSharePct: dep.profitSharePct,
          });
        }
      }
    }

    /* Если никого нет — сделка относится компании, инвесторов не цепляем */
    if (activeContribs.length === 0) {
      aggregate.unattributedLoans++;
      continue;
    }
    aggregate.loansAttributed++;

    /* Считаем total claim. Каждый инвестор: amount × profitSharePct */
    let totalInvestorClaim = 0;
    for (const c of activeContribs) {
      totalInvestorClaim += c.depositAmount * c.profitSharePct;
    }
    /* Компания: companyCapital × (1 − avgShare) — её "вес" в profit-attribution */
    const totalInvestorCapital = activeContribs.reduce((s, c) => s + c.depositAmount, 0);
    const avgProfitShare = totalInvestorCapital > 0
      ? activeContribs.reduce((s, c) => s + c.depositAmount * c.profitSharePct, 0) / totalInvestorCapital
      : 0;
    const companyProfitClaim = companyClaim * (1 - avgProfitShare);

    const totalClaim = totalInvestorClaim + companyProfitClaim;
    if (totalClaim <= 0) {
      aggregate.unattributedLoans++;
      continue;
    }

    /* Атрибутируем каждый компонент сделки на каждого инвестора */
    for (const c of activeContribs) {
      const claim = c.depositAmount * c.profitSharePct;
      const shareOfLoan = claim / totalClaim;

      const m = perInvestor.get(c.investorId)!;
      m.loansBacked++;
      m.capitalDeployed += loan.costAmount * shareOfLoan;

      if (loan.status === "completed") {
        m.realizedGrossProfit += loan.markupAmount * shareOfLoan;
      }
      m.expectedGrossProfit += loan.markupAmount * shareOfLoan;
      m.defaultLossEstimate += lossOnThisLoan * shareOfLoan;
      if (loan.isOverdue || loan.status === "default") {
        m.overdueExposure   += loan.outstandingPrincipal * shareOfLoan;
      }
    }
  }

  /* Финальные деривированные показатели по каждому инвестору */
  for (const inv of investors) {
    const m = perInvestor.get(inv.id)!;

    /* OpEx = realized × opExRate (как в симуляторе) */
    m.opExCharge = m.realizedGrossProfit * opExRate;
    m.realizedNetProfit = m.realizedGrossProfit - m.defaultLossEstimate - m.opExCharge;
    aggregate.realOpEx += m.opExCharge;

    /* monthsActive — средневзвешенный по сумме депозитов срок активности */
    let weightedMonths = 0, totalAmt = 0;
    for (const d of inv.deposits) {
      const start = isoDate(d.date);
      const months = monthsBetween(start, today);
      const active = Math.min(months, d.termMonths);
      weightedMonths += active * d.amount;
      totalAmt += d.amount;
    }
    m.monthsActive = totalAmt > 0 ? weightedMonths / totalAmt : 0;

    /* Оборачиваемость: сколько раз "перевернулся" капитал инвестора.
       capitalDeployed уже доля cost этого инвестора по всем сделкам;
       база = total deposited (его капитал) */
    m.capitalTurnover = totalAmt > 0 ? m.capitalDeployed / totalAmt : 0;

    /* Real ROI annual: net / capital × 12 / months */
    if (totalAmt > 0 && m.monthsActive > 0) {
      m.realRoiAnnual = (m.realizedNetProfit / totalAmt) * (12 / m.monthsActive);
    }
  }

  aggregate.realNetProfit =
    aggregate.realRealizedProfit - aggregate.realDefaultLoss - aggregate.realOpEx;

  return { perInvestor, aggregate };
}
