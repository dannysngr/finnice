"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { PHONES_CATALOG, PHONE_PRODUCTS, type PhoneItem, type SimType, type Product } from "@/lib/data";
import { calcInstallment, fmtRub, fmtRubApprox, getMinDownPct } from "@/lib/calculator-logic";
import { COMPANY } from "@/lib/data";
import { useAppModal } from "@/lib/modal-context";
import { notifyCartChanged, notifyFavoritesChanged } from "@/lib/cart-events";
import { useCartFeedback } from "@/lib/cart-feedback";
import { guestCart } from "@/lib/guest-cart";
import { ProductSlideshow } from "@/components/ProductSlideshow";

// ─── Константы ────────────────────────────────────────────────

const BRANDS = ["Apple", "Samsung", "Xiaomi", "Honor"] as const;

const MEMORY_ORDER = ["64 ГБ", "128 ГБ", "256 ГБ", "512 ГБ", "1 ТБ", "2 ТБ"];

const SIMS: ("Все" | SimType)[] = ["Все", "SIM + eSIM", "2 SIM", "1 SIM", "eSIM"];

// Приоритет SIM: eSIM(0) → SIM+eSIM(1) → 2 SIM(2) → 1 SIM(3)
const SIM_ORDER: Record<string, number> = {
  "eSIM":       0,
  "SIM + eSIM": 1,
  "2 SIM":      2,
  "1 SIM":      3,
};

const DEFAULT_TERM = 6;

// ─── Источник: объединённые телефоны (1 карточка на модель) из data.ts ──
// PHONE_PRODUCTS уже сгруппирован по (brand, model) с variants[memory × sim × color].
// Здесь нужен только helper `getModel` для совместимости со старой сортировкой.
const getModel = (p: Product): string => p.name.replace(`${p.brand} `, "");

// ─── Ключи сортировки ────────────────────────────────────────

// Apple iPhone: [поколение↓, тип модели]
// Pro(0) → Pro Max(1) → Air(2) → base(3)
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

// Samsung: [серия, поколение↓, тир модели]
// S(0) → Z Fold/Flip(1) → A(2)
// Внутри S: Ultra(0) → +(1) → base(2)
// Внутри Z: Fold(0) → Flip(1)
function samsungSortKey(model: string): [number, number, number] {
  const lower = model.toLowerCase();
  // Поколение: «Galaxy S26 Ultra» → 26, «Galaxy Z Fold7» → 7
  const gen = parseInt(model.match(/\d+/)?.[0] ?? "0");
  let series: number;
  let tier: number;
  if (lower.includes(" s")) {
    series = 0;
    if      (lower.includes("ultra")) tier = 0;
    else if (lower.includes("+"))     tier = 1;
    else                              tier = 2;
  } else if (lower.includes("fold") || lower.includes("flip")) {
    series = 1;
    tier = lower.includes("fold") ? 0 : 1;
  } else {
    // A-серия
    series = 2;
    tier = 0;
  }
  return [series, -gen, tier];
}

// Xiaomi: [серия, поколение↓, тир модели]
// Numeric(0) → T(1) → Redmi Note(2) → Redmi(3)
// Внутри Numeric: Ultra(0) → Pro(1) → base(2)
function xiaomiSortKey(model: string): [number, number, number] {
  const lower = model.toLowerCase();
  const gen = parseInt(model.match(/\d+/)?.[0] ?? "0");
  let series: number;
  let tier: number;
  if (lower.startsWith("xiaomi ") && /xiaomi\s+\d/.test(lower)) {
    series = 0;
    if      (lower.includes("ultra")) tier = 0;
    else if (lower.includes("pro"))   tier = 1;
    else                              tier = 2;
  } else if (lower.includes(" t")) {
    series = 1; tier = 0;
  } else if (lower.includes("redmi note")) {
    series = 2; tier = 0;
  } else {
    series = 3; tier = 0;
  }
  return [series, -gen, tier];
}

// Honor: [серия, поколение↓, тир модели]
// Magic(0) → Numeric(1) → X(2)
// Внутри Numeric: Pro(0) → base(1)
function honorSortKey(model: string): [number, number, number] {
  const lower = model.toLowerCase();
  const gen = parseInt(model.match(/\d+/)?.[0] ?? "0");
  let series: number;
  let tier: number;
  if (lower.includes("magic")) {
    series = 0;
    tier = lower.includes("pro") ? 0 : 1;
  } else if (/honor\s+\d/.test(lower)) {
    series = 1;
    tier = lower.includes("pro") ? 0 : 1;
  } else {
    series = 2; tier = 0;
  }
  return [series, -gen, tier];
}

