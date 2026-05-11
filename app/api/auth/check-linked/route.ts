/**
 * GET /api/auth/check-linked?phone=+7XXXXXXXXXX
 * ─────────────────────────────────────────────────────────────────
 * Polling endpoint — клиент проверяет, привязал ли пользователь
 * Telegram к своему номеру.
 *
 * 200 { linked: true }  — chat_id найден, можно отправить OTP
 * 200 { linked: false } — ещё не привязан
 * 400 { error: ... }    — неверный номер
 * ─────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";
import { findByPhone }               from "@/lib/user-store";
import { normalizePhone }            from "@/lib/code-store";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("phone") ?? "";
  if (!raw) {
    return NextResponse.json({ error: "phone обязателен" }, { status: 400 });
  }

  let phone: string;
  try {
    phone = normalizePhone(raw);
  } catch {
    return NextResponse.json({ error: "Неверный формат номера" }, { status: 400 });
  }

  const user = await findByPhone(phone);
  return NextResponse.json({ linked: !!user?.chatId });
}
