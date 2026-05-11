/**
 * PATCH /api/admin/loans/edit
 * Администратор редактирует параметры рассрочки.
 * Body: { phone, loanId, product?, totalAmount?, monthlyPayment?, termMonths?, startDate? }
 */

import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest }            from "@/lib/adminAuth";
import { getRedis }                  from "@/lib/redis";
import type { LoanRecord }           from "@/app/api/lk/me/route";

export async function PATCH(req: NextRequest) {
  if (!(await isAdminRequest()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const { phone, loanId, ...patch } = body;
  if (!phone || !loanId)
    return NextResponse.json({ error: "Missing phone or loanId" }, { status: 400 });

  const redis = getRedis();
  const loan  = await redis.get<LoanRecord>(`loans:${phone}:${loanId}`);
  if (!loan) return NextResponse.json({ error: "Loan not found" }, { status: 404 });

  const updatedLoan: LoanRecord = {
    ...loan,
    product:        typeof patch.product        === "string" ? patch.product.trim()       : loan.product,
    totalAmount:    typeof patch.totalAmount    === "number" ? patch.totalAmount           : loan.totalAmount,
    monthlyPayment: typeof patch.monthlyPayment === "number" ? patch.monthlyPayment        : loan.monthlyPayment,
    termMonths:     typeof patch.termMonths     === "number" ? patch.termMonths            : loan.termMonths,
    startDate:      typeof patch.startDate      === "string" ? patch.startDate.slice(0,10) : loan.startDate,
  };

  // Пересчёт статуса после изменения суммы
  if (updatedLoan.paidAmount >= updatedLoan.totalAmount) {
    updatedLoan.status = "completed";
  } else {
    updatedLoan.status = "active";
  }

  // Обновляем основное хранилище
  await redis.set(`loans:${phone}:${loanId}`, updatedLoan);

  // Обновляем устаревший список
  const list = (await redis.get<LoanRecord[]>(`loans:${phone}`)) ?? [];
  await redis.set(`loans:${phone}`, list.map(l => l.id === loanId ? updatedLoan : l));

  return NextResponse.json({ ok: true, loan: updatedLoan });
}
