import { notFound } from "next/navigation";
import Link from "next/link";
import { PRODUCTS, CATALOG_CATS } from "@/lib/data";
import { fmtRub, fmtRubApprox } from "@/lib/calculator-logic";
import { Calculator } from "@/components/Calculator";
import { ProductHero } from "@/components/ProductHero";

/** Порядок групп spec'ов на детальной странице (как на biggeek.ru). */
const SPEC_GROUP_ORDER = [
  "Общие характеристики", "Конструкция", "Память и процессор",
  "Экран", "Звук", "Связь", "Интерфейсы",
  "Устройства ввода", "Устройства хранения данных",
  "Мультимедийные возможности", "Питание", "Другие функции", "Прочее",
];

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
        {/* ── Top: image + info (клиентский компонент для синхронизации
               цвета и фото) ── */}
        <ProductHero product={product} stars={stars} />

        {/* ── Calculator ── */}
        <div className="mb-12">
          <Calculator initialPrice={product.price} />
        </div>

        {/* ── Description & Specs ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Description */}
          <div className="card p-6">
            <h2 className="text-lg font-extrabold text-[#0A1628] mb-4">Описание</h2>
            <p className="text-[#4B5563] leading-relaxed text-sm whitespace-pre-line">
              {product.description}
            </p>
          </div>

          {/* Specs — сгруппированы по подразделам (как на biggeek) */}
          <div className="card p-6">
            <h2 className="text-lg font-extrabold text-[#0A1628] mb-4">Характеристики</h2>
            {(() => {
              // Группируем specs по group; внутри группы сохраняем исходный порядок
              const byGroup = new Map<string, { key: string; val: string }[]>();
              for (const s of product.specs) {
                const g = s.group ?? "Прочее";
                if (!byGroup.has(g)) byGroup.set(g, []);
                byGroup.get(g)!.push({ key: s.key, val: s.val });
              }
              // Сортируем группы по фиксированному порядку, остальные — в конец
              const groups = Array.from(byGroup.keys()).sort((a, b) => {
                const ia = SPEC_GROUP_ORDER.indexOf(a);
                const ib = SPEC_GROUP_ORDER.indexOf(b);
                return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
              });
              if (groups.length === 0) {
                return <p className="text-sm text-[#9CA3AF]">Нет характеристик</p>;
              }
              return (
                <div className="space-y-5">
                  {groups.map(g => (
                    <div key={g}>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A3C6E] mb-2">
                        {g}
                      </h3>
                      <table className="w-full text-sm">
                        <tbody>
                          {byGroup.get(g)!.map((s, i) => (
                            <tr key={s.key + i}
                                className={`border-b border-[#EBF0F9] ${i % 2 === 0 ? "bg-[#F4F7FC]" : "bg-white"}`}>
                              <td className="py-1.5 px-3 text-[#6B7280] font-medium w-1/2">{s.key}</td>
                              <td className="py-1.5 px-3 text-[#0A1628] font-semibold">{s.val}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              );
            })()}
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
