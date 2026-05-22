/**
 * lib/calculator-tariffs.ts — единый калькулятор рассрочки в стиле khalim.ru
 *
 * 4 тарифа. Тариф определяется СУММОЙ покупки и НАЛИЧИЕМ взноса.
 * Клиент не переключает тарифы вручную — он двигает сумму и решает,
 * вносить ли первоначальный взнос. Остальное калькулятор считает сам.
 *
 *   • Light  — без взноса, 1 поручитель,    8 000–100 000 ₽, 4.5%/мес, 3–10 платежей
 *   • Small  — взнос 25%,  без поручителей,  8 000– 70 000 ₽, 4.0%/мес, 3–12 платежей
 *   • Medium — взнос 25%,  1 поручитель,    70 000–150 000 ₽, 3.5%/мес, 3–12 платежей
 *   • Large  — взнос 25%,  2 поручителя,   150 000–1 000 000 ₽, 3.0%/мес, 3–12 платежей
 *
 * Взнос: 0 (Light) или от 25% суммы (Small/Medium/Large) — его можно
 * увеличить вплоть до 90%. Каждый рубль взноса сверх 25% возвращает 10%
 * скидкой с наценки (бонус addit).
 * Диапазоны пересекаются — одну и ту же сумму можно оформить по-разному:
 *   8–70к   → Light (без взноса) или Small (взнос 25%)
 *   70–100к → Light (без взноса) или Medium (взнос 25%)
 *   100–150к → только Medium (взнос обязателен)
 *   150к–1млн → только Large
 *
 * Формулы khalim (сверены с калькулятором khalim.ru):
 *   Light:  monthly = round100((price × 0.045 × term + price) / term)
 *   Прочие: monthly = round100(((price × rate × term) + (price − down)) / (term − 1))
 *           где down = 25% от price
 */

export type TariffKey = "light" | "small" | "medium" | "large";

export interface TariffSpec {
  key:         TariffKey;
  label:       string;
  monthRate:   number;
  needsDown:   boolean;
  guarantors:  number;
  minPrice:    number;
  maxPrice:    number;
  minTerm:     number;
  maxTerm:     number;
  description: string;
}

export const TARIFFS: Record<TariffKey, TariffSpec> = {
  light: {
    key: "light", label: "Light", monthRate: 0.045,
    needsDown: false, guarantors: 1,
    minPrice: 8_000, maxPrice: 100_000,
    minTerm: 3, maxTerm: 10,
    description: "Без взноса · 1 поручитель",
  },
  small: {
    key: "small", label: "Small", monthRate: 0.040,
    needsDown: true, guarantors: 0,
    minPrice: 8_000, maxPrice: 70_000,
    minTerm: 3, maxTerm: 12,
    description: "Взнос 25% · без поручителей",
  },
  medium: {
    key: "medium", label: "Medium", monthRate: 0.035,
    needsDown: true, guarantors: 1,
    minPrice: 70_000, maxPrice: 150_000,
    minTerm: 3, maxTerm: 12,
    description: "Взнос 25% · 1 поручитель",
  },
  large: {
    key: "large", label: "Large", monthRate: 0.030,
    needsDown: true, guarantors: 2,
    minPrice: 150_000, maxPrice: 1_000_000,
    minTerm: 3, maxTerm: 12,
    description: "Взнос 25% · 2 поручителя",
  },
};

export const TARIFF_ORDER: TariffKey[] = ["light", "small", "medium", "large"];

export const MIN_PRICE_TARIFF = 8_000;
export const MAX_PRICE_TARIFF = 1_000_000;
export const MIN_TERM_TARIFF  = 3;
export const MAX_TERM_TARIFF  = 12;

/** Выше этой суммы тариф Light недоступен — взнос обязателен. */
export const LIGHT_MAX_PRICE = 100_000;
/** Без взноса (Light) максимум 10 платежей, со взносом — 12. */
export const LIGHT_MAX_TERM  = 10;
export const FULL_MAX_TERM   = 12;
/** Взнос для Small/Medium/Large: минимум 25%, поднять можно до 90%. */
export const MIN_DOWN_PCT   = 0.25;
export const MAX_DOWN_PCT   = 0.90;
/** Бонус: 10% от взноса сверх минимума возвращается скидкой с наценки. */
export const DOWN_BONUS_PCT = 0.10;

