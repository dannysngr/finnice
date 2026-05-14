/* ================================================================
   data.ts — единственный источник истины для всех текстов и данных
   Грозный / Чеченская Республика / ФинНайс
   ================================================================ */

// ─── Company ──────────────────────────────────────────────────
export const COMPANY = {
  name:        "ФинНайс",
  legalName:   "ФинНайс",
  slogan:      "Без риба. Без скрытых платежей. Без пени и штрафов.",
  phone:       "+7 (928) 491-08-08",
  phoneTel:    "tel:+79284910808",
  whatsapp:    "https://wa.me/79284910808",
  telegram:    "https://t.me/+79284910808",
  email:       "info@finnice.ru",
  address:     "г. Грозный, ул. Орзамиева, 8",
  hours:       "Пн – Пт, 9:00–19:00",
  region:      "Чеченская Республика",
  city:        "Грозный",
  quranBadge:  "2:275",
} as const;

// ─── Representative (founder / face) ─────────────────────────
export const REP = {
  name:   "Дэнни де Вито",
  title:  "Руководитель ФинНайс",
  quote:  "Мы строим бизнес на честности: фиксированная наценка, никаких штрафов и никакого ростовщичества.",
} as const;

// ─── Nav links ────────────────────────────────────────────────
export const NAV_LINKS = [
  { label: "О нас",    href: "/company/" },
  { label: "Акции",    href: "/aktsii/" },
  { label: "Партнеры", href: "/partners/" },
  { label: "Вакансии", href: "/info/vacancy/" },
  { label: "Контакты", href: "/contacts/" },
] as const;

// ─── Hero slides ──────────────────────────────────────────────
export const HERO_SLIDES = [
  {
    id:       1,
    badge:    "Услуги по нормам Ислама",
    headline: "Медицина, Туризм, Паломничество и другие товары и услуги — теперь доступны каждому в рассрочку по нормам Ислама",
    sub:      "Оформите рассрочку на любые товары и услуги без банка, без процентов и строго по нормам Ислама.",
    cta:      { label: "Подробнее", href: "/uslugi/khadzh-i-umra-v-rassrochku/" },
    icons:    ["🕋", "🏥", "✈️"],
    imgUrl:   "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=640&h=400&fit=crop&auto=format",
    gradient: "from-[#0E2344] to-[#0C7A58]",
  },
  {
    id:       2,
    badge:    "Электроника",
    headline: "Новейшие гаджеты в рассрочку",
    sub:      "Флагманские смартфоны, ноутбуки и планшеты — по честной цене, без переплат.",
    cta:      { label: "Смотреть каталог", href: "/catalog/?cat=telefony" },
    icons:    ["📱", "💻", "⌚"],
    imgUrl:   "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=640&h=400&fit=crop&auto=format",
    gradient: "from-[#0D2D5E] to-[#1A3C6E]",
  },
  {
    id:       3,
    badge:    "Отпуск",
    headline: "Планируете отпуск?",
    sub:      "Рассрочка на туры и путешествия — делаем мечты реальностью без банков и процентов!",
    cta:      { label: "Узнать больше", href: "/uslugi/turisticheskie-uslugi-v-rassrochku/" },
    icons:    ["🏖️", "✈️", "🌴"],
    imgUrl:   "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=640&h=400&fit=crop&auto=format",
    gradient: "from-[#0C7A58] to-[#0E2344]",
  },
  {
    id:       4,
    badge:    "Маркетплейсы",
    headline: "Покупайте на маркетплейсах — платите частями",
    sub:      "Wildberries, Ozon и другие — любые товары в рассрочку без банка. Оформление за 15 минут.",
    cta:      { label: "Как это работает", href: "/wb/" },
    icons:    ["🛍️", "📦", "🏷️"],
    imgUrl:   "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=640&h=400&fit=crop&auto=format",
    gradient: "from-[#1A3C6E] to-[#0C7A58]",
  },
  {
    id:       5,
    badge:    "Медицина",
    headline: "Здоровье — это главное",
    sub:      "Серьёзные медицинские услуги в рассрочку — лечение, диагностика и реабилитация без переплат.",
    cta:      { label: "Подробнее", href: "/uslugi/meditsina/" },
    icons:    ["❤️‍🩹", "🏥", "💊"],
    imgUrl:   "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=640&h=400&fit=crop&auto=format",
    gradient: "from-[#0C7A58] to-[#C8972B]",
  },
] as const;

// ─── Phones catalog ───────────────────────────────────────────

export type SimType = "SIM + eSIM" | "2 SIM" | "1 SIM" | "eSIM";

export interface PhoneItem {
  id:      string;
  brand:   string;         // "Apple" | "Samsung" | ...
  model:   string;         // "iPhone 16 Pro Max"
  memory:  string;         // "256 ГБ"
  colors:  string[];
  sim:     SimType;
  price:   number;
  badge?:  string;
  /** Массив URL'ов всех цветовых вариантов товара (1+ штук).
   *  Скачиваются скриптом scripts/fetch-biggeek-images.sh,
   *  кол-во для каждого товара — в public/images/phones/manifest.json */
  img:     string[];
  /** true ⇔ цена синхронизирована с партнёрским TG-каналом */
  tgSynced?: boolean;
}

// Манифест содержит { "iphone-17-pro-max": 3, ... } — сколько цветов скачано
import phonesManifest from "@/public/images/phones/manifest.json";
import { BIGGEEK_PRODUCTS } from "./biggeek-products";
import { TG_PRICES } from "./tg-prices";
const MANIFEST: Record<string, number> = phonesManifest as Record<string, number>;

/** Возвращает массив URL картинок товара (по числу скачанных цветов).
 *  Если в манифесте нет записи — fallback на старое имя без суффикса. */
const A = (filename: string): string[] => {
  const count = MANIFEST[filename] ?? 0;
  if (count <= 0) return [`/images/phones/${filename}.jpg`];
  return Array.from({ length: count }, (_, i) => `/images/phones/${filename}-${i + 1}.jpg`);
};

