/**
 * lib/code-store.ts
 * ─────────────────────────────────────────────────────────────────
 * In-process store для OTP-кодов (TTL 5 минут).
 *
 * ⚠️  Для production замените на Redis:
 *     await redis.set(`otp:${phone}`, JSON.stringify(entry), 'EX', 300)
 *     await redis.get(`otp:${phone}`)
 *     await redis.del(`otp:${phone}`)
 *
 * Текущая реализация прекрасно работает на одном инстансе (Vercel
 * Functions с "regional" routing или VPS). Serverless с несколькими
 * регионами → Redis обязателен.
 * ─────────────────────────────────────────────────────────────────
 */

const CODE_TTL_MS = 5 * 60 * 1000; // 5 минут
const MAX_ATTEMPTS = 5;             // блокировка после N неверных попыток

interface CodeEntry {
  code:       string;
  phone:      string;
  createdAt:  number;
  attempts:   number;
}

// Singleton map, переживает hot-reload благодаря globalThis
const globalStore = globalThis as typeof globalThis & {
  __otpStore?: Map<string, CodeEntry>;
};
if (!globalStore.__otpStore) {
  globalStore.__otpStore = new Map<string, CodeEntry>();
}
const store = globalStore.__otpStore;

/* ── helpers ──────────────────────────────────────────────── */

/** Генерирует криптографически безопасный 4-значный код */
export function generateCode(): string {
  // crypto доступен в Node 14+ и Edge Runtime
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 9000 + 1000); // 1000–9999
}

/** Нормализует номер к виду +7XXXXXXXXXX */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  // Принимаем 10 цифр (без 7/8) или 11 цифр начинающихся с 7/8
  if (digits.length === 10) return "+7" + digits;
  if (digits.length === 11 && (digits[0] === "7" || digits[0] === "8")) {
    return "+7" + digits.slice(1);
  }
  throw new Error("Неверный формат номера телефона");
}

/* ── public API ───────────────────────────────────────────── */

/** Сохраняет код; возвращает его для отправки в Telegram */
export function saveCode(phone: string, code: string): void {
  store.set(phone, {
    code,
    phone,
    createdAt: Date.now(),
    attempts: 0,
  });
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "expired" | "wrong_code" | "too_many_attempts" };

/** Проверяет код. Удаляет запись при успехе. */
export function verifyCode(phone: string, inputCode: string): VerifyResult {
  const entry = store.get(phone);

  if (!entry) return { ok: false, reason: "not_found" };

  if (Date.now() - entry.createdAt > CODE_TTL_MS) {
    store.delete(phone);
    return { ok: false, reason: "expired" };
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    store.delete(phone);
    return { ok: false, reason: "too_many_attempts" };
  }

  if (entry.code !== inputCode.trim()) {
    entry.attempts++;
    return { ok: false, reason: "wrong_code" };
  }

  store.delete(phone); // одноразовый код
  return { ok: true };
}

/** Проверяет, не слишком ли часто запрашивают коды (rate-limit: 1 в 60 сек) */
export function isRateLimited(phone: string): boolean {
  const entry = store.get(phone);
  if (!entry) return false;
  return Date.now() - entry.createdAt < 60_000;
}