// ─── Ежемесячный платёж ──────────────────────────────────────
function monthly(price: number): number {
  const down = Math.ceil(price * getMinDownPct(price));
  return calcInstallment({ price, down, term: DEFAULT_TERM }).monthly;
}

// ─── Бейдж ───────────────────────────────────────────────────
function Badge({ text }: { text?: string }) {
  if (!text) return null;
  const cls =
    text === "Хит"     ? "bg-amber-100 text-amber-700" :
    text === "Новинка" ? "bg-[#EBF0F9] text-[#1A3C6E]" :
                         "bg-red-100   text-red-600";
  return (
    <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold z-10 ${cls}`}>
      {text}
    </span>
  );
}

// ─── Карточка товара ─────────────────────────────────────────
interface PhoneCardProps {
  phone:        Product;
  authed:       boolean;
  inFavs:       boolean;
  cartQty:      number;
  onToggleFav:  (id: string) => void;
  onAddCart:    (id: string) => void;
  onUpdateQty:  (id: string, qty: number) => void;
}

function PhoneCard({ phone, authed, inFavs, cartQty, onToggleFav, onAddCart, onUpdateQty }: PhoneCardProps) {
  const inCart = cartQty > 0;
  const { showCartAdded } = useCartFeedback();
  const perMonth = monthly(phone.price);
  const { openModal } = useAppModal();

  // Производные поля для совместимости (раньше phone был PhoneItem с явными
  // memory/sim — теперь это Product с variants, берём первый вариант).
  const modelName = getModel(phone);
  const firstV = phone.variants?.[0];
  const memory = firstV?.memory ?? "";
  const sim = firstV?.sim ?? "";

  function handleBuy() {
    const down       = Math.ceil(phone.price * getMinDownPct(phone.price));
    const monthlyAmt = calcInstallment({ price: phone.price, down, term: DEFAULT_TERM }).monthly;
    openModal({
      productName: phone.name,
      memory,
      sim,
      price:       phone.price,
      down,
      term:        DEFAULT_TERM,
      monthly:     monthlyAmt,
    });
  }

  /** Постоянная нижняя строка действия. */
  const ActionRow = () => {
    if (inCart) {
      return (
        <div className="relative z-20 mt-2 w-full flex items-stretch rounded-[10px]
                        bg-[#0C7A58] text-white text-[11px] font-semibold overflow-hidden
                        ring-1 ring-[#0a6449]/30">
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUpdateQty(phone.id, cartQty - 1); }}
            aria-label="Убавить"
            className="px-3 py-1.5 hover:bg-[#0a6449] active:scale-95 transition-all touch-manipulation">
            −
          </button>
          <span className="flex-1 text-center py-1.5 tabular-nums">
            В корзине · {cartQty}
          </span>
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUpdateQty(phone.id, cartQty + 1); }}
            aria-label="Добавить ещё"
            className="px-3 py-1.5 hover:bg-[#0a6449] active:scale-95 transition-all touch-manipulation">
            +
          </button>
        </div>
      );
    }
    return (
      <button onClick={(e) => {
          e.preventDefault(); e.stopPropagation();
          onAddCart(phone.id);
          if (authed) {
            showCartAdded({ productName: phone.name });
          } else {
            const down = Math.ceil(phone.price * getMinDownPct(phone.price));
            const monthlyAmt = calcInstallment({ price: phone.price, down, term: DEFAULT_TERM }).monthly;
            openModal({
              productName: phone.name,
              memory,
              sim,
              price:       phone.price,
              down,
              term:        DEFAULT_TERM,
              monthly:     monthlyAmt,
              showCartActions: true,
            });
          }
        }}
        className="relative z-20 mt-2 w-full py-1.5 rounded-[10px] bg-[#0A1628] text-white
                   text-[11px] font-semibold flex items-center justify-center gap-1
                   hover:bg-[#1A3C6E] active:scale-95 transition-all touch-manipulation">
        <svg width="11" height="11" viewBox="0 0 20 20" fill="none">
          <path d="M3 3h1.5l2.5 9h8l2-6H7" stroke="currentColor" strokeWidth="1.6"
                strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="9" cy="16.5" r="1.2" fill="currentColor"/>
          <circle cx="15" cy="16.5" r="1.2" fill="currentColor"/>
        </svg>
        В корзину
      </button>
    );
  };

  // Память для сегментного блока под названием.
  // Нормализуем в единую единицу: если все ≥ 1ТБ → ТБ; иначе все ГБ
  // (1 ТБ при смешанном наборе → 1024 ГБ).
  const memChips = useMemo(() => {
    const toGB = (s: string) => {
      const n = parseInt(s.replace(/\D/g, "")) || 0;
      return s.includes("ТБ") ? n * 1024 : n;
    };
    const gbs = Array.from(new Set(
      (phone.variants ?? []).map(v => toGB(v.memory ?? "")).filter(Boolean)
    )).sort((a, b) => a - b);
    if (!gbs.length) return null;
    const allTB = gbs.every(g => g >= 1024);
    return allTB
      ? { values: gbs.map(g => String(g / 1024)), unit: "ТБ" }
      : { values: gbs.map(String), unit: "ГБ" };
  }, [phone.variants]);
  const hasVariants = (phone.variants?.length ?? 0) > 0;

  return (
    <div
      className="bg-white flex flex-col group relative overflow-hidden
                 transition-shadow duration-250
                 hover:shadow-[0_4px_20px_rgba(10,22,40,0.10)]"
      style={{ borderRadius: "14px", border: "1px solid #f0f0f0" }}
    >
      {/* Кликабельная подложка — клик по карточке ведёт на детальную */}
      <Link
        href={`/product/${phone.id}/`}
        aria-label={phone.name}
        className="absolute inset-0 z-10"
      />

      <Badge text={phone.badge} />

      {/* ❤ — избранное */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFav(phone.id); }}
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

      {/* Изображение — slideshow со всеми цветами */}
      <ProductSlideshow
        images={phone.img}
        alt={phone.name}
        className="w-full bg-white overflow-hidden flex items-center justify-center
                   group-hover:[&>img]:scale-[1.04]"
        imgClassName="transition-transform duration-300 p-2"
        style={{ aspectRatio: "1/1" }}
        fallback={<div className="w-full h-full flex items-center justify-center text-4xl">📱</div>}
      />

      {/* Текст + действия */}
      <div className="px-2.5 pt-1.5 pb-2.5">
        <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#8B8B8C]">
          {phone.brand}
        </p>
        <h3 className="font-medium text-[#0A1628] text-[13px] leading-snug line-clamp-2 mt-0.5">
          {modelName}
        </h3>
        {/* Характеристики — сегментный блок памяти (как у MacBook), без лейбла. */}
        {memChips && (
          <div className="mt-1">
            <span className="inline-flex items-stretch text-[9px] font-semibold text-[#6B7280]
                            bg-[#F4F7FC] border border-[#E5E7EB] rounded-md leading-none overflow-hidden">
              {memChips.values.map((v, i) => (
                <span key={v + i}
                  className={`px-1.5 py-0.5 ${i > 0 ? "border-l border-[#E5E7EB]" : ""}`}>
                  {v}
                </span>
              ))}
              {memChips.unit && (
                <span className="px-1.5 py-0.5 border-l border-[#E5E7EB] bg-[#EBF0F9] text-[#1A3C6E]">
                  {memChips.unit}
                </span>
              )}
            </span>
          </div>
        )}
        {/* Цена. Для variants — «от <min> ₽», иначе обычная цена. */}
        <p className="font-bold text-[#0A1628] mt-1.5 leading-none" style={{ fontSize: "15px" }}>
          {hasVariants ? (
            <>
              <span className="text-[10px] font-semibold text-[#6B7280] mr-1">от</span>
              {fmtRub(phone.price)} ₽
            </>
          ) : phone.tgSynced ? (
            `${fmtRub(phone.price)} ₽`
          ) : (
            `${fmtRubApprox(phone.price)} ₽`
          )}
        </p>
        <p className="text-[10px] text-[#9CA3AF] mt-0.5">
          от {fmtRub(perMonth)} ₽/мес.
        </p>

        {/* Действие — всегда видно, со счётчиком qty если в корзине */}
        <ActionRow />
      </div>
    </div>
  );
}

// ─── Дропдаун-фильтр ─────────────────────────────────────────
interface DropdownProps {
  label:    string;
  options:  string[];
  value:    string;
  onChange: (v: string) => void;
}

function FilterDropdown({ label, options, value, onChange }: DropdownProps) {
  const isActive = value !== options[0];
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none pl-3 pr-7 py-2 rounded-xl border text-sm font-medium
                    cursor-pointer outline-none transition-colors
                    ${isActive
                      ? "bg-[#0C7A58] border-[#0C7A58] text-white"
                      : "bg-white border-[#D8E2F0] text-[#374151] hover:border-[#0C7A58]"}`}
      >
        <option value={options[0]}>{label}</option>
        {options.slice(1).map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <span className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs
                        ${isActive ? "text-white" : "text-[#6B7280]"}`}>
        ▾
      </span>
    </div>
  );
}

// ── Принадлежность к группам (по английскому названию до скобок) ──
const TITANIUM_PRO_SET = new Set([
  "Black Titanium", "Blue Titanium", "Cosmic Orange", "Deep Blue",
  "Deep Purple",    "Desert Titanium", "Natural Titanium", "Space Black",
  "Titanium Black", "Titanium Blue",   "Titanium Gray",    "Titanium Green",
  "Titanium Silver","White Titanium",
]);
const AIR_PALETTE_SET = new Set([
  "Cloud White", "Lavender", "Light Gold", "Mist Blue", "Sage", "Sky Blue",
]);
const CLASSIC_SET = new Set([
  "Black", "Gold", "Graphite", "Midnight", "Silver",
  "Space Gray", "Starlight", "White",
]);

function engName(c: string) { return c.split("(")[0].trim(); }

// ─── Цветовой дропдаун с группами ────────────────────────────
function ColorFilterDropdown({
  options, value, onChange,
}: { options: string[]; value: string; onChange: (v: string) => void }) {
  const isActive = value !== "Все";

  const groups = useMemo(() => {
    const buckets: Record<string, string[]> = {
      "Титановые и Pro": [],
      "Палитра Air":     [],
      "Классические":    [],
      "Яркие цвета":     [],
    };
    for (const c of options.slice(1)) {           // пропускаем "Все"
      const eng = engName(c);
      if (TITANIUM_PRO_SET.has(eng) || eng.includes("Titanium")) {
        buckets["Титановые и Pro"].push(c);
      } else if (AIR_PALETTE_SET.has(eng)) {
        buckets["Палитра Air"].push(c);
      } else if (CLASSIC_SET.has(eng)) {
        buckets["Классические"].push(c);
      } else {
        buckets["Яркие цвета"].push(c);
      }
    }
    for (const arr of Object.values(buckets)) {
      arr.sort((a, b) => engName(a).localeCompare(engName(b)));
    }
    return (Object.entries(buckets) as [string, string[]][])
      .filter(([, items]) => items.length > 0);
  }, [options]);

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none pl-3 pr-7 py-2 rounded-xl border text-sm font-medium
                    cursor-pointer outline-none transition-colors
                    ${isActive
                      ? "bg-[#0C7A58] border-[#0C7A58] text-white"
                      : "bg-white border-[#D8E2F0] text-[#374151] hover:border-[#0C7A58]"}`}
      >
        <option value="Все">Цвет</option>
        {groups.map(([groupLabel, items]) => (
          <optgroup key={groupLabel} label={groupLabel}>
            {items.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </optgroup>
        ))}
      </select>
      <span className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs
                        ${isActive ? "text-white" : "text-[#6B7280]"}`}>
        ▾
      </span>
    </div>
  );
}

// ─── Таблетка бренда ─────────────────────────────────────────
function BrandPill({ brand, active, onClick }: { brand: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all
                  ${active
                    ? "bg-[#0A1628] text-white border-[#0A1628]"
                    : "bg-white border-[#D8E2F0] text-[#6B7280] hover:border-[#0A1628] hover:text-[#0A1628]"}`}
    >
      {brand}
    </button>
  );
}