const RAW_PHONES_CATALOG: PhoneItem[] = [

  /* ══ iPhone 17 Pro Max ═══════════════════════════════════════════ */
  { id: "ip17promax-256-sim",  brand: "Apple", model: "iPhone 17 Pro Max", memory: "256 ГБ", sim: "SIM + eSIM", price: 114500, badge: "Новинка",
    colors: ["Cosmic Orange (Космический оранжевый)", "Deep Blue (Глубокий синий)", "Silver (Серебристый)"], img: A("iphone-17-pro-max") },
  { id: "ip17promax-512-sim",  brand: "Apple", model: "iPhone 17 Pro Max", memory: "512 ГБ", sim: "SIM + eSIM", price: 132000,
    colors: ["Cosmic Orange (Космический оранжевый)", "Deep Blue (Глубокий синий)", "Silver (Серебристый)"], img: A("iphone-17-pro-max") },
  { id: "ip17promax-1tb-sim",  brand: "Apple", model: "iPhone 17 Pro Max", memory: "1 ТБ",  sim: "SIM + eSIM", price: 149000,
    colors: ["Cosmic Orange (Космический оранжевый)", "Deep Blue (Глубокий синий)", "Silver (Серебристый)"], img: A("iphone-17-pro-max") },
  { id: "ip17promax-2tb-sim",  brand: "Apple", model: "iPhone 17 Pro Max", memory: "2 ТБ",  sim: "SIM + eSIM", price: 175000,
    colors: ["Cosmic Orange (Космический оранжевый)", "Deep Blue (Глубокий синий)", "Silver (Серебристый)"], img: A("iphone-17-pro-max") },
  { id: "ip17promax-256-esim", brand: "Apple", model: "iPhone 17 Pro Max", memory: "256 ГБ", sim: "eSIM",       price: 108000,
    colors: ["Cosmic Orange (Космический оранжевый)", "Deep Blue (Глубокий синий)", "Silver (Серебристый)"], img: A("iphone-17-pro-max") },
  { id: "ip17promax-512-esim", brand: "Apple", model: "iPhone 17 Pro Max", memory: "512 ГБ", sim: "eSIM",       price: 124000,
    colors: ["Cosmic Orange (Космический оранжевый)", "Deep Blue (Глубокий синий)", "Silver (Серебристый)"], img: A("iphone-17-pro-max") },
  { id: "ip17promax-1tb-esim", brand: "Apple", model: "iPhone 17 Pro Max", memory: "1 ТБ",  sim: "eSIM",       price: 143000,
    colors: ["Cosmic Orange (Космический оранжевый)", "Deep Blue (Глубокий синий)", "Silver (Серебристый)"], img: A("iphone-17-pro-max") },
  { id: "ip17promax-2tb-esim", brand: "Apple", model: "iPhone 17 Pro Max", memory: "2 ТБ",  sim: "eSIM",       price: 168000,
    colors: ["Cosmic Orange (Космический оранжевый)", "Deep Blue (Глубокий синий)", "Silver (Серебристый)"], img: A("iphone-17-pro-max") },

  /* ══ iPhone 17 Pro ════════════════════════════════════════════════ */
  { id: "ip17pro-256-sim",  brand: "Apple", model: "iPhone 17 Pro", memory: "256 ГБ", sim: "SIM + eSIM", price: 104500, badge: "Новинка",
    colors: ["Cosmic Orange (Космический оранжевый)", "Deep Blue (Глубокий синий)", "Silver (Серебристый)"], img: A("iphone-17-pro") },
  { id: "ip17pro-512-sim",  brand: "Apple", model: "iPhone 17 Pro", memory: "512 ГБ", sim: "SIM + eSIM", price: 123000,
    colors: ["Cosmic Orange (Космический оранжевый)", "Deep Blue (Глубокий синий)", "Silver (Серебристый)"], img: A("iphone-17-pro") },
  { id: "ip17pro-1tb-sim",  brand: "Apple", model: "iPhone 17 Pro", memory: "1 ТБ",  sim: "SIM + eSIM", price: 140000,
    colors: ["Cosmic Orange (Космический оранжевый)", "Deep Blue (Глубокий синий)", "Silver (Серебристый)"], img: A("iphone-17-pro") },
  { id: "ip17pro-256-esim", brand: "Apple", model: "iPhone 17 Pro", memory: "256 ГБ", sim: "eSIM",       price: 98000,
    colors: ["Cosmic Orange (Космический оранжевый)", "Deep Blue (Глубокий синий)", "Silver (Серебристый)"], img: A("iphone-17-pro") },
  { id: "ip17pro-512-esim", brand: "Apple", model: "iPhone 17 Pro", memory: "512 ГБ", sim: "eSIM",       price: 114500,
    colors: ["Cosmic Orange (Космический оранжевый)", "Deep Blue (Глубокий синий)", "Silver (Серебристый)"], img: A("iphone-17-pro") },
  { id: "ip17pro-1tb-esim", brand: "Apple", model: "iPhone 17 Pro", memory: "1 ТБ",  sim: "eSIM",       price: 132000,
    colors: ["Cosmic Orange (Космический оранжевый)", "Deep Blue (Глубокий синий)", "Silver (Серебристый)"], img: A("iphone-17-pro") },

  /* ══ iPhone Air ═══════════════════════════════════════════════════ */
  { id: "ip17air-256-esim", brand: "Apple", model: "iPhone Air", memory: "256 ГБ", sim: "eSIM", price: 72000, badge: "Новинка",
    colors: ["Sky Blue (Небесно-голубой)", "Light Gold (Светлое золото)", "Cloud White (Облачный белый)", "Space Black (Космический черный)"], img: A("iphone-air") },
  { id: "ip17air-512-esim", brand: "Apple", model: "iPhone Air", memory: "512 ГБ", sim: "eSIM", price: 87000,
    colors: ["Sky Blue (Небесно-голубой)", "Light Gold (Светлое золото)", "Cloud White (Облачный белый)", "Space Black (Космический черный)"], img: A("iphone-air") },
  { id: "ip17air-1tb-esim",  brand: "Apple", model: "iPhone Air", memory: "1 ТБ",  sim: "eSIM", price: 103000,
    colors: ["Sky Blue (Небесно-голубой)", "Light Gold (Светлое золото)", "Cloud White (Облачный белый)", "Space Black (Космический черный)"], img: A("iphone-air") },

  /* ══ iPhone 17 ════════════════════════════════════════════════════ */
  { id: "ip17-128-sim",  brand: "Apple", model: "iPhone 17", memory: "128 ГБ", sim: "SIM + eSIM", price: 55000, badge: "Хит",
    colors: ["Lavender (Лавандовый)", "Sage (Шалфей)", "Mist Blue (Дымчатый синий)", "White (Белый)", "Black (Черный)"], img: A("iphone-17") },
  { id: "ip17-256-sim",  brand: "Apple", model: "iPhone 17", memory: "256 ГБ", sim: "SIM + eSIM", price: 65000,
    colors: ["Lavender (Лавандовый)", "Sage (Шалфей)", "Mist Blue (Дымчатый синий)", "White (Белый)", "Black (Черный)"], img: A("iphone-17") },
  { id: "ip17-512-sim",  brand: "Apple", model: "iPhone 17", memory: "512 ГБ", sim: "SIM + eSIM", price: 79000,
    colors: ["Lavender (Лавандовый)", "Sage (Шалфей)", "Mist Blue (Дымчатый синий)", "White (Белый)", "Black (Черный)"], img: A("iphone-17") },
  { id: "ip17-128-esim", brand: "Apple", model: "iPhone 17", memory: "128 ГБ", sim: "eSIM",       price: 50000,
    colors: ["Lavender (Лавандовый)", "Sage (Шалфей)", "Mist Blue (Дымчатый синий)", "White (Белый)", "Black (Черный)"], img: A("iphone-17") },
  { id: "ip17-256-esim", brand: "Apple", model: "iPhone 17", memory: "256 ГБ", sim: "eSIM",       price: 60000,
    colors: ["Lavender (Лавандовый)", "Sage (Шалфей)", "Mist Blue (Дымчатый синий)", "White (Белый)", "Black (Черный)"], img: A("iphone-17") },
  { id: "ip17-512-esim", brand: "Apple", model: "iPhone 17", memory: "512 ГБ", sim: "eSIM",       price: 73000,
    colors: ["Lavender (Лавандовый)", "Sage (Шалфей)", "Mist Blue (Дымчатый синий)", "White (Белый)", "Black (Черный)"], img: A("iphone-17") },

  /* ══ iPhone 16 Pro Max ════════════════════════════════════════════ */
  { id: "ip16promax-256-sim", brand: "Apple", model: "iPhone 16 Pro Max", memory: "256 ГБ", sim: "SIM + eSIM", price: 104000, badge: "Хит",
    colors: ["Desert Titanium (Пустынный титан)", "Natural Titanium (Натуральный титан)", "White Titanium (Белый титан)", "Black Titanium (Черный титан)"], img: A("iphone-16-pro-max") },
  { id: "ip16promax-512-sim", brand: "Apple", model: "iPhone 16 Pro Max", memory: "512 ГБ", sim: "SIM + eSIM", price: 122000,
    colors: ["Desert Titanium (Пустынный титан)", "Natural Titanium (Натуральный титан)", "White Titanium (Белый титан)", "Black Titanium (Черный титан)"], img: A("iphone-16-pro-max") },
  { id: "ip16promax-1tb-sim",  brand: "Apple", model: "iPhone 16 Pro Max", memory: "1 ТБ",  sim: "SIM + eSIM", price: 140000,
    colors: ["Desert Titanium (Пустынный титан)", "Natural Titanium (Натуральный титан)", "White Titanium (Белый титан)", "Black Titanium (Черный титан)"], img: A("iphone-16-pro-max") },

  /* ══ iPhone 16 Pro ════════════════════════════════════════════════ */
  { id: "ip16pro-128-sim", brand: "Apple", model: "iPhone 16 Pro", memory: "128 ГБ", sim: "SIM + eSIM", price: 80000, badge: "Хит",
    colors: ["Desert Titanium (Пустынный титан)", "Natural Titanium (Натуральный титан)", "White Titanium (Белый титан)", "Black Titanium (Черный титан)"], img: A("iphone-16-pro") },
  { id: "ip16pro-256-sim", brand: "Apple", model: "iPhone 16 Pro", memory: "256 ГБ", sim: "SIM + eSIM", price: 92000,
    colors: ["Desert Titanium (Пустынный титан)", "Natural Titanium (Натуральный титан)", "White Titanium (Белый титан)", "Black Titanium (Черный титан)"], img: A("iphone-16-pro") },
  { id: "ip16pro-512-sim", brand: "Apple", model: "iPhone 16 Pro", memory: "512 ГБ", sim: "SIM + eSIM", price: 108000,
    colors: ["Desert Titanium (Пустынный титан)", "Natural Titanium (Натуральный титан)", "White Titanium (Белый титан)", "Black Titanium (Черный титан)"], img: A("iphone-16-pro") },
  { id: "ip16pro-1tb-sim",  brand: "Apple", model: "iPhone 16 Pro", memory: "1 ТБ",  sim: "SIM + eSIM", price: 125000,
    colors: ["Desert Titanium (Пустынный титан)", "Natural Titanium (Натуральный титан)", "White Titanium (Белый титан)", "Black Titanium (Черный титан)"], img: A("iphone-16-pro") },

  /* ══ iPhone 16 Plus ═══════════════════════════════════════════════ */
  { id: "ip16plus-128-sim", brand: "Apple", model: "iPhone 16 Plus", memory: "128 ГБ", sim: "SIM + eSIM", price: 62000,
    colors: ["Ultramarine (Ультрамарин)", "Teal (Бирюзовый)", "Pink (Розовый)", "White (Белый)", "Black (Черный)"], img: A("iphone-16-plus") },
  { id: "ip16plus-256-sim", brand: "Apple", model: "iPhone 16 Plus", memory: "256 ГБ", sim: "SIM + eSIM", price: 72000,
    colors: ["Ultramarine (Ультрамарин)", "Teal (Бирюзовый)", "Pink (Розовый)", "White (Белый)", "Black (Черный)"], img: A("iphone-16-plus") },
  { id: "ip16plus-512-sim", brand: "Apple", model: "iPhone 16 Plus", memory: "512 ГБ", sim: "SIM + eSIM", price: 86000,
    colors: ["Ultramarine (Ультрамарин)", "Teal (Бирюзовый)", "Pink (Розовый)", "White (Белый)", "Black (Черный)"], img: A("iphone-16-plus") },

  /* ══ iPhone 16 ════════════════════════════════════════════════════ */
  { id: "ip16-128-sim", brand: "Apple", model: "iPhone 16", memory: "128 ГБ", sim: "SIM + eSIM", price: 55500, badge: "Хит",
    colors: ["Ultramarine (Ультрамарин)", "Teal (Бирюзовый)", "Pink (Розовый)", "White (Белый)", "Black (Черный)"], img: A("iphone-16") },
  { id: "ip16-256-sim", brand: "Apple", model: "iPhone 16", memory: "256 ГБ", sim: "SIM + eSIM", price: 62900,
    colors: ["Ultramarine (Ультрамарин)", "Teal (Бирюзовый)", "Pink (Розовый)", "White (Белый)", "Black (Черный)"], img: A("iphone-16") },
  { id: "ip16-512-sim", brand: "Apple", model: "iPhone 16", memory: "512 ГБ", sim: "SIM + eSIM", price: 76000,
    colors: ["Ultramarine (Ультрамарин)", "Teal (Бирюзовый)", "Pink (Розовый)", "White (Белый)", "Black (Черный)"], img: A("iphone-16") },

  /* ══ iPhone 15 Pro Max ════════════════════════════════════════════ */
  { id: "ip15promax-256-sim", brand: "Apple", model: "iPhone 15 Pro Max", memory: "256 ГБ", sim: "SIM + eSIM", price: 88000,
    colors: ["Natural Titanium (Натуральный титан)", "Blue Titanium (Синий титан)", "White Titanium (Белый титан)", "Black Titanium (Черный титан)"], img: A("iphone-15-pro-max") },
  { id: "ip15promax-512-sim", brand: "Apple", model: "iPhone 15 Pro Max", memory: "512 ГБ", sim: "SIM + eSIM", price: 104000,
    colors: ["Natural Titanium (Натуральный титан)", "Blue Titanium (Синий титан)", "White Titanium (Белый титан)", "Black Titanium (Черный титан)"], img: A("iphone-15-pro-max") },
  { id: "ip15promax-1tb-sim",  brand: "Apple", model: "iPhone 15 Pro Max", memory: "1 ТБ",  sim: "SIM + eSIM", price: 120000,
    colors: ["Natural Titanium (Натуральный титан)", "Blue Titanium (Синий титан)", "White Titanium (Белый титан)", "Black Titanium (Черный титан)"], img: A("iphone-15-pro-max") },

  /* ══ iPhone 15 Pro ════════════════════════════════════════════════ */
  { id: "ip15pro-128-sim", brand: "Apple", model: "iPhone 15 Pro", memory: "128 ГБ", sim: "SIM + eSIM", price: 68000,
    colors: ["Natural Titanium (Натуральный титан)", "Blue Titanium (Синий титан)", "White Titanium (Белый титан)", "Black Titanium (Черный титан)"], img: A("iphone-15-pro") },
  { id: "ip15pro-256-sim", brand: "Apple", model: "iPhone 15 Pro", memory: "256 ГБ", sim: "SIM + eSIM", price: 78000,
    colors: ["Natural Titanium (Натуральный титан)", "Blue Titanium (Синий титан)", "White Titanium (Белый титан)", "Black Titanium (Черный титан)"], img: A("iphone-15-pro") },
  { id: "ip15pro-512-sim", brand: "Apple", model: "iPhone 15 Pro", memory: "512 ГБ", sim: "SIM + eSIM", price: 94000,
    colors: ["Natural Titanium (Натуральный титан)", "Blue Titanium (Синий титан)", "White Titanium (Белый титан)", "Black Titanium (Черный титан)"], img: A("iphone-15-pro") },
  { id: "ip15pro-1tb-sim",  brand: "Apple", model: "iPhone 15 Pro", memory: "1 ТБ",  sim: "SIM + eSIM", price: 110000,
    colors: ["Natural Titanium (Натуральный титан)", "Blue Titanium (Синий титан)", "White Titanium (Белый титан)", "Black Titanium (Черный титан)"], img: A("iphone-15-pro") },

  /* ══ iPhone 15 Plus ═══════════════════════════════════════════════ */
  { id: "ip15plus-128-sim", brand: "Apple", model: "iPhone 15 Plus", memory: "128 ГБ", sim: "SIM + eSIM", price: 54000,
    colors: ["Pink (Розовый)", "Yellow (Желтый)", "Green (Зеленый)", "Blue (Синий)", "Black (Черный)"], img: A("iphone-15-plus") },
  { id: "ip15plus-256-sim", brand: "Apple", model: "iPhone 15 Plus", memory: "256 ГБ", sim: "SIM + eSIM", price: 62000,
    colors: ["Pink (Розовый)", "Yellow (Желтый)", "Green (Зеленый)", "Blue (Синий)", "Black (Черный)"], img: A("iphone-15-plus") },
  { id: "ip15plus-512-sim", brand: "Apple", model: "iPhone 15 Plus", memory: "512 ГБ", sim: "SIM + eSIM", price: 76000,
    colors: ["Pink (Розовый)", "Yellow (Желтый)", "Green (Зеленый)", "Blue (Синий)", "Black (Черный)"], img: A("iphone-15-plus") },

  /* ══ iPhone 15 ════════════════════════════════════════════════════ */
  { id: "ip15-128-sim", brand: "Apple", model: "iPhone 15", memory: "128 ГБ", sim: "SIM + eSIM", price: 47500,
    colors: ["Pink (Розовый)", "Yellow (Желтый)", "Green (Зеленый)", "Blue (Синий)", "Black (Черный)"], img: A("iphone-15") },
  { id: "ip15-256-sim", brand: "Apple", model: "iPhone 15", memory: "256 ГБ", sim: "SIM + eSIM", price: 54500,
    colors: ["Pink (Розовый)", "Yellow (Желтый)", "Green (Зеленый)", "Blue (Синий)", "Black (Черный)"], img: A("iphone-15") },
  { id: "ip15-512-sim", brand: "Apple", model: "iPhone 15", memory: "512 ГБ", sim: "SIM + eSIM", price: 68000,
    colors: ["Pink (Розовый)", "Yellow (Желтый)", "Green (Зеленый)", "Blue (Синий)", "Black (Черный)"], img: A("iphone-15") },

  /* ══ iPhone 14 Pro Max ════════════════════════════════════════════ */
  { id: "ip14promax-128-sim", brand: "Apple", model: "iPhone 14 Pro Max", memory: "128 ГБ", sim: "SIM + eSIM", price: 70000,
    colors: ["Space Black (Космический черный)", "Silver (Серебристый)", "Gold (Золотистый)", "Deep Purple (Темно-фиолетовый)"], img: A("iphone-14-pro-max") },
  { id: "ip14promax-256-sim", brand: "Apple", model: "iPhone 14 Pro Max", memory: "256 ГБ", sim: "SIM + eSIM", price: 80000,
    colors: ["Space Black (Космический черный)", "Silver (Серебристый)", "Gold (Золотистый)", "Deep Purple (Темно-фиолетовый)"], img: A("iphone-14-pro-max") },
  { id: "ip14promax-512-sim", brand: "Apple", model: "iPhone 14 Pro Max", memory: "512 ГБ", sim: "SIM + eSIM", price: 94000,
    colors: ["Space Black (Космический черный)", "Silver (Серебристый)", "Gold (Золотистый)", "Deep Purple (Темно-фиолетовый)"], img: A("iphone-14-pro-max") },
  { id: "ip14promax-1tb-sim",  brand: "Apple", model: "iPhone 14 Pro Max", memory: "1 ТБ",  sim: "SIM + eSIM", price: 108000,
    colors: ["Space Black (Космический черный)", "Silver (Серебристый)", "Gold (Золотистый)", "Deep Purple (Темно-фиолетовый)"], img: A("iphone-14-pro-max") },

  /* ══ iPhone 14 Pro ════════════════════════════════════════════════ */
  { id: "ip14pro-128-sim", brand: "Apple", model: "iPhone 14 Pro", memory: "128 ГБ", sim: "SIM + eSIM", price: 60000,
    colors: ["Space Black (Космический черный)", "Silver (Серебристый)", "Gold (Золотистый)", "Deep Purple (Темно-фиолетовый)"], img: A("iphone-14-pro") },
  { id: "ip14pro-256-sim", brand: "Apple", model: "iPhone 14 Pro", memory: "256 ГБ", sim: "SIM + eSIM", price: 70000,
    colors: ["Space Black (Космический черный)", "Silver (Серебристый)", "Gold (Золотистый)", "Deep Purple (Темно-фиолетовый)"], img: A("iphone-14-pro") },
  { id: "ip14pro-512-sim", brand: "Apple", model: "iPhone 14 Pro", memory: "512 ГБ", sim: "SIM + eSIM", price: 84000,
    colors: ["Space Black (Космический черный)", "Silver (Серебристый)", "Gold (Золотистый)", "Deep Purple (Темно-фиолетовый)"], img: A("iphone-14-pro") },
  { id: "ip14pro-1tb-sim",  brand: "Apple", model: "iPhone 14 Pro", memory: "1 ТБ",  sim: "SIM + eSIM", price: 98000,
    colors: ["Space Black (Космический черный)", "Silver (Серебристый)", "Gold (Золотистый)", "Deep Purple (Темно-фиолетовый)"], img: A("iphone-14-pro") },

  /* ══ iPhone 14 Plus ═══════════════════════════════════════════════ */
  { id: "ip14plus-128-sim", brand: "Apple", model: "iPhone 14 Plus", memory: "128 ГБ", sim: "SIM + eSIM", price: 48000,
    colors: ["Midnight (Темная ночь)", "Starlight (Сияющая звезда)", "(PRODUCT)RED (Красный)", "Blue (Синий)", "Purple (Фиолетовый)", "Yellow (Желтый)"], img: A("iphone-14-plus") },
  { id: "ip14plus-256-sim", brand: "Apple", model: "iPhone 14 Plus", memory: "256 ГБ", sim: "SIM + eSIM", price: 56000,
    colors: ["Midnight (Темная ночь)", "Starlight (Сияющая звезда)", "(PRODUCT)RED (Красный)", "Blue (Синий)", "Purple (Фиолетовый)", "Yellow (Желтый)"], img: A("iphone-14-plus") },
  { id: "ip14plus-512-sim", brand: "Apple", model: "iPhone 14 Plus", memory: "512 ГБ", sim: "SIM + eSIM", price: 68000,
    colors: ["Midnight (Темная ночь)", "Starlight (Сияющая звезда)", "(PRODUCT)RED (Красный)", "Blue (Синий)", "Purple (Фиолетовый)", "Yellow (Желтый)"], img: A("iphone-14-plus") },

  /* ══ iPhone 14 ════════════════════════════════════════════════════ */
  { id: "ip14-128-sim", brand: "Apple", model: "iPhone 14", memory: "128 ГБ", sim: "SIM + eSIM", price: 42000,
    colors: ["Midnight (Темная ночь)", "Starlight (Сияющая звезда)", "(PRODUCT)RED (Красный)", "Blue (Синий)", "Purple (Фиолетовый)", "Yellow (Желтый)"], img: A("iphone-14") },
  { id: "ip14-256-sim", brand: "Apple", model: "iPhone 14", memory: "256 ГБ", sim: "SIM + eSIM", price: 46900,
    colors: ["Midnight (Темная ночь)", "Starlight (Сияющая звезда)", "(PRODUCT)RED (Красный)", "Blue (Синий)", "Purple (Фиолетовый)", "Yellow (Желтый)"], img: A("iphone-14") },
  { id: "ip14-512-sim", brand: "Apple", model: "iPhone 14", memory: "512 ГБ", sim: "SIM + eSIM", price: 56000,
    colors: ["Midnight (Темная ночь)", "Starlight (Сияющая звезда)", "(PRODUCT)RED (Красный)", "Blue (Синий)", "Purple (Фиолетовый)", "Yellow (Желтый)"], img: A("iphone-14") },

  /* ══ iPhone 13 Pro Max ════════════════════════════════════════════ */
  { id: "ip13promax-128-2sim", brand: "Apple", model: "iPhone 13 Pro Max", memory: "128 ГБ", sim: "2 SIM", price: 43500,
    colors: ["Graphite (Графитовый)", "Gold (Золотистый)", "Silver (Серебристый)", "Sierra Blue (Небесно-голубой)", "Alpine Green (Альпийский зеленый)"], img: A("iphone-13-pro-max") },
  { id: "ip13promax-256-2sim", brand: "Apple", model: "iPhone 13 Pro Max", memory: "256 ГБ", sim: "2 SIM", price: 47500,
    colors: ["Graphite (Графитовый)", "Gold (Золотистый)", "Silver (Серебристый)", "Sierra Blue (Небесно-голубой)", "Alpine Green (Альпийский зеленый)"], img: A("iphone-13-pro-max") },
  { id: "ip13promax-512-2sim", brand: "Apple", model: "iPhone 13 Pro Max", memory: "512 ГБ", sim: "2 SIM", price: 55000,
    colors: ["Graphite (Графитовый)", "Gold (Золотистый)", "Silver (Серебристый)", "Sierra Blue (Небесно-голубой)", "Alpine Green (Альпийский зеленый)"], img: A("iphone-13-pro-max") },
  { id: "ip13promax-1tb-2sim",  brand: "Apple", model: "iPhone 13 Pro Max", memory: "1 ТБ",  sim: "2 SIM", price: 65000,
    colors: ["Graphite (Графитовый)", "Gold (Золотистый)", "Silver (Серебристый)", "Sierra Blue (Небесно-голубой)", "Alpine Green (Альпийский зеленый)"], img: A("iphone-13-pro-max") },

  /* ══ iPhone 13 Pro ════════════════════════════════════════════════ */
  { id: "ip13pro-128-2sim", brand: "Apple", model: "iPhone 13 Pro", memory: "128 ГБ", sim: "2 SIM", price: 41000,
    colors: ["Graphite (Графитовый)", "Gold (Золотистый)", "Silver (Серебристый)", "Sierra Blue (Небесно-голубой)", "Alpine Green (Альпийский зеленый)"], img: A("iphone-13-pro") },
  { id: "ip13pro-256-2sim", brand: "Apple", model: "iPhone 13 Pro", memory: "256 ГБ", sim: "2 SIM", price: 44500,
    colors: ["Graphite (Графитовый)", "Gold (Золотистый)", "Silver (Серебристый)", "Sierra Blue (Небесно-голубой)", "Alpine Green (Альпийский зеленый)"], img: A("iphone-13-pro") },
  { id: "ip13pro-512-2sim", brand: "Apple", model: "iPhone 13 Pro", memory: "512 ГБ", sim: "2 SIM", price: 52000,
    colors: ["Graphite (Графитовый)", "Gold (Золотистый)", "Silver (Серебристый)", "Sierra Blue (Небесно-голубой)", "Alpine Green (Альпийский зеленый)"], img: A("iphone-13-pro") },
  { id: "ip13pro-1tb-2sim",  brand: "Apple", model: "iPhone 13 Pro", memory: "1 ТБ",  sim: "2 SIM", price: 62000,
    colors: ["Graphite (Графитовый)", "Gold (Золотистый)", "Silver (Серебристый)", "Sierra Blue (Небесно-голубой)", "Alpine Green (Альпийский зеленый)"], img: A("iphone-13-pro") },

  /* ══ iPhone 13 ════════════════════════════════════════════════════ */
  { id: "ip13-128-2sim", brand: "Apple", model: "iPhone 13", memory: "128 ГБ", sim: "2 SIM", price: 35500,
    colors: ["Starlight (Сияющая звезда)", "Midnight (Темная ночь)", "Blue (Синий)", "Pink (Розовый)", "(PRODUCT)RED (Красный)", "Green (Зеленый)"], img: A("iphone-13") },
  { id: "ip13-256-2sim", brand: "Apple", model: "iPhone 13", memory: "256 ГБ", sim: "2 SIM", price: 39500,
    colors: ["Starlight (Сияющая звезда)", "Midnight (Темная ночь)", "Blue (Синий)", "Pink (Розовый)", "(PRODUCT)RED (Красный)", "Green (Зеленый)"], img: A("iphone-13") },
  { id: "ip13-512-2sim", brand: "Apple", model: "iPhone 13", memory: "512 ГБ", sim: "2 SIM", price: 46000,
    colors: ["Starlight (Сияющая звезда)", "Midnight (Темная ночь)", "Blue (Синий)", "Pink (Розовый)", "(PRODUCT)RED (Красный)", "Green (Зеленый)"], img: A("iphone-13") },

  /* ══ iPhone 12 Pro Max ════════════════════════════════════════════ */
  { id: "ip12promax-128-2sim", brand: "Apple", model: "iPhone 12 Pro Max", memory: "128 ГБ", sim: "2 SIM", price: 35000,
    colors: ["Graphite (Графитовый)", "Silver (Серебристый)", "Gold (Золотистый)", "Pacific Blue (Тихоокеанский синий)"], img: A("iphone-12-pro-max") },
  { id: "ip12promax-256-2sim", brand: "Apple", model: "iPhone 12 Pro Max", memory: "256 ГБ", sim: "2 SIM", price: 38500,
    colors: ["Graphite (Графитовый)", "Silver (Серебристый)", "Gold (Золотистый)", "Pacific Blue (Тихоокеанский синий)"], img: A("iphone-12-pro-max") },
  { id: "ip12promax-512-2sim", brand: "Apple", model: "iPhone 12 Pro Max", memory: "512 ГБ", sim: "2 SIM", price: 46000,
    colors: ["Graphite (Графитовый)", "Silver (Серебристый)", "Gold (Золотистый)", "Pacific Blue (Тихоокеанский синий)"], img: A("iphone-12-pro-max") },

  /* ══ iPhone 12 Pro ════════════════════════════════════════════════ */
  { id: "ip12pro-128-2sim", brand: "Apple", model: "iPhone 12 Pro", memory: "128 ГБ", sim: "2 SIM", price: 33000,
    colors: ["Graphite (Графитовый)", "Silver (Серебристый)", "Gold (Золотистый)", "Pacific Blue (Тихоокеанский синий)"], img: A("iphone-12-pro") },
  { id: "ip12pro-256-2sim", brand: "Apple", model: "iPhone 12 Pro", memory: "256 ГБ", sim: "2 SIM", price: 36500,
    colors: ["Graphite (Графитовый)", "Silver (Серебристый)", "Gold (Золотистый)", "Pacific Blue (Тихоокеанский синий)"], img: A("iphone-12-pro") },
  { id: "ip12pro-512-2sim", brand: "Apple", model: "iPhone 12 Pro", memory: "512 ГБ", sim: "2 SIM", price: 44000,
    colors: ["Graphite (Графитовый)", "Silver (Серебристый)", "Gold (Золотистый)", "Pacific Blue (Тихоокеанский синий)"], img: A("iphone-12-pro") },

  /* ══ iPhone 12 ════════════════════════════════════════════════════ */
  { id: "ip12-64-2sim",  brand: "Apple", model: "iPhone 12", memory: "64 ГБ",  sim: "2 SIM", price: 28000,
    colors: ["Black (Черный)", "White (Белый)", "(PRODUCT)RED (Красный)", "Green (Зеленый)", "Blue (Синий)", "Purple (Фиолетовый)"], img: A("iphone-12") },
  { id: "ip12-128-2sim", brand: "Apple", model: "iPhone 12", memory: "128 ГБ", sim: "2 SIM", price: 31500,
    colors: ["Black (Черный)", "White (Белый)", "(PRODUCT)RED (Красный)", "Green (Зеленый)", "Blue (Синий)", "Purple (Фиолетовый)"], img: A("iphone-12") },
  { id: "ip12-256-2sim", brand: "Apple", model: "iPhone 12", memory: "256 ГБ", sim: "2 SIM", price: 36000,
    colors: ["Black (Черный)", "White (Белый)", "(PRODUCT)RED (Красный)", "Green (Зеленый)", "Blue (Синий)", "Purple (Фиолетовый)"], img: A("iphone-12") },

  /* ══ iPhone 11 Pro Max ════════════════════════════════════════════ */
  { id: "ip11promax-64-2sim",  brand: "Apple", model: "iPhone 11 Pro Max", memory: "64 ГБ",  sim: "2 SIM", price: 29500,
    colors: ["Space Gray (Серый космос)", "Midnight Green (Темно-зеленый)", "Silver (Серебристый)", "Gold (Золотистый)"], img: A("iphone-11-pro-max") },
  { id: "ip11promax-256-2sim", brand: "Apple", model: "iPhone 11 Pro Max", memory: "256 ГБ", sim: "2 SIM", price: 33500,
    colors: ["Space Gray (Серый космос)", "Midnight Green (Темно-зеленый)", "Silver (Серебристый)", "Gold (Золотистый)"], img: A("iphone-11-pro-max") },
  { id: "ip11promax-512-2sim", brand: "Apple", model: "iPhone 11 Pro Max", memory: "512 ГБ", sim: "2 SIM", price: 40000,
    colors: ["Space Gray (Серый космос)", "Midnight Green (Темно-зеленый)", "Silver (Серебристый)", "Gold (Золотистый)"], img: A("iphone-11-pro-max") },

  /* ══ iPhone 11 Pro ════════════════════════════════════════════════ */
  { id: "ip11pro-64-2sim",  brand: "Apple", model: "iPhone 11 Pro", memory: "64 ГБ",  sim: "2 SIM", price: 28000,
    colors: ["Space Gray (Серый космос)", "Midnight Green (Темно-зеленый)", "Silver (Серебристый)", "Gold (Золотистый)"], img: A("iphone-11-pro") },
  { id: "ip11pro-256-2sim", brand: "Apple", model: "iPhone 11 Pro", memory: "256 ГБ", sim: "2 SIM", price: 31500,
    colors: ["Space Gray (Серый космос)", "Midnight Green (Темно-зеленый)", "Silver (Серебристый)", "Gold (Золотистый)"], img: A("iphone-11-pro") },
  { id: "ip11pro-512-2sim", brand: "Apple", model: "iPhone 11 Pro", memory: "512 ГБ", sim: "2 SIM", price: 38000,
    colors: ["Space Gray (Серый космос)", "Midnight Green (Темно-зеленый)", "Silver (Серебристый)", "Gold (Золотистый)"], img: A("iphone-11-pro") },

  /* ══ iPhone 11 ════════════════════════════════════════════════════ */
  { id: "ip11-64-2sim",  brand: "Apple", model: "iPhone 11", memory: "64 ГБ",  sim: "2 SIM", price: 24500,
    colors: ["Black (Черный)", "Green (Зеленый)", "Yellow (Желтый)", "Purple (Фиолетовый)", "(PRODUCT)RED (Красный)", "White (Белый)"], img: A("iphone-11") },
  { id: "ip11-128-2sim", brand: "Apple", model: "iPhone 11", memory: "128 ГБ", sim: "2 SIM", price: 27500,
    colors: ["Black (Черный)", "Green (Зеленый)", "Yellow (Желтый)", "Purple (Фиолетовый)", "(PRODUCT)RED (Красный)", "White (Белый)"], img: A("iphone-11") },
  { id: "ip11-256-2sim", brand: "Apple", model: "iPhone 11", memory: "256 ГБ", sim: "2 SIM", price: 31000,
    colors: ["Black (Черный)", "Green (Зеленый)", "Yellow (Желтый)", "Purple (Фиолетовый)", "(PRODUCT)RED (Красный)", "White (Белый)"], img: A("iphone-11") },

  /* ══ Samsung Galaxy S26 series (январь 2026) ════════════════════ */
  {
    id: "s26ultra-256", brand: "Samsung", model: "Galaxy S26 Ultra",
    memory: "256 ГБ", sim: "2 SIM", price: 129990, badge: "Новинка",
    colors: ["Titanium Black (Черный титан)", "Titanium Gray (Серый титан)", "Titanium Silver (Серебристый титан)", "Titanium Blue (Синий титан)"],
    img: A("samsung-s26-ultra"),
  },
  {
    id: "s26ultra-512", brand: "Samsung", model: "Galaxy S26 Ultra",
    memory: "512 ГБ", sim: "2 SIM", price: 144990,
    colors: ["Titanium Black (Черный титан)", "Titanium Gray (Серый титан)", "Titanium Silver (Серебристый титан)", "Titanium Blue (Синий титан)"],
    img: A("samsung-s26-ultra"),
  },
  {
    id: "s26ultra-1tb", brand: "Samsung", model: "Galaxy S26 Ultra",
    memory: "1 ТБ", sim: "2 SIM", price: 159990,
    colors: ["Titanium Black (Черный титан)", "Titanium Gray (Серый титан)", "Titanium Silver (Серебристый титан)", "Titanium Blue (Синий титан)"],
    img: A("samsung-s26-ultra"),
  },
  {
    id: "s26plus-256", brand: "Samsung", model: "Galaxy S26+",
    memory: "256 ГБ", sim: "2 SIM", price: 104990, badge: "Новинка",
    colors: ["Onyx Black (Оникс черный)", "Marble Gray (Мраморный серый)", "Cobalt Violet (Кобальтовый фиолетовый)", "Amber Yellow (Янтарный желтый)"],
    img: A("samsung-s26-plus"),
  },
  {
    id: "s26plus-512", brand: "Samsung", model: "Galaxy S26+",
    memory: "512 ГБ", sim: "2 SIM", price: 119990,
    colors: ["Onyx Black (Оникс черный)", "Marble Gray (Мраморный серый)", "Cobalt Violet (Кобальтовый фиолетовый)", "Amber Yellow (Янтарный желтый)"],
    img: A("samsung-s26-plus"),
  },
  {
    id: "s26-128", brand: "Samsung", model: "Galaxy S26",
    memory: "128 ГБ", sim: "2 SIM", price: 79990, badge: "Хит",
    colors: ["Onyx Black (Оникс черный)", "Marble Gray (Мраморный серый)", "Cobalt Violet (Кобальтовый фиолетовый)", "Amber Yellow (Янтарный желтый)"],
    img: A("samsung-s26"),
  },
  {
    id: "s26-256", brand: "Samsung", model: "Galaxy S26",
    memory: "256 ГБ", sim: "2 SIM", price: 89990,
    colors: ["Onyx Black (Оникс черный)", "Marble Gray (Мраморный серый)", "Cobalt Violet (Кобальтовый фиолетовый)", "Amber Yellow (Янтарный желтый)"],
    img: A("samsung-s26"),
  },
  {
    id: "s26-512", brand: "Samsung", model: "Galaxy S26",
    memory: "512 ГБ", sim: "2 SIM", price: 99990,
    colors: ["Onyx Black (Оникс черный)", "Marble Gray (Мраморный серый)", "Cobalt Violet (Кобальтовый фиолетовый)", "Amber Yellow (Янтарный желтый)"],
    img: A("samsung-s26"),
  },

  /* ══ Samsung Galaxy S25 series (январь 2025) ════════════════════ */
  {
    id: "s25ultra-256", brand: "Samsung", model: "Galaxy S25 Ultra",
    memory: "256 ГБ", sim: "2 SIM", price: 114990, badge: "Хит",
    colors: ["Titanium Black (Черный титан)", "Titanium Blue (Синий титан)", "Titanium Green (Зеленый титан)", "Titanium Silver (Серебристый титан)"],
    img: A("samsung-s25-ultra"),
  },
  {
    id: "s25ultra-512", brand: "Samsung", model: "Galaxy S25 Ultra",
    memory: "512 ГБ", sim: "2 SIM", price: 129990,
    colors: ["Titanium Black (Черный титан)", "Titanium Blue (Синий титан)", "Titanium Green (Зеленый титан)", "Titanium Silver (Серебристый титан)"],
    img: A("samsung-s25-ultra"),
  },
  {
    id: "s25ultra-1tb", brand: "Samsung", model: "Galaxy S25 Ultra",
    memory: "1 ТБ", sim: "2 SIM", price: 144990,
    colors: ["Titanium Black (Черный титан)", "Titanium Blue (Синий титан)", "Titanium Green (Зеленый титан)", "Titanium Silver (Серебристый титан)"],
    img: A("samsung-s25-ultra"),
  },
  {
    id: "s25plus-256", brand: "Samsung", model: "Galaxy S25+",
    memory: "256 ГБ", sim: "2 SIM", price: 94990,
    colors: ["Moonstone Black (Лунный черный)", "Sandstone Orange (Песчаный оранжевый)", "Emerald Green (Изумрудный зеленый)"],
    img: A("samsung-s25-plus"),
  },
  {
    id: "s25plus-512", brand: "Samsung", model: "Galaxy S25+",
    memory: "512 ГБ", sim: "2 SIM", price: 109990,
    colors: ["Moonstone Black (Лунный черный)", "Sandstone Orange (Песчаный оранжевый)", "Emerald Green (Изумрудный зеленый)"],
    img: A("samsung-s25-plus"),
  },
  {
    id: "s25-128", brand: "Samsung", model: "Galaxy S25",
    memory: "128 ГБ", sim: "2 SIM", price: 74990,
    colors: ["Moonstone Black (Лунный черный)", "Sandstone Orange (Песчаный оранжевый)", "Emerald Green (Изумрудный зеленый)"],
    img: A("samsung-s25"),
  },
  {
    id: "s25-256", brand: "Samsung", model: "Galaxy S25",
    memory: "256 ГБ", sim: "2 SIM", price: 84990,
    colors: ["Moonstone Black (Лунный черный)", "Sandstone Orange (Песчаный оранжевый)", "Emerald Green (Изумрудный зеленый)"],
    img: A("samsung-s25"),
  },

  /* ══ Samsung Galaxy Z Fold7 / Flip7 (2026) ══════════════════════ */
  {
    id: "zfold7-256", brand: "Samsung", model: "Galaxy Z Fold7",
    memory: "256 ГБ", sim: "2 SIM", price: 189990, badge: "Новинка",
    colors: ["Phantom Black (Фантомный черный)", "Icy Blue (Ледяной синий)", "Craftsmanship Gray (Ремесленный серый)"],
    img: A("samsung-z-fold7"),
  },
  {
    id: "zfold7-512", brand: "Samsung", model: "Galaxy Z Fold7",
    memory: "512 ГБ", sim: "2 SIM", price: 209990,
    colors: ["Phantom Black (Фантомный черный)", "Icy Blue (Ледяной синий)", "Craftsmanship Gray (Ремесленный серый)"],
    img: A("samsung-z-fold7"),
  },
  {
    id: "zfold7-1tb", brand: "Samsung", model: "Galaxy Z Fold7",
    memory: "1 ТБ", sim: "2 SIM", price: 229990,
    colors: ["Phantom Black (Фантомный черный)", "Icy Blue (Ледяной синий)", "Craftsmanship Gray (Ремесленный серый)"],
    img: A("samsung-z-fold7"),
  },
  {
    id: "zflip7-256", brand: "Samsung", model: "Galaxy Z Flip7",
    memory: "256 ГБ", sim: "2 SIM", price: 99990, badge: "Новинка",
    colors: ["Mint (Мятный)", "Yellow (Желтый)", "Lavender (Лавандовый)", "Blue (Синий)"],
    img: A("samsung-z-flip7"),
  },
  {
    id: "zflip7-512", brand: "Samsung", model: "Galaxy Z Flip7",
    memory: "512 ГБ", sim: "2 SIM", price: 114990,
    colors: ["Mint (Мятный)", "Yellow (Желтый)", "Lavender (Лавандовый)", "Blue (Синий)"],
    img: A("samsung-z-flip7"),
  },

  /* ══ Samsung Galaxy Z Fold6 / Flip6 (2024) ══════════════════════ */
  {
    id: "zfold6-256", brand: "Samsung", model: "Galaxy Z Fold6",
    memory: "256 ГБ", sim: "2 SIM", price: 149990,
    colors: ["Phantom Black (Фантомный черный)", "Icy Blue (Ледяной синий)", "Craftsmanship Gray (Ремесленный серый)"],
    img: A("samsung-z-fold6"),
  },
  {
    id: "zfold6-512", brand: "Samsung", model: "Galaxy Z Fold6",
    memory: "512 ГБ", sim: "2 SIM", price: 169990,
    colors: ["Phantom Black (Фантомный черный)", "Icy Blue (Ледяной синий)", "Craftsmanship Gray (Ремесленный серый)"],
    img: A("samsung-z-fold6"),
  },
  {
    id: "zfold6-1tb", brand: "Samsung", model: "Galaxy Z Fold6",
    memory: "1 ТБ", sim: "2 SIM", price: 189990,
    colors: ["Phantom Black (Фантомный черный)", "Icy Blue (Ледяной синий)", "Craftsmanship Gray (Ремесленный серый)"],
    img: A("samsung-z-fold6"),
  },
  {
    id: "zflip6-256", brand: "Samsung", model: "Galaxy Z Flip6",
    memory: "256 ГБ", sim: "2 SIM", price: 79990, badge: "Хит",
    colors: ["Mint (Мятный)", "Yellow (Желтый)", "Lavender (Лавандовый)", "Blue (Синий)"],
    img: A("samsung-z-flip6"),
  },
  {
    id: "zflip6-512", brand: "Samsung", model: "Galaxy Z Flip6",
    memory: "512 ГБ", sim: "2 SIM", price: 94990,
    colors: ["Mint (Мятный)", "Yellow (Желтый)", "Lavender (Лавандовый)", "Blue (Синий)"],
    img: A("samsung-z-flip6"),
  },

  /* ══ Samsung Galaxy A56 / A36 (2026) ════════════════════════════ */
  {
    id: "a56-128", brand: "Samsung", model: "Galaxy A56",
    memory: "128 ГБ", sim: "2 SIM", price: 44990,
    colors: ["Awesome Iceblue (Потрясающий ледяной синий)", "Awesome Lilac (Потрясающий сиреневый)", "Awesome Lemon (Потрясающий лимонный)", "Awesome Navy (Потрясающий темно-синий)"],
    img: A("samsung-a56"),
  },
  {
    id: "a56-256", brand: "Samsung", model: "Galaxy A56",
    memory: "256 ГБ", sim: "2 SIM", price: 54990,
    colors: ["Awesome Iceblue (Потрясающий ледяной синий)", "Awesome Lilac (Потрясающий сиреневый)", "Awesome Lemon (Потрясающий лимонный)", "Awesome Navy (Потрясающий темно-синий)"],
    img: A("samsung-a56"),
  },
  {
    id: "a36-128", brand: "Samsung", model: "Galaxy A36",
    memory: "128 ГБ", sim: "2 SIM", price: 34990,
    colors: ["Awesome Iceblue (Потрясающий ледяной синий)", "Awesome Lilac (Потрясающий сиреневый)", "Awesome Lemon (Потрясающий лимонный)", "Awesome Navy (Потрясающий темно-синий)"],
    img: A("samsung-a36"),
  },
  {
    id: "a36-256", brand: "Samsung", model: "Galaxy A36",
    memory: "256 ГБ", sim: "2 SIM", price: 44990,
    colors: ["Awesome Iceblue (Потрясающий ледяной синий)", "Awesome Lilac (Потрясающий сиреневый)", "Awesome Lemon (Потрясающий лимонный)", "Awesome Navy (Потрясающий темно-синий)"],
    img: A("samsung-a36"),
  },

  /* ══ Xiaomi ══════════════════════════════════════════════════════ */
  {
    id: "xmi14ultra-256", brand: "Xiaomi", model: "Xiaomi 14 Ultra",
    memory: "256 ГБ", sim: "2 SIM", price: 99990, badge: "Хит",
    colors: ["Black (Черный)", "White (Белый)", "Dragon Blue (Синий дракон)"],
    img: A("xiaomi-14-ultra"),
  },
  {
    id: "xmi14ultra-512", brand: "Xiaomi", model: "Xiaomi 14 Ultra",
    memory: "512 ГБ", sim: "2 SIM", price: 114990,
    colors: ["Black (Черный)", "White (Белый)", "Dragon Blue (Синий дракон)"],
    img: A("xiaomi-14-ultra"),
  },
  {
    id: "xmi14ultra-1tb", brand: "Xiaomi", model: "Xiaomi 14 Ultra",
    memory: "1 ТБ", sim: "2 SIM", price: 134990,
    colors: ["Black (Черный)", "White (Белый)", "Dragon Blue (Синий дракон)"],
    img: A("xiaomi-14-ultra"),
  },
  {
    id: "xmi14-256", brand: "Xiaomi", model: "Xiaomi 14",
    memory: "256 ГБ", sim: "2 SIM", price: 74990, badge: "Хит",
    colors: ["Black (Черный)", "White (Белый)", "Jade Green (Нефритовый зеленый)"],
    img: A("xiaomi-14"),
  },
  {
    id: "xmi14-512", brand: "Xiaomi", model: "Xiaomi 14",
    memory: "512 ГБ", sim: "2 SIM", price: 89990,
    colors: ["Black (Черный)", "White (Белый)", "Jade Green (Нефритовый зеленый)"],
    img: A("xiaomi-14"),
  },

  /* ══ Honor ════════════════════════════════════════════════════════ */
  {
    id: "honor200pro-256", brand: "Honor", model: "Honor 200 Pro",
    memory: "256 ГБ", sim: "2 SIM", price: 59990, badge: "Хит",
    colors: ["Ocean Blue (Океанический синий)", "Moonlight White (Лунный белый)", "Black (Черный)"],
    img: A("honor-200-pro"),
  },
  {
    id: "honor200pro-512", brand: "Honor", model: "Honor 200 Pro",
    memory: "512 ГБ", sim: "2 SIM", price: 69990,
    colors: ["Ocean Blue (Океанический синий)", "Moonlight White (Лунный белый)", "Black (Черный)"],
    img: A("honor-200-pro"),
  },
  {
    id: "honor200-128", brand: "Honor", model: "Honor 200",
    memory: "128 ГБ", sim: "2 SIM", price: 44990,
    colors: ["Coral Pink (Коралловый розовый)", "Moonlight White (Лунный белый)", "Black (Черный)"],
    img: A("honor-200"),
  },
  {
    id: "honor200-256", brand: "Honor", model: "Honor 200",
    memory: "256 ГБ", sim: "2 SIM", price: 54990,
    colors: ["Coral Pink (Коралловый розовый)", "Moonlight White (Лунный белый)", "Black (Черный)"],
    img: A("honor-200"),
  },
  {
    id: "honor200-512", brand: "Honor", model: "Honor 200",
    memory: "512 ГБ", sim: "2 SIM", price: 64990,
    colors: ["Coral Pink (Коралловый розовый)", "Moonlight White (Лунный белый)", "Black (Черный)"],
    img: A("honor-200"),
  },
];

