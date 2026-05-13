/**
 * GET /api/cron/payment-reminders
 *
 * Cron-эндпоинт (запускается ежедневно через Vercel Crons).
 * Сканирует все активные рассрочки, для каждой определяет даты ближайших
 * платежей и шлёт клиенту в Telegram уведомление, если до платежа:
 *   • ровно 2 дня
 *   • ровно 1 день
 *   • 0 дней (сегодня)
 *
 * Защищён через `Authorization: Bearer ${CRON_SECRET}` — Vercel Cron
 * автоматически добавляет этот заголовок, если CRON_SECRET задан.
 *
 * Дедупликация: для каждого (loanId, paymentIdx, kind) пишем флаг
 * `reminder_sent:{loanId}:{idx}:{kind}` с TTL 30 дней — чтобы не слать
 * одно и то же повторно при повторных вызовах.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getRedis }    from "@/lib/redis";
import { sendToChat }  from "@/lib/telegram";
import { findByPhone } from "@/lib/user-store";
import type { LoanRecord, ProfileRecord } from "@/app/api/lk/me/route";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function fmtMoney(n: number): string {
  return Math.round(n).toLocaleString("ru-RU") + " ₽";
}

function fmtDateRu(d: Date): string {
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "long" });
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysBetween(a: Date, b: Date): number {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

interface SchedulePayment {
  idx:     number;            // 1..term — для ежемесячных, 0 — для взноса
  dueDate: Date;
  amount:  number;
  kind:    "down" | "month";
}

/** Построить полный график платежей по рассрочке. */
function buildScheduleForLoan(loan: LoanRecord): SchedulePayment[] {
  if (!loan.startDate || loan.termMonths < 1) return [];
  const start = new Date(loan.startDate);
  const downAmt = Math.max(0, loan.totalAmount - loan.monthlyPayment * Math.max(1, loan.termMonths - 1));

  const out: SchedulePayment[] = [];
  out.push({ idx: 0, dueDate: start, amount: downAmt, kind: "down" });
  for (let i = 1; i < loan.termMonths; i++) {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i);
    out.push({ idx: i, dueDate: d, amount: loan.monthlyPayment, kind: "month" });
  }
  return out;
}

/** Определить, был ли платёж уже оплачен — по paidAmount. */
function isPaymentDone(loan: LoanRecord, payment: SchedulePayment): boolean {
  /* Грубая модель: считаем сколько платежей точно покрыто paidAmount */
  if (payment.kind === "down") {
    const downAmt = Math.max(0, loan.totalAmount - loan.monthlyPayment * Math.max(1, loan.termMonths - 1));
    return loan.paidAmount >= downAmt;
  }
  const downAmt = Math.max(0, loan.totalAmount - loan.monthlyPayment * Math.max(1, loan.termMonths - 1));
  const monthsPaid = Math.floor(Math.max(0, loan.paidAmount - downAmt) / Math.max(1, loan.monthlyPayment));
  return monthsPaid >= payment.idx;
}

export async function GET(req: NextRequest) {
  /* Авторизация: Vercel Cron шлёт Bearer CRON_SECRET */
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret) {
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const redis = getRedis();
  const today = new Date();

  /* Найти все профили (= ключи loans:*) */
  let cursor = "0";
  const allLoanKeys: string[] = [];
  do {
    const [next, batch] = await redis.scan(cursor, { match: "loans:*", count: 200 });
    cursor = next;
    for (const k of batch) {
      /* Берём только агрегированный массив loans:{phone}, а не отдельные loans:{phone}:{id} */
      const parts = k.split(":");
      if (parts.length === 2) allLoanKeys.push(k);
    }
  } while (cursor !== "0");

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const key of allLoanKeys) {
    const phone = key.replace("loans:", "");
    let loans: LoanRecord[] | null = null;
    try {
      loans = (await redis.get<LoanRecord[]>(key)) ?? [];
    } catch {
      continue;
    }
    if (!Array.isArray(loans) || loans.length === 0) continue;

    const userRecord = await findByPhone(phone);
    if (!userRecord?.chatId) { skipped++; continue; }

    const profile = await redis.get<ProfileRecord>(`profile:${phone}`);
    const greeting = profile?.firstName ? `${profile.firstName}, ` : "";

    for (const loan of loans) {
      if (loan.status === "completed") continue;
      const schedule = buildScheduleForLoan(loan);

      for (const p of schedule) {
        if (isPaymentDone(loan, p)) continue;
        const daysLeft = daysBetween(today, p.dueDate);
        let kind: "2d" | "1d" | "today" | null = null;
        if (daysLeft === 2) kind = "2d";
        else if (daysLeft === 1) kind = "1d";
        else if (daysLeft === 0) kind = "today";
        if (!kind) continue;

        const dedupKey = `reminder_sent:${loan.id}:${p.idx}:${kind}`;
        const already = await redis.get(dedupKey);
        if (already) continue;

        const dateStr = fmtDateRu(p.dueDate);
        const amountStr = fmtMoney(p.amount);
        const whatIs = p.kind === "down" ? "первоначальный взнос" : `платёж № ${p.idx}`;
        let header = "";
        if (kind === "today") header = `🔔 *Сегодня платёж*`;
        else if (kind === "1d") header = `⏰ *Завтра платёж*`;
        else header = `📅 *Через 2 дня платёж*`;

        const msg = [
          header,
          ``,
          `${greeting}напоминаем: ${dateStr} — ${whatIs} по рассрочке.`,
          `Сумма: *${amountStr}*`,
          `Товар: ${loan.product}`,
          ``,
          `Детали и график — в вашем *Личном кабинете.*`,
        ].join("\n");

        try {
          await sendToChat(userRecord.chatId, msg);
          /* TTL 30 дней — хватит, чтобы не повторить тот же reminder */
          await redis.set(dedupKey, "1", { ex: 60 * 60 * 24 * 30 });
          sent++;
        } catch (e) {
          errors.push(`${phone}/${loan.id}/${p.idx}/${kind}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    }
  }

  return NextResponse.json({
    ok: true, sent, skipped, errors: errors.slice(0, 10), totalLoanKeys: allLoanKeys.length,
  });
}
