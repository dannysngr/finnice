import type { Metadata } from "next";
import { Calculator } from "@/components/Calculator";
import { COMPANY } from "@/lib/data";

export const metadata: Metadata = {
  title:       `Wildberries в рассрочку — ${COMPANY.name} | ${COMPANY.city}`,
  description: `Купите любой товар с Wildberries в рассрочку по нормам Ислама. Без банка, без процентов. ${COMPANY.legalName}, ${COMPANY.city}.`,
  keywords:    `wildberries рассрочка, WB рассрочка, ${COMPANY.city}, исламская рассрочка`,
};

export default function WbPage() {
  return (
    <main>
      {/* ── Hero ── */}
      <section
        className="py-16 md:py-20 text-white"
        style={{ background: "linear-gradient(135deg, #0E2344 0%, #1A3C6E 50%, #1A3C6E 100%)" }}
      >
        <div className="section text-center max-w-3xl mx-auto">
          {/* WB logo badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 rounded-full
                          border border-white/25 mb-6">
            <span className="text-xl">🛍️</span>
            <span className="font-semibold text-sm">Wildberries × ФинНайс</span>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
            Покупайте на Wildberries —<br className="hidden md:block" />
            платите частями
          </h1>
          <p className="text-white/80 text-base md:text-lg leading-relaxed mb-8 max-w-xl mx-auto">
            Любые товары с WB в рассрочку по нормам Ислама. Без банка, без процентов, без пени.
            Оформление за 15 минут в г. Грозный.
          </p>

          {/* Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { n: "1", t: "Вставьте ссылку", d: "Найдите товар на WB и скопируйте ссылку" },
              { n: "2", t: "Рассчитайте",     d: "Введите стоимость в калькулятор ниже" },
              { n: "3", t: "Получите товар",  d: "Мы оформим заявку и доставим товар" },
            ].map((s) => (
              <div key={s.n} className="bg-white/10 rounded-2xl p-4 text-left">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center
                                text-sm font-extrabold mb-2">{s.n}</div>
                <p className="font-bold text-sm mb-1">{s.t}</p>
                <p className="text-white/65 text-xs leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Calculator ── */}
      <section className="py-12 bg-[#F4F7FC]">
        <div className="section max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-[#0A1628] mb-2">
              Рассчитайте рассрочку на товар с WB
            </h2>
            <p className="text-[#6B7280] text-sm">
              Вставьте ссылку на товар и введите его стоимость в калькулятор
            </p>
          </div>
          <Calculator withLink />
        </div>
      </section>

      {/* ── How it works detail ── */}
      <section className="py-14">
        <div className="section">
          <h2 className="text-2xl font-extrabold text-[#0A1628] text-center mb-10">
            Как это работает?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {HOW_ITEMS.map((item, i) => (
              <div key={i} className="card p-6">
                <span className="text-3xl block mb-3">{item.icon}</span>
                <h3 className="font-bold text-[#0A1628] text-sm mb-2">{item.title}</h3>
                <p className="text-[#6B7280] text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-14 bg-[#F4F7FC]">
        <div className="section max-w-3xl mx-auto">
          <h2 className="text-2xl font-extrabold text-[#0A1628] text-center mb-8">
            Частые вопросы
          </h2>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <div key={i} className="card p-5">
                <h3 className="font-bold text-[#0A1628] text-sm mb-2">❓ {item.q}</h3>
                <p className="text-[#6B7280] text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

const HOW_ITEMS = [
  {
    icon: "🔗",
    title: "Найдите товар",
    desc:  "Откройте любой товар на Wildberries, скопируйте ссылку из адресной строки.",
  },
  {
    icon: "📋",
    title: "Заполните заявку",
    desc:  "Вставьте ссылку в форму, рассчитайте рассрочку и нажмите «Заполнить анкету».",
  },
  {
    icon: "✅",
    title: "Одобрение за 15 мин",
    desc:  "Менеджер ФинНайс свяжется с вами и подтвердит заявку.",
  },
  {
    icon: "📦",
    title: "Получите товар",
    desc:  "Мы заказываем товар и передаём вам. Платите по удобному графику.",
  },
];

const FAQ = [
  {
    q: "Какие товары можно купить через WB в рассрочку?",
    a: "Любые товары, представленные на Wildberries: электронику, одежду, бытовую технику, товары для дома и многое другое.",
  },
  {
    q: "Это действительно без процентов?",
    a: "Да. ФинНайс работает по принципу товарной рассрочки — мы сначала покупаем товар, а потом продаём вам с фиксированной наценкой. Это не кредит и не займ.",
  },
  {
    q: "Какой минимальный первоначальный взнос?",
    a: "Минимальный первоначальный взнос составляет 20% от стоимости товара.",
  },
  {
    q: "Как долго рассматривается заявка?",
    a: "Менеджер связывается с вами в течение 15 минут после отправки заявки в рабочее время (Пн–Пт, 9:00–19:00).",
  },
];
