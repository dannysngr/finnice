/* ================================================================
   iso-irr.ts — единая модель доходности (iso-IRR pricing)
   --------------------------------------------------------------
   Эталон ("якорь"): 6 месяцев, взнос 25%, наценка 25%.
   Его IRR берётся как baseline target. Все остальные конфигурации
   (термин × взнос) дают ТОТ ЖЕ IRR — наценка выводится формулой:

       m = n × (1 − d) / AF(r*, n) + d − 1

   где AF(r, n) = (1 − (1+r)^(−n)) / r — аннуитетный коэффициент.

   Для сроков > 6 мес добавляется инфляционный премиум:
       target_annual(n) = baseline_annual × (1 + (n−6) × inflation_year/12)
   ================================================================ */

/* ── Константы эталона ─────────────────────────────────────── */
export const BASELINE_TERM   = 6;
export const BASELINE_DOWN   = 0.25;
export const BASELINE_MARKUP = 0.25;

/* ── Аннуитетный коэффициент ───────────────────────────────── */
export function annuityFactor(rMonthly: number, nMonths: number): number {
  if (rMonthly === 0) return nMonths;
  return (1 - Math.pow(1 + rMonthly, -nMonths)) / rMonthly;
}

/* ── Преобразования ставок ────────────────────────────────── */
export function monthlyFromAnnual(rAnnual: number): number {
  return Math.pow(1 + rAnnual, 1 / 12) - 1;
}

export function annualFromMonthly(rMonthly: number): number {
  return Math.pow(1 + rMonthly, 12) - 1;
}

/** Уравнение Фишера: nominal = (1 + real)(1 + inflation) − 1 */
export function nominalFromReal(rRealAnnual: number, inflationAnnual: number): number {
  return (1 + rRealAnnual) * (1 + inflationAnnual) - 1;
}

export function realFromNominal(rNominalAnnual: number, inflationAnnual: number): number {
  return (1 + rNominalAnnual) / (1 + inflationAnnual) - 1;
}

/* ── Newton-Raphson IRR (бисекция) ─────────────────────────── */
export function irrMonthly(cashFlows: number[]): number {
  const hasNegative = cashFlows.some(f => f < 0);
  const hasPositive = cashFlows.some(f => f > 0);
  if (!hasNegative || !hasPositive) return NaN;

  let lo = -0.99;
  let hi = 10.0;
  const npv = (r: number) =>
    cashFlows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + r, t), 0);
  if (Math.sign(npv(lo)) === Math.sign(npv(hi))) return NaN;

  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const val = npv(mid);
    if (Math.abs(val) < 1e-9) return mid;
    if (Math.sign(val) === Math.sign(npv(lo))) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/* ════════════════════════════════════════════════════════════
   ЭТАЛОН И ИНФЛЯЦИОННЫЙ ПРЕМИУМ
   ════════════════════════════════════════════════════════════ */

/** IRR эталонной сделки 6мес/25%/25% — кэшируем результат */
let _baselineIrrCache: number | null = null;
export function baselineIrrMonthly(): number {
  if (_baselineIrrCache !== null) return _baselineIrrCache;
  const cost = 100_000;
  const down = cost * BASELINE_DOWN;
  const total = cost * (1 + BASELINE_MARKUP);
  const pmt = (total - down) / BASELINE_TERM;
  const flows: number[] = [-(cost - down)];
  for (let i = 0; i < BASELINE_TERM; i++) flows.push(pmt);
  _baselineIrrCache = irrMonthly(flows);
  return _baselineIrrCache;
}

export function baselineIrrAnnual(): number {
  return annualFromMonthly(baselineIrrMonthly());
}

/**
 * Целевой месячный IRR для срока n, с учётом инфляционного премиума для n > 6.
 *
 * Премиум: target_annual = baseline_annual × (1 + (n−6) × inflation/12)
 */
