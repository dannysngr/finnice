import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY } from "@/lib/data";
import { FinniceLogo } from "@/components/FinniceLogo";

export const metadata: Metadata = {
  title:       `О компании — ${COMPANY.name} | ${COMPANY.city}`,
  description: `${COMPANY.legalName} — исламская рассрочка в ${COMPANY.region}. ${COMPANY.slogan}`,
};

/* ─── DNA cards ──────────────────────────────────────────────── */
const DNA = [
  {
    icon: "☽",
    accent: "#C8972B",
    label: "100% Халяль",
    desc: "Мурабаха — договор купли-продажи, одобренный Шариатом. Ни одного процента.",
  },
  {
    icon: "🛡",
    accent: "#0C7A58",
    label: "0% скрытых комиссий",
    desc: "Цена фиксируется в момент сделки. Никаких дополнительных сборов и мелкого шрифта.",
  },
  {
    icon: "⚡",
    accent: "#1A3C6E",
    label: "Технологии",
    desc: "Заявка за 5 минут — полностью онлайн. Никаких очередей и лишних документов.",
  },
  {
    icon: "📋",
    accent: "#7C3AED",
    label: "Прозрачность",
    desc: "Один договор, одна сумма. Вы знаете итоговую цену до подписания.",
  },
] as const;

export default function CompanyPage() {
  return (
    <main className="bg-white">
      <div className="bg-[#F4F7FC] border-b border-[#D8E2F0]">
        <div className="section py-3 text-xs text-[#9CA3AF] flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#1A3C6E] transition-colors">Главная</Link>
          <span>/</span>
          <span className="text-[#0A1628]">О компании</span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden"
               style={{ background: "#0A1628" }}>
        <div className="absolute inset-0 opacity-30"
             style={{
               background: "radial-gradient(circle at 20% 80%, #3FCFA5 0%, transparent 50%), radial-gradient(circle at 80% 20%, #1A3C6E 0%, transparent 55%)",
             }} />
        <div className="absolute top-20 left-[8%] w-32 h-32 rounded-full opacity-25"
             style={{ background: "radial-gradient(circle, #3FCFA5, transparent)", filter: "blur(50px)" }} />
        <div className="absolute bottom-10 right-[10%] w-48 h-48 rounded-full opacity-20"
             style={{ background: "radial-gradient(circle, #C8972B, transparent)", filter: "blur(60px)" }} />

        <div className="section relative py-16 lg:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-[11px] uppercase tracking-widest font-bold text-[#3FCFA5] mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3FCFA5] animate-pulse"></span>
              {COMPANY.city} · {COMPANY.region}
            </span>
            <div className="mb-5" style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.25))" }}>
              <FinniceLogo size={56} variant="mark" />
            </div>
            <h1 className="text-4xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-5">
              Честная рассрочка<br/>
              <span style={{ background: "linear-gradient(90deg, #3FCFA5, #ffffff)",
                             WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                нового поколения
              </span>
            </h1>
            <p className="text-white/75 text-lg lg:text-xl leading-relaxed max-w-2xl">
              {COMPANY.legalName} — исламский финтех, который делает современные товары
              доступными без нарушения религиозных норм. Без банков, без процентов, без штрафов.
            </p>
          </div>
        </div>
      </section>

      {/* DNA */}
      <section className="py-14 lg:py-20">
        <div className="section max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] uppercase tracking-widest font-bold text-[#0C7A58] mb-3">
              Наш ДНК
            </p>
            <h2 className="text-3xl font-extrabold text-[#0A1628] mb-3">
              На чём построен Финнайс
            </h2>
            <p className="text-[#6B7280] max-w-xl mx-auto">
              Четыре принципа, которые определяют, как мы работаем с каждым клиентом.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {DNA.map((card) => (
              <div key={card.label}
                   className="bg-white rounded-2xl border border-[#E5E7EB] p-6 transition-all hover:border-[#0C7A58]/30 hover:shadow-md hover:-translate-y-0.5">
                <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center text-2xl"
                     style={{
                       background: `linear-gradient(135deg, ${card.accent}18, ${card.accent}08)`,
                       border: `1px solid ${card.accent}30`,
                       color: card.accent,
                     }}>
                  {card.icon}
                </div>
                <h3 className="font-extrabold text-[#0A1628] text-base mb-1.5">{card.label}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Final CTA */}
      <section className="py-16 bg-[#0A1628] relative overflow-hidden">
        <div className="absolute inset-0 opacity-20"
             style={{ background: "radial-gradient(circle at 50% 50%, #0C7A58 0%, transparent 60%)" }} />
        <div className="section relative max-w-2xl mx-auto text-center">
          <p className="text-[#3FCFA5] text-[11px] uppercase tracking-widest font-bold mb-3">
            {COMPANY.city} · {COMPANY.region}
          </p>
          <h2 className="text-3xl font-extrabold text-white mb-3">
            Станьте одним из первых клиентов
          </h2>
          <p className="text-white/65 text-base mb-8 leading-relaxed">
            Мы только открылись — и рады каждому, кто выбирает честную рассрочку.
            Без банков, без риба, без лишних вопросов.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/catalog/"
                  className="px-6 py-3 rounded-full font-bold inline-flex items-center gap-2 bg-white text-[#0A1628] hover:bg-white/90 transition-colors">
              🛍 Открыть каталог
            </Link>
            <Link href="/#calculator"
                  className="px-6 py-3 rounded-full font-bold text-white border border-white/30 hover:bg-white/10 transition-colors inline-flex items-center gap-2">
              🧮 Рассчитать рассрочку
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
