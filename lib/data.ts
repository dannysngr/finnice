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
}

// Манифест содержит { "iphone-17-pro-max": 3, ... } — сколько цветов скачано
import phonesManifest from "@/public/images/phones/manifest.json";
const MANIFEST: Record<string, number> = phonesManifest as Record<string, number>;

/** Возвращает массив URL картинок товара (по числу скачанных цветов).
 *  Если в манифесте нет записи — fallback на старое имя без суффикса. */
const A = (filename: string): string[] => {
  const count = MANIFEST[filename] ?? 0;
  if (count <= 0) return [`/images/phones/${filename}.jpg`];
  return Array.from({ length: count }, (_, i) => `/images/phones/${filename}-${i + 1}.jpg`);
};

export const PHONES_CATALOG: PhoneItem[] = [

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
}

export const PRODUCTS: Product[] = [
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
    img:"/images/phones/macbook-pro-spaceblack.jpg", memories:["1 ТБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:6,
    description:"MacBook Pro 16\" M5 Max 64 ГБ — абсолютный флагман: 40-ядерный GPU, Thunderbolt 5, нанотекстурное стекло.",
    specs:[{key:"Дисплей",val:'16.2" Liquid Retina XDR 120 Гц'},{key:"Процессор",val:"Apple M5 Max"},{key:"ОЗУ",val:"64 ГБ"},{key:"Накопитель",val:"1 ТБ SSD"},{key:"GPU",val:"40-ядерный"},{key:"Автономность",val:"до 22 ч"}] },
  { id:"mbp16-m5max-48-1tb",  name:'MacBook Pro 16" M5 Max 48/1TB', slug:"mbp16-m5max-48-1tb",
    category:"noutbuki", brand:"Apple", price:549990, badge:"Новинка", year:2026, emoji:"💻",
    img:"/images/phones/macbook-pro-spaceblack.jpg", memories:["1 ТБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:9,
    description:"MacBook Pro 16\" M5 Max — для 3D-рендера, ML и видеомонтажа 8K без компромиссов.",
    specs:[{key:"Дисплей",val:'16.2" Liquid Retina XDR 120 Гц'},{key:"Процессор",val:"Apple M5 Max"},{key:"ОЗУ",val:"48 ГБ"},{key:"Накопитель",val:"1 ТБ SSD"},{key:"GPU",val:"40-ядерный"},{key:"Автономность",val:"до 22 ч"}] },
  { id:"mbp16-m5pro-24-1tb",  name:'MacBook Pro 16" M5 Pro 24/1TB', slug:"mbp16-m5pro-24-1tb",
    category:"noutbuki", brand:"Apple", price:444990, badge:"Новинка", year:2026, emoji:"💻",
    img:"/images/phones/macbook-pro-silver.jpg", memories:["1 ТБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:14,
    description:"MacBook Pro 16\" M5 Pro 24 ГБ — большой экран и мощность Pro для разработчиков и дизайнеров.",
    specs:[{key:"Дисплей",val:'16.2" Liquid Retina XDR 120 Гц'},{key:"Процессор",val:"Apple M5 Pro"},{key:"ОЗУ",val:"24 ГБ"},{key:"Накопитель",val:"1 ТБ SSD"},{key:"GPU",val:"20-ядерный"},{key:"Автономность",val:"до 22 ч"}] },
  { id:"mbp16-m5pro-24-512",  name:'MacBook Pro 16" M5 Pro 24/512', slug:"mbp16-m5pro-24-512",
    category:"noutbuki", brand:"Apple", price:399990, badge:"Новинка", year:2026, emoji:"💻",
    img:"/images/phones/macbook-pro-silver.jpg", memories:["512 ГБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:18,
    description:"MacBook Pro 16\" M5 Pro — идеальный баланс экрана, мощности и цены в линейке Pro.",
    specs:[{key:"Дисплей",val:'16.2" Liquid Retina XDR 120 Гц'},{key:"Процессор",val:"Apple M5 Pro"},{key:"ОЗУ",val:"24 ГБ"},{key:"Накопитель",val:"512 ГБ SSD"},{key:"GPU",val:"20-ядерный"},{key:"Автономность",val:"до 22 ч"}] },
  { id:"mbp14-m5pro-24-1tb",  name:'MacBook Pro 14" M5 Pro 24/1TB', slug:"mbp14-m5pro-24-1tb",
    category:"noutbuki", brand:"Apple", price:374990, badge:"Новинка", year:2026, emoji:"💻",
    img:"/images/phones/macbook-pro-spaceblack.jpg", memories:["1 ТБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:22,
    description:"MacBook Pro 14\" M5 Pro — компактный профессиональный ноутбук с дисплеем Liquid Retina XDR и Thunderbolt 5.",
    specs:[{key:"Дисплей",val:'14.2" Liquid Retina XDR 120 Гц'},{key:"Процессор",val:"Apple M5 Pro"},{key:"ОЗУ",val:"24 ГБ"},{key:"Накопитель",val:"1 ТБ SSD"},{key:"GPU",val:"20-ядерный"},{key:"Автономность",val:"до 17 ч"}] },
  { id:"mbp14-m5pro-24-512",  name:'MacBook Pro 14" M5 Pro 24/512', slug:"mbp14-m5pro-24-512",
    category:"noutbuki", brand:"Apple", price:334990, badge:"Новинка", year:2026, emoji:"💻",
    img:"/images/phones/macbook-pro-spaceblack.jpg", memories:["512 ГБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:31,
    description:"MacBook Pro 14\" M5 Pro 512 ГБ — топовая производительность в компактном корпусе.",
    specs:[{key:"Дисплей",val:'14.2" Liquid Retina XDR 120 Гц'},{key:"Процессор",val:"Apple M5 Pro"},{key:"ОЗУ",val:"24 ГБ"},{key:"Накопитель",val:"512 ГБ SSD"},{key:"GPU",val:"20-ядерный"},{key:"Автономность",val:"до 17 ч"}] },
  { id:"mbp14-m5-24-512",     name:'MacBook Pro 14" M5 24/512',     slug:"mbp14-m5-24-512",
    category:"noutbuki", brand:"Apple", price:264990, year:2026, emoji:"💻",
    img:"/images/phones/macbook-pro-silver.jpg", memories:["512 ГБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:40,
    description:"MacBook Pro 14\" M5 — базовый Pro с чипом M5 и дисплеем Liquid Retina XDR. Лучше любого конкурента.",
    specs:[{key:"Дисплей",val:'14.2" Liquid Retina XDR 120 Гц'},{key:"Процессор",val:"Apple M5"},{key:"ОЗУ",val:"24 ГБ"},{key:"Накопитель",val:"512 ГБ SSD"},{key:"GPU",val:"14-ядерный"},{key:"Автономность",val:"до 17 ч"}] },

  // ── MacBook Air M4  (2025) ────────────────────────────────────
  { id:"mba15-m4-16-512", name:'MacBook Air 15" M4 16/512', slug:"mba15-m4-16-512",
    category:"noutbuki", brand:"Apple", price:174990, badge:"Хит", year:2025, emoji:"💻",
    img:"/images/phones/macbook-air-m4.jpg", memories:["512 ГБ"],
    colors:["Sky Blue (Небесно-голубой)","Starlight (Звёздный свет)","Midnight (Полночь)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:67,
    description:"MacBook Air 15\" M4 — самый тонкий 15\" ноутбук. Без вентилятора, до 18 ч автономности, два внешних дисплея.",
    specs:[{key:"Дисплей",val:'15.3" Liquid Retina'},{key:"Процессор",val:"Apple M4"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"512 ГБ SSD"},{key:"Автономность",val:"до 18 ч"}] },
  { id:"mba15-m4-16-256", name:'MacBook Air 15" M4 16/256', slug:"mba15-m4-16-256",
    category:"noutbuki", brand:"Apple", price:149990, year:2025, emoji:"💻",
    img:"/images/phones/macbook-air-m4.jpg", memories:["256 ГБ"],
    colors:["Sky Blue (Небесно-голубой)","Starlight (Звёздный свет)","Midnight (Полночь)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:93,
    description:"MacBook Air 15\" M4 256 ГБ — бесшумный мощный ноутбук с большим дисплеем по доступной цене.",
    specs:[{key:"Дисплей",val:'15.3" Liquid Retina'},{key:"Процессор",val:"Apple M4"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"256 ГБ SSD"},{key:"Автономность",val:"до 18 ч"}] },
  { id:"mba13-m4-16-512", name:'MacBook Air 13" M4 16/512', slug:"mba13-m4-16-512",
    category:"noutbuki", brand:"Apple", price:149990, badge:"Хит", year:2025, emoji:"💻",
    img:"/images/phones/macbook-air-m4.jpg", memories:["512 ГБ"],
    colors:["Sky Blue (Небесно-голубой)","Starlight (Звёздный свет)","Midnight (Полночь)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:115,
    description:"MacBook Air 13\" M4 — самый продаваемый ноутбук Apple. Лёгкий (1.24 кг), тихий и невероятно быстрый.",
    specs:[{key:"Дисплей",val:'13.6" Liquid Retina'},{key:"Процессор",val:"Apple M4"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"512 ГБ SSD"},{key:"Автономность",val:"до 18 ч"}] },
  { id:"mba13-m4-16-256", name:'MacBook Air 13" M4 16/256', slug:"mba13-m4-16-256",
    category:"noutbuki", brand:"Apple", price:119990, year:2025, emoji:"💻",
    img:"/images/phones/macbook-air-m4.jpg", memories:["256 ГБ"],
    colors:["Sky Blue (Небесно-голубой)","Starlight (Звёздный свет)","Midnight (Полночь)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:142,
    description:"MacBook Air 13\" M4 256 ГБ — лучший ноутбук для учёбы и работы. Удар по кошельку минимальный.",
    specs:[{key:"Дисплей",val:'13.6" Liquid Retina'},{key:"Процессор",val:"Apple M4"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"256 ГБ SSD"},{key:"Автономность",val:"до 18 ч"}] },

  // ── Mac Studio  (2025) ────────────────────────────────────────
  { id:"mac-studio-m4ultra-1tb", name:"Mac Studio M4 Ultra 64/1TB", slug:"mac-studio-m4ultra-1tb",
    category:"noutbuki", brand:"Apple", price:429990, badge:"Мощь", year:2025, emoji:"🖥️",
    img:"/images/phones/mac-studio.jpg", memories:["1 ТБ"],
    colors:["Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:4,
    description:"Mac Studio M4 Ultra — рабочая станция с 64-ядерным GPU и памятью до 192 ГБ. Для тяжёлого профессионального контента.",
    specs:[{key:"Процессор",val:"Apple M4 Ultra"},{key:"ОЗУ",val:"64 ГБ"},{key:"GPU",val:"64-ядерный"},{key:"Накопитель",val:"1 ТБ SSD"},{key:"Порты",val:"Thunderbolt 5 × 4"}] },
  { id:"mac-studio-m4max-512", name:"Mac Studio M4 Max 36/512", slug:"mac-studio-m4max-512",
    category:"noutbuki", brand:"Apple", price:214990, year:2025, emoji:"🖥️",
    img:"/images/phones/mac-studio.jpg", memories:["512 ГБ"],
    colors:["Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:7,
    description:"Mac Studio M4 Max — мощнейший компактный десктоп для видео, 3D и музыки без шума.",
    specs:[{key:"Процессор",val:"Apple M4 Max"},{key:"ОЗУ",val:"36 ГБ"},{key:"GPU",val:"40-ядерный"},{key:"Накопитель",val:"512 ГБ SSD"},{key:"Порты",val:"Thunderbolt 5 × 3"}] },

  // ── Mac mini M4  (2024) ───────────────────────────────────────
  { id:"mac-mini-m4pro-24-1tb", name:"Mac mini M4 Pro 24/1TB",  slug:"mac-mini-m4pro-24-1tb",
    category:"noutbuki", brand:"Apple", price:124990, year:2024, emoji:"🖥️",
    img:"/images/phones/mac-mini.jpg", memories:["1 ТБ"],
    colors:["Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:11,
    description:"Mac mini M4 Pro — профессиональная мощность в корпусе 5×5 дюймов. До двух дисплеев 6K.",
    specs:[{key:"Процессор",val:"Apple M4 Pro"},{key:"ОЗУ",val:"24 ГБ"},{key:"GPU",val:"20-ядерный"},{key:"Накопитель",val:"1 ТБ SSD"}] },
  { id:"mac-mini-m4pro-24-512", name:"Mac mini M4 Pro 24/512",  slug:"mac-mini-m4pro-24-512",
    category:"noutbuki", brand:"Apple", price:104990, year:2024, emoji:"🖥️",
    img:"/images/phones/mac-mini.jpg", memories:["512 ГБ"],
    colors:["Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:17,
    description:"Mac mini M4 Pro 512 ГБ — быстрый и тихий десктоп для всего.",
    specs:[{key:"Процессор",val:"Apple M4 Pro"},{key:"ОЗУ",val:"24 ГБ"},{key:"GPU",val:"20-ядерный"},{key:"Накопитель",val:"512 ГБ SSD"}] },
  { id:"mac-mini-m4-16-1tb",   name:"Mac mini M4 16/1TB",      slug:"mac-mini-m4-16-1tb",
    category:"noutbuki", brand:"Apple", price:89990,  year:2024, emoji:"🖥️",
    img:"/images/phones/mac-mini.jpg", memories:["1 ТБ"],
    colors:["Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:24,
    description:"Mac mini M4 1 ТБ — максимальное хранилище в базовом mini.",
    specs:[{key:"Процессор",val:"Apple M4"},{key:"ОЗУ",val:"16 ГБ"},{key:"GPU",val:"10-ядерный"},{key:"Накопитель",val:"1 ТБ SSD"}] },
  { id:"mac-mini-m4-16-512",   name:"Mac mini M4 16/512",      slug:"mac-mini-m4-16-512",
    category:"noutbuki", brand:"Apple", price:72990,  year:2024, emoji:"🖥️",
    img:"/images/phones/mac-mini.jpg", memories:["512 ГБ"],
    colors:["Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:36,
    description:"Mac mini M4 512 ГБ — самый популярный вариант: скорость + запас пространства.",
    specs:[{key:"Процессор",val:"Apple M4"},{key:"ОЗУ",val:"16 ГБ"},{key:"GPU",val:"10-ядерный"},{key:"Накопитель",val:"512 ГБ SSD"}] },
  { id:"mac-mini-m4-16-256",   name:"Mac mini M4 16/256",      slug:"mac-mini-m4-16-256",
    category:"noutbuki", brand:"Apple", price:57990,  year:2024, emoji:"🖥️",
    img:"/images/phones/mac-mini.jpg", memories:["256 ГБ"],
    colors:["Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:49,
    description:"Mac mini M4 — самый доступный способ войти в экосистему Apple Mac.",
    specs:[{key:"Процессор",val:"Apple M4"},{key:"ОЗУ",val:"16 ГБ"},{key:"GPU",val:"10-ядерный"},{key:"Накопитель",val:"256 ГБ SSD"}] },

  // ── iMac 24" M4  (2024) ───────────────────────────────────────
  { id:"imac24-m4-blue-256",   name:'iMac 24" M4 Blue 16/256',  slug:"imac24-m4-blue-256",
    category:"noutbuki", brand:"Apple", price:139990, badge:"Новинка", year:2024, emoji:"🖥️",
    img:"/images/phones/imac-blue.jpg", memories:["256 ГБ"],
    colors:["Blue (Синий)"], inStock:true, rating:5, reviewCount:19,
    description:"iMac 24\" M4 в цвете Blue — моноблок толщиной 11.5 мм с дисплеем 4.5K Retina и камерой 12 Мп.",
    specs:[{key:"Дисплей",val:'24" 4.5K Retina'},{key:"Процессор",val:"Apple M4"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"256 ГБ SSD"}] },
  { id:"imac24-m4-pink-256",   name:'iMac 24" M4 Pink 16/256',  slug:"imac24-m4-pink-256",
    category:"noutbuki", brand:"Apple", price:139990, badge:"Новинка", year:2024, emoji:"🖥️",
    img:"/images/phones/imac-pink.jpg", memories:["256 ГБ"],
    colors:["Pink (Розовый)"], inStock:true, rating:5, reviewCount:14,
    description:"iМac 24\" M4 Pink — стильный моноблок с M4 и дисплеем 4.5K Retina. Украсит любой интерьер.",
    specs:[{key:"Дисплей",val:'24" 4.5K Retina'},{key:"Процессор",val:"Apple M4"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"256 ГБ SSD"}] },
  { id:"imac24-m4-purple-256", name:'iMac 24" M4 Purple 16/256',slug:"imac24-m4-purple-256",
    category:"noutbuki", brand:"Apple", price:139990, badge:"Новинка", year:2024, emoji:"🖥️",
    img:"/images/phones/imac-purple.jpg", memories:["256 ГБ"],
    colors:["Purple (Фиолетовый)"], inStock:true, rating:5, reviewCount:12,
    description:"iMac 24\" M4 Purple — чип M4 в самом красивом оттенке линейки iMac.",
    specs:[{key:"Дисплей",val:'24" 4.5K Retina'},{key:"Процессор",val:"Apple M4"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"256 ГБ SSD"}] },
  { id:"imac24-m4-silver-256", name:'iMac 24" M4 Silver 16/256',slug:"imac24-m4-silver-256",
    category:"noutbuki", brand:"Apple", price:139990, badge:"Новинка", year:2024, emoji:"🖥️",
    img:"/images/phones/imac-silver.jpg", memories:["256 ГБ"],
    colors:["Silver (Серебристый)"], inStock:true, rating:5, reviewCount:22,
    description:"iMac 24\" M4 Silver — классический цвет, современный чип M4 и 4.5K-дисплей.",
    specs:[{key:"Дисплей",val:'24" 4.5K Retina'},{key:"Процессор",val:"Apple M4"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"256 ГБ SSD"}] },

  // ── Lenovo (not Apple, sorts by price) ───────────────────────
  { id:"lenovo-ideapad-5-512", name:'Lenovo IdeaPad 5 15" i5/16/512', slug:"lenovo-ideapad-5-15-i5",
    category:"noutbuki", brand:"Lenovo", price:74990, emoji:"💻",
    memories:["512 ГБ"], colors:["Серый","Синий"],
    inStock:true, rating:4, reviewCount:33,
    description:"Надёжный ноутбук для работы и учёбы с Intel Core i5, 16 ГБ RAM и быстрым SSD.",
    specs:[{key:"Дисплей",val:'15.6" IPS FullHD'},{key:"Процессор",val:"Intel Core i5-1335U"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"512 ГБ SSD"},{key:"Автономность",val:"до 9 ч"}] },

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

  // ── Apple Watch Ultra 3  (2025) ───────────────────────────────
  { id:"watch-ultra3-49", name:"Apple Watch Ultra 3 49mm", slug:"watch-ultra3-49",
    category:"smart_chasy", brand:"Apple", price:104990, badge:"Новинка", year:2025, emoji:"⌚",
    img:"/images/phones/watch-ultra3.jpg", memories:["64 ГБ"],
    colors:["Natural Titanium (Натуральный титан)","Black Titanium (Чёрный титан)"],
    inStock:true, rating:5, reviewCount:8,
    description:"Apple Watch Ultra 3 — флагман с двойным GPS L1+L5, 72 ч автономности и дисплеем 3000 нит. Сертифицирован для дайвинга до 100 м.",
    specs:[{key:"Корпус",val:"49 мм, титан класса 5"},{key:"Дисплей",val:"LTPO OLED, 3000 нит"},{key:"Чип",val:"Apple S11"},{key:"GPS",val:"Двойной L1+L5"},{key:"Автономность",val:"до 72 ч"},{key:"Защита",val:"IP6X, 100 м WR"},{key:"ОС",val:"watchOS 12"}] },

  // ── Apple Watch Ultra 2  (2023) ───────────────────────────────
  { id:"watch-ultra2-49", name:"Apple Watch Ultra 2 49mm", slug:"watch-ultra2-49",
    category:"smart_chasy", brand:"Apple", price:84990, year:2023, emoji:"⌚",
    img:"/images/phones/wultra2.jpg", memories:["64 ГБ"],
    colors:["Natural Titanium (Натуральный титан)","Black Titanium (Чёрный титан)"],
    inStock:true, rating:5, reviewCount:27,
    description:"Apple Watch Ultra 2 — предыдущий Ultra с дисплеем 3000 нит, двойным GPS и автономностью 60 ч. Отличный выбор для экстремального спорта.",
    specs:[{key:"Корпус",val:"49 мм, титан класса 5"},{key:"Дисплей",val:"LTPO OLED, 3000 нит"},{key:"Чип",val:"Apple S9"},{key:"GPS",val:"Двойной L1+L5"},{key:"Автономность",val:"до 60 ч"},{key:"Защита",val:"IP6X, 100 м WR"},{key:"ОС",val:"watchOS 12"}] },

  // ── Apple Watch Series 11  (2025) ─────────────────────────────
  { id:"watch-s11-45", name:"Apple Watch Series 11 45mm", slug:"watch-s11-45",
    category:"smart_chasy", brand:"Apple", price:54990, badge:"Новинка", year:2025, emoji:"⌚",
    img:"/images/phones/watch-s11.jpg", memories:["64 ГБ"],
    colors:["Rose Gold (Розовое золото)","Midnight (Полночь)","Starlight (Звёздный свет)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:31,
    description:"Apple Watch Series 11 45mm — чип S11, Advanced Health Monitoring, 36 ч автономности и яркость 2000 нит.",
    specs:[{key:"Корпус",val:"45 мм, алюминий"},{key:"Дисплей",val:"LTPO OLED, 2000 нит"},{key:"Чип",val:"Apple S11"},{key:"GPS",val:"L1+L5"},{key:"Автономность",val:"до 36 ч"},{key:"Защита",val:"IP6X, 50 м WR"},{key:"ОС",val:"watchOS 12"}] },
  { id:"watch-s11-41", name:"Apple Watch Series 11 41mm", slug:"watch-s11-41",
    category:"smart_chasy", brand:"Apple", price:44990, badge:"Новинка", year:2025, emoji:"⌚",
    img:"/images/phones/watch-s11.jpg", memories:["64 ГБ"],
    colors:["Rose Gold (Розовое золото)","Midnight (Полночь)","Starlight (Звёздный свет)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:44,
    description:"Apple Watch Series 11 41mm — компактный вариант Series 11 с теми же флагманскими датчиками здоровья.",
    specs:[{key:"Корпус",val:"41 мм, алюминий"},{key:"Дисплей",val:"LTPO OLED, 2000 нит"},{key:"Чип",val:"Apple S11"},{key:"GPS",val:"L1+L5"},{key:"Автономность",val:"до 36 ч"},{key:"Защита",val:"IP6X, 50 м WR"},{key:"ОС",val:"watchOS 12"}] },

  // ── Apple Watch Series 10  (2024) ─────────────────────────────
  { id:"watch-s10-46", name:"Apple Watch Series 10 46mm", slug:"watch-s10-46",
    category:"smart_chasy", brand:"Apple", price:39990, year:2024, emoji:"⌚",
    img:"/images/phones/ws10.jpg", memories:["64 ГБ"],
    colors:["Rose Gold (Розовое золото)","Midnight (Полночь)","Starlight (Звёздный свет)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:58,
    description:"Apple Watch Series 10 46mm — тончайший корпус 9.7 мм, быстрая зарядка 30% за 30 мин и улучшенный Sleep Apnea мониторинг.",
    specs:[{key:"Корпус",val:"46 мм, алюминий, 9.7 мм"},{key:"Дисплей",val:"LTPO OLED, 2000 нит"},{key:"Чип",val:"Apple S10"},{key:"GPS",val:"L1+L5"},{key:"Автономность",val:"до 36 ч"},{key:"Защита",val:"IP6X, 50 м WR"},{key:"ОС",val:"watchOS 12"}] },
  { id:"watch-s10-42", name:"Apple Watch Series 10 42mm", slug:"watch-s10-42",
    category:"smart_chasy", brand:"Apple", price:34990, year:2024, emoji:"⌚",
    img:"/images/phones/ws10.jpg", memories:["64 ГБ"],
    colors:["Rose Gold (Розовое золото)","Midnight (Полночь)","Starlight (Звёздный свет)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:72,
    description:"Apple Watch Series 10 42mm — самые тонкие часы Apple в компактном размере с полным набором датчиков.",
    specs:[{key:"Корпус",val:"42 мм, алюминий, 9.7 мм"},{key:"Дисплей",val:"LTPO OLED, 2000 нит"},{key:"Чип",val:"Apple S10"},{key:"GPS",val:"L1+L5"},{key:"Автономность",val:"до 36 ч"},{key:"Защита",val:"IP6X, 50 м WR"},{key:"ОС",val:"watchOS 12"}] },

  // ── Apple Watch Series 9  (2023) ──────────────────────────────
  { id:"watch-s9-45", name:"Apple Watch Series 9 45mm", slug:"watch-s9-45",
    category:"smart_chasy", brand:"Apple", price:29990, year:2023, emoji:"⌚",
    img:"/images/phones/ws9.jpg", memories:["64 ГБ"],
    colors:["Pink (Розовый)","Midnight (Полночь)","Starlight (Звёздный свет)","Silver (Серебристый)","Red (PRODUCT(RED))"],
    inStock:true, rating:5, reviewCount:103,
    description:"Apple Watch Series 9 45mm — чип S9, жест «Двойное касание», яркость 2000 нит и точный датчик температуры.",
    specs:[{key:"Корпус",val:"45 мм, алюминий"},{key:"Дисплей",val:"LTPO OLED, 2000 нит"},{key:"Чип",val:"Apple S9"},{key:"GPS",val:"L1+L5"},{key:"Автономность",val:"до 18 ч"},{key:"Защита",val:"IP6X, 50 м WR"},{key:"ОС",val:"watchOS 12"}] },
  { id:"watch-s9-41", name:"Apple Watch Series 9 41mm", slug:"watch-s9-41",
    category:"smart_chasy", brand:"Apple", price:24990, year:2023, emoji:"⌚",
    img:"/images/phones/ws9.jpg", memories:["64 ГБ"],
    colors:["Pink (Розовый)","Midnight (Полночь)","Starlight (Звёздный свет)","Silver (Серебристый)","Red (PRODUCT(RED))"],
    inStock:true, rating:5, reviewCount:134,
    description:"Apple Watch Series 9 41mm — компактный вариант Series 9 с жестом двойного касания и дисплеем 2000 нит.",
    specs:[{key:"Корпус",val:"41 мм, алюминий"},{key:"Дисплей",val:"LTPO OLED, 2000 нит"},{key:"Чип",val:"Apple S9"},{key:"GPS",val:"L1+L5"},{key:"Автономность",val:"до 18 ч"},{key:"Защита",val:"IP6X, 50 м WR"},{key:"ОС",val:"watchOS 12"}] },

  // ── Apple Watch SE 3  (2024) ──────────────────────────────────
  { id:"watch-se3-44", name:"Apple Watch SE 3 44mm", slug:"watch-se3-44",
    category:"smart_chasy", brand:"Apple", price:27990, year:2024, emoji:"⌚",
    img:"/images/phones/watch-se3.jpg", memories:["32 ГБ"],
    colors:["Midnight (Полночь)","Starlight (Звёздный свет)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:89,
    description:"Apple Watch SE 3 44mm — доступные умные часы Apple с чипом S9, мониторингом сердца и аварийным вызовом SOS.",
    specs:[{key:"Корпус",val:"44 мм, алюминий"},{key:"Дисплей",val:"LTPO OLED"},{key:"Чип",val:"Apple S9"},{key:"GPS",val:"L1"},{key:"Автономность",val:"до 18 ч"},{key:"Защита",val:"IP6X, 50 м WR"},{key:"ОС",val:"watchOS 12"}] },
  { id:"watch-se3-40", name:"Apple Watch SE 3 40mm", slug:"watch-se3-40",
    category:"smart_chasy", brand:"Apple", price:22990, year:2024, emoji:"⌚",
    img:"/images/phones/watch-se3.jpg", memories:["32 ГБ"],
    colors:["Midnight (Полночь)","Starlight (Звёздный свет)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:116,
    description:"Apple Watch SE 3 40mm — самые доступные часы Apple с GPS и мониторингом здоровья.",
    specs:[{key:"Корпус",val:"40 мм, алюминий"},{key:"Дисплей",val:"LTPO OLED"},{key:"Чип",val:"Apple S9"},{key:"GPS",val:"L1"},{key:"Автономность",val:"до 18 ч"},{key:"Защита",val:"IP6X, 50 м WR"},{key:"ОС",val:"watchOS 12"}] },

  /* ══════════════════════════════════════════════════════════════
     ПЛАНШЕТЫ  (год ↓, цена ↓)
  ══════════════════════════════════════════════════════════════ */

  // ── iPad Pro M5  (2026) ───────────────────────────────────────
  { id:"ipad-pro13-m5-2tb", name:'iPad Pro 13" M5 Wi-Fi 2TB',  slug:"ipad-pro13-m5-2tb",
    category:"planshety", brand:"Apple", price:289990, badge:"Новинка", year:2026, emoji:"📱",
    img:"/images/phones/ipad-pro.jpg", memories:["2 ТБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:4,
    description:"iPad Pro 13\" M5 2 ТБ — максимальная конфигурация флагманского планшета. OLED Ultra Retina XDR, чип M5 и 16 ГБ памяти.",
    specs:[{key:"Дисплей",val:'13" OLED Ultra Retina XDR'},{key:"Процессор",val:"Apple M5"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"2 ТБ"},{key:"Камера",val:"12 Мп + 12 Мп Ultra Wide"},{key:"ОС",val:"iPadOS 19"}] },
  { id:"ipad-pro13-m5-1tb", name:'iPad Pro 13" M5 Wi-Fi 1TB',  slug:"ipad-pro13-m5-1tb",
    category:"planshety", brand:"Apple", price:249990, badge:"Новинка", year:2026, emoji:"📱",
    img:"/images/phones/ipad-pro.jpg", memories:["1 ТБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:7,
    description:"iPad Pro 13\" M5 1 ТБ — профессиональный планшет с OLED-дисплеем и чипом M5 для творческих задач любой сложности.",
    specs:[{key:"Дисплей",val:'13" OLED Ultra Retina XDR'},{key:"Процессор",val:"Apple M5"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"1 ТБ"},{key:"Камера",val:"12 Мп + 12 Мп Ultra Wide"},{key:"ОС",val:"iPadOS 19"}] },
  { id:"ipad-pro13-m5-512", name:'iPad Pro 13" M5 Wi-Fi 512GB', slug:"ipad-pro13-m5-512",
    category:"planshety", brand:"Apple", price:209990, badge:"Новинка", year:2026, emoji:"📱",
    img:"/images/phones/ipad-pro.jpg", memories:["512 ГБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:11,
    description:"iPad Pro 13\" M5 512 ГБ — огромный OLED-дисплей и флагманский чип M5 для дизайна, видео и AR.",
    specs:[{key:"Дисплей",val:'13" OLED Ultra Retina XDR'},{key:"Процессор",val:"Apple M5"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"512 ГБ"},{key:"Камера",val:"12 Мп + 12 Мп Ultra Wide"},{key:"ОС",val:"iPadOS 19"}] },
  { id:"ipad-pro13-m5-256", name:'iPad Pro 13" M5 Wi-Fi 256GB', slug:"ipad-pro13-m5-256",
    category:"planshety", brand:"Apple", price:179990, badge:"Новинка", year:2026, emoji:"📱",
    img:"/images/phones/ipad-pro.jpg", memories:["256 ГБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:18,
    description:"iPad Pro 13\" M5 256 ГБ — базовый Pro с OLED-дисплеем нового поколения и непревзойдённой тонкостью корпуса 5.1 мм.",
    specs:[{key:"Дисплей",val:'13" OLED Ultra Retina XDR'},{key:"Процессор",val:"Apple M5"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"256 ГБ"},{key:"Камера",val:"12 Мп + 12 Мп Ultra Wide"},{key:"ОС",val:"iPadOS 19"}] },
  { id:"ipad-pro11-m5-2tb", name:'iPad Pro 11" M5 Wi-Fi 2TB',  slug:"ipad-pro11-m5-2tb",
    category:"planshety", brand:"Apple", price:219990, badge:"Новинка", year:2026, emoji:"📱",
    img:"/images/phones/ipad-pro.jpg", memories:["2 ТБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:5,
    description:"iPad Pro 11\" M5 2 ТБ — максимальная версия компактного Pro с OLED-дисплеем и чипом M5.",
    specs:[{key:"Дисплей",val:'11" OLED Ultra Retina XDR'},{key:"Процессор",val:"Apple M5"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"2 ТБ"},{key:"Камера",val:"12 Мп + 12 Мп Ultra Wide"},{key:"ОС",val:"iPadOS 19"}] },
  { id:"ipad-pro11-m5-1tb", name:'iPad Pro 11" M5 Wi-Fi 1TB',  slug:"ipad-pro11-m5-1tb",
    category:"planshety", brand:"Apple", price:189990, badge:"Новинка", year:2026, emoji:"📱",
    img:"/images/phones/ipad-pro.jpg", memories:["1 ТБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:9,
    description:"iPad Pro 11\" M5 1 ТБ — профессиональный компактный планшет с OLED и поддержкой Apple Pencil Pro.",
    specs:[{key:"Дисплей",val:'11" OLED Ultra Retina XDR'},{key:"Процессор",val:"Apple M5"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"1 ТБ"},{key:"Камера",val:"12 Мп + 12 Мп Ultra Wide"},{key:"ОС",val:"iPadOS 19"}] },
  { id:"ipad-pro11-m5-512", name:'iPad Pro 11" M5 Wi-Fi 512GB', slug:"ipad-pro11-m5-512",
    category:"planshety", brand:"Apple", price:159990, badge:"Новинка", year:2026, emoji:"📱",
    img:"/images/phones/ipad-pro.jpg", memories:["512 ГБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:14,
    description:"iPad Pro 11\" M5 512 ГБ — мощь M5 в компактном корпусе 5.3 мм с дисплеем OLED Ultra Retina XDR.",
    specs:[{key:"Дисплей",val:'11" OLED Ultra Retina XDR'},{key:"Процессор",val:"Apple M5"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"512 ГБ"},{key:"Камера",val:"12 Мп + 12 Мп Ultra Wide"},{key:"ОС",val:"iPadOS 19"}] },
  { id:"ipad-pro11-m5-256", name:'iPad Pro 11" M5 Wi-Fi 256GB', slug:"ipad-pro11-m5-256",
    category:"planshety", brand:"Apple", price:129990, badge:"Новинка", year:2026, emoji:"📱",
    img:"/images/phones/ipad-pro.jpg", memories:["256 ГБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:22,
    description:"iPad Pro 11\" M5 256 ГБ — базовый Pro с OLED-дисплеем. Тонкий, быстрый и невероятно мощный.",
    specs:[{key:"Дисплей",val:'11" OLED Ultra Retina XDR'},{key:"Процессор",val:"Apple M5"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"256 ГБ"},{key:"Камера",val:"12 Мп + 12 Мп Ultra Wide"},{key:"ОС",val:"iPadOS 19"}] },

  // ── iPad Pro M4  (2024) ───────────────────────────────────────
  { id:"ipad-pro13-m4-1tb", name:'iPad Pro 13" M4 Wi-Fi 1TB',  slug:"ipad-pro13-m4-1tb",
    category:"planshety", brand:"Apple", price:219990, year:2024, emoji:"📱",
    img:"/images/phones/ipad-pro.jpg", memories:["1 ТБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:16,
    description:"iPad Pro 13\" M4 1 ТБ — прошлое поколение Pro с OLED-дисплеем и чипом M4. Отличная цена на флагманский планшет.",
    specs:[{key:"Дисплей",val:'13" OLED Ultra Retina XDR'},{key:"Процессор",val:"Apple M4"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"1 ТБ"},{key:"Камера",val:"12 Мп + 12 Мп Ultra Wide"},{key:"ОС",val:"iPadOS 18"}] },
  { id:"ipad-pro13-m4-512", name:'iPad Pro 13" M4 Wi-Fi 512GB', slug:"ipad-pro13-m4-512",
    category:"planshety", brand:"Apple", price:179990, year:2024, emoji:"📱",
    img:"/images/phones/ipad-pro.jpg", memories:["512 ГБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:24,
    description:"iPad Pro 13\" M4 512 ГБ — большой OLED-экран и мощный M4 по выгодной цене.",
    specs:[{key:"Дисплей",val:'13" OLED Ultra Retina XDR'},{key:"Процессор",val:"Apple M4"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"512 ГБ"},{key:"Камера",val:"12 Мп + 12 Мп Ultra Wide"},{key:"ОС",val:"iPadOS 18"}] },
  { id:"ipad-pro13-m4-256", name:'iPad Pro 13" M4 Wi-Fi 256GB', slug:"ipad-pro13-m4-256",
    category:"planshety", brand:"Apple", price:149990, year:2024, emoji:"📱",
    img:"/images/phones/ipad-pro.jpg", memories:["256 ГБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:34,
    description:"iPad Pro 13\" M4 256 ГБ — самый доступный 13\" Pro с OLED и чипом M4.",
    specs:[{key:"Дисплей",val:'13" OLED Ultra Retina XDR'},{key:"Процессор",val:"Apple M4"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"256 ГБ"},{key:"Камера",val:"12 Мп + 12 Мп Ultra Wide"},{key:"ОС",val:"iPadOS 18"}] },
  { id:"ipad-pro11-m4-1tb", name:'iPad Pro 11" M4 Wi-Fi 1TB',  slug:"ipad-pro11-m4-1tb",
    category:"planshety", brand:"Apple", price:169990, year:2024, emoji:"📱",
    img:"/images/phones/ipad-pro.jpg", memories:["1 ТБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:28,
    description:"iPad Pro 11\" M4 1 ТБ — компактный Pro с OLED-дисплеем и чипом M4 в максимальной конфигурации хранилища.",
    specs:[{key:"Дисплей",val:'11" OLED Ultra Retina XDR'},{key:"Процессор",val:"Apple M4"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"1 ТБ"},{key:"Камера",val:"12 Мп + 12 Мп Ultra Wide"},{key:"ОС",val:"iPadOS 18"}] },
  { id:"ipad-pro11-m4-512", name:'iPad Pro 11" M4 Wi-Fi 512GB', slug:"ipad-pro11-m4-512",
    category:"planshety", brand:"Apple", price:139990, year:2024, emoji:"📱",
    img:"/images/phones/ipad-pro.jpg", memories:["512 ГБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:41,
    description:"iPad Pro 11\" M4 512 ГБ — идеальный баланс мощности и цены в линейке Pro.",
    specs:[{key:"Дисплей",val:'11" OLED Ultra Retina XDR'},{key:"Процессор",val:"Apple M4"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"512 ГБ"},{key:"Камера",val:"12 Мп + 12 Мп Ultra Wide"},{key:"ОС",val:"iPadOS 18"}] },
  { id:"ipad-pro11-m4-256", name:'iPad Pro 11" M4 Wi-Fi 256GB', slug:"ipad-pro11-m4-256",
    category:"planshety", brand:"Apple", price:109990, year:2024, emoji:"📱",
    img:"/images/phones/ipad-pro.jpg", memories:["256 ГБ"],
    colors:["Space Black (Космический чёрный)","Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:56,
    description:"iPad Pro 11\" M4 256 ГБ — доступный вход в линейку Pro с OLED и чипом M4.",
    specs:[{key:"Дисплей",val:'11" OLED Ultra Retina XDR'},{key:"Процессор",val:"Apple M4"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"256 ГБ"},{key:"Камера",val:"12 Мп + 12 Мп Ultra Wide"},{key:"ОС",val:"iPadOS 18"}] },

  // ── iPad Air M3  (2025) ───────────────────────────────────────
  { id:"ipad-air13-m3-512", name:'iPad Air 13" M3 Wi-Fi 512GB', slug:"ipad-air13-m3-512",
    category:"planshety", brand:"Apple", price:129990, badge:"Хит", year:2025, emoji:"📱",
    img:"/images/phones/ipad-air.jpg", memories:["512 ГБ"],
    colors:["Blue (Синий)","Purple (Фиолетовый)","Starlight (Звёздный свет)","Space Gray (Серый космос)"],
    inStock:true, rating:5, reviewCount:19,
    description:"iPad Air 13\" M3 512 ГБ — лёгкий и тонкий планшет с большим дисплеем Liquid Retina и чипом M3.",
    specs:[{key:"Дисплей",val:'13" Liquid Retina, 2732×2048'},{key:"Процессор",val:"Apple M3"},{key:"ОЗУ",val:"8 ГБ"},{key:"Накопитель",val:"512 ГБ"},{key:"Камера",val:"12 Мп Wide"},{key:"ОС",val:"iPadOS 18"}] },
  { id:"ipad-air13-m3-256", name:'iPad Air 13" M3 Wi-Fi 256GB', slug:"ipad-air13-m3-256",
    category:"planshety", brand:"Apple", price:99990, badge:"Хит", year:2025, emoji:"📱",
    img:"/images/phones/ipad-air.jpg", memories:["256 ГБ"],
    colors:["Blue (Синий)","Purple (Фиолетовый)","Starlight (Звёздный свет)","Space Gray (Серый космос)"],
    inStock:true, rating:5, reviewCount:31,
    description:"iPad Air 13\" M3 256 ГБ — просторный экран и отличная производительность для работы и учёбы.",
    specs:[{key:"Дисплей",val:'13" Liquid Retina, 2732×2048'},{key:"Процессор",val:"Apple M3"},{key:"ОЗУ",val:"8 ГБ"},{key:"Накопитель",val:"256 ГБ"},{key:"Камера",val:"12 Мп Wide"},{key:"ОС",val:"iPadOS 18"}] },
  { id:"ipad-air13-m3-128", name:'iPad Air 13" M3 Wi-Fi 128GB', slug:"ipad-air13-m3-128",
    category:"planshety", brand:"Apple", price:84990, year:2025, emoji:"📱",
    img:"/images/phones/ipad-air.jpg", memories:["128 ГБ"],
    colors:["Blue (Синий)","Purple (Фиолетовый)","Starlight (Звёздный свет)","Space Gray (Серый космос)"],
    inStock:true, rating:5, reviewCount:44,
    description:"iPad Air 13\" M3 128 ГБ — базовая версия 13\" Air с чипом M3 и дисплеем Liquid Retina.",
    specs:[{key:"Дисплей",val:'13" Liquid Retina, 2732×2048'},{key:"Процессор",val:"Apple M3"},{key:"ОЗУ",val:"8 ГБ"},{key:"Накопитель",val:"128 ГБ"},{key:"Камера",val:"12 Мп Wide"},{key:"ОС",val:"iPadOS 18"}] },
  { id:"ipad-air11-m3-512", name:'iPad Air 11" M3 Wi-Fi 512GB', slug:"ipad-air11-m3-512",
    category:"planshety", brand:"Apple", price:99990, badge:"Хит", year:2025, emoji:"📱",
    img:"/images/phones/ipad-air.jpg", memories:["512 ГБ"],
    colors:["Blue (Синий)","Purple (Фиолетовый)","Starlight (Звёздный свет)","Space Gray (Серый космос)"],
    inStock:true, rating:5, reviewCount:38,
    description:"iPad Air 11\" M3 512 ГБ — максимальное хранилище в компактном Air с чипом M3.",
    specs:[{key:"Дисплей",val:'11" Liquid Retina, 2360×1640'},{key:"Процессор",val:"Apple M3"},{key:"ОЗУ",val:"8 ГБ"},{key:"Накопитель",val:"512 ГБ"},{key:"Камера",val:"12 Мп Wide"},{key:"ОС",val:"iPadOS 18"}] },
  { id:"ipad-air11-m3-256", name:'iPad Air 11" M3 Wi-Fi 256GB', slug:"ipad-air11-m3-256",
    category:"planshety", brand:"Apple", price:79990, year:2025, emoji:"📱",
    img:"/images/phones/ipad-air.jpg", memories:["256 ГБ"],
    colors:["Blue (Синий)","Purple (Фиолетовый)","Starlight (Звёздный свет)","Space Gray (Серый космос)"],
    inStock:true, rating:5, reviewCount:57,
    description:"iPad Air 11\" M3 256 ГБ — мощный и лёгкий планшет для каждого дня с чипом M3.",
    specs:[{key:"Дисплей",val:'11" Liquid Retina, 2360×1640'},{key:"Процессор",val:"Apple M3"},{key:"ОЗУ",val:"8 ГБ"},{key:"Накопитель",val:"256 ГБ"},{key:"Камера",val:"12 Мп Wide"},{key:"ОС",val:"iPadOS 18"}] },
  { id:"ipad-air11-m3-128", name:'iPad Air 11" M3 Wi-Fi 128GB', slug:"ipad-air11-m3-128",
    category:"planshety", brand:"Apple", price:64990, year:2025, emoji:"📱",
    img:"/images/phones/ipad-air.jpg", memories:["128 ГБ"],
    colors:["Blue (Синий)","Purple (Фиолетовый)","Starlight (Звёздный свет)","Space Gray (Серый космос)"],
    inStock:true, rating:5, reviewCount:76,
    description:"iPad Air 11\" M3 128 ГБ — базовый 11\" Air. Доступная точка входа в мощный планшет Apple.",
    specs:[{key:"Дисплей",val:'11" Liquid Retina, 2360×1640'},{key:"Процессор",val:"Apple M3"},{key:"ОЗУ",val:"8 ГБ"},{key:"Накопитель",val:"128 ГБ"},{key:"Камера",val:"12 Мп Wide"},{key:"ОС",val:"iPadOS 18"}] },

  // ── iPad Air M2  (2024) ───────────────────────────────────────
  { id:"ipad-air13-m2-128", name:'iPad Air 13" M2 Wi-Fi 128GB', slug:"ipad-air13-m2-128",
    category:"planshety", brand:"Apple", price:74990, year:2024, emoji:"📱",
    img:"/images/phones/ipad-air.jpg", memories:["128 ГБ"],
    colors:["Blue (Синий)","Purple (Фиолетовый)","Starlight (Звёздный свет)","Space Gray (Серый космос)"],
    inStock:true, rating:4, reviewCount:63,
    description:"iPad Air 13\" M2 — первый 13\" Air с чипом M2 и дисплеем Liquid Retina. Отличная альтернатива Pro по доступной цене.",
    specs:[{key:"Дисплей",val:'13" Liquid Retina, 2732×2048'},{key:"Процессор",val:"Apple M2"},{key:"ОЗУ",val:"8 ГБ"},{key:"Накопитель",val:"128 ГБ"},{key:"Камера",val:"12 Мп Wide"},{key:"ОС",val:"iPadOS 18"}] },
  { id:"ipad-air11-m2-128", name:'iPad Air 11" M2 Wi-Fi 128GB', slug:"ipad-air11-m2-128",
    category:"planshety", brand:"Apple", price:54990, year:2024, emoji:"📱",
    img:"/images/phones/ipad-air.jpg", memories:["128 ГБ"],
    colors:["Blue (Синий)","Purple (Фиолетовый)","Starlight (Звёздный свет)","Space Gray (Серый космос)"],
    inStock:true, rating:4, reviewCount:89,
    description:"iPad Air 11\" M2 — доступный Air с чипом M2 и тонким корпусом. Поддерживает Apple Pencil Pro.",
    specs:[{key:"Дисплей",val:'11" Liquid Retina, 2360×1640'},{key:"Процессор",val:"Apple M2"},{key:"ОЗУ",val:"8 ГБ"},{key:"Накопитель",val:"128 ГБ"},{key:"Камера",val:"12 Мп Wide"},{key:"ОС",val:"iPadOS 18"}] },

  // ── iPad 10th gen  (2022) ─────────────────────────────────────
  { id:"ipad10-256", name:'iPad 10.9" 10-го поколения Wi-Fi 256GB', slug:"ipad10-256",
    category:"planshety", brand:"Apple", price:49990, year:2022, emoji:"📱",
    img:"/images/phones/ipad-air.jpg", memories:["256 ГБ"],
    colors:["Blue (Синий)","Pink (Розовый)","Yellow (Жёлтый)","Silver (Серебристый)"],
    inStock:true, rating:4, reviewCount:128,
    description:"iPad 10-го поколения 256 ГБ — обновлённый дизайн, USB-C и поддержка Apple Pencil (1-го поколения). Лучший выбор для начинающих.",
    specs:[{key:"Дисплей",val:'10.9" Liquid Retina, 2360×1640'},{key:"Процессор",val:"Apple A14 Bionic"},{key:"Накопитель",val:"256 ГБ"},{key:"Камера",val:"12 Мп Wide"},{key:"ОС",val:"iPadOS 18"}] },
  { id:"ipad10-64",  name:'iPad 10.9" 10-го поколения Wi-Fi 64GB',  slug:"ipad10-64",
    category:"planshety", brand:"Apple", price:39990, year:2022, emoji:"📱",
    img:"/images/phones/ipad-air.jpg", memories:["64 ГБ"],
    colors:["Blue (Синий)","Pink (Розовый)","Yellow (Жёлтый)","Silver (Серебристый)"],
    inStock:true, rating:4, reviewCount:196,
    description:"iPad 10-го поколения 64 ГБ — самый доступный iPad с USB-C и современным дизайном без кнопки Home.",
    specs:[{key:"Дисплей",val:'10.9" Liquid Retina, 2360×1640'},{key:"Процессор",val:"Apple A14 Bionic"},{key:"Накопитель",val:"64 ГБ"},{key:"Камера",val:"12 Мп Wide"},{key:"ОС",val:"iPadOS 18"}] },

  /* ══════════════════════════════════════════════════════════════
     АКСЕССУАРЫ  (год ↓, цена ↓)
  ══════════════════════════════════════════════════════════════ */

  // ── AirPods Max 2 USB-C  (2024) ───────────────────────────────
  { id:"airpods-max2-midnight",   name:"AirPods Max 2 Midnight",   slug:"airpods-max2-midnight",
    category:"aksessuary", brand:"Apple", price:59990, badge:"Хит", year:2024, emoji:"🎧",
    img:"/images/phones/airpods-max2.jpg",
    colors:["Midnight (Полночь)"],
    inStock:true, rating:5, reviewCount:29,
    description:"AirPods Max 2 с разъёмом USB-C — накладные наушники Apple с адаптивным шумоподавлением H2, Transparency Mode и Personalised Spatial Audio.",
    specs:[{key:"Чип",val:"Apple H2"},{key:"ANC",val:"Адаптивное"},{key:"Автономность",val:"до 30 ч (с ANC)"},{key:"Разъём",val:"USB-C"},{key:"Вес",val:"385 г"},{key:"ОС",val:"iOS 17+"}] },
  { id:"airpods-max2-blue",       name:"AirPods Max 2 Blue",       slug:"airpods-max2-blue",
    category:"aksessuary", brand:"Apple", price:59990, year:2024, emoji:"🎧",
    img:"/images/phones/airpods-max2.jpg",
    colors:["Blue (Синий)"],
    inStock:true, rating:5, reviewCount:22,
    description:"AirPods Max 2 Blue — накладные наушники Apple с USB-C и адаптивным шумоподавлением в голубом цвете.",
    specs:[{key:"Чип",val:"Apple H2"},{key:"ANC",val:"Адаптивное"},{key:"Автономность",val:"до 30 ч (с ANC)"},{key:"Разъём",val:"USB-C"},{key:"Вес",val:"385 г"}] },
  { id:"airpods-max2-pink",       name:"AirPods Max 2 Pink",       slug:"airpods-max2-pink",
    category:"aksessuary", brand:"Apple", price:59990, year:2024, emoji:"🎧",
    img:"/images/phones/airpods-max2.jpg",
    colors:["Pink (Розовый)"],
    inStock:true, rating:5, reviewCount:18,
    description:"AirPods Max 2 Pink — накладные наушники Apple с USB-C в розовом цвете.",
    specs:[{key:"Чип",val:"Apple H2"},{key:"ANC",val:"Адаптивное"},{key:"Автономность",val:"до 30 ч (с ANC)"},{key:"Разъём",val:"USB-C"},{key:"Вес",val:"385 г"}] },
  { id:"airpods-max2-silver",     name:"AirPods Max 2 Silver",     slug:"airpods-max2-silver",
    category:"aksessuary", brand:"Apple", price:59990, year:2024, emoji:"🎧",
    img:"/images/phones/airpods-max2.jpg",
    colors:["Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:31,
    description:"AirPods Max 2 Silver — накладные наушники Apple с USB-C в классическом серебристом цвете.",
    specs:[{key:"Чип",val:"Apple H2"},{key:"ANC",val:"Адаптивное"},{key:"Автономность",val:"до 30 ч (с ANC)"},{key:"Разъём",val:"USB-C"},{key:"Вес",val:"385 г"}] },
  { id:"airpods-max2-starlight",  name:"AirPods Max 2 Starlight",  slug:"airpods-max2-starlight",
    category:"aksessuary", brand:"Apple", price:59990, year:2024, emoji:"🎧",
    img:"/images/phones/airpods-max2.jpg",
    colors:["Starlight (Звёздный свет)"],
    inStock:true, rating:5, reviewCount:14,
    description:"AirPods Max 2 Starlight — накладные наушники Apple в цвете «Звёздный свет» с разъёмом USB-C.",
    specs:[{key:"Чип",val:"Apple H2"},{key:"ANC",val:"Адаптивное"},{key:"Автономность",val:"до 30 ч (с ANC)"},{key:"Разъём",val:"USB-C"},{key:"Вес",val:"385 г"}] },

  // ── AirPods Pro 3  (2025) ──────────────────────────────────────
  { id:"airpods-pro3",  name:"AirPods Pro 3", slug:"airpods-pro3",
    category:"aksessuary", brand:"Apple", price:29990, badge:"Новинка", year:2025, emoji:"🎧",
    img:"/images/phones/airpods-pro3.jpg",
    colors:["White (Белый)"],
    inStock:true, rating:5, reviewCount:41,
    description:"AirPods Pro 3 — новое поколение с чипом H3, улучшенным ANC, персонализированным Spatial Audio и здоровьесберегающими функциями: мониторинг слуха, слуховой аппарат.",
    specs:[{key:"Чип",val:"Apple H3"},{key:"ANC",val:"Адаптивное + Transparency"},{key:"Автономность",val:"до 6 ч + 30 ч (кейс)"},{key:"Разъём кейса",val:"MagSafe / USB-C"},{key:"Стандарт",val:"IP54"}] },

  // ── AirPods 4  (2024) ─────────────────────────────────────────
  { id:"airpods4-anc",     name:"AirPods 4 (с активным шумоподавлением)", slug:"airpods4-anc",
    category:"aksessuary", brand:"Apple", price:19990, badge:"Хит", year:2024, emoji:"🎧",
    img:"/images/phones/airpods4-anc.jpg",
    colors:["White (Белый)"],
    inStock:true, rating:5, reviewCount:87,
    description:"AirPods 4 с активным шумоподавлением — первые полностью открытые наушники Apple с ANC. Чип H2, Spatial Audio и адаптивный звук.",
    specs:[{key:"Чип",val:"Apple H2"},{key:"ANC",val:"Есть"},{key:"Автономность",val:"до 5 ч + 30 ч (кейс)"},{key:"Кейс",val:"MagSafe / USB-C"}] },
  { id:"airpods4",         name:"AirPods 4",                               slug:"airpods4",
    category:"aksessuary", brand:"Apple", price:14990, year:2024, emoji:"🎧",
    img:"/images/phones/airpods4.jpg",
    colors:["White (Белый)"],
    inStock:true, rating:5, reviewCount:122,
    description:"AirPods 4 — обновлённый дизайн с H2, Spatial Audio и улучшенной акустикой. Без ANC, но с отличным звуком по лучшей цене.",
    specs:[{key:"Чип",val:"Apple H2"},{key:"ANC",val:"Нет"},{key:"Автономность",val:"до 5 ч + 30 ч (кейс)"},{key:"Кейс",val:"USB-C"}] },

  // ── Sony WH-1000XM6  (2025) ────────────────────────────────────
  { id:"sony-wh1000xm6",  name:"Sony WH-1000XM6", slug:"sony-wh1000xm6",
    category:"aksessuary", brand:"Sony", price:34990, badge:"Новинка", year:2025, emoji:"🎧",
    colors:["Black (Чёрный)","Platinum Silver (Платиновое серебро)"],
    inStock:true, rating:5, reviewCount:63,
    description:"Sony WH-1000XM6 — флагманские беспроводные наушники с лучшим в классе шумоподавлением Auto NC Optimizer, LDAC и 40 ч автономности.",
    specs:[{key:"ANC",val:"Auto NC Optimizer (AI)"},{key:"Кодеки",val:"LDAC, AAC, SBC"},{key:"Автономность",val:"до 40 ч"},{key:"Вес",val:"250 г"},{key:"Разъём",val:"USB-C"},{key:"Bluetooth",val:"5.3"}] },

  // ── Bose QuietComfort Ultra  (2023) ────────────────────────────
  { id:"bose-qc-ultra",   name:"Bose QuietComfort Ultra", slug:"bose-qc-ultra",
    category:"aksessuary", brand:"Bose", price:29990, year:2023, emoji:"🎧",
    colors:["Black (Чёрный)","White Smoke (Белый дым)"],
    inStock:true, rating:5, reviewCount:49,
    description:"Bose QuietComfort Ultra — лучшие наушники с иммерсивным звуком Bose Immersive Audio, высококлассным ANC и до 24 ч работы.",
    specs:[{key:"ANC",val:"CustomTune"},{key:"Звук",val:"Bose Immersive Audio"},{key:"Автономность",val:"до 24 ч"},{key:"Вес",val:"250 г"},{key:"Разъём",val:"USB-C"},{key:"Bluetooth",val:"5.3"}] },

  // ── Чехлы Apple Silicone  (2025/26) ────────────────────────────
  { id:"case-apple-sil-17pro-black",   name:"Apple Silicone Case iPhone 17 Pro Black",   slug:"case-apple-sil-17pro-black",
    category:"aksessuary", brand:"Apple", price:7490, year:2025, emoji:"📦",
    colors:["Black (Чёрный)"],
    inStock:true, rating:5, reviewCount:34,
    description:"Оригинальный силиконовый чехол Apple для iPhone 17 Pro с встроенным магнитом MagSafe. Мягкий микроволокнистый подклад.",
    specs:[{key:"Совместимость",val:"iPhone 17 Pro"},{key:"Материал",val:"Силикон"},{key:"MagSafe",val:"Да"},{key:"Кнопка",val:"Action Button совместим"}] },
  { id:"case-apple-sil-17pro-natural",name:"Apple Silicone Case iPhone 17 Pro Natural",  slug:"case-apple-sil-17pro-natural",
    category:"aksessuary", brand:"Apple", price:7490, year:2025, emoji:"📦",
    colors:["Natural (Натуральный)"],
    inStock:true, rating:5, reviewCount:28,
    description:"Оригинальный силиконовый чехол Apple для iPhone 17 Pro в цвете Natural с MagSafe.",
    specs:[{key:"Совместимость",val:"iPhone 17 Pro"},{key:"Материал",val:"Силикон"},{key:"MagSafe",val:"Да"}] },
  { id:"case-apple-sil-17promax-black",name:"Apple Silicone Case iPhone 17 Pro Max Black",slug:"case-apple-sil-17promax-black",
    category:"aksessuary", brand:"Apple", price:7490, year:2025, emoji:"📦",
    colors:["Black (Чёрный)"],
    inStock:true, rating:5, reviewCount:41,
    description:"Оригинальный силиконовый чехол Apple для iPhone 17 Pro Max с MagSafe.",
    specs:[{key:"Совместимость",val:"iPhone 17 Pro Max"},{key:"Материал",val:"Силикон"},{key:"MagSafe",val:"Да"}] },

  // ── Pitaka MagEZ Case  (2025) ──────────────────────────────────
  { id:"pitaka-magez5-17promax", name:"Pitaka MagEZ Case 5 iPhone 17 Pro Max", slug:"pitaka-magez5-17promax",
    category:"aksessuary", brand:"Pitaka", price:9990, badge:"Хит", year:2025, emoji:"📦",
    colors:["Black/Grey Twill","Black/Blue Twill","Sunset"],
    inStock:true, rating:5, reviewCount:53,
    description:"Pitaka MagEZ Case 5 для iPhone 17 Pro Max — чехол из арамидного волокна (кевлар). Толщина 0.95 мм, вес 19 г, совместим с MagSafe.",
    specs:[{key:"Совместимость",val:"iPhone 17 Pro Max"},{key:"Материал",val:"Арамидное волокно (кевлар)"},{key:"Толщина",val:"0.95 мм"},{key:"Вес",val:"19 г"},{key:"MagSafe",val:"Да (1500 г+)"}] },
  { id:"pitaka-magez5-17pro",    name:"Pitaka MagEZ Case 5 iPhone 17 Pro",     slug:"pitaka-magez5-17pro",
    category:"aksessuary", brand:"Pitaka", price:9990, year:2025, emoji:"📦",
    colors:["Black/Grey Twill","Black/Blue Twill","Sunset"],
    inStock:true, rating:5, reviewCount:44,
    description:"Pitaka MagEZ Case 5 для iPhone 17 Pro — ультратонкий арамидный чехол с MagSafe для нового Pro.",
    specs:[{key:"Совместимость",val:"iPhone 17 Pro"},{key:"Материал",val:"Арамидное волокно"},{key:"Толщина",val:"0.95 мм"},{key:"MagSafe",val:"Да"}] },
  { id:"pitaka-magez5-17",       name:"Pitaka MagEZ Case 5 iPhone 17",         slug:"pitaka-magez5-17",
    category:"aksessuary", brand:"Pitaka", price:7990, year:2025, emoji:"📦",
    colors:["Black/Grey Twill","Black/Blue Twill"],
    inStock:true, rating:5, reviewCount:38,
    description:"Pitaka MagEZ Case 5 для iPhone 17 — кевларовый чехол весом 14 г с MagSafe.",
    specs:[{key:"Совместимость",val:"iPhone 17"},{key:"Материал",val:"Арамидное волокно"},{key:"Толщина",val:"0.95 мм"},{key:"MagSafe",val:"Да"}] },
  { id:"pitaka-magez5-16promax", name:"Pitaka MagEZ Case 5 iPhone 16 Pro Max", slug:"pitaka-magez5-16promax",
    category:"aksessuary", brand:"Pitaka", price:8990, year:2024, emoji:"📦",
    colors:["Black/Grey Twill","Black/Blue Twill","Overture"],
    inStock:true, rating:5, reviewCount:67,
    description:"Pitaka MagEZ Case 5 для iPhone 16 Pro Max — ультратонкая защита из кевлара с поддержкой MagSafe.",
    specs:[{key:"Совместимость",val:"iPhone 16 Pro Max"},{key:"Материал",val:"Арамидное волокно"},{key:"Толщина",val:"0.95 мм"},{key:"MagSafe",val:"Да"}] },
  { id:"pitaka-magez5-16pro",    name:"Pitaka MagEZ Case 5 iPhone 16 Pro",     slug:"pitaka-magez5-16pro",
    category:"aksessuary", brand:"Pitaka", price:8990, year:2024, emoji:"📦",
    colors:["Black/Grey Twill","Black/Blue Twill"],
    inStock:true, rating:5, reviewCount:59,
    description:"Pitaka MagEZ Case 5 для iPhone 16 Pro — кевлар 0.95 мм с MagSafe.",
    specs:[{key:"Совместимость",val:"iPhone 16 Pro"},{key:"Материал",val:"Арамидное волокно"},{key:"Толщина",val:"0.95 мм"},{key:"MagSafe",val:"Да"}] },

  /* ══════════════════════════════════════════════════════════════
     СМАРТ-ЧАСЫ — GARMIN  (год ↓, цена ↓)
  ══════════════════════════════════════════════════════════════ */

  // ── Garmin Fenix 8  (2024) ─────────────────────────────────────
  { id:"garmin-fenix8-sap-51", name:"Garmin Fenix 8 Sapphire Solar 51mm", slug:"garmin-fenix8-sap-51",
    category:"smart_chasy", brand:"Garmin", price:109990, badge:"Флагман", year:2024, emoji:"⌚",
    colors:["Titanium/Carbon Gray DLC","Silver/Black","Ember Orange"],
    inStock:true, rating:5, reviewCount:14,
    description:"Garmin Fenix 8 Sapphire Solar 51mm — многоспортивные часы с сапфировым стеклом, солнечной зарядкой, встроенным динамиком и до 29 дней автономности.",
    specs:[{key:"Корпус",val:"51 мм, титан"},{key:"Дисплей",val:"AMOLED 1.4\""},{key:"GPS",val:"MultiGNSS + SatIQ"},{key:"Автономность",val:"до 29 дней (смарт), до 150 ч (GPS)"},{key:"Защита",val:"100 м WR, MIL-STD-810"},{key:"Динамик",val:"Есть"},{key:"ОС",val:"Garmin OS"}] },
  { id:"garmin-fenix8-sap-47", name:"Garmin Fenix 8 Sapphire Solar 47mm", slug:"garmin-fenix8-sap-47",
    category:"smart_chasy", brand:"Garmin", price:94990, year:2024, emoji:"⌚",
    colors:["Titanium/Carbon Gray DLC","Silver/Black"],
    inStock:true, rating:5, reviewCount:19,
    description:"Garmin Fenix 8 Sapphire Solar 47mm — компактный флагман Garmin с AMOLED, сапфировым стеклом и встроенным динамиком.",
    specs:[{key:"Корпус",val:"47 мм, титан"},{key:"Дисплей",val:"AMOLED 1.3\""},{key:"Автономность",val:"до 21 дня (смарт), до 110 ч (GPS)"},{key:"GPS",val:"MultiGNSS"},{key:"Защита",val:"100 м WR"}] },
  { id:"garmin-fenix8-std-51", name:"Garmin Fenix 8 Standard 51mm",       slug:"garmin-fenix8-std-51",
    category:"smart_chasy", brand:"Garmin", price:74990, year:2024, emoji:"⌚",
    colors:["Carbon Gray DLC Titanium","Slate Grey Nylon","Vapor"],
    inStock:true, rating:5, reviewCount:24,
    description:"Garmin Fenix 8 Standard 51mm — AMOLED-дисплей, встроенный динамик и микрофон для функции SOS и голосового ассистента.",
    specs:[{key:"Корпус",val:"51 мм, алюминий"},{key:"Дисплей",val:"AMOLED 1.4\""},{key:"GPS",val:"MultiGNSS"},{key:"Автономность",val:"до 16 дней (смарт)"},{key:"Защита",val:"100 м WR"}] },

  // ── Garmin Epix Gen 3  (2024) ──────────────────────────────────
  { id:"garmin-epix3-47", name:"Garmin Epix Gen 3 47mm", slug:"garmin-epix3-47",
    category:"smart_chasy", brand:"Garmin", price:74990, badge:"Новинка", year:2024, emoji:"⌚",
    colors:["Carbon Gray DLC","Whitestone"],
    inStock:true, rating:5, reviewCount:22,
    description:"Garmin Epix Gen 3 47mm — премиальные часы с AMOLED Always-On дисплеем, динамиком, автономностью 31 день и продвинутыми спортивными метриками.",
    specs:[{key:"Корпус",val:"47 мм, алюминий"},{key:"Дисплей",val:"AMOLED 1.3\" Always-On"},{key:"GPS",val:"MultiGNSS"},{key:"Автономность",val:"до 31 дня (смарт)"},{key:"Защита",val:"100 м WR"},{key:"Динамик",val:"Есть"}] },
  { id:"garmin-epix3-42", name:"Garmin Epix Gen 3 42mm", slug:"garmin-epix3-42",
    category:"smart_chasy", brand:"Garmin", price:64990, year:2024, emoji:"⌚",
    colors:["Carbon Gray DLC","Whitestone"],
    inStock:true, rating:5, reviewCount:17,
    description:"Garmin Epix Gen 3 42mm — компактная версия флагмана с AMOLED Always-On и автономностью до 24 дней.",
    specs:[{key:"Корпус",val:"42 мм, алюминий"},{key:"Дисплей",val:"AMOLED 1.2\" Always-On"},{key:"GPS",val:"MultiGNSS"},{key:"Автономность",val:"до 24 дней (смарт)"},{key:"Защита",val:"100 м WR"}] },

  // ── Garmin Forerunner 965  (2023) ──────────────────────────────
  { id:"garmin-fr965", name:"Garmin Forerunner 965", slug:"garmin-fr965",
    category:"smart_chasy", brand:"Garmin", price:54990, year:2023, emoji:"⌚",
    colors:["Black/Powder Gray","Carbon Gray DLC/Titanium"],
    inStock:true, rating:5, reviewCount:38,
    description:"Garmin Forerunner 965 — беговые часы с AMOLED-дисплеем, детальной картой, Training Readiness и до 31 дня автономности в режиме смарт-часов.",
    specs:[{key:"Корпус",val:"47 мм, алюминий"},{key:"Дисплей",val:"AMOLED 1.4\""},{key:"GPS",val:"MultiGNSS"},{key:"Автономность",val:"до 31 дня (смарт), до 31 ч (GPS)"},{key:"Карты",val:"Топографические"},{key:"Защита",val:"50 м WR"}] },

  // ── Garmin Venu 3  (2023) ─────────────────────────────────────
  { id:"garmin-venu3-45",  name:"Garmin Venu 3 45mm",  slug:"garmin-venu3-45",
    category:"smart_chasy", brand:"Garmin", price:44990, year:2023, emoji:"⌚",
    colors:["Slate/Black","French Gray/Ivory"],
    inStock:true, rating:5, reviewCount:47,
    description:"Garmin Venu 3 — стильные часы для здорового образа жизни с AMOLED, мониторингом сна, стресса и голосовым ассистентом.",
    specs:[{key:"Корпус",val:"45 мм, алюминий"},{key:"Дисплей",val:"AMOLED 1.4\""},{key:"GPS",val:"GNSS"},{key:"Автономность",val:"до 14 дней (смарт)"},{key:"Защита",val:"50 м WR"},{key:"Здоровье",val:"ЭКГ, пульс, стресс, сон"}] },
  { id:"garmin-venu3s-40", name:"Garmin Venu 3S 40mm", slug:"garmin-venu3s-40",
    category:"smart_chasy", brand:"Garmin", price:39990, year:2023, emoji:"⌚",
    colors:["Sage Gray/Ivory","Peach Gold/Ivory","Dust Rose/Ivory"],
    inStock:true, rating:5, reviewCount:54,
    description:"Garmin Venu 3S 40mm — компактные женские часы с AMOLED, детальным мониторингом здоровья и до 10 дней автономности.",
    specs:[{key:"Корпус",val:"40 мм, алюминий"},{key:"Дисплей",val:"AMOLED 1.2\""},{key:"GPS",val:"GNSS"},{key:"Автономность",val:"до 10 дней (смарт)"},{key:"Защита",val:"50 м WR"}] },

  // ── Garmin Instinct 3  (2025) ──────────────────────────────────
  { id:"garmin-instinct3-solar", name:"Garmin Instinct 3 Solar 50mm", slug:"garmin-instinct3-solar",
    category:"smart_chasy", brand:"Garmin", price:39990, badge:"Новинка", year:2025, emoji:"⌚",
    colors:["Camo","Graphite","Stone Gray"],
    inStock:true, rating:5, reviewCount:31,
    description:"Garmin Instinct 3 Solar 50mm — защищённые часы MIL-STD-810 с AMOLED, солнечной зарядкой и практически неограниченной автономностью.",
    specs:[{key:"Корпус",val:"50 мм, стеклонаполненный полимер"},{key:"Дисплей",val:"AMOLED 1.27\""},{key:"GPS",val:"MultiGNSS"},{key:"Автономность",val:"до 28 дней + безгран. от солнца"},{key:"Защита",val:"100 м WR, MIL-STD-810"}] },

  // ── Garmin Vivoactive 5  (2023) ────────────────────────────────
  { id:"garmin-vivoactive5", name:"Garmin Vivoactive 5", slug:"garmin-vivoactive5",
    category:"smart_chasy", brand:"Garmin", price:29990, year:2023, emoji:"⌚",
    colors:["Metallic Orchid","Ivory Gold","Slate Aluminum"],
    inStock:true, rating:4, reviewCount:72,
    description:"Garmin Vivoactive 5 — стильные часы для фитнеса с AMOLED, NFC-оплатой Garmin Pay и до 11 дней автономности.",
    specs:[{key:"Корпус",val:"42 мм, алюминий"},{key:"Дисплей",val:"AMOLED 1.2\""},{key:"GPS",val:"GNSS"},{key:"Автономность",val:"до 11 дней (смарт)"},{key:"NFC",val:"Garmin Pay"},{key:"Защита",val:"50 м WR"}] },

  /* ══════════════════════════════════════════════════════════════
     ГАДЖЕТЫ И КОНСОЛИ  (год ↓, цена ↓)
  ══════════════════════════════════════════════════════════════ */

  // ── PlayStation 5 Pro  (2024) ──────────────────────────────────
  { id:"ps5-pro", name:"PlayStation 5 Pro", slug:"ps5-pro",
    category:"gadzety_i_konsoli", brand:"Sony", price:89990, badge:"Хит", year:2024, emoji:"🎮",
    colors:["White"],
    inStock:true, rating:5, reviewCount:38,
    description:"PlayStation 5 Pro — улучшенная PS5 с GPU 67% быстрее, трассировкой лучей в реальном времени (PSSR) и частотой кадров до 120 fps. Без дисковода, 2 ТБ SSD.",
    specs:[{key:"CPU",val:"AMD Zen 2, 8 ядер × 3.85 ГГц"},{key:"GPU",val:"AMD RDNA 4 custom, ~33 TFLOPS"},{key:"ОЗУ",val:"16 ГБ GDDR6"},{key:"Накопитель",val:"2 ТБ Custom SSD"},{key:"Разрешение",val:"до 8K / 60 fps"},{key:"ОС",val:"PS OS"}] },

  // ── PlayStation 5 (Slim)  (2023) ──────────────────────────────
  { id:"ps5-slim-disc",   name:"PlayStation 5 Slim (с дисководом)",  slug:"ps5-slim-disc",
    category:"gadzety_i_konsoli", brand:"Sony", price:64990, year:2023, emoji:"🎮",
    colors:["White"],
    inStock:true, rating:5, reviewCount:71,
    description:"PlayStation 5 Slim с дисководом — компактная PS5: на 30% меньше, 1 ТБ SSD и поддержка дисков Blu-Ray.",
    specs:[{key:"CPU",val:"AMD Zen 2, 8 ядер × 3.5 ГГц"},{key:"GPU",val:"AMD RDNA 2, 10.28 TFLOPS"},{key:"ОЗУ",val:"16 ГБ GDDR6"},{key:"Накопитель",val:"1 ТБ Custom SSD"},{key:"Оптика",val:"Ultra HD Blu-Ray"},{key:"ОС",val:"PS OS"}] },
  { id:"ps5-slim-digital",name:"PlayStation 5 Slim Digital Edition", slug:"ps5-slim-digital",
    category:"gadzety_i_konsoli", brand:"Sony", price:54990, year:2023, emoji:"🎮",
    colors:["White"],
    inStock:true, rating:5, reviewCount:59,
    description:"PlayStation 5 Slim Digital Edition — цифровая PS5 без дисковода. Компактный дизайн, 1 ТБ SSD, все эксклюзивы Sony.",
    specs:[{key:"CPU",val:"AMD Zen 2, 8 ядер × 3.5 ГГц"},{key:"GPU",val:"AMD RDNA 2, 10.28 TFLOPS"},{key:"ОЗУ",val:"16 ГБ GDDR6"},{key:"Накопитель",val:"1 ТБ Custom SSD"},{key:"ОС",val:"PS OS"}] },

  // ── Xbox Series X  (2024 refresh) ────────────────────────────
  { id:"xbox-series-x-2tb", name:"Xbox Series X 2TB (2024)", slug:"xbox-series-x-2tb",
    category:"gadzety_i_konsoli", brand:"Microsoft", price:69990, badge:"Новинка", year:2024, emoji:"🎮",
    colors:["Robot White","Carbon Black"],
    inStock:true, rating:5, reviewCount:27,
    description:"Xbox Series X 2024 с SSD 2 ТБ в белом и чёрном цветах. Xbox Game Pass Ultimate, 4K/120fps, Quick Resume для нескольких игр.",
    specs:[{key:"CPU",val:"AMD Zen 2, 8 ядер × 3.8 ГГц"},{key:"GPU",val:"AMD RDNA 2, 12 TFLOPS"},{key:"ОЗУ",val:"16 ГБ GDDR6"},{key:"Накопитель",val:"2 ТБ NVMe SSD"},{key:"Разрешение",val:"до 8K / 120 fps"},{key:"ОС",val:"Xbox OS"}] },
  { id:"xbox-series-x-1tb", name:"Xbox Series X 1TB",         slug:"xbox-series-x-1tb",
    category:"gadzety_i_konsoli", brand:"Microsoft", price:54990, year:2022, emoji:"🎮",
    colors:["Carbon Black"],
    inStock:true, rating:5, reviewCount:44,
    description:"Xbox Series X 1TB — флагман Microsoft для 4K-гейминга с Xbox Game Pass Ultimate.",
    specs:[{key:"CPU",val:"AMD Zen 2, 8 ядер × 3.8 ГГц"},{key:"GPU",val:"AMD RDNA 2, 12 TFLOPS"},{key:"ОЗУ",val:"16 ГБ GDDR6"},{key:"Накопитель",val:"1 ТБ NVMe SSD"},{key:"Разрешение",val:"до 8K / 120 fps"}] },

  // ── Apple Vision Pro  (2024) ──────────────────────────────────
  { id:"apple-vision-pro-256", name:"Apple Vision Pro 256GB", slug:"apple-vision-pro-256",
    category:"gadzety_i_konsoli", brand:"Apple", price:349990, badge:"Флагман", year:2024, emoji:"🥽",
    memories:["256 ГБ"],
    colors:["Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:7,
    description:"Apple Vision Pro — первый пространственный компьютер Apple с дисплеями micro-OLED 4K+ на каждый глаз, чипами M2+R1 и visionOS. Новый уровень взаимодействия с цифровым миром.",
    specs:[{key:"Дисплей",val:"Micro-OLED 4K+ (×2), 23 млн пикс."},{key:"Чипы",val:"Apple M2 + R1"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"256 ГБ"},{key:"Автономность",val:"до 2 ч (Battery Pack)"},{key:"ОС",val:"visionOS 2"}] },
  { id:"apple-vision-pro-512", name:"Apple Vision Pro 512GB", slug:"apple-vision-pro-512",
    category:"gadzety_i_konsoli", brand:"Apple", price:379990, year:2024, emoji:"🥽",
    memories:["512 ГБ"],
    colors:["Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:4,
    description:"Apple Vision Pro 512 ГБ — пространственный компьютер с увеличенным хранилищем для профессиональных задач.",
    specs:[{key:"Дисплей",val:"Micro-OLED 4K+ (×2)"},{key:"Чипы",val:"Apple M2 + R1"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"512 ГБ"},{key:"ОС",val:"visionOS 2"}] },
  { id:"apple-vision-pro-1tb",  name:"Apple Vision Pro 1TB",   slug:"apple-vision-pro-1tb",
    category:"gadzety_i_konsoli", brand:"Apple", price:409990, year:2024, emoji:"🥽",
    memories:["1 ТБ"],
    colors:["Silver (Серебристый)"],
    inStock:true, rating:5, reviewCount:2,
    description:"Apple Vision Pro 1 ТБ — максимальная конфигурация пространственного компьютера.",
    specs:[{key:"Дисплей",val:"Micro-OLED 4K+ (×2)"},{key:"Чипы",val:"Apple M2 + R1"},{key:"ОЗУ",val:"16 ГБ"},{key:"Накопитель",val:"1 ТБ"},{key:"ОС",val:"visionOS 2"}] },

  // ── Ray-Ban Meta Glasses  (2023/2025) ─────────────────────────
  { id:"rayban-meta-gen4",  name:"Ray-Ban Meta Glasses (2025)", slug:"rayban-meta-gen4",
    category:"gadzety_i_konsoli", brand:"Meta", price:49990, badge:"Новинка", year:2025, emoji:"🕶️",
    colors:["Shiny Black","Matte Jett","Shiny Brown"],
    inStock:true, rating:4, reviewCount:16,
    description:"Ray-Ban Meta 2025 — смарт-очки с ИИ-ассистентом Meta AI, камерой 12 Мп, аудио с открытыми динамиками и до 8 ч работы. Выглядят как обычные очки.",
    specs:[{key:"Камера",val:"12 Мп, 3K видео"},{key:"Звук",val:"Открытые динамики"},{key:"ИИ",val:"Meta AI"},{key:"Автономность",val:"до 8 ч"},{key:"Подключение",val:"Bluetooth 5.3"},{key:"Вес",val:"~50 г"}] },
  { id:"rayban-meta-gen3",  name:"Ray-Ban Meta Smart Glasses", slug:"rayban-meta-gen3",
    category:"gadzety_i_konsoli", brand:"Meta", price:34990, year:2023, emoji:"🕶️",
    colors:["Shiny Black","Shiny Havana","Shiny Caramel"],
    inStock:true, rating:4, reviewCount:29,
    description:"Ray-Ban Meta Smart Glasses 2023 — смарт-очки с камерой 12 Мп, встроенным звуком и Meta AI (голосовой ассистент). Первые умные очки, которые выглядят модно.",
    specs:[{key:"Камера",val:"12 Мп, 1080p видео"},{key:"Звук",val:"Открытые динамики + микрофоны"},{key:"ИИ",val:"Meta AI"},{key:"Автономность",val:"до 6 ч"},{key:"Подключение",val:"Bluetooth 5.3"}] },

  // ── Apple TV 4K  (2022) ────────────────────────────────────────
  { id:"apple-tv-4k-wifi-128",    name:"Apple TV 4K Wi-Fi 128GB (2022)",          slug:"apple-tv-4k-wifi-128",
    category:"gadzety_i_konsoli", brand:"Apple", price:17990, year:2022, emoji:"📺",
    memories:["128 ГБ"],
    colors:["Black"],
    inStock:true, rating:5, reviewCount:43,
    description:"Apple TV 4K 3-го поколения Wi-Fi 128 ГБ — стриминговая приставка с чипом A15 Bionic, 4K HDR, Dolby Vision и пультом Siri Remote с кольцом прокрутки.",
    specs:[{key:"Чип",val:"Apple A15 Bionic"},{key:"Видео",val:"4K HDR, Dolby Vision"},{key:"Звук",val:"Dolby Atmos"},{key:"Накопитель",val:"128 ГБ"},{key:"Подключение",val:"Wi-Fi 6, Bluetooth 5.0"},{key:"ОС",val:"tvOS 18"}] },
  { id:"apple-tv-4k-eth-128",     name:"Apple TV 4K Wi-Fi + Ethernet 128GB (2022)",slug:"apple-tv-4k-eth-128",
    category:"gadzety_i_konsoli", brand:"Apple", price:21990, year:2022, emoji:"📺",
    memories:["128 ГБ"],
    colors:["Black"],
    inStock:true, rating:5, reviewCount:29,
    description:"Apple TV 4K Wi-Fi + Ethernet 128 ГБ — версия с гигабитным Ethernet для надёжного стриминга 4K без задержек.",
    specs:[{key:"Чип",val:"Apple A15 Bionic"},{key:"Видео",val:"4K HDR, Dolby Vision"},{key:"Подключение",val:"Wi-Fi 6 + Gigabit Ethernet"},{key:"Накопитель",val:"128 ГБ"},{key:"ОС",val:"tvOS 18"}] },

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
];

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
