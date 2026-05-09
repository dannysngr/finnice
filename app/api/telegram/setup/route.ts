/**
 * GET /api/telegram/setup
 * ─────────────────────────────────────────────────────────────────
 * Регистрирует webhook в Telegram API.
 * Вызвать ОДИН РАЗ после деплоя:
 *
 *   curl https://finnice.ru/api/telegram/setup?secret=finnice_webhook_secret_2026
 *
 * ENV:
 *   TELEGRAM_BOT_TOKEN       — токен бота
 *   TELEGRAM_WEBHOOK_SECRET  — секрет для верификации запросов
 *   NEXT_PUBLIC_APP_URL      — публичный URL сайта (https://finnice.ru)
 * ─────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Простая защита: нужно передать секрет в query
  const { searchParams } = new URL(req.url);
  const providedSecret   = searchParams.get("secret") ?? "";
  const webhookSecret    = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";

  if (!webhookSecret || providedSecret !== webhookSecret) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const botToken  = process.env.TELEGRAM_BOT_TOKEN;
  const appUrl    = process.env.NEXT_PUBLIC_APP_URL;

  if (!botToken) {
    return NextResponse.json({ ok: false, error: "TELEGRAM_BOT_TOKEN не задан" }, { status: 500 });
  }
  if (!appUrl) {
    return NextResponse.json({ ok: false, error: "NEXT_PUBLIC_APP_URL не задан" }, { status: 500 });
  }

  const webhookUrl = `${appUrl}/api/telegram/webhook`;

  // Вызываем Telegram Bot API
  const tgRes = await fetch(
    `https://api.telegram.org/bot${botToken}/setWebhook`,
    {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url:          webhookUrl,
        secret_token: webhookSecret,
        // Получаем только нужные типы событий
        allowed_updates: ["message", "callback_query"],
      }),
    }
  );

  const result = await tgRes.json();

  if (result.ok) {
    return NextResponse.json({
      ok:  true,
      message: `Webhook установлен: ${webhookUrl}`,
      tg:  result,
    });
  } else {
    return NextResponse.json({ ok: false, tg: result }, { status: 500 });
  }
}

/**
 * GET /api/telegram/setup?action=info — проверить текущий webhook
 */
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const providedSecret   = searchParams.get("secret") ?? "";
  const webhookSecret    = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";

  if (!webhookSecret || providedSecret !== webhookSecret) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgRes    = await fetch(
    `https://api.telegram.org/bot${botToken}/getWebhookInfo`
  );
  return NextResponse.json(await tgRes.json());
}
