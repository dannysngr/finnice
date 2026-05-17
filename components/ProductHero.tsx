"use client";
import { useMemo, useState } from "react";
import type { Product } from "@/lib/data";
import { fmtRub, fmtRubApprox } from "@/lib/calculator-logic";

interface Props {
  product: Product;
  stars: string;
}

/**
 * Верхний блок детальной страницы — конфигуратор (если есть variants).
 *
 *  • Если у товара есть variants[] (новые biggeek-MacBook'и):
 *    показываем селектор «память (RAM/SSD)» × «цвет», цена и фото
 *    обновляются под выбранную комплектацию.
 *
 *  • Если variants нет — простой режим: одна цена + статичная галерея,
 *    цвета/память — обычные кнопки без логики.
 */
export function ProductHero({ product, stars }: Props) {
  const variants = product.variants ?? [];
  const hasVariants = variants.length > 0;

  // Уникальные значения RAM (отсортированы по числу)
  const ramOptions = useMemo(() => {
    if (!hasVariants) return [];
    const set = new Set(variants.map(v => v.ram));
    return Array.from(set).sort((a, b) =>
      parseInt(a.replace(/\D/g, "")) - parseInt(b.replace(/\D/g, "")));
  }, [variants, hasVariants]);

  // Уникальные значения SSD (сортируем 256 < 512 < 1ТБ < 2ТБ ...)
  const ssdOptions = useMemo(() => {
    if (!hasVariants) return [];
    const set = new Set(variants.map(v => v.ssd));
    const toGB = (s: string) => {
      const n = parseInt(s.replace(/\D/g, ""));
      return s.includes("ТБ") ? n * 1000 : n;
    };
    return Array.from(set).sort((a, b) => toGB(a) - toGB(b));
  }, [variants, hasVariants]);

  // Уникальные цвета
  const colorOptions = useMemo(() => {
    if (hasVariants) {
      const seen = new Set<string>();
      const out: string[] = [];
      for (const v of variants) {
        if (!seen.has(v.color)) { seen.add(v.color); out.push(v.color); }
      }
      return out;
    }
    return product.colors ?? [];
  }, [variants, hasVariants, product.colors]);

  // Дефолтные значения — берём от самой дешёвой комплектации
  const cheapest = useMemo(() => {
    if (!hasVariants) return null;
    return [...variants].sort((a, b) => a.price - b.price)[0];
  }, [variants, hasVariants]);

  const [ram, setRam] = useState<string>(cheapest?.ram ?? "");
  const [ssd, setSsd] = useState<string>(cheapest?.ssd ?? "");
  const [color, setColor] = useState<string>(cheapest?.color ?? colorOptions[0] ?? "");

  // Найти точное совпадение, иначе ближайший по цене вариант с этим color
  const selectedVariant = useMemo(() => {
    if (!hasVariants) return null;
    let v = variants.find(x => x.ram === ram && x.ssd === ssd && x.color === color);
    if (v) return v;
    v = variants.find(x => x.ram === ram && x.ssd === ssd);
    if (v) return v;
    v = variants.find(x => x.color === color);
    if (v) return v;
    return variants[0];
  }, [variants, hasVariants, ram, ssd, color]);

  // Картинки для галереи
  const imagesByColor = useMemo(() => {
    if (hasVariants) {
      const map = new Map<string, string>();
      for (const v of variants) {
        if (v.img && !map.has(v.color)) map.set(v.color, v.img);
      }
      return map;
    }
    return null;
  }, [variants, hasVariants]);

  const galleryImages: string[] = useMemo(() => {
    if (hasVariants && imagesByColor) {
      return colorOptions
        .map(c => imagesByColor.get(c))
        .filter((x): x is string => Boolean(x));
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
  // Доступно ли это (ram, ssd) — для гашения недоступных кнопок
  const isCombo = (r: string, s: string) =>
    variants.some(v => v.ram === r && v.ssd === s);
  const isColor = (cl: string) =>
    variants.some(v => v.ram === ram && v.ssd === ssd && v.color === cl);

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
              const active = hasVariants
                ? cl === color
                : i === 0;
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
          <span className="text-4xl font-extrabold text-[#0A1628]">
            {hasVariants
              ? `${fmtRub(displayPrice)} ₽`
              : `${product.tgSynced ? fmtRub(product.price) : fmtRubApprox(product.price)} ₽`}
          </span>
          {product.oldPrice && (
            <>
              <span className="ml-3 text-lg text-[#9CA3AF] line-through">{fmtRub(product.oldPrice)} ₽</span>
              <span className="ml-2 text-sm font-bold text-[#DC2626]">
                −{fmtRub(product.oldPrice - product.price)} ₽
              </span>
            </>
          )}
        </div>

        {hasVariants ? (
          <>
            {/* RAM */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-[#6B7280] mb-2">Оперативная память:</p>
              <div className="flex flex-wrap gap-2">
                {ramOptions.map(r => {
                  const available = ssdOptions.some(s => isCombo(r, s));
                  const active = r === ram;
                  return (
                    <button key={r} type="button" disabled={!available}
                      onClick={() => {
                        setRam(r);
                        // Если текущий SSD недоступен с новым RAM — снэп на первый доступный
                        if (!isCombo(r, ssd)) {
                          const firstSsd = ssdOptions.find(s => isCombo(r, s));
                          if (firstSsd) setSsd(firstSsd);
                        }
                      }}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors
                        ${active ? "bg-[#1A3C6E] text-white border-[#1A3C6E]"
                                 : available
                                   ? "border-[#D8E2F0] text-[#374151] hover:border-[#1A3C6E] hover:text-[#1A3C6E]"
                                   : "border-[#E5E7EB] text-[#C4C9D4] cursor-not-allowed"}`}>
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SSD */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-[#6B7280] mb-2">Накопитель:</p>
              <div className="flex flex-wrap gap-2">
                {ssdOptions.map(s => {
                  const available = isCombo(ram, s);
                  const active = s === ssd;
                  return (
                    <button key={s} type="button" disabled={!available}
                      onClick={() => setSsd(s)}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors
                        ${active ? "bg-[#1A3C6E] text-white border-[#1A3C6E]"
                                 : available
                                   ? "border-[#D8E2F0] text-[#374151] hover:border-[#1A3C6E] hover:text-[#1A3C6E]"
                                   : "border-[#E5E7EB] text-[#C4C9D4] cursor-not-allowed"}`}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color */}
            {colorOptions.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-[#6B7280] mb-2">Цвет:</p>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map(cl => {
                    const available = isColor(cl);
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

        <button type="button" className="btn-primary w-full py-4 text-base mb-3">
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
