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
    // Адрес регистрации
    birthPlaceCity: str(body.birthPlaceCity ?? existing.birthPlaceCity, "", 100),
    addrCity:       str(body.addrCity       ?? existing.addrCity,       "", 100),
    addrStreet:     str(body.addrStreet     ?? existing.addrStreet,     "", 150),
    addrHouse:      str(body.addrHouse      ?? existing.addrHouse,      "", 20),
    addrApt:        str(body.addrApt        ?? existing.addrApt,        "", 20),
    // Паспорт
    passportSeries:         str(body.passportSeries         ?? existing.passportSeries,         "", 5),
    passportNumber:         str(body.passportNumber         ?? existing.passportNumber,         "", 6),
    passportIssueDate:      str(body.passportIssueDate      ?? existing.passportIssueDate,      "", 10),
    passportIssuedBy:       str(body.passportIssuedBy       ?? existing.passportIssuedBy,       "", 300),
    passportDepartmentCode: str(body.passportDepartmentCode ?? existing.passportDepartmentCode, "", 7),
    // Адрес проживания
    livingSameAsRegister: body.livingSameAsRegister === true || body.livingSameAsRegister === false
      ? body.livingSameAsRegister
      : (existing.livingSameAsRegister ?? false),
    livingCity:   str(body.livingCity   ?? existing.livingCity,   "", 100),
    livingStreet: str(body.livingStreet ?? existing.livingStreet, "", 150),
    livingHouse:  str(body.livingHouse  ?? existing.livingHouse,  "", 20),
    livingApt:    str(body.livingApt    ?? existing.livingApt,    "", 20),
    email:        str(body.email        ?? existing.email,        "", 120),
    // Поручители
    guarantor1FullName: str(body.guarantor1FullName ?? existing.guarantor1FullName, "", 200),
    guarantor1Phone:    str(body.guarantor1Phone    ?? existing.guarantor1Phone,    "", 30),
    guarantor2FullName: str(body.guarantor2FullName ?? existing.guarantor2FullName, "", 200),
    guarantor2Phone:    str(body.guarantor2Phone    ?? existing.guarantor2Phone,    "", 30),
  };

  await redis.set(`profile:${phone}`, updated);

  return NextResponse.json({ ok: true, ...updated });
}
