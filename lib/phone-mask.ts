/**
 * lib/phone-mask.ts
 *
 * Единая маска для российских мобильных номеров: +7 9XX XXX XX XX.
 * Используется в публичных формах (Calculator/Application/Auth) и в админке.
 *
 *   formatPhone("79266231545")          → "+7 926 623 15 45"
 *   formatPhone("+7 (926) 623-15-45")   → "+7 926 623 15 45"
 *   formatPhone("926623")               → "+7 926 623"
 *   formatPhone("")                     → ""
 *
 * При вводе используется handlePhoneInput, который:
 *   • не даёт начать ввод не с 9,
 *   • ограничивает 10 цифрами,
 *   • держит префикс "+7 " неудаляемым.
 */

export const PHONE_PREFIX = "+7 ";

/** Достаёт только цифры (без кода +7), max 10 */
export function extractPhoneDigits(s: string): string {
  const raw = s.replace(/\D/g, "");
  // Если ввели с 7 или 8 в начале — отбрасываем
  const cleaned = raw.startsWith("7") || raw.startsWith("8") ? raw.slice(1) : raw;
  return cleaned.slice(0, 10);
}

/** Форматирует цифры в красивые группы: 9XX XXX XX XX */
export function formatPhoneDigits(d: string): string {
  const p: string[] = [];
  if (d.length > 0) p.push(d.slice(0, 3));
  if (d.length > 3) p.push(d.slice(3, 6));
  if (d.length > 6) p.push(d.slice(6, 8));
  if (d.length > 8) p.push(d.slice(8, 10));
  return p.join(" ");
}

/** Полное форматирование произвольной строки → "+7 9XX XXX XX XX" или "" */
export function formatPhone(s: string | null | undefined): string {
  if (!s) return "";
  const digits = extractPhoneDigits(String(s));
  if (!digits) return "";
  return PHONE_PREFIX + formatPhoneDigits(digits);
}

/**
 * Обработчик onChange для контролируемого input.
 * Возвращает новое значение поля или null, если ввод нужно отвергнуть.
 */
export function phoneInputOnChange(raw: string): string {
  if (raw === "") return "";
  const digits = extractPhoneDigits(raw.startsWith(PHONE_PREFIX) ? raw.slice(PHONE_PREFIX.length) : raw);
  if (digits.length === 0) return "";
  if (digits[0] !== "9") return PHONE_PREFIX; // российские мобильные начинаются с 9 после +7
  return PHONE_PREFIX + formatPhoneDigits(digits);
}

/**
 * Защищаем префикс при Backspace/Delete у начала строки.
 * Вернёт true если событие надо подавить (e.preventDefault()).
 */
export function shouldBlockPhoneKeyDown(
  key: string, selectionStart: number | null, selectionEnd: number | null,
): boolean {
  if (key !== "Backspace" && key !== "Delete") return false;
  if (selectionStart === null || selectionEnd === null) return false;
  return selectionStart <= PHONE_PREFIX.length && selectionEnd <= PHONE_PREFIX.length;
}

/** "+7 9XX XXX XX XX" → "+79261234567" (для отправки на сервер) */
export function phoneToE164(s: string): string {
  const digits = extractPhoneDigits(s);
  return digits ? `+7${digits}` : "";
}
