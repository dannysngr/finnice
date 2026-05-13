/**
 * POST /api/applications
 * Принимает заявку на рассрочку, сохраняет в Redis и отправляет уведомление в Telegram администратору.
 */

import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";
import { findByPhone, upsertUser } from "@/lib/user-store";
import { sendToChat } from "@/lib/telegram";
import { v4 as uuidv4 } from "uuid";
import type { ProfileRecord } from "@/app/api/lk/me/route";

/**
 * Разбивает строку "Фамилия Имя Отчество" на части.
 * Если слов меньше двух — кладёт всё в firstName.
 */
function parseName(full: string): { lastName: string; firstName: string; patronymic: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 3) return { lastName: parts[0], firstName: parts[1], patronymic: parts.slice(2).join(" ") };
  if (parts.length === 2) return { lastName: parts[0], firstName: parts[1], patronymic: "" };
  return { lastName: "", firstName: parts[0] ?? "", patronymic: "" };
}

export interface ApplicationItem {
  productName:   string;
  qty:           number;
  /* На уровне товара храним cost (что отдаём поставщику) и markup,
     посчитанные модалом по той же iso-IRR политике, что и аггрегаты ниже. */
  costAmount:    number;
  markupAmount:  number;
  markupPct:     number;
  /* Полная цена клиенту по этому товару (с учётом qty) и взнос */
  totalAmount:   number;
  downAmount:    number;
  monthly:       number;
}

interface ApplicationPayload {
  name:          string;
  phone:         string;
  product:       string;
  price:         number;
  down:          number;
  term:          number;
  monthly:       number;

  /* iso-IRR meta (опционально, для аналитики) */
  costAmount?:          number;
  markupAmount?:        number;
  markupPct?:           number;
  downAmount?:          number;
  targetIrrAtCreation?: number;

  /** Многотоварная заявка (опционально). Если задано — price/down/monthly
   *  должны быть АГГРЕГАТАМИ по items. */
  items?:        ApplicationItem[];
}

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

function formatMoney(n: number): string {
  return n.toLocaleString("ru-RU") + " ₽";
}

