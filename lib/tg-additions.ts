/* lib/tg-additions.ts
 *
 * Новые товары, которых нет в базовом каталоге, но есть в партнёрском
 * TG-канале @mistore095. Цены = (TG-цена за самую дорогую цветовую
 * вариацию) + 1000₽. Все помечены tgSynced=true → без «≈» в UI.
 *
 * Картинки временно — эмодзи-плейсхолдеры. По мере появления фото
 * (от пользователя / из открытых пресс-китов) заполняем поле `img`.
 */

import type { Product, PhoneItem } from "./data";

/** Минимальный конструктор Product-entry для TG-новинок */
const newP = (
  id: string, name: string, category: string, brand: string,
  price: number, emoji: string,
  extra: Partial<Product> = {},
): Product => ({
  id,
  name,
  slug:        id,
  category,
  brand,
  price,
  emoji,
  inStock:     true,
  rating:      5,
  reviewCount: 0,
  description: "",
  specs:       [],
  tgSynced:    true,
  ...extra,
});

export const TG_NEW_PRODUCTS: Product[] = [
  // ─── Apple-аксессуары ────────────────────────────────────────
  newP("tg-apple-pencil-2",        "Apple Pencil 2-го поколения", "aksessuary", "Apple", 11_500, "✏️"),
  newP("tg-apple-pencil-pro",      "Apple Pencil Pro",            "aksessuary", "Apple", 14_500, "✏️"),
  newP("tg-magic-mouse-3",         "Apple Magic Mouse 3",         "aksessuary", "Apple", 12_500, "🖱️"),
  newP("tg-airpods-3",             "Apple AirPods 3",             "aksessuary", "Apple", 10_800, "🎧"),
  newP("tg-airpods-4",             "Apple AirPods 4",             "aksessuary", "Apple", 11_300, "🎧"),
  newP("tg-airpods-4-anc",         "Apple AirPods 4 (с активным шумоподавлением)", "aksessuary", "Apple", 15_600, "🎧"),
  newP("tg-airpods-pro-2",         "Apple AirPods Pro 2",         "aksessuary", "Apple", 17_500, "🎧"),

  // ─── Колонки / аудио ─────────────────────────────────────────
  newP("tg-yandex-station-mini-3", "Яндекс Станция Мини 3 с часами", "aksessuary", "Яндекс",  11_000, "🔊"),
  newP("tg-yandex-station-midi",   "Яндекс Станция Миди",            "aksessuary", "Яндекс",  17_500, "🔊"),
  newP("tg-yandex-station-duo-max","Яндекс Станция Дуо Макс",        "aksessuary", "Яндекс",  34_900, "🔊"),
  newP("tg-jbl-flip-6",            "JBL Flip 6",                     "aksessuary", "JBL",     10_900, "🔊"),
  newP("tg-xiaomi-redmi-soundbar", "Xiaomi Redmi TV Soundbar",       "aksessuary", "Xiaomi",   4_500, "🔊"),
  newP("tg-galaxy-buds-3",         "Samsung Galaxy Buds 3",          "aksessuary", "Samsung",  8_300, "🎧"),
  newP("tg-galaxy-buds-3-pro",     "Samsung Galaxy Buds 3 Pro",      "aksessuary", "Samsung", 11_000, "🎧"),

  // ─── Камеры / стабилизаторы / микрофоны ──────────────────────
  newP("tg-dji-mic-2-1tx-1rx",     "DJI Mic 2 (1TX + 1RX)",          "gadzety_i_konsoli", "DJI", 25_900, "🎤"),
  newP("tg-dji-mic-2-2tx-1rx",     "DJI Mic 2 (2TX + 1RX + Charging Case)", "gadzety_i_konsoli", "DJI", 35_500, "🎤"),
  newP("tg-gopro-hero-11",         "GoPro Hero 11 Black",            "gadzety_i_konsoli", "GoPro",   30_900, "📷"),
  newP("tg-gopro-hero-12",         "GoPro Hero 12 Black",            "gadzety_i_konsoli", "GoPro",   33_900, "📷"),
  newP("tg-gopro-hero-13",         "GoPro Hero 13 Black",            "gadzety_i_konsoli", "GoPro",   39_500, "📷"),
  newP("tg-insta360-x3",           "Insta360 X3 Black",              "gadzety_i_konsoli", "Insta360", 37_900, "📷"),
  newP("tg-dji-osmo-mobile-se",    "DJI Osmo Mobile SE",             "gadzety_i_konsoli", "DJI",     13_000, "📷"),
  newP("tg-dji-osmo-mobile-6",     "DJI Osmo Mobile 6",              "gadzety_i_konsoli", "DJI",     15_500, "📷"),
  newP("tg-dji-osmo-pocket-3",     "DJI Osmo Pocket 3 Creator Combo","gadzety_i_konsoli", "DJI",     66_900, "📷"),
  newP("tg-dji-osmo-action-5-pro", "DJI Osmo Action 5 Pro Adventure Combo", "gadzety_i_konsoli", "DJI", 51_500, "📷"),

  // ─── VR ──────────────────────────────────────────────────────
  newP("tg-oculus-quest-2-128",    "Meta Oculus Quest 2 128GB",      "gadzety_i_konsoli", "Meta", 26_500, "🥽"),
  newP("tg-oculus-quest-3-128",    "Meta Oculus Quest 3 128GB",      "gadzety_i_konsoli", "Meta", 47_900, "🥽"),
  newP("tg-psvr2",                 "Sony PlayStation VR 2",          "gadzety_i_konsoli", "Sony", 47_900, "🥽"),
];

/** PhoneItem-новинки: iPhone 16e / 17e + MacBook M4 не сюда (это не телефоны) */
export const TG_NEW_PHONES: PhoneItem[] = [
  {
    id:      "tg-ip16e-128",
    brand:   "Apple",
    model:   "iPhone 16e",
    memory:  "128 ГБ",
    sim:     "SIM + eSIM",
    price:   46_000,
    colors:  ["White (Белый)", "Black (Чёрный)"],
    img:     ["/images/phones/iphone-16e-1.jpg", "/images/phones/iphone-16e-2.jpg"],
    tgSynced: true,
  },
  {
    id:      "tg-ip17e-256",
    brand:   "Apple",
    model:   "iPhone 17e",
    memory:  "256 ГБ",
    sim:     "SIM + eSIM",
    price:   53_000,
    colors:  ["White (Белый)", "Pink (Розовый)", "Black (Чёрный)"],
    img:     ["/images/phones/iphone-17e-1.jpg", "/images/phones/iphone-17e-2.jpg", "/images/phones/iphone-17e-3.jpg"],
    tgSynced: true,
  },
];
