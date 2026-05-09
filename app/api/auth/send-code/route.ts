/**
 * POST /api/auth/send-code
 * ─────────────────────────────────────────────────────────────────
 * Принимает номер телефона, генерирует 4-значный код,
 * сохраняет его в store (TTL 5 мин) и отправляет через Telegram.
 *
 * Body: { phone: string }
 *
 * Responses:
 *   200 { ok: true, message: string }
 *   400 { ok: false, error: string }
 *   429 { ok: false, error: string }   ← rate limit
 *   500 { ok: false, error: string }
 * ─────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";
import {
  generateCode,
  normalizePhone,
  saveCode,
  isRateLimited,
} from "@/lib/code-store";
import { sendOtpCode, sendOtpToSupport } from "@/lib/telegram";

// ─── User lookup helper (заглушка → замените на реальный DB-запрос) ─
async function getTelegramChatId(phone: string): Promise<number | null> {
  // TODO: SELECT telegram_chat_id FROM users WHERE phone = $1
  // Пример (Prisma):
  //   const user = await prisma.user.findUnique({ where: { phone } });
  //   return user?.telegramChatId ?? null;

  // Временная заглушка: используйте TELEGRAM_SUPPORT_CHAT_ID пока
  // пользователь не зарегистрировал свой аккаунт через бота.
  void phone;
  return null;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Парсим тело запроса
    const body = await req.json().catch(() => null);
    if (!body?.phone) {
      return NextResponse.json(
        { ok: false, error: "Поле phone обязательно" },
        { status: 400 }
      );
    }

    // 2. Нормализуем номер
    let phone: string;
    try {
      phone = normalizePhone(body.phone);
    } catch {
      return NextResponse.json(
        { ok: false, error: "Неверный формат номера телефона" },
        { status: 400 }
      );
    }

    // 3. Rate limit: не чаще 1 раза в 60 секунд
    if (isRateLimited(phone)) {
      return NextResponse.json(
        { ok: false, error: "Подождите минуту перед повторным запросом" },
        { status: 429 }
      );
    }

    // 4. Генерируем и сохраняем код
    const code = generateCode();
    saveCode(phone, code);

    // 5. Ищем Telegram chat_id пользователя
    const chatId = await getTelegramChatId(phone);

    if (chatId) {
      // Отправляем напрямую пользователю
      await sendOtpCode(chatId, code, phone);
    } else {
      // Fallback: отправляем в чат поддержки (менеджер передаёт код клиенту)
      await sendOtpToSupport(code, phone);
    }

    // 6. В dev-режиме логируем код для удобства тестирования
    if (process.env.NODE_ENV !== "production") {
      console.log(`[OTP DEV] ${phone} → ${code}`);
    }

    return NextResponse.json({
      ok: true,
      message: chatId
        ? "Код отправлен в Telegram"
        : "Код отправлен оператору. Ожидайте звонка или сообщения.",
    });
  } catch (err) {
    console.error("[send-code] Ошибка:", err);
    return NextResponse.json(
      { ok: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
