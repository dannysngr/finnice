/* ================================================================
   calculator-logic.ts — математика рассрочки Финнайс (модель khalim)
   ----------------------------------------------------------------
   Тариф Light убран — первоначальный взнос 25% обязателен для всех сумм.
   Ставка наценки зависит только от суммы товара:
     • ≤ 70 000 ₽          → 4.0% / мес
     • 70 001 – 150 000 ₽  → 3.5% / мес
     • > 150 000 ₽         → 3.0% / мес
   Формула (как у khalim):
     взнос   = max(25% от суммы, введённый взнос)
     monthly = round100( ((Сумма·Ставка·Срок) + (Сумма−Взнос)) / (Срок−1) − addit )
     addit   = 10% от взноса сверх минимума, размазано по (Срок−1) платежам
     Итого   = monthly·(Срок−1) + Взнос
   Поручители: ≤ 70к → 0, ≤ 150к → 1, > 150к → 2
   ================================================================ */

// ─── Константы ─────────────────────────────────────────────────

export const HIGH_PRICE_THRESHOLD = 50_000;   // вспом., оставлено для совместимости
export const MIN_DOWN_PCT_HIGH    = 0.25;

export const MIN_PRICE = 1_000;
export const MAX_PRICE = 1_000_000;
export const MIN_TERM  = 3;
export const MAX_TERM  = 12;

// Обратная совместимость
export const MIN_DOWN_PCT = 0.25;
export const MARKUP_RATE  = 0.04;
export const MIN_MARKUP   = 0;

/** Бонус: 10% от взноса сверх минимальных 25% возвращается скидкой с наценки. */
export const DOWN_BONUS_PCT = 0.10;

/** Округление до сотен — как у khalim (MyRound100). */
function round100(n: number): number {
  return Math.round(n / 100) * 100;
}

// ─── Ставка наценки (khalim, по сумме товара) ───────────────────

/** Ставки наценки по тарифам — единственный источник истины.
 *  Чтобы изменить живую ставку сайта — правьте здесь. */
export const TARIFF_RATES = {
  small:  0.040,   // ≤ 70 000 ₽
  medium: 0.035,   // 70 001 – 150 000 ₽
  large:  0.030,   // > 150 000 ₽
} as const;

export function getRate(price: number): number {
  if (price > 150_000) return TARIFF_RATES.large;
  if (price >  70_000) return TARIFF_RATES.medium;
  return TARIFF_RATES.small;
}

// ─── Минимальный взнос — 25% всегда (тариф Light убран) ──────────

export function getMinDownPct(price: number): number {
  return price > 0 ? MIN_DOWN_PCT : 0;
}

// ─── Поручители (khalim) ────────────────────────────────────────

export function getGuarantors(price: number): number {
  if (price > 150_000) return 2;
  if (price >  70_000) return 1;
  return 0;
}

// ─── Типы ───────────────────────────────────────────────────────

export interface CalcInput {
  price: number;
  down:  number;
  term:  number;
}

export interface CalcResult {
  monthly:     number;
  markup:      number;
  total:       number;
  rate:        number;       // ставка наценки / мес (4 / 3.5 / 3 %)
  irrMonthly:  number;       // подразумеваемый IRR / мес (для loan-record)
  minDown:     number;
  minDownPct:  number;
  isValidDown: boolean;
  guarantors:  number;
  bonus:       number;       // скидка с наценки за взнос выше минимума
}

// ─── Основная функция (модель khalim) ───────────────────────────

export function calcInstallment({ price, down, term }: CalcInput): CalcResult {
  const rate        = getRate(price);
  const minDownPct  = getMinDownPct(price);
  const minDown     = round100(price * minDownPct);
  const effDown     = Math.max(minDown, down);       // взнос 25% обязателен
  const isValidDown = down >= minDown;
  const guarantors  = getGuarantors(price);

  // addit — 10% от взноса сверх минимума, размазано по (term−1) платежам
  const extraDown = Math.max(0, effDown - minDown);
  const additPer  = (extraDown * DOWN_BONUS_PCT) / Math.max(1, term - 1);
  const bonus     = Math.round(extraDown * DOWN_BONUS_PCT);

  const monthly = round100(
    ((price * rate * term) + (price - effDown)) / Math.max(1, term - 1) - additPer,
  );
  const total  = monthly * (term - 1) + effDown;
  const markup = total - price;

  // Подразумеваемый месячный IRR — для targetIrrAtCreation в заявке
  const flows: number[] = [-(price - effDown)];
  for (let i = 0; i < term - 1; i++) flows.push(monthly);
  const rM = _irrMonthly(flows);
  const irrMonthly = isFinite(rM) ? rM : 0;

  return {
    monthly, markup, total, rate, irrMonthly,
    minDown, minDownPct, isValidDown, guarantors, bonus,
  };
}

