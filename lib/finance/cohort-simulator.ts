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
  /** [Pro-rata/Carried] Какой % прибыли КОМПАНИИ реинвестируется */
  companyReinvestPct?:  number;
  /** [Pro-rata/Carried] Какой % прибыли ИНВЕСТОРА реинвестируется */
  investorReinvestPct?: number;

  /* ── Раздельный реинвест для режима Isolated Pools ─ */
  /** Pool 1 (company-own) → company reinvest (0..1, default 1) */
  companyReinvestPool1Pct?:  number;
  /** Pool 2 (investor-original) → company share → reinvest в Pool 1 (0..1) */
  companyReinvestPool2Pct?:  number;
  /** Pool 2 (investor-original) → investor share → reinvest в Pool 3 (0..1) */
  investorReinvestPool2Pct?: number;
  /** Pool 3 (investor-accumulated) → investor reinvest (0..1) */
  investorReinvestPool3Pct?: number;

  /* ── Инвестор ───────────────────────────────────── */
  /** Доля инвесторского капитала в стартовом капитале (0..1) */
  investorCapitalPct?:  number;
  /** Доля прибыли, отдаваемая инвестору (0..1) — для carried & isolated */
  investorProfitShare?: number;

  /* ── Модель распределения прибыли ─────────────────
     "prorata"  — прибыль делится по текущему балансу
     "carried"  — фиксированная контрактная доля
     "isolated" — 3 независимых пула (полная изоляция) */
  profitSplitMode?: "prorata" | "carried" | "isolated";
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

  /* Isolated mode — отдельные пулы (опционально, для isolated) */
  pool1?: { cash: number; activeDeals: number; newDeals: number; closed: number; netProfit: number; };
  pool2?: { cash: number; activeDeals: number; newDeals: number; closed: number; netProfit: number; };
  pool3?: { cash: number; activeDeals: number; newDeals: number; closed: number; netProfit: number; };

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

  /* Isolated mode — финальная декомпозиция (опционально) */
  isolated?: {
    pool1: PoolFinalState;
    pool2: PoolFinalState;
    pool3: PoolFinalState;
    /* Декомпозиция total profit */
    companyFromP1: number;
    companyFromP2: number;
    investorFromP2: number;
    investorFromP3: number;
    /* Реинвест/withdraw cumulative */
    companyP1Reinvested: number;
    companyP1Withdrawn:  number;
    companyP2Reinvested: number;  /* P2 → P1 (пополнение Pool 1) */
    companyP2Withdrawn:  number;
    investorP2Reinvested: number; /* P2 → P3 (пополнение Pool 3) */
    investorP2Withdrawn:  number;
    investorP3Reinvested: number;
    investorP3Withdrawn:  number;
  };
}

export interface PoolFinalState {
  cash:           number;
  activeDeals:    number;
  receivables:    number;   // ожидаемые будущие поступления (face value)
  totalDeployed:  number;   // сколько сделок выдано за период (включая закрытые)
  closures:       number;   // закрыто сделок
  capitalAtStart: number;
}

