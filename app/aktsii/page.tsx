import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY } from "@/lib/data";

export const metadata: Metadata = {
  title:       `Акции — ${COMPANY.name} | ${COMPANY.city}`,
  description: `Специальные предложения и акции на рассрочку от ${COMPANY.legalName} в г. ${COMPANY.city}.`,
};

export default function AktsiiPage() {
  return (
    <main>
      <div className="bg-[#F4F7FC] border-b border-[#D8E2F0]">
        <div className="section py-3 text-xs text-[#9CA3AF] flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#1A3C6E]">Главная</Link>
          <span>/</span>
          <span className="text-[#0A1628]">Акции</span>
        </div>
      </div>

      <section className="py-14 bg-[#F4F7FC]">
        <div className="section">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-[#0A1628] mb-3">Акции и спецпредложения</h1>
          <p className="text-[#6B7280]">Выгодные условия рассрочки от {COMPANY.legalName}</p>
        </div>
      </section>

      <section className="py-12">
        <div className="section">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {PROMOS.map((p) => (
              <div key={p.title}
                   className={`rounded-3xl p-6 text-white relative overflow-hidden ${p.gradient}`}>
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
                <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-semibold mb-4">
                  {p.badge}
                </span>
                <h2 className="text-xl font-extrabold mb-2">{p.title}</h2>
                <p className="text-white/80 text-sm leading-relaxed mb-5">{p.desc}</p>
                <Link href="/contacts/" className="inline-flex items-center gap-1.5 bg-white text-[#0A1628]
                                                   font-semibold text-sm px-5 py-2.5 rounded-full
                                                   hover:bg-white/90 transition-colors">
                  Узнать подробнее →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

const PROMOS = [
  {
    gradient: "bg-gradient-to-br from-[#1A3C6E] to-[#0C7A58]",
    badge: "🔥 Горячее предложение",
    title: "Рассрочка на 24 месяца",
    desc:  "Растяните платежи на 2 года при минимальном первоначальном взносе 20%. Без скрытых платежей.",
  },
  {
    gradient: "bg-gradient-to-br from-[#0C7A58] to-[#1A3C6E]",
    badge: "🛍️ Wildberries",
    title: "Любой товар с WB",
    desc:  "Покупайте любые товары на Wildberries в рассрочку через ФинНайс. Оформление за 15 минут.",
  },
  {
    gradient: "bg-gradient-to-br from-[#059669] to-[#0C7A58]",
    badge: "🤝 Партнёрам",
    title: "Акционный тариф",
    desc:  "В магазинах-партнёрах ФинНайс действует специальная ставка наценки. Выгодно для покупателей.",
  },
];
