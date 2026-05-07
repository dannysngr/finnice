import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY } from "@/lib/data";

export const metadata: Metadata = {
  title:       `Отзывы — ${COMPANY.name} | ${COMPANY.city}`,
  description: `Отзывы клиентов ${COMPANY.legalName} об исламской рассрочке в ${COMPANY.region}.`,
};

export default function OtzyvyPage() {
  return (
    <main>
      <div className="bg-[#F4F7FC] border-b border-[#D8E2F0]">
        <div className="section py-3 text-xs text-[#9CA3AF] flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#1A3C6E]">Главная</Link>
          <span>/</span>
          <span className="text-[#0A1628]">Отзывы</span>
        </div>
      </div>

      <section className="py-14 bg-[#F4F7FC]">
        <div className="section">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-[#0A1628] mb-3">Отзывы клиентов</h1>
          <p className="text-[#6B7280]">Что говорят жители {COMPANY.region} о рассрочке ФинНайс</p>
        </div>
      </section>

      <section className="py-12">
        <div className="section">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {REVIEWS.map((r) => (
              <div key={r.name} className="card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#EBF0F9] flex items-center justify-center
                                  font-extrabold text-[#1A3C6E] shrink-0">
                    {r.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-[#0A1628] text-sm">{r.name}</p>
                    <p className="text-xs text-[#9CA3AF]">{r.city} · {r.date}</p>
                  </div>
                </div>
                <p className="text-[#F59E0B] text-sm mb-2 tracking-tight">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
                <p className="text-[#4B5563] text-sm leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

const REVIEWS = [
  { name: "Адам Т.",     city: "Грозный",       date: "апрель 2026", rating: 5, text: "Оформил iPhone в рассрочку за 20 минут. Никаких банков, никаких процентов. Всё честно и прозрачно!" },
  { name: "Хава М.",     city: "Гудермес",       date: "март 2026",   rating: 5, text: "Взяла холодильник через ФинНайс. Менеджер всё объяснил, условия понятные. Рекомендую!" },
  { name: "Ислам К.",    city: "Шали",           date: "март 2026",   rating: 5, text: "Наконец-то рассрочка по шариату в Чечне! Купил ноутбук без банка и процентов. Отличный сервис." },
  { name: "Заира У.",    city: "Аргун",          date: "февраль 2026",rating: 5, text: "Мечтала о стиральной машине — ФинНайс помог. Без бумажной волокиты и очередей в банке." },
  { name: "Магомед Д.",  city: "Грозный",        date: "февраль 2026",rating: 4, text: "Купил телевизор в рассрочку. Всё прозрачно: фиксированная наценка, никаких сюрпризов." },
  { name: "Лейла А.",    city: "Урус-Мартан",    date: "январь 2026", rating: 5, text: "Очень довольна сервисом! Купила товар с WB через ФинНайс — быстро и удобно." },
];