export function targetIrrMonthlyForTerm(
  termMonths: number,
  inflationAnnual: number,
  baseMonthlyOverride?: number,
): number {
  const baseMonthly = baseMonthlyOverride ?? baselineIrrMonthly();
  if (termMonths <= BASELINE_TERM) return baseMonthly;

  const baseAnnual = annualFromMonthly(baseMonthly);
  const extraMonths = termMonths - BASELINE_TERM;
  const premium = extraMonths * (inflationAnnual / 12);
  const adjustedAnnual = baseAnnual * (1 + premium);
  return monthlyFromAnnual(adjustedAnnual);
}

/* ── Главная формула: наценка для целевой IRR ─────────────── */
export function markupForTargetIRR(
  termMonths: number,
  downPct: number,
  rMonthly: number,
): number {
  const af = annuityFactor(rMonthly, termMonths);
  return (termMonths * (1 - downPct)) / af + downPct - 1;
}

/** Точная наценка для (термин, взнос) с учётом инфляции */
export function markupExact(
  termMonths: number,
  downPct: number,
  inflationAnnual: number,
  baseMonthlyOverride?: number,
): number {
  const r = targetIrrMonthlyForTerm(termMonths, inflationAnnual, baseMonthlyOverride);
  return markupForTargetIRR(termMonths, downPct, r);
}

/** Наценка, округлённая до целого процента */
export function markupRounded(
  termMonths: number,
  downPct: number,
  inflationAnnual: number,
  baseMonthlyOverride?: number,
): number {
  return Math.round(markupExact(termMonths, downPct, inflationAnnual, baseMonthlyOverride) * 100) / 100;
}

/* ── Информация об инфляционном премиуме ────────────────────── */
export interface InflationPremiumInfo {
  applied: boolean;
  extraMonths: number;
  premiumPct: number;
  baselineAnnualIrr: number;
  adjustedAnnualIrr: number;
  adjustedMonthlyIrr: number;
}

export function inflationPremiumInfo(
  termMonths: number,
  inflationAnnual: number,
  baseMonthlyOverride?: number,
): InflationPremiumInfo {
  const baseMonthly = baseMonthlyOverride ?? baselineIrrMonthly();
  const baseAnnual  = annualFromMonthly(baseMonthly);
  if (termMonths <= BASELINE_TERM) {
    return {
      applied: false,
      extraMonths: 0,
      premiumPct: 0,
      baselineAnnualIrr: baseAnnual,
      adjustedAnnualIrr: baseAnnual,
      adjustedMonthlyIrr: baseMonthly,
    };
  }
  const extraMonths = termMonths - BASELINE_TERM;
  const premium = extraMonths * (inflationAnnual / 12);
  const adjustedAnnual = baseAnnual * (1 + premium);
  return {
    applied: true,
    extraMonths,
    premiumPct: premium,
    baselineAnnualIrr: baseAnnual,
    adjustedAnnualIrr: adjustedAnnual,
    adjustedMonthlyIrr: monthlyFromAnnual(adjustedAnnual),
  };
}

/* ── Структура сделки ───────────────────────────────────────── */
export interface DealParams {
  costAmount:  number;
  termMonths:  number;
  downPct:     number;
  markupPct:   number;
}

export interface DealMetrics {
  downAmount:        number;
  markupAmount:      number;
  totalPrice:        number;
  monthlyPayment:    number;
  capitalInvestedT0: number;
  cashFlows:         number[];
  irrMonthly:        number;
  irrAnnual:         number;
}

export function computeDealMetrics(deal: DealParams): DealMetrics {
  const { costAmount, termMonths, downPct, markupPct } = deal;
  const downAmount        = costAmount * downPct;
  const markupAmount      = costAmount * markupPct;
  const totalPrice        = costAmount + markupAmount;
  const remainingToPay    = totalPrice - downAmount;
  const monthlyPayment    = remainingToPay / termMonths;
  const capitalInvestedT0 = costAmount - downAmount;

  const cashFlows: number[] = [-capitalInvestedT0];
  for (let i = 0; i < termMonths; i++) cashFlows.push(monthlyPayment);

  const rM = irrMonthly(cashFlows);
  const rA = isFinite(rM) ? annualFromMonthly(rM) : NaN;

  return {
    downAmount, markupAmount, totalPrice, monthlyPayment,
    capitalInvestedT0, cashFlows,
    irrMonthly: rM, irrAnnual: rA,
  };
}

