"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { PHONES_CATALOG, type PhoneItem, type SimType } from "@/lib/data";
import { calcInstallment, fmtRub, getMinDownPct } from "@/lib/calculator-logic";
import { COMPANY } from "@/lib/data";
import { useAppModal } from "@/lib/modal-context";

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

// ─── Дедупликация каталога: 1 запись на модель+память+SIM (макс. цена) ──
const DEDUPED_CATALOG: PhoneItem[] = (() => {
  const best = new Map<string, PhoneItem>();
  for (const p of PHONES_CATALOG) {
    const key = `${p.brand}|${p.model}|${p.memory}|${p.sim}`;
    const prev = best.get(key);
    if (!prev || p.price > prev.price) best.set(key, p);
  }
  return Array.from(best.values());
})();

// ─── Ключи сортировки ────────────────────────────────────────

// Apple iPhone: [поколение↓, тип модели]
// Pro(0) → Pro Max(1) → Air(2) → base(3)
function iphoneSortKey(model: string): [number, number] {
  const gen = parseInt(model.match(/iPhone\s+(\d+)/i)?.[1] ?? "0");
  const lower = model.toLowerCase();
  let tier: number;
  if      (lower.includes("pro max")) tier = 1;
  else if (lower.includes("pro"))     tier = 0;
  else if (lower.includes("air"))     tier = 2;
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
function PhoneCard({ phone }: { phone: PhoneItem }) {
  const perMonth = monthly(phone.price);
  const { openModal } = useAppModal();

  function handleBuy() {
    const down       = Math.ceil(phone.price * getMinDownPct(phone.price));
    const monthlyAmt = calcInstallment({ price: phone.price, down, term: DEFAULT_TERM }).monthly;
    openModal({
      productName: phone.model,
      memory:      phone.memory,
      sim:         phone.sim,
      price:       phone.price,
      down,
      term:        DEFAULT_TERM,
      monthly:     monthlyAmt,
    });
  }

  return (
    <div className="card p-3 hover:shadow-lg transition-all group relative flex flex-col">
      <Badge text={phone.badge} />

      <div className="w-full aspect-[3/4] bg-gradient-to-b from-[#F4F7FC] to-[#EBF0F9] rounded-xl mb-3 overflow-hidden flex items-center justify-center"
           style={{ filter: "drop-shadow(0 8px 16px rgba(10,22,40,0.12))" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={phone.img}
          alt={`${phone.model} ${phone.memory}`}
          className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
            (e.currentTarget.nextSibling as HTMLElement).style.display = "flex";
          }}
        />
        <div className="hidden w-full h-full items-center justify-center text-5xl">📱</div>
      </div>

      <p className="text-[11px] text-[#6B7280] mb-0.5">{phone.brand}</p>
      <h3 className="font-bold text-[#0A1628] text-xs leading-snug mb-1 line-clamp-2 group-hover:text-[#1A3C6E] transition-colors">
        {phone.model}
      </h3>

      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <span className="px-2 py-0.5 bg-[#EBF0F9] text-[#1A3C6E] rounded-full text-[10px] font-semibold">
          {phone.memory}
        </span>
        <span className="px-2 py-0.5 bg-[#F4F7FC] text-[#6B7280] rounded-full text-[10px]">
          {phone.sim}
        </span>
      </div>

      <div className="mt-auto">
        <p className="font-extrabold text-[#0A1628] text-sm leading-none">{fmtRub(phone.price)} ₽</p>
        <p className="text-[10px] text-[#0C7A58] font-semibold mt-0.5">
          от {fmtRub(perMonth)} ₽/мес.
        </p>
      </div>

      <button
        onClick={handleBuy}
        className="mt-3 w-full py-2.5 rounded-xl bg-[#0A1628] text-white
                   text-xs font-semibold hover:bg-[#0C7A58] active:scale-95
                   transition-all touch-manipulation"
      >
        Купить в рассрочку
      </button>
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

// ─── Главный компонент ───────────────────────────────────────
export function SmartphonesSection() {
  const [brand,  setBrand]  = useState("Apple");
  const [model,  setModel]  = useState("Все");
  const [memory, setMemory] = useState("Все");
  const [color,  setColor]  = useState("Все");
  const [sim,    setSim]    = useState<"Все" | SimType>("Все");

  // Дедуплицированный список для текущего бренда
  const brandItems = useMemo(
    () => DEDUPED_CATALOG.filter(p => p.brand === brand),
    [brand]
  );

  // Опции фильтров — строятся динамически на основе дедуплицированных данных
  const modelOptions = useMemo(() => {
    const models = Array.from(new Set(brandItems.map(p => p.model)));
    return ["Все", ...models];
  }, [brandItems]);

  const memoryOptions = useMemo(() => {
    const base = model !== "Все" ? brandItems.filter(p => p.model === model) : brandItems;
    const mems = Array.from(new Set(base.map(p => p.memory)));
    mems.sort((a, b) => MEMORY_ORDER.indexOf(a) - MEMORY_ORDER.indexOf(b));
    return ["Все", ...mems];
  }, [brandItems, model]);

  // Цвета берём из исходного PHONES_CATALOG (не дедуплицированного),
  // чтобы показать все доступные варианты для выбранной модели
  const colorOptions = useMemo(() => {
    let phones = PHONES_CATALOG.filter(p => p.brand === brand);
    if (model !== "Все") phones = phones.filter(p => p.model === model);
    const all = phones.flatMap(p => p.colors);
    return ["Все", ...Array.from(new Set(all))];
  }, [brand, model]);

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

  // Фильтрация + сортировка
  const filtered = useMemo(() => {
    // Фильтруем дедуплицированный каталог
    // Фильтр по цвету проверяем через исходный PHONES_CATALOG (цвета не хранятся в деду)
    const colorSet = color !== "Все"
      ? new Set(
          PHONES_CATALOG
            .filter(p => p.brand === brand && p.colors.includes(color))
            .map(p => `${p.model}|${p.memory}|${p.sim}`)
        )
      : null;

    const result = brandItems.filter(p => {
      if (model  !== "Все" && p.model  !== model)  return false;
      if (memory !== "Все" && p.memory !== memory) return false;
      if (sim    !== "Все" && p.sim    !== sim)    return false;
      if (colorSet && !colorSet.has(`${p.model}|${p.memory}|${p.sim}`)) return false;
      return true;
    });

    // Сортировка: серия/поколение↓ → тип модели → память↑ → SIM
    return result.sort((a, b) => {
      // Бренд-специфичные ключи (до 3 уровней)
      let brandDiff = 0;
      if (a.brand === "Apple") {
        const ka = iphoneSortKey(a.model);
        const kb = iphoneSortKey(b.model);
        brandDiff = ka[0] - kb[0] || ka[1] - kb[1];
      } else if (a.brand === "Samsung") {
        const ka = samsungSortKey(a.model);
        const kb = samsungSortKey(b.model);
        brandDiff = ka[0] - kb[0] || ka[1] - kb[1] || ka[2] - kb[2];
      } else if (a.brand === "Xiaomi") {
        const ka = xiaomiSortKey(a.model);
        const kb = xiaomiSortKey(b.model);
        brandDiff = ka[0] - kb[0] || ka[1] - kb[1] || ka[2] - kb[2];
      } else if (a.brand === "Honor") {
        const ka = honorSortKey(a.model);
        const kb = honorSortKey(b.model);
        brandDiff = ka[0] - kb[0] || ka[1] - kb[1] || ka[2] - kb[2];
      }
      if (brandDiff !== 0) return brandDiff;
      // Общие критерии: память↑ → SIM
      const memDiff = MEMORY_ORDER.indexOf(a.memory) - MEMORY_ORDER.indexOf(b.memory);
      if (memDiff !== 0) return memDiff;
      const simDiff = (SIM_ORDER[a.sim] ?? 99) - (SIM_ORDER[b.sim] ?? 99);
      if (simDiff !== 0) return simDiff;
      return a.model.localeCompare(b.model, "ru");
    });
  }, [brandItems, model, memory, color, sim, brand]);

  const hasFilters = model !== "Все" || memory !== "Все" || color !== "Все" || sim !== "Все";

  function resetFilters() {
    setModel("Все");
    setMemory("Все");
    setColor("Все");
    setSim("Все");
  }

  return (
    <section className="py-14">
      <div className="section">

        <div className="flex items-end justify-between mb-5 gap-4 flex-wrap">
          <div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-[#0A1628]">
              Лучшие цены на смартфоны
            </h2>
            <p className="text-[#6B7280] mt-1 text-sm">
              Мы сравниваем цены в магазинах в {COMPANY.city}, чтобы предложить вам лучшую.
            </p>
          </div>
          <Link href="/catalog/"
                className="text-sm font-semibold text-[#1A3C6E] hover:underline whitespace-nowrap">
            Весь каталог →
          </Link>
        </div>

        {/* Бренды */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {BRANDS.map(b => (
            <BrandPill key={b} brand={b} active={brand === b} onClick={() => handleBrandChange(b)} />
          ))}
        </div>

        {/* Фильтры */}
        <div className="flex flex-wrap gap-2 mb-6">
          <FilterDropdown
            label="Модель"
            options={modelOptions}
            value={model}
            onChange={(m) => { setModel(m); setMemory("Все"); setColor("Все"); }}
          />
          <FilterDropdown
            label="Память"
            options={memoryOptions}
            value={memory}
            onChange={setMemory}
          />
          <FilterDropdown
            label="Цвет"
            options={colorOptions}
            value={color}
            onChange={setColor}
          />
          <FilterDropdown
            label="SIM"
            options={SIMS}
            value={sim}
            onChange={(v) => setSim(v as "Все" | SimType)}
          />
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 rounded-xl text-sm text-[#6B7280] border border-[#D8E2F0]
                         hover:border-red-300 hover:text-red-500 transition-colors"
            >
              ✕ Сбросить
            </button>
          )}
        </div>

        {/* Сетка */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-[#9CA3AF]">
            <div className="text-4xl mb-3">🔍</div>
            <p className="font-semibold">Нет товаров по выбранным фильтрам</p>
            <button onClick={resetFilters} className="mt-3 text-sm text-[#0C7A58] underline">
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filtered.map(phone => <PhoneCard key={phone.id} phone={phone} />)}
          </div>
        )}

        {filtered.length > 0 && (
          <p className="text-xs text-[#9CA3AF] mt-4 text-center">
            Показано {filtered.length} из {brandItems.length} моделей
          </p>
        )}
      </div>
    </section>
  );
}
