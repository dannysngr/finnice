/**
 * POST /api/auth/verify-code
 * ─────────────────────────────────────────────────────────────────
 * Проверяет введённый OTP-код.
 * При успехе — устанавливает session cookie (httpOnly, sameSite).
 *
 * Body: { phone: string, code: string }
 *
 * Responses:
 *   200 { ok: true,  user: { phone, name? } }
 *   400 { ok: false, error: string }
 *   401 { ok: false, error: string, reason: VerifyResult["reason"] }
 * ─────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";
import { normalizePhone, verifyCode } from "@/lib/code-store";

/** Заглушка — замените на реальный INSERT/SELECT из БД */
async function findOrCreateUser(phone: string) {
  // TODO (Prisma пример):
  // return prisma.user.upsert({
  //   where:  { phone },
  //   update: { lastLogin: new Date() },
  //   create: { phone },
  //   select: { id: true, phone: true, fullName: true },
  // });
  return { id: "mock-id", phone, fullName: null };
}

const ERROR_MESSAGES: Record<string, string> = {
  not_found:        "Сначала запросите код подтверждения",
  expired:          "Код истёк. Запросите новый",
  wrong_code:       "Неверный код",
  too_many_attempts:"Слишком много попыток. Запросите новый код",
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

    // Проверяем код
    const result = verifyCode(phone, String(body.code));

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: ERROR_MESSAGES[result.reason] ?? "Ошибка", reason: result.reason },
        { status: 401 }
      );
    }

    // Код верный — создаём / находим пользователя
    const user = await findOrCreateUser(phone);

    // Формируем ответ с session cookie
    const response = NextResponse.json({
      ok:   true,
      user: { phone: user.phone, name: user.fullName },
    });

    // httpOnly cookie: не читается JS, защита от XSS
    response.cookies.set("session", `${user.id}:${phone}`, {
      httpOnly:  true,
      sameSite:  "lax",
      secure:    process.env.NODE_ENV === "production",
      path:      "/",
      maxAge:    60 * 60 * 24 * 30, // 30 дней
    });

    return response;
  } catch (err) {
    console.error("[verify-code] Ошибка:", err);
    return NextResponse.json(
      { ok: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
