/**
 * POST /api/vacancy-response
 *
 * Принимает отклик на вакансию: name, phone, vacancy, message?, expectedSalary?
 * Сохраняет в Redis (vacancy_response:{id}) и отправляет уведомление админу в Telegram.
 */

import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";
import { sendToChat } from "@/lib/telegram";
import { v4 as uuidv4 } from "uuid";

interface VacancyResponsePayload {
  name:             string;
  phone:            string;
  vacancy:          string;
  message?:         string;
  expectedSalary?:  string;
}

function escapeMarkdown(text: string): string {
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as VacancyResponsePayload | null;
    if (!body) return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });

    const name = String(body.name ?? "").trim().slice(0, 120);
    const phone = String(body.phone ?? "").trim().slice(0, 30);
    const vacancy = String(body.vacancy ?? "").trim().slice(0, 200);
    const message = String(body.message ?? "").trim().slice(0, 1500);
    const expectedSalary = String(body.expectedSalary ?? "").trim().slice(0, 50);

    if (!name) return NextResponse.json({ ok: false, error: "Укажите имя" }, { status: 400 });
    if (!phone) return NextResponse.json({ ok: false, error: "Укажите телефон" }, { status: 400 });
    if (!vacancy) return NextResponse.json({ ok: false, error: "Не указана вакансия" }, { status: 400 });

    const adminChatId = process.env.ADMIN_CHAT_ID;
    const botToken    = process.env.TELEGRAM_BOT_TOKEN;
    if (!adminChatId || !botToken) {
      console.error("[vacancy-response] missing TELEGRAM_BOT_TOKEN or ADMIN_CHAT_ID");
      return NextResponse.json({ ok: false, error: "Сервер не настроен" }, { status: 500 });
    }

    const id = uuidv4();
    const record = {
      id,
      name, phone, vacancy, message, expectedSalary,
      status:    "new" as const,
      createdAt: new Date().toISOString(),
    };

    try {
      await getRedis().set(`vacancy_response:${id}`, record);
    } catch (e) {
      console.warn("[vacancy-response] Redis save failed:", e);
    }

    const now = new Date().toLocaleString("ru-RU", {
      timeZone: "Europe/Moscow", day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    const text = [
      "📨 *Новый отклик на вакансию*",
      ``,
      `💼 *Вакансия:* ${escapeMarkdown(vacancy)}`,
      `👤 *Имя:* ${escapeMarkdown(name)}`,
      `📞 *Телефон:* ${escapeMarkdown(phone)}`,
      expectedSalary ? `💰 *Ожидания:* ${escapeMarkdown(expectedSalary)}` : null,
      message ? `\n📝 *О себе:*\n${escapeMarkdown(message)}` : null,
      ``,
      `⏱ ${escapeMarkdown(now)} МСК`,
    ].filter(Boolean).join("\n");

    try {
      await sendToChat(Number(adminChatId), text);
    } catch (e) {
      console.error("[vacancy-response] Telegram send failed:", e);
      return NextResponse.json({ ok: false, error: "Не удалось отправить уведомление" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[vacancy-response] error:", e);
    return NextResponse.json({ ok: false, error: "Внутренняя ошибка" }, { status: 500 });
  }
}
