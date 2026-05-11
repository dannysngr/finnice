import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY } from "@/lib/data";
import { BLOG } from "@/lib/blog-data";

export const metadata: Metadata = {
  title:       `Блог — ${COMPANY.name} | ${COMPANY.city}`,
  description: `Статьи и советы по исламской рассрочке от ${COMPANY.legalName}. Халяльные финансы в ${COMPANY.region}.`,
};

export default function BlogPage() {
  const [featured, ...rest] = BLOG;

  return (
    <main>
      {/* Breadcrumb */}
      <div className="bg-[#F4F7FC] border-b border-[#D8E2F0]">
        <div className="section py-3 text-xs text-[#9CA3AF] flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#1A3C6E] transition-colors">Главная</Link>
          <span>/</span>
          <span className="text-[#0A1628]">Блог</span>
        </div>
      </div>

      {/* Header */}
      <section className="py-10 bg-[#F4F7FC]">
        <div className="section">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-[#0A1628] mb-3">
            Блог ФинНайс
          </h1>
          <p className="text-[#6B7280] max-w-xl">
            Полезные статьи об исламских финансах, халяльной рассрочке и жизни
            без риба в&nbsp;{COMPANY.region}.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="section space-y-10">

          {/* Featured article */}
          <Link
            href={`/blog/${featured.slug}/`}
            className="group block rounded-3xl overflow-hidden shadow-sm border border-[#D8E2F0]
                       hover:shadow-lg transition-shadow"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Cover */}
              <div className="relative overflow-hidden" style={{ minHeight: 280 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featured.coverImg}
                  alt={featured.coverAlt}
                  className="w-full h-full object-cover group-hover:scale-105
                             transition-transform duration-500"
                  style={{ minHeight: 280 }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent
                                to-transparent lg:to-white/5" />
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-[11px]
                                  font-bold bg-[#0C7A58] text-white shadow-sm">
                  {featured.category}
                </span>
              </div>
              {/* Text */}
              <div className="bg-white p-8 flex flex-col justify-center">
                <span className="text-xs text-[#9CA3AF] font-medium mb-2">{featured.date}</span>
                <h2 className="text-2xl font-extrabold text-[#0A1628] leading-snug mb-3
                               group-hover:text-[#1A3C6E] transition-colors">
                  {featured.title}
                </h2>
                <p className="text-[#6B7280] leading-relaxed mb-6 line-clamp-3">
                  {featured.excerpt}
                </p>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-5 py-2.5
                                   bg-[#0A1628] text-white text-sm font-bold rounded-full
                                   group-hover:bg-[#1A3C6E] transition-colors">
                    Читать статью →
                  </span>
                  <span className="text-xs text-[#9CA3AF]">{featured.readMin} мин.</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Rest of posts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rest.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}/`}
                className="group card overflow-hidden hover:shadow-md transition-shadow flex flex-col"
              >
                {/* Cover */}
                <div className="relative overflow-hidden rounded-xl mb-4" style={{ height: 200 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.coverImg}
                    alt={post.coverAlt}
                    className="w-full h-full object-cover group-hover:scale-105
                               transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px]
                                    font-bold bg-[#0A1628]/75 text-white backdrop-blur-sm">
                    {post.category}
                  </span>
                </div>
                <div className="px-2 pb-2 flex flex-col flex-1">
                  <span className="text-xs text-[#9CA3AF] font-medium">{post.date}</span>
                  <h2 className="font-bold text-[#0A1628] text-base mt-1.5 mb-2 leading-snug
                                  group-hover:text-[#1A3C6E] transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-[#6B7280] text-sm leading-relaxed line-clamp-2 flex-1">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs font-semibold text-[#1A3C6E]">
                      Читать далее →
                    </span>
                    <span className="text-xs text-[#9CA3AF]">{post.readMin} мин.</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* CTA banner */}
          <div className="rounded-2xl p-8 text-center"
               style={{
                 background: "linear-gradient(135deg, #0E2344 0%, #1E4582 55%, #0C7A58 100%)",
               }}>
            <p className="text-white/70 text-sm mb-1">ФинНайс — исламские финансы в Грозном</p>
            <h3 className="text-white font-extrabold text-2xl mb-4">
              Готовы рассчитать рассрочку?
            </h3>
            <Link
              href="/#calculator"
              className="inline-flex px-8 py-3 bg-white text-[#0A1628] font-extrabold
                         text-sm rounded-full hover:bg-white/90 transition-all shadow-md"
            >
              Открыть калькулятор
            </Link>
          </div>

        </div>
      </section>
    </main>
  );
}
