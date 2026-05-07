import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY, PARTNER_TABS } from "@/lib/data";

export const metadata: Metadata = {
  title:       `Партнёры — ${COMPANY.name} | ${COMPANY.city}`,
  description: `Магазины-партнёры ${COMPANY.legalName} в г. ${COMPANY.city}. Купите электронику, технику и мебель в рассрочку.`,
};

export default function PartnersPage() {
  return (
    <main>
      <div className="bg-[#F4F7FC] border-b border-[#D8E2F0]">
        <div className="section py-3 text-xs text-[#9CA3AF] flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#1A3C6E]">Главная</Link>
          <span>/</span>
          <span className="text-[#0A1628]">Партнёры</span>
        </div>
      </div>

      <section className="py-14 bg-[#F4F7FC]">
        <div className="section">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-[#0A1628] mb-3">Наши партнёры</h1>
          <p className="text-[#6B7280] max-w-xl">
            Покупайте в магазинах-партнёрах ФинНайс по специальным акционным тарифам рассрочки.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="section space-y-10">
          {PARTNER_TABS.map((tab) => (
            <div key={tab.key}>
              <h2 className="text-xl font-extrabold text-[#0A1628] mb-5">{tab.label}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3">
                {tab.partners.map((name) => (
                  <div
                    key={name}
                    className="aspect-[4/3] bg-white rounded-2xl border border-[#D8E2F0]
                               shadow-sm flex items-center justify-center p-3
                               hover:border-[#1A3C6E]/30 hover:shadow-md transition-all cursor-pointer"
                  >
                    <span className="text-sm font-semibold text-[#6B7280] text-center leading-tight">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 bg-[#0A1628] text-center">
        <div className="section">
          <h2 className="text-2xl font-extrabold text-white mb-3">Хотите стать партнёром?</h2>
          <p className="text-white/60 text-sm mb-6 max-w-md mx-auto">
            Если у вас есть магазин в {COMPANY.region} — подключайтесь к программе рассрочки ФинНайс.
          </p>
          <Link href="/contacts/" className="btn-primary px-8 py-3">Написать нам</Link>
        </div>
      </section>
    </main>
  );
}
