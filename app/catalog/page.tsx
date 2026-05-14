"use client";
import Link from "next/link";
import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  CATALOG_CATS, PRODUCTS, PHONES_CATALOG,
  type Product,
} from "@/lib/data";
import { fmtRub, fmtRubApprox, calcInstallment, getMinDownPct } from "@/lib/calculator-logic";
import { useAppModal } from "@/lib/modal-context";
import { ProductSlideshow } from "@/components/ProductSlideshow";

// ─── Расширенный тип с опциональными полями ───────────────────
type CatalogItem = Product & { img?: string | string[]; sim?: string };

// ─── Порядок памяти (хранилище + RAM, возрастающий) ──────────
const MEM_ORDER = ["64 ГБ", "128 ГБ", "256 ГБ", "512 ГБ", "1 ТБ", "2 ТБ"];

// ─── Порядок SIM ──────────────────────────────────────────────
const SIM_ORDER: Record<string, number> = {
  "eSIM": 0, "SIM + eSIM": 1, "2 SIM": 2, "1 SIM": 3,
};

// ─── Порядок брендов ──────────────────────────────────────────
const BRAND_PRIORITY = ["Apple", "Samsung", "Xiaomi", "Honor", "Sony", "Microsoft", "Garmin", "Meta", "Pitaka", "Bose", "Valve", "Lenovo", "LG"];
function brandRank(b: string): number {
  const i = BRAND_PRIORITY.indexOf(b);
  return i === -1 ? BRAND_PRIORITY.length : i;
}

// ─── Ключи сортировки (аналог SmartphonesSection) ────────────

function iphoneSortKey(model: string): [number, number] {
  const lower = model.toLowerCase();
  const genMatch = model.match(/iPhone\s+(\d+)/i);
  // "iPhone Air" не содержит числа → считаем поколением 17 (текущее)
  const gen = genMatch ? parseInt(genMatch[1]) : (lower.includes("air") ? 17 : 0);
  let tier: number;
  if      (lower.includes("pro max")) tier = 1;
  else if (lower.includes("pro"))     tier = 0;
  else if (lower.includes("air"))     tier = 2;
  else if (lower.includes("plus"))    tier = 2;  // Plus = то же место, что Air в своём поколении
  else                                tier = 3;
  return [-gen, tier];
}

function samsungSortKey(model: string): [number, number, number] {
  const lower = model.toLowerCase();
  const gen = parseInt(model.match(/\d+/)?.[0] ?? "0");
  let series: number, tier: number;
  if (lower.includes(" s")) {
    series = 0;
    tier = lower.includes("ultra") ? 0 : lower.includes("+") ? 1 : 2;
  } else if (lower.includes("fold") || lower.includes("flip")) {
    series = 1;
    tier = lower.includes("fold") ? 0 : 1;
  } else {
    series = 2; tier = 0;
  }
  return [series, -gen, tier];
}

function xiaomiSortKey(model: string): [number, number, number] {
  const lower = model.toLowerCase();
  const gen = parseInt(model.match(/\d+/)?.[0] ?? "0");
  let series: number, tier: number;
  if (lower.startsWith("xiaomi ") && /xiaomi\s+\d/.test(lower)) {
    series = 0;
    tier = lower.includes("ultra") ? 0 : lower.includes("pro") ? 1 : 2;
  } else if (lower.includes(" t")) {
    series = 1; tier = 0;
  } else if (lower.includes("redmi note")) {
    series = 2; tier = 0;
  } else {
    series = 3; tier = 0;
  }
  return [series, -gen, tier];
}

function honorSortKey(model: string): [number, number, number] {
  const lower = model.toLowerCase();
  const gen = parseInt(model.match(/\d+/)?.[0] ?? "0");
  let series: number, tier: number;
  if (lower.includes("magic")) {
    series = 0; tier = lower.includes("pro") ? 0 : 1;
  } else if (/honor\s+\d/.test(lower)) {
    series = 1; tier = lower.includes("pro") ? 0 : 1;
  } else {
    series = 2; tier = 0;
  }
  return [series, -gen, tier];
}

// Внутри аксессуаров: пушим чехлы/брелоки/кабели в конец, наушники наверх
function accessoryRank(item: CatalogItem): number {
  const n = item.name.toLowerCase();
  const isCase = /(чехол|case|брелок|обложка|подвеска)/i.test(item.name) || item.emoji === "📦";
  if (isCase) return 2;                                  // самый низ
  if (/(airpods|наушник|headphone)/i.test(n)) return 0;  // наверху
  return 1;
}

