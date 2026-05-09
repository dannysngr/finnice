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
import { findByPhone, upsertUser }    from "@/lib/user-store";

/* ── Telegram ────────────────────────────────────────────── */
let _bot: Telegraf | null = null;
function getBot(): Telegraf {
  if (_bot) return _bot;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN не задан");
  _bot = new Telegraf(token);
  return _bot;
}

async function sendViaTelegram(chatId: number, code: string, phone: string) {
  const bot = getBot();
  await bot.telegram.sendMessage(
    chatId,
    `🔐 *Ваш код для ФинНайс: ${code}*\n\nДействителен 5 минут.\nНомер: ${phone}\n\n_Если вы не запрашивали код — просто проигнорируйте это сообщение._`,
    { parse_mode: "Markdown" }
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
    if (isRateLimited(phone)) {
      return NextResponse.json(
        { ok: false, error: "Подождите минуту перед повторным запросом" },
        { status: 429 }
      );
    }

    // Ищем пользователя
    const user = findByPhone(phone);

    // Если нет chat_id — просим привязать Telegram
    if (!user?.chatId) {
      // Создаём запись без chatId (чтобы потом обновить через бота)
      upsertUser(phone, {});
      return NextResponse.json({ ok: false, needsTelegram: true });
    }

    // Генерируем и сохраняем код
    const code = generateCode();
    saveCode(phone, code);

    // Dev: логируем
    if (process.env.NODE_ENV !== "production") {
      console.log(`[OTP] ${phone} → ${code}`);
    }

    // Отправляем через Telegram
    await sendViaTelegram(user.chatId, code, phone);

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("[send-code]", err);
    return NextResponse.json(
      { ok: false, error: "Ошибка сервера. Попробуйте позже." },
      { status: 500 }
    );
  }
}