export function simulateCohorts(params: CohortSimParams): CohortSimResult {
  if (params.profitSplitMode === "isolated") {
    return simulateIsolated(params);
  }

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

    /* 3. OpEx и net profit. OpEx — реальный расход, уходит из cash */
    const opExCost = grossProfitThisMonth * opExRate;
    const netProfit = grossProfitThisMonth - defaultLossThisMonth - opExCost;
    cash -= opExCost;

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

/* ════════════════════════════════════════════════════════════
   ISOLATED POOLS — 3 независимых пула, полная изоляция
   ════════════════════════════════════════════════════════════ */
function simulateIsolated(params: CohortSimParams): CohortSimResult {
  const {
    capital, monthsToSimulate, dealCost, termMonths, downPct, markupPct,
    defaultRate              = 0,
    recoveryRate             = 0.5,
    opExRate                 = 0,
    deployRate               = 1,
    investorCapitalPct       = 0,
    investorProfitShare      = 0.5,
    companyReinvestPool1Pct  = 1,
    companyReinvestPool2Pct  = 1,
    investorReinvestPool2Pct = 1,
    investorReinvestPool3Pct = 1,
  } = params;

  const capitalPerDeal = dealCost * (1 - downPct);
  const totalPrice     = dealCost * (1 + markupPct);
  const remainingPay   = totalPrice - dealCost * downPct;
  const monthlyPayment = remainingPay / termMonths;
  const profitPerDeal  = dealCost * markupPct;
  const collectionRate = 1 - defaultRate * (1 - recoveryRate);

  const investorCapitalInit = capital * investorCapitalPct;
  const companyCapitalInit  = capital - investorCapitalInit;

  /* 3 пула */
  let p1Cash = companyCapitalInit;
  let p2Cash = investorCapitalInit;
  let p3Cash = 0;
  const p1Cohorts: ActiveCohort[] = [];
  const p2Cohorts: ActiveCohort[] = [];
  const p3Cohorts: ActiveCohort[] = [];
  let p1Deployed = 0, p2Deployed = 0, p3Deployed = 0;
  let p1Closed = 0,  p2Closed = 0,  p3Closed = 0;

  /* Cumulatives — общие */
  let cumGross   = 0;
  let cumNet     = 0;
  let cumDefault = 0;
  let cumOpEx    = 0;
  /* (cumP1/P2/P3 accumulators tracked via cumCompanyFromP1/P2 + cumInvestorFromP2/P3) */
  let cumCompanyFromP1 = 0;
  let cumCompanyFromP2 = 0;
  let cumInvestorFromP2 = 0;
  let cumInvestorFromP3 = 0;
  let cumCompanyP1Reinvested = 0, cumCompanyP1Withdrawn = 0;
  let cumCompanyP2Reinvested = 0, cumCompanyP2Withdrawn = 0;
  let cumInvestorP2Reinvested = 0, cumInvestorP2Withdrawn = 0;
  let cumInvestorP3Reinvested = 0, cumInvestorP3Withdrawn = 0;

  const months: MonthSnapshot[] = [];
  let steadyStateMonth: number | null = null;
  let prevActiveTotal = -1, stableCount = 0;

  for (let t = 0; t <= monthsToSimulate; t++) {
    /* === Один тик для каждого пула: inflow, closures, opex === */
    const r1 = processPoolTick(p1Cohorts, t, monthlyPayment, collectionRate, termMonths,
                                profitPerDeal, capitalPerDeal, defaultRate, recoveryRate, opExRate);
    p1Cash += r1.inflow - r1.opExCost;

    const r2 = processPoolTick(p2Cohorts, t, monthlyPayment, collectionRate, termMonths,
                                profitPerDeal, capitalPerDeal, defaultRate, recoveryRate, opExRate);
    p2Cash += r2.inflow - r2.opExCost;

    const r3 = processPoolTick(p3Cohorts, t, monthlyPayment, collectionRate, termMonths,
                                profitPerDeal, capitalPerDeal, defaultRate, recoveryRate, opExRate);
    p3Cash += r3.inflow - r3.opExCost;

    p1Closed += r1.closures; p2Closed += r2.closures; p3Closed += r3.closures;
    cumGross   += r1.grossProfit + r2.grossProfit + r3.grossProfit;
    cumNet     += r1.netProfit   + r2.netProfit   + r3.netProfit;
    cumDefault += r1.defaultLoss + r2.defaultLoss + r3.defaultLoss;
    cumOpEx    += r1.opExCost    + r2.opExCost    + r3.opExCost;

    /* === Pool 1 (Company-own): 100% → компания === */
    const p1ReinvestAmt  = r1.netProfit * companyReinvestPool1Pct;
    const p1WithdrawAmt  = r1.netProfit - p1ReinvestAmt;
    p1Cash -= p1WithdrawAmt;
    /* reinvest остаётся в pool1Cash (он уже там после inflow) */
    cumCompanyFromP1          += r1.netProfit;
    cumCompanyP1Reinvested    += p1ReinvestAmt;
    cumCompanyP1Withdrawn     += p1WithdrawAmt;

    /* === Pool 2 (Investor-original): split по контракту === */
    const p2CompShare = r2.netProfit * (1 - investorProfitShare);
    const p2InvShare  = r2.netProfit * investorProfitShare;

    /* Company portion: reinvest идёт в Pool 1, withdraw уходит */
    const p2CompReinvest = p2CompShare * companyReinvestPool2Pct;
    const p2CompWithdraw = p2CompShare - p2CompReinvest;
    p2Cash -= p2CompShare;          /* и reinvest, и withdraw УХОДЯТ из Pool 2 */
    p1Cash += p2CompReinvest;       /* reinvest присоединяется к Pool 1 */
    cumCompanyFromP2          += p2CompShare;
    cumCompanyP2Reinvested    += p2CompReinvest;
    cumCompanyP2Withdrawn     += p2CompWithdraw;

    /* Investor portion: reinvest идёт в Pool 3, withdraw уходит */
    const p2InvReinvest = p2InvShare * investorReinvestPool2Pct;
    const p2InvWithdraw = p2InvShare - p2InvReinvest;
    p2Cash -= p2InvShare;
    p3Cash += p2InvReinvest;
    cumInvestorFromP2         += p2InvShare;
    cumInvestorP2Reinvested   += p2InvReinvest;
    cumInvestorP2Withdrawn    += p2InvWithdraw;

    /* === Pool 3 (Investor-accumulated): 100% → инвестор === */
    const p3ReinvestAmt = r3.netProfit * investorReinvestPool3Pct;
    const p3WithdrawAmt = r3.netProfit - p3ReinvestAmt;
    p3Cash -= p3WithdrawAmt;
    cumInvestorFromP3         += r3.netProfit;
    cumInvestorP3Reinvested   += p3ReinvestAmt;
    cumInvestorP3Withdrawn    += p3WithdrawAmt;

    /* === Deploy новых сделок из каждого пула === */
    const p1New = Math.max(0, Math.floor(p1Cash * deployRate / capitalPerDeal));
    p1Cash -= p1New * capitalPerDeal;
    if (p1New > 0) p1Cohorts.push({ startMonth: t, count: p1New, paymentsMade: 0 });
    p1Deployed += p1New;

    const p2New = Math.max(0, Math.floor(p2Cash * deployRate / capitalPerDeal));
    p2Cash -= p2New * capitalPerDeal;
    if (p2New > 0) p2Cohorts.push({ startMonth: t, count: p2New, paymentsMade: 0 });
    p2Deployed += p2New;

    const p3New = Math.max(0, Math.floor(p3Cash * deployRate / capitalPerDeal));
    p3Cash -= p3New * capitalPerDeal;
    if (p3New > 0) p3Cohorts.push({ startMonth: t, count: p3New, paymentsMade: 0 });
    p3Deployed += p3New;

    /* === Snapshot === */
    const p1Active = p1Cohorts.reduce((a, c) => a + c.count, 0);
    const p2Active = p2Cohorts.reduce((a, c) => a + c.count, 0);
    const p3Active = p3Cohorts.reduce((a, c) => a + c.count, 0);
    const activeTotal = p1Active + p2Active + p3Active;

    months.push({
      month: t,
      cashStart: 0, /* для isolated режима сумма не имеет одного "cash" — см. pool* */
      inflow:  r1.inflow + r2.inflow + r3.inflow,
      outflow: 0,
      cashEnd: p1Cash + p2Cash + p3Cash,
      newDeals: p1New + p2New + p3New,
      closedThisMonth: r1.closures + r2.closures + r3.closures,
      grossProfit: r1.grossProfit + r2.grossProfit + r3.grossProfit,
      defaultLoss: r1.defaultLoss + r2.defaultLoss + r3.defaultLoss,
      opExCost: r1.opExCost + r2.opExCost + r3.opExCost,
      netProfit: r1.netProfit + r2.netProfit + r3.netProfit,
      investorProfitThisMonth: p2InvShare + r3.netProfit,
      companyProfitThisMonth:  r1.netProfit + p2CompShare,
      companyWithdrawnThisMonth:  p1WithdrawAmt + p2CompWithdraw,
      companyReinvestedThisMonth: p1ReinvestAmt + p2CompReinvest,
      investorWithdrawnThisMonth: p2InvWithdraw + p3WithdrawAmt,
      investorReinvestedThisMonth: p2InvReinvest + p3ReinvestAmt,
      cumulativeGrossProfit:        cumGross,
      cumulativeNetProfit:          cumNet,
      cumulativeInvestorProfit:     cumInvestorFromP2 + cumInvestorFromP3,
      cumulativeCompanyProfit:      cumCompanyFromP1 + cumCompanyFromP2,
      cumulativeCompanyWithdrawn:   cumCompanyP1Withdrawn + cumCompanyP2Withdrawn,
      cumulativeCompanyReinvested:  cumCompanyP1Reinvested + cumCompanyP2Reinvested,
      cumulativeInvestorWithdrawn:  cumInvestorP2Withdrawn + cumInvestorP3Withdrawn,
      cumulativeInvestorReinvested: cumInvestorP2Reinvested + cumInvestorP3Reinvested,
      investorBalance:  investorCapitalInit + cumInvestorP2Reinvested + cumInvestorP3Reinvested,
      companyBalance:   companyCapitalInit + cumCompanyP1Reinvested + cumCompanyP2Reinvested,
      investorShareNow: investorProfitShare,
      activeDeals: activeTotal,
      activeCohorts: [...p1Cohorts, ...p2Cohorts, ...p3Cohorts].map(c => ({ ...c })),
      capitalOccupied: 0,
      utilization: 0,
      pool1: { cash: p1Cash, activeDeals: p1Active, newDeals: p1New, closed: r1.closures, netProfit: r1.netProfit },
      pool2: { cash: p2Cash, activeDeals: p2Active, newDeals: p2New, closed: r2.closures, netProfit: r2.netProfit },
      pool3: { cash: p3Cash, activeDeals: p3Active, newDeals: p3New, closed: r3.closures, netProfit: r3.netProfit },
    });

    /* steady-state heuristic */
    if (t >= termMonths) {
      if (Math.abs(activeTotal - prevActiveTotal) <= 1) stableCount++;
      else stableCount = 0;
      if (stableCount >= 3 && steadyStateMonth === null) steadyStateMonth = t - 2;
      prevActiveTotal = activeTotal;
    }
  }

  /* === Финальные агрегаты === */
  const p1Active = p1Cohorts.reduce((a, c) => a + c.count, 0);
  const p2Active = p2Cohorts.reduce((a, c) => a + c.count, 0);
  const p3Active = p3Cohorts.reduce((a, c) => a + c.count, 0);

  const receivables = (cohorts: ActiveCohort[]): number =>
    cohorts.reduce((acc, c) => acc + c.count * (termMonths - c.paymentsMade) * monthlyPayment * collectionRate, 0);

  const p1Recv = receivables(p1Cohorts);
  const p2Recv = receivables(p2Cohorts);
  const p3Recv = receivables(p3Cohorts);

  const finalCash = p1Cash + p2Cash + p3Cash;
  const finalActiveDeals = p1Active + p2Active + p3Active;
  const totalWithdrawn = cumCompanyP1Withdrawn + cumCompanyP2Withdrawn
                       + cumInvestorP2Withdrawn + cumInvestorP3Withdrawn;
  const finalEquity = finalCash + p1Recv + p2Recv + p3Recv + totalWithdrawn;

  const horizonYears = monthsToSimulate / 12;
  const investorTotalProfit = cumInvestorFromP2 + cumInvestorFromP3;
  const companyTotalProfit  = cumCompanyFromP1 + cumCompanyFromP2;

  const investorRoiAnnual = investorCapitalInit > 0 && horizonYears > 0
    ? Math.pow(1 + investorTotalProfit / investorCapitalInit, 1 / horizonYears) - 1
    : 0;
  const companyRoiAnnual = companyCapitalInit > 0 && horizonYears > 0
    ? Math.pow(1 + companyTotalProfit / companyCapitalInit, 1 / horizonYears) - 1
    : 0;

  return {
    params,
    capitalPerDeal,
    monthlyPayment,
    profitPerDeal,
    months,

    totalDealsClosed: p1Closed + p2Closed + p3Closed,
    totalGrossProfit: cumGross,
    totalDefaultLoss: cumDefault,
    totalOpEx:        cumOpEx,
    totalNetProfit:   cumNet,

    investorCapital:  investorCapitalInit,
    companyCapital:   companyCapitalInit,
    investorProfit:   investorTotalProfit,
    companyProfit:    companyTotalProfit,

    companyWithdrawn:   cumCompanyP1Withdrawn + cumCompanyP2Withdrawn,
    companyReinvested:  cumCompanyP1Reinvested + cumCompanyP2Reinvested,
    investorWithdrawn:  cumInvestorP2Withdrawn + cumInvestorP3Withdrawn,
    investorReinvested: cumInvestorP2Reinvested + cumInvestorP3Reinvested,
    totalWithdrawn,

    investorRoiAnnual,
    companyRoiAnnual,

    finalCash,
    finalActiveDeals,
    finalEquity,
    steadyStateMonth,

    investorBalanceFinal: investorCapitalInit + cumInvestorP2Reinvested + cumInvestorP3Reinvested,
    companyBalanceFinal:  companyCapitalInit + cumCompanyP1Reinvested + cumCompanyP2Reinvested,
    investorShareInitial: investorCapitalPct,
    investorShareFinal:   investorProfitShare,

    isolated: {
      pool1: {
        cash: p1Cash, activeDeals: p1Active, receivables: p1Recv,
        totalDeployed: p1Deployed, closures: p1Closed, capitalAtStart: companyCapitalInit,
      },
      pool2: {
        cash: p2Cash, activeDeals: p2Active, receivables: p2Recv,
        totalDeployed: p2Deployed, closures: p2Closed, capitalAtStart: investorCapitalInit,
      },
      pool3: {
        cash: p3Cash, activeDeals: p3Active, receivables: p3Recv,
        totalDeployed: p3Deployed, closures: p3Closed, capitalAtStart: 0,
      },
      companyFromP1: cumCompanyFromP1,
      companyFromP2: cumCompanyFromP2,
      investorFromP2: cumInvestorFromP2,
      investorFromP3: cumInvestorFromP3,
      companyP1Reinvested: cumCompanyP1Reinvested,
      companyP1Withdrawn:  cumCompanyP1Withdrawn,
      companyP2Reinvested: cumCompanyP2Reinvested,
      companyP2Withdrawn:  cumCompanyP2Withdrawn,
      investorP2Reinvested: cumInvestorP2Reinvested,
      investorP2Withdrawn:  cumInvestorP2Withdrawn,
      investorP3Reinvested: cumInvestorP3Reinvested,
      investorP3Withdrawn:  cumInvestorP3Withdrawn,
    },
  };
}

/* ── Хелпер: один такт обработки пула (inflow + closures + opex) ── */
function processPoolTick(
  cohorts: ActiveCohort[], t: number,
  monthlyPayment: number, collectionRate: number,
  termMonths: number, profitPerDeal: number, capitalPerDeal: number,
  defaultRate: number, recoveryRate: number, opExRate: number,
) {
  let inflow = 0;
  let closures = 0;
  let grossProfit = 0;
  let defaultLoss = 0;

  if (t > 0) {
    for (const c of cohorts) {
      const age = t - c.startMonth;
      if (age >= 1 && age <= termMonths) {
        inflow += c.count * monthlyPayment * collectionRate;
        c.paymentsMade = age;
      }
    }
  }

  for (let i = cohorts.length - 1; i >= 0; i--) {
    const c = cohorts[i];
    if (c.paymentsMade >= termMonths) {
      closures += c.count;
      grossProfit += c.count * profitPerDeal;
      defaultLoss += c.count * defaultRate * (1 - recoveryRate) * (capitalPerDeal + profitPerDeal);
      cohorts.splice(i, 1);
    }
  }

  const opExCost = grossProfit * opExRate;
  const netProfit = grossProfit - defaultLoss - opExCost;
  return { inflow, closures, grossProfit, defaultLoss, opExCost, netProfit };
}
