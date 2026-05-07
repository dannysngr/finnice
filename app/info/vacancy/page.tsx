import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY } from "@/lib/data";

export const metadata: Metadata = {
  title:       `Вакансии — ${COMPANY.name} | ${COMPANY.city}`,
  description: `Открытые вакансии в ${COMPANY.legalName}. Работа в ${COMPANY.city}, ${COMPANY.region}.`,
};

export default function VacancyPage() {
  return (
    <main>
      <div className="bg-[#F4F7FC] border-b border-[#D8E2F0]">
        <div className="section py-3 text-xs text-[#9CA3AF] flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#1A3C6E]">Главная</Link>
          <span>/</span>
          <span className="text-[#0A1628]">Вакансии</span>
        </div>
      </div>

      <section className="py-14 bg-[#F4F7FC]">
        <div className="section">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-[#0A1628] mb-3">Работа у нас</h1>
          <p className="text-[#6B7280]">Открытые вакансии в {COMPANY.legalName}, г. {COMPANY.city}</p>
        </div>
      </section>

      <section className="py-12">
        <div className="section max-w-3xl mx-auto space-y-4">
          {VACANCIES.map((v) => (
            <div key={v.title} className="card p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <span className="text-xs font-semibold text-[#1A3C6E] bg-[#EBF0F9] px-3 py-1 rounded-full mb-2 inline-block">
                    {v.dept}
                  </span>
                  <h2 className="text-lg font-extrabold text-[#0A1628] mb-1">{v.title}</h2>
                  <p className="text-[#6B7280] text-sm leading-relaxed">{v.desc}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-extrabold text-[#0A1628]">{v.salary}</p>
                  <p className="text-xs text-[#9CA3AF]">{v.type}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#D8E2F0]">
                <Link href="/contacts/"
                      className="text-sm font-semibold text-[#1A3C6E] hover:underline">
                  Откликнуться →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

const VACANCIES = [
  {
    dept:   "Продажи",
    title:  "Менеджер по работе с клиентами",
    desc:   "Консультирование клиентов, оформление договоров рассрочки, работа с партнёрами в Грозном.",
    salary: "от 45 000 ₽",
    type:   "Полная занятость",
  },
  {
    dept:   "IT",
    title:  "Менеджер маркетплейсов (WB / Ozon)",
    desc:   "Ведение карточек товаров, работа с заявками на рассрочку через Wildberries.",
    salary: "от 50 000 ₽",
    type:   "Полная / частичная",
  },
  {
    dept:   "Финансы",
    title:  "Финансовый аналитик",
    desc:   "Контроль портфеля рассрочек, работа с договорами и отчётностью. Знание исламских финансов приветствуется.",
    salary: "от 60 000 ₽",
    type:   "Полная занятость",
  },
];
