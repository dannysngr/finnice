/**
 * GET  /api/lk/loans  — список рассрочек
 * POST /api/lk/loans  — добавить рассрочку
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionPhone }           from "@/lib/auth-guard";
import { getRedis }                  from "@/lib/redis";
import type { LoanRecord }           from "../me/route";

const LOANS_KEY = (phone: string) => `loans:${phone}`;

export async function GET() {
  const phone = await getSessionPhone();
  if (!phone) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const loans = await getRedis().get<LoanRecord[]>(LOANS_KEY(phone)) ?? [];
  return NextResponse.json({ loans });
}

export async function POST(req: NextRequest) {
  const phone = await getSessionPhone();
  if (!phone) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.product || !body?.totalAmount) {
    return NextResponse.json({ error: "product и totalAmount обязательны" }, { status: 400 });
  }

  const redis = getRedis();
  const loans = await redis.get<LoanRecord[]>(LOANS_KEY(phone)) ?? [];

  const newLoan: LoanRecord = {
    id:             crypto.randomUUID(),
    product:        String(body.product).trim().slice(0, 120),
    totalAmount:    Math.max(0, Number(body.totalAmount)),
    paidAmount:     Math.max(0, Number(body.paidAmount ?? 0)),
    monthlyPayment: Math.max(0, Number(body.monthlyPayment ?? 0)),
    termMonths:     Math.max(1, Number(body.termMonths ?? 12)),
    startDate:      String(body.startDate ?? new Date().toISOString().slice(0, 10)),
    status:         "active",
    createdAt:      Date.now(),
  };

  await redis.set(LOANS_KEY(phone), [...loans, newLoan]);
  return NextResponse.json({ ok: true, loan: newLoan }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const phone = await getSessionPhone();
  if (!phone) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json().catch(() => ({ id: "" }));
  if (!id) return NextResponse.json({ error: "id обязателен" }, { status: 400 });

  const redis  = getRedis();
  const loans  = await redis.get<LoanRecord[]>(LOANS_KEY(phone)) ?? [];
  const filtered = loans.filter(l => l.id !== id);
  await redis.set(LOANS_KEY(phone), filtered);

  return NextResponse.json({ ok: true });
}
