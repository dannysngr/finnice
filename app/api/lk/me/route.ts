/**
 * GET /api/lk/me
 * Возвращает профиль + список рассрочек текущего пользователя.
 */

import { NextResponse }    from "next/server";
import { getSessionPhone } from "@/lib/auth-guard";
import { getRedis }        from "@/lib/redis";
import { findByPhone }     from "@/lib/user-store";
import { getAdminRole }    from "@/lib/adminAuth";

export interface LoanItem {
  productName:  string;
  qty:          number;
  costAmount:   number;
  markupAmount: number;
  markupPct:    number;
  totalAmount:  number;
  downAmount:   number;
  monthly:      number;
}

export interface LoanRecord {
  id:             string;
  product:        string;
  totalAmount:    number;
  paidAmount:     number;
  monthlyPayment: number;
  termMonths:     number;
  startDate:      string;
  status:         "active" | "completed";
  createdAt:      number;

  /* Опциональные поля для финансовой аналитики (заполняются при одобрении новых сделок) */
  costAmount?:        number;   // что отдали поставщику
  markupAmount?:      number;   // наша gross прибыль
  markupPct?:         number;   // наценка как доля cost (0..1)
  downAmount?:        number;   // первоначальный взнос
  targetIrrAtCreation?: number; // целевая annual IRR на момент выдачи

  /** Многотоварная рассрочка — состав сделки */
  items?:        LoanItem[];
}

export interface ProfileRecord {
  lastName:   string;
  firstName:  string;
  patronymic: string;
  birthDate:  string;
  avatarUrl:  string;
  trustScore: number;
  // Место рождения
  birthPlaceCity: string;
  // Адрес регистрации (регион = "Чеченская Республика" всегда)
  addrCity:   string;
  addrStreet: string;
  addrHouse:  string;
  addrApt:    string;
  // Паспортные данные (для договора)
  passportSeries?:   string;   // 4 цифры "XX XX"
  passportNumber?:   string;   // 6 цифр
  passportIssueDate?: string;  // YYYY-MM-DD
  passportIssuedBy?: string;   // кем выдан (свободный текст)
  passportDepartmentCode?: string;  // XXX-XXX
  // Адрес проживания
  livingSameAsRegister?: boolean;
  livingCity?:   string;
  livingStreet?: string;
  livingHouse?:  string;
  livingApt?:    string;
  // Email опционально
  email?: string;
  // Поручители — обязательны для админа при рассрочке >= 80 000 ₽
  // (для клиента всегда опционально, заполняется при оформлении сделки)
  guarantor1FullName?: string;
  guarantor1Phone?:    string;
  guarantor2FullName?: string;
  guarantor2Phone?:    string;
}

export async function GET() {
  const phone = await getSessionPhone();
  if (!phone) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const redis   = getRedis();
  const user    = await findByPhone(phone);
  const profile = await redis.get<ProfileRecord>(`profile:${phone}`);
  const loans   = await redis.get<LoanRecord[]>(`loans:${phone}`) ?? [];
  const adminRole = await getAdminRole();

  return NextResponse.json({
    phone,
    adminRole,
    lastName:       profile?.lastName       ?? null,
    firstName:      profile?.firstName      ?? user?.firstName ?? null,
    patronymic:     profile?.patronymic     ?? null,
    birthDate:      profile?.birthDate      ?? null,
    avatarUrl:      profile?.avatarUrl      ?? null,
    trustScore:     profile?.trustScore     ?? 0,
    birthPlaceCity: profile?.birthPlaceCity ?? null,
    addrCity:       profile?.addrCity       ?? null,
    addrStreet:     profile?.addrStreet     ?? null,
    addrHouse:      profile?.addrHouse      ?? null,
    addrApt:        profile?.addrApt        ?? null,
    passportSeries:         profile?.passportSeries         ?? null,
    passportNumber:         profile?.passportNumber         ?? null,
    passportIssueDate:      profile?.passportIssueDate      ?? null,
    passportIssuedBy:       profile?.passportIssuedBy       ?? null,
    passportDepartmentCode: profile?.passportDepartmentCode ?? null,
    livingSameAsRegister:   profile?.livingSameAsRegister   ?? false,
    livingCity:   profile?.livingCity   ?? null,
    livingStreet: profile?.livingStreet ?? null,
    livingHouse:  profile?.livingHouse  ?? null,
    livingApt:    profile?.livingApt    ?? null,
    email:        profile?.email        ?? null,
    guarantor1FullName: profile?.guarantor1FullName ?? null,
    guarantor1Phone:    profile?.guarantor1Phone    ?? null,
    guarantor2FullName: profile?.guarantor2FullName ?? null,
    guarantor2Phone:    profile?.guarantor2Phone    ?? null,
    loans,
  });
}
