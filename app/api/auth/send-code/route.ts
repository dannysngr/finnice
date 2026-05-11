/**
 * POST /api/auth/send-code
 * ─────────────────────────────────────────────────────────────────
 * Тело: { phone: string }
 *
 * Ответы:
 *   200 { ok: true }                         — код отправлен в Telegram
 *   200 { ok: false, needsTelegram: true }   — номер не привязан к боту
 *   400 { ok: false, error: string }         — неверные данные
 *   429 { ok: false, error: string }         — rate limit
 *   500 { ok: false, error: string }         — ошибка сервера
 * ─────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";
import { Telegraf }                   from "telegraf";
import {
  generateCode,
  normalizePhone,
  saveCode,
  isRateLimited,
} from "@/lib/code-store";
import { findByPhone, upsertUser } from "@/lib/user-store";

/* ── Telegram ────────────────────────────────────────────── */
let _bot: Telegraf | null = null;
function getBot(): Telegraf {
  if (_bot) return _bot;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN не задан");
  _bot = new Telegraf(token);
  return _bot;
}

async function sendViaTelegram(chatId: number, code: string) {
  const bot = getBot();
  await bot.telegram.sendMessage(
    chatId,
    `🔐 *Код подтверждения FinNice*\n\n\`${code}\`\n\n_Действителен 5 минут. Никому не сообщайте._`,
    {
      parse_mode: "Markdown",
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      reply_markup: {
        // copy_text added in Bot API 7.3 — not yet in telegraf types
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        inline_keyboard: [[
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          { text: "📋 Скопировать код", copy_text: { text: code } } as unknown as import("@telegraf/types").InlineKeyboardButton,
        ]],
      },
    }
  );
}

/* ── Route ───────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.phone) {
      return NextResponse.json(
        { ok: false, error: "Поле phone обязательно" },
        { status: 400 }
      );
    }

    let phone: string;
    try {
      phone = normalizePhone(body.phone);
    } catch {
      return NextResponse.json(
        { ok: false, error: "Неверный формат номера телефона" },
        { status: 400 }
      );
    }

    // Rate limit
    if (await isRateLimited(phone)) {
      return NextResponse.json(
        { ok: false, error: "Подождите минуту перед повторным запросом" },
        { status: 429 }
      );
    }

    // Ищем пользователя
    const user = await findByPhone(phone);

    // Если нет chat_id — просим привязать Telegram
    if (!user?.chatId) {
      await upsertUser(phone, {});
      return NextResponse.json({ ok: false, needsTelegram: true });
    }

    // Генерируем и сохраняем код
    const code = generateCode();
    await saveCode(phone, code);

    // Dev: логируем
    if (process.env.NODE_ENV !== "production") {
      console.log(`[OTP] ${phone} → ${code}`);
    }

    // Отправляем через Telegram
    await sendViaTelegram(user.chatId, code);

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("[send-code]", err);
    return NextResponse.json(
      { ok: false, error: "Ошибка сервера. Попробуйте позже." },
      { status: 500 }
    );
  }
}
