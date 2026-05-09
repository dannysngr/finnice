/**
 * POST /api/telegram/webhook
 * ─────────────────────────────────────────────────────────────────
 * Обрабатывает входящие обновления от Telegram.
 *
 * Команды:
 *   /start  → отправляет клавиатуру «Поделиться контактом»
 *
 * Сообщения:
 *   contact → сохраняет phone + chat_id в user-store
 *
 * Безопасность:
 *   Telegram передаёт X-Telegram-Bot-Api-Secret-Token header.
 *   Если он не совпадает с TELEGRAM_WEBHOOK_SECRET — 403.
 * ─────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";
import { Telegraf, Context }          from "telegraf";
import { linkTelegramChatId, normalizePhoneStrict } from "@/lib/user-store";

// Lazy singleton — пересоздавать дорого
let _bot: Telegraf | null = null;

function getBot(): Telegraf {
  if (_bot) return _bot;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN не задан");
  _bot = new Telegraf(token);
  setupHandlers(_bot);
  return _bot;
}

/* ── Bot handlers ─────────────────────────────────────────── */
function setupHandlers(bot: Telegraf) {

  // /start — запрашиваем контакт
  bot.start(async (ctx: Context) => {
    await ctx.reply(
      "Привет! 👋\n\nЧтобы войти в личный кабинет ФинНайс, нам нужно подтвердить ваш номер телефона.",
      {
        reply_markup: {
          keyboard: [[
            {
              text:            "📱 Поделиться контактом",
              request_contact: true,
            },
          ]],
          resize_keyboard:  true,
          one_time_keyboard: true,
        },
      }
    );
  });

  // Получили контакт
  bot.on("contact", async (ctx) => {
    const contact = ctx.message?.contact;
    if (!contact) return;

    // Проверяем, что контакт — от самого пользователя, а не чужой
    if (contact.user_id && contact.user_id !== ctx.from?.id) {
      await ctx.reply("❌ Пожалуйста, отправьте ваш собственный контакт.");
      return;
    }

    let phone: string;
    try {
      phone = normalizePhoneStrict(contact.phone_number);
    } catch {
      await ctx.reply("❌ Не удалось распознать номер. Попробуйте снова.");
      return;
    }

    const chatId    = ctx.from!.id;
    const firstName = ctx.from?.first_name ?? contact.first_name ?? null;

    linkTelegramChatId(phone, chatId, firstName ?? undefined);

    await ctx.reply(
      `✅ Отлично, ${firstName ?? ""}!\n\nНомер *${phone}* привязан к вашему Telegram.\n\nВернитесь на сайт — там уже можно войти в кабинет.`,
      {
        parse_mode:   "Markdown",
        reply_markup: { remove_keyboard: true },
      }
    );
  });

  // Всё остальное
  bot.on("message", async (ctx) => {
    await ctx.reply(
      "Нажмите /start чтобы привязать Telegram к вашему аккаунту.",
    );
  });
}

/* ── Route handler ─────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  // Верифицируем секрет webhook'а
  const secret         = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
  const incomingSecret = req.headers.get("x-telegram-bot-api-secret-token") ?? "";

  if (secret && incomingSecret !== secret) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const update = await req.json();
    const bot    = getBot();

    // Обрабатываем обновление асинхронно
    await bot.handleUpdate(update);

    return new NextResponse("ok", { status: 200 });
  } catch (err) {
    console.error("[telegram/webhook] Ошибка:", err);
    // Возвращаем 200 чтобы Telegram не переотправлял
    return new NextResponse("ok", { status: 200 });
  }
}