/* ════════════════════════════════════════════════════════════
   CORPORATE — пониженный таргет IRR для тарифа сотрудников
   ────────────────────────────────────────────────────────────
   Якорь: 6 мес (= 5 ежемесячных платежей после взноса),
          взнос 20% (минимум для price ≥ 50 000 ₽),
          наценка 18%.
   Из этого якоря выводится месячный таргет ≈ 7.2%/мес
   (≈ 130% годовых). Для остальных (term, down) применяется
   та же формула markupForTargetIRR — наценка автоматически
   снижается при бо́льшем взносе.

   Целевая IRR ниже стандартной (~8.9%/мес, ~181% годовых),
   поэтому корпоративная наценка всегда меньше при любых
   входных параметрах. Инфляционный премиум для n > 6 не
   применяется — корпоративный тариф ограничен 6 месяцами.
   ════════════════════════════════════════════════════════════ */
export const CORPORATE_ANCHOR_UI_TERM = 6;     // 6 в UI = 5 ежемесячных после взноса
export const CORPORATE_ANCHOR_DOWN    = 0.20;
export const CORPORATE_ANCHOR_MARKUP  = 0.18;

let _corporateIrrCache: number | null = null;

/** Месячный таргет IRR для корпоративного тарифа (кэшируется) */
export function corporateIrrMonthly(): number {
  if (_corporateIrrCache !== null) return _corporateIrrCache;
  const cost  = 100_000;
  const down  = cost * CORPORATE_ANCHOR_DOWN;
  const total = cost * (1 + CORPORATE_ANCHOR_MARKUP);
  // В корпоративном UI term=N означает 1 взнос + (N−1) ежемесячных платежей
  const monthlyCount = CORPORATE_ANCHOR_UI_TERM - 1; // 5
  const pmt   = (total - down) / monthlyCount;
  const flows: number[] = [-(cost - down)];
  for (let i = 0; i < monthlyCount; i++) flows.push(pmt);
  _corporateIrrCache = irrMonthly(flows);
  return _corporateIrrCache;
}

export function corporateIrrAnnual(): number {
  return annualFromMonthly(corporateIrrMonthly());
}

/**
 * Корпоративная наценка для (UI term, downPct).
 *
 * UI term — это то, что пользователь видит на слайдере "Количество платежей".
 * При down > 0:  1 взнос + (term−1) ежемесячных → iso-IRR term = term−1
 * При down = 0:  все term платежи ежемесячно    → iso-IRR term = term
 *
 * Возвращает наценку (доля от price), округлённую до 1%.
 */
export function corporateMarkupRounded(uiTerm: number, downPct: number): number {
  const isoTerm = downPct > 0 ? Math.max(1, uiTerm - 1) : uiTerm;
  const r = corporateIrrMonthly();
  const exact = markupForTargetIRR(isoTerm, downPct, r);
  return Math.max(0, Math.round(exact * 100) / 100);
}

/* ── Билдер таблицы наценок ───────────────────────────────── */
export interface MatrixCell {
  termMonths: number;
  downPct:    number;
  markupExact: number;
  markupRounded: number;
  premium: InflationPremiumInfo;
}

export function buildMarkupMatrix(
  terms:    number[],
  downPcts: number[],
  inflationAnnual: number,
): MatrixCell[] {
  const cells: MatrixCell[] = [];
  for (const n of terms) {
    for (const d of downPcts) {
      const exact = markupExact(n, d, inflationAnnual);
      cells.push({
        termMonths:   n,
        downPct:      d,
        markupExact:  exact,
        markupRounded: Math.round(exact * 100) / 100,
        premium:      inflationPremiumInfo(n, inflationAnnual),
      });
    }
  }
  return cells;
}
