import Link from "next/link";
// HeroSlider скрыт — калькулятор поднят в самый верх
// import { HeroSlider } from "@/components/HeroSlider";
import { Calculator } from "@/components/Calculator";
import { SmartphonesSection } from "@/components/SmartphonesSection";
import { HomeBanner } from "@/components/HomeBanner";
import { BLOG } from "@/lib/blog-data";


export default function HomePage() {
  return (
    <main>
      <CalculatorSection />
      <SmartphonesSection />
      <AboutSection />
      <BlogSection />
    </main>
  );
}

/* ── 1. Calculator ───────────────────────────────────────────── */
function CalculatorSection() {
  return (
    <section
      className="py-8 sm:py-10"
      style={{
        background: "linear-gradient(160deg, #EBF5F0 0%, #F4F7FC 55%, #EDF1F8 100%)",
      }}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <style>{`
          @media (max-width: 767px) {
            .hero-grid { grid-template-columns: 1fr !important; }
            .hero-calc { display: none !important; }
          }
        `}</style>
        <div
          className="hero-grid"
          style={{
            display:             "grid",
            gridTemplateColumns: "25% 75%",
            gap:                 "40px",
            alignItems:          "stretch",
            width:               "100%",
          }}
        >
          <HomeBanner />
          <div className="hero-calc" style={{ display: "contents" }}>
            <Calculator />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 2. Smartphones — вынесен в SmartphonesSection.tsx ─────── */


/* ── 5. About ────────────────────────────────────────────────── */
const ABOUT_DNA = [
  {
    icon: "☽",
    accent: "#C9A84C",
    label: "100% Халяль",
    desc:  "Договор купли-продажи, одобренный Шариатом.",
  },
  {
    icon: "🛡",
    accent: "#4ADE80",
    label: "0% скрытых комиссий",
    desc:  "Цена фиксируется в момент сделки. Без мелкого шрифта.",
  },
  {
    icon: "📋",
    accent: "#A78BFA",
    label: "Прозрачность",
    desc:  "Один договор, одна сумма. Вы знаете итог до подписания.",
  },
] as const;

function AboutSection() {
  return (
    <section
      className="py-16"
      style={{ background: "#0f172a" }}
    >
      <div className="section">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-4">
            О компании
          </p>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4 leading-tight">
            Finnice — честная рассрочка<br className="hidden sm:block" /> нового поколения
          </h2>
          <p className="text-white/50 text-base leading-relaxed max-w-xl mx-auto mb-8">
            Мы делаем современные гаджеты и услуги доступными без нарушения
            религиозных норм. Никакого риба — только фиксированная наценка
            по договору купли-продажи.
          </p>
          <Link
            href="/company/"
            className="inline-flex items-center gap-2 text-sm font-semibold
                       transition-colors"
            style={{ color: "#4ADE80" }}
          >
            Подробнее о компании →
          </Link>
        </div>

        {/* DNA cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {ABOUT_DNA.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl p-6 transition-all duration-300
                         hover:-translate-y-1 cursor-default"
              style={{
                background:     "rgba(255,255,255,0.04)",
                border:         "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(12px)",
              }}
            >
              <span
                className="text-xl w-9 h-9 rounded-xl flex items-center justify-center
                           font-semibold mb-4"
                style={{
                  background: `${card.accent}18`,
                  color:      card.accent,
                  border:     `1px solid ${card.accent}30`,
                }}
              >
                {card.icon}
              </span>
              <p className="font-bold text-white text-sm mb-1.5">{card.label}</p>
              <p className="text-white/45 text-xs leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 6. Blog ─────────────────────────────────────────────────── */
function BlogSection() {
  return (
    <section className="py-14">
      <div className="section">
        <div className="flex items-center justify-between mb-8 gap-4">
          <h2 className="text-3xl font-extrabold text-[#0A1628]">Блог</h2>
          <Link href="/blog/" className="text-sm font-semibold text-[#1A3C6E] hover:underline">
            Весь блог →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {BLOG.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}/`}
              className="card overflow-hidden hover:shadow-md transition-shadow group block"
            >
              {/* Cover image */}
              <div className="relative overflow-hidden" style={{ height: 160 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.coverImg}
                  alt={post.coverAlt}
                  className="w-full h-full object-cover group-hover:scale-105
                             transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px]
                                  font-bold bg-[#0A1628]/70 text-white backdrop-blur-sm">
                  {post.category}
                </span>
              </div>
              <div className="p-5">
                <span className="text-xs text-[#9CA3AF] font-medium">{post.date}</span>
                <h3 className="font-bold text-[#0A1628] text-base mt-1.5 mb-2 leading-snug
                               group-hover:text-[#1A3C6E] transition-colors">
                  {post.title}
                </h3>
                <p className="text-[#6B7280] text-sm leading-relaxed line-clamp-2">
                  {post.excerpt}
                </p>
                <span className="inline-block mt-3 text-xs font-semibold text-[#1A3C6E]">
                  Читать →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

