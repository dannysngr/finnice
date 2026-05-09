/**
 * lib/telegram.ts
 * ─────────────────────────────────────────────────────────────────
 * Singleton-экземпляр Telegraf бота.
 * Используется только на сервере (API Routes / Server Actions).
 *
 * ENV-переменные (см. .env.local):
 *   TELEGRAM_BOT_TOKEN   — токен от @BotFather
 *   TELEGRAM_CHAT_ID     — chat_id получателя (для уведомлений
 *                           в один чат / группу поддержки)
 *                           Если каждый пользователь имеет свой
 *                           chat_id — берите из базы данных.
 * ─────────────────────────────────────────────────────────────────
 */

import { Telegraf } from "telegraf";

/* ── singleton ────────────────────────────────────────────── */
const globalWithBot = globalThis as typeof globalThis & {
  __telegrafBot?: Telegraf;
};

function getBot(): Telegraf {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    throw new Error(
      "TELEGRAM_BOT_TOKEN не задан. Добавьте его в .env.local"
    );
  }

  if (!globalWithBot.__telegrafBot) {
    globalWithBot.__telegrafBot = new Telegraf(
      process.env.TELEGRAM_BOT_TOKEN
    );
  }

  return globalWithBot.__telegrafBot;
}

/* ── public helpers ───────────────────────────────────────── */

/**
 * Отправляет OTP-код пользователю.
 *
 * @param chatId  Telegram chat_id пользователя (число или строка).
 *                Получается через /start — бот должен принять сообщение
 *                и сохранить ctx.from.id в базе при регистрации.
 * @param code    4-значный код
 * @param phone   Номер телефона — для контекста в сообщении
 */
export async function sendOtpCode(
  chatId: number | string,
  code: string,
  phone: string
): Promise<void> {
  const bot = getBot();

  const message = [
    `🔐 *Код подтверждения ФинНайс*`,
    ``,
    `Ваш одноразовый код:`,
    ``,
    `\`${code}\``,
    ``,
    `Действителен *5 минут*.`,
    `Номер: ${phone}`,
    ``,
    `_Если вы не запрашивали код — проигнорируйте это сообщение._`,
  ].join("\n");

  await bot.telegram.sendMessage(chatId, message, {
    parse_mode: "Markdown",
  });
}

/**
 * Fallback: отправляет код в служебный чат поддержки.
 * Используется пока у пользователя нет зарегистрированного chat_id.
 */
export async function sendOtpToSupport(
  code: string,
  phone: string
): Promise<void> {
  const supportChatId = process.env.TELEGRAM_SUPPORT_CHAT_ID;
  if (!supportChatId) {
    console.warn("[telegram] TELEGRAM_SUPPORT_CHAT_ID не задан — код не отправлен в поддержку");
    return;
  }

  const bot = getBot();
  await bot.telegram.sendMessage(
    supportChatId,
    `📲 Запрос OTP\nТелефон: ${phone}\nКод: \`${code}\``,
    { parse_mode: "Markdown" }
  );
}
