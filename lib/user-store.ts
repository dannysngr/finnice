/**
 * lib/user-store.ts
 * ─────────────────────────────────────────────────────────────────
 * Хранилище пользователей: phone ↔ telegram_chat_id.
 *
 * Стратегия хранения:
 *   Dev / VPS  → JSON-файл в .data/users.json (работает «из коробки»)
 *   Vercel     → замените readStore/writeStore на Upstash Redis:
 *                await redis.hset("users", phone, JSON.stringify(user))
 *                await redis.hget("users", phone)
 * ─────────────────────────────────────────────────────────────────
 */

import fs   from "fs";
import path from "path";

export interface UserRecord {
  phone:     string;           // нормализованный: +7XXXXXXXXXX
  chatId:    number | null;    // Telegram chat_id, null пока не привязан
  firstName: string | null;    // из Telegram contact
  createdAt: number;           // Date.now()
  lastLogin: number | null;
}

/* ── paths ────────────────────────────────────────────────── */
const DATA_DIR  = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "users.json");

/* ── file I/O ─────────────────────────────────────────────── */
function readStore(): Record<string, UserRecord> {
  try {
    if (!fs.existsSync(DATA_DIR))  fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "{}", "utf8");
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return {};
  }
}

function writeStore(data: Record<string, UserRecord>): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

/* ── public API ───────────────────────────────────────────── */

export function findByPhone(phone: string): UserRecord | null {
  return readStore()[phone] ?? null;
}

export function findByChatId(chatId: number): UserRecord | null {
  const store = readStore();
  return Object.values(store).find(u => u.chatId === chatId) ?? null;
}

/** Сохраняет нового пользователя или обновляет chat_id существующего */
export function upsertUser(
  phone: string,
  update: Partial<Pick<UserRecord, "chatId" | "firstName">>
): UserRecord {
  const store   = readStore();
  const existing = store[phone];
  const record: UserRecord = existing
    ? { ...existing, ...update }
    : {
        phone,
        chatId:    update.chatId    ?? null,
        firstName: update.firstName ?? null,
        createdAt: Date.now(),
        lastLogin: null,
      };
  store[phone] = record;
  writeStore(store);
  return record;
}

/** Привязывает chat_id к уже существующей записи (или создаёт новую) */
export function linkTelegramChatId(
  phone: string,
  chatId: number,
  firstName?: string
): UserRecord {
  return upsertUser(phone, { chatId, firstName: firstName ?? null });
}

/** Обновляет lastLogin */
export function touchLastLogin(phone: string): void {
  const store = readStore();
  if (store[phone]) {
    store[phone].lastLogin = Date.now();
    writeStore(store);
  }
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
