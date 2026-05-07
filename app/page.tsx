import Link from "next/link";
import { HeroSlider } from "@/components/HeroSlider";
import { Calculator } from "@/components/Calculator";
import { SmartphonesSection } from "@/components/SmartphonesSection";
import {
  CITIES, DISTRICTS,
  ABOUT, VALUES, BLOG_POSTS,
} from "@/lib/data";

export default function HomePage() {
  return (
    <main>
      <HeroSlider />
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
    <section className="py-10 bg-[#F4F7FC]">
      <div className="section">
        <Calculator />
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
function AboutSection() {
  return (
    <section className="py-14 bg-[#F4F7FC]">
      <div className="section">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-[#0A1628] mb-4">
              {ABOUT.heading}
            </h2>
            <p className="text-[#4B5563] leading-relaxed mb-3">{ABOUT.body1}</p>
            <p className="text-[#6B7280] text-sm leading-relaxed mb-6">{ABOUT.body2}</p>
            <Link href="/company/" className="btn-primary inline-flex">
              Подробнее о компании
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {VALUES.map((v) => (
              <div key={v.title} className="card p-5">
                <span className="text-2xl block mb-3">{v.icon}</span>
                <h3 className="font-bold text-[#0A1628] text-sm mb-1">{v.title}</h3>
                <p className="text-[#6B7280] text-xs leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
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
          {BLOG_POSTS.map((post) => (
            <Link
              key={post.href}
              href={post.href}
              className="card p-6 hover:shadow-md transition-shadow group block"
            >
              <span className="text-xs text-[#9CA3AF] font-medium">{post.date}</span>
              <h3 className="font-bold text-[#0A1628] text-base mt-2 mb-2 leading-snug
                             group-hover:text-[#1A3C6E] transition-colors">
                {post.title}
              </h3>
              <p className="text-[#6B7280] text-sm leading-relaxed line-clamp-2">{post.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