/** Округление до сотен — как у khalim (MyRound100). */
function round100(n: number): number {
  return Math.round(n / 100) * 100;
}

/** Минимальный взнос (25%), округлён до сотен. 0 — если без взноса. */
export function downForPrice(price: number, hasDown: boolean): number {
  return hasDown ? round100(price * MIN_DOWN_PCT) : 0;
}

/** Нижняя граница взноса для слайдера (25% суммы). */
export function minDownFor(price: number): number {
  return round100(price * MIN_DOWN_PCT);
}

/** Верхняя граница взноса для слайдера (90% суммы). */
export function maxDownFor(price: number): number {
  return round100(price * MAX_DOWN_PCT);
}

/**
 * Тариф для единого калькулятора: определяется суммой + наличием взноса.
 *   hasDown=false → Light  (только при price ≤ 100 000 ₽)
 *   hasDown=true  → Small / Medium / Large по сумме покупки
 */
export function resolveTariff(price: number, hasDown: boolean): TariffKey {
  if (!hasDown) return "light";
  if (price <= TARIFFS.small.maxPrice)  return "small";   // ≤ 70 000
  if (price <= TARIFFS.medium.maxPrice) return "medium";  // ≤ 150 000
  return "large";
}

/** Доступен ли тариф Light для этой суммы (взнос можно не делать). */
export function lightAvailable(price: number): boolean {
  return price <= LIGHT_MAX_PRICE;
}

export interface TariffCalcInput {
  tariff: TariffKey;
  price:  number;
  down:   number;
  term:   number;
}

export interface TariffCalcResult {
  monthly:     number;
  total:       number;
  markup:      number;
  feePerMonth: number;   // наценка на 1 платёж
  bonus:       number;   // скидка с наценки за взнос больше минимума
}

export function calcByTariff(input: TariffCalcInput): TariffCalcResult {
  const { tariff, price, term } = input;
  const spec = TARIFFS[tariff];
  const rate = spec.monthRate;

  if (tariff === "light") {
    // Без взноса. monthly = ((price × rate × term) + price) / term
    const monthly = round100((price * rate * term + price) / term);
    const total   = monthly * term;
    const markup  = total - price;
    return {
      monthly, total, markup,
      feePerMonth: Math.round(markup / term),
      bonus: 0,
    };
  }

  // Tariff со взносом: Small / Medium / Large
  const down      = Math.max(0, input.down);
  const minDown25 = round100(price * MIN_DOWN_PCT);

  // addit — 10% от взноса сверх минимума, размазано по (term−1) платежам
  const extraDown = Math.max(0, down - minDown25);
  const additPer  = (extraDown * DOWN_BONUS_PCT) / Math.max(1, term - 1);
  const bonus     = Math.round(extraDown * DOWN_BONUS_PCT);

  // monthly = (((price × rate × term) + (price − down)) / (term − 1)) − addit
  const remaining = price - down;
  const monthly   = round100(((price * rate * term) + remaining) / Math.max(1, term - 1) - additPer);
  const total     = monthly * (term - 1) + down;
  const markup    = total - price;

  return {
    monthly, total, markup,
    feePerMonth: Math.round(markup / term),
    bonus,
  };
}

/** Удобный форматтер «3 платежа / 4 платежа / 5 платежей» */
export function pluralPayments(n: number): string {
  const last = n % 10;
  const last2 = n % 100;
  if (last2 >= 11 && last2 <= 14) return `${n} платежей`;
  if (last === 1) return `${n} платёж`;
  if (last >= 2 && last <= 4) return `${n} платежа`;
  return `${n} платежей`;
}

/** «1 поручитель / 2 поручителя / без поручителей» */
export function pluralGuarantors(n: number): string {
  if (n === 0) return "без поручителей";
  if (n === 1) return "1 поручитель";
  return `${n} поручителя`;
}
