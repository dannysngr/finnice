/**
 * POST /api/auth/verify-code
 * ─────────────────────────────────────────────────────────────────
 * Тело: { phone: string, code: string }
 *
 * При успехе устанавливает httpOnly session cookie (30 дней).
 *
 * 200 { ok: true, user: { phone, firstName } }
 * 400 { ok: false, error: string }
 * 401 { ok: false, error: string, reason: string }
 * ─────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse }   from "next/server";
import { normalizePhone, verifyCode }  from "@/lib/code-store";
import { touchLastLogin, findByPhone } from "@/lib/user-store";
import {
  createSessionToken,
  sessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/session";

const ERROR_MESSAGES: Record<string, string> = {
  not_found:         "Сначала запросите код подтверждения",
  expired:           "Код истёк — запросите новый",
  wrong_code:        "Неверный код",
  too_many_attempts: "Слишком много попыток. Запросите новый код",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.phone || !body?.code) {
      return NextResponse.json(
        { ok: false, error: "Поля phone и code обязательны" },
        { status: 400 }
      );
    }

    let phone: string;
    try {
      phone = normalizePhone(body.phone);
    } catch {
      return NextResponse.json(
        { ok: false, error: "Неверный формат номера" },
        { status: 400 }
      );
    }

    // Верифицируем код
    const result = await verifyCode(phone, String(body.code).trim());
    if (!result.ok) {
      return NextResponse.json(
        {
          ok:     false,
          error:  ERROR_MESSAGES[result.reason] ?? "Неверный код",
          reason: result.reason,
        },
        { status: 401 }
      );
    }

    // Обновляем lastLogin
    await touchLastLogin(phone);

    const user = await findByPhone(phone);

    // Создаём сессионный токен
    const token = createSessionToken(phone);

    const response = NextResponse.json({
      ok:   true,
      user: {
        phone,
        firstName: user?.firstName ?? null,
      },
    });

    // Устанавливаем httpOnly cookie
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());

    return response;

  } catch (err) {
    console.error("[verify-code]", err);
    return NextResponse.json(
      { ok: false, error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}