// Единый ключ для сортировки "По популярности"
function defaultSortKey(item: CatalogItem): number[] {
  const bRank = brandRank(item.brand);
  const brand = item.brand;
  const model = item.name;
  const cat   = item.category;
  let modelKey: number[];

  if (brand === "Apple" && cat !== "telefony") {
    // Не-телефонная Apple-техника: тип аксессуара (наушники→чехлы), год убывает, цена убывает
    const aRank = cat === "aksessuary" ? accessoryRank(item) : 0;
    modelKey = [aRank, -(item.year ?? 0), -item.price];
  } else if (brand === "Apple") {
    const k = iphoneSortKey(model);
    modelKey = [k[0], k[1]];
  } else if (brand === "Samsung") {
    const k = samsungSortKey(model);
    modelKey = [k[0], k[1], k[2]];
  } else if (brand === "Xiaomi") {
    const k = xiaomiSortKey(model);
    modelKey = [k[0], k[1], k[2]];
  } else if (brand === "Honor") {
    const k = honorSortKey(model);
    modelKey = [k[0], k[1], k[2]];
  } else {
    modelKey = [0, -item.price];
  }
  const memRank = MEM_ORDER.indexOf(item.memories?.[0] ?? "");
  const simRank = SIM_ORDER[item.sim ?? ""] ?? 99;
  return [bRank, ...modelKey, memRank, simRank];
}

function cmpArrays(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

// ─── Строим карточки телефонов из PHONES_CATALOG (без группировки) ──
// Каждая запись в PHONES_CATALOG → отдельная карточка в каталоге
const PHONE_ITEMS: CatalogItem[] = PHONES_CATALOG.map((p) => {
  const name = p.model.startsWith(p.brand) ? p.model : `${p.brand} ${p.model}`;
  return {
    id:          p.id,
    name,
    slug:        name.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, "-"),
    category:    "telefony" as const,
    brand:       p.brand,
    price:       p.price,
    badge:       p.badge,
    emoji:       "📱",
    img:         p.img,
    sim:         p.sim,
    memories:    [p.memory],
    inStock:     true,
    rating:      5,
    reviewCount: 0,
    description: "",
    specs:       [],
    tgSynced:    p.tgSynced,
  } satisfies CatalogItem;
});

// ─── Прочие товары (не телефоны) из PRODUCTS ─────────────────
const OTHER_ITEMS: CatalogItem[] = PRODUCTS.filter(
  (p) => p.category !== "telefony"
);

// ─── Общий каталог ────────────────────────────────────────────
const ALL_ITEMS: CatalogItem[] = [...PHONE_ITEMS, ...OTHER_ITEMS];

// ─── Список брендов в нужном порядке ─────────────────────────
const ALL_BRANDS = Array.from(new Set(ALL_ITEMS.map((p) => p.brand)))
  .sort((a, b) => brandRank(a) - brandRank(b) || a.localeCompare(b, "ru"));

// ─── Маппинг: категория → набор spec-фильтров ────────────────
const CAT_SPEC_FILTERS: Record<string, Array<{ label: string; specKey: string }>> = {
  noutbuki:          [
    { label: "Процессор",  specKey: "Процессор"  },
    { label: "ОЗУ",        specKey: "ОЗУ"        },
    { label: "Накопитель", specKey: "Накопитель" },
  ],
  planshety:         [
    { label: "Дисплей",    specKey: "Дисплей"    },
    { label: "Процессор",  specKey: "Процессор"  },
    { label: "Накопитель", specKey: "Накопитель" },
  ],
  smart_chasy:       [
    { label: "Корпус",     specKey: "Корпус"     },
    { label: "Чип",        specKey: "Чип"        },
    { label: "GPS",        specKey: "GPS"        },
  ],
  televizory:        [
    { label: "Экран",      specKey: "Экран"      },
    { label: "Smart TV",   specKey: "Smart TV"   },
    { label: "Частота",    specKey: "Частота"    },
  ],
  bytovaya_tekhnika: [
    { label: "Тип",        specKey: "Тип"        },
    { label: "Класс",      specKey: "Класс"      },
  ],
};

const GLOBAL_MAX = Math.ceil(Math.max(...ALL_ITEMS.map((p) => p.price)) / 5_000) * 5_000;

/* ════════════════════════════════════════════════════════════════
   Обёртка — передаём Suspense для useSearchParams
════════════════════════════════════════════════════════════════ */
export default function CatalogPage() {
  return (
    <Suspense fallback={
      <div className="section py-20 text-center text-[#9CA3AF]">
        Загрузка каталога…
      </div>
    }>
      <CatalogContent />
    </Suspense>
  );
}

/* ════════════════════════════════════════════════════════════════
   Основной контент — читает ?cat из URL
════════════════════════════════════════════════════════════════ */
interface CartEntry { productId: string; qty: number; }