// Применяем TG-цены к телефонам (по id), помечаем tgSynced=true
export const PHONES_CATALOG: PhoneItem[] = RAW_PHONES_CATALOG.map(p =>
  TG_PRICES[p.id] != null
    ? { ...p, price: TG_PRICES[p.id], tgSynced: true }
    : p
);

// Legacy alias — оставлен для обратной совместимости
export const IPHONES = PHONES_CATALOG.filter(p => p.brand === "Apple")
  .map(p => ({ name: `${p.model} ${p.memory}`, price: p.price, monthly: 0 }));

// ─── Partners ─────────────────────────────────────────────────
export const PARTNER_TABS = [
  {
    key:      "smartphones",
    label:    "Смартфоны",
    partners: ["05.ru", "iStore", "Real2", "Импульс", "Community", "Allo", "Телеграф"],
  },
  {
    key:      "appliances",
    label:    "Бытовая техника",
    partners: ["ЛидерТехника", "ТехноМаркет", "Эксперт"],
  },
  {
    key:      "tv",
    label:    "ТВ",
    partners: ["Медиа Плюс", "ТехноМир"],
  },
  {
    key:      "furniture",
    label:    "Мебель",
    partners: ["Сафия мебель", "Lampardi", "Киргу", "Киома"],
  },
] as const;

