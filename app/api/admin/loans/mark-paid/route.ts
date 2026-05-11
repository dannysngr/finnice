/**
 * POST /api/admin/loans/mark-paid
 * Администратор вручную отмечает платёж как оплаченный.
 * Body: { phone, loanId, paymentIdx }  (paymentIdx — 1-based номер платежа в графике)
 */

import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest }            from "@/lib/adminAuth";
import { getRedis }                  from "@/lib/redis";
import type { LoanRecord }           from "@/app/api/lk/me/route";
import { recordActualPayment }       from "@/lib/finance/ledger";

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const { phone, loanId, paymentIdx } = body;   // paymentIdx: 1-based
  if (!phone || !loanId || typeof paymentIdx !== "number")
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const redis = getRedis();
  const loan  = await redis.get<LoanRecord>(`loans:${phone}:${loanId}`);
  if (!loan) return NextResponse.json({ error: "Loan not found" }, { status: 404 });

  // Вычисляем накопленную сумму до paymentIdx включительно
  const monthly = loan.monthlyPayment;
  const term    = loan.termMonths;
  const downAmt = Math.max(0, loan.totalAmount - monthly * (term - 1));

  let accumulated = 0;
  for (let i = 1; i <= paymentIdx; i++) {
    accumulated += i === 1 ? downAmt : monthly;
  }

  const newPaidAmount = Math.max(loan.paidAmount, accumulated);
  const newStatus: LoanRecord["status"] =
    newPaidAmount >= loan.totalAmount ? "completed" : "active";

  const updatedLoan: LoanRecord = { ...loan, paidAmount: newPaidAmount, status: newStatus };

  // Обновляем основное хранилище
  await redis.set(`loans:${phone}:${loanId}`, updatedLoan);

  // Обновляем устаревший список для совместимости
  const list = (await redis.get<LoanRecord[]>(`loans:${phone}`)) ?? [];
  const updatedList = list.map(l => l.id === loanId ? updatedLoan : l);
  await redis.set(`loans:${phone}`, updatedList);

  // ── Cash-flow ledger: записываем фактический платёж ──────
  try {
    const amount = paymentIdx === 1 ? downAmt : monthly;
    await recordActualPayment(phone, loanId, paymentIdx, amount);
  } catch (ledgerErr) {
    console.warn("[mark-paid] ledger write failed:", ledgerErr);
  }

  return NextResponse.json({ ok: true, paidAmount: newPaidAmount, status: newStatus });
}
