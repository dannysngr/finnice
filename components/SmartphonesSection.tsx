"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { PHONES_CATALOG, type PhoneItem, type SimType } from "@/lib/data";
import { calcInstallment, fmtRub, getMinDownPct } from "@/lib/calculator-logic";
import { COMPANY } from "@/lib/data";
import { useAppModal } from "@/lib/modal-context";

// ─── Константы ────────────────────────────────────────────────

const BRANDS = ["Apple", "Samsung", "Xiaomi", "Honor"] as const;

// Канонический порядок объёмов памяти
const MEMORY_ORDER = ["64 ГБ", "128 ГБ", "256 ГБ", "512 ГБ", "1 ТБ", "2 ТБ"];

const SIMS: ("Все" | SimType)[] = ["Все", "SIM + eSIM", "2 SIM", "1 SIM", "eSIM"];
const DEFAULT_TERM = 6; // срок для расчёта «от X руб./мес»

// ─── Вычислить ежемесячный платёж (с учётом обязательного взноса 25% при цене > 50к) ──

function monthly(price: number): number {
  const down = Math.ceil(price * getMinDownPct(price));
  return calcInstallment({ price, down, term: DEFAULT_TERM }).monthly;
}

// ─── Бейдж ────────────────────────────────────────────────────

function Badge({ text }: { text?: string }) {
  if (!text) return null;
  const cls =
    text === "Хит"     ? "bg-amber-100  text-amber-700"  :
    text === "Новинка" ? "bg-[#EBF0F9]  text-[#1A3C6E]"  :
                         "bg-red-100    text-red-600";
  return (
    <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold z-10 ${cls}`}>
      {text}
    </span>
  );
}

// ─── Карточка товара ──────────────────────────────────────────

function PhoneCard({ phone }: { phone: PhoneItem }) {
  const perMonth = monthly(phone.price);
  const { openModal } = useAppModal();

  function handleBuy() {
    const down        = Math.ceil(phone.price * getMinDownPct(phone.price));
    const monthlyAmt  = calcInstallment({ price: phone.price, down, term: DEFAULT_TERM }).monthly;
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

      {/* Изображение */}
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
        {/* Фолбэк */}
        <div className="hidden w-full h-full items-center justify-center text-5xl">📱</div>
      </div>

      {/* Название */}
      <p className="text-[11px] text-[#6B7280] mb-0.5">{phone.brand}</p>
      <h3 className="font-bold text-[#0A1628] text-xs leading-snug mb-1 line-clamp-2 group-hover:text-[#1A3C6E] transition-colors">
        {phone.model}
      </h3>

      {/* Память + SIM */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <span className="px-2 py-0.5 bg-[#EBF0F9] text-[#1A3C6E] rounded-full text-[10px] font-semibold">
          {phone.memory}
        </span>
        <span className="px-2 py-0.5 bg-[#F4F7FC] text-[#6B7280] rounded-full text-[10px]">
          {phone.sim}
        </span>
      </div>

      {/* Цена */}
      <div className="mt-auto">
        <p className="font-extrabold text-[#0A1628] text-sm leading-none">{fmtRub(phone.price)} ₽</p>
        <p className="text-[10px] text-[#0C7A58] font-semibold mt-0.5">
          от {fmtRub(perMonth)} ₽/мес.
        </p>
      </div>

      {/* Кнопка */}
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

// ─── Дропдаун-фильтр ──────────────────────────────────────────

interface DropdownProps {
  label:    string;
  options:  string[];
  value:    string;
  onChange: (v: string) => void;
}

/**
 * Первый элемент options всегда «Все» — он отображается как название фильтра.
 * Остальные элементы показываются без preffix «Метка: значение».
 */
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
        {/* «Все» — показываем как заголовок фильтра */}
        <option value={options[0]}>{label}</option>
        {/* Остальные варианты — только значение, без приставки */}
        {options.slice(1).map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      {/* Стрелка */}
      <span className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs
                        ${isActive ? "text-white" : "text-[#6B7280]"}`}>
        ▾
      </span>
    </div>
  );
}

// ─── Фильтр-таблетка производителя ───────────────────────────

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

// ─── Главный компонент ────────────────────────────────────────

