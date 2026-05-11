/**
 * lib/code-store.ts
 * ─────────────────────────────────────────────────────────────────
 * Хранилище OTP-кодов.
 * Бэкенд: Upstash Redis (REST API).
 *
 * Схема ключей:
 *   otp:{phone}       → JSON (CodeEntry)   TTL: 300 сек (5 мин)
 *   ratelimit:{phone} → "1"                TTL: 60 сек
 * ─────────────────────────────────────────────────────────────────
 */

import { getRedis } from "@/lib/redis";

const CODE_TTL_SEC   = 300; // 5 минут
const RATE_LIMIT_SEC = 60;  // 1 запрос в минуту
const MAX_ATTEMPTS   = 5;

interface CodeEntry {
  code:      string;
  phone:     string;
  createdAt: number;
  attempts:  number;
}

function otpKey(phone: string)       { return `otp:${phone}`; }
function rateLimitKey(phone: string) { return `ratelimit:${phone}`; }

/* ── helpers ──────────────────────────────────────────────── */

/** Генерирует 4-значный код */
export function generateCode(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 9000 + 1000);
}

/** Нормализует номер к виду +7XXXXXXXXXX */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return "+7" + digits;
  if (digits.length === 11 && (digits[0] === "7" || digits[0] === "8")) {
    return "+7" + digits.slice(1);
  }
  throw new Error("Неверный формат номера телефона");
}

/* ── public API ───────────────────────────────────────────── */

/** Сохраняет код в Redis с TTL 5 минут; ставит rate-limit метку */
export async function saveCode(phone: string, code: string): Promise<void> {
  const redis = getRedis();
  const entry: CodeEntry = { code, phone, createdAt: Date.now(), attempts: 0 };
  await Promise.all([
    redis.set(otpKey(phone), entry, { ex: CODE_TTL_SEC }),
    redis.set(rateLimitKey(phone), "1", { ex: RATE_LIMIT_SEC }),
  ]);
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "expired" | "wrong_code" | "too_many_attempts" };

/** Проверяет код. При успехе удаляет запись (one-time). */
export async function verifyCode(
  phone: string,
  inputCode: string
): Promise<VerifyResult> {
  const redis = getRedis();
  const entry = await redis.get<CodeEntry>(otpKey(phone));

  if (!entry) return { ok: false, reason: "not_found" };

  // TTL контролируется Redis — если ключ существует, код ещё актуален
  if (entry.attempts >= MAX_ATTEMPTS) {
    await redis.del(otpKey(phone));
    return { ok: false, reason: "too_many_attempts" };
  }

  if (entry.code !== inputCode.trim()) {
    // Инкрементируем счётчик попыток
    await redis.set(otpKey(phone), { ...entry, attempts: entry.attempts + 1 }, {
      ex: CODE_TTL_SEC,
    });
    return { ok: false, reason: "wrong_code" };
  }

  // Успех — удаляем одноразовый код
  await redis.del(otpKey(phone));
  return { ok: true };
}

/** Проверяет rate-limit (1 запрос в 60 сек) */
export async function isRateLimited(phone: string): Promise<boolean> {
  const redis  = getRedis();
  const exists = await redis.exists(rateLimitKey(phone));
  return exists === 1;
}
