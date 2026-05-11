/* ================================================================
   cohort-simulator.ts — расширенная симуляция портфеля
   ----------------------------------------------------------------
   Алгоритм каждого месяца:
     1. Принимаем платежи от активных когорт (с учётом дефолтов)
     2. Закрываем когорты, отплатившие N платежей
        → фиксируем gross profit
        → вычитаем default loss и opex → net profit
        → делим net profit между investor и company
     3. Если reinvestProfit=false — выводим net profit из кеша
     4. Из доступного кеша × deployRate деплоим новые сделки
   ================================================================ */

export interface CohortSimParams {
  /* ── Базовые параметры сделки ───────────────────── */
  capital:          number;
  monthsToSimulate: number;
  dealCost:         number;
  termMonths:       number;
  downPct:          number;
  markupPct:        number;

  /* ── Стресс-тест ────────────────────────────────── */
  /** Доля сделок, которые дефолтят (0..1) */
  defaultRate?:     number;
  /** Сколько вернётся от дефолтной сделки (доля от total payments, 0..1) */
  recoveryRate?:    number;
  /** Операционные расходы как доля от gross profit (0..1) */
  opExRate?:        number;
  /** Какой % доступного кеша идёт в новые сделки каждый месяц (0..1) */
  deployRate?:      number;

  /* ── Стратегия капитала (раздельный реинвест) ────── */
  /** Какой % прибыли КОМПАНИИ реинвестируется (0..1). 0=всё выводим, 1=всё в работу */
  companyReinvestPct?:  number;
  /** Какой % прибыли ИНВЕСТОРА реинвестируется (0..1) */
  investorReinvestPct?: number;

  /* ── Инвестор ───────────────────────────────────── */
  /** Доля инвесторского капитала в стартовом капитале (0..1) */
  investorCapitalPct?:  number;
  /** Доля прибыли, отдаваемая инвестору (0..1) — применяется только в carried-режиме */
  investorProfitShare?: number;

  /* ── Модель распределения прибыли ─────────────────
     "prorata" — прибыль делится по текущему балансу (изоляция реинвестов)
     "carried" — фиксированная контрактная доля (carried interest для оператора) */
  profitSplitMode?: "prorata" | "carried";
}

export interface ActiveCohort {
  startMonth:   number;
  count:        number;
  paymentsMade: number;
}

export interface MonthSnapshot {
  month:            number;
  cashStart:        number;
  inflow:           number;
  outflow:          number;
  cashEnd:          number;
  newDeals:         number;
  closedThisMonth:  number;

  /* Profit breakdown */
  grossProfit:      number;     // если бы не было дефолтов и opex
  defaultLoss:      number;
  opExCost:         number;
  netProfit:        number;     // gross − default − opex

  /* Investor / company split */
  investorProfitThisMonth: number;
  companyProfitThisMonth:  number;

  /* Раздельные потоки */
  companyWithdrawnThisMonth:  number;
  companyReinvestedThisMonth: number;
  investorWithdrawnThisMonth: number;
  investorReinvestedThisMonth: number;

  /* Cumulatives */
  cumulativeGrossProfit:        number;
  cumulativeNetProfit:          number;
  cumulativeInvestorProfit:     number;
  cumulativeCompanyProfit:      number;
  cumulativeCompanyWithdrawn:   number;
  cumulativeCompanyReinvested:  number;
  cumulativeInvestorWithdrawn:  number;
  cumulativeInvestorReinvested: number;

  /* Раздельные балансы и доля инвестора в этом месяце */
  investorBalance:  number;
  companyBalance:   number;
  investorShareNow: number;

  activeDeals:      number;
  activeCohorts:    ActiveCohort[];
  capitalOccupied:  number;
  utilization:      number;
}

export interface CohortSimResult {
  params:           CohortSimParams;
  capitalPerDeal:   number;
  monthlyPayment:   number;
  profitPerDeal:    number;
  months:           MonthSnapshot[];

  totalDealsClosed: number;
  totalGrossProfit: number;
  totalDefaultLoss: number;
  totalOpEx:        number;
  totalNetProfit:   number;

  /* Money split */
  investorCapital:  number;
  companyCapital:   number;
  investorProfit:   number;
  companyProfit:    number;

  /* Извлечено и оставлено в работе */
  companyWithdrawn:   number;
  companyReinvested:  number;
  investorWithdrawn:  number;
  investorReinvested: number;
  totalWithdrawn:     number;

  /** ROI investor (annualized, по полной прибыли) */
  investorRoiAnnual: number;
  /** ROI company (annualized, по полной прибыли) */
  companyRoiAnnual:  number;

  finalCash:        number;
  finalActiveDeals: number;
  finalEquity:      number;     // cash + receivables (face value, no haircut)
  steadyStateMonth: number | null;

  /* Балансы — для отображения в UI */
  investorBalanceFinal: number;
  companyBalanceFinal:  number;
  investorShareInitial: number;
  investorShareFinal:   number;
}

