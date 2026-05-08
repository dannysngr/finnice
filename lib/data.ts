/* ================================================================
   data.ts — единственный источник истины для всех текстов и данных
   Грозный / Чеченская Республика / ФинНайс
   ================================================================ */

// ─── Company ──────────────────────────────────────────────────
export const COMPANY = {
  name:        "ФинНайс",
  legalName:   "ФинНайс",
  slogan:      "Без Риба. Без скрытых платежей. Без пени и штрафов.",
  phone:       "+7 (928) 999-99-99",
  phoneTel:    "tel:+79289999999",
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
  { label: "О нас",            href: "/company/" },
  { label: "Акции",            href: "/aktsii/" },
  { label: "Партнеры",         href: "/partners/" },
  { label: "Мобильный брокер", href: "/mobil_broker/" },
  { label: "Вакансии",         href: "/info/vacancy/" },
  { label: "Контакты",         href: "/contacts/" },
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
  // Apple CDN image or placeholder URL
  img:     string;
}

// Локальные изображения — официальные product renders (JPG)
const A = (filename: string) => `/images/phones/${filename}.jpg`;

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
    title: "Без Риба",
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
  { label: "Телефоны",              href: "/catalog/?cat=telefony",          cat: "telefony" },
  { label: "Планшеты",              href: "/catalog/?cat=planshety",         cat: "planshety" },
  { label: "Аксессуары",            href: "/catalog/?cat=aksessuary",        cat: "aksessuary" },
  { label: "Компьютеры и ноутбуки", href: "/catalog/?cat=noutbuki",          cat: "noutbuki" },
  { label: "Смарт-часы",            href: "/catalog/?cat=smart_chasy",       cat: "smart_chasy" },
  { label: "Телевизоры",            href: "/catalog/?cat=televizory",        cat: "televizory" },
  { label: "Бытовая техника",       href: "/catalog/?cat=bytovaya_tekhnika", cat: "bytovaya_tekhnika" },
  { label: "Кондиционеры",          href: "/catalog/?cat=konditsionery",     cat: "konditsionery" },
  { label: "Мебель",                href: "/catalog/?cat=mebel",             cat: "mebel" },
  { label: "Детские товары",        href: "/catalog/?cat=detskie_tovary",    cat: "detskie_tovary" },
  { label: "Для дома и сада",       href: "/catalog/?cat=dlya_doma_i_sada",  cat: "dlya_doma_i_sada" },
  { label: "Посуда и кухня",        href: "/catalog/?cat=posuda_i_kukhnya",  cat: "posuda_i_kukhnya" },
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
  emoji:        string;   // placeholder visual
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

  /* ── Ноутбуки ── */
  {
    id: "apple-macbook-air-m3",
    name: "Apple MacBook Air 15\" M3 8/256GB",
    slug: "apple-macbook-air-15-m3",
    category: "noutbuki",
    brand: "Apple",
    price: 149990, oldPrice: 164990,
    badge: "Хит",
    emoji: "💻",
    memories: ["256 ГБ SSD", "512 ГБ SSD"],
    colors: ["Полночь", "Серебро", "Небесно-голубой", "Звёздный свет"],
    inStock: true, rating: 5, reviewCount: 55,
    description: "MacBook Air 15 с чипом M3 — мощный, тихий (без вентилятора) и невероятно лёгкий ноутбук для работы и творчества.",
    specs: [
      { key: "Дисплей",    val: "15.3\" Liquid Retina, 2880×1864" },
      { key: "Процессор",  val: "Apple M3 (8-ядерный CPU)" },
      { key: "ОЗУ",        val: "8 ГБ unified memory" },
      { key: "Накопитель", val: "256 ГБ SSD" },
      { key: "Автономность",val: "до 18 ч" },
      { key: "ОС",         val: "macOS Sonoma" },
    ],
  },
  {
    id: "lenovo-ideapad-5-512",
    name: "Lenovo IdeaPad 5 15\" i5/16/512",
    slug: "lenovo-ideapad-5-15-i5",
    category: "noutbuki",
    brand: "Lenovo",
    price: 74990,
    emoji: "💻",
    colors: ["Серый", "Синий"],
    inStock: true, rating: 4, reviewCount: 33,
    description: "Надёжный ноутбук для работы и учёбы с Intel Core i5, 16 ГБ RAM и быстрым SSD 512 ГБ.",
    specs: [
      { key: "Дисплей",    val: "15.6\" IPS FullHD" },
      { key: "Процессор",  val: "Intel Core i5-1335U" },
      { key: "ОЗУ",        val: "16 ГБ" },
      { key: "Накопитель", val: "512 ГБ SSD" },
      { key: "Автономность",val: "до 9 ч" },
      { key: "ОС",         val: "Windows 11" },
    ],
  },

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
  { label: "Доставка и оплата",       href: "/contacts/" },
  { label: "Акции",                   href: "/aktsii/" },
  { label: "Вопросы-ответы",          href: "/blog/" },
  { label: "Как купить в рассрочку?", href: "/wb/" },
  { label: "Калькулятор рассрочки",   href: "/#calculator" },
  { label: "Айфоны в рассрочку",      href: "/catalog/" },
  { label: "Телевизоры в рассрочку",  href: "/catalog/" },
  { label: "Планшеты в рассрочку",    href: "/catalog/" },
  { label: "Смарт-часы в рассрочку",  href: "/catalog/" },
  { label: "Ноутбуки в рассрочку",    href: "/catalog/" },
] as const;
