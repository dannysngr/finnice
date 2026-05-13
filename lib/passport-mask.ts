/**
 * lib/passport-mask.ts
 * Маски для паспортных полей РФ.
 *
 *   passportSeries: "XX XX"     — 4 цифры через пробел (например, "45 12")
 *   passportNumber: "XXXXXX"    — 6 цифр
 *   passportDepartmentCode: "XXX-XXX" — 6 цифр через тире (например, "770-123")
 */

const onlyDigits = (s: string): string => s.replace(/\D/g, "");

/** Маска серии: "XX XX" (4 цифры) */
export function maskPassportSeries(s: string): string {
  const d = onlyDigits(s).slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)} ${d.slice(2)}`;
}

/** Маска номера: 6 цифр */
export function maskPassportNumber(s: string): string {
  return onlyDigits(s).slice(0, 6);
}

/** Маска кода подразделения: "XXX-XXX" */
export function maskDepartmentCode(s: string): string {
  const d = onlyDigits(s).slice(0, 6);
  if (d.length <= 3) return d;
  return `${d.slice(0, 3)}-${d.slice(3)}`;
}

export const PASSPORT_SERIES_PLACEHOLDER = "XX XX";
export const PASSPORT_NUMBER_PLACEHOLDER = "XXXXXX";
export const DEPT_CODE_PLACEHOLDER       = "XXX-XXX";