export async function POST(req: Request) {
  try {
    const body: ApplicationPayload = await req.json();
    const {
      name, phone, product, price, down, term, monthly,
      costAmount, markupAmount, markupPct, downAmount, targetIrrAtCreation,
      items,
    } = body;

    // Валидация
    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json({ ok: false, error: "Имя и телефон обязательны" }, { status: 400 });
    }

    const token   = process.env.TELEGRAM_BOT_TOKEN;
    const adminId = process.env.ADMIN_CHAT_ID;

    if (!token || !adminId) {
      console.error("Missing TELEGRAM_BOT_TOKEN or ADMIN_CHAT_ID");
      return NextResponse.json({ ok: false, error: "Сервер не настроен" }, { status: 500 });
    }

    // Save application to Redis
    const appId = uuidv4();
    const application = {
      id: appId,
      name: name.trim(),
      phone: phone.trim(),
      product: product?.trim() || "",
      price: price || 0,
      down: down || 0,
      term: term || 0,
      monthly: monthly || 0,
      status: "pending",
      createdAt: new Date().toISOString(),

      /* iso-IRR meta (опционально, при наличии в payload) */
      ...(typeof costAmount === "number"          ? { costAmount } : {}),
      ...(typeof markupAmount === "number"        ? { markupAmount } : {}),
      ...(typeof markupPct === "number"           ? { markupPct } : {}),
      ...(typeof downAmount === "number"          ? { downAmount } : {}),
      ...(typeof targetIrrAtCreation === "number" ? { targetIrrAtCreation } : {}),
      ...(Array.isArray(items) && items.length > 0 ? { items } : {}),
    };
    const redis = getRedis();
    await redis.set(`application:${appId}`, application);

    // ── Авто-регистрация пользователя ──────────────────────────
    // Если profile:{phone} ещё не существует — создаём базовый,
    // чтобы пользователь сразу появился в списке «Пользователи» в админке.
    try {
      const normalPhone = (() => {
        const d = phone.trim().replace(/\D/g, "");
        if (d.length === 10) return "+7" + d;
        if (d.length === 11 && (d[0] === "7" || d[0] === "8")) return "+7" + d.slice(1);
        return phone.trim();
      })();

      const existingProfile = await redis.get<ProfileRecord>(`profile:${normalPhone}`);
      if (!existingProfile) {
        const { lastName, firstName, patronymic } = parseName(name.trim());
        const newProfile: ProfileRecord = {
          lastName,
          firstName,
          patronymic,
          birthDate:      "",
          avatarUrl:      "",
          trustScore:     0,
          birthPlaceCity: "",
          addrCity:       "",
          addrStreet:     "",
          addrHouse:      "",
          addrApt:        "",
        };
        await redis.set(`profile:${normalPhone}`, newProfile);
      }

      // Создаём user-запись (нужна для lastLogin/createdAt/chatId)
      const existingUser = await findByPhone(normalPhone);
      if (!existingUser) {
        const { firstName } = parseName(name.trim());
        await upsertUser(normalPhone, { firstName: firstName || null });
      }
    } catch (regErr) {
      console.warn("[applications] Не удалось авто-создать профиль:", regErr);
    }

    const now = new Date().toLocaleString("ru-RU", {
      timeZone:    "Europe/Moscow",
      day:         "2-digit",
      month:       "2-digit",
      year:        "numeric",
      hour:        "2-digit",
      minute:      "2-digit",
    });

    const hasItems = Array.isArray(items) && items.length > 0;
    const productLines = hasItems
      ? items!.map(i => `  • ${escapeMarkdown(i.productName)}${i.qty > 1 ? ` × ${i.qty}` : ""} — ${escapeMarkdown(formatMoney(i.totalAmount))}`).join("\n")
      : null;

    const text = [
      "🛍 *Новая заявка на рассрочку*",
      "",
      `👤 *Имя:* ${escapeMarkdown(name.trim())}`,
      `📞 *Телефон:* ${escapeMarkdown(phone.trim())}`,
      hasItems
        ? `📦 *Товары* \\(${items!.length}\\):\n${productLines}`
        : (product ? `📦 *Товар:* ${escapeMarkdown(product)}` : null),
      price   ? `💰 *Сумма:* ${escapeMarkdown(formatMoney(price))}` : null,
      down    ? `💳 *Первый взнос:* ${escapeMarkdown(formatMoney(down))}` : null,
      term    ? `📅 *Срок:* ${term} мес → ${escapeMarkdown(formatMoney(monthly))}/мес` : null,
      "",
      `⏱ ${escapeMarkdown(now)} МСК`,
    ].filter(Boolean).join("\n");

    const tgRes = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id:    adminId,
          text,
          parse_mode: "MarkdownV2",
        }),
      }
    );

    const tgData = await tgRes.json();

    if (!tgData.ok) {
      console.error("Telegram error:", tgData);
      return NextResponse.json({ ok: false, error: "Ошибка отправки уведомления" }, { status: 500 });
    }

    // Уведомление клиенту (если у него есть Telegram)
    try {
      const userRecord = await findByPhone(phone.trim());
      if (userRecord?.chatId) {
        await sendToChat(
          userRecord.chatId,
          `✅ *Заявка принята!*\n\nМы уже начали её рассматривать. Скоро пришлём решение.\n\nСпасибо, что выбрали *ФинНайс!*`
        );
      }
    } catch (notifyErr) {
      console.warn("[applications] Не удалось уведомить клиента:", notifyErr);
    }

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("Applications API error:", err);
    return NextResponse.json({ ok: false, error: "Внутренняя ошибка" }, { status: 500 });
  }
}