// ─── Chechen cities & districts ───────────────────────────────
export const CITIES = [
  "Грозный", "Гудермес", "Шали", "Урус-Мартан",
  "Аргун", "Курчалой", "Наурская", "Ачхой-Мартан",
] as const;

export const DISTRICTS = [
  "Грозненский", "Гудермесский", "Шалинский", "Наурский",
  "Надтеречный", "Ачхой-Мартановский", "Урус-Мартановский",
  "Курчалоевский", "Веденский", "Ножай-Юртовский",
] as const;

// ─── About / values ───────────────────────────────────────────
export const ABOUT = {
  heading: "О компании",
  body1:   "Компания ФинНайс предоставляет жителям Чеченской Республики возможность взять товарную рассрочку.",
  body2:   "Мы руководствуемся исламскими принципами и тезисом «На долгах наживаться нельзя», разделяя сделки купли-продажи от кредитных инструментов.",
} as const;

export const VALUES = [
  {
    icon:  "✅",
    title: "Без риба",
    desc:  "Рассрочка без процентов, строго по шариату",
  },
  {
    icon:  "✅",
    title: "Без скрытых платежей",
    desc:  "Только фиксированные платежи — без сюрпризов",
  },
  {
    icon:  "✅",
    title: "Без пени и штрафов",
    desc:  "Платите по графику — без лишних забот",
  },
] as const;

// ─── Blog posts ───────────────────────────────────────────────
export const BLOG_POSTS = [
  {
    date:    "15-04-2026",
    title:   "Что такое рассрочка по нормам Ислама?",
    excerpt: "Рассказываем о принципах халяльной рассрочки — чем она отличается от кредита и почему это важно.",
    href:    "/blog/chto-takoe-rassrochka/",
  },
  {
    date:    "02-03-2026",
    title:   "Как купить iPhone в рассрочку в Грозном",
    excerpt: "Пошаговая инструкция: выбираем модель, оформляем заявку, получаем смартфон на следующий день.",
    href:    "/blog/iphone-rassrochka-grozny/",
  },
  {
    date:    "18-02-2026",
    title:   "Умра в рассрочку: как это работает",
    excerpt: "Совершить паломничество мечтает каждый мусульманин. Теперь это стало доступнее без кредитов.",
    href:    "/blog/umra-rassrochka/",
  },
] as const;

