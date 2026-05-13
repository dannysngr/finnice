/**
 * POST /api/admin/loans/delete
 * Администратор удаляет рассрочку пользователя.
 * Body: { phone, loanId }
 */

import { NextRequest, NextResponse } from "next/server";
import { canDeleteRecords }          from "@/lib/adminAuth";
import { getRedis }                  from "@/lib/redis";
import type { LoanRecord }           from "@/app/api/lk/me/route";

export async function POST(req: NextRequest) {
  if (!(await canDeleteRecords()))
    return NextResponse.json({ error: "Удаление рассрочек доступно только администраторам" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const { phone, loanId } = body;
  if (!phone || !loanId)
    return NextResponse.json({ error: "Missing phone or loanId" }, { status: 400 });

  const redis = getRedis();

  // Удаляем основной ключ
  await redis.del(`loans:${phone}:${loanId}`);

  // Убираем из устаревшего списка
  const list = (await redis.get<LoanRecord[]>(`loans:${phone}`)) ?? [];
  await redis.set(`loans:${phone}`, list.filter(l => l.id !== loanId));

  return NextResponse.json({ ok: true });
}
