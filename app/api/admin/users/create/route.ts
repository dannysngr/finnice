/**
 * POST /api/admin/users/create
 * Ручное создание пользователя администратором.
 * Body: { phone, firstName, lastName, patronymic, birthDate }
 */

import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest }            from "@/lib/adminAuth";
import { getRedis }                  from "@/lib/redis";
import { upsertUser }                from "@/lib/user-store";
import type { ProfileRecord }        from "@/app/api/lk/me/route";

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const { phone: rawPhone, firstName, lastName, patronymic, birthDate } = body;

  if (!rawPhone?.trim())
    return NextResponse.json({ error: "Телефон обязателен" }, { status: 400 });

  // Нормализация номера
  const digits = String(rawPhone).replace(/\D/g, "");
  let phone: string;
  if (digits.length === 10) phone = "+7" + digits;
  else if (digits.length === 11 && (digits[0] === "7" || digits[0] === "8"))
    phone = "+7" + digits.slice(1);
  else return NextResponse.json({ error: "Неверный формат телефона" }, { status: 400 });

  const redis = getRedis();

  // Проверяем, что пользователь ещё не существует
  const existingProfile = await redis.get(`profile:${phone}`);
  if (existingProfile)
    return NextResponse.json({ error: "Пользователь с таким номером уже существует" }, { status: 409 });

  // Создаём запись в user-store
  await upsertUser(phone, { firstName: firstName?.trim() || null });

  // Создаём профиль
  const profile: ProfileRecord = {
    firstName:      String(firstName  ?? "").trim().slice(0, 60),
    lastName:       String(lastName   ?? "").trim().slice(0, 60),
    patronymic:     String(patronymic ?? "").trim().slice(0, 60),
    birthDate:      String(birthDate  ?? "").trim().slice(0, 10),
    avatarUrl:      "",
    trustScore:     0,
    birthPlaceCity: "",
    addrCity:       "",
    addrStreet:     "",
    addrHouse:      "",
    addrApt:        "",
  };

  await redis.set(`profile:${phone}`, profile);

  return NextResponse.json({ ok: true, phone });
}