// ─── iso-IRR вариант (использует политику из admin) ──────────────

import {
  markupRounded as _markupRounded,
  irrMonthly as _irrMonthly,
  annualFromMonthly as _annualFromMonthly,
} from "@/lib/finance/iso-irr";

const STANDARD_DOWNS = [0, 0.10, 0.25, 0.40, 0.50];

/**
 * iso-IRR версия calcInstallment.
 *
 *   price        = стоимость товара у партнёра (cost)
 *   down         = первоначальный взнос в рублях
 *   term         = число ежемесячных платежей ПОСЛЕ взноса
 *   inflation    = годовая инфляция (для премиума на n>6)
 *   matrixOverrides = ручные override наценок из админки
 *
 * Возвращает CalcResult совместимый с публичным калькулятором.
 */
export function calcInstallmentIsoIRR(
  price: number,
  down:  number,
  term:  number,
  inflation: number,
  matrixOverrides: Record<string, number> = {},
): CalcResult {
  const minDownPct  = getMinDownPct(price);
  const minDown     = Math.ceil(price * minDownPct);
  const isValidDown = down >= minDown;
  const guarantors  = getGuarantors(price);

  const downPct = price > 0 ? down / price : 0;

  /* Override-lookup: ищем ближайший стандартный down */
  const closestDown = STANDARD_DOWNS.reduce(
    (a, b) => Math.abs(b - downPct) < Math.abs(a - downPct) ? b : a,
    STANDARD_DOWNS[0],
  );
  const overrideKey = `${term}:${closestDown}`;
  const override    = matrixOverrides[overrideKey];

  const markupPct = override !== undefined
    ? override
    : _markupRounded(term, downPct, inflation);

  const markup = Math.round(price * markupPct);
  const total  = price + markup;

  /* Ежемесячный платёж: взнос — 1-й из term платежей, остальные (term-1)
     равные ежемесячные. Соответствует UX-подписи под слайдером и формуле
     calcInstallment (без iso-IRR). При down=0 — term равных платежей. */
  let monthly: number;
  if (down > 0) {
    monthly = Math.ceil((total - down) / Math.max(1, term - 1));
  } else {
    monthly = term > 0 ? Math.ceil(total / term) : 0;
  }

  /* Implied monthly IRR — для отображения "ставки" в UI.
     Cashflow: -K на t=0, далее monthly на t=1..N, где N — число платежей
     ПОСЛЕ первоначального взноса. */
  const capitalT0 = price - down;
  const flows: number[] = [-capitalT0];
  const numMonthly = down > 0 ? term - 1 : term;
  for (let i = 0; i < numMonthly; i++) flows.push(monthly);
  const rM = _irrMonthly(flows);
  const rate = isFinite(rM) ? rM : 0;

  return {
    monthly, markup, total, rate, irrMonthly: rate,
    minDown, minDownPct, isValidDown, guarantors, bonus: 0,
  };
}

/** Helper: возвращает annual IRR для расчёта targetIrrAtCreation в заявке */
export function impliedAnnualIrr(rate: number): number {
  return _annualFromMonthly(rate);
}

/**
 * IRR / мес для произвольной ставки наценки и срока — при взносе 25%.
 * Используется админ-монитором доходности (прикидка «что-если»).
 */
export function irrForRate(rate: number, term: number): number {
  const price   = 100_000;
  const down    = round100(price * MIN_DOWN_PCT);
  const monthly = round100(((price * rate * term) + (price - down)) / Math.max(1, term - 1));
  const flows: number[] = [-(price - down)];
  for (let i = 0; i < term - 1; i++) flows.push(monthly);
  const r = _irrMonthly(flows);
  return isFinite(r) ? r : 0;
}

// ─── Форматирование ─────────────────────────────────────────────

export function fmtRub(n: number): string {
  return n.toLocaleString("ru-RU");
}

/** То же самое, но с префиксом «≈ » — цены товаров приблизительные,
 *  потому что синхронизируются с TG-каналом партнёра (mistore095). */
export function fmtRubApprox(n: number): string {
  return `≈ ${n.toLocaleString("ru-RU")}`;
}

/** 1 платёж, 2 платежа, 5 платежей */
export function pluralPayment(n: number): string {
  const mod10  = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} платежей`;
  if (mod10 === 1)                   return `${n} платёж`;
  if (mod10 >= 2 && mod10 <= 4)     return `${n} платежа`;
  return `${n} платежей`;
}
