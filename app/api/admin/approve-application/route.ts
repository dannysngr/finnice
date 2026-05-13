import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { getRedis } from "@/lib/redis";
import { findByPhone } from "@/lib/user-store";
import { sendToChat } from "@/lib/telegram";
import { pluralPayment } from "@/lib/calculator-logic";
import { v4 as uuidv4 } from "uuid";
import { appendLedger, buildInitialLedger } from "@/lib/finance/ledger";

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      appId, phone: customerPhone, product, price, term, monthly,
      costAmount, markupAmount, markupPct, downAmount, targetIrrAtCreation,
    } = body;

    if (!customerPhone || !product || typeof price !== "number") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const redis = getRedis();

    // Create loan object — fields match LoanRecord interface
    const loanId = uuidv4();
    const loan = {
      id:             loanId,
      product,
      totalAmount:    price,
      paidAmount:     0,
      monthlyPayment: monthly ?? 0,
      termMonths:     term   ?? 0,
      startDate:      new Date().toISOString().slice(0, 10),
      status:         "active" as const,
      createdAt:      Date.now(),

      /* Финансовые поля (опционально) */
      ...(typeof costAmount === "number"          ? { costAmount } : {}),
      ...(typeof markupAmount === "number"        ? { markupAmount } : {}),
      ...(typeof markupPct === "number"           ? { markupPct } : {}),
      ...(typeof downAmount === "number"          ? { downAmount } : {}),
      ...(typeof targetIrrAtCreation === "number" ? { targetIrrAtCreation } : {}),
    };

    // Save loan keyed by loanId (primary store, used by /lk)
    await redis.set(`loans:${customerPhone}:${loanId}`, loan);

    // Also append to legacy list for backward compatibility
    const existingLoans = (await redis.get(`loans:${customerPhone}`)) as unknown[] | null;
    const loansList = Array.isArray(existingLoans) ? existingLoans : [];
    loansList.push(loan);
    await redis.set(`loans:${customerPhone}`, loansList);

    // ── Cash-flow ledger: создаём стартовые записи ─────────────
    try {
      const ledgerCost = typeof costAmount === "number" && costAmount > 0 ? costAmount : price / 1.25;
      const ledgerDown = typeof downAmount === "number" && downAmount >= 0
        ? downAmount
        : Math.max(0, price - (monthly ?? 0) * Math.max(1, (term ?? 1) - 1));
      const entries = buildInitialLedger({
        startDate:      loan.startDate,
        costAmount:     ledgerCost,
        downAmount:     ledgerDown,
        monthlyPayment: monthly ?? 0,
        termMonths:     term ?? 0,
      });
      await appendLedger(customerPhone, loanId, entries);
    } catch (ledgerErr) {
      console.warn("[approve] ledger write failed:", ledgerErr);
    }

    // Update application status → "approved"
    if (appId) {
      const appKey  = `application:${appId}`;
      const appData = await redis.get(appKey);
      if (appData && typeof appData === "object") {
        await redis.set(appKey, {
          ...(appData as Record<string, unknown>),
          status:     "approved",
          approvedAt: new Date().toISOString(),
        });
      }
    }

    // Уведомление клиенту об одобрении + график вторым сообщением
    try {
      const userRecord = await findByPhone(customerPhone);
      if (userRecord?.chatId) {
        const fmt = (n: number) => n.toLocaleString("ru-RU") + " ₽";
        const downAmt = typeof downAmount === "number" ? downAmount
          : Math.max(0, price - (monthly ?? 0) * ((term ?? 1) - 1));
        const paymentsLabel = pluralPayment(term ?? 0);
        const msg1 = [
          `🎉 *Хорошие новости!* Ваша рассрочка одобрена.`,
          ``,
          `📦 *Товар:* ${product}`,
          `💳 *Первый платёж (взнос):* ${fmt(downAmt)}`,
          `📅 *Ежемесячный платёж:* ${fmt(monthly ?? 0)}`,
          `🔢 *Всего платежей:* ${paymentsLabel}`,
          ``,
          `Детальный график также доступен в вашем *Личном кабинете.*`,
        ].join("\n");
        await sendToChat(userRecord.chatId, msg1);

        // Второе сообщение — график платежей
        const scheduleLines: string[] = [`📅 *График платежей*`, ``];
        const start = new Date(loan.startDate);
        scheduleLines.push(
          `• ${start.toLocaleDateString("ru-RU")} — *${fmt(downAmt)}* — первый взнос`,
        );
        for (let i = 1; i <= (term ?? 0); i++) {
          const d = new Date(start);
          d.setMonth(d.getMonth() + i);
          scheduleLines.push(
            `${i}. ${d.toLocaleDateString("ru-RU")} — *${fmt(monthly ?? 0)}* — ежемесячный платёж`,
          );
        }
        scheduleLines.push(``, `💡 Мы напомним за 2 дня, за 1 день и в день каждого платежа.`);
        await sendToChat(userRecord.chatId, scheduleLines.join("\n"));
      }
    } catch (notifyErr) {
      console.warn("[approve] Не удалось уведомить клиента:", notifyErr);
    }

    return NextResponse.json({ ok: true, loanId });
  } catch (err) {
    console.error("Error approving application:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
