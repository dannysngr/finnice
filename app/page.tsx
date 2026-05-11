import Link from "next/link";
// HeroSlider скрыт — калькулятор поднят в самый верх
// import { HeroSlider } from "@/components/HeroSlider";
import { Calculator } from "@/components/Calculator";
import { SmartphonesSection } from "@/components/SmartphonesSection";
import {
  CITIES, DISTRICTS,
} from "@/lib/data";
import { BLOG } from "@/lib/blog-data";

/* ── Banner helpers ──────────────────────────────────────────── */
function PhoneIllustration() {
  return (
    <div className="relative" style={{ width: 64, height: 110 }}>
      {/* Body */}
      <div
        className="absolute inset-0"
        style={{
          borderRadius: 22,
          background: "linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)",
          boxShadow: "10px 14px 40px rgba(0,0,0,0.30), -3px -3px 10px rgba(255,255,255,0.08)",
        }}
      />
      {/* Screen */}
      <div
        className="absolute overflow-hidden"
        style={{
          top: 9, left: 5, right: 5, bottom: 9,
          borderRadius: 16,
          background: "linear-gradient(160deg, #0C7A58 0%, #1A3C6E 100%)",
        }}
      >
        <div className="p-2 pt-4 space-y-1.5">
          <div className="h-1.5 w-11 rounded-full" style={{ background: "rgba(255,255,255,0.45)" }} />
          <div className="h-1.5 w-7  rounded-full" style={{ background: "rgba(255,255,255,0.25)" }} />
          <div className="mt-2 grid grid-cols-2 gap-1">
            {[0,1,2,3].map(i => (
              <div key={i} className="rounded-lg h-8" style={{ background: "rgba(255,255,255,0.11)" }} />
            ))}
          </div>
          <div className="rounded-lg h-9" style={{ background: "rgba(255,255,255,0.07)" }} />
        </div>
      </div>
      {/* Notch */}
      <div
        className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full"
        style={{ width: 20, height: 5, background: "#0d0d1f" }}
      />
    </div>
  );
}

function BannerCard() {
  return (
    <div
      className="rounded-2xl relative overflow-hidden"
      style={{
        background:     "linear-gradient(145deg, #EFE5FF 0%, #FFD6EC 100%)",
        height:         "100%",
        minHeight:      "100%",
        width:          "100%",
        display:        "flex",
        flexDirection:  "column",
        justifyContent: "center",
        gap:            "12px",
        padding:        "22px",
        alignSelf:      "stretch",
      }}
    >
      {/* Decorative blobs */}
      <div
        className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, #C084FC55, transparent 70%)" }}
      />
      <div
        className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, #F472B640, transparent 70%)" }}
      />

      {/* Badge */}
      <div className="relative z-10">
        <span
          className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold mb-4"
          style={{ background: "rgba(0,0,0,0.08)", color: "#2d1a4a" }}
        >
          Халяль · Без риба · Мурабаха
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-[#0A0A0A] leading-tight mb-1.5">
          Покупай сейчас —<br />плати потом
        </h2>
        <p className="text-[#5a4a6a] text-xs leading-relaxed max-w-[220px]">
          Телефоны, техника и услуги — в рассрочку без процентов
        </p>
      </div>

      {/* Phone + floating chips */}
      <div className="relative z-10 flex items-center justify-center py-1">
        <div className="relative">
          <PhoneIllustration />
          {/* Floating price chip */}
          <div
            className="absolute -right-10 top-2 px-2 py-1 rounded-lg text-[9px] font-bold
                         whitespace-nowrap shadow-md"
            style={{
              background: "#fff",
              color: "#0A1628",
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            }}
          >
            3&nbsp;490 ₽/мес
          </div>
          {/* Floating months chip */}
          <div
            className="absolute -left-8 bottom-4 px-2 py-1 rounded-lg text-[9px] font-bold
                         whitespace-nowrap shadow-md"
            style={{
              background: "#0C7A58",
              color: "#fff",
              boxShadow: "0 4px 16px rgba(12,122,88,0.35)",
            }}
          >
            до 12 мес
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="relative z-10">
        <Link
          href="/catalog/"
          className="flex items-center justify-center w-full py-2.5 rounded-full font-bold
                     text-xs text-white transition-all hover:opacity-85 active:scale-[.98]"
          style={{ background: "#0A0A0A" }}
        >
          В каталог →
        </Link>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main>
      <CalculatorSection />
      <SmartphonesSection />
      <LocationSection />
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
          <BannerCard />
          <div className="hero-calc" style={{ display: "contents" }}>
            <Calculator />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 2. Smartphones — вынесен в SmartphonesSection.tsx ─────── */

/* ── 4. Location coverage ────────────────────────────────────── */
function LocationSection() {
  return (
    <section className="py-14">
      <div className="section">
        <h2 className="text-3xl font-extrabold text-[#0A1628] mb-1">
          Рассрочка по районам
        </h2>
        <p className="text-[#9CA3AF] text-sm mb-8">(на стадии наполнения)</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <TagCloud label="🏙 Города" items={CITIES} base="/catalog/?city=" />
          <TagCloud label="🗺 Районы" items={DISTRICTS} base="/catalog/?district=" />
        </div>
      </div>
    </section>
  );
}

function TagCloud({
  label, items, base,
}: {
  label: string;
  items: ReadonlyArray<string>;
  base: string;
}) {
  return (
    <div>
      <h3 className="font-semibold text-[#0A1628] mb-4">{label}</h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Link
            key={item}
            href={`${base}${encodeURIComponent(item)}`}
            className="px-4 py-2 bg-[#F4F7FC] border border-[#D8E2F0] rounded-full text-sm
                       text-[#4B5563] hover:text-[#1A3C6E] hover:border-[#1A3C6E]/40
                       hover:bg-[#EBF0F9] transition-colors"
          >
            {item}
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ── 5. About ────────────────────────────────────────────────── */
const ABOUT_DNA = [
  {
    icon: "☽",
    accent: "#C9A84C",
    label: "100% Халяль",
    desc:  "Мурабаха — договор купли-продажи, одобренный Шариатом.",
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
            религиозных норм. Никаких процентов — только фиксированная наценка
            по договору Мурабаха.
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