// ─── Projects ─────────────────────────────────────────────────
export const PROJECTS = [
  {
    icon:  "👥",
    title: "ФинНайсКлуб",
    desc:  "Бизнес-клуб для предпринимателей Чечни — нетворкинг, обучение и партнёрство.",
    href:  "#",
  },
  {
    icon:  "📦",
    title: "Академия онлайн торговли",
    desc:  "Обучение торговле на Wildberries и других маркетплейсах с нуля.",
    href:  "#",
  },
  {
    icon:  "📚",
    title: "Книжный магазин",
    desc:  "Книги по исламской экономике, финансам и бизнесу.",
    href:  "#",
  },
] as const;

// ─── Catalog categories ───────────────────────────────────────
export const CATALOG_CATS = [
  { label: "Телефоны",              href: "/catalog/?cat=telefony",            cat: "telefony" },
  { label: "Планшеты",              href: "/catalog/?cat=planshety",           cat: "planshety" },
  { label: "Аксессуары",            href: "/catalog/?cat=aksessuary",          cat: "aksessuary" },
  { label: "Компьютеры и ноутбуки", href: "/catalog/?cat=noutbuki",            cat: "noutbuki" },
  { label: "Смарт-часы",            href: "/catalog/?cat=smart_chasy",         cat: "smart_chasy" },
  { label: "Гаджеты и консоли",     href: "/catalog/?cat=gadzety_i_konsoli",   cat: "gadzety_i_konsoli" },
  { label: "Телевизоры",            href: "/catalog/?cat=televizory",          cat: "televizory" },
  { label: "Бытовая техника",       href: "/catalog/?cat=bytovaya_tekhnika",   cat: "bytovaya_tekhnika" },
  { label: "Кондиционеры",          href: "/catalog/?cat=konditsionery",       cat: "konditsionery" },
  { label: "Мебель",                href: "/catalog/?cat=mebel",               cat: "mebel" },
  { label: "Детские товары",        href: "/catalog/?cat=detskie_tovary",      cat: "detskie_tovary" },
  { label: "Для дома и сада",       href: "/catalog/?cat=dlya_doma_i_sada",    cat: "dlya_doma_i_sada" },
  { label: "Посуда и кухня",        href: "/catalog/?cat=posuda_i_kukhnya",    cat: "posuda_i_kukhnya" },
] as const;

// ─── Products ─────────────────────────────────────────────────
export interface Product {
  id:           string;
  name:         string;
  slug:         string;
  category:     string;   // matches CATALOG_CATS href segment
  brand:        string;
  price:        number;
  oldPrice?:    number;
  badge?:       string;   // "Хит", "Новинка", "Акция"
  year?:        number;   // release year — used for sorting non-phone products
  emoji:        string;   // placeholder visual
  /** Массив URL картинок (как у PhoneItem) или одна строка (для совместимости) */
  img?:         string | string[];
  memories?:    string[];
  colors?:      string[];
  inStock:      boolean;
  rating:       number;   // 1–5
  reviewCount:  number;
  description:  string;
  specs:        { key: string; val: string }[];
  /** true ⇔ цена пришла из партнёрского TG-канала (точная);
   *  false/undefined ⇔ дефолтная, показываем «≈» */
  tgSynced?:    boolean;
}

