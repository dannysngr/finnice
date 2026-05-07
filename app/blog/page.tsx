import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY, BLOG_POSTS } from "@/lib/data";

export const metadata: Metadata = {
  title:       `Блог — ${COMPANY.name} | ${COMPANY.city}`,
  description: `Статьи и советы по исламской рассрочке от ${COMPANY.legalName}. Халяльные финансы в ${COMPANY.region}.`,
};

export default function BlogPage() {
  return (
    <main>
      <div className="bg-[#F4F7FC] border-b border-[#D8E2F0]">
        <div className="section py-3 text-xs text-[#9CA3AF] flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#1A3C6E]">Главная</Link>
          <span>/</span>
          <span className="text-[#0A1628]">Блог</span>
        </div>
      </div>

      <section className="py-14 bg-[#F4F7FC]">
        <div className="section">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-[#0A1628] mb-3">Блог ФинНайс</h1>
          <p className="text-[#6B7280]">Полезные статьи об исламских финансах и рассрочке в {COMPANY.region}</p>
        </div>
      </section>

      <section className="py-12">
        <div className="section">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {BLOG_POSTS.map((post) => (
              <Link
                key={post.href}
                href={post.href}
                className="card p-6 hover:shadow-md transition-shadow group block"
              >
                <div className="w-full h-36 bg-gradient-to-br from-[#EBF0F9] to-[#F3F4F6]
                                rounded-xl mb-4 flex items-center justify-center text-4xl">
                  📖
                </div>
                <span className="text-xs text-[#9CA3AF] font-medium">{post.date}</span>
                <h2 className="font-bold text-[#0A1628] text-base mt-2 mb-2 leading-snug
                               group-hover:text-[#1A3C6E] transition-colors">
                  {post.title}
                </h2>
                <p className="text-[#6B7280] text-sm leading-relaxed line-clamp-3">{post.excerpt}</p>
                <span className="inline-block mt-4 text-xs font-semibold text-[#1A3C6E]">
                  Читать далее →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