export function SmartphonesSection() {
  const [brand,  setBrand]  = useState("Apple");
  const [memory, setMemory] = useState("Все");
  const [model,  setModel]  = useState("Все");
  const [color,  setColor]  = useState("Все");
  const [sim,    setSim]    = useState<"Все" | SimType>("Все");

  // Динамический список моделей для выбранного бренда
  const modelOptions = useMemo(() => {
    const models = Array.from(
      new Set(PHONES_CATALOG.filter(p => p.brand === brand).map(p => p.model))
    );
    return ["Все", ...models];
  }, [brand]);

  // Динамический список памяти — зависит от бренда И выбранной модели
  const memoryOptions = useMemo(() => {
    let phones = PHONES_CATALOG.filter(p => p.brand === brand);
    if (model !== "Все") phones = phones.filter(p => p.model === model);
    const mems = Array.from(new Set(phones.map(p => p.memory)));
    mems.sort((a, b) => MEMORY_ORDER.indexOf(a) - MEMORY_ORDER.indexOf(b));
    return ["Все", ...mems];
  }, [brand, model]);

  // Динамический список цветов — зависит от бренда И выбранной модели
  const colorOptions = useMemo(() => {
    let phones = PHONES_CATALOG.filter(p => p.brand === brand);
    if (model !== "Все") phones = phones.filter(p => p.model === model);
    const all = phones.flatMap(p => p.colors);
    return ["Все", ...Array.from(new Set(all))];
  }, [brand, model]);

  // Если текущий выбор памяти недоступен для новой модели — сбрасываем
  useEffect(() => {
    if (memory !== "Все" && !memoryOptions.includes(memory)) {
      setMemory("Все");
    }
  }, [memoryOptions, memory]);

  // Если текущий цвет недоступен для новой модели — сбрасываем
  useEffect(() => {
    if (color !== "Все" && !colorOptions.includes(color)) {
      setColor("Все");
    }
  }, [colorOptions, color]);

  // Сброс всех зависимых фильтров при смене бренда
  function handleBrandChange(b: string) {
    setBrand(b);
    setModel("Все");
    setMemory("Все");
    setColor("Все");
    setSim("Все");
  }

  // Сброс памяти и цвета при смене модели (useEffect выше сделает это автоматически,
  // но явный сброс через setModel нужен для немедленного обновления)
  function handleModelChange(m: string) {
    setModel(m);
    // Память и цвет сбросятся через useEffect, если выйдут за пределы новых опций
  }

  // Применяем фильтры
  const filtered = useMemo(() => {
    return PHONES_CATALOG.filter(p => {
      if (p.brand  !== brand)                          return false;
      if (model  !== "Все" && p.model  !== model)      return false;
      if (memory !== "Все" && p.memory !== memory)     return false;
      if (color  !== "Все" && !p.colors.includes(color)) return false;
      if (sim    !== "Все" && p.sim    !== sim)        return false;
      return true;
    });
  }, [brand, model, memory, color, sim]);

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

        {/* ── Заголовок ── */}
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

        {/* ── Фильтр по производителю (таблетки) ── */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {BRANDS.map(b => (
            <BrandPill key={b} brand={b} active={brand === b} onClick={() => handleBrandChange(b)} />
          ))}
        </div>

        {/* ── Дропдаун-фильтры ── */}
        <div className="flex flex-wrap gap-2 mb-6">
          <FilterDropdown
            label="Модель"
            options={modelOptions}
            value={model}
            onChange={handleModelChange}
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

        {/* ── Сетка товаров ── */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-[#9CA3AF]">
            <div className="text-4xl mb-3">🔍</div>
            <p className="font-semibold">Нет товаров по выбранным фильтрам</p>
            <button
              onClick={resetFilters}
              className="mt-3 text-sm text-[#0C7A58] underline"
            >
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filtered.map(phone => <PhoneCard key={phone.id} phone={phone} />)}
          </div>
        )}

        {/* ── Счётчик ── */}
        {filtered.length > 0 && (
          <p className="text-xs text-[#9CA3AF] mt-4 text-center">
            Показано {filtered.length} из {PHONES_CATALOG.filter(p => p.brand === brand).length} моделей
          </p>
        )}
      </div>
    </section>
  );
}
