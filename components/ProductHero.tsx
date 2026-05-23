"use client";
import { useMemo, useState } from "react";
import type { Product } from "@/lib/data";
import { fmtRub, fmtRubApprox, calcInstallment, getMinDownPct } from "@/lib/calculator-logic";
import { useAppModal } from "@/lib/modal-context";

interface Props {
  product: Product;
  stars: string;
}

type Variant = NonNullable<Product["variants"]>[number];

/**
 * Верхний блок детальной страницы — конфигуратор (если есть variants).
 *
 *  Поддерживаются два режима:
 *  • MacBook-вариант: variants содержат ram + ssd → показываем
 *    ОЗУ × Накопитель × Цвет.
 *  • Phone-вариант: variants содержат memory (+ опц. sim) → показываем
 *    Память × SIM × Цвет.
 */
export function ProductHero({ product, stars }: Props) {
  const { openModal } = useAppModal();
  const variants = product.variants ?? [];
  const hasVariants = variants.length > 0;

  // Определяем режим по первому варианту
  const mode: "mac" | "phone" | "none" = !hasVariants
    ? "none"
    : variants[0].ram !== undefined
      ? "mac"
      : "phone";

  // ── Опции: A (RAM/Memory), B (SSD/SIM), Color ───────────────
  const axisB: "ssd" | "sim" | null =
    mode === "mac" ? "ssd"
    : (mode === "phone" && variants.some(v => v.sim)) ? "sim"
    : null;

  const getA = (v: Variant): string => (mode === "mac" ? v.ram : v.memory) ?? "";
  const getB = (v: Variant): string =>
    !axisB ? "" : axisB === "ssd" ? (v.ssd ?? "") : (v.sim ?? "");

  // Сортируем по числовому объёму
  const toGB = (s: string) => {
    const n = parseInt(s.replace(/\D/g, "")) || 0;
    return s.includes("ТБ") ? n * 1000 : n;
  };

  const optionsA = useMemo(() => {
    if (!hasVariants) return [];
    return Array.from(new Set(variants.map(getA))).filter(Boolean)
      .sort((a, b) => toGB(a) - toGB(b));
  }, [variants, hasVariants]); // eslint-disable-line react-hooks/exhaustive-deps

  const optionsB = useMemo(() => {
    if (!hasVariants || !axisB) return [];
    const arr = Array.from(new Set(variants.map(getB))).filter(Boolean);
    return axisB === "ssd" ? arr.sort((a, b) => toGB(a) - toGB(b)) : arr;
  }, [variants, hasVariants, axisB]); // eslint-disable-line react-hooks/exhaustive-deps

  const colorOptions = useMemo(() => {
    if (!hasVariants) return product.colors ?? [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const v of variants) {
      if (!seen.has(v.color)) { seen.add(v.color); out.push(v.color); }
    }
    return out;
  }, [variants, hasVariants, product.colors]);

  // Дефолт — самая дешёвая комплектация
  const cheapest = useMemo(() => {
    if (!hasVariants) return null;
    return [...variants].sort((a, b) => a.price - b.price)[0];
  }, [variants, hasVariants]);

  const [pickA, setPickA] = useState<string>(cheapest ? getA(cheapest) : "");
  const [pickB, setPickB] = useState<string>(cheapest ? getB(cheapest) : "");
  const [color, setColor] = useState<string>(cheapest?.color ?? colorOptions[0] ?? "");

  // Найти точное совпадение, иначе ближайший
  const selectedVariant = useMemo<Variant | null>(() => {
    if (!hasVariants) return null;
    let v = variants.find(x => getA(x) === pickA && getB(x) === pickB && x.color === color);
    if (v) return v;
    v = variants.find(x => getA(x) === pickA && getB(x) === pickB);
    if (v) return v;
    v = variants.find(x => x.color === color);
    return v ?? variants[0];
  }, [variants, hasVariants, pickA, pickB, color]); // eslint-disable-line react-hooks/exhaustive-deps

  // Картинки галереи: одна на каждый цвет
  const imagesByColor = useMemo<Map<string, string> | null>(() => {
    if (!hasVariants) return null;
    const map = new Map<string, string>();
    for (const v of variants) {
      if (v.img && !map.has(v.color)) map.set(v.color, v.img);
    }
    return map;
  }, [variants, hasVariants]);

  const galleryImages: string[] = useMemo(() => {
    if (hasVariants && imagesByColor) {
      const imgs = colorOptions
        .map(c => imagesByColor.get(c))
        .filter((x): x is string => Boolean(x));
      if (imgs.length > 0) return imgs;
    }
    return Array.isArray(product.img)
      ? product.img
      : product.img ? [product.img] : [];
  }, [hasVariants, imagesByColor, colorOptions, product.img]);

  const mainImage = useMemo(() => {
    if (hasVariants && imagesByColor) {
      return imagesByColor.get(color) || galleryImages[0] || null;
    }
    return galleryImages[0] || null;
  }, [hasVariants, imagesByColor, color, galleryImages]);

  const displayPrice = selectedVariant?.price ?? product.price;

  // Срок рассрочки — открывается дефолтом в 6 платежей, можно менять.
  const [term, setTerm] = useState<number>(6);
  const [termOpen, setTermOpen] = useState(false);

  // Платёж при рассрочке для выбранной вариации (минимальный взнос).
  const displayMonthly = useMemo(() => {
    const down = Math.ceil(displayPrice * getMinDownPct(displayPrice));
    return calcInstallment({ price: displayPrice, down, term }).monthly;
  }, [displayPrice, term]);

  const isCombo = (a: string, b: string) =>
    !axisB ? variants.some(v => getA(v) === a) : variants.some(v => getA(v) === a && getB(v) === b);
  const isColorAvailable = (cl: string) =>
    !axisB
      ? variants.some(v => getA(v) === pickA && v.color === cl)
      : variants.some(v => getA(v) === pickA && getB(v) === pickB && v.color === cl);

  // Открывает модалку «Оформить рассрочку».
  function handleBuy() {
    const price = displayPrice;
    const down = Math.ceil(price * getMinDownPct(price));
    const res = calcInstallment({ price, down, term });
    const memoryLabel = hasVariants && selectedVariant
      ? mode === "mac"
        ? `${selectedVariant.ram} / ${selectedVariant.ssd}`
        : selectedVariant.memory
      : product.memories?.[0];
    openModal({
      productName: product.name + (hasVariants && color ? `, ${color}` : ""),
      memory: memoryLabel,
      sim: selectedVariant?.sim,
      price,
      down,
      term,
      monthly: res.monthly,
    });
  }

  // Текстовые подписи селекторов в зависимости от режима
  const labelA = mode === "mac" ? "Оперативная память:" : "Память:";
  const labelB = mode === "mac" ? "Накопитель:" : "SIM-карта:";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
      {/* ── Left: gallery ── */}
      <div>
        <div className="w-full aspect-square bg-[#F4F7FC] rounded-3xl mb-4 border border-[#D8E2F0]
                        flex items-center justify-center overflow-hidden">
          {mainImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mainImage} alt={product.name}
                 className="w-full h-full object-contain p-6" />
          ) : (
            <span className="text-[120px]">{product.emoji}</span>
          )}
        </div>

        {galleryImages.length > 1 && (
          <div className="flex gap-3 flex-wrap">
            {galleryImages.map((src, i) => {
              const cl = hasVariants ? colorOptions[i] : undefined;
              const active = hasVariants ? cl === color : i === 0;
              return (
                <button key={src + i} type="button"
                  onClick={() => { if (cl) setColor(cl); }}
                  aria-label={cl || `Вариант ${i + 1}`}
                  className={`w-20 h-20 rounded-xl bg-[#F4F7FC] overflow-hidden border-2 transition-colors
                              ${active
                                ? "border-[#1A3C6E]"
                                : "border-[#D8E2F0] hover:border-[#1A3C6E]/40"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-full h-full object-contain p-1.5" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Right: info ── */}
      <div>
        {product.badge && (
          <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full mb-3
            ${product.badge === "Хит" ? "bg-[#FEF3C7] text-[#D97706]" :
              product.badge === "Акция" ? "bg-[#FEE2E2] text-[#DC2626]" :
              "bg-[#EBF0F9] text-[#1A3C6E]"}`}>
            {product.badge}
          </span>
        )}

        <h1 className="text-2xl lg:text-3xl font-extrabold text-[#0A1628] mb-3 leading-snug">
          {product.name}
        </h1>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-[#F59E0B] text-base tracking-tight">{stars}</span>
          <span className="text-sm text-[#6B7280]">{product.rating.toFixed(1)}</span>
          <span className="text-xs text-[#9CA3AF]">({product.reviewCount} отзывов)</span>
          <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full
            ${product.inStock ? "bg-[#D1FAE5] text-[#059669]" : "bg-[#FEE2E2] text-[#DC2626]"}`}>
            {product.inStock ? "В наличии" : "Нет в наличии"}
          </span>
        </div>

        <div className="mb-5">
          {/* Цена при рассрочке — крупно. */}
          <div className="leading-none">
            <span className="text-4xl font-extrabold text-[#0A1628]">
              {fmtRub(displayMonthly)} ₽
            </span>
            <span className="relative inline-block ml-2 align-baseline">
              <button
                type="button"
                onClick={() => setTermOpen(o => !o)}
                className="text-base font-semibold text-[#6B7280] hover:text-[#0A1628] transition-colors inline-flex items-center gap-1"
                aria-haspopup="listbox"
                aria-expanded={termOpen}
              >
                / {term} мес
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
                     className={`transition-transform ${termOpen ? "rotate-180" : ""}`}>
                  <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5"
                        strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {termOpen && (
                <>
                  {/* Backdrop для закрытия по клику вне */}
                  <div className="fixed inset-0 z-10" onClick={() => setTermOpen(false)} />
                  <div role="listbox"
                       className="absolute top-full left-0 mt-1.5 bg-white shadow-lg rounded-lg
                                  border border-[#E5E7EB] py-1 z-20 min-w-[110px]">
                    {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => { setTerm(n); setTermOpen(false); }}
                        role="option"
                        aria-selected={n === term}
                        className={`block w-full text-left px-3 py-1.5 text-sm transition-colors
                                    hover:bg-[#F4F7FC] ${
                          n === term
                            ? "font-bold text-[#0A1628]"
                            : "text-[#6B7280]"
                        }`}
                      >
                        {n} мес
                      </button>
                    ))}
                  </div>
                </>
              )}
            </span>
          </div>
          {/* Полная цена + скидка — мелко снизу. */}
          <div className="mt-2 flex items-baseline gap-3 flex-wrap">
            <span className="text-lg text-[#6B7280]">
              {hasVariants
                ? `${fmtRub(displayPrice)} ₽`
                : `${product.tgSynced ? fmtRub(product.price) : fmtRubApprox(product.price)} ₽`}
            </span>
            {product.oldPrice && (
              <>
                <span className="text-base text-[#9CA3AF] line-through">{fmtRub(product.oldPrice)} ₽</span>
                <span className="text-sm font-bold text-[#DC2626]">
                  −{fmtRub(product.oldPrice - product.price)} ₽
                </span>
              </>
            )}
          </div>
        </div>

        {hasVariants ? (
          <>
            {/* Axis A — RAM / Memory */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-[#6B7280] mb-2">{labelA}</p>
              <div className="flex flex-wrap gap-2">
                {optionsA.map(a => {
                  const available = optionsB.length === 0
                    ? variants.some(v => getA(v) === a)
                    : optionsB.some(b => isCombo(a, b));
                  const active = a === pickA;
                  return (
                    <button key={a} type="button" disabled={!available}
                      onClick={() => {
                        setPickA(a);
                        if (axisB && !isCombo(a, pickB)) {
                          const firstB = optionsB.find(b => isCombo(a, b));
                          if (firstB) setPickB(firstB);
                        }
                      }}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors
                        ${active ? "bg-[#1A3C6E] text-white border-[#1A3C6E]"
                                 : available
                                   ? "border-[#D8E2F0] text-[#374151] hover:border-[#1A3C6E] hover:text-[#1A3C6E]"
                                   : "border-[#E5E7EB] text-[#C4C9D4] cursor-not-allowed"}`}>
                      {a}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Axis B — SSD / SIM */}
            {axisB && optionsB.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-[#6B7280] mb-2">{labelB}</p>
                <div className="flex flex-wrap gap-2">
                  {optionsB.map(b => {
                    const available = isCombo(pickA, b);
                    const active = b === pickB;
                    return (
                      <button key={b} type="button" disabled={!available}
                        onClick={() => setPickB(b)}
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors
                          ${active ? "bg-[#1A3C6E] text-white border-[#1A3C6E]"
                                   : available
                                     ? "border-[#D8E2F0] text-[#374151] hover:border-[#1A3C6E] hover:text-[#1A3C6E]"
                                     : "border-[#E5E7EB] text-[#C4C9D4] cursor-not-allowed"}`}>
                        {b}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Цвет */}
            {colorOptions.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-[#6B7280] mb-2">Цвет:</p>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map(cl => {
                    const available = isColorAvailable(cl);
                    const active = cl === color;
                    return (
                      <button key={cl} type="button" disabled={!available}
                        onClick={() => setColor(cl)}
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors
                          ${active ? "bg-[#0A1628] text-white border-[#0A1628]"
                                   : available
                                     ? "border-[#D8E2F0] text-[#374151] hover:border-[#0A1628] hover:text-[#0A1628]"
                                     : "border-[#E5E7EB] text-[#C4C9D4] cursor-not-allowed"}`}>
                        {cl}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {product.memories && product.memories.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-[#6B7280] mb-2">Память:</p>
                <div className="flex flex-wrap gap-2">
                  {product.memories.map((m, i) => (
                    <button key={m} type="button"
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors
                        ${i === 0 ? "bg-[#1A3C6E] text-white border-[#1A3C6E]"
                                  : "border-[#D8E2F0] text-[#6B7280] hover:border-[#1A3C6E] hover:text-[#1A3C6E]"}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-[#6B7280] mb-2">Цвет:</p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c, i) => (
                    <button key={c} type="button"
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors
                        ${i === 0 ? "bg-[#0A1628] text-white border-[#0A1628]"
                                  : "border-[#D8E2F0] text-[#6B7280] hover:border-[#0A1628] hover:text-[#0A1628]"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <button type="button" onClick={handleBuy}
          className="btn-primary w-full py-4 text-base mb-3">
          Купить в рассрочку
        </button>
        <button type="button"
          className="w-full py-3 rounded-2xl border-2 border-[#D8E2F0] text-[#0A1628]
                     font-semibold text-sm hover:border-[#1A3C6E] hover:text-[#1A3C6E] transition-colors">
          Добавить в избранное ♡
        </button>
      </div>
    </div>
  );
}
