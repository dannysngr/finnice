/**
 * lib/session.ts
 * ─────────────────────────────────────────────────────────────────
 * HMAC-SHA256 подписанные сессионные токены.
 * Хранятся в httpOnly cookie — защита от XSS.
 * Без внешних зависимостей (только Node.js crypto).
 *
 * Формат токена:
 *   base64url(JSON payload) + "." + HMAC-SHA256 signature
 * ─────────────────────────────────────────────────────────────────
 */

import crypto from "crypto";

export const SESSION_COOKIE = "nf_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 дней

interface SessionPayload {
  phone: string;
  iat:   number;   // issued at (ms)
  exp:   number;   // expiry (ms)
}

/* ── internal helpers ─────────────────────────────────────── */
function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 20) {
    // В dev режиме используем fallback, в prod — бросаем ошибку
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET не задан или слишком короткий");
    }
    return "dev_secret_finnice_not_for_production";
  }
  return secret;
}

function b64uEncode(str: string): string {
  return Buffer.from(str).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function b64uDecode(str: string): string {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4;
  return Buffer.from(pad ? padded + "=".repeat(4 - pad) : padded, "base64").toString();
}

function sign(payload: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
}

/* ── public API ───────────────────────────────────────────── */

/** Создаёт подписанный токен для хранения в cookie */
export function createSessionToken(phone: string): string {
  const payload: SessionPayload = {
    phone,
    iat: Date.now(),
    exp: Date.now() + SESSION_TTL_MS,
  };
  const encoded   = b64uEncode(JSON.stringify(payload));
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

/** Верифицирует токен. Возвращает payload или null при ошибке. */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const dotIndex = token.lastIndexOf(".");
    if (dotIndex === -1) return null;

    const encoded = token.slice(0, dotIndex);
    const sig     = token.slice(dotIndex + 1);

    // Constant-time comparison против timing attacks
    const expected = sign(encoded);
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return null;
    }

    const payload: SessionPayload = JSON.parse(b64uDecode(encoded));

    if (payload.exp < Date.now()) return null;  // истёк
    if (!payload.phone)           return null;  // нет телефона

    return payload;
  } catch {
    return null;
  }
}

/** Параметры cookie для установки в Set-Cookie header */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax"  as const,
    secure:   process.env.NODE_ENV === "production",
    path:     "/",
    maxAge:   SESSION_TTL_MS / 1000, // секунды
  };
}