function CatalogContent() {
  const searchParams = useSearchParams();
  const initCat      = searchParams.get("cat") ?? "all";

  const [activeCat, setActiveCat] = useState<string>(initCat);
  const [brands,    setBrands]    = useState<string[]>([]);
  const [maxPrice,  setMaxPrice]  = useState(GLOBAL_MAX);
  const [sort,      setSort]      = useState<"popular"|"price_asc"|"price_desc">("popular");

  // ─── Телефонные фильтры (только для категории "telefony") ────
  const [phoneBrand,  setPhoneBrand]  = useState("Все");
  const [phoneModel,  setPhoneModel]  = useState("Все");
  const [phoneMemory, setPhoneMemory] = useState("Все");
  const [phoneColor,  setPhoneColor]  = useState("Все");
  const [phoneSim,    setPhoneSim]    = useState("Все");

  // ─── Spec-фильтры для остальных категорий ────────────────────
  const [specBrandFilter, setSpecBrandFilter] = useState("Все");
  const [specFilters,     setSpecFilters]     = useState<Record<string, string>>({});

  // ─── Auth / Favorites / Cart ───────────────────────────────
  const [authed,    setAuthed]    = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [cart,      setCart]      = useState<CartEntry[]>([]);

  useEffect(() => {
    // Проверка авторизации и загрузка данных пользователя
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.authed) {
          setAuthed(true);
          // Загружаем избранное и корзину параллельно
          Promise.all([
            fetch("/api/favorites").then(r => r.ok ? r.json() : { ids: [] }),
            fetch("/api/cart").then(r => r.ok ? r.json() : { items: [] }),
          ]).then(([fav, crt]) => {
            setFavorites(fav.ids ?? []);
            setCart(crt.items ?? []);
          });
        }
      })
      .catch(() => {});
  }, []);

  // Сбрасываем все категорийные фильтры при смене категории
  useEffect(() => {
    setPhoneBrand("Все"); setPhoneModel("Все");
    setPhoneMemory("Все"); setPhoneColor("Все"); setPhoneSim("Все");
    setSpecBrandFilter("Все"); setSpecFilters({});
  }, [activeCat]);

  // ─── Опции телефонных фильтров (динамические) ───────────────
  const phoneCatalogItems = useMemo(
    () => PHONES_CATALOG.filter(p => phoneBrand === "Все" || p.brand === phoneBrand),
    [phoneBrand]
  );
  const phoneModelOptions = useMemo(() => {
    const models = Array.from(new Set(phoneCatalogItems.map(p => p.model)));
    return ["Все", ...models];
  }, [phoneCatalogItems]);
  const phoneMemoryOptions = useMemo(() => {
    const base = phoneModel !== "Все"
      ? phoneCatalogItems.filter(p => p.model === phoneModel)
      : phoneCatalogItems;
    const mems = Array.from(new Set(base.map(p => p.memory)));
    mems.sort((a, b) => MEM_ORDER.indexOf(a) - MEM_ORDER.indexOf(b));
    return ["Все", ...mems];
  }, [phoneCatalogItems, phoneModel]);
  const phoneColorOptions = useMemo(() => {
    let phones = phoneCatalogItems;
    if (phoneModel !== "Все") phones = phones.filter(p => p.model === phoneModel);
    const all = phones.flatMap(p => p.colors);
    return ["Все", ...Array.from(new Set(all)).sort()];
  }, [phoneCatalogItems, phoneModel]);
  const phoneSimOptions = useMemo(() => {
    let phones = phoneCatalogItems;
    if (phoneModel !== "Все") phones = phones.filter(p => p.model === phoneModel);
    if (phoneMemory !== "Все") phones = phones.filter(p => p.memory === phoneMemory);
    const sims = Array.from(new Set(phones.map(p => p.sim)));
    const SIM_LIST = ["SIM + eSIM", "2 SIM", "1 SIM", "eSIM"];
    sims.sort((a, b) => SIM_LIST.indexOf(a) - SIM_LIST.indexOf(b));
    return ["Все", ...sims];
  }, [phoneCatalogItems, phoneModel, phoneMemory]);

  // ─── Бренды в текущей категории (для пилюль) ────────────────
  const catBrands = useMemo(() => {
    if (activeCat === "all") return ALL_BRANDS;
    const items = activeCat === "telefony"
      ? PHONE_ITEMS
      : OTHER_ITEMS.filter(p => p.category === activeCat);
    return Array.from(new Set(items.map(p => p.brand)))
      .sort((a, b) => brandRank(a) - brandRank(b) || a.localeCompare(b, "ru"));
  }, [activeCat]);

  // ─── Определения spec-фильтров для текущей категории ─────────
  const catSpecFilterDefs = useMemo(
    () => (activeCat !== "all" && activeCat !== "telefony")
      ? (CAT_SPEC_FILTERS[activeCat] ?? [])
      : [],
    [activeCat]
  );

  // ─── Доступные значения spec-фильтров (динамически) ──────────
  const specFilterOptions = useMemo(() => {
    if (!catSpecFilterDefs.length) return {} as Record<string, string[]>;
    const catItems = OTHER_ITEMS.filter(p =>
      p.category === activeCat &&
      (specBrandFilter === "Все" || p.brand === specBrandFilter)
    );
    const opts: Record<string, string[]> = {};
    for (const { specKey } of catSpecFilterDefs) {
      const vals = Array.from(new Set(
        catItems.flatMap(p => p.specs.filter(s => s.key === specKey).map(s => s.val))
      )).filter(Boolean).sort();
      if (vals.length >= 2) opts[specKey] = ["Все", ...vals];
    }
    return opts;
  }, [activeCat, catSpecFilterDefs, specBrandFilter]);

  const handleToggleFav = useCallback(async (productId: string) => {
    // Оптимистичное обновление
    setFavorites(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
    try {
      const r = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const d = await r.json();
      if (d.ids) setFavorites(d.ids);
    } catch { /* откат не нужен — просто логируем */ }
  }, []);

  const handleAddCart = useCallback(async (productId: string) => {
    const already = cart.some(c => c.productId === productId);
    if (already) return;
    // Оптимистичное обновление
    setCart(prev => [...prev, { productId, qty: 1 }]);
    try {
      const r = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, qty: 1 }),
      });
      const d = await r.json();
      if (d.items) setCart(d.items);
    } catch { /* игнорируем ошибки сети */ }
  }, [cart]);

  const filtered = useMemo(() => {
    let list = [...ALL_ITEMS];
    if (activeCat !== "all") list = list.filter((p) => p.category === activeCat);

    if (activeCat === "telefony") {
      // Телефонные фильтры — пилюли брендов + модель/память/цвет/SIM
      if (phoneBrand !== "Все") list = list.filter(p => p.brand === phoneBrand);
      if (phoneModel !== "Все") {
        const ids = new Set(PHONES_CATALOG.filter(p => p.model === phoneModel).map(p => p.id));
        list = list.filter(p => ids.has(p.id));
      }
      if (phoneMemory !== "Все") {
        const ids = new Set(PHONES_CATALOG.filter(p => p.memory === phoneMemory).map(p => p.id));
        list = list.filter(p => ids.has(p.id));
      }
      if (phoneSim !== "Все") list = list.filter(p => p.sim === phoneSim);
      if (phoneColor !== "Все") {
        const ids = new Set(PHONES_CATALOG.filter(p => p.colors.includes(phoneColor)).map(p => p.id));
        list = list.filter(p => ids.has(p.id));
      }
    } else if (activeCat !== "all") {
      // Конкретная не-телефонная категория: бренд-пилюля + spec-фильтры
      if (specBrandFilter !== "Все") list = list.filter(p => p.brand === specBrandFilter);
      for (const [specKey, val] of Object.entries(specFilters)) {
        if (val && val !== "Все") {
          list = list.filter(p => p.specs.some(s => s.key === specKey && s.val === val));
        }
      }
    } else {
      // "Все" — используем sidebar-чекбоксы брендов
      if (brands.length) list = list.filter((p) => brands.includes(p.brand));
    }

    list = list.filter((p) => p.price <= maxPrice);
    if (sort === "price_asc")  return list.sort((a, b) => a.price - b.price);
    if (sort === "price_desc") return list.sort((a, b) => b.price - a.price);
    return list.sort((a, b) => cmpArrays(defaultSortKey(a), defaultSortKey(b)));
  }, [activeCat, brands, maxPrice, sort,
      phoneBrand, phoneModel, phoneMemory, phoneSim, phoneColor,
      specBrandFilter, specFilters]);

  function toggleBrand(b: string) {
    setBrands((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    );
  }

  function resetAll() {
    setBrands([]); setMaxPrice(GLOBAL_MAX); setActiveCat("all");
    setPhoneBrand("Все"); setPhoneModel("Все");
    setPhoneMemory("Все"); setPhoneColor("Все"); setPhoneSim("Все");
    setSpecBrandFilter("Все"); setSpecFilters({});
  }

  const phoneFiltersActive =
    phoneBrand !== "Все" || phoneModel !== "Все" ||
    phoneMemory !== "Все" || phoneColor !== "Все" || phoneSim !== "Все";

  const specFiltersActive =
    specBrandFilter !== "Все" || Object.values(specFilters).some(v => v && v !== "Все");

  const sliderPct = ((maxPrice - 5_000) / (GLOBAL_MAX - 5_000)) * 100;

  return (
    <main>
      {/* Breadcrumb */}
      <div className="bg-[#F4F7FC] border-b border-[#D8E2F0]">
        <div className="section py-3 text-xs text-[#9CA3AF] flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#1A3C6E] transition-colors">Главная</Link>
          <span>/</span>
          <span className="text-[#0A1628]">Каталог</span>
        </div>
      </div>

      <div className="section py-8">
        <h1 className="text-3xl lg:text-4xl font-extrabold text-[#0A1628] mb-6">
          Каталог
        </h1>

        {/* Плитки категорий */}
        <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-[repeat(14,minmax(0,1fr))] gap-2 mb-8">
          {/* Все */}
          <button
            onClick={() => setActiveCat("all")}
            className={`flex flex-col items-center justify-center gap-2 py-4 px-1 rounded-2xl border
              transition-all duration-200
              ${activeCat === "all"
                ? "bg-[#0A1628] border-[#0A1628] text-white shadow-md -translate-y-px"
                : "bg-white border-[#EBEBEB] text-[#6B7280] hover:bg-[#F5F6F8] hover:border-[#D4D9E1] hover:-translate-y-px hover:shadow-sm"}`}
          >
            <CatAllIcon />
            <span className="text-[11px] font-medium tracking-wider leading-tight">Все</span>
          </button>

          {CATALOG_CATS.map((cat) => {
            const active = activeCat === cat.cat;
            return (
              <button
                key={cat.cat}
                onClick={() => setActiveCat(cat.cat)}
                className={`flex flex-col items-center justify-center gap-2 py-4 px-1 rounded-2xl border
                  transition-all duration-200
                  ${active
                    ? "bg-[#0A1628] border-[#0A1628] text-white shadow-md -translate-y-px"
                    : "bg-white border-[#EBEBEB] text-[#6B7280] hover:bg-[#F5F6F8] hover:border-[#D4D9E1] hover:-translate-y-px hover:shadow-sm"}`}
              >
                <CatIcon cat={cat.cat} />
                <span className="text-[11px] font-medium tracking-wider leading-tight text-center">
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Универсальный блок фильтров категории ─────────────── */}
        {activeCat !== "all" && (catBrands.length > 1 || catSpecFilterDefs.length > 0 || activeCat === "telefony") && (
          <div className="mb-6 p-4 bg-[#F4F7FC] rounded-2xl border border-[#D8E2F0]">

            {/* Строка брендов (не показываем, если бренд один) */}
            {catBrands.length > 1 && (
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-[#9CA3AF] shrink-0 mr-1">Бренд:</span>
                {(["Все", ...catBrands] as string[]).map(b => {
                  const activeBrand = activeCat === "telefony" ? phoneBrand : specBrandFilter;
                  return (
                    <button
                      key={b}
                      onClick={() => {
                        if (activeCat === "telefony") {
                          setPhoneBrand(b);
                          setPhoneModel("Все"); setPhoneMemory("Все");
                          setPhoneColor("Все"); setPhoneSim("Все");
                        } else {
                          setSpecBrandFilter(b);
                          setSpecFilters({});
                        }
                      }}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all
                        ${activeBrand === b
                          ? "bg-[#0A1628] text-white border-[#0A1628]"
                          : "bg-white border-[#D8E2F0] text-[#6B7280] hover:border-[#0A1628] hover:text-[#0A1628]"}`}
                    >
                      {b}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Телефоны: модель / память / цвет / SIM */}
            {activeCat === "telefony" && (
              <div className="flex flex-wrap gap-2 items-center">
                <CatalogFilterSelect
                  label="Модель" options={phoneModelOptions} value={phoneModel}
                  onChange={v => { setPhoneModel(v); setPhoneMemory("Все"); setPhoneColor("Все"); }}
                />
                <CatalogFilterSelect
                  label="Память" options={phoneMemoryOptions} value={phoneMemory}
                  onChange={setPhoneMemory}
                />
                <CatalogFilterSelect
                  label="Цвет" options={phoneColorOptions} value={phoneColor}
                  onChange={setPhoneColor}
                />
                <CatalogFilterSelect
                  label="SIM" options={phoneSimOptions} value={phoneSim}
                  onChange={setPhoneSim}
                />
                {(phoneModel !== "Все" || phoneMemory !== "Все" || phoneColor !== "Все" || phoneSim !== "Все") && (
                  <button
                    onClick={() => { setPhoneModel("Все"); setPhoneMemory("Все"); setPhoneColor("Все"); setPhoneSim("Все"); }}
                    className="px-3 py-2 rounded-xl text-xs text-[#6B7280] border border-[#D8E2F0]
                               hover:border-red-300 hover:text-red-500 transition-colors"
                  >✕ Сбросить</button>
                )}
              </div>
            )}

            {/* Остальные категории: spec-фильтры */}
            {activeCat !== "telefony" && catSpecFilterDefs.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                {catSpecFilterDefs.map(({ label, specKey }) => {
                  const opts = specFilterOptions[specKey];
                  if (!opts) return null;   // нет вариантов — прячем
                  return (
                    <CatalogFilterSelect
                      key={specKey}
                      label={label}
                      options={opts}
                      value={specFilters[specKey] ?? "Все"}
                      onChange={val => setSpecFilters(prev => ({ ...prev, [specKey]: val }))}
                    />
                  );
                })}
                {Object.values(specFilters).some(v => v && v !== "Все") && (
                  <button
                    onClick={() => setSpecFilters({})}
                    className="px-3 py-2 rounded-xl text-xs text-[#6B7280] border border-[#D8E2F0]
                               hover:border-red-300 hover:text-red-500 transition-colors"
                  >✕ Сбросить</button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Сайдбар + сетка */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Sidebar */}
          <aside className="w-full lg:w-60 shrink-0 space-y-6">
            {/* Бренды — показываем только для "Все" (в конкретных категориях — пилюли выше) */}
            {activeCat === "all" && (
            <div className="card p-4">
              <h3 className="font-bold text-[#0A1628] text-sm mb-3">Бренды</h3>
              <div className="space-y-2">
                {ALL_BRANDS.map((b) => (
                  <label key={b} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={brands.includes(b)}
                      onChange={() => toggleBrand(b)}
                      className="w-4 h-4 accent-[#1A3C6E] rounded"
                    />
                    <span className={`text-sm transition-colors
                      ${brands.includes(b)
                        ? "text-[#1A3C6E] font-semibold"
                        : "text-[#4B5563] group-hover:text-[#1A3C6E]"}`}>
                      {b}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            )}

            {/* Цена */}
            <div className="card p-4">
              <h3 className="font-bold text-[#0A1628] text-sm mb-3">Цена до</h3>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) =>
                    setMaxPrice(Math.min(GLOBAL_MAX, Number(e.target.value) || GLOBAL_MAX))
                  }
                  className="field w-full text-sm"
                />
                <span className="text-xs text-[#9CA3AF] shrink-0">₽</span>
              </div>
              <input
                type="range"
                min={5_000} max={GLOBAL_MAX} step={5_000}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full"
                style={{
                  background: `linear-gradient(to right, #1A3C6E ${sliderPct}%, #D8E2F0 ${sliderPct}%)`,
                }}
              />
              <div className="flex justify-between text-[10px] text-[#9CA3AF] mt-1">
                <span>5 000 ₽</span>
                <span>{fmtRub(GLOBAL_MAX)} ₽</span>
              </div>
            </div>

            {/* Сброс */}
            {(brands.length > 0 || maxPrice < GLOBAL_MAX || activeCat !== "all" || phoneFiltersActive || specFiltersActive) && (
              <button
                onClick={resetAll}
                className="w-full py-2 text-sm text-[#1A3C6E] border border-[#1A3C6E]/30 rounded-xl
                           hover:bg-[#EBF0F9] transition-colors"
              >
                Сбросить фильтры
              </button>
            )}
          </aside>

          {/* Сетка */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4 gap-4">
              <p className="text-sm text-[#6B7280]">
                Найдено:&nbsp;
                <span className="font-semibold text-[#0A1628]">{filtered.length}</span> товаров
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#9CA3AF] hidden sm:inline">Сортировка:</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as typeof sort)}
                  className="field text-sm py-1.5 pr-8"
                >
                  <option value="popular">По популярности</option>
                  <option value="price_asc">Сначала дешевле</option>
                  <option value="price_desc">Сначала дороже</option>
                </select>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="card p-12 text-center">
                <span className="text-5xl block mb-4">🔍</span>
                <p className="text-[#6B7280]">По вашим фильтрам ничего не найдено.</p>
                <button onClick={resetAll} className="btn-primary mt-4 inline-flex">
                  Сбросить фильтры
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                {filtered.map((p) => (
                  <ProductCard
                    key={p.id}
                    item={p}
                    authed={authed}
                    inFavs={favorites.includes(p.id)}
                    inCart={cart.some(c => c.productId === p.id)}
                    onToggleFav={handleToggleFav}
                    onAddCart={handleAddCart}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

/* ── CatalogFilterSelect — компактный дропдаун для телефонных фильтров ── */
function CatalogFilterSelect({
  label, options, value, onChange,
}: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  const isActive = value !== "Все";
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none pl-3 pr-7 py-2 rounded-xl border text-sm font-medium
                    cursor-pointer outline-none transition-colors
                    ${isActive
                      ? "bg-[#0A1628] border-[#0A1628] text-white"
                      : "bg-white border-[#D8E2F0] text-[#374151] hover:border-[#0A1628]"}`}
      >
        <option value="Все">{label}</option>
        {options.slice(1).map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <span className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs
                        ${isActive ? "text-white" : "text-[#6B7280]"}`}>▾</span>
    </div>
  );
}

/* ── ProductCard ──────────────────────────────────────────────── */
interface ProductCardProps {
  item:          CatalogItem;
  authed:        boolean;
  inFavs:        boolean;
  inCart:        boolean;
  onToggleFav:   (id: string) => void;
  onAddCart:     (id: string) => void;
}

function ProductCard({ item: p, authed, inFavs, inCart, onToggleFav, onAddCart }: ProductCardProps) {
  const { openModal } = useAppModal();
  const down = Math.ceil(p.price * getMinDownPct(p.price));
  const res  = calcInstallment({ price: p.price, down, term: 6 });

  function handleBuy() {
    openModal({
      productName: p.name,
      memory:      p.memories?.[0],
      sim:         p.sim,
      price:       p.price,
      down,
      term:        6,
      monthly:     res.monthly,
    });
  }

  const btnInCart = inCart
    ? "bg-[#0C7A58] text-white cursor-default"
    : "bg-[#0A1628] text-white hover:bg-[#1A3C6E]";

  const specsText = [
    ...(p.memories && p.memories.length > 0 ? [p.memories.join(" / ")] : []),
    ...(p.sim ? [p.sim] : []),
  ].join(" · ");

  const BtnContent = inCart ? (
    <><svg width="10" height="10" viewBox="0 0 12 12" fill="none">
      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"/>
    </svg>В корзине</>
  ) : (
    <><svg width="11" height="11" viewBox="0 0 20 20" fill="none">
      <path d="M3 3h1.5l2.5 9h8l2-6H7" stroke="currentColor" strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="9" cy="16.5" r="1.2" fill="currentColor"/>
      <circle cx="15" cy="16.5" r="1.2" fill="currentColor"/>
    </svg>В корзину</>
  );

  return (
    <div
      className="bg-white flex flex-col group relative overflow-hidden
                 transition-shadow duration-250
                 hover:shadow-[0_4px_20px_rgba(10,22,40,0.10)]"
      style={{ borderRadius: "14px", border: "1px solid #f0f0f0" }}
    >

      {/* Кнопка «Избранное» */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleFav(p.id); }}
        aria-label={inFavs ? "Убрать из избранного" : "В избранное"}
        className={`absolute top-1.5 right-1.5 z-20 w-6 h-6 flex items-center justify-center
                    rounded-full transition-all active:scale-90
                    ${inFavs
                      ? "bg-red-50 text-red-500"
                      : "bg-white/90 text-[#C4C9D4] opacity-0 group-hover:opacity-100"}`}
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
      >
        <svg width="11" height="11" viewBox="0 0 20 20" fill={inFavs ? "currentColor" : "none"}>
          <path d="M10 17S3 12.5 3 7a4 4 0 017-2.66A4 4 0 0117 7c0 5.5-7 10-7 10z"
                stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Бейдж */}
      {p.badge && (
        <span className={`absolute top-1.5 left-1.5 z-20 px-1.5 py-0.5 text-[9px] font-bold rounded-full
          ${p.badge === "Хит"     ? "bg-amber-100 text-amber-700" :
            p.badge === "Новинка" ? "bg-[#EBF0F9] text-[#1A3C6E]" :
                                    "bg-red-100 text-red-600"}`}>
          {p.badge}
        </span>
      )}

      {/* Изображение — slideshow со всеми цветами */}
      <ProductSlideshow
        images={p.img}
        alt={p.name}
        className="w-full bg-white overflow-hidden flex items-center justify-center group-hover:[&>img]:scale-[1.04]"
        imgClassName="transition-transform duration-300 p-2"
        style={{ aspectRatio: "1/1" }}
        fallback={<div className="w-full h-full flex items-center justify-center text-4xl">{p.emoji}</div>}
      />

      {/* Текст */}
      {/* pb-2 на мобиле (кнопка в потоке), sm:pb-8 резервирует ~32px под оверлей-кнопку */}
      <div className="px-2.5 pt-1.5 pb-2 sm:pb-8">
        <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#8B8B8C]">
          {p.brand}
        </p>
        <h3 className="font-medium text-[#0A1628] text-[13px] leading-snug line-clamp-2 mt-0.5">
          {p.name}
        </h3>
        {/* Характеристики — всегда видны */}
        {specsText && (
          <p className="text-[10px] text-[#ADADAD] mt-0.5">{specsText}</p>
        )}
        {/* Цена */}
        <p className="font-bold text-[#0A1628] mt-1.5 leading-none" style={{ fontSize: "15px" }}>
          {p.tgSynced ? fmtRub(p.price) : fmtRubApprox(p.price)} ₽
          {p.oldPrice && (
            <span className="ml-1.5 text-[11px] text-[#C4C9D4] line-through font-normal">
              {fmtRub(p.oldPrice)} ₽
            </span>
          )}
        </p>
        <p className="text-[10px] text-[#9CA3AF] mt-0.5">
          от {fmtRub(res.monthly)} ₽/мес.
        </p>

        {/* Мобиле: кнопка в потоке */}
        {authed ? (
          <button
            onClick={inCart ? undefined : () => onAddCart(p.id)}
            className={`mt-2 sm:hidden w-full py-1.5 rounded-[10px] text-[11px] font-semibold
                        flex items-center justify-center gap-1 transition-all
                        active:scale-95 touch-manipulation ${btnInCart}`}
          >
            {BtnContent}
          </button>
        ) : (
          <button onClick={handleBuy}
            className="mt-2 sm:hidden w-full py-1.5 rounded-[10px] bg-[#0A1628] text-white
                       text-[11px] font-semibold active:scale-95 transition-all touch-manipulation">
            Купить в рассрочку
          </button>
        )}
      </div>

      {/* Десктоп: overlay button снизу */}
      {authed ? (
        <button
          onClick={inCart ? undefined : () => onAddCart(p.id)}
          className={`hidden sm:flex absolute inset-x-0 bottom-0 z-10
                      items-center justify-center gap-1
                      py-2 text-[11px] font-semibold
                      translate-y-full group-hover:translate-y-0
                      transition-transform duration-200
                      active:scale-[0.98] touch-manipulation ${btnInCart}`}
        >
          {BtnContent}
        </button>
      ) : (
        <button
          onClick={handleBuy}
          className="hidden sm:flex absolute inset-x-0 bottom-0 z-10
                     items-center justify-center py-2
                     bg-[#0A1628] text-white text-[11px] font-semibold
                     translate-y-full group-hover:translate-y-0
                     transition-transform duration-200
                     active:scale-[0.98] touch-manipulation"
        >
          Купить в рассрочку
        </button>
      )}
    </div>
  );
}

/* ── SVG-иконки категорий (20×20, stroke 1.5, no fill) ─────────── */

function CatAllIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2"    y="2"    width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="11"   y="2"    width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="2"    y="11"   width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="11"   y="11"   width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

function CatIcon({ cat }: { cat: string }) {
  switch (cat) {
    case "telefony":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="5.5" y="1.5" width="9" height="17" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="10" cy="15.5" r="0.9" fill="currentColor"/>
        </svg>
      );
    case "planshety":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="2.5" y="3" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="16.5" cy="10" r="0.9" fill="currentColor"/>
          <line x1="6" y1="6" x2="12" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );
    case "aksessuary":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 9.5a6 6 0 0112 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <rect x="2" y="9.5" width="3.5" height="5.5" rx="1.75" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="14.5" y="9.5" width="3.5" height="5.5" rx="1.75" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      );
    case "noutbuki":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="4" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M1 15h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M7 15l.5-2h5l.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      );
    case "smart_chasy":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="6" y="5.5" width="8" height="9" rx="3" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M8.5 5.5V4h3v1.5M8.5 14.5V16h3v-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 8v2.5l1.5 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case "gadzety_i_konsoli":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="1.5" y="6" width="17" height="8" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M6.5 10h3M8 8.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="13" cy="9.5" r="0.7" fill="currentColor"/>
          <circle cx="15" cy="11" r="0.7" fill="currentColor"/>
          <circle cx="11" cy="11" r="0.7" fill="currentColor"/>
          <circle cx="13" cy="12.5" r="0.7" fill="currentColor"/>
        </svg>
      );
    case "televizory":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="1.5" y="3.5" width="17" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M7 16.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M10 14.5v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );
    case "bytovaya_tekhnika":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="1.5" width="14" height="17" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="10" cy="11" r="4" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M5.5 5h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="12.5" cy="5" r="1" fill="currentColor"/>
        </svg>
      );
    case "konditsionery":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="1.5" y="5" width="17" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M5 15.5c2-2 3-2 5 0s3 2 5 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M6 8.5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="15" cy="8.5" r="1" fill="currentColor"/>
        </svg>
      );
    case "mebel":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M5 11V5.5a1 1 0 011-1h8a1 1 0 011 1V11" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M3.5 11h13v2.5H3.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M6 13.5v3M14 13.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );
    case "detskie_tovary":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 4.5h3l4 8h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6 4.5l6.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="7.5" cy="16" r="1.75" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="14" cy="16" r="1.75" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      );
    case "dlya_doma_i_sada":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 10L10 3l7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 8.5V17h4v-4h2v4h4V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case "posuda_i_kukhnya":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M6.5 2v4.5a2.5 2.5 0 000 5V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M5 2v3M6.5 2v3M8 2v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M13.5 2c0 0 2 2.5 2 5s-2 2.5-2 2.5V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    default:
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      );
  }
}
