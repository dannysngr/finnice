import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COMPANY } from "@/lib/data";
import { BLOG, getBlogPost, type ContentBlock } from "@/lib/blog-data";

/* ─── Static params ────────────────────────────────────────── */
export function generateStaticParams() {
  return BLOG.map((p) => ({ slug: p.slug }));
}

/* ─── Meta ──────────────────────────────────────────────────── */
export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const post = getBlogPost(params.slug);
  if (!post) return { title: "Статья не найдена" };
  return {
    title:       `${post.title} — ${COMPANY.name}`,
    description: post.excerpt,
    openGraph: {
      title:       post.title,
      description: post.excerpt,
      images:      [{ url: post.coverImg }],
    },
  };
}

/* ─── Page ──────────────────────────────────────────────────── */
export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getBlogPost(params.slug);
  if (!post) notFound();

  return (
    <main>
      {/* Breadcrumb */}
      <div className="bg-[#F4F7FC] border-b border-[#D8E2F0]">
        <div className="section py-3 text-xs text-[#9CA3AF] flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-[#1A3C6E] transition-colors">Главная</Link>
          <span>/</span>
          <Link href="/blog/" className="hover:text-[#1A3C6E] transition-colors">Блог</Link>
          <span>/</span>
          <span className="text-[#0A1628] line-clamp-1">{post.title}</span>
        </div>
      </div>

      {/* Hero cover */}
      <div className="relative w-full overflow-hidden"
           style={{ maxHeight: 480, background: "#000" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.coverImg}
          alt={post.coverAlt}
          className="w-full object-cover"
          style={{
            height: 480,
            objectPosition: "center 30%",
            opacity: 0.92,
          }}
        />
        {/* Bottom fade-to-dark for text readability */}
        <div className="absolute inset-0"
             style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.30) 50%, rgba(0,0,0,0.75) 100%)" }} />
        <div className="absolute bottom-0 left-0 right-0 section pb-8 pt-4">
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold
                           bg-white/20 text-white border border-white/30 mb-3
                           backdrop-blur-sm">
            {post.category}
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight
                         max-w-3xl drop-shadow-sm">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 mt-3 text-white/75 text-sm">
            <span>{post.date}</span>
            <span>·</span>
            <span>{post.readMin} мин. чтения</span>
          </div>
        </div>
      </div>

      {/* Article body */}
      <div className="section py-10">
        <div className="max-w-[740px] mx-auto">

          {/* Lead */}
          <p className="text-lg text-[#374151] leading-relaxed mb-8 font-medium border-l-4
                         border-[#0C7A58] pl-4">
            {post.excerpt}
          </p>

          {/* Content blocks */}
          <div className="space-y-5">
            {post.content.map((block, i) => (
              <ContentRenderer key={i} block={block} />
            ))}
          </div>

          {/* Divider */}
          <hr className="my-12 border-[#D8E2F0]" />

          {/* Back to blog */}
          <div className="flex items-center gap-4 flex-wrap">
            <Link
              href="/blog/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#1A3C6E]
                         hover:text-[#0C7A58] transition-colors"
            >
              ← Все статьи
            </Link>
            <span className="text-[#D8E2F0]">|</span>
            <span className="text-sm text-[#9CA3AF]">
              {COMPANY.name} · {COMPANY.city}
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ─── Content block renderer ────────────────────────────────── */
function ContentRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "h2":
      return (
        <h2 className="text-2xl font-extrabold text-[#0A1628] mt-10 mb-3 leading-snug">
          {block.text}
        </h2>
      );

    case "h3":
      return (
        <h3 className="text-lg font-bold text-[#0A1628] mt-6 mb-2">
          {block.text}
        </h3>
      );

    case "p":
      return (
        <p className="text-[#374151] leading-relaxed text-base">
          {block.text}
        </p>
      );

    case "ul":
      return (
        <ul className="space-y-2 pl-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-[#374151] leading-relaxed">
              <span className="mt-1.5 w-2 h-2 rounded-full bg-[#0C7A58] shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      );

    case "ol":
      return (
        <ol className="space-y-2 pl-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-[#374151] leading-relaxed">
              <span className="shrink-0 w-6 h-6 rounded-full bg-[#EBF0F9] text-[#1A3C6E]
                               flex items-center justify-center text-xs font-bold mt-0.5">
                {i + 1}
              </span>
              {item}
            </li>
          ))}
        </ol>
      );

    case "img":
      if (block.bg === "dark") {
        return (
          <figure className="my-8">
            <div className="rounded-2xl overflow-hidden"
                 style={{
                   background: "linear-gradient(145deg, #0a0a0a 0%, #111827 100%)",
                   boxShadow: "0 20px 60px rgba(0,0,0,0.35), 0 4px 16px rgba(0,0,0,0.25)",
                   padding: "32px 16px 24px",
                 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={block.src}
                alt={block.alt}
                className="w-full object-contain mx-auto"
                style={{ maxHeight: 360, filter: "drop-shadow(0 16px 32px rgba(0,0,0,0.6))" }}
              />
            </div>
            {block.caption && (
              <figcaption className="text-center text-xs text-[#6B7280] mt-3 italic">
                {block.caption}
              </figcaption>
            )}
          </figure>
        );
      }
      return (
        <figure className="my-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={block.src}
            alt={block.alt}
            className="w-full rounded-2xl object-cover shadow-sm"
            style={{ maxHeight: 420 }}
          />
          {block.caption && (
            <figcaption className="text-center text-xs text-[#9CA3AF] mt-2">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );

    case "callout":
      return (
        <div className="flex items-start gap-3 rounded-2xl border border-[#D8E2F0]
                        bg-[#F4F7FC] px-5 py-4 my-2">
          <span className="text-2xl shrink-0 mt-0.5">{block.icon}</span>
          <p className="text-[#374151] leading-relaxed text-sm">{block.text}</p>
        </div>
      );

    case "highlight":
      return (
        <div className="my-6 rounded-2xl px-6 py-5"
             style={{
               background: "linear-gradient(135deg, #0E2344 0%, #1A3C6E 100%)",
               boxShadow: "0 4px 24px rgba(14,35,68,0.18)",
             }}>
          <p className="font-extrabold text-lg text-white leading-snug">
            {block.text}
          </p>
        </div>
      );

    case "cta":
      return (
        <div className="mt-10 rounded-2xl p-6 sm:p-8 text-center"
             style={{
               background: "linear-gradient(135deg, #0E2344 0%, #1E4582 55%, #0C7A58 100%)",
               boxShadow:  "0 8px 32px rgba(14,35,68,0.18)",
             }}>
          <p className="text-white/80 text-sm mb-1">Готовы к покупке?</p>
          <h3 className="text-white font-extrabold text-xl mb-4">
            Рассчитайте свою рассрочку прямо сейчас
          </h3>
          <p className="text-white/65 text-sm mb-6 max-w-md mx-auto">
            Без банка, без процентов. Фиксированная наценка, прозрачный договор.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/#calculator"
              className="px-8 py-3 bg-white text-[#0A1628] font-extrabold text-sm
                         rounded-full hover:bg-white/90 transition-all shadow-md"
            >
              Открыть калькулятор
            </Link>
            <Link
              href="/catalog/"
              className="px-8 py-3 bg-white/15 border border-white/30 text-white
                         font-semibold text-sm rounded-full hover:bg-white/25 transition-all"
            >
              Перейти в каталог
            </Link>
          </div>
        </div>
      );

    default:
      return null;
  }
}
