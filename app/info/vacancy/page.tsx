import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY } from "@/lib/data";
import { VacancyClient, type Vacancy } from "./VacancyClient";

export const metadata: Metadata = {
  title:       `Вакансии — ${COMPANY.name} | ${COMPANY.city}`,
  description: `Открытые вакансии в ${COMPANY.legalName}. Работа в ${COMPANY.city}, ${COMPANY.region}.`,
};

const VACANCIES: Vacancy[] = [
  {
    dept:   "Продажи",
    title:  "Менеджер по работе с клиентами",
    desc:   "Консультирование клиентов, оформление договоров рассрочки, работа с партнёрами в Грозном.",
    salary: "от 45 000 ₽",
    type:   "Полная занятость",
    skills: ["Грамотная речь", "Опыт продаж приветствуется", "Знание исламских финансов — плюс"],
  },
  {
    dept:   "IT",
    title:  "Менеджер маркетплейсов (WB / Ozon)",
    desc:   "Ведение карточек товаров, работа с заявками на рассрочку через Wildberries.",
    salary: "от 50 000 ₽",
    type:   "Полная / частичная",
    skills: ["Опыт с WB Seller или Ozon Seller", "Excel / Google Sheets", "Внимание к деталям"],
    closed: true,
  },
  {
    dept:   "Финансы",
    title:  "Финансовый аналитик",
    desc:   "Контроль портфеля рассрочек, работа с договорами и отчётностью. Знание исламских финансов приветствуется.",
    salary: "от 60 000 ₽",
    type:   "Полная занятость",
    skills: ["Финансовое или экономическое образование", "1С / Excel на продвинутом уровне", "Опыт от 1 года"],
    closed: true,
  },
];

export default function VacancyPage() {
  return (
    <main className="bg-white">
      <div className="bg-[#F4F7FC] border-b border-[#D8E2F0]">
        <div className="section py-3 text-xs text-[#9CA3AF] flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#1A3C6E]">Главная</Link>
          <span>/</span>
          <span className="text-[#0A1628]">Вакансии</span>
        </div>
      </div>

      <section className="relative py-14 lg:py-20 overflow-hidden"
               style={{ background: "#0A1628" }}>
        <div className="absolute inset-0 opacity-30"
             style={{
               background: "radial-gradient(circle at 20% 80%, #3FCFA5 0%, transparent 50%), radial-gradient(circle at 80% 20%, #1A3C6E 0%, transparent 55%)",
             }} />
        <div className="absolute top-20 left-[8%] w-32 h-32 rounded-full opacity-25"
             style={{ background: "radial-gradient(circle, #3FCFA5, transparent)", filter: "blur(50px)" }} />
        <div className="absolute bottom-10 right-[10%] w-48 h-48 rounded-full opacity-20"
             style={{ background: "radial-gradient(circle, #C8972B, transparent)", filter: "blur(60px)" }} />
        <div className="section relative">
          <div className="max-w-2xl">
            <span className="inline-block text-[11px] uppercase tracking-widest font-bold text-[#3FCFA5] mb-3">
              {VACANCIES.length} {VACANCIES.length === 1 ? "открытая вакансия" : "открытые вакансии"} · {COMPANY.city}
            </span>
            <h1 className="text-3xl lg:text-5xl font-extrabold text-white tracking-tight mb-4">
              Работа в ФинНайс
            </h1>
            <p className="text-white/75 text-lg leading-relaxed">
              Мы строим первый на Кавказе исламский финтех. Без риба, без штрафов, без серых схем —
              честная работа в команде, которая создаёт новый рынок.
            </p>
          </div>
        </div>
      </section>

      <VacancyClient vacancies={VACANCIES} />

      <section className="py-14 bg-[#F4F7FC]">
        <div className="section max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-extrabold text-[#0A1628] mb-3">
            Не нашли подходящую вакансию?
          </h2>
          <p className="text-[#6B7280] mb-6">
            Напишите нам — расскажите о себе, что умеете и чем хотели бы заниматься.
            Мы быстро растём и всегда рассматриваем сильных кандидатов.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a href={COMPANY.whatsapp} target="_blank" rel="noopener"
               className="px-5 py-3 rounded-full font-bold text-white inline-flex items-center gap-2"
               style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}>
              💬 WhatsApp
            </a>
            <a href={COMPANY.telegram} target="_blank" rel="noopener"
               className="px-5 py-3 rounded-full font-bold text-white inline-flex items-center gap-2"
               style={{ background: "linear-gradient(135deg, #2AABEE, #229ED9)" }}>
              ✈ Telegram
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
