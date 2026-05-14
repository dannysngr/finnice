import { notFound } from "next/navigation";
import Link from "next/link";
import { PRODUCTS, CATALOG_CATS } from "@/lib/data";
import { fmtRub, fmtRubApprox } from "@/lib/calculator-logic";
import { Calculator } from "@/components/Calculator";

/* ── Static params for pre-rendering ─────────────────────────── */
export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ id: p.id }));
}

/* ── Page ─────────────────────────────────────────────────────── */
export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = PRODUCTS.find((p) => p.id === id);
  if (!product) notFound();

  /* category label */
  const catLabel = CATALOG_CATS.find(
    (c) => c.href.replace(/^\/catalog\/|\/$/g, "") === product.category
  )?.label ?? "Каталог";

  /* related products (same category, excluding current) */
  const related = PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, 4);

  /* star rating */
  const stars = Array.from({ length: 5 }, (_, i) =>
    i < Math.round(product.rating) ? "★" : "☆"
  ).join("");

  return (
    <main>
      {/* ── Breadcrumb ── */}
      <div className="bg-[#F4F7FC] border-b border-[#D8E2F0]">
        <div className="section py-3 text-xs text-[#9CA3AF] flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-[#1A3C6E] transition-colors">Главная</Link>
          <span>/</span>
          <Link href="/catalog/" className="hover:text-[#1A3C6E] transition-colors">Каталог</Link>
          <span>/</span>
          <Link href={`/catalog/`} className="hover:text-[#1A3C6E] transition-colors">{catLabel}</Link>
          <span>/</span>
          <span className="text-[#0A1628] line-clamp-1">{product.name}</span>
        </div>
      </div>

      <div className="section py-8">
        {/* ── Top: image + info ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">

          {/* Left: image gallery */}
          <div>
            {/* Main image */}
            <div className="w-full aspect-square bg-[#F4F7FC] rounded-3xl
                            flex items-center justify-center text-[120px] mb-4 border border-[#D8E2F0]">
              {product.emoji}
            </div>
            {/* Thumbnails */}
            <div className="flex gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i}
                  className={`w-20 h-20 rounded-xl bg-[#F4F7FC] flex items-center justify-center text-4xl
                               border-2 transition-colors cursor-pointer
                               ${i === 0 ? "border-[#1A3C6E]" : "border-[#D8E2F0] hover:border-[#1A3C6E]/40"}`}
                >
                  {product.emoji}
                </div>
              ))}
            </div>
          </div>

          {/* Right: product info */}
          <div>
            {/* Badge */}
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

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[#F59E0B] text-base tracking-tight">{stars}</span>
              <span className="text-sm text-[#6B7280]">{product.rating.toFixed(1)}</span>
              <span className="text-xs text-[#9CA3AF]">({product.reviewCount} отзывов)</span>
              <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full
                ${product.inStock ? "bg-[#D1FAE5] text-[#059669]" : "bg-[#FEE2E2] text-[#DC2626]"}`}>
                {product.inStock ? "В наличии" : "Нет в наличии"}
              </span>
            </div>

            {/* Price */}
            <div className="mb-5">
              <span className="text-4xl font-extrabold text-[#0A1628]">{product.tgSynced ? fmtRub(product.price) : fmtRubApprox(product.price)} ₽</span>
              {product.oldPrice && (
                <span className="ml-3 text-lg text-[#9CA3AF] line-through">{fmtRub(product.oldPrice)} ₽</span>
              )}
              {product.oldPrice && (
                <span className="ml-2 text-sm font-bold text-[#DC2626]">
                  −{fmtRub(product.oldPrice - product.price)} ₽
                </span>
              )}
            </div>

            {/* Memory selector */}
            {product.memories && product.memories.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-[#6B7280] mb-2">Память:</p>
                <div className="flex flex-wrap gap-2">
                  {product.memories.map((m, i) => (
                    <button key={m}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors
                        ${i === 0 ? "bg-[#1A3C6E] text-white border-[#1A3C6E]"
                                  : "border-[#D8E2F0] text-[#6B7280] hover:border-[#1A3C6E] hover:text-[#1A3C6E]"}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-[#6B7280] mb-2">Цвет:</p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c, i) => (
                    <button key={c}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors
                        ${i === 0 ? "bg-[#0A1628] text-white border-[#0A1628]"
                                  : "border-[#D8E2F0] text-[#6B7280] hover:border-[#0A1628] hover:text-[#0A1628]"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <button className="btn-primary w-full py-4 text-base mb-3">
              Купить в рассрочку
            </button>
            <button className="w-full py-3 rounded-2xl border-2 border-[#D8E2F0] text-[#0A1628]
                               font-semibold text-sm hover:border-[#1A3C6E] hover:text-[#1A3C6E] transition-colors">
              Добавить в избранное ♡
            </button>
          </div>
        </div>

        {/* ── Calculator ── */}
        <div className="mb-12">
          <Calculator initialPrice={product.price} />
        </div>

        {/* ── Description & Specs ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Description */}
          <div className="card p-6">
            <h2 className="text-lg font-extrabold text-[#0A1628] mb-4">Описание</h2>
            <p className="text-[#4B5563] leading-relaxed text-sm">{product.description}</p>
          </div>

          {/* Specs */}
          <div className="card p-6">
            <h2 className="text-lg font-extrabold text-[#0A1628] mb-4">Характеристики</h2>
            <table className="w-full text-sm">
              <tbody>
                {product.specs.map((s, i) => (
                  <tr key={s.key}
                    className={`border-b ${i % 2 === 0 ? "bg-[#F4F7FC]" : "bg-white"}`}>
                    <td className="py-2 px-3 text-[#6B7280] font-medium w-2/5">{s.key}</td>
                    <td className="py-2 px-3 text-[#0A1628] font-semibold">{s.val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Related products ── */}
        {related.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-extrabold text-[#0A1628]">Похожие товары</h2>
              <Link href="/catalog/" className="text-sm font-semibold text-[#1A3C6E] hover:underline">
                Смотреть все →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {related.map((p) => (
                <Link key={p.id} href={`/product/${p.id}/`}
                  className="card p-4 hover:shadow-md transition-shadow group block">
                  <div className="w-full aspect-square bg-[#F4F7FC] rounded-xl mb-3
                                  flex items-center justify-center text-5xl">
                    {p.emoji}
                  </div>
                  <h3 className="font-semibold text-[#0A1628] text-xs leading-snug mb-1 line-clamp-2
                                 group-hover:text-[#1A3C6E] transition-colors">{p.name}</h3>
                  <p className="font-extrabold text-[#0A1628] text-sm">{p.tgSynced ? fmtRub(p.price) : fmtRubApprox(p.price)} ₽</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
