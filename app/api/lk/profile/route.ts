/**
 * PUT /api/lk/profile
 * Сохраняет расширенный профиль пользователя в Redis.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionPhone }           from "@/lib/auth-guard";
import { getRedis }                  from "@/lib/redis";
import type { ProfileRecord }        from "@/app/api/lk/me/route";

const str = (v: unknown, fallback = "", limit = 200) =>
  String(v ?? fallback).trim().slice(0, limit);

export async function PUT(req: NextRequest) {
  const phone = await getSessionPhone();
  if (!phone) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body)  return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const redis    = getRedis();
  const existing = (await redis.get<ProfileRecord>(`profile:${phone}`)) ?? ({} as ProfileRecord);

  const updated: ProfileRecord = {
    ...existing,
    lastName:       str(body.lastName   ?? existing.lastName,   "", 60),
    firstName:      str(body.firstName  ?? existing.firstName,  "", 60),
    patronymic:     str(body.patronymic ?? existing.patronymic, "", 60),
    birthDate:      str(body.birthDate  ?? existing.birthDate,  "", 10),
    avatarUrl:      str(body.avatarUrl  ?? existing.avatarUrl,  "", 500),
    trustScore:     typeof body.trustScore === "number" ? body.trustScore : (existing.trustScore ?? 0),
    // Адрес
    birthPlaceCity: str(body.birthPlaceCity ?? existing.birthPlaceCity, "", 100),
    addrCity:       str(body.addrCity       ?? existing.addrCity,       "", 100),
    addrStreet:     str(body.addrStreet     ?? existing.addrStreet,     "", 150),
    addrHouse:      str(body.addrHouse      ?? existing.addrHouse,      "", 20),
    addrApt:        str(body.addrApt        ?? existing.addrApt,        "", 20),
  };

  await redis.set(`profile:${phone}`, updated);

  return NextResponse.json({ ok: true, ...updated });
}
