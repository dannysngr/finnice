/* ================================================================
   calculator-logic.ts — математика рассрочки ФинНайс
   Правила:
   • До 50 000 руб.  → взнос необязателен (0%)
   • От 50 000 руб.  → минимальный взнос 25%, слайдер не уходит ниже
   • Наценка = MAX(500, (цена − взнос) × 0.038 × срок)
   • Минимальная сумма — 1 000 руб., минимальный срок — 3 мес.
   ================================================================ */

// ─── Константы ────────────────────────────────────────────────

export const MARKUP_RATE          = 0.038;    // 3.8 % в месяц
export const MIN_MARKUP           = 500;      // минимальная наценка, руб.

export const HIGH_PRICE_THRESHOLD = 50_000;   // порог обязательного взноса
export const MIN_DOWN_PCT_HIGH    = 0.25;     // 25 % для суммы > 50 000 руб.

export const MIN_PRICE            = 1_000;
export const MAX_PRICE            = 1_000_000;
export const MIN_TERM             = 3;        // мес.
export const MAX_TERM             = 24;       // мес.

// Оставлено для обратной совместимости с импортами в catalog/page.tsx
export const MIN_DOWN_PCT         = 0.20;

// ─── Хелпер: минимальный % взноса по сумме ────────────────────

/** 0 для суммы ≤ 50 000 руб., 0.25 для суммы > 50 000 руб. */
export function getMinDownPct(price: number): number {
  return price > HIGH_PRICE_THRESHOLD ? MIN_DOWN_PCT_HIGH : 0;
}

// ─── Типы ──────────────────────────────────────────────────────

export interface CalcInput {
  price: number;  // стоимость товара, руб.
  down:  number;  // первоначальный взнос, руб.
  term:  number;  // срок рассрочки, мес.
}

export interface CalcResult {
  monthly:     number;   // ежемесячный платёж, руб.
  markup:      number;   // наценка, руб.
  total:       number;   // итоговая сумма, руб.
  minDown:     number;   // минимально допустимый взнос, руб.
  minDownPct:  number;   // минимальный % взноса (0 или 0.25)
  isValidDown: boolean;  // взнос >= minDown
}

// ─── Основная функция ─────────────────────────────────────────

export function calcInstallment(input: CalcInput): CalcResult {
  const { price, down, term } = input;

  const minDownPct  = getMinDownPct(price);
  const minDown     = Math.ceil(price * minDownPct);
  const isValidDown = down >= minDown;

  const base    = Math.max(0, price - down);
  const markup  = Math.max(MIN_MARKUP, base * MARKUP_RATE * term);
  const total   = price + markup;
  const monthly = Math.ceil((base + markup) / term);

  return {
    monthly:     Math.round(monthly),
    markup:      Math.round(markup),
    total:       Math.round(total),
    minDown,
    minDownPct,
    isValidDown,
  };
}

// ─── Форматирование ───────────────────────────────────────────

/** 12345 → «12 345» */
export function fmtRub(n: number): string {
  return n.toLocaleString("ru-RU");
}
