"use client";
import Link from "next/link";
import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  CATALOG_CATS, PRODUCTS, PHONES_CATALOG,
  type Product,
} from "@/lib/data";
import { fmtRub, calcInstallment, getMinDownPct } from "@/lib/calculator-logic";
import { useAppModal } from "@/lib/modal-context";

// ─── Расширенный тип с опциональными полями ───────────────────
type CatalogItem = Product & { img?: string; sim?: string };

// ─── Порядок памяти ───────────────────────────────────────────
const MEM_ORDER = ["64 ГБ", "128 ГБ", "256 ГБ", "512 ГБ", "1 ТБ", "2 ТБ"];

// ─── Порядок SIM ──────────────────────────────────────────────
const SIM_ORDER: Record<string, number> = {
  "eSIM": 0, "SIM + eSIM": 1, "2 SIM": 2, "1 SIM": 3,
};

// ─── Порядок брендов ──────────────────────────────────────────
const BRAND_PRIORITY = ["Apple", "Samsung", "Xiaomi", "Honor"];
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

// Единый ключ для сортировки "По популярности"
function defaultSortKey(item: CatalogItem): number[] {
  const bRank = brandRank(item.brand);
  const brand = item.brand;
  const model = item.name;
  let modelKey: number[];
  if (brand === "Apple") {
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
    modelKey = [0];
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
function CatalogContent() {
  const searchParams = useSearchParams();
  const initCat      = searchParams.get("cat") ?? "all";

  const [activeCat, setActiveCat] = useState<string>(initCat);
  const [brands,    setBrands]    = useState<string[]>([]);
  const [maxPrice,  setMaxPrice]  = useState(GLOBAL_MAX);
  const [sort,      setSort]      = useState<"popular"|"price_asc"|"price_desc">("popular");

  const filtered = useMemo(() => {
    let list = [...ALL_ITEMS];
    if (activeCat !== "all") list = list.filter((p) => p.category === activeCat);
    if (brands.length)       list = list.filter((p) => brands.includes(p.brand));
    list = list.filter((p) => p.price <= maxPrice);

    if (sort === "price_asc")  return list.sort((a, b) => a.price - b.price);
    if (sort === "price_desc") return list.sort((a, b) => b.price - a.price);
    // "popular" — бренд→модель→память→SIM
    return list.sort((a, b) => cmpArrays(defaultSortKey(a), defaultSortKey(b)));
  }, [activeCat, brands, maxPrice, sort]);

  function toggleBrand(b: string) {
    setBrands((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    );
  }

  function resetAll() {
    setBrands([]); setMaxPrice(GLOBAL_MAX); setActiveCat("all");
  }

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
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-13 gap-3 mb-8 auto-cols-fr">
          <button
            onClick={() => setActiveCat("all")}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center transition-all
              ${activeCat === "all"
                ? "bg-[#1A3C6E] border-[#1A3C6E] text-white shadow-md"
                : "bg-white border-[#D8E2F0] text-[#6B7280] hover:border-[#1A3C6E]/40 hover:text-[#1A3C6E]"}`}
          >
            <span className="text-2xl">🏷️</span>
            <span className="text-[10px] font-semibold leading-tight">Все</span>
          </button>

          {CATALOG_CATS.map((cat) => {
            const active = activeCat === cat.cat;
            return (
              <button
                key={cat.cat}
                onClick={() => setActiveCat(cat.cat)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center transition-all
                  ${active
                    ? "bg-[#1A3C6E] border-[#1A3C6E] text-white shadow-md"
                    : "bg-white border-[#D8E2F0] text-[#6B7280] hover:border-[#1A3C6E]/40 hover:text-[#1A3C6E]"}`}
              >
                <span className="text-2xl">{CAT_EMOJIS[cat.cat] ?? "📦"}</span>
                <span className="text-[10px] font-semibold leading-tight">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Сайдбар + сетка */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Sidebar */}
          <aside className="w-full lg:w-60 shrink-0 space-y-6">
            {/* Бренды */}
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
            {(brands.length > 0 || maxPrice < GLOBAL_MAX || activeCat !== "all") && (
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
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((p) => <ProductCard key={p.id} item={p} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

/* ── ProductCard ──────────────────────────────────────────────── */
function ProductCard({ item: p }: { item: CatalogItem }) {
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

  return (
    <div className="card p-4 hover:shadow-md transition-shadow group flex flex-col">
      {/* Бейдж */}
      {p.badge && (
        <span className={`inline-block self-start px-2 py-0.5 text-[10px] font-bold rounded-full mb-2
          ${p.badge === "Хит"     ? "bg-amber-100 text-amber-700" :
            p.badge === "Новинка" ? "bg-[#EBF0F9] text-[#1A3C6E]" :
                                    "bg-red-100 text-red-600"}`}>
          {p.badge}
        </span>
      )}

      {/* Изображение */}
      <div className="w-full aspect-[3/4] bg-gradient-to-b from-[#F4F7FC] to-[#EBF0F9] rounded-xl mb-3
                      overflow-hidden flex items-center justify-center">
        {p.img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.img}
            alt={p.name}
            className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
              (e.currentTarget.nextSibling as HTMLElement).style.display = "flex";
            }}
          />
        ) : null}
        <div className={`${p.img ? "hidden" : "flex"} w-full h-full items-center justify-center text-5xl`}>
          {p.emoji}
        </div>
      </div>

      {/* Бренд */}
      <p className="text-[11px] text-[#6B7280] mb-0.5">{p.brand}</p>

      {/* Название */}
      <h3 className="font-semibold text-[#0A1628] text-xs leading-snug mb-1.5 line-clamp-2
                     group-hover:text-[#1A3C6E] transition-colors">
        {p.name}
      </h3>

      {/* Память + SIM */}
      <div className="flex flex-wrap gap-1 mb-2">
        {p.memories && p.memories.length > 0 && p.memories.map((m) => (
          <span key={m}
            className="px-1.5 py-0.5 bg-[#EBF0F9] text-[#1A3C6E] rounded-full text-[9px] font-semibold">
            {m}
          </span>
        ))}
        {p.sim && (
          <span className="px-1.5 py-0.5 bg-[#F4F7FC] text-[#6B7280] rounded-full text-[9px]">
            {p.sim}
          </span>
        )}
      </div>

      {/* Цена */}
      <div className="mt-auto">
        <p className="font-extrabold text-[#0A1628] text-sm leading-none">
          {fmtRub(p.price)} ₽
          {p.oldPrice && (
            <span className="ml-2 text-[11px] text-[#9CA3AF] line-through font-normal">
              {fmtRub(p.oldPrice)} ₽
            </span>
          )}
        </p>
        <p className="text-[10px] text-[#0C7A58] font-semibold mt-0.5">
          от {fmtRub(res.monthly)} ₽/мес.
        </p>
      </div>

      <button
        onClick={handleBuy}
        className="mt-3 w-full py-2.5 rounded-xl bg-[#0A1628] text-white
                   text-xs font-semibold hover:bg-[#1A3C6E] active:scale-95
                   transition-all touch-manipulation"
      >
        Купить в рассрочку
      </button>
    </div>
  );
}

/* ── Эмодзи категорий ─────────────────────────────────────────── */
const CAT_EMOJIS: Record<string, string> = {
  "telefony":          "📱",
  "planshety":         "📟",
  "aksessuary":        "🎧",
  "noutbuki":          "💻",
  "smart_chasy":       "⌚",
  "televizory":        "📺",
  "bytovaya_tekhnika": "🫧",
  "konditsionery":     "❄️",
  "mebel":             "🪑",
  "detskie_tovary":    "🧸",
  "dlya_doma_i_sada":  "🏠",
  "posuda_i_kukhnya":  "🍳",
};
