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
    <main className="bg-white">
      <div className="bg-[#F4F7FC] border-b border-[#D8E2F0]">
        <div className="section py-3 text-xs text-[#9CA3AF] flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#1A3C6E] transition-colors">Главная</Link>
          <span>/</span>
          <span className="text-[#0A1628]">Блог</span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden"
               style={{ background: "linear-gradient(135deg, #0E2344 0%, #1A3C6E 50%, #0C7A58 100%)" }}>
        <div className="absolute inset-0 opacity-25"
             style={{
               background: "radial-gradient(circle at 75% 30%, #3FCFA5 0%, transparent 55%), radial-gradient(circle at 15% 70%, #C8972B 0%, transparent 50%)",
             }} />
        <div className="absolute top-10 right-[8%] w-40 h-40 rounded-full opacity-20"
             style={{ background: "radial-gradient(circle, #3FCFA5, transparent)", filter: "blur(50px)" }} />

        <div className="section relative py-16 lg:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-[11px] uppercase tracking-widest font-bold text-[#3FCFA5] mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3FCFA5] animate-pulse"></span>
              {BLOG.length} {BLOG.length === 1 ? "статья" : BLOG.length < 5 ? "статьи" : "статей"} · обновляем регулярно
            </span>
            <h1 className="text-4xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-5">
              Журнал об<br/>
              <span style={{ background: "linear-gradient(90deg, #3FCFA5, #ffffff)",
                             WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                исламских финансах
              </span>
            </h1>
            <p className="text-white/75 text-lg lg:text-xl leading-relaxed max-w-2xl">
              Разбираем рассрочку без процентов, Мурабаху, Иджару и другие халяльные модели.
              Простыми словами для жителей {COMPANY.region}.
            </p>
          </div>
        </div>
      </section>

      <section className="py-14 lg:py-20">
        <div className="section space-y-12 max-w-6xl mx-auto">

          {/* Featured */}
          <Link href={`/blog/${featured.slug}/`}
                className="group block rounded-3xl overflow-hidden border-2 border-[#E5E7EB] bg-white
                           hover:border-[#0C7A58]/40 hover:shadow-2xl transition-all duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="relative overflow-hidden" style={{ minHeight: 320 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={featured.coverImg} alt={featured.coverAlt}
                     className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                     style={{ minHeight: 320 }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-bold text-white shadow-md"
                      style={{ background: "linear-gradient(135deg, #0C7A58, #0a6449)" }}>
                  ⭐ Главная статья
                </span>
              </div>
              <div className="p-8 lg:p-10 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#0C7A58] bg-[#ECFDF5] px-2 py-1 rounded-full">
                    {featured.category}
                  </span>
                  <span className="text-xs text-[#9CA3AF]">{featured.date} · {featured.readMin} мин</span>
                </div>
                <h2 className="text-2xl lg:text-3xl font-extrabold text-[#0A1628] leading-tight mb-4 group-hover:text-[#0C7A58] transition-colors">
                  {featured.title}
                </h2>
                <p className="text-[#6B7280] leading-relaxed mb-6 line-clamp-3">{featured.excerpt}</p>
                <span className="inline-flex items-center gap-2 self-start px-5 py-2.5 rounded-full text-sm font-bold text-white transition-transform group-hover:translate-x-1"
                      style={{ background: "linear-gradient(135deg, #0C7A58, #0a6449)" }}>
                  Читать статью →
                </span>
              </div>
            </div>
          </Link>

          {/* Grid of posts */}
          {rest.length > 0 && (
            <div>
              <h2 className="text-2xl font-extrabold text-[#0A1628] mb-6">Все статьи</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {rest.map((post) => (
                  <Link key={post.slug} href={`/blog/${post.slug}/`}
                        className="group bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden
                                   hover:border-[#0C7A58]/40 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                    <div className="relative overflow-hidden" style={{ height: 200 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={post.coverImg} alt={post.coverAlt}
                           className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold bg-white/95 text-[#0C7A58] backdrop-blur-sm">
                        {post.category}
                      </span>
                    </div>
                    <div className="p-5">
                      <p className="text-xs text-[#9CA3AF] mb-2">{post.date} · {post.readMin} мин</p>
                      <h3 className="font-extrabold text-[#0A1628] text-base leading-snug mb-2 group-hover:text-[#0C7A58] transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-[#6B7280] text-sm leading-relaxed line-clamp-2 mb-3">{post.excerpt}</p>
                      <span className="text-xs font-bold text-[#0C7A58]">Читать далее →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* CTA banner */}
          <div className="rounded-3xl p-10 text-center relative overflow-hidden"
               style={{ background: "linear-gradient(135deg, #062E22 0%, #0C7A58 100%)" }}>
            <div className="absolute inset-0 opacity-20"
                 style={{ background: "radial-gradient(circle at 70% 30%, #3FCFA5 0%, transparent 55%)" }} />
            <div className="relative">
              <p className="text-[#3FCFA5] text-[11px] uppercase tracking-widest font-bold mb-3">Готовы оформить?</p>
              <h3 className="text-white font-extrabold text-2xl lg:text-3xl mb-4">
                Рассчитайте свою рассрочку
              </h3>
              <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
                Введите цену товара и срок — получите платёж без процентов и скрытых платежей.
              </p>
              <Link href="/#calculator"
                    className="inline-flex px-8 py-3 bg-white text-[#0A1628] font-extrabold text-sm rounded-full hover:bg-white/90 transition-all shadow-lg">
                🧮 Открыть калькулятор
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
