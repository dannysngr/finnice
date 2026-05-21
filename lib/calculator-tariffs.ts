/**
 * lib/calculator-tariffs.ts — калькулятор по 4 тарифам в стиле khalim.ru
 *
 * 4 тарифа: Light / Small / Medium / Large.
 * Месячная ставка наценки × количество платежей.
 *
 *   • Light  — без взноса, ставка 4.5% / мес
 *   • Small  — взнос от 25%, ставка 4.0% / мес
 *   • Medium — взнос от 25%, ставка 3.5% / мес
 *   • Large  — взнос от 25%, 2 поручителя, до 1 млн ₽, ставка 3.0% / мес
 *
 * Бонус «addit»: если клиент платит больше минимальных 25%, ему возвращается
 * 10% от ВЫШЕ-минимума, размазанные по оставшимся (term−1) ежемесячным.
 *
 * Формулы прямо из исходника khalim:
 *   Light: monthly = ((price × 0.045 × term) + price) / term
 *   Tariff (Small/Medium/Large):
 *     minDown25 = price / 4
 *     addit = ((down − minDown25) × 0.10) / (term − 1)
 *     monthly = (((price × rate × term) + (price − down)) / (term − 1)) − addit
 */

export type TariffKey = "light" | "small" | "medium" | "large";

export interface TariffSpec {
  key:           TariffKey;
  label:         string;
  monthRate:     number;
  needsDown:     boolean;
  minDownPct:    number;
  guarantors:    number;
  maxPrice:      number;
  description:   string;
}

export const TARIFFS: Record<TariffKey, TariffSpec> = {
  large: {
    key: "large", label: "Large", monthRate: 0.030,
    needsDown: true, minDownPct: 0.25,
    guarantors: 2, maxPrice: 1_000_000,
    description: "2 поручителя · до 1 млн ₽",
  },
  medium: {
    key: "medium", label: "Medium", monthRate: 0.035,
    needsDown: true, minDownPct: 0.25,
    guarantors: 1, maxPrice: 500_000,
    description: "1 поручитель · до 500 000 ₽",
  },
  small: {
    key: "small", label: "Small", monthRate: 0.040,
    needsDown: true, minDownPct: 0.25,
    guarantors: 0, maxPrice: 200_000,
    description: "Без поручителей · до 200 000 ₽",
  },
  light: {
    key: "light", label: "Light", monthRate: 0.045,
    needsDown: false, minDownPct: 0,
    guarantors: 0, maxPrice: 50_000,
    description: "Без взноса · до 50 000 ₽",
  },
};

export const TARIFF_ORDER: TariffKey[] = ["large", "medium", "small", "light"];

/** Тарифы по возрастанию суммы — для шкалы в UI. */
export const TARIFF_SCALE: TariffKey[] = ["light", "small", "medium", "large"];

/**
 * Авто-выбор тарифа по сумме покупки — для ЕДИНОГО калькулятора.
 * Клиенту не нужно вручную переключать тариф: ставка определяется суммой.
 *   ≤ 50 000 ₽          → Light  (4.5%, без взноса)
 *   50 001 – 200 000 ₽  → Small  (4.0%, взнос от 25%)
 *   200 001 – 500 000 ₽ → Medium (3.5%, взнос от 25%, 1 поручитель)
 *   500 001 – 1 000 000 → Large  (3.0%, взнос от 25%, 2 поручителя)
 */
export function tariffForPrice(price: number): TariffKey {
  if (price <= TARIFFS.light.maxPrice)  return "light";
  if (price <= TARIFFS.small.maxPrice)  return "small";
  if (price <= TARIFFS.medium.maxPrice) return "medium";
  return "large";
}

/** Диапазон сумм [мин, макс], при котором применяется тариф. */
export function tariffPriceRange(key: TariffKey): [number, number] {
  const idx = TARIFF_SCALE.indexOf(key);
  const lo  = idx <= 0 ? MIN_PRICE_TARIFF : TARIFFS[TARIFF_SCALE[idx - 1]].maxPrice;
  return [lo, TARIFFS[key].maxPrice];
}

export const MIN_PRICE_TARIFF = 8_000;
export const MAX_PRICE_TARIFF = 1_000_000;
export const MIN_TERM_TARIFF  = 3;
export const MAX_TERM_TARIFF  = 12;
export const DOWN_BONUS_PCT   = 0.10;   // 10% от лишнего взноса возвращается

/** Округление до сотен — как у khalim (MyRound100). */
function round100(n: number): number {
  return Math.round(n / 100) * 100;
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
  minDown:     number;
  isValidDown: boolean;
  bonus:       number;   // суммарный бонус за взнос больше минимума
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
    const feePer  = Math.round(markup / term);
    return {
      monthly, total, markup,
      feePerMonth: feePer,
      minDown:     0,
      isValidDown: true,
      bonus:       0,
    };
  }

  // Tariff со взносом: Small / Medium / Large
  const down       = Math.max(0, input.down);
  const minDown25  = round100(price / 4);
  const minDown    = minDown25;
  const isValidDown = down >= minDown;

  // addit — 10% от «лишнего» взноса, размазано по (term-1) платежам
  const extraDown  = Math.max(0, down - minDown25);
  const additPer   = (extraDown * DOWN_BONUS_PCT) / Math.max(1, term - 1);
  const bonus      = Math.round(extraDown * DOWN_BONUS_PCT);

  // monthly = (((price × rate × term) + (price − down)) / (term − 1)) − addit
  const remaining  = price - down;
  const monthlyRaw = ((price * rate * term) + remaining) / Math.max(1, term - 1);
  const monthly    = round100(monthlyRaw - additPer);
  const total      = monthly * (term - 1) + down;
  const markup     = total - price;
  const feePer     = Math.round(markup / term);

  return {
    monthly, total, markup,
    feePerMonth: feePer,
    minDown, isValidDown,
    bonus,
  };
}

/** Удобный форматтер «3 платежа / 4 платежа / 5 платежей» */
export function pluralPayments(n: number): string {
  const last = n % 10;
  const last2 = n % 100;
  if (last2 >= 11 && last2 <= 14) return `${n} платежей`;
  if (last === 1) return `${n} платеж`;
  if (last >= 2 && last <= 4) return `${n} платежа`;
  return `${n} платежей`;
}
