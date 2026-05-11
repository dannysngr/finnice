/**
 * lib/user-store.ts
 * ─────────────────────────────────────────────────────────────────
 * Хранилище пользователей: phone ↔ telegram_chat_id.
 * Бэкенд: Upstash Redis (REST API).
 *
 * Схема ключей:
 *   user:{phone}   → JSON (UserRecord)   TTL: нет (постоянно)
 *   chatid:{id}    → phone               TTL: нет (для обратного поиска)
 * ─────────────────────────────────────────────────────────────────
 */

import { getRedis } from "@/lib/redis";

export type UserRole = "admin" | "moderator";

export interface UserRecord {
  phone:     string;
  chatId:    number | null;
  firstName: string | null;
  createdAt: number;
  lastLogin: number | null;
  role?:     UserRole | null;
}

/* ── helpers ──────────────────────────────────────────────── */

function userKey(phone: string)   { return `user:${phone}`; }
function chatKey(chatId: number)  { return `chatid:${chatId}`; }

/* ── public API ───────────────────────────────────────────── */

export async function findByPhone(phone: string): Promise<UserRecord | null> {
  const redis = getRedis();
  const data  = await redis.get<UserRecord>(userKey(phone));
  return data ?? null;
}

export async function findByChatId(chatId: number): Promise<UserRecord | null> {
  const redis = getRedis();
  const phone = await redis.get<string>(chatKey(chatId));
  if (!phone) return null;
  return findByPhone(phone);
}

/** Создаёт или обновляет запись пользователя */
export async function upsertUser(
  phone: string,
  update: Partial<Pick<UserRecord, "chatId" | "firstName">>
): Promise<UserRecord> {
  const redis    = getRedis();
  const existing = await findByPhone(phone);

  const record: UserRecord = existing
    ? { ...existing, ...update }
    : {
        phone,
        chatId:    update.chatId    ?? null,
        firstName: update.firstName ?? null,
        createdAt: Date.now(),
        lastLogin: null,
      };

  await redis.set(userKey(phone), record);

  // Обратный индекс chatId → phone
  if (record.chatId) {
    await redis.set(chatKey(record.chatId), phone);
  }

  return record;
}

/** Привязывает Telegram chat_id к номеру */
export async function linkTelegramChatId(
  phone: string,
  chatId: number,
  firstName?: string
): Promise<UserRecord> {
  return upsertUser(phone, { chatId, firstName: firstName ?? null });
}

/** Обновляет время последнего входа */
export async function touchLastLogin(phone: string): Promise<void> {
  const redis    = getRedis();
  const existing = await findByPhone(phone);
  if (!existing) return;
  await redis.set(userKey(phone), { ...existing, lastLogin: Date.now() });
}

/** Устанавливает / снимает роль пользователя */
export async function setUserRole(phone: string, role: UserRole | null): Promise<UserRecord | null> {
  const redis    = getRedis();
  const existing = await findByPhone(phone);
  if (!existing) return null;
  const updated: UserRecord = { ...existing, role: role ?? null };
  await redis.set(userKey(phone), updated);
  return updated;
}

/** Возвращает список пользователей с ролями (admin/moderator) */
export async function listStaff(): Promise<UserRecord[]> {
  const redis = getRedis();
  // Простая реализация: сканируем все user:* ключи через SCAN
  const keys: string[] = [];
  let cursor = 0;
  do {
    const res = await redis.scan(cursor, { match: "user:*", count: 100 });
    cursor = Number(res[0]);
    keys.push(...res[1]);
  } while (cursor !== 0);

  if (keys.length === 0) return [];
  const records = await Promise.all(keys.map(k => redis.get<UserRecord>(k)));
  return records.filter((r): r is UserRecord => !!r && (r.role === "admin" || r.role === "moderator"));
}

/** Нормализует телефон к виду +7XXXXXXXXXX */
export function normalizePhoneStrict(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return "+7" + digits;
  if (digits.length === 11 && (digits[0] === "7" || digits[0] === "8")) {
    return "+7" + digits.slice(1);
  }
  throw new Error(`Неверный формат номера: ${raw}`);
}
