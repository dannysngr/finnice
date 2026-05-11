/* ================================================================
   calculator-logic.ts — математика рассрочки ФинНайс v2
   Правила:
   • < 50 000 ₽  → взнос необязателен (0)
   • ≥ 50 000 ₽  → минимальный взнос 25%
   • Ставки (зависят только от суммы товара):
     - < 150 000 ₽        → 4% / мес
     - 150 000–500 000 ₽  → 3.5% / мес
     - > 500 000 ₽        → 3% / мес
     - Исключение: < 50 000 ₽ и взнос 0 → 4.5% / мес
   • Наценка = Сумма × (Ставка × Срок)
   • Итого = Сумма + Наценка
   • Платёж/мес:
     - взнос > 0 → (Итого − Взнос) / (Срок − 1)
     - взнос = 0 → Итого / Срок
   • Поручители: < 80 000 → 0, < 200 000 → 1, ≥ 200 000 → 2
   ================================================================ */

// ─── Константы ─────────────────────────────────────────────────

export const HIGH_PRICE_THRESHOLD = 50_000;
export const MIN_DOWN_PCT_HIGH    = 0.25;

export const MIN_PRICE = 1_000;
export const MAX_PRICE = 1_000_000;
export const MIN_TERM  = 3;
export const MAX_TERM  = 12;

// Обратная совместимость
export const MIN_DOWN_PCT = 0.25;
export const MARKUP_RATE  = 0.04;
export const MIN_MARKUP   = 0;

// ─── Ставка ─────────────────────────────────────────────────────

export function getRate(price: number, down: number): number {
  if (price < HIGH_PRICE_THRESHOLD && down === 0) return 0.045;
  if (price >= 500_000) return 0.030;
  if (price >= 150_000) return 0.035;
  return 0.040;
}

// ─── Минимальный взнос ──────────────────────────────────────────

export function getMinDownPct(price: number): number {
  return price >= HIGH_PRICE_THRESHOLD ? MIN_DOWN_PCT_HIGH : 0;
}

// ─── Поручители ─────────────────────────────────────────────────

export function getGuarantors(price: number): number {
  if (price < 80_000)  return 0;
  if (price < 200_000) return 1;
  return 2;
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
  rate:        number;
  minDown:     number;
  minDownPct:  number;
  isValidDown: boolean;
  guarantors:  number;
}

// ─── Основная функция ───────────────────────────────────────────

export function calcInstallment({ price, down, term }: CalcInput): CalcResult {
  const minDownPct  = getMinDownPct(price);
  const minDown     = Math.ceil(price * minDownPct);
  const isValidDown = down >= minDown;
  const guarantors  = getGuarantors(price);

  const rate   = getRate(price, down);
  const markup = Math.round(price * rate * term);
  const total  = price + markup;

  let monthly: number;
  if (down > 0) {
    monthly = Math.ceil((total - down) / Math.max(1, term - 1));
  } else {
    monthly = Math.ceil(total / term);
  }

  return { monthly, markup, total, rate, minDown, minDownPct, isValidDown, guarantors };
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

  /* Ежемесячный платёж: (total − down) / term  (iso-IRR convention) */
  const monthly = term > 0 ? Math.ceil((total - down) / term) : 0;

  /* Implied monthly IRR — для отображения "ставки" в UI */
  const capitalT0 = price - down;
  const flows: number[] = [-capitalT0];
  for (let i = 0; i < term; i++) flows.push(monthly);
  const rM = _irrMonthly(flows);
  const rate = isFinite(rM) ? rM : 0;

  return { monthly, markup, total, rate, minDown, minDownPct, isValidDown, guarantors };
}

/** Helper: возвращает annual IRR для расчёта targetIrrAtCreation в заявке */
export function impliedAnnualIrr(rate: number): number {
  return _annualFromMonthly(rate);
}

// ─── Форматирование ─────────────────────────────────────────────

export function fmtRub(n: number): string {
  return n.toLocaleString("ru-RU");
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
