/**
 * lib/telegram-templates.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Реестр шаблонов сообщений Telegram-бота.
 *
 * Каждый шаблон хранится в Redis по ключу `msg_template:{key}`. Если в
 * Redis ничего нет — используется defaultText из этого файла.
 * В шаблоне переменные пишутся в виде `{name}` и подставляются на
 * рендере через fillTemplate.
 *
 * Для MarkdownV2-шаблонов значения переменных нужно ЭКРАНИРОВАТЬ ДО
 * вызова renderMessage — текст шаблона сам по себе не экранируется,
 * потому что в нём админ пишет валидный Markdown.
 */

import { getRedis } from "@/lib/redis";

export type ParseMode = "Markdown" | "MarkdownV2" | "HTML" | "none";
export type Audience = "client" | "admin";

export interface TemplateVar {
  name:        string;
  description: string;
  example?:    string;
}

export interface TemplateDef {
  key:         string;
  label:       string;
  description: string;
  audience:    Audience;
  parseMode:   ParseMode;
  variables:   TemplateVar[];
  defaultText: string;
}

export const TEMPLATES: TemplateDef[] = [
  /* ════════ КЛИЕНТУ ════════ */
  {
    key:         "otp",
    label:       "Код подтверждения (OTP)",
    description: "Уходит клиенту при входе на сайт через одноразовый код.",
    audience:    "client",
    parseMode:   "Markdown",
    variables: [
      { name: "code",  description: "6-значный код", example: "423891" },
      { name: "phone", description: "Номер клиента", example: "+7 926 623 15 45" },
    ],
    defaultText: [
      "🔐 *Код подтверждения Финнайс*",
      "",
      "Ваш одноразовый код:",
      "",
      "`{code}`",
      "",
      "Действителен *5 минут*.",
      "Номер: {phone}",
      "",
      "_Если вы не запрашивали код — проигнорируйте это сообщение._",
    ].join("\n"),
  },

  {
    key:         "bot_start",
    label:       "Приветствие при /start в боте",
    description: "Первое сообщение, которое бот шлёт при первом запуске пользователем.",
    audience:    "client",
    parseMode:   "Markdown",
    variables:   [],
    defaultText: "Привет! Я бот верификации *FinNice*.\n\nНажмите кнопку ниже, чтобы привязать номер телефона к аккаунту.",
  },

  {
    key:         "bot_phone_linked",
    label:       "После привязки номера к боту",
    description: "Подтверждение, что номер успешно сохранён в системе.",
    audience:    "client",
    parseMode:   "Markdown",
    variables:   [],
    defaultText: "✅ *Номер подтверждён*\n\nТеперь вы можете войти на [finnice.ru](https://finnice.ru).",
  },

  {
    key:         "application_received",
    label:       "Заявка принята",
    description: "Уходит клиенту сразу после отправки им заявки на рассрочку.",
    audience:    "client",
    parseMode:   "Markdown",
    variables:   [],
    defaultText: "✅ *Заявка принята!*\n\nМы уже начали её рассматривать. Скоро пришлём решение.\n\nСпасибо, что выбрали *Финнайс!*",
  },

  {
    key:         "loan_approved",
    label:       "Одобрение рассрочки (первое сообщение)",
    description: "Уходит клиенту, когда админ одобрил заявку. Вторым сообщением сразу идёт график платежей (loan_schedule).",
    audience:    "client",
    parseMode:   "Markdown",
    variables: [
      { name: "products",      description: "Блок с товаром(-ами) — формируется кодом",       example: "📦 *Товар:* iPhone 17 Pro" },
      { name: "price",         description: "Общая сумма к оплате",                            example: "118 800 ₽" },
      { name: "downAmount",    description: "Первый взнос",                                     example: "17 500 ₽" },
      { name: "monthly",       description: "Ежемесячный платёж",                              example: "10 100 ₽" },
      { name: "paymentsLabel", description: "Подпись вида «6 платежей»",                       example: "6 платежей" },
    ],
    defaultText: [
      "🎉 *Хорошие новости!* Ваша рассрочка одобрена.",
      "",
      "{products}",
      "",
      "💰 *Общая сумма:* {price}",
      "💳 *Первый платёж (взнос):* {downAmount}",
      "📅 *Ежемесячный платёж:* {monthly}",
      "🔢 *Всего платежей:* {paymentsLabel}",
      "",
      "Детальный график также доступен в вашем *Личном кабинете.*",
    ].join("\n"),
  },

  {
    key:         "loan_schedule",
    label:       "График платежей (вторым сообщением после одобрения)",
    description: "Перечисление дат и сумм всех платежей по займу.",
    audience:    "client",
    parseMode:   "Markdown",
    variables: [
      { name: "schedule", description: "Список платежей построчно — формируется кодом", example: "• 01.06.2026 — *17 500 ₽* — первый взнос\n1. 01.07.2026 — *10 100 ₽* — ежемесячный платёж" },
    ],
    defaultText: [
      "📅 *График платежей*",
      "",
      "{schedule}",
      "",
      "💡 Мы напомним за 2 дня, за 1 день и в день каждого платежа.",
    ].join("\n"),
  },

  {
    key:         "payment_reminder_2d",
    label:       "Напоминание о платеже — за 2 дня",
    description: "Отправляется за 48 часов до даты платежа.",
    audience:    "client",
    parseMode:   "Markdown",
    variables: [
      { name: "greeting", description: "Обращение по имени или пусто",          example: "Дени, " },
      { name: "date",     description: "Дата платежа",                          example: "01 июня 2026" },
      { name: "what",     description: "Что за платёж (взнос / № N)",          example: "платёж № 2" },
      { name: "amount",   description: "Сумма платежа",                         example: "10 100 ₽" },
      { name: "product",  description: "Название товара",                       example: "iPhone 17 Pro" },
    ],
    defaultText: [
      "📅 *Через 2 дня платёж*",
      "",
      "{greeting}напоминаем: {date} — {what} по рассрочке.",
      "Сумма: *{amount}*",
      "Товар: {product}",
      "",
      "Детали и график — в вашем *Личном кабинете.*",
    ].join("\n"),
  },

  {
    key:         "payment_reminder_1d",
    label:       "Напоминание о платеже — за 1 день",
    description: "Отправляется за 24 часа до даты платежа.",
    audience:    "client",
    parseMode:   "Markdown",
    variables: [
      { name: "greeting", description: "Обращение по имени или пусто", example: "Дени, " },
      { name: "date",     description: "Дата платежа",                  example: "01 июня 2026" },
      { name: "what",     description: "Что за платёж",                 example: "платёж № 2" },
      { name: "amount",   description: "Сумма",                         example: "10 100 ₽" },
      { name: "product",  description: "Название товара",               example: "iPhone 17 Pro" },
    ],
    defaultText: [
      "⏰ *Завтра платёж*",
      "",
      "{greeting}напоминаем: {date} — {what} по рассрочке.",
      "Сумма: *{amount}*",
      "Товар: {product}",
      "",
      "Детали и график — в вашем *Личном кабинете.*",
    ].join("\n"),
  },

  {
    key:         "payment_reminder_today",
    label:       "Напоминание о платеже — сегодня",
    description: "Отправляется в день платежа.",
    audience:    "client",
    parseMode:   "Markdown",
    variables: [
      { name: "greeting", description: "Обращение по имени или пусто", example: "Дени, " },
      { name: "date",     description: "Дата платежа",                  example: "01 июня 2026" },
      { name: "what",     description: "Что за платёж",                 example: "платёж № 2" },
      { name: "amount",   description: "Сумма",                         example: "10 100 ₽" },
      { name: "product",  description: "Название товара",               example: "iPhone 17 Pro" },
    ],
    defaultText: [
      "🔔 *Сегодня платёж*",
      "",
      "{greeting}напоминаем: {date} — {what} по рассрочке.",
      "Сумма: *{amount}*",
      "Товар: {product}",
      "",
      "Детали и график — в вашем *Личном кабинете.*",
    ].join("\n"),
  },

  /* ════════ В АДМИН-ЧАТ ════════ */
  {
    key:         "otp_admin_fallback",
    label:       "OTP-код в админ-чат (fallback)",
    description: "Когда у клиента нет привязки бота — код уходит в служебный чат.",
    audience:    "admin",
    parseMode:   "Markdown",
    variables: [
      { name: "phone", description: "Номер клиента", example: "+7 926 623 15 45" },
      { name: "code",  description: "Код",            example: "423891" },
    ],
    defaultText: "📲 Запрос OTP\nТелефон: {phone}\nКод: `{code}`",
  },

  {
    key:         "admin_new_application",
    label:       "Новая заявка в админ-чат",
    description: "Полная информация о поступившей от клиента заявке. Использует MarkdownV2 — значения экранируются автоматически кодом.",
    audience:    "admin",
    parseMode:   "MarkdownV2",
    variables: [
      { name: "name",         description: "Имя клиента",                       example: "Дени" },
      { name: "phone",        description: "Телефон",                           example: "+7 926 623 15 45" },
      { name: "productBlock", description: "Товар или товары — формируется кодом", example: "📦 *Товар:* iPhone 17 Pro" },
      { name: "price",        description: "Сумма к оплате",                    example: "118 800 ₽" },
      { name: "down",         description: "Первый взнос",                      example: "17 500 ₽" },
      { name: "term",         description: "Срок (мес)",                        example: "6" },
      { name: "monthly",      description: "Ежемесячный платёж",                example: "10 100 ₽" },
      { name: "time",         description: "Дата и время",                      example: "23\\.05\\.2026 14:32" },
    ],
    defaultText: [
      "🛍 *Новая заявка на рассрочку*",
      "",
      "👤 *Имя:* {name}",
      "📞 *Телефон:* {phone}",
      "{productBlock}",
      "💰 *Сумма:* {price}",
      "💳 *Первый взнос:* {down}",
      "📅 *Срок:* {term} мес → {monthly}/мес",
      "",
      "⏱ {time} МСК",
    ].join("\n"),
  },
];

