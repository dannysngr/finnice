import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY } from "@/lib/data";

export const metadata: Metadata = {
  title:       `Отзывы — ${COMPANY.name} | ${COMPANY.city}`,
  description: `Отзывы клиентов ${COMPANY.legalName} об исламской рассрочке в ${COMPANY.region}.`,
};

const REVIEWS = [
  { name: "Адам Т.",    city: "Грозный",      date: "апрель 2026",  rating: 5, text: "Оформил iPhone в рассрочку за 20 минут. Никаких банков, всё по нормам Ислама. Всё честно и прозрачно!" },
  { name: "Хава М.",    city: "Гудермес",     date: "март 2026",    rating: 5, text: "Взяла холодильник через Финнайс. Менеджер всё объяснил, условия понятные. Рекомендую!" },
  { name: "Ислам К.",   city: "Шали",         date: "март 2026",    rating: 5, text: "Наконец-то рассрочка по шариату в Чечне! Купил ноутбук без банка и без риба. Отличный сервис." },
  { name: "Заира У.",   city: "Аргун",        date: "февраль 2026", rating: 5, text: "Мечтала о стиральной машине — Финнайс помог. Без бумажной волокиты и очередей в банке." },
  { name: "Магомед Д.", city: "Грозный",      date: "февраль 2026", rating: 4, text: "Купил телевизор в рассрочку. Всё прозрачно: фиксированная наценка, никаких сюрпризов." },
  { name: "Лейла А.",   city: "Урус-Мартан",  date: "январь 2026",  rating: 5, text: "Очень довольна сервисом! Купила товар с WB через Финнайс — быстро и удобно." },
];

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #0C7A58, #0a6449)",
  "linear-gradient(135deg, #1A3C6E, #0E2344)",
  "linear-gradient(135deg, #C8972B, #A07820)",
  "linear-gradient(135deg, #3FCFA5, #0C7A58)",
  "linear-gradient(135deg, #DC2626, #991B1B)",
  "linear-gradient(135deg, #7C3AED, #5B21B6)",
];

export default function OtzyvyPage() {
  const total = REVIEWS.length;
  const avg = REVIEWS.reduce((s, r) => s + r.rating, 0) / total;

  return (
    <main className="bg-white">
      <div className="bg-[#F4F7FC] border-b border-[#D8E2F0]">
        <div className="section py-3 text-xs text-[#9CA3AF] flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#1A3C6E] transition-colors">Главная</Link>
          <span>/</span>
          <span className="text-[#0A1628]">Отзывы</span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden"
               style={{ background: "#0A1628" }}>
        <div className="absolute inset-0 opacity-25"
             style={{
               background: "radial-gradient(circle at 80% 20%, #3FCFA5 0%, transparent 55%), radial-gradient(circle at 15% 80%, #C8972B 0%, transparent 50%)",
             }} />
        <div className="absolute top-10 left-[10%] w-32 h-32 rounded-full opacity-20"
             style={{ background: "radial-gradient(circle, #3FCFA5, transparent)", filter: "blur(50px)" }} />

        <div className="section relative py-16 lg:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-[11px] uppercase tracking-widest font-bold text-[#3FCFA5] mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3FCFA5] animate-pulse"></span>
              {total} {total === 1 ? "отзыв" : total < 5 ? "отзыва" : "отзывов"} · средняя оценка {avg.toFixed(1)}/5
            </span>
            <h1 className="text-4xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-5">
              Что говорят<br/>
              <span style={{ background: "linear-gradient(90deg, #3FCFA5, #ffffff)",
                             WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                наши клиенты
              </span>
            </h1>
            <p className="text-white/75 text-lg lg:text-xl leading-relaxed max-w-2xl">
              Реальные истории жителей {COMPANY.region}, которые оформили халяльную рассрочку
              без банков и процентов.
            </p>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="relative -mt-8 z-10">
        <div className="section max-w-5xl mx-auto">
          <div className="grid grid-cols-3 gap-3">
            <Stat icon="⭐" label="Средняя оценка" value={`${avg.toFixed(1)}/5`} />
            <Stat icon="💼" label="Отзывов" value={String(total)} />
            <Stat icon="✅" label="Рекомендуют" value="100%" />
          </div>
        </div>
      </section>

      {/* Reviews grid */}
      <section className="py-14 lg:py-20">
        <div className="section max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {REVIEWS.map((r, idx) => (
              <div key={r.name + idx}
                   className="relative bg-white rounded-2xl border border-[#E5E7EB] p-6 transition-all hover:border-[#0C7A58]/40 hover:shadow-lg hover:-translate-y-0.5">
                <div className="absolute top-4 right-5 text-5xl text-[#0C7A58]/8 font-serif leading-none select-none">&ldquo;</div>

                <div className="flex items-center gap-3 mb-4 relative">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center font-extrabold text-white shadow-sm"
                       style={{ background: AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length] }}>
                    {r.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-[#0A1628] text-sm">{r.name}</p>
                    <p className="text-[11px] text-[#9CA3AF]">{r.city} · {r.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 mb-3 text-[#F59E0B] text-base">
                  {"★".repeat(r.rating)}
                  <span className="text-[#E5E7EB]">{"★".repeat(5 - r.rating)}</span>
                </div>

                <p className="text-[#374151] text-sm leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#0A1628] relative overflow-hidden">
        <div className="absolute inset-0 opacity-20"
             style={{ background: "radial-gradient(circle at 50% 50%, #0C7A58 0%, transparent 60%)" }} />
        <div className="section relative max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-white mb-3">
            Оставьте свой отзыв
          </h2>
          <p className="text-white/65 text-base mb-8 leading-relaxed">
            Уже воспользовались Финнайс? Поделитесь впечатлениями — мы публикуем все отзывы реальных клиентов.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a href={COMPANY.whatsapp} target="_blank" rel="noopener"
               className="px-6 py-3 rounded-full font-bold text-white inline-flex items-center gap-2"
               style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}>
              💬 Написать в WhatsApp
            </a>
            <a href={COMPANY.telegram} target="_blank" rel="noopener"
               className="px-6 py-3 rounded-full font-bold text-white inline-flex items-center gap-2"
               style={{ background: "linear-gradient(135deg, #2AABEE, #229ED9)" }}>
              ✈ Telegram
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 text-center transition-all hover:border-[#0C7A58]/40 hover:shadow-md">
      <div className="text-2xl mb-1">{icon}</div>
      <p className="text-2xl font-extrabold text-[#0A1628] leading-none">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-bold mt-1.5">{label}</p>
    </div>
  );
}
