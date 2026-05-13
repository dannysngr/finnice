/**
 * GET /api/lk/contract/[loanId]
 *
 * Скачать готовый договор купли-продажи в рассрочку.
 * Клиент может скачать только свои рассрочки; админ — любые
 * (через параметр ?phone=<...>).
 */

import { NextResponse, type NextRequest } from "next/server";
import { getSessionPhone } from "@/lib/auth-guard";
import { getAdminRole }    from "@/lib/adminAuth";
import { getRedis }        from "@/lib/redis";
import { findByPhone }     from "@/lib/user-store";
import type { LoanRecord, ProfileRecord } from "@/app/api/lk/me/route";
import { buildContract, buildSchedule, type ContractData } from "@/lib/contract/build-contract";
import { formatPhone } from "@/lib/phone-mask";

type Params = { params: Promise<{ loanId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const sessionPhone = await getSessionPhone();
  if (!sessionPhone) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { loanId } = await params;
  const url = new URL(req.url);
  const queryPhone = url.searchParams.get("phone");

  /* Админ может смотреть чужие; клиент — только свои */
  const adminRole = await getAdminRole();
  const targetPhone = (adminRole && queryPhone) ? queryPhone : sessionPhone;

  const redis = getRedis();

  /* Найти рассрочку: пробуем сначала по ключу :id, потом legacy список */
  let loan = await redis.get<LoanRecord>(`loans:${targetPhone}:${loanId}`);
  if (!loan) {
    const list = await redis.get<LoanRecord[]>(`loans:${targetPhone}`);
    if (Array.isArray(list)) loan = list.find(l => l.id === loanId) ?? null;
  }
  if (!loan) return NextResponse.json({ error: "Loan not found" }, { status: 404 });

  /* Профиль клиента */
  const profile = await redis.get<ProfileRecord>(`profile:${targetPhone}`);
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  /* Имя директора — берём из профиля админа, который одобрил, либо текущей сессии (для клиента — оставляем placeholder) */
  let directorFullName = "";
  if (adminRole) {
    const adminProfile = await redis.get<ProfileRecord>(`profile:${sessionPhone}`);
    if (adminProfile) {
      directorFullName = [adminProfile.lastName, adminProfile.firstName, adminProfile.patronymic]
        .filter(Boolean).join(" ");
    }
  } else {
    /* Если клиент — берём первого пользователя с ролью root в системе */
    try {
      const adminUserPhones = await redis.smembers("users:admins") as string[];
      for (const ph of adminUserPhones) {
        const p = await redis.get<ProfileRecord>(`profile:${ph}`);
        if (p?.lastName) {
          directorFullName = [p.lastName, p.firstName, p.patronymic].filter(Boolean).join(" ");
          break;
        }
      }
    } catch {}
  }

  /* Адрес регистрации */
  const regAddress = [
    "Чеченская Республика",
    profile.addrCity,
    profile.addrStreet && `ул. ${profile.addrStreet}`,
    profile.addrHouse  && `д. ${profile.addrHouse}`,
    profile.addrApt    && `кв. ${profile.addrApt}`,
  ].filter(Boolean).join(", ");

  /* Адрес проживания */
  let livingAddress: string;
  if (profile.livingSameAsRegister) {
    livingAddress = regAddress;
  } else {
    livingAddress = [
      profile.livingCity,
      profile.livingStreet && `ул. ${profile.livingStreet}`,
      profile.livingHouse  && `д. ${profile.livingHouse}`,
      profile.livingApt    && `кв. ${profile.livingApt}`,
    ].filter(Boolean).join(", ");
  }

  /* Phone */
  const userRecord = await findByPhone(targetPhone);
  const phoneFormatted = formatPhone(targetPhone) || targetPhone;

  /* Контрактный номер: short id */
  const contractNumber = loan.id.slice(0, 8).toUpperCase();

  /* Рассрочные параметры */
  const totalAmount = loan.totalAmount;
  const monthly     = loan.monthlyPayment;
  const term        = loan.termMonths;
  const downAmount  = loan.downAmount ?? Math.max(0, totalAmount - monthly * Math.max(1, term - 1));
  const remaining   = Math.max(0, totalAmount - downAmount);

  const data: ContractData = {
    contractNumber,
    contractDate: loan.startDate || new Date().toISOString().slice(0, 10),
    contractCity: profile.addrCity || "Грозный",
    sellerCompanyName: "ФинНайс",
    sellerDirectorFullName: directorFullName,
    buyerFullName: [profile.lastName, profile.firstName, profile.patronymic].filter(Boolean).join(" "),
    buyerBirthDate: profile.birthDate || "",
    buyerPassportSeries:    profile.passportSeries    || "",
    buyerPassportNumber:    profile.passportNumber    || "",
    buyerPassportIssuedBy:  profile.passportIssuedBy  || "",
    buyerPassportIssueDate: profile.passportIssueDate || "",
    buyerPassportDeptCode:  profile.passportDepartmentCode || "",
    buyerRegisterAddress: regAddress || "—",
    buyerLivingAddress:   livingAddress || "—",
    buyerPhone:           phoneFormatted,
    buyerEmail:           profile.email || undefined,
    productName:          loan.product || "Товар",
    productQuantity:      1,
    totalPrice:           totalAmount,
    downPayment:          downAmount,
    remainingPay:         remaining,
    termMonths:           term,
    schedule: buildSchedule({
      startDate:      loan.startDate || new Date().toISOString().slice(0, 10),
      downPayment:    downAmount,
      monthlyPayment: monthly,
      termMonths:     term,
    }),
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _u = userRecord;

  try {
    const docx = await buildContract(data);
    const lastName = profile.lastName || "client";
    const filename = `dogovor-${lastName}-${contractNumber}.docx`;
    return new NextResponse(docx as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Cache-Control":       "no-store",
      },
    });
  } catch (e) {
    console.error("contract build error:", e);
    return NextResponse.json({ error: "Failed to build contract" }, { status: 500 });
  }
}
