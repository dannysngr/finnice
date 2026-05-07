import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY, REP, VALUES } from "@/lib/data";

export const metadata: Metadata = {
  title:       `О компании — ${COMPANY.name} | ${COMPANY.city}`,
  description: `${COMPANY.legalName} — исламская рассрочка в ${COMPANY.region}. ${COMPANY.slogan}`,
};

export default function CompanyPage() {
  return (
    <main>
      <div className="bg-[#F4F7FC] border-b border-[#D8E2F0]">
        <div className="section py-3 text-xs text-[#9CA3AF] flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#1A3C6E]">Главная</Link>
          <span>/</span>
          <span className="text-[#0A1628]">О компании</span>
        </div>
      </div>

      <section className="py-16 bg-[#F4F7FC]">
        <div className="section max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl grad-main flex items-center justify-center
                          text-white font-extrabold text-2xl mx-auto mb-6">NF</div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-[#0A1628] mb-4">
            {COMPANY.legalName}
          </h1>
          <p className="text-[#4B5563] leading-relaxed text-base mb-2">
            Компания {COMPANY.legalName} предоставляет жителям {COMPANY.region} возможность взять товарную рассрочку.
          </p>
          <p className="text-[#6B7280] text-sm leading-relaxed">
            Наше товарищество руководствуется исключительно исламскими принципами и тезисом
            «На долгах наживаться нельзя», разделяя сделки купли-продажи от кредитных инструментов.
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="section">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
            {VALUES.map((v) => (
              <div key={v.title} className="card p-6 text-center">
                <span className="text-3xl block mb-3">{v.icon}</span>
                <h3 className="font-bold text-[#0A1628] mb-2">{v.title}</h3>
                <p className="text-[#6B7280] text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>

          {/* Rep */}
          <div className="card p-8 max-w-2xl mx-auto flex items-start gap-6">
            <div className="w-16 h-16 rounded-full bg-[#EBF0F9] border-2 border-[#1A3C6E]
                            flex items-center justify-center text-2xl shrink-0">👤</div>
            <div>
              <p className="font-bold text-[#0A1628] text-lg">{REP.name}</p>
              <p className="text-sm text-[#6B7280] mb-3">{REP.title}</p>
              <p className="text-[#4B5563] leading-relaxed italic text-sm">
                &ldquo;{REP.quote}&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-[#0A1628] text-center">
        <div className="section">
          <h2 className="text-2xl font-extrabold text-white mb-3">Хотите оформить рассрочку?</h2>
          <p className="text-white/60 text-sm mb-6">г. Грозный, ул. Орзамиева, 8 · {COMPANY.hours}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/contacts/" className="btn-primary px-8 py-3">Наши контакты</Link>
            <Link href="/#calculator" className="btn-white px-8 py-3">Рассчитать рассрочку</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