/* ── Поиск + Redis-хранение ───────────────────────────────────── */

export function getTemplateDef(key: string): TemplateDef | undefined {
  return TEMPLATES.find(t => t.key === key);
}

const REDIS_KEY = (key: string) => `msg_template:${key}`;

/** Возвращает текущий текст шаблона: либо из Redis, либо дефолт. */
export async function getTemplateText(key: string): Promise<string> {
  const def = getTemplateDef(key);
  if (!def) throw new Error(`Unknown template: ${key}`);
  try {
    const redis = getRedis();
    const custom = await redis.get<string>(REDIS_KEY(key));
    return (typeof custom === "string" && custom.length > 0) ? custom : def.defaultText;
  } catch {
    return def.defaultText;
  }
}

export async function setTemplateText(key: string, text: string): Promise<void> {
  if (!getTemplateDef(key)) throw new Error(`Unknown template: ${key}`);
  const redis = getRedis();
  await redis.set(REDIS_KEY(key), text);
}

export async function resetTemplate(key: string): Promise<void> {
  if (!getTemplateDef(key)) throw new Error(`Unknown template: ${key}`);
  const redis = getRedis();
  await redis.del(REDIS_KEY(key));
}

/** Подставляет переменные {name} → vars[name]. Неизвестные оставляет как есть. */
export function fillTemplate(
  text: string,
  vars: Record<string, string | number | undefined | null>,
): string {
  return text.replace(/\{(\w+)\}/g, (m, name) => {
    const v = vars[name];
    return v !== undefined && v !== null ? String(v) : m;
  });
}

/** Главный helper: рендерит сообщение по ключу шаблона + переменным. */
export async function renderMessage(
  key: string,
  vars: Record<string, string | number | undefined | null> = {},
): Promise<{ text: string; parseMode: ParseMode }> {
  const def = getTemplateDef(key);
  if (!def) throw new Error(`Unknown template: ${key}`);
  const text = await getTemplateText(key);
  return { text: fillTemplate(text, vars), parseMode: def.parseMode };
}