interface CartEntry { productId: string; qty: number; }

// ─── Главный компонент ───────────────────────────────────────
export function SmartphonesSection() {
  const [brand,  setBrand]  = useState("Apple");
  const [model,  setModel]  = useState("Все");
  const [memory, setMemory] = useState("Все");
  const [color,  setColor]  = useState("Все");
  const [sim,    setSim]    = useState<"Все" | SimType>("Все");

  // ─── Auth / Favorites / Cart ──────────────────────────────
  const [authed,    setAuthed]    = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [cart,      setCart]      = useState<CartEntry[]>([]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.authed) {
          setAuthed(true);
          Promise.all([
            fetch("/api/favorites").then(r => r.ok ? r.json() : { ids: [] }),
            fetch("/api/cart").then(r => r.ok ? r.json() : { items: [] }),
          ]).then(([fav, crt]) => {
            setFavorites(fav.ids ?? []);
            setCart(crt.items ?? []);
          });
        } else {
          setCart(guestCart.getItems());
        }
      })
      .catch(() => setCart(guestCart.getItems()));
  }, []);

  const handleToggleFav = async (productId: string) => {
    if (!authed) return; // избранное только для авторизованных
    setFavorites(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
    notifyFavoritesChanged();
    const r = await fetch("/api/favorites", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    const d = await r.json();
    if (d.ids) setFavorites(d.ids);
    notifyFavoritesChanged();
  };

  const handleAddCart = async (productId: string) => {
    if (cart.some(c => c.productId === productId)) return;
    if (!authed) {
      const items = guestCart.add(productId, 1);
      setCart(items);
      notifyCartChanged();
      return;
    }
    setCart(prev => [...prev, { productId, qty: 1 }]);
    notifyCartChanged();
    const r = await fetch("/api/cart", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, qty: 1 }),
    });
    const d = await r.json();
    if (d.items) setCart(d.items);
    notifyCartChanged();
  };

  const handleUpdateQty = async (productId: string, qty: number) => {
    if (!authed) {
      const items = guestCart.setQty(productId, qty);
      setCart(items);
      notifyCartChanged();
      return;
    }
    if (qty <= 0) {
      setCart(prev => prev.filter(c => c.productId !== productId));
      notifyCartChanged();
      const r = await fetch("/api/cart", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const d = await r.json();
      if (d.items) setCart(d.items);
      notifyCartChanged();
      return;
    }
    setCart(prev => prev.map(c => c.productId === productId ? { ...c, qty } : c));
    notifyCartChanged();
    const r = await fetch("/api/cart", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, qty }),
    });
    const d = await r.json();
    if (d.items) setCart(d.items);
    notifyCartChanged();
  };

  // Объединённые товары для текущего бренда
  const brandItems = useMemo(
    () => PHONE_PRODUCTS.filter(p => p.brand === brand),
    [brand]
  );

  // Опции фильтров — на уровне моделей и variants
  const modelOptions = useMemo(() => {
    const models = Array.from(new Set(brandItems.map(p => getModel(p))));
    return ["Все", ...models];
  }, [brandItems]);

  const memoryOptions = useMemo(() => {
    const base = model !== "Все" ? brandItems.filter(p => getModel(p) === model) : brandItems;
    const mems = Array.from(new Set(
      base.flatMap(p => (p.variants ?? []).map(v => v.memory).filter(Boolean) as string[])
    ));
    mems.sort((a, b) => MEMORY_ORDER.indexOf(a) - MEMORY_ORDER.indexOf(b));
    return ["Все", ...mems];
  }, [brandItems, model]);

  const colorOptions = useMemo(() => {
    const base = model !== "Все" ? brandItems.filter(p => getModel(p) === model) : brandItems;
    const all = base.flatMap(p => p.colors ?? []);
    return ["Все", ...Array.from(new Set(all))];
  }, [brandItems, model]);

  // Сбрасываем память и цвет, если они недоступны для новой модели
  useEffect(() => {
    if (memory !== "Все" && !memoryOptions.includes(memory)) setMemory("Все");
  }, [memoryOptions, memory]);

  useEffect(() => {
    if (color !== "Все" && !colorOptions.includes(color)) setColor("Все");
  }, [colorOptions, color]);

  function handleBrandChange(b: string) {
    setBrand(b);
    setModel("Все");
    setMemory("Все");
    setColor("Все");
    setSim("Все");
  }

  // Фильтрация + сортировка (теперь на уровне моделей/variants)
  const filtered = useMemo(() => {
    const result = brandItems.filter(p => {
      const mn = getModel(p);
      if (model !== "Все" && mn !== model) return false;
      if (memory !== "Все" && !(p.variants ?? []).some(v => v.memory === memory)) return false;
      if (sim !== "Все" && !(p.variants ?? []).some(v => v.sim === sim)) return false;
      if (color !== "Все" && !(p.colors ?? []).includes(color)) return false;
      return true;
    });

    // Сортировка: бренд-специфичный ключ по модели
    return result.sort((a, b) => {
      const ma = getModel(a);
      const mb = getModel(b);
      let brandDiff = 0;
      if (a.brand === "Apple") {
        const ka = iphoneSortKey(ma);
        const kb = iphoneSortKey(mb);
        brandDiff = ka[0] - kb[0] || ka[1] - kb[1];
      } else if (a.brand === "Samsung") {
        const ka = samsungSortKey(ma);
        const kb = samsungSortKey(mb);
        brandDiff = ka[0] - kb[0] || ka[1] - kb[1] || ka[2] - kb[2];
      } else if (a.brand === "Xiaomi") {
        const ka = xiaomiSortKey(ma);
        const kb = xiaomiSortKey(mb);
        brandDiff = ka[0] - kb[0] || ka[1] - kb[1] || ka[2] - kb[2];
      } else if (a.brand === "Honor") {
        const ka = honorSortKey(ma);
        const kb = honorSortKey(mb);
        brandDiff = ka[0] - kb[0] || ka[1] - kb[1] || ka[2] - kb[2];
      }
      if (brandDiff !== 0) return brandDiff;
      return ma.localeCompare(mb, "ru");
    });
  }, [brandItems, model, memory, color, sim]);

  const hasFilters = model !== "Все" || memory !== "Все" || color !== "Все" || sim !== "Все";

  function resetFilters() {
    setModel("Все");
    setMemory("Все");
    setColor("Все");
    setSim("Все");
  }

  return (
    <section className="pt-4 pb-10">
      <div className="section">

        <div className="flex items-center justify-between mb-4 gap-3">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#0A1628] whitespace-nowrap">
            Лучшие цены на смартфоны
          </h2>
          <Link href="/catalog/"
                className="hidden sm:inline text-sm font-semibold text-[#1A3C6E] hover:underline whitespace-nowrap">
            Весь каталог →
          </Link>
        </div>

        {/* Сетка — лимит 12 товаров (3 ряда × 4 колонки) */}
        {(() => {
          const LIMIT = 12;
          const displayed = filtered.slice(0, LIMIT);
          const hasMore   = filtered.length > LIMIT || brandItems.length > LIMIT;

          return filtered.length === 0 ? (
            <div className="text-center py-16 text-[#9CA3AF]">
              <div className="text-4xl mb-3">🔍</div>
              <p className="font-semibold">Нет товаров по выбранным фильтрам</p>
              <button onClick={resetFilters} className="mt-3 text-sm text-[#0C7A58] underline">
                Сбросить фильтры
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                {displayed.map(phone => (
                  <PhoneCard
                    key={phone.id}
                    phone={phone}
                    authed={authed}
                    inFavs={favorites.includes(phone.id)}
                    cartQty={cart.find(c => c.productId === phone.id)?.qty ?? 0}
                    onToggleFav={handleToggleFav}
                    onAddCart={handleAddCart}
                    onUpdateQty={handleUpdateQty}
                  />
                ))}
              </div>

              {/* Кнопка "Весь каталог" */}
              <div className="mt-8 flex flex-col items-center gap-2">
                {hasMore && (
                  <p className="text-xs text-[#9CA3AF]">
                    Показано {displayed.length} из {filtered.length} моделей
                  </p>
                )}
                <Link
                  href="/catalog/"
                  className="inline-flex items-center gap-1.5 px-7 py-2.5 rounded-full
                             border border-[#1A3C6E]/25 text-sm font-semibold text-[#1A3C6E]
                             hover:bg-[#1A3C6E] hover:text-white hover:border-[#1A3C6E]
                             transition-all shadow-sm"
                >
                  Весь каталог →
                </Link>
              </div>
            </>
          );
        })()}
      </div>
    </section>
  );
}

/** Иконка памяти телефона — стилизованный «чип/карта памяти». */
function MemoryIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="11" cy="8" r="0.9" fill="currentColor"/>
      <path d="M4 7h4 M4 9h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}
