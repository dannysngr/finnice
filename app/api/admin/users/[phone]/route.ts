/**
 * GET   /api/admin/users/[phone]  — полные данные пользователя
 * PATCH /api/admin/users/[phone]  — обновить профиль пользователя
 */

import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest }            from "@/lib/adminAuth";
import { getRedis }                  from "@/lib/redis";
import { findByPhone }               from "@/lib/user-store";
import type { ProfileRecord, LoanRecord } from "@/app/api/lk/me/route";

type Params = { params: Promise<{ phone: string }> };

const str = (v: unknown, fallback = "", limit = 200) =>
  String(v ?? fallback).trim().slice(0, limit);

export async function GET(_req: NextRequest, { params }: Params) {
  if (!(await isAdminRequest()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { phone: rawPhone } = await params;
  const phone = decodeURIComponent(rawPhone);

  const redis      = getRedis();
  const userRecord = await findByPhone(phone);
  const profile    = await redis.get<ProfileRecord & { blocked?: boolean }>(`profile:${phone}`);
  const loanKeys   = await redis.keys(`loans:${phone}:*`);

  const loanObjects = await Promise.all(loanKeys.map(k => redis.get<LoanRecord>(k)));
  const loans = (loanObjects.filter(Boolean) as LoanRecord[])
    .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));

  return NextResponse.json({
    phone,
    firstName:      profile?.firstName      ?? userRecord?.firstName ?? null,
    lastName:       profile?.lastName       ?? null,
    patronymic:     profile?.patronymic     ?? null,
    birthDate:      profile?.birthDate      ?? null,
    trustScore:     profile?.trustScore     ?? 0,
    blocked:        profile?.blocked        ?? false,
    chatId:         userRecord?.chatId      ?? null,
    createdAt:      userRecord?.createdAt   ?? null,
    lastLogin:      userRecord?.lastLogin   ?? null,
    loansCount:     loanKeys.length,
    loans,
    // Адрес
    birthPlaceCity: profile?.birthPlaceCity ?? null,
    addrCity:       profile?.addrCity       ?? null,
    addrStreet:     profile?.addrStreet     ?? null,
    addrHouse:      profile?.addrHouse      ?? null,
    addrApt:        profile?.addrApt        ?? null,
  });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!(await isAdminRequest()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { phone: rawPhone } = await params;
  const phone = decodeURIComponent(rawPhone);

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const redis    = getRedis();
  const existing = (await redis.get<ProfileRecord & { blocked?: boolean }>(`profile:${phone}`))
    ?? ({} as ProfileRecord & { blocked?: boolean });

  const updated = {
    ...existing,
    firstName:  body.firstName  !== undefined ? str(body.firstName,  "", 60) : existing.firstName,
    lastName:   body.lastName   !== undefined ? str(body.lastName,   "", 60) : existing.lastName,
    patronymic: body.patronymic !== undefined ? str(body.patronymic, "", 60) : existing.patronymic,
    birthDate:  body.birthDate  !== undefined ? str(body.birthDate,  "", 10) : existing.birthDate,
    trustScore: typeof body.trustScore === "number" ? body.trustScore : (existing.trustScore ?? 0),
    blocked:    typeof body.blocked    === "boolean" ? body.blocked    : (existing.blocked    ?? false),
    avatarUrl:  existing.avatarUrl ?? "",
    // Адрес
    birthPlaceCity: body.birthPlaceCity !== undefined ? str(body.birthPlaceCity, "", 100) : (existing.birthPlaceCity ?? ""),
    addrCity:       body.addrCity       !== undefined ? str(body.addrCity,       "", 100) : (existing.addrCity       ?? ""),
    addrStreet:     body.addrStreet     !== undefined ? str(body.addrStreet,     "", 150) : (existing.addrStreet     ?? ""),
    addrHouse:      body.addrHouse      !== undefined ? str(body.addrHouse,      "",  20) : (existing.addrHouse      ?? ""),
    addrApt:        body.addrApt        !== undefined ? str(body.addrApt,        "",  20) : (existing.addrApt        ?? ""),
  };

  await redis.set(`profile:${phone}`, updated);

  // Синхронизируем firstName в UserRecord
  const userRecord = await findByPhone(phone);
  if (userRecord && body.firstName !== undefined) {
    await redis.set(`user:${phone}`, { ...userRecord, firstName: updated.firstName || null });
  }

  return NextResponse.json({ ok: true, ...updated });
}
