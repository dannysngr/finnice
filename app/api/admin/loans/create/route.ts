/**
 * POST /api/admin/loans/create
 *
 * Ручное создание рассрочки клиенту админом (без прохождения через заявку).
 * Логика идентична approve-application/route.ts, но без appId и без обязательного
 * уведомления в Telegram (опционально).
 *
 * Body: {
 *   phone:        string,
 *   product:      string,
 *   price:        number,
 *   term:         number,
 *   monthly:      number,
 *   downAmount?:  number,
 *   costAmount?:  number,
 *   markupAmount?: number,
 *   markupPct?:   number,
 *   startDate?:   string,   // ISO yyyy-mm-dd — если не задано, today
 *   notify?:      boolean,  // отправить ли уведомление клиенту (default false)
 *   targetIrrAtCreation?: number,
 * }
 */
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
      phone: customerPhone, product, price, term, monthly,
      costAmount, markupAmount, markupPct, downAmount,
      startDate, notify, targetIrrAtCreation,
    } = body;

    if (!customerPhone || !product || typeof price !== "number" || price <= 0) {
      return NextResponse.json({ error: "phone, product, price required" }, { status: 400 });
    }
    if (typeof term !== "number" || term < 1) {
      return NextResponse.json({ error: "term must be >= 1" }, { status: 400 });
    }
    if (typeof monthly !== "number" || monthly <= 0) {
      return NextResponse.json({ error: "monthly required" }, { status: 400 });
    }

    const redis = getRedis();
    const loanId = uuidv4();
    const start = startDate || new Date().toISOString().slice(0, 10);

    const loan = {
      id:             loanId,
      product:        String(product).slice(0, 200),
      totalAmount:    price,
      paidAmount:     0,
      monthlyPayment: monthly,
      termMonths:     term,
      startDate:      start,
      status:         "active" as const,
      createdAt:      Date.now(),
      ...(typeof costAmount === "number"          ? { costAmount } : {}),
      ...(typeof markupAmount === "number"        ? { markupAmount } : {}),
      ...(typeof markupPct === "number"           ? { markupPct } : {}),
      ...(typeof downAmount === "number"          ? { downAmount } : {}),
      ...(typeof targetIrrAtCreation === "number" ? { targetIrrAtCreation } : {}),
    };

    /* Сохраняем по двум ключам (как approve-application) */
    await redis.set(`loans:${customerPhone}:${loanId}`, loan);
    const existingLoans = (await redis.get(`loans:${customerPhone}`)) as unknown[] | null;
    const loansList = Array.isArray(existingLoans) ? existingLoans : [];
    loansList.push(loan);
    await redis.set(`loans:${customerPhone}`, loansList);

    /* Cash-flow ledger */
    try {
      const ledgerCost = typeof costAmount === "number" && costAmount > 0 ? costAmount : price / 1.25;
      const ledgerDown = typeof downAmount === "number" && downAmount >= 0
        ? downAmount
        : Math.max(0, price - monthly * Math.max(1, term - 1));
      const entries = buildInitialLedger({
        startDate:      start,
        costAmount:     ledgerCost,
        downAmount:     ledgerDown,
        monthlyPayment: monthly,
        termMonths:     term,
      });
      await appendLedger(customerPhone, loanId, entries);
    } catch (ledgerErr) {
      console.warn("[loans/create] ledger write failed:", ledgerErr);
    }

    /* Опциональное Telegram-уведомление клиенту */
    if (notify) {
      try {
        const userRecord = await findByPhone(customerPhone);
        if (userRecord?.chatId) {
          const fmt = (n: number) => n.toLocaleString("ru-RU") + " ₽";
          const downAmt = typeof downAmount === "number"
            ? downAmount
            : Math.max(0, price - monthly * (term - 1));
          const msg = [
            `🎉 *Вам оформлена рассрочка*`,
            ``,
            `📦 *Товар:* ${product}`,
            `💳 *Первый платёж (взнос):* ${fmt(downAmt)}`,
            `📅 *Ежемесячный платёж:* ${fmt(monthly)}`,
            `🔢 *Всего платежей:* ${pluralPayment(term)}`,
            ``,
            `Детальный график доступен в *Личном кабинете.*`,
          ].join("\n");
          await sendToChat(userRecord.chatId, msg);
        }
      } catch (notifyErr) {
        console.warn("[loans/create] notify failed:", notifyErr);
      }
    }

    return NextResponse.json({ ok: true, loan });
  } catch (err) {
    console.error("loans/create error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