export function simulateCohorts(params: CohortSimParams): CohortSimResult {
  const {
    capital, monthsToSimulate, dealCost, termMonths, downPct, markupPct,
    defaultRate         = 0,
    recoveryRate        = 0.5,
    opExRate            = 0,
    deployRate          = 1,
    companyReinvestPct  = 1,
    investorReinvestPct = 1,
    investorCapitalPct  = 0,
    investorProfitShare = 0.5,
    profitSplitMode     = "prorata",
  } = params;

  const capitalPerDeal = dealCost * (1 - downPct);
  const totalPrice     = dealCost * (1 + markupPct);
  const remainingPay   = totalPrice - dealCost * downPct;
  const monthlyPayment = remainingPay / termMonths;
  const profitPerDeal  = dealCost * markupPct;

  /* Эффективная доля платежей, доходящих до нас (учёт дефолтов) */
  const collectionRate = 1 - defaultRate * (1 - recoveryRate);

  const investorCapital = capital * investorCapitalPct;
  const companyCapital  = capital - investorCapital;

  const cohorts: ActiveCohort[] = [];
  const months: MonthSnapshot[] = [];

  let cash = capital;
  /* Раздельные балансы капитала каждой стороны */
  let investorBalance = capital * investorCapitalPct;
  let companyBalance  = capital - investorBalance;
  const investorShareInitial = investorCapitalPct;

  let cumulativeGrossProfit        = 0;
  let cumulativeNetProfit          = 0;
  let cumulativeInvestorProfit     = 0;
  let cumulativeCompanyProfit      = 0;
  let cumulativeCompanyWithdrawn   = 0;
  let cumulativeCompanyReinvested  = 0;
  let cumulativeInvestorWithdrawn  = 0;
  let cumulativeInvestorReinvested = 0;
  let totalDealsClosed = 0;
  let totalDefaultLoss = 0;
  let totalOpEx        = 0;

  let steadyStateMonth: number | null = null;
  let prevActiveCount = -1;
  let stableCount = 0;

  for (let t = 0; t <= monthsToSimulate; t++) {
    const cashStart = cash;
    let inflow = 0;
    let closedThisMonth = 0;
    let grossProfitThisMonth = 0;
    let defaultLossThisMonth = 0;

    /* 1. Платежи от активных когорт (с учётом collectionRate) */
    if (t > 0) {
      for (const cohort of cohorts) {
        const age = t - cohort.startMonth;
        if (age >= 1 && age <= termMonths) {
          const cohortInflow = cohort.count * monthlyPayment * collectionRate;
          inflow += cohortInflow;
          cohort.paymentsMade = age;
        }
      }
    }
    cash += inflow;

    /* 2. Закрытия когорт */
    for (let i = cohorts.length - 1; i >= 0; i--) {
      const c = cohorts[i];
      if (c.paymentsMade >= termMonths) {
        closedThisMonth += c.count;
        /* Gross profit (без учёта дефолтов) */
        grossProfitThisMonth += c.count * profitPerDeal;
        /* Default loss per cohort = count × defaultRate × (1−recoveryRate) × totalPayments
           где totalPayments = capitalPerDeal + profitPerDeal */
        defaultLossThisMonth += c.count * defaultRate * (1 - recoveryRate) *
                                (capitalPerDeal + profitPerDeal);
        cohorts.splice(i, 1);
      }
    }

    /* 3. OpEx и net profit */
    const opExCost = grossProfitThisMonth * opExRate;
    const netProfit = grossProfitThisMonth - defaultLossThisMonth - opExCost;

    /* 4. Split между investor & company — зависит от режима */
    const totalBalance = investorBalance + companyBalance;
    const investorShareNow = profitSplitMode === "prorata"
      ? (totalBalance > 0 ? investorBalance / totalBalance : 0)
      : investorProfitShare;
    const investorPart = netProfit * investorShareNow;
    const companyPart  = netProfit - investorPart;

    cumulativeGrossProfit    += grossProfitThisMonth;
    cumulativeNetProfit      += netProfit;
    cumulativeInvestorProfit += investorPart;
    cumulativeCompanyProfit  += companyPart;
    totalDealsClosed += closedThisMonth;
    totalDefaultLoss += defaultLossThisMonth;
    totalOpEx        += opExCost;

    /* 5. Раздельный вывод/реинвест компании и инвестора */
    let companyWithdrawnThisMonth  = 0;
    let companyReinvestedThisMonth = 0;
    let investorWithdrawnThisMonth = 0;
    let investorReinvestedThisMonth = 0;

    if (companyPart > 0) {
      companyReinvestedThisMonth = companyPart * companyReinvestPct;
      companyWithdrawnThisMonth  = companyPart - companyReinvestedThisMonth;
    }
    if (investorPart > 0) {
      investorReinvestedThisMonth = investorPart * investorReinvestPct;
      investorWithdrawnThisMonth  = investorPart - investorReinvestedThisMonth;
    }

    cumulativeCompanyWithdrawn   += companyWithdrawnThisMonth;
    cumulativeCompanyReinvested  += companyReinvestedThisMonth;
    cumulativeInvestorWithdrawn  += investorWithdrawnThisMonth;
    cumulativeInvestorReinvested += investorReinvestedThisMonth;

    /* Реинвест растит баланс владельца */
    investorBalance += investorReinvestedThisMonth;
    companyBalance  += companyReinvestedThisMonth;

    const totalWithdrawnThisMonth = companyWithdrawnThisMonth + investorWithdrawnThisMonth;
    cash -= totalWithdrawnThisMonth;

    /* 6. Deploy новых сделок (с учётом deployRate) */
    const availableForDeploy = cash * deployRate;
    const newDealsCount = Math.max(0, Math.floor(availableForDeploy / capitalPerDeal));
    const outflow = newDealsCount * capitalPerDeal;
    cash -= outflow;
    if (newDealsCount > 0) {
      cohorts.push({ startMonth: t, count: newDealsCount, paymentsMade: 0 });
    }

    const activeDeals = cohorts.reduce((a, c) => a + c.count, 0);
    const capitalOccupied = cohorts.reduce((acc, c) => {
      const remaining = capitalPerDeal - c.paymentsMade * monthlyPayment * collectionRate;
      return acc + Math.max(0, remaining * c.count);
    }, 0);
    const totalWithdrawnSoFar = cumulativeCompanyWithdrawn + cumulativeInvestorWithdrawn;
    const equityNow = capital + cumulativeNetProfit - totalWithdrawnSoFar;
    const utilization = equityNow > 0 ? Math.min(1, capitalOccupied / equityNow) : 0;

    months.push({
      month: t,
      cashStart,
      inflow,
      outflow,
      cashEnd: cash,
      newDeals: newDealsCount,
      closedThisMonth,
      grossProfit: grossProfitThisMonth,
      defaultLoss: defaultLossThisMonth,
      opExCost,
      netProfit,
      investorProfitThisMonth: investorPart,
      companyProfitThisMonth:  companyPart,
      companyWithdrawnThisMonth,
      companyReinvestedThisMonth,
      investorWithdrawnThisMonth,
      investorReinvestedThisMonth,
      cumulativeGrossProfit,
      cumulativeNetProfit,
      cumulativeInvestorProfit,
      cumulativeCompanyProfit,
      cumulativeCompanyWithdrawn,
      cumulativeCompanyReinvested,
      cumulativeInvestorWithdrawn,
      cumulativeInvestorReinvested,
      investorBalance,
      companyBalance,
      investorShareNow,
      activeDeals,
      activeCohorts: cohorts.map(c => ({ ...c })),
      capitalOccupied,
      utilization,
    });

    if (t >= termMonths) {
      if (Math.abs(activeDeals - prevActiveCount) <= 1) stableCount++;
      else stableCount = 0;
      if (stableCount >= 3 && steadyStateMonth === null) steadyStateMonth = t - 2;
      prevActiveCount = activeDeals;
    }
  }

  const finalCash = cash;
  const finalActiveDeals = cohorts.reduce((a, c) => a + c.count, 0);
  const finalReceivables = cohorts.reduce((acc, c) => {
    const remaining = termMonths - c.paymentsMade;
    return acc + c.count * remaining * monthlyPayment * collectionRate;
  }, 0);
  const totalWithdrawn = cumulativeCompanyWithdrawn + cumulativeInvestorWithdrawn;
  const finalEquity = finalCash + finalReceivables + totalWithdrawn;

  /* ROI annualized */
  const horizonYears = monthsToSimulate / 12;
  const investorRoiAnnual = investorCapital > 0 && horizonYears > 0
    ? Math.pow(1 + cumulativeInvestorProfit / investorCapital, 1 / horizonYears) - 1
    : 0;
  const companyRoiAnnual = companyCapital > 0 && horizonYears > 0
    ? Math.pow(1 + cumulativeCompanyProfit / companyCapital, 1 / horizonYears) - 1
    : 0;

  return {
    params,
    capitalPerDeal,
    monthlyPayment,
    profitPerDeal,
    months,

    totalDealsClosed,
    totalGrossProfit: cumulativeGrossProfit,
    totalDefaultLoss,
    totalOpEx,
    totalNetProfit:   cumulativeNetProfit,

    investorCapital,
    companyCapital,
    investorProfit:    cumulativeInvestorProfit,
    companyProfit:     cumulativeCompanyProfit,

    companyWithdrawn:   cumulativeCompanyWithdrawn,
    companyReinvested:  cumulativeCompanyReinvested,
    investorWithdrawn:  cumulativeInvestorWithdrawn,
    investorReinvested: cumulativeInvestorReinvested,
    totalWithdrawn,

    investorRoiAnnual,
    companyRoiAnnual,

    finalCash,
    finalActiveDeals,
    finalEquity,
    steadyStateMonth,

    investorBalanceFinal: investorBalance,
    companyBalanceFinal:  companyBalance,
    investorShareInitial,
    investorShareFinal:   (investorBalance + companyBalance) > 0
      ? investorBalance / (investorBalance + companyBalance)
      : 0,
  };
}
