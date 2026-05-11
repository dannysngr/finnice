import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY, REP } from "@/lib/data";

export const metadata: Metadata = {
  title:       `О компании — ${COMPANY.name} | ${COMPANY.city}`,
  description: `${COMPANY.legalName} — исламская рассрочка в ${COMPANY.region}. ${COMPANY.slogan}`,
};

/* ─── DNA cards ──────────────────────────────────────────────── */
const DNA = [
  {
    icon: "☽",
    accent: "#C9A84C",
    label: "100% Халяль",
    desc: "Мурабаха — договор купли-продажи, одобренный Шариатом. Ни одного процента.",
  },
  {
    icon: "🛡",
    accent: "#4ADE80",
    label: "0% скрытых комиссий",
    desc: "Цена фиксируется в момент сделки. Никаких дополнительных сборов и мелкого шрифта.",
  },
  {
    icon: "⚡",
    accent: "#60A5FA",
    label: "Технологии",
    desc: "Заявка за 5 минут — полностью онлайн. Никаких очередей и лишних документов.",
  },
  {
    icon: "📋",
    accent: "#A78BFA",
    label: "Прозрачность",
    desc: "Один договор, одна сумма. Вы знаете итоговую цену до подписания.",
  },
] as const;

export default function CompanyPage() {
  return (
    <main className="bg-[#0f172a]">

      {/* ── Breadcrumb ─────────────────────────────────────────── */}
      <div className="border-b border-white/8">
        <div className="section py-3 text-xs text-white/35 flex items-center gap-1.5">
          <Link href="/" className="hover:text-white/70 transition-colors">Главная</Link>
          <span>/</span>
          <span className="text-white/55">О компании</span>
        </div>
      </div>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="py-24 text-center relative overflow-hidden">
        {/* subtle radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(12,122,88,0.18) 0%, transparent 70%)",
          }}
        />

        <div className="section max-w-2xl mx-auto relative">
          {/* Logo */}
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-8 flex items-center justify-center
                       font-extrabold text-xl text-white select-none"
            style={{
              background:
                "linear-gradient(135deg, #0E2344 0%, #1A3C6E 55%, #0C7A58 100%)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.1), 0 8px 32px rgba(12,122,88,0.3)",
            }}
          >
            NF
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 leading-tight tracking-tight">
            Finnice — честная рассрочка<br className="hidden sm:block" /> нового поколения
          </h1>

          <p className="text-white/55 text-lg leading-relaxed max-w-xl mx-auto mb-8">
            Мы запускаем сервис, чтобы сделать современные гаджеты и услуги
            доступными без нарушения религиозных норм.
          </p>

          <p className="text-white/35 text-sm font-medium tracking-widest uppercase">
            Честно · Быстро · По Шариату
          </p>
        </div>
      </section>

      {/* ── DNA Grid ───────────────────────────────────────────── */}
      <section className="py-16">
        <div className="section">
          <p className="text-white/35 text-xs font-semibold uppercase tracking-widest text-center mb-12">
            Наш ДНК
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {DNA.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300
                           hover:-translate-y-1 cursor-default"
                style={{
                  background:   "rgba(255,255,255,0.04)",
                  border:       "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <span
                  className="text-2xl w-10 h-10 rounded-xl flex items-center justify-center
                             font-semibold shrink-0"
                  style={{
                    background: `${card.accent}18`,
                    color: card.accent,
                    border: `1px solid ${card.accent}30`,
                  }}
                >
                  {card.icon}
                </span>
                <div>
                  <p className="font-bold text-white text-sm mb-1.5">{card.label}</p>
                  <p className="text-white/45 text-xs leading-relaxed">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Rep slim banner ────────────────────────────────────── */}
      <section className="py-12">
        <div className="section">
          <div
            className="max-w-3xl mx-auto flex items-center gap-6 rounded-2xl px-8 py-6"
            style={{
              background: "rgba(255,255,255,0.04)",
              border:     "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {/* Avatar */}
            <div
              className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center"
              style={{ background: "rgba(26,60,110,0.5)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="8" r="4.5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"/>
                <path d="M2 21c0-4.97 4.03-9 9-9s9 4.03 9 9"
                      stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>

            {/* Quote */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-snug">
                «Без риба. Без процентов. Без штрафов.»
              </p>
              <p className="text-white/35 text-xs mt-1">
                {REP.name} — {REP.title}
              </p>
            </div>

            {/* Accent line */}
            <div
              className="hidden sm:block w-px h-12 shrink-0"
              style={{ background: "linear-gradient(to bottom, transparent, #0C7A58, transparent)" }}
            />
            <Link
              href="/contacts/"
              className="hidden sm:block text-xs font-semibold shrink-0 transition-colors"
              style={{ color: "#4ADE80" }}
            >
              Связаться →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Launch CTA ─────────────────────────────────────────── */}
      <section className="py-20 text-center">
        <div className="section max-w-xl mx-auto">
          <p className="text-white/30 text-xs font-medium uppercase tracking-widest mb-4">
            {COMPANY.city} · {COMPANY.region}
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
            Станьте одним из первых<br className="hidden sm:block" /> клиентов Finnice
          </h2>
          <p className="text-white/40 text-sm mb-10 leading-relaxed">
            Мы только открылись — и рады каждому, кто выбирает честную рассрочку.<br />
            Без банков. Без риба. Без лишних вопросов.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/catalog/"
              className="px-8 py-3.5 font-extrabold text-sm rounded-full transition-all
                         text-[#0f172a] hover:opacity-90 shadow-lg"
              style={{ background: "linear-gradient(135deg, #4ADE80, #0C7A58)" }}
            >
              Открыть каталог
            </Link>
            <Link
              href="/#calculator"
              className="px-8 py-3.5 font-semibold text-sm rounded-full transition-all
                         text-white hover:bg-white/15"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              Рассчитать рассрочку
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