const RAW_PRODUCTS: Product[] = [
  /* ── Телефоны ── */
  {
    id: "iphone-16-pro-256",
    name: "Apple iPhone 16 Pro 256GB",
    slug: "apple-iphone-16-pro-256gb",
    category: "telefony",
    brand: "Apple",
    price: 134990, oldPrice: 149990,
    badge: "Хит",
    emoji: "📱",
    memories: ["128 ГБ", "256 ГБ", "512 ГБ"],
    colors: ["Титан", "Чёрный", "Белый", "Натуральный"],
    inStock: true, rating: 5, reviewCount: 142,
    description: "Новейший iPhone 16 Pro с 6.3\" OLED-дисплеем, чипом A18 Pro и системой камер Pro. Идеальный выбор для тех, кто хочет лучшее — без переплаты по шариату.",
    specs: [
      { key: "Экран",      val: "6.3\" Super Retina XDR, 120 Гц" },
      { key: "Процессор",  val: "Apple A18 Pro" },
      { key: "ОЗУ",        val: "8 ГБ" },
      { key: "Камера",     val: "48 + 48 + 12 Мп" },
      { key: "Аккумулятор",val: "3582 мАч" },
      { key: "ОС",         val: "iOS 18" },
    ],
  },
  {
    id: "iphone-16-128",
    name: "Apple iPhone 16 128GB",
    slug: "apple-iphone-16-128gb",
    category: "telefony",
    brand: "Apple",
    price: 89990,
    emoji: "📱",
    memories: ["128 ГБ", "256 ГБ", "512 ГБ"],
    colors: ["Ультрамарин", "Бирюзовый", "Розовый", "Белый", "Чёрный"],
    inStock: true, rating: 5, reviewCount: 98,
    description: "iPhone 16 с чипом A18, динамическим островом и кнопкой управления камерой. Отличный выбор по лучшей цене.",
    specs: [
      { key: "Экран",      val: "6.1\" Super Retina XDR, 60 Гц" },
      { key: "Процессор",  val: "Apple A18" },
      { key: "ОЗУ",        val: "8 ГБ" },
      { key: "Камера",     val: "48 + 12 Мп" },
      { key: "Аккумулятор",val: "3561 мАч" },
      { key: "ОС",         val: "iOS 18" },
    ],
  },
  {
    id: "samsung-s24-256",
    name: "Samsung Galaxy S24 256GB",
    slug: "samsung-galaxy-s24-256gb",
    category: "telefony",
    brand: "Samsung",
    price: 79990, oldPrice: 89990,
    badge: "Акция",
    emoji: "📱",
    memories: ["128 ГБ", "256 ГБ"],
    colors: ["Мраморный серый", "Кобальт", "Янтарный", "Чёрный"],
    inStock: true, rating: 4, reviewCount: 67,
    description: "Samsung Galaxy S24 — флагманский смартфон с искусственным интеллектом Galaxy AI, процессором Snapdragon 8 Gen 3 и ярким 6.2\" дисплеем.",
    specs: [
      { key: "Экран",      val: "6.2\" AMOLED, 120 Гц" },
      { key: "Процессор",  val: "Snapdragon 8 Gen 3" },
      { key: "ОЗУ",        val: "8 ГБ" },
      { key: "Камера",     val: "50 + 10 + 12 Мп" },
      { key: "Аккумулятор",val: "4000 мАч" },
      { key: "ОС",         val: "Android 14" },
    ],
  },
  {
    id: "xiaomi-14t-256",
    name: "Xiaomi 14T 256GB",
    slug: "xiaomi-14t-256gb",
    category: "telefony",
    brand: "Xiaomi",
    price: 54990,
    emoji: "📱",
    memories: ["256 ГБ", "512 ГБ"],
    colors: ["Серый", "Синий", "Чёрный"],
    inStock: true, rating: 4, reviewCount: 41,
    description: "Xiaomi 14T с камерой Leica, зарядкой 67 Вт и ярким AMOLED-экраном. Топовые характеристики по доступной цене.",
    specs: [
      { key: "Экран",      val: "6.67\" AMOLED, 144 Гц" },
      { key: "Процессор",  val: "MediaTek Dimensity 8300-Ultra" },
      { key: "ОЗУ",        val: "12 ГБ" },
      { key: "Камера",     val: "50 + 50 + 12 Мп (Leica)" },
      { key: "Аккумулятор",val: "5000 мАч" },
      { key: "ОС",         val: "Android 14 / MIUI 14" },
    ],
  },

  /* ══════════════════════════════════════════════════════════════
     НОУТБУКИ И КОМПЬЮТЕРЫ  (год ↓, цена ↓)
  ══════════════════════════════════════════════════════════════ */

  // ── MacBook Pro M5  (2026) ────────────────────────────────────
  { id:"mbp16-m5max-64-1tb",  name:'MacBook Pro 16" M5 Max 64/1TB', slug:"mbp16-m5max-64-1tb",
    category:"noutbuki", brand:"Apple", price:634990, badge:"Новинка", year:2026, emoji:"💻",
    img:A("macbook-pro-16"), memories:["1 ТБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:6,
    description:"MacBook Pro 16\" M5 Max 64 ГБ — абсолютный флагман: 40-ядерный GPU, Thunderbolt 5, нанотекстурное стекло.",
    specs:[{key:"Дисплей",val:'16.2" Liquid Retina XDR 120 Гц'},{key:"Процессор",val:"Apple M5 Max"},{key:"ОЗУ",val:"64 ГБ"},{key:"Накопитель",val:"1 ТБ SSD"},{key:"GPU",val:"40-ядерный"},{key:"Автономность",val:"до 22 ч"}] },
  { id:"mbp16-m5max-48-1tb",  name:'MacBook Pro 16" M5 Max 48/1TB', slug:"mbp16-m5max-48-1tb",
    category:"noutbuki", brand:"Apple", price:549990, badge:"Новинка", year:2026, emoji:"💻",
    img:A("macbook-pro-16"), memories:["1 ТБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:9,
    description:"MacBook Pro 16\" M5 Max — для 3D-рендера, ML и видеомонтажа 8K без компромиссов.",
    specs:[{key:"Дисплей",val:'16.2" Liquid Retina XDR 120 Гц'},{key:"Процессор",val:"Apple M5 Max"},{key:"ОЗУ",val:"48 ГБ"},{key:"Накопитель",val:"1 ТБ SSD"},{key:"GPU",val:"40-ядерный"},{key:"Автономность",val:"до 22 ч"}] },
  { id:"mbp16-m5pro-24-1tb",  name:'MacBook Pro 16" M5 Pro 24/1TB', slug:"mbp16-m5pro-24-1tb",
    category:"noutbuki", brand:"Apple", price:444990, badge:"Новинка", year:2026, emoji:"💻",
    img:A("macbook-pro-16"), memories:["1 ТБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:14,
    description:"MacBook Pro 16\" M5 Pro 24 ГБ — большой экран и мощность Pro для разработчиков и дизайнеров.",
    specs:[{key:"Дисплей",val:'16.2" Liquid Retina XDR 120 Гц'},{key:"Процессор",val:"Apple M5 Pro"},{key:"ОЗУ",val:"24 ГБ"},{key:"Накопитель",val:"1 ТБ SSD"},{key:"GPU",val:"20-ядерный"},{key:"Автономность",val:"до 22 ч"}] },
  { id:"mbp16-m5pro-24-512",  name:'MacBook Pro 16" M5 Pro 24/512', slug:"mbp16-m5pro-24-512",
    category:"noutbuki", brand:"Apple", price:399990, badge:"Новинка", year:2026, emoji:"💻",
    img:A("macbook-pro-16"), memories:["512 ГБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:18,
    description:"MacBook Pro 16\" M5 Pro — идеальный баланс экрана, мощности и цены в линейке Pro.",
    specs:[{key:"Дисплей",val:'16.2" Liquid Retina XDR 120 Гц'},{key:"Процессор",val:"Apple M5 Pro"},{key:"ОЗУ",val:"24 ГБ"},{key:"Накопитель",val:"512 ГБ SSD"},{key:"GPU",val:"20-ядерный"},{key:"Автономность",val:"до 22 ч"}] },
  { id:"mbp14-m5pro-24-1tb",  name:'MacBook Pro 14" M5 Pro 24/1TB', slug:"mbp14-m5pro-24-1tb",
    category:"noutbuki", brand:"Apple", price:374990, badge:"Новинка", year:2026, emoji:"💻",
    img:A("macbook-pro-14"), memories:["1 ТБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:22,
    description:"MacBook Pro 14\" M5 Pro — компактный профессиональный ноутбук с дисплеем Liquid Retina XDR и Thunderbolt 5.",
    specs:[{key:"Дисплей",val:'14.2" Liquid Retina XDR 120 Гц'},{key:"Процессор",val:"Apple M5 Pro"},{key:"ОЗУ",val:"24 ГБ"},{key:"Накопитель",val:"1 ТБ SSD"},{key:"GPU",val:"20-ядерный"},{key:"Автономность",val:"до 17 ч"}] },
  { id:"mbp14-m5pro-24-512",  name:'MacBook Pro 14" M5 Pro 24/512', slug:"mbp14-m5pro-24-512",
    category:"noutbuki", brand:"Apple", price:334990, badge:"Новинка", year:2026, emoji:"💻",
    img:A("macbook-pro-14"), memories:["512 ГБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:31,
    description:"MacBook Pro 14\" M5 Pro 512 ГБ — топовая производительность в компактном корпусе.",
    specs:[{key:"Дисплей",val:'14.2" Liquid Retina XDR 120 Гц'},{key:"Процессор",val:"Apple M5 Pro"},{key:"ОЗУ",val:"24 ГБ"},{key:"Накопитель",val:"512 ГБ SSD"},{key:"GPU",val:"20-ядерный"},{key:"Автономность",val:"до 17 ч"}] },
  { id:"mbp14-m5-24-512",     name:'MacBook Pro 14" M5 24/512',     slug:"mbp14-m5-24-512",
    category:"noutbuki", brand:"Apple", price:264990, year:2026, emoji:"💻",
    img:A("macbook-pro-14"), memories:["512 ГБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:40,
    description:"MacBook Pro 14\" M5 — базовый Pro с чипом M5 и дисплеем Liquid Retina XDR. Лучше любого конкурента.",
    specs:[{key:"Дисплей",val:'14.2" Liquid Retina XDR 120 Гц'},{key:"Процессор",val:"Apple M5"},{key:"ОЗУ",val:"24 ГБ"},{key:"Накопитель",val:"512 ГБ SSD"},{key:"GPU",val:"14-ядерный"},{key:"Автономность",val:"до 17 ч"}] },

  // ── MacBook Air M4  (2025) ────────────────────────────────────
  { id:"mba15-m4-16-512", name:'MacBook Air 15" M4 16/512', slug:"mba15-m4-16-512",
    category:"noutbuki", brand:"Apple", price:174990, badge:"Хит", year:2025, emoji:"💻",
    img:A("macbook-air-15"), memories:["512 ГБ"],
    colors:["Sky Blue (Небесно-голубой)","Starlight (Звёздный свет)","Midnight (Полночь)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:67,
    description:"MacBook Air 15\" M4 — самый тонкий 15\" ноутбук. Без вентилятора, до 18 ч автономности, два внешних дисплея.",
    specs:[{key:"Дисплей",val:'15.3" Liquid Retina'},{key:"Процессор",val:"Apple M4"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"512 ГБ SSD"},{key:"Автономность",val:"до 18 ч"}] },
  { id:"mba15-m4-16-256", name:'MacBook Air 15" M4 16/256', slug:"mba15-m4-16-256",
    category:"noutbuki", brand:"Apple", price:149990, year:2025, emoji:"💻",
    img:A("macbook-air-15"), memories:["256 ГБ"],
    colors:["Sky Blue (Небесно-голубой)","Starlight (Звёздный свет)","Midnight (Полночь)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:93,
    description:"MacBook Air 15\" M4 256 ГБ — бесшумный мощный ноутбук с большим дисплеем по доступной цене.",
    specs:[{key:"Дисплей",val:'15.3" Liquid Retina'},{key:"Процессор",val:"Apple M4"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"256 ГБ SSD"},{key:"Автономность",val:"до 18 ч"}] },
  { id:"mba13-m4-16-512", name:'MacBook Air 13" M4 16/512', slug:"mba13-m4-16-512",
    category:"noutbuki", brand:"Apple", price:149990, badge:"Хит", year:2025, emoji:"💻",
    img:A("macbook-air-13"), memories:["512 ГБ"],
    colors:["Sky Blue (Небесно-голубой)","Starlight (Звёздный свет)","Midnight (Полночь)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:115,
    description:"MacBook Air 13\" M4 — самый продаваемый ноутбук Apple. Лёгкий (1.24 кг), тихий и невероятно быстрый.",
    specs:[{key:"Дисплей",val:'13.6" Liquid Retina'},{key:"Процессор",val:"Apple M4"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"512 ГБ SSD"},{key:"Автономность",val:"до 18 ч"}] },
  { id:"mba13-m4-16-256", name:'MacBook Air 13" M4 16/256', slug:"mba13-m4-16-256",
    category:"noutbuki", brand:"Apple", price:119990, year:2025, emoji:"💻",
    img:A("macbook-air-13"), memories:["256 ГБ"],
    colors:["Sky Blue (Небесно-голубой)","Starlight (Звёздный свет)","Midnight (Полночь)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:142,
    description:"MacBook Air 13\" M4 256 ГБ — лучший ноутбук для учёбы и работы. Удар по кошельку минимальный.",
    specs:[{key:"Дисплей",val:'13.6" Liquid Retina'},{key:"Процессор",val:"Apple M4"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"256 ГБ SSD"},{key:"Автономность",val:"до 18 ч"}] },

  // ── Mac Studio  (2025) ────────────────────────────────────────
  { id:"mac-studio-m4ultra-1tb", name:"Mac Studio M4 Ultra 64/1TB", slug:"mac-studio-m4ultra-1tb",
    category:"noutbuki", brand:"Apple", price:429990, badge:"Мощь", year:2025, emoji:"🖥️",
    img:A("mac-studio"), memories:["1 ТБ"],
    colors:["Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:4,
    description:"Mac Studio M4 Ultra — рабочая станция с 64-ядерным GPU и памятью до 192 ГБ. Для тяжёлого профессионального контента.",
    specs:[{key:"Процессор",val:"Apple M4 Ultra"},{key:"ОЗУ",val:"64 ГБ"},{key:"GPU",val:"64-ядерный"},{key:"Накопитель",val:"1 ТБ SSD"},{key:"Порты",val:"Thunderbolt 5 × 4"}] },
  { id:"mac-studio-m4max-512", name:"Mac Studio M4 Max 36/512", slug:"mac-studio-m4max-512",
    category:"noutbuki", brand:"Apple", price:214990, year:2025, emoji:"🖥️",
    img:A("mac-studio"), memories:["512 ГБ"],
    colors:["Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:7,
    description:"Mac Studio M4 Max — мощнейший компактный десктоп для видео, 3D и музыки без шума.",
    specs:[{key:"Процессор",val:"Apple M4 Max"},{key:"ОЗУ",val:"36 ГБ"},{key:"GPU",val:"40-ядерный"},{key:"Накопитель",val:"512 ГБ SSD"},{key:"Порты",val:"Thunderbolt 5 × 3"}] },

  // ── Mac mini M4  (2024) ───────────────────────────────────────
  { id:"mac-mini-m4pro-24-1tb", name:"Mac mini M4 Pro 24/1TB",  slug:"mac-mini-m4pro-24-1tb",
    category:"noutbuki", brand:"Apple", price:124990, year:2024, emoji:"🖥️",
    img:A("mac-mini"), memories:["1 ТБ"],
    colors:["Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:11,
    description:"Mac mini M4 Pro — профессиональная мощность в корпусе 5×5 дюймов. До двух дисплеев 6K.",
    specs:[{key:"Процессор",val:"Apple M4 Pro"},{key:"ОЗУ",val:"24 ГБ"},{key:"GPU",val:"20-ядерный"},{key:"Накопитель",val:"1 ТБ SSD"}] },
  { id:"mac-mini-m4pro-24-512", name:"Mac mini M4 Pro 24/512",  slug:"mac-mini-m4pro-24-512",
    category:"noutbuki", brand:"Apple", price:104990, year:2024, emoji:"🖥️",
    img:A("mac-mini"), memories:["512 ГБ"],
    colors:["Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:17,
    description:"Mac mini M4 Pro 512 ГБ — быстрый и тихий десктоп для всего.",
    specs:[{key:"Процессор",val:"Apple M4 Pro"},{key:"ОЗУ",val:"24 ГБ"},{key:"GPU",val:"20-ядерный"},{key:"Накопитель",val:"512 ГБ SSD"}] },
  { id:"mac-mini-m4-16-1tb",   name:"Mac mini M4 16/1TB",      slug:"mac-mini-m4-16-1tb",
    category:"noutbuki", brand:"Apple", price:89990,  year:2024, emoji:"🖥️",
    img:A("mac-mini"), memories:["1 ТБ"],
    colors:["Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:24,
    description:"Mac mini M4 1 ТБ — максимальное хранилище в базовом mini.",
    specs:[{key:"Процессор",val:"Apple M4"},{key:"ОЗУ",val:"16 ГБ"},{key:"GPU",val:"10-ядерный"},{key:"Накопитель",val:"1 ТБ SSD"}] },
  { id:"mac-mini-m4-16-512",   name:"Mac mini M4 16/512",      slug:"mac-mini-m4-16-512",
    category:"noutbuki", brand:"Apple", price:72990,  year:2024, emoji:"🖥️",
    img:A("mac-mini"), memories:["512 ГБ"],
    colors:["Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:36,
    description:"Mac mini M4 512 ГБ — самый популярный вариант: скорость + запас пространства.",
    specs:[{key:"Процессор",val:"Apple M4"},{key:"ОЗУ",val:"16 ГБ"},{key:"GPU",val:"10-ядерный"},{key:"Накопитель",val:"512 ГБ SSD"}] },
  { id:"mac-mini-m4-16-256",   name:"Mac mini M4 16/256",      slug:"mac-mini-m4-16-256",
    category:"noutbuki", brand:"Apple", price:57990,  year:2024, emoji:"🖥️",
    img:A("mac-mini"), memories:["256 ГБ"],
    colors:["Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:49,
    description:"Mac mini M4 — самый доступный способ войти в экосистему Apple Mac.",
    specs:[{key:"Процессор",val:"Apple M4"},{key:"ОЗУ",val:"16 ГБ"},{key:"GPU",val:"10-ядерный"},{key:"Накопитель",val:"256 ГБ SSD"}] },

  // ── iMac 24" M4  (2024) ───────────────────────────────────────
  { id:"imac24-m4-blue-256",   name:'iMac 24" M4 Blue 16/256',  slug:"imac24-m4-blue-256",
    category:"noutbuki", brand:"Apple", price:139990, badge:"Новинка", year:2024, emoji:"🖥️",
    img:A("imac-blue"), memories:["256 ГБ"],
    colors:["Blue (Синий)"], inStock:true, rating:5, reviewCount:19,
    description:"iMac 24\" M4 в цвете Blue — моноблок толщиной 11.5 мм с дисплеем 4.5K Retina и камерой 12 Мп.",
    specs:[{key:"Дисплей",val:'24" 4.5K Retina'},{key:"Процессор",val:"Apple M4"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"256 ГБ SSD"}] },
  { id:"imac24-m4-pink-256",   name:'iMac 24" M4 Pink 16/256',  slug:"imac24-m4-pink-256",
    category:"noutbuki", brand:"Apple", price:139990, badge:"Новинка", year:2024, emoji:"🖥️",
    img:A("imac-pink"), memories:["256 ГБ"],
    colors:["Pink (Розовый)"], inStock:true, rating:5, reviewCount:14,
    description:"iМac 24\" M4 Pink — стильный моноблок с M4 и дисплеем 4.5K Retina. Украсит любой интерьер.",
    specs:[{key:"Дисплей",val:'24" 4.5K Retina'},{key:"Процессор",val:"Apple M4"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"256 ГБ SSD"}] },
  { id:"imac24-m4-purple-256", name:'iMac 24" M4 Purple 16/256',slug:"imac24-m4-purple-256",
    category:"noutbuki", brand:"Apple", price:139990, badge:"Новинка", year:2024, emoji:"🖥️",
    img:A("imac-purple"), memories:["256 ГБ"],
    colors:["Purple (Фиолетовый)"], inStock:true, rating:5, reviewCount:12,
    description:"iMac 24\" M4 Purple — чип M4 в самом красивом оттенке линейки iMac.",
    specs:[{key:"Дисплей",val:'24" 4.5K Retina'},{key:"Процессор",val:"Apple M4"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"256 ГБ SSD"}] },
  { id:"imac24-m4-silver-256", name:'iMac 24" M4 Silver 16/256',slug:"imac24-m4-silver-256",
    category:"noutbuki", brand:"Apple", price:139990, badge:"Новинка", year:2024, emoji:"🖥️",
    img:A("imac-silver"), memories:["256 ГБ"],
    colors:["Silver (Серебристый)"], inStock:true, rating:5, reviewCount:22,
    description:"iMac 24\" M4 Silver — классический цвет, современный чип M4 и 4.5K-дисплей.",
    specs:[{key:"Дисплей",val:'24" 4.5K Retina'},{key:"Процессор",val:"Apple M4"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"256 ГБ SSD"}] },

  /* ── Телевизоры ── */
  {
    id: "samsung-qled-55",
    name: "Samsung QLED 4K 55\" QE55Q80D",
    slug: "samsung-qled-4k-55-qe55q80d",
    category: "televizory",
    brand: "Samsung",
    price: 89990, oldPrice: 109990,
    badge: "Акция",
    emoji: "📺",
    colors: ["Чёрный"],
    inStock: true, rating: 5, reviewCount: 29,
    description: "Samsung QLED 4K с технологией Quantum Dot, процессором NQ4 AI и поддержкой Dolby Atmos. Кино в вашем доме.",
    specs: [
      { key: "Экран",      val: "55\", QLED 4K Ultra HD" },
      { key: "Разрешение", val: "3840×2160" },
      { key: "Частота",    val: "120 Гц" },
      { key: "Звук",       val: "40 Вт, Dolby Atmos" },
      { key: "Smart TV",   val: "Tizen 8.0" },
      { key: "HDMI",       val: "4 × HDMI 2.1" },
    ],
  },
  {
    id: "lg-oled-55",
    name: "LG OLED evo 55\" C3",
    slug: "lg-oled-evo-55-c3",
    category: "televizory",
    brand: "LG",
    price: 119990,
    badge: "Хит",
    emoji: "📺",
    colors: ["Чёрный"],
    inStock: true, rating: 5, reviewCount: 44,
    description: "LG OLED evo 55\" — идеальная картинка с самосветящимися пикселями, глубоким чёрным и поддержкой Dolby Vision IQ.",
    specs: [
      { key: "Экран",      val: "55\", OLED evo 4K" },
      { key: "Разрешение", val: "3840×2160" },
      { key: "Частота",    val: "120 Гц (до 144 Гц)" },
      { key: "Звук",       val: "60 Вт, Dolby Atmos" },
      { key: "Smart TV",   val: "webOS 23" },
      { key: "HDMI",       val: "4 × HDMI 2.1" },
    ],
  },

  /* ── Бытовая техника ── */
  {
    id: "samsung-wa-7kg",
    name: "Samsung WW70T3040BS Стиральная машина 7 кг",
    slug: "samsung-ww70t3040bs",
    category: "bytovaya_tekhnika",
    brand: "Samsung",
    price: 34990,
    emoji: "🫧",
    colors: ["Серебро"],
    inStock: true, rating: 4, reviewCount: 18,
    description: "Стиральная машина Samsung с инверторным двигателем, функцией пузырьковой стирки и отжимом 1400 об/мин.",
    specs: [
      { key: "Загрузка",   val: "7 кг" },
      { key: "Отжим",      val: "1400 об/мин" },
      { key: "Программы",  val: "16" },
      { key: "Класс",      val: "A+++/A" },
      { key: "Тип",        val: "Фронтальная загрузка" },
    ],
  },
  {
    id: "lg-fridge-300",
    name: "LG GA-B459SMUM Холодильник Total No Frost",
    slug: "lg-ga-b459smum",
    category: "bytovaya_tekhnika",
    brand: "LG",
    price: 49990, oldPrice: 59990,
    badge: "Акция",
    emoji: "🧊",
    colors: ["Нержавеющая сталь", "Белый"],
    inStock: true, rating: 4, reviewCount: 22,
    description: "Двухкамерный холодильник LG с No Frost, линейным компрессором и функцией DoorCooling+. Объём 302 л.",
    specs: [
      { key: "Объём",      val: "302 л (223 + 79)" },
      { key: "No Frost",   val: "Двойная система" },
      { key: "Компрессор", val: "Линейный инверторный" },
      { key: "Класс",      val: "A++" },
      { key: "Размеры",    val: "60×68×185 см" },
    ],
  },

  /* ══════════════════════════════════════════════════════════════
     СМАРТ-ЧАСЫ  (год ↓, цена ↓)
  ══════════════════════════════════════════════════════════════ */

  // Apple Watch — берутся из BIGGEEK_PRODUCTS (см. lib/biggeek-products.ts).

  /* ══════════════════════════════════════════════════════════════
     ПЛАНШЕТЫ  (год ↓, цена ↓)
  ══════════════════════════════════════════════════════════════ */

  // ── iPad Pro M5  (2026) ───────────────────────────────────────
  { id:"ipad-pro13-m5-2tb", name:'iPad Pro 13" M5 Wi-Fi 2TB',  slug:"ipad-pro13-m5-2tb",
    category:"planshety", brand:"Apple", price:289990, badge:"Новинка", year:2026, emoji:"📱",
    img:A("ipad-pro"), memories:["2 ТБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:4,
    description:"iPad Pro 13\" M5 2 ТБ — максимальная конфигурация флагманского планшета. OLED Ultra Retina XDR, чип M5 и 16 ГБ памяти.",
    specs:[{key:"Дисплей",val:'13" OLED Ultra Retina XDR'},{key:"Процессор",val:"Apple M5"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"2 ТБ"},{key:"Камера",val:"12 Мп + 12 Мп Ultra Wide"},{key:"ОС",val:"iPadOS 19"}] },
  { id:"ipad-pro13-m5-1tb", name:'iPad Pro 13" M5 Wi-Fi 1TB',  slug:"ipad-pro13-m5-1tb",
    category:"planshety", brand:"Apple", price:249990, badge:"Новинка", year:2026, emoji:"📱",
    img:A("ipad-pro"), memories:["1 ТБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:7,
    description:"iPad Pro 13\" M5 1 ТБ — профессиональный планшет с OLED-дисплеем и чипом M5 для творческих задач любой сложности.",
    specs:[{key:"Дисплей",val:'13" OLED Ultra Retina XDR'},{key:"Процессор",val:"Apple M5"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"1 ТБ"},{key:"Камера",val:"12 Мп + 12 Мп Ultra Wide"},{key:"ОС",val:"iPadOS 19"}] },
  { id:"ipad-pro13-m5-512", name:'iPad Pro 13" M5 Wi-Fi 512GB', slug:"ipad-pro13-m5-512",
    category:"planshety", brand:"Apple", price:209990, badge:"Новинка", year:2026, emoji:"📱",
    img:A("ipad-pro"), memories:["512 ГБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:11,
    description:"iPad Pro 13\" M5 512 ГБ — огромный OLED-дисплей и флагманский чип M5 для дизайна, видео и AR.",
    specs:[{key:"Дисплей",val:'13" OLED Ultra Retina XDR'},{key:"Процессор",val:"Apple M5"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"512 ГБ"},{key:"Камера",val:"12 Мп + 12 Мп Ultra Wide"},{key:"ОС",val:"iPadOS 19"}] },
  { id:"ipad-pro13-m5-256", name:'iPad Pro 13" M5 Wi-Fi 256GB', slug:"ipad-pro13-m5-256",
    category:"planshety", brand:"Apple", price:179990, badge:"Новинка", year:2026, emoji:"📱",
    img:A("ipad-pro"), memories:["256 ГБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:18,
    description:"iPad Pro 13\" M5 256 ГБ — базовый Pro с OLED-дисплеем нового поколения и непревзойдённой тонкостью корпуса 5.1 мм.",
    specs:[{key:"Дисплей",val:'13" OLED Ultra Retina XDR'},{key:"Процессор",val:"Apple M5"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"256 ГБ"},{key:"Камера",val:"12 Мп + 12 Мп Ultra Wide"},{key:"ОС",val:"iPadOS 19"}] },
  { id:"ipad-pro11-m5-2tb", name:'iPad Pro 11" M5 Wi-Fi 2TB',  slug:"ipad-pro11-m5-2tb",
    category:"planshety", brand:"Apple", price:219990, badge:"Новинка", year:2026, emoji:"📱",
    img:A("ipad-pro"), memories:["2 ТБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:5,
    description:"iPad Pro 11\" M5 2 ТБ — максимальная версия компактного Pro с OLED-дисплеем и чипом M5.",
    specs:[{key:"Дисплей",val:'11" OLED Ultra Retina XDR'},{key:"Процессор",val:"Apple M5"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"2 ТБ"},{key:"Камера",val:"12 Мп + 12 Мп Ultra Wide"},{key:"ОС",val:"iPadOS 19"}] },
  { id:"ipad-pro11-m5-1tb", name:'iPad Pro 11" M5 Wi-Fi 1TB',  slug:"ipad-pro11-m5-1tb",
    category:"planshety", brand:"Apple", price:189990, badge:"Новинка", year:2026, emoji:"📱",
    img:A("ipad-pro"), memories:["1 ТБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:9,
    description:"iPad Pro 11\" M5 1 ТБ — профессиональный компактный планшет с OLED и поддержкой Apple Pencil Pro.",
    specs:[{key:"Дисплей",val:'11" OLED Ultra Retina XDR'},{key:"Процессор",val:"Apple M5"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"1 ТБ"},{key:"Камера",val:"12 Мп + 12 Мп Ultra Wide"},{key:"ОС",val:"iPadOS 19"}] },
  { id:"ipad-pro11-m5-512", name:'iPad Pro 11" M5 Wi-Fi 512GB', slug:"ipad-pro11-m5-512",
    category:"planshety", brand:"Apple", price:159990, badge:"Новинка", year:2026, emoji:"📱",
    img:A("ipad-pro"), memories:["512 ГБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:14,
    description:"iPad Pro 11\" M5 512 ГБ — мощь M5 в компактном корпусе 5.3 мм с дисплеем OLED Ultra Retina XDR.",
    specs:[{key:"Дисплей",val:'11" OLED Ultra Retina XDR'},{key:"Процессор",val:"Apple M5"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"512 ГБ"},{key:"Камера",val:"12 Мп + 12 Мп Ultra Wide"},{key:"ОС",val:"iPadOS 19"}] },
  { id:"ipad-pro11-m5-256", name:'iPad Pro 11" M5 Wi-Fi 256GB', slug:"ipad-pro11-m5-256",
    category:"planshety", brand:"Apple", price:129990, badge:"Новинка", year:2026, emoji:"📱",
    img:A("ipad-pro"), memories:["256 ГБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:22,
    description:"iPad Pro 11\" M5 256 ГБ — базовый Pro с OLED-дисплеем. Тонкий, быстрый и невероятно мощный.",
    specs:[{key:"Дисплей",val:'11" OLED Ultra Retina XDR'},{key:"Процессор",val:"Apple M5"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"256 ГБ"},{key:"Камера",val:"12 Мп + 12 Мп Ultra Wide"},{key:"ОС",val:"iPadOS 19"}] },

  // ── iPad Pro M4  (2024) ───────────────────────────────────────
  { id:"ipad-pro13-m4-1tb", name:'iPad Pro 13" M4 Wi-Fi 1TB',  slug:"ipad-pro13-m4-1tb",
    category:"planshety", brand:"Apple", price:219990, year:2024, emoji:"📱",
    img:A("ipad-pro"), memories:["1 ТБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:16,
    description:"iPad Pro 13\" M4 1 ТБ — прошлое поколение Pro с OLED-дисплеем и чипом M4. Отличная цена на флагманский планшет.",
    specs:[{key:"Дисплей",val:'13" OLED Ultra Retina XDR'},{key:"Процессор",val:"Apple M4"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"1 ТБ"},{key:"Камера",val:"12 Мп + 12 Мп Ultra Wide"},{key:"ОС",val:"iPadOS 18"}] },
  { id:"ipad-pro13-m4-512", name:'iPad Pro 13" M4 Wi-Fi 512GB', slug:"ipad-pro13-m4-512",
    category:"planshety", brand:"Apple", price:179990, year:2024, emoji:"📱",
    img:A("ipad-pro"), memories:["512 ГБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:24,
    description:"iPad Pro 13\" M4 512 ГБ — большой OLED-экран и мощный M4 по выгодной цене.",
    specs:[{key:"Дисплей",val:'13" OLED Ultra Retina XDR'},{key:"Процессор",val:"Apple M4"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"512 ГБ"},{key:"Камера",val:"12 Мп + 12 Мп Ultra Wide"},{key:"ОС",val:"iPadOS 18"}] },
  { id:"ipad-pro13-m4-256", name:'iPad Pro 13" M4 Wi-Fi 256GB', slug:"ipad-pro13-m4-256",
    category:"planshety", brand:"Apple", price:149990, year:2024, emoji:"📱",
    img:A("ipad-pro"), memories:["256 ГБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:34,
    description:"iPad Pro 13\" M4 256 ГБ — самый доступный 13\" Pro с OLED и чипом M4.",
    specs:[{key:"Дисплей",val:'13" OLED Ultra Retina XDR'},{key:"Процессор",val:"Apple M4"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"256 ГБ"},{key:"Камера",val:"12 Мп + 12 Мп Ultra Wide"},{key:"ОС",val:"iPadOS 18"}] },
  { id:"ipad-pro11-m4-1tb", name:'iPad Pro 11" M4 Wi-Fi 1TB',  slug:"ipad-pro11-m4-1tb",
    category:"planshety", brand:"Apple", price:169990, year:2024, emoji:"📱",
    img:A("ipad-pro"), memories:["1 ТБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:28,
    description:"iPad Pro 11\" M4 1 ТБ — компактный Pro с OLED-дисплеем и чипом M4 в максимальной конфигурации хранилища.",
    specs:[{key:"Дисплей",val:'11" OLED Ultra Retina XDR'},{key:"Процессор",val:"Apple M4"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"1 ТБ"},{key:"Камера",val:"12 Мп + 12 Мп Ultra Wide"},{key:"ОС",val:"iPadOS 18"}] },
  { id:"ipad-pro11-m4-512", name:'iPad Pro 11" M4 Wi-Fi 512GB', slug:"ipad-pro11-m4-512",
    category:"planshety", brand:"Apple", price:139990, year:2024, emoji:"📱",
    img:A("ipad-pro"), memories:["512 ГБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:41,
    description:"iPad Pro 11\" M4 512 ГБ — идеальный баланс мощности и цены в линейке Pro.",
    specs:[{key:"Дисплей",val:'11" OLED Ultra Retina XDR'},{key:"Процессор",val:"Apple M4"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"512 ГБ"},{key:"Камера",val:"12 Мп + 12 Мп Ultra Wide"},{key:"ОС",val:"iPadOS 18"}] },
  { id:"ipad-pro11-m4-256", name:'iPad Pro 11" M4 Wi-Fi 256GB', slug:"ipad-pro11-m4-256",
    category:"planshety", brand:"Apple", price:109990, year:2024, emoji:"📱",
    img:A("ipad-pro"), memories:["256 ГБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:56,
    description:"iPad Pro 11\" M4 256 ГБ — доступный вход в линейку Pro с OLED и чипом M4.",
    specs:[{key:"Дисплей",val:'11" OLED Ultra Retina XDR'},{key:"Процессор",val:"Apple M4"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"256 ГБ"},{key:"Камера",val:"12 Мп + 12 Мп Ultra Wide"},{key:"ОС",val:"iPadOS 18"}] },

  // ── iPad Air M3  (2025) ───────────────────────────────────────
  { id:"ipad-air13-m3-512", name:'iPad Air 13" M3 Wi-Fi 512GB', slug:"ipad-air13-m3-512",
    category:"planshety", brand:"Apple", price:129990, badge:"Хит", year:2025, emoji:"📱",
    img:A("ipad-air"), memories:["512 ГБ"],
    colors:["Blue (Синий)","Purple (Фиолетовый)","Starlight (Звёздный свет)","Space Gray (Серый космос)"],
    inStock:true, rating:5, reviewCount:19,
    description:"iPad Air 13\" M3 512 ГБ — лёгкий и тонкий планшет с большим дисплеем Liquid Retina и чипом M3.",
    specs:[{key:"Дисплей",val:'13" Liquid Retina, 2732×2048'},{key:"Процессор",val:"Apple M3"},{key:"ОЗУ",val:"8 ГБ"},{key:"Накопитель",val:"512 ГБ"},{key:"Камера",val:"12 Мп Wide"},{key:"ОС",val:"iPadOS 18"}] },
  { id:"ipad-air13-m3-256", name:'iPad Air 13" M3 Wi-Fi 256GB', slug:"ipad-air13-m3-256",
    category:"planshety", brand:"Apple", price:99990, badge:"Хит", year:2025, emoji:"📱",
    img:A("ipad-air"), memories:["256 ГБ"],
    colors:["Blue (Синий)","Purple (Фиолетовый)","Starlight (Звёздный свет)","Space Gray (Серый космос)"],
    inStock:true, rating:5, reviewCount:31,
    description:"iPad Air 13\" M3 256 ГБ — просторный экран и отличная производительность для работы и учёбы.",
    specs:[{key:"Дисплей",val:'13" Liquid Retina, 2732×2048'},{key:"Процессор",val:"Apple M3"},{key:"ОЗУ",val:"8 ГБ"},{key:"Накопитель",val:"256 ГБ"},{key:"Камера",val:"12 Мп Wide"},{key:"ОС",val:"iPadOS 18"}] },
  { id:"ipad-air13-m3-128", name:'iPad Air 13" M3 Wi-Fi 128GB', slug:"ipad-air13-m3-128",
    category:"planshety", brand:"Apple", price:84990, year:2025, emoji:"📱",
    img:A("ipad-air"), memories:["128 ГБ"],
    colors:["Blue (Синий)","Purple (Фиолетовый)","Starlight (Звёздный свет)","Space Gray (Серый космос)"],
    inStock:true, rating:5, reviewCount:44,
    description:"iPad Air 13\" M3 128 ГБ — базовая версия 13\" Air с чипом M3 и дисплеем Liquid Retina.",
    specs:[{key:"Дисплей",val:'13" Liquid Retina, 2732×2048'},{key:"Процессор",val:"Apple M3"},{key:"ОЗУ",val:"8 ГБ"},{key:"Накопитель",val:"128 ГБ"},{key:"Камера",val:"12 Мп Wide"},{key:"ОС",val:"iPadOS 18"}] },
  { id:"ipad-air11-m3-512", name:'iPad Air 11" M3 Wi-Fi 512GB', slug:"ipad-air11-m3-512",
    category:"planshety", brand:"Apple", price:99990, badge:"Хит", year:2025, emoji:"📱",
    img:A("ipad-air"), memories:["512 ГБ"],
    colors:["Blue (Синий)","Purple (Фиолетовый)","Starlight (Звёздный свет)","Space Gray (Серый космос)"],
    inStock:true, rating:5, reviewCount:38,
    description:"iPad Air 11\" M3 512 ГБ — максимальное хранилище в компактном Air с чипом M3.",
    specs:[{key:"Дисплей",val:'11" Liquid Retina, 2360×1640'},{key:"Процессор",val:"Apple M3"},{key:"ОЗУ",val:"8 ГБ"},{key:"Накопитель",val:"512 ГБ"},{key:"Камера",val:"12 Мп Wide"},{key:"ОС",val:"iPadOS 18"}] },
  { id:"ipad-air11-m3-256", name:'iPad Air 11" M3 Wi-Fi 256GB', slug:"ipad-air11-m3-256",
    category:"planshety", brand:"Apple", price:79990, year:2025, emoji:"📱",
    img:A("ipad-air"), memories:["256 ГБ"],
    colors:["Blue (Синий)","Purple (Фиолетовый)","Starlight (Звёздный свет)","Space Gray (Серый космос)"],
    inStock:true, rating:5, reviewCount:57,
    description:"iPad Air 11\" M3 256 ГБ — мощный и лёгкий планшет для каждого дня с чипом M3.",
    specs:[{key:"Дисплей",val:'11" Liquid Retina, 2360×1640'},{key:"Процессор",val:"Apple M3"},{key:"ОЗУ",val:"8 ГБ"},{key:"Накопитель",val:"256 ГБ"},{key:"Камера",val:"12 Мп Wide"},{key:"ОС",val:"iPadOS 18"}] },
  { id:"ipad-air11-m3-128", name:'iPad Air 11" M3 Wi-Fi 128GB', slug:"ipad-air11-m3-128",
    category:"planshety", brand:"Apple", price:64990, year:2025, emoji:"📱",
    img:A("ipad-air"), memories:["128 ГБ"],
    colors:["Blue (Синий)","Purple (Фиолетовый)","Starlight (Звёздный свет)","Space Gray (Серый космос)"],
    inStock:true, rating:5, reviewCount:76,
    description:"iPad Air 11\" M3 128 ГБ — базовый 11\" Air. Доступная точка входа в мощный планшет Apple.",
    specs:[{key:"Дисплей",val:'11" Liquid Retina, 2360×1640'},{key:"Процессор",val:"Apple M3"},{key:"ОЗУ",val:"8 ГБ"},{key:"Накопитель",val:"128 ГБ"},{key:"Камера",val:"12 Мп Wide"},{key:"ОС",val:"iPadOS 18"}] },

  // ── iPad Air M2  (2024) ───────────────────────────────────────
  { id:"ipad-air13-m2-128", name:'iPad Air 13" M2 Wi-Fi 128GB', slug:"ipad-air13-m2-128",
    category:"planshety", brand:"Apple", price:74990, year:2024, emoji:"📱",
    img:A("ipad-air"), memories:["128 ГБ"],
    colors:["Blue (Синий)","Purple (Фиолетовый)","Starlight (Звёздный свет)","Space Gray (Серый космос)"],
    inStock:true, rating:4, reviewCount:63,
    description:"iPad Air 13\" M2 — первый 13\" Air с чипом M2 и дисплеем Liquid Retina. Отличная альтернатива Pro по доступной цене.",
    specs:[{key:"Дисплей",val:'13" Liquid Retina, 2732×2048'},{key:"Процессор",val:"Apple M2"},{key:"ОЗУ",val:"8 ГБ"},{key:"Накопитель",val:"128 ГБ"},{key:"Камера",val:"12 Мп Wide"},{key:"ОС",val:"iPadOS 18"}] },
  { id:"ipad-air11-m2-128", name:'iPad Air 11" M2 Wi-Fi 128GB', slug:"ipad-air11-m2-128",
    category:"planshety", brand:"Apple", price:54990, year:2024, emoji:"📱",
    img:A("ipad-air"), memories:["128 ГБ"],
    colors:["Blue (Синий)","Purple (Фиолетовый)","Starlight (Звёздный свет)","Space Gray (Серый космос)"],
    inStock:true, rating:4, reviewCount:89,
    description:"iPad Air 11\" M2 — доступный Air с чипом M2 и тонким корпусом. Поддерживает Apple Pencil Pro.",
    specs:[{key:"Дисплей",val:'11" Liquid Retina, 2360×1640'},{key:"Процессор",val:"Apple M2"},{key:"ОЗУ",val:"8 ГБ"},{key:"Накопитель",val:"128 ГБ"},{key:"Камера",val:"12 Мп Wide"},{key:"ОС",val:"iPadOS 18"}] },

  // ── iPad 10th gen  (2022) ─────────────────────────────────────
  { id:"ipad10-256", name:'iPad 10.9" 10-го поколения Wi-Fi 256GB', slug:"ipad10-256",
    category:"planshety", brand:"Apple", price:49990, year:2022, emoji:"📱",
    img:A("ipad-air"), memories:["256 ГБ"],
    colors:["Blue (Синий)","Pink (Розовый)","Yellow (Жёлтый)","Silver (Серебристый)"],
    inStock:true, rating:4, reviewCount:128,
    description:"iPad 10-го поколения 256 ГБ — обновлённый дизайн, USB-C и поддержка Apple Pencil (1-го поколения). Лучший выбор для начинающих.",
    specs:[{key:"Дисплей",val:'10.9" Liquid Retina, 2360×1640'},{key:"Процессор",val:"Apple A14 Bionic"},{key:"Накопитель",val:"256 ГБ"},{key:"Камера",val:"12 Мп Wide"},{key:"ОС",val:"iPadOS 18"}] },
  { id:"ipad10-64",  name:'iPad 10.9" 10-го поколения Wi-Fi 64GB',  slug:"ipad10-64",
    category:"planshety", brand:"Apple", price:39990, year:2022, emoji:"📱",
    img:A("ipad-air"), memories:["64 ГБ"],
    colors:["Blue (Синий)","Pink (Розовый)","Yellow (Жёлтый)","Silver (Серебристый)"],
    inStock:true, rating:4, reviewCount:196,
    description:"iPad 10-го поколения 64 ГБ — самый доступный iPad с USB-C и современным дизайном без кнопки Home.",
    specs:[{key:"Дисплей",val:'10.9" Liquid Retina, 2360×1640'},{key:"Процессор",val:"Apple A14 Bionic"},{key:"Накопитель",val:"64 ГБ"},{key:"Камера",val:"12 Мп Wide"},{key:"ОС",val:"iPadOS 18"}] },

  /* ══════════════════════════════════════════════════════════════
     АКСЕССУАРЫ  (год ↓, цена ↓)
  ══════════════════════════════════════════════════════════════ */

  // ── AirPods Max 2 USB-C  (2024) ───────────────────────────────
  { id:"airpods-max2", name:"AirPods Max 2", slug:"airpods-max2",
    category:"aksessuary", brand:"Apple", price:59990, badge:"Хит", year:2024, emoji:"🎧",
    img:A("airpods-max2"),
    colors:["Midnight (Полночь)","Blue (Синий)","Pink (Розовый)","Silver (Серебристый)","Starlight (Звёздный свет)"],
    inStock:true, rating:5, reviewCount:114,
    description:"AirPods Max 2 с разъёмом USB-C — накладные наушники Apple с адаптивным шумоподавлением H2, Transparency Mode и Personalised Spatial Audio. Доступны в 5 цветах.",
    specs:[{key:"Чип",val:"Apple H2"},{key:"ANC",val:"Адаптивное"},{key:"Автономность",val:"до 30 ч (с ANC)"},{key:"Разъём",val:"USB-C"},{key:"Вес",val:"385 г"},{key:"ОС",val:"iOS 17+"}] },

  // ── AirPods Pro 3  (2025) ──────────────────────────────────────
  { id:"airpods-pro3",  name:"AirPods Pro 3", slug:"airpods-pro3",
    category:"aksessuary", brand:"Apple", price:29990, badge:"Новинка", year:2025, emoji:"🎧",
    img:A("airpods-pro3"),
    colors:["White (Белый)"],
    inStock:true, rating:5, reviewCount:41,
    description:"AirPods Pro 3 — новое поколение с чипом H3, улучшенным ANC, персонализированным Spatial Audio и здоровьесберегающими функциями: мониторинг слуха, слуховой аппарат.",
    specs:[{key:"Чип",val:"Apple H3"},{key:"ANC",val:"Адаптивное + Transparency"},{key:"Автономность",val:"до 6 ч + 30 ч (кейс)"},{key:"Разъём кейса",val:"MagSafe / USB-C"},{key:"Стандарт",val:"IP54"}] },

  // ── AirPods 4  (2024) ─────────────────────────────────────────
  { id:"airpods4-anc",     name:"AirPods 4 (с активным шумоподавлением)", slug:"airpods4-anc",
    category:"aksessuary", brand:"Apple", price:19990, badge:"Хит", year:2024, emoji:"🎧",
    img:A("airpods4-anc"),
    colors:["White (Белый)"],
    inStock:true, rating:5, reviewCount:87,
    description:"AirPods 4 с активным шумоподавлением — первые полностью открытые наушники Apple с ANC. Чип H2, Spatial Audio и адаптивный звук.",
    specs:[{key:"Чип",val:"Apple H2"},{key:"ANC",val:"Есть"},{key:"Автономность",val:"до 5 ч + 30 ч (кейс)"},{key:"Кейс",val:"MagSafe / USB-C"}] },
  { id:"airpods4",         name:"AirPods 4",                               slug:"airpods4",
    category:"aksessuary", brand:"Apple", price:14990, year:2024, emoji:"🎧",
    img:A("airpods4"),
    colors:["White (Белый)"],
    inStock:true, rating:5, reviewCount:122,
    description:"AirPods 4 — обновлённый дизайн с H2, Spatial Audio и улучшенной акустикой. Без ANC, но с отличным звуком по лучшей цене.",
    specs:[{key:"Чип",val:"Apple H2"},{key:"ANC",val:"Нет"},{key:"Автономность",val:"до 5 ч + 30 ч (кейс)"},{key:"Кейс",val:"USB-C"}] },

  // ── Sony WH-1000XM6  (2025) ────────────────────────────────────
  // ── Bose QuietComfort Ultra  (2023) ────────────────────────────
  // ── Чехлы Apple Silicone  (2025/26) ────────────────────────────
  // ── Pitaka MagEZ Case  (2025) ──────────────────────────────────
  /* ══════════════════════════════════════════════════════════════
     СМАРТ-ЧАСЫ — GARMIN  (год ↓, цена ↓)
  ══════════════════════════════════════════════════════════════ */

  // ── Garmin Fenix 8  (2024) ─────────────────────────────────────
  // ── Garmin Epix Gen 3  (2024) ──────────────────────────────────
  // ── Garmin Forerunner 965  (2023) ──────────────────────────────
  // ── Garmin Venu 3  (2023) ─────────────────────────────────────
  // ── Garmin Instinct 3  (2025) ──────────────────────────────────
  // ── Garmin Vivoactive 5  (2023) ────────────────────────────────
  /* ══════════════════════════════════════════════════════════════
     ГАДЖЕТЫ И КОНСОЛИ  (год ↓, цена ↓)
  ══════════════════════════════════════════════════════════════ */

  // PlayStation / Xbox / Apple TV — из BIGGEEK_PRODUCTS (см. lib/biggeek-products.ts)
  // Apple Vision Pro — оттуда же

  // ── Ray-Ban Meta Glasses  (2023/2025) ─────────────────────────
  { id:"rayban-meta-gen4",  name:"Ray-Ban Meta Glasses (2025)", slug:"rayban-meta-gen4",
    category:"gadzety_i_konsoli", brand:"Meta", price:49990, badge:"Новинка", year:2025, emoji:"🕶️",
    img:"/images/products/rayban-meta-gen4.jpg",
    colors:["Shiny Black","Matte Jett","Shiny Brown"],
    inStock:true, rating:4, reviewCount:16,
    description:"Ray-Ban Meta 2025 — смарт-очки с ИИ-ассистентом Meta AI, камерой 12 Мп, аудио с открытыми динамиками и до 8 ч работы. Выглядят как обычные очки.",
    specs:[{key:"Камера",val:"12 Мп, 3K видео"},{key:"Звук",val:"Открытые динамики"},{key:"ИИ",val:"Meta AI"},{key:"Автономность",val:"до 8 ч"},{key:"Подключение",val:"Bluetooth 5.3"},{key:"Вес",val:"~50 г"}] },
  { id:"rayban-meta-gen3",  name:"Ray-Ban Meta Smart Glasses", slug:"rayban-meta-gen3",
    category:"gadzety_i_konsoli", brand:"Meta", price:34990, year:2023, emoji:"🕶️",
    img:"/images/products/rayban-meta-gen3.jpg",
    colors:["Shiny Black","Shiny Havana","Shiny Caramel"],
    inStock:true, rating:4, reviewCount:29,
    description:"Ray-Ban Meta Smart Glasses 2023 — смарт-очки с камерой 12 Мп, встроенным звуком и Meta AI (голосовой ассистент). Первые умные очки, которые выглядят модно.",
    specs:[{key:"Камера",val:"12 Мп, 1080p видео"},{key:"Звук",val:"Открытые динамики + микрофоны"},{key:"ИИ",val:"Meta AI"},{key:"Автономность",val:"до 6 ч"},{key:"Подключение",val:"Bluetooth 5.3"}] },

  // Apple TV 4K — из BIGGEEK_PRODUCTS (см. lib/biggeek-products.ts)

  // ── Steam Deck OLED  (2023) ────────────────────────────────────
  { id:"steam-deck-oled-512", name:"Steam Deck OLED 512GB", slug:"steam-deck-oled-512",
    category:"gadzety_i_konsoli", brand:"Valve", price:59990, badge:"Хит", year:2023, emoji:"🎮",
    img:"/images/phones/steam-deck.jpg",
    memories:["512 ГБ"],
    colors:["Black"],
    inStock:true, rating:5, reviewCount:34,
    description:"Steam Deck OLED 512 ГБ — портативная игровая консоль Valve с 7.4\" OLED HDR-дисплеем, чипом APU AMD Zen 2 + RDNA 2 и библиотекой Steam.",
    specs:[{key:"Дисплей",val:"7.4\" OLED HDR, 90 Гц"},{key:"APU",val:"AMD Zen 2 + RDNA 2"},{key:"ОЗУ",val:"16 ГБ LPDDR5"},{key:"Накопитель",val:"512 ГБ NVMe"},{key:"Автономность",val:"до 12 ч"},{key:"ОС",val:"SteamOS 3"}] },
  { id:"steam-deck-oled-1tb",  name:"Steam Deck OLED 1TB",   slug:"steam-deck-oled-1tb",
    category:"gadzety_i_konsoli", brand:"Valve", price:74990, year:2023, emoji:"🎮",
    img:"/images/phones/steam-deck.jpg",
    memories:["1 ТБ"],
    colors:["Black"],
    inStock:true, rating:5, reviewCount:19,
    description:"Steam Deck OLED 1 ТБ Limited Edition — максимальный объём хранилища для Steam Deck с Anti-Glare этчингом.",
    specs:[{key:"Дисплей",val:"7.4\" OLED HDR, 90 Гц"},{key:"APU",val:"AMD Zen 2 + RDNA 2"},{key:"ОЗУ",val:"16 ГБ LPDDR5"},{key:"Накопитель",val:"1 ТБ NVMe"},{key:"Автономность",val:"до 12 ч"},{key:"Экран",val:"Anti-Glare"}] },

  /* ── Импорт с biggeek.ru (Mac, iPad, Apple Watch, Apple TV, AirTag) ── */
  ...BIGGEEK_PRODUCTS,
];

/** Цены из партнёрского TG-канала перезаписывают базовые при матче по id;
 *  на синхронизированных цена точная (без «≈»), на остальных — приблизительная.
 *  Управление — в lib/tg-prices.ts. */
export const PRODUCTS: Product[] = RAW_PRODUCTS.map(p =>
  TG_PRICES[p.id] != null
    ? { ...p, price: TG_PRICES[p.id], tgSynced: true }
    : p
);

// ─── Footer links ─────────────────────────────────────────────
export const FOOTER_COL1 = [
  { label: "О компании",  href: "/company/" },
  { label: "Отзывы",      href: "/otzyvy/" },
  { label: "Партнеры",    href: "/partners/" },
  { label: "Работа у нас",href: "/info/vacancy/" },
  { label: "Блог",        href: "/blog/" },
] as const;

export const FOOTER_COL2 = [
  { label: "Политика",  href: "/politika/" },
  { label: "Контакты",  href: "/contacts/" },
] as const;

export const FOOTER_COL3 = [
  { label: "Доставка и оплата",         href: "/contacts/" },
  { label: "Акции",                     href: "/aktsii/" },
  { label: "Вопросы-ответы",            href: "/blog/" },
  { label: "Как оформить рассрочку?",   href: "/company/" },
  { label: "Калькулятор рассрочки",     href: "/#calculator" },
  { label: "Айфоны в рассрочку",        href: "/catalog/?cat=telefony" },
  { label: "Телевизоры в рассрочку",    href: "/catalog/?cat=televizory" },
  { label: "Планшеты в рассрочку",      href: "/catalog/?cat=planshety" },
  { label: "Смарт-часы в рассрочку",    href: "/catalog/?cat=smart_chasy" },
  { label: "Ноутбуки в рассрочку",      href: "/catalog/?cat=noutbuki" },
  { label: "Игровые консоли в рассрочку", href: "/catalog/?cat=gadzety_i_konsoli" },
] as const;
