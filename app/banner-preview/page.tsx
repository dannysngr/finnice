/**
 * /banner-preview — витрина вариантов главного баннера.
 * V1 (текущий, Aurora + Halal Star) + 4 финтех-альтернативы.
 * noindex/nofollow — это служебная страница для дизайн-ревью.
 */
import Link from "next/link";
import { HomeBanner } from "@/components/HomeBanner";

export const metadata = {
  title: "Варианты баннера — Финнайс",
  robots: { index: false, follow: false },
};

export default function BannerPreviewPage() {
  return (
    <main className="min-h-screen py-10 px-4 sm:px-6" style={{ background: "#F4F7FC" }}>
      <div className="max-w-[1400px] mx-auto">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "#03101F" }}>
          Варианты баннера
        </h1>
        <p className="text-sm text-gray-600 mb-8 max-w-2xl">
          5 версий главного баннера: текущий (Aurora + Halal Star) и 4 финтех-альтернативы.
          Каждый отрисован в реальном размере колонки на главной (~280 × 480 px).
        </p>

        <div
          className="grid gap-6"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          }}
        >
          <Slot
            label="V1 · Aurora + Halal Star"
            tag="current"
            desc="Тёмный изумруд с золотом, исламская звезда + плавающие чипы"
          >
            <HomeBanner />
          </Slot>
          <Slot
            label="V2 · Neo-bank Mesh"
            desc="Шифт-меш с виолетом/маджентой/тилом, big-type типографика"
          >
            <BannerV2 />
          </Slot>
          <Slot
            label="V3 · Holographic Card"
            desc="Голографическая карта с conic-gradient и шиммером"
          >
            <BannerV3 />
          </Slot>
          <Slot
            label="V4 · Iso-stack Cards"
            desc="3D-стек платежей: 3 карточки с месяцами 1/2/3"
          >
            <BannerV4 />
          </Slot>
          <Slot
            label="V5 · Bento Grid"
            desc="Bento-сетка из мини-карточек с фактами/иконками"
          >
            <BannerV5 />
          </Slot>

          <Slot label="V6 · Liquid Morph" desc="SVG goo-filter, ртутно-золотой blob морфит вечно">
            <BannerV6 />
          </Slot>
          <Slot label="V7 · Neon Brutalist" desc="Чёрный + неоновый лайм/маджента, моноширинный big-type">
            <BannerV7 />
          </Slot>
          <Slot label="V8 · Coin Pyramid" desc="Стопка золотых монет с 3D-наклоном, очень halal-vibe">
            <BannerV8 />
          </Slot>
          <Slot label="V9 · Digit Counter" desc="Бесконечно крутящиеся цифры как одометр / стоп-таймер">
            <BannerV9 />
          </Slot>
          <Slot label="V10 · Stripe-style Mesh" desc="Многоцветный mesh из Stripe.com + парящие фигуры">
            <BannerV10 />
          </Slot>
          <Slot label="V11 · Glass Stack" desc="5 стеклянных слоёв в перспективе — Apple Vision Pro vibe">
            <BannerV11 />
          </Slot>
          <Slot label="V12 · Constellation" desc="Точки и линии соединяются в звезду, ночное небо">
            <BannerV12 />
          </Slot>
          <Slot label="V13 · Aurora Borealis" desc="Вертикальные северные сияния — cyan/magenta/lime">
            <BannerV13 />
          </Slot>
          <Slot label="V14 · Card Fan" desc="3 карточки веером с глассморфизмом, lifestyle-fintech">
            <BannerV14 />
          </Slot>
          <Slot label="V15 · Marquee Ticker" desc="Стоп-таймер: цифры бегут вверх как тикер на бирже">
            <BannerV15 />
          </Slot>
        </div>
      </div>
    </main>
  );
}

function Slot({
  label, desc, tag, children,
}: {
  label: string; desc: string; tag?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className="text-xs font-bold" style={{ color: "#03101F" }}>{label}</span>
        {tag && (
          <span
            className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded font-semibold"
            style={{ background: "#0C7A58", color: "#EDE7DA" }}
          >
            {tag}
          </span>
        )}
      </div>
      <p className="text-[11px] text-gray-500 mb-2 px-1 leading-snug min-h-[28px]">{desc}</p>
      <div style={{ height: 480 }}>
        {children}
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════════
 * V2 · Neo-bank Mesh — Revolut/Mercury vibe
 * Animated multi-colour mesh + большой типограф «3 490 ₽»
 * ═══════════════════════════════════════════════════════════════════════════ */
function BannerV2() {
  return (
    <div
      className="relative rounded-2xl overflow-hidden flex flex-col justify-between v2-card"
      style={{
        height: "100%",
        padding: "22px",
        background: "#0B0B14",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 30px 80px -20px rgba(0,0,0,0.55)",
      }}
    >
      {/* Mesh blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="v2-mesh v2-mesh-a" />
        <div className="v2-mesh v2-mesh-b" />
        <div className="v2-mesh v2-mesh-c" />
        <div className="v2-mesh v2-mesh-d" />
      </div>
      {/* Грейн-шум через CSS-маску точек */}
      <div
        className="absolute inset-0 pointer-events-none v2-grain"
        aria-hidden
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }}
      />

      {/* Top: badge */}
      <div className="relative z-10">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold"
          style={{
            background: "rgba(255,255,255,0.08)",
            color: "#FFF",
            border: "1px solid rgba(255,255,255,0.14)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <span className="v2-dot" />
          Халяль · 0% риба
        </span>
      </div>

      {/* Middle: HUGE price */}
      <div className="relative z-10 my-2">
        <div className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>
          от
        </div>
        <div className="v2-price" style={{ color: "#FFF" }}>
          3&nbsp;490<span className="v2-rub">&nbsp;₽</span>
        </div>
        <div className="text-xs font-medium mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>
          / мес · до 12 месяцев
        </div>
      </div>

      {/* Bottom: heading + CTA */}
      <div className="relative z-10">
        <h2 className="text-sm font-semibold mb-3 leading-tight" style={{ color: "rgba(255,255,255,0.85)" }}>
          Бери сегодня —<br />плати потом
        </h2>
        <Link
          href="/catalog/"
          className="block w-full text-center py-2.5 rounded-full text-xs font-bold transition-all hover:opacity-90 active:scale-[.98]"
          style={{
            background: "#FFF",
            color: "#0B0B14",
            boxShadow: "0 8px 24px rgba(255,255,255,0.18)",
          }}
        >
          В каталог →
        </Link>
      </div>

      <style>{`
        .v2-mesh {
          position: absolute;
          border-radius: 50%;
          filter: blur(50px);
          mix-blend-mode: screen;
          opacity: 0.85;
          will-change: transform;
        }
        .v2-mesh-a { width: 220px; height: 220px; top: -40px; left: -30px;
          background: radial-gradient(circle, #7A3CFF, transparent 70%);
          animation: v2MeshA 16s ease-in-out infinite;
        }
        .v2-mesh-b { width: 180px; height: 180px; top: 30%; right: -50px;
          background: radial-gradient(circle, #FF3CC8, transparent 70%);
          animation: v2MeshB 13s ease-in-out infinite;
        }
        .v2-mesh-c { width: 200px; height: 200px; bottom: -50px; left: 20%;
          background: radial-gradient(circle, #00C8C8, transparent 70%);
          animation: v2MeshC 18s ease-in-out infinite;
        }
        .v2-mesh-d { width: 140px; height: 140px; top: 45%; left: 35%;
          background: radial-gradient(circle, #3C78FF, transparent 70%);
          animation: v2MeshD 11s ease-in-out infinite;
        }
        @keyframes v2MeshA { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(40px,30px) scale(1.15);} }
        @keyframes v2MeshB { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(-50px,20px) scale(1.10);} }
        @keyframes v2MeshC { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(30px,-40px) scale(1.20);} }
        @keyframes v2MeshD { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(-25px,15px) scale(0.85);} }

        .v2-grain { opacity: 0.5; }

        .v2-price {
          font-size: 44px;
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1;
          font-feature-settings: "tnum";
        }
        .v2-rub { font-weight: 600; opacity: 0.85; }
        .v2-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #00FF94;
          box-shadow: 0 0 6px #00FF94;
          animation: v2Pulse 1.6s ease-out infinite;
        }
        @keyframes v2Pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(0,255,148,0.7), 0 0 6px #00FF94; }
          70%     { box-shadow: 0 0 0 8px rgba(0,255,148,0), 0 0 6px #00FF94; }
        }
        @media (prefers-reduced-motion: reduce) {
          .v2-mesh, .v2-dot { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════════
 * V3 · Holographic Card — голограмма с conic-gradient
 * ═══════════════════════════════════════════════════════════════════════════ */
function BannerV3() {
  return (
    <div
      className="relative rounded-2xl overflow-hidden flex flex-col justify-between v3-card"
      style={{
        height: "100%",
        padding: "22px",
        background: "radial-gradient(ellipse at 50% 0%, #15151F 0%, #08080F 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 30px 80px -20px rgba(0,0,0,0.6)",
      }}
    >
      {/* Звёзды/искорки фон */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <span className="v3-star" style={{ top: "12%", left: "20%" }} />
        <span className="v3-star v3-star-d2" style={{ top: "30%", right: "18%" }} />
        <span className="v3-star v3-star-d3" style={{ bottom: "40%", left: "10%" }} />
        <span className="v3-star v3-star-d4" style={{ bottom: "20%", right: "12%" }} />
        <span className="v3-star v3-star-d5" style={{ top: "65%", left: "55%" }} />
      </div>

      {/* Heading */}
      <div className="relative z-10">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold mb-3"
          style={{
            background: "rgba(255,255,255,0.08)",
            color: "#FFF",
            border: "1px solid rgba(255,255,255,0.14)",
          }}
        >
          ✦ Халяльная рассрочка
        </span>
        <h2 className="text-lg font-bold leading-tight" style={{ color: "#FFF" }}>
          Бери сегодня —<br />плати потом
        </h2>
      </div>

      {/* Holographic card в центре */}
      <div className="relative z-10 flex items-center justify-center py-2">
        <div className="v3-card-wrap">
          <div className="v3-holo-card">
            {/* Подсветка ободка */}
            <div className="v3-holo-rim" aria-hidden />
            {/* Чип */}
            <div className="v3-chip" aria-hidden>
              <div className="v3-chip-line" />
              <div className="v3-chip-line" />
              <div className="v3-chip-line" />
            </div>
            {/* Wordmark */}
            <div className="v3-word">finnice</div>
            {/* Mock-номер */}
            <div className="v3-num">•••• 9 490 ₽/мес</div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="relative z-10">
        <Link
          href="/catalog/"
          className="block w-full text-center py-2.5 rounded-full text-xs font-bold transition-all hover:opacity-90 active:scale-[.98]"
          style={{
            background: "linear-gradient(135deg, #FFFFFF 0%, #E8DEFF 100%)",
            color: "#15151F",
            boxShadow: "0 8px 24px rgba(122,60,255,0.35)",
          }}
        >
          В каталог →
        </Link>
      </div>

      <style>{`
        .v3-card-wrap {
          width: 200px; height: 130px;
          perspective: 800px;
        }
        .v3-holo-card {
          position: relative;
          width: 100%; height: 100%;
          border-radius: 14px;
          padding: 12px;
          background:
            conic-gradient(from 0deg at 50% 50%,
              #FF3CC8, #7A3CFF, #00C8FF, #00FF94, #FFD63C, #FF3CC8);
          background-size: 200% 200%;
          background-position: 0% 0%;
          animation: v3Holo 6s linear infinite, v3Tilt 7s ease-in-out infinite;
          transform-style: preserve-3d;
          box-shadow:
            0 20px 40px -10px rgba(122,60,255,0.5),
            0 0 30px rgba(255,60,200,0.25),
            inset 0 1px 0 rgba(255,255,255,0.4);
          overflow: hidden;
        }
        .v3-holo-rim {
          position: absolute;
          inset: 1px;
          border-radius: 13px;
          background: linear-gradient(135deg, rgba(255,255,255,0.20), rgba(255,255,255,0.04) 40%, rgba(0,0,0,0.18));
          pointer-events: none;
        }
        .v3-chip {
          position: absolute;
          top: 14px; left: 14px;
          width: 28px; height: 22px;
          border-radius: 5px;
          background: linear-gradient(135deg, #FFE08A, #C9A84C);
          display: flex; flex-direction: column; justify-content: center; gap: 3px;
          padding: 0 4px;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.4);
        }
        .v3-chip-line {
          height: 1.5px; background: rgba(0,0,0,0.45); border-radius: 999px;
        }
        .v3-word {
          position: absolute;
          top: 14px; right: 14px;
          font-size: 11px; font-weight: 800; letter-spacing: 0.1em;
          color: #FFF; text-shadow: 0 1px 4px rgba(0,0,0,0.4);
        }
        .v3-num {
          position: absolute;
          bottom: 14px; left: 14px;
          font-size: 12px; font-weight: 700; letter-spacing: 0.05em;
          color: #FFF; text-shadow: 0 1px 4px rgba(0,0,0,0.45);
          font-family: ui-monospace, monospace;
        }

        @keyframes v3Holo {
          0%   { background-position: 0% 50%;  }
          50%  { background-position: 100% 50%;}
          100% { background-position: 0% 50%;  }
        }
        @keyframes v3Tilt {
          0%,100% { transform: rotateY(-8deg) rotateX(4deg); }
          50%     { transform: rotateY(8deg)  rotateX(-4deg);}
        }

        .v3-star {
          position: absolute;
          width: 2px; height: 2px;
          background: #FFF;
          border-radius: 50%;
          box-shadow: 0 0 6px #FFF;
          animation: v3Twinkle 2.4s ease-in-out infinite;
        }
        .v3-star-d2 { animation-delay: 0.6s; }
        .v3-star-d3 { animation-delay: 1.0s; }
        .v3-star-d4 { animation-delay: 1.6s; }
        .v3-star-d5 { animation-delay: 0.3s; }
        @keyframes v3Twinkle {
          0%,100% { opacity: 0.2; transform: scale(0.8); }
          50%     { opacity: 1;   transform: scale(1.3); }
        }

        @media (prefers-reduced-motion: reduce) {
          .v3-holo-card { animation: none !important; transform: rotateY(-6deg) rotateX(2deg); }
          .v3-star { animation: none !important; opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════════
 * V4 · Iso-stack — 3D-стек платежей-карточек
 * ═══════════════════════════════════════════════════════════════════════════ */
function BannerV4() {
  return (
    <div
      className="relative rounded-2xl overflow-hidden flex flex-col justify-between v4-card"
      style={{
        height: "100%",
        padding: "22px",
        background: "linear-gradient(160deg, #0B1F3A 0%, #112C5C 60%, #1A4A8A 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 30px 80px -20px rgba(0,0,0,0.5)",
      }}
    >
      {/* Сетка фона */}
      <div className="absolute inset-0 pointer-events-none v4-grid" aria-hidden />

      {/* Top */}
      <div className="relative z-10">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold"
          style={{
            background: "rgba(255,255,255,0.10)",
            color: "#FFF",
            border: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          ⊕ До 12 платежей
        </span>
        <h2 className="text-lg font-bold leading-tight mt-3" style={{ color: "#FFF" }}>
          Разбей покупку<br />на удобные части
        </h2>
      </div>

      {/* 3D iso-stack */}
      <div className="relative z-10 flex items-center justify-center py-2 v4-stage">
        <div className="v4-iso">
          <div className="v4-card-iso v4-iso-1">
            <div className="v4-iso-label">1</div>
            <div className="v4-iso-amt">3 490 ₽</div>
          </div>
          <div className="v4-card-iso v4-iso-2">
            <div className="v4-iso-label">2</div>
            <div className="v4-iso-amt">3 490 ₽</div>
          </div>
          <div className="v4-card-iso v4-iso-3">
            <div className="v4-iso-label">3</div>
            <div className="v4-iso-amt">3 490 ₽</div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="relative z-10">
        <Link
          href="/catalog/"
          className="block w-full text-center py-2.5 rounded-full text-xs font-bold transition-all hover:opacity-90 active:scale-[.98]"
          style={{
            background: "linear-gradient(135deg, #59E0FF 0%, #4A9CFF 100%)",
            color: "#0B1F3A",
            boxShadow: "0 8px 24px rgba(74,156,255,0.5)",
          }}
        >
          В каталог →
        </Link>
      </div>

      <style>{`
        .v4-grid {
          background-image:
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 20px 20px;
          mask-image: radial-gradient(ellipse at 50% 60%, #000 30%, transparent 75%);
        }
        .v4-stage {
          perspective: 900px;
        }
        .v4-iso {
          position: relative;
          width: 180px; height: 130px;
          transform-style: preserve-3d;
          animation: v4Tilt 8s ease-in-out infinite;
        }
        .v4-card-iso {
          position: absolute;
          width: 150px; height: 90px;
          border-radius: 12px;
          padding: 12px;
          background: linear-gradient(135deg, #FFFFFF 0%, #D8E8FF 100%);
          color: #0B1F3A;
          box-shadow:
            0 14px 28px -8px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(255,255,255,0.7);
          transform-style: preserve-3d;
          display: flex; flex-direction: column; justify-content: space-between;
        }
        .v4-iso-1 {
          top: 0; left: 0;
          transform: translate3d(-22px, -16px, 30px) rotateX(45deg) rotateZ(-20deg);
          background: linear-gradient(135deg, #59E0FF 0%, #4A9CFF 100%);
          color: #FFF;
          z-index: 3;
          animation: v4Float1 4.5s ease-in-out infinite;
        }
        .v4-iso-2 {
          top: 20px; left: 15px;
          transform: translate3d(0, 0, 0) rotateX(45deg) rotateZ(-20deg);
          z-index: 2;
          animation: v4Float2 5.2s ease-in-out infinite;
          opacity: 0.92;
        }
        .v4-iso-3 {
          top: 40px; left: 30px;
          transform: translate3d(22px, 16px, -30px) rotateX(45deg) rotateZ(-20deg);
          z-index: 1;
          opacity: 0.75;
          animation: v4Float3 6s ease-in-out infinite;
        }
        .v4-iso-label {
          font-size: 22px; font-weight: 800; line-height: 1;
        }
        .v4-iso-amt {
          font-size: 11px; font-weight: 700; opacity: 0.9;
        }
        @keyframes v4Tilt {
          0%,100% { transform: rotateX(0) rotateY(0); }
          50%     { transform: rotateX(2deg) rotateY(-4deg); }
        }
        @keyframes v4Float1 {
          0%,100% { transform: translate3d(-22px, -16px, 30px) rotateX(45deg) rotateZ(-20deg); }
          50%     { transform: translate3d(-22px, -22px, 36px) rotateX(45deg) rotateZ(-20deg); }
        }
        @keyframes v4Float2 {
          0%,100% { transform: translate3d(0,0,0) rotateX(45deg) rotateZ(-20deg); }
          50%     { transform: translate3d(0,-4px,4px) rotateX(45deg) rotateZ(-20deg); }
        }
        @keyframes v4Float3 {
          0%,100% { transform: translate3d(22px,16px,-30px) rotateX(45deg) rotateZ(-20deg); }
          50%     { transform: translate3d(22px,12px,-26px) rotateX(45deg) rotateZ(-20deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .v4-iso, .v4-iso-1, .v4-iso-2, .v4-iso-3 { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════════
 * V5 · Bento Grid — современная финтех-сетка с фактами
 * ═══════════════════════════════════════════════════════════════════════════ */
function BannerV5() {
  return (
    <div
      className="relative rounded-2xl overflow-hidden flex flex-col v5-card"
      style={{
        height: "100%",
        padding: "18px",
        background: "linear-gradient(160deg, #0F0F12 0%, #1A1A22 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 30px 80px -20px rgba(0,0,0,0.6)",
      }}
    >
      {/* Subtle radial */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background: "radial-gradient(ellipse at 70% 10%, rgba(95,201,167,0.18), transparent 55%)",
        }}
      />

      {/* Heading top */}
      <div className="relative z-10 mb-3">
        <h2 className="text-base font-bold leading-tight" style={{ color: "#FFF" }}>
          Халяльная<br />рассрочка
        </h2>
      </div>

      {/* Bento grid 2×2 */}
      <div
        className="relative z-10 flex-1 grid gap-2"
        style={{ gridTemplateColumns: "1.2fr 1fr", gridTemplateRows: "1fr 1fr 1fr" }}
      >
        {/* Big cell: цена */}
        <div className="v5-cell v5-cell-hero" style={{ gridRow: "span 2" }}>
          <div className="text-[10px] font-semibold uppercase tracking-wider opacity-70 mb-1">от</div>
          <div className="v5-price">
            3 490<span style={{ fontWeight: 500, opacity: 0.7 }}> ₽</span>
          </div>
          <div className="text-[10px] font-bold opacity-80 mt-0.5">в месяц</div>
        </div>

        {/* Months */}
        <div className="v5-cell v5-cell-months">
          <div className="text-[26px] font-extrabold leading-none">12</div>
          <div className="text-[10px] font-bold opacity-70 mt-1">месяцев</div>
        </div>

        {/* Halal */}
        <div className="v5-cell v5-cell-halal">
          <div className="text-[18px]">☽</div>
          <div className="text-[10px] font-bold mt-1">100% Халяль</div>
        </div>

        {/* Wide cell: 0% riba */}
        <div className="v5-cell v5-cell-zero" style={{ gridColumn: "span 2" }}>
          <span className="v5-zero">0%</span>
          <span className="text-[10px] font-semibold opacity-80">переплат · без штрафов и риба</span>
        </div>
      </div>

      {/* CTA */}
      <div className="relative z-10 mt-3">
        <Link
          href="/catalog/"
          className="block w-full text-center py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[.98]"
          style={{
            background: "linear-gradient(135deg, #5FC9A7 0%, #3A8F7A 100%)",
            color: "#FFF",
            boxShadow: "0 8px 24px rgba(95,201,167,0.35)",
          }}
        >
          В каталог →
        </Link>
      </div>

      <style>{`
        .v5-cell {
          position: relative;
          border-radius: 12px;
          padding: 10px 12px;
          background: linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
          border: 1px solid rgba(255,255,255,0.08);
          color: #FFF;
          display: flex; flex-direction: column; justify-content: center;
          overflow: hidden;
          transition: transform .3s ease, border-color .3s ease;
        }
        .v5-cell:hover { transform: translateY(-2px); border-color: rgba(255,255,255,0.16); }

        .v5-cell-hero {
          background: linear-gradient(135deg, rgba(95,201,167,0.22), rgba(95,201,167,0.06));
          border-color: rgba(95,201,167,0.30);
        }
        .v5-price {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1;
          font-feature-settings: "tnum";
        }

        .v5-cell-months {
          background: linear-gradient(135deg, rgba(122,60,255,0.20), rgba(122,60,255,0.04));
          border-color: rgba(122,60,255,0.30);
        }
        .v5-cell-halal {
          background: linear-gradient(135deg, rgba(201,168,76,0.22), rgba(201,168,76,0.04));
          border-color: rgba(201,168,76,0.32);
          color: #FFE39C;
        }
        .v5-cell-zero {
          flex-direction: row; align-items: center; gap: 10px;
          background: linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02));
        }
        .v5-zero {
          font-size: 24px; font-weight: 800;
          background: linear-gradient(135deg, #5FC9A7, #59E0FF);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.03em;
        }
      `}</style>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════════
 * V6 · Liquid Morph — SVG goo-filter, ртутно-золотой blob
 * ═══════════════════════════════════════════════════════════════════════════ */
function BannerV6() {
  return (
    <div
      className="relative rounded-2xl overflow-hidden flex flex-col justify-between"
      style={{
        height: "100%",
        padding: "22px",
        background: "linear-gradient(160deg, #0A1410 0%, #0C2A1F 100%)",
        border: "1px solid rgba(201,168,76,0.18)",
        boxShadow: "0 30px 80px -20px rgba(0,0,0,0.6)",
      }}
    >
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <filter id="v6-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" />
            <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10" />
          </filter>
          <linearGradient id="v6-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFE39C" />
            <stop offset="60%" stopColor="#C9A84C" />
            <stop offset="100%" stopColor="#5FC9A7" />
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute inset-0 pointer-events-none flex items-center justify-center" aria-hidden>
        <svg width="280" height="280" style={{ filter: "url(#v6-goo)" }}>
          <circle cx="140" cy="140" r="46" fill="url(#v6-grad)" className="v6-b1" />
          <circle cx="140" cy="140" r="36" fill="url(#v6-grad)" className="v6-b2" />
          <circle cx="140" cy="140" r="30" fill="url(#v6-grad)" className="v6-b3" />
          <circle cx="140" cy="140" r="24" fill="url(#v6-grad)" className="v6-b4" />
        </svg>
      </div>

      <div className="relative z-10">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold"
          style={{ background: "rgba(201,168,76,0.14)", color: "#FFE39C", border: "1px solid rgba(201,168,76,0.32)" }}>
          ⚭ Халяльная рассрочка
        </span>
        <h2 className="text-lg font-bold leading-tight mt-3" style={{ color: "#FFF" }}>
          Жидкое<br />золото финансов
        </h2>
      </div>

      <div className="relative z-10">
        <Link href="/catalog/"
          className="block w-full text-center py-2.5 rounded-full text-xs font-bold transition-all hover:opacity-90 active:scale-[.98]"
          style={{
            background: "linear-gradient(135deg, #FFE39C 0%, #C9A84C 100%)",
            color: "#0A1410",
            boxShadow: "0 8px 24px rgba(201,168,76,0.40)",
          }}
        >
          В каталог →
        </Link>
      </div>

      <style>{`
        .v6-b1 { animation: v6m1 7s ease-in-out infinite; transform-origin: 140px 140px; }
        .v6-b2 { animation: v6m2 5s ease-in-out infinite; transform-origin: 140px 140px; }
        .v6-b3 { animation: v6m3 6s ease-in-out infinite; transform-origin: 140px 140px; }
        .v6-b4 { animation: v6m4 8s ease-in-out infinite; transform-origin: 140px 140px; }
        @keyframes v6m1 { 0%,100%{transform:translate(0,0);} 50%{transform:translate(50px,-30px);} }
        @keyframes v6m2 { 0%,100%{transform:translate(0,0);} 50%{transform:translate(-45px,35px);} }
        @keyframes v6m3 { 0%,100%{transform:translate(0,0);} 50%{transform:translate(40px,40px);} }
        @keyframes v6m4 { 0%,100%{transform:translate(0,0);} 50%{transform:translate(-30px,-40px);} }
        @media (prefers-reduced-motion: reduce) {
          .v6-b1, .v6-b2, .v6-b3, .v6-b4 { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════════
 * V7 · Neon Brutalist — чёрный фон, неоновый лайм, моноширинный
 * ═══════════════════════════════════════════════════════════════════════════ */
function BannerV7() {
  return (
    <div
      className="relative rounded-2xl overflow-hidden flex flex-col justify-between"
      style={{
        height: "100%",
        padding: "22px",
        background: "#000",
        border: "1px solid #1A1A1A",
        boxShadow: "0 30px 80px -20px rgba(0,255,148,0.10)",
        fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
      }}
    >
      {/* Grid lines */}
      <div className="absolute inset-0 pointer-events-none v7-grid" aria-hidden />
      {/* Scanline */}
      <div className="absolute inset-0 pointer-events-none v7-scan" aria-hidden />

      <div className="relative z-10">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: "#00FF94" }}>
          <span className="v7-blink">●</span> halal_finance.exe
        </div>
        <div className="text-[10px]" style={{ color: "#5A5A5A" }}>{"> calculate_monthly()"}</div>
      </div>

      <div className="relative z-10">
        <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#5A5A5A" }}>monthly =</div>
        <div className="v7-big" style={{ color: "#00FF94" }}>
          3490<span style={{ color: "#FFF", fontWeight: 400 }}>₽</span>
        </div>
        <div className="text-[10px] mt-2" style={{ color: "#5A5A5A" }}>
          term: <span style={{ color: "#FF3CC8" }}>12</span> · interest: <span style={{ color: "#FF3CC8" }}>0%</span>
        </div>
      </div>

      <div className="relative z-10">
        <Link href="/catalog/"
          className="block w-full text-center py-2.5 rounded-md text-xs font-bold transition-all hover:opacity-90"
          style={{
            background: "transparent",
            color: "#00FF94",
            border: "2px solid #00FF94",
            boxShadow: "0 0 20px rgba(0,255,148,0.35), inset 0 0 12px rgba(0,255,148,0.10)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          → run_catalog
        </Link>
      </div>

      <style>{`
        .v7-grid {
          background-image:
            linear-gradient(rgba(0,255,148,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,148,0.05) 1px, transparent 1px);
          background-size: 18px 18px;
        }
        .v7-scan {
          background: repeating-linear-gradient(0deg, rgba(0,255,148,0.04) 0 1px, transparent 1px 4px);
          animation: v7Scan 6s linear infinite;
        }
        @keyframes v7Scan { from {background-position-y:0;} to {background-position-y:200px;} }
        .v7-big {
          font-size: 56px; font-weight: 800; line-height: 1;
          letter-spacing: -0.03em;
          text-shadow: 0 0 12px rgba(0,255,148,0.6), 0 0 32px rgba(0,255,148,0.25);
        }
        .v7-blink { animation: v7Blink 1.2s steps(2) infinite; }
        @keyframes v7Blink { 50% { opacity: 0; } }
        @media (prefers-reduced-motion: reduce) {
          .v7-scan, .v7-blink { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════════
 * V8 · Coin Pyramid — стопка золотых монет
 * ═══════════════════════════════════════════════════════════════════════════ */
function BannerV8() {
  return (
    <div
      className="relative rounded-2xl overflow-hidden flex flex-col justify-between"
      style={{
        height: "100%",
        padding: "22px",
        background: "radial-gradient(ellipse at 50% 100%, #2A1A05 0%, #0F0A02 80%)",
        border: "1px solid rgba(201,168,76,0.20)",
        boxShadow: "0 30px 80px -20px rgba(0,0,0,0.7)",
      }}
    >
      <div className="relative z-10">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold"
          style={{ background: "rgba(201,168,76,0.16)", color: "#FFE39C", border: "1px solid rgba(201,168,76,0.36)" }}>
          ☽ 100% Халяль
        </span>
        <h2 className="text-lg font-bold leading-tight mt-3" style={{ color: "#FFE39C" }}>
          Чистые монеты —<br />честная цена
        </h2>
      </div>

      <div className="relative z-10 flex items-end justify-center pb-2" style={{ perspective: "600px" }}>
        <div className="v8-pyramid">
          <div className="v8-coin v8-c5" />
          <div className="v8-coin v8-c4" />
          <div className="v8-coin v8-c3" />
          <div className="v8-coin v8-c2" />
          <div className="v8-coin v8-c1">
            <span className="v8-mark">☽</span>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <Link href="/catalog/"
          className="block w-full text-center py-2.5 rounded-full text-xs font-bold transition-all hover:opacity-90 active:scale-[.98]"
          style={{
            background: "linear-gradient(135deg, #FFE39C 0%, #C9A84C 60%, #8B6E22 100%)",
            color: "#0F0A02",
            boxShadow: "0 10px 28px rgba(201,168,76,0.45), inset 0 1px 0 rgba(255,255,255,0.5)",
          }}
        >
          В каталог →
        </Link>
      </div>

      <style>{`
        .v8-pyramid {
          position: relative;
          width: 140px; height: 130px;
          transform-style: preserve-3d;
          animation: v8Spin 14s linear infinite;
        }
        .v8-coin {
          position: absolute;
          left: 50%;
          width: 110px; height: 22px;
          margin-left: -55px;
          border-radius: 50%;
          background:
            radial-gradient(ellipse at 30% 30%, #FFF4D6, transparent 55%),
            linear-gradient(135deg, #FFE39C 0%, #C9A84C 40%, #8B6E22 100%);
          box-shadow:
            0 6px 14px rgba(0,0,0,0.5),
            inset 0 -3px 0 rgba(0,0,0,0.3),
            inset 0 2px 0 rgba(255,255,255,0.45);
          display: flex; align-items: center; justify-content: center;
        }
        .v8-c5 { bottom: 0;   transform: scale(1.10); opacity: 0.92; }
        .v8-c4 { bottom: 18px; transform: scale(1.05); opacity: 0.95; }
        .v8-c3 { bottom: 36px; transform: scale(1.00); }
        .v8-c2 { bottom: 54px; transform: scale(0.95); }
        .v8-c1 { bottom: 72px; transform: scale(0.90); }
        .v8-mark {
          font-size: 14px; color: #0F0A02; font-weight: 800;
          text-shadow: 0 1px 0 rgba(255,255,255,0.6);
        }
        @keyframes v8Spin {
          from { transform: rotateY(0) rotateX(8deg); }
          to   { transform: rotateY(360deg) rotateX(8deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .v8-pyramid { animation: none !important; transform: rotateX(8deg); }
        }
      `}</style>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════════
 * V9 · Digit Counter — крутящийся одометр
 * ═══════════════════════════════════════════════════════════════════════════ */
function BannerV9() {
  // Цифры на барабане — 0..9
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  // 3490: «3», «4», «9», «0» — задаём финальные позиции
  const stops = [3, 4, 9, 0];
  return (
    <div
      className="relative rounded-2xl overflow-hidden flex flex-col justify-between"
      style={{
        height: "100%",
        padding: "22px",
        background: "linear-gradient(160deg, #1C1C28 0%, #0E0E16 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 30px 80px -20px rgba(0,0,0,0.6)",
      }}
    >
      <div className="relative z-10">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold"
          style={{ background: "rgba(255,255,255,0.08)", color: "#FFF", border: "1px solid rgba(255,255,255,0.14)" }}>
          ⏱ Платёж в месяц
        </span>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="text-[10px] uppercase tracking-[0.18em] mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>от</div>
        <div className="flex items-end gap-0">
          {stops.map((stop, idx) => (
            <div key={idx} className="v9-window">
              <div className="v9-reel" style={{ animationDelay: `${idx * 0.2}s`, transform: `translateY(-${stop * 100}%)` }}>
                {digits.map((d) => (
                  <span key={d} className="v9-digit">{d}</span>
                ))}
              </div>
            </div>
          ))}
          <span className="v9-suffix">&nbsp;₽</span>
        </div>
        <div className="text-xs font-bold mt-2" style={{ color: "rgba(255,255,255,0.7)" }}>
          в месяц · до 12 мес
        </div>
      </div>

      <div className="relative z-10">
        <Link href="/catalog/"
          className="block w-full text-center py-2.5 rounded-full text-xs font-bold transition-all hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, #FFD63C 0%, #FFA53C 100%)",
            color: "#1C1C28",
            boxShadow: "0 8px 24px rgba(255,165,60,0.45)",
          }}
        >
          В каталог →
        </Link>
      </div>

      <style>{`
        .v9-window {
          width: 32px; height: 48px;
          overflow: hidden;
          position: relative;
          background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.4));
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px;
          margin: 0 1px;
        }
        .v9-window::before, .v9-window::after {
          content: ""; position: absolute; left: 0; right: 0; height: 12px;
          z-index: 2; pointer-events: none;
        }
        .v9-window::before { top: 0;    background: linear-gradient(180deg, #0E0E16, transparent); }
        .v9-window::after  { bottom: 0; background: linear-gradient(0deg,   #0E0E16, transparent); }
        .v9-reel {
          display: flex; flex-direction: column;
          animation: v9Spin 5s cubic-bezier(.7,0,.3,1) 1 forwards;
        }
        .v9-digit {
          height: 48px; line-height: 48px;
          text-align: center;
          font-size: 36px; font-weight: 800; color: #FFF;
          font-family: ui-monospace, 'SF Mono', Menlo, monospace;
          font-feature-settings: "tnum";
        }
        @keyframes v9Spin {
          0%   { transform: translateY(0); }
          100% { /* финальный transform задан inline */ }
        }
        .v9-suffix {
          font-size: 32px; font-weight: 700; color: rgba(255,255,255,0.7);
          line-height: 48px; margin-left: 4px;
        }
        @media (prefers-reduced-motion: reduce) {
          .v9-reel { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════════
 * V10 · Stripe-style Mesh — фирменный градиент Stripe.com
 * ═══════════════════════════════════════════════════════════════════════════ */
function BannerV10() {
  return (
    <div
      className="relative rounded-2xl overflow-hidden flex flex-col justify-between"
      style={{
        height: "100%",
        padding: "22px",
        background: "linear-gradient(135deg, #00D4FF 0%, #7A3CFF 35%, #FF3CC8 70%, #FFA53C 100%)",
        boxShadow: "0 30px 80px -20px rgba(122,60,255,0.45)",
      }}
    >
      {/* Парящие фигуры */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="v10-shape v10-circle" />
        <div className="v10-shape v10-square" />
        <div className="v10-shape v10-triangle" />
      </div>
      {/* Frosted overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0))",
        }}
      />

      <div className="relative z-10">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold"
          style={{ background: "rgba(255,255,255,0.22)", color: "#FFF", border: "1px solid rgba(255,255,255,0.32)", backdropFilter: "blur(8px)" }}>
          ⚡ Мгновенное одобрение
        </span>
      </div>

      <div className="relative z-10">
        <h2 className="text-2xl font-extrabold leading-tight" style={{ color: "#FFF", letterSpacing: "-0.02em" }}>
          Финансы.<br/>На халяль.<br/>Без слов.
        </h2>
        <p className="text-xs mt-2 font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>
          от 3 490 ₽/мес · до 12 мес
        </p>
      </div>

      <div className="relative z-10">
        <Link href="/catalog/"
          className="block w-full text-center py-2.5 rounded-full text-xs font-bold transition-all hover:opacity-90"
          style={{
            background: "#FFF",
            color: "#7A3CFF",
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          }}
        >
          В каталог →
        </Link>
      </div>

      <style>{`
        .v10-shape { position: absolute; opacity: 0.6; }
        .v10-circle {
          width: 60px; height: 60px; border-radius: 50%;
          background: rgba(255,255,255,0.25);
          backdrop-filter: blur(8px);
          top: 20%; right: 8%;
          animation: v10Float1 8s ease-in-out infinite;
        }
        .v10-square {
          width: 40px; height: 40px;
          background: rgba(255,255,255,0.18);
          backdrop-filter: blur(8px);
          border-radius: 8px;
          top: 50%; left: 8%;
          transform: rotate(20deg);
          animation: v10Float2 7s ease-in-out infinite;
        }
        .v10-triangle {
          width: 0; height: 0;
          border-left: 24px solid transparent;
          border-right: 24px solid transparent;
          border-bottom: 40px solid rgba(255,255,255,0.22);
          bottom: 30%; right: 20%;
          animation: v10Float3 9s ease-in-out infinite;
        }
        @keyframes v10Float1 { 0%,100%{transform:translate(0,0);} 50%{transform:translate(-12px,18px);} }
        @keyframes v10Float2 { 0%,100%{transform:rotate(20deg) translate(0,0);} 50%{transform:rotate(40deg) translate(14px,-12px);} }
        @keyframes v10Float3 { 0%,100%{transform:translate(0,0);} 50%{transform:translate(10px,-16px);} }
        @media (prefers-reduced-motion: reduce) {
          .v10-circle, .v10-square, .v10-triangle { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════════
 * V11 · Glass Stack — Apple Vision Pro vibe
 * ═══════════════════════════════════════════════════════════════════════════ */
function BannerV11() {
  return (
    <div
      className="relative rounded-2xl overflow-hidden flex flex-col justify-between"
      style={{
        height: "100%",
        padding: "22px",
        background: "linear-gradient(160deg, #1A2438 0%, #2A3656 50%, #3A4878 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 30px 80px -20px rgba(0,0,0,0.55)",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background: "radial-gradient(ellipse at 30% 20%, rgba(180,210,255,0.25), transparent 55%)",
        }}
      />

      <div className="relative z-10">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold"
          style={{ background: "rgba(255,255,255,0.10)", color: "#FFF", border: "1px solid rgba(255,255,255,0.22)", backdropFilter: "blur(12px)" }}>
          ◯ Прозрачно
        </span>
        <h2 className="text-base font-bold leading-tight mt-3" style={{ color: "#FFF" }}>
          Каждый платёж<br/>как на ладони
        </h2>
      </div>

      <div className="relative z-10 flex items-center justify-center" style={{ perspective: "800px" }}>
        <div className="v11-stack">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="v11-glass" style={{ ['--i' as string]: i }}>
              <div className="v11-row">
                <span>Месяц {i + 1}</span>
                <span>3 490 ₽</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10">
        <Link href="/catalog/"
          className="block w-full text-center py-2.5 rounded-full text-xs font-bold transition-all hover:opacity-90"
          style={{
            background: "rgba(255,255,255,0.92)",
            color: "#1A2438",
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          }}
        >
          В каталог →
        </Link>
      </div>

      <style>{`
        .v11-stack {
          position: relative;
          width: 200px; height: 140px;
          transform-style: preserve-3d;
          animation: v11Hover 6s ease-in-out infinite;
        }
        .v11-glass {
          position: absolute;
          left: 0; right: 0;
          height: 32px;
          border-radius: 10px;
          background: linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06));
          border: 1px solid rgba(255,255,255,0.30);
          backdrop-filter: blur(14px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.4);
          transform: translateZ(calc(var(--i) * 18px)) translateY(calc(var(--i) * -6px));
          opacity: calc(0.5 + var(--i) * 0.12);
        }
        .v11-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 12px; height: 100%;
          font-size: 11px; font-weight: 600; color: #FFF;
        }
        @keyframes v11Hover {
          0%,100% { transform: rotateX(15deg) rotateY(-8deg); }
          50%     { transform: rotateX(18deg) rotateY(-12deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .v11-stack { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════════
 * V12 · Constellation — точки и линии складываются в звезду
 * ═══════════════════════════════════════════════════════════════════════════ */
function BannerV12() {
  // 8 точек по кругу + центр — упрощённая 8-конечная звезда
  const R = 50;
  const dots = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    return { x: 70 + Math.cos(a) * R, y: 70 + Math.sin(a) * R };
  });
  return (
    <div
      className="relative rounded-2xl overflow-hidden flex flex-col justify-between"
      style={{
        height: "100%",
        padding: "22px",
        background: "radial-gradient(ellipse at 50% 50%, #0E1A2E 0%, #04080F 100%)",
        border: "1px solid rgba(0,200,255,0.18)",
        boxShadow: "0 30px 80px -20px rgba(0,0,0,0.6)",
      }}
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {/* Звёздная пыль */}
        {Array.from({ length: 20 }).map((_, i) => (
          <span key={i} className="v12-dot" style={{
            top: `${(i * 47) % 100}%`,
            left: `${(i * 31) % 100}%`,
            animationDelay: `${(i * 0.3) % 3}s`,
          }} />
        ))}
      </div>

      <div className="relative z-10">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold"
          style={{ background: "rgba(0,200,255,0.10)", color: "#7AE0FF", border: "1px solid rgba(0,200,255,0.30)" }}>
          ✦ Чистая сделка
        </span>
        <h2 className="text-lg font-bold leading-tight mt-3" style={{ color: "#FFF" }}>
          Звёздная<br/>прозрачность
        </h2>
      </div>

      <div className="relative z-10 flex items-center justify-center">
        <svg width="140" height="140" viewBox="0 0 140 140">
          {/* Линии от центра к каждой точке + смежные */}
          {dots.map((d, i) => (
            <g key={i}>
              <line x1="70" y1="70" x2={d.x} y2={d.y}
                stroke="rgba(0,200,255,0.45)" strokeWidth="0.8"
                className="v12-line" style={{ animationDelay: `${i * 0.15}s` }} />
              <line x1={d.x} y1={d.y} x2={dots[(i + 2) % 8].x} y2={dots[(i + 2) % 8].y}
                stroke="rgba(255,255,255,0.20)" strokeWidth="0.5"
                className="v12-line" style={{ animationDelay: `${i * 0.15 + 1}s` }} />
            </g>
          ))}
          {dots.map((d, i) => (
            <circle key={`c${i}`} cx={d.x} cy={d.y} r="3"
              fill="#7AE0FF"
              className="v12-node"
              style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
          <circle cx="70" cy="70" r="5" fill="#FFF" style={{ filter: "drop-shadow(0 0 8px #7AE0FF)" }} />
        </svg>
      </div>

      <div className="relative z-10">
        <Link href="/catalog/"
          className="block w-full text-center py-2.5 rounded-full text-xs font-bold transition-all hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, #7AE0FF 0%, #4A9CFF 100%)",
            color: "#04080F",
            boxShadow: "0 8px 24px rgba(122,224,255,0.45)",
          }}
        >
          В каталог →
        </Link>
      </div>

      <style>{`
        .v12-dot {
          position: absolute;
          width: 2px; height: 2px; border-radius: 50%;
          background: #FFF;
          box-shadow: 0 0 6px #FFF;
          animation: v12Tw 3s ease-in-out infinite;
        }
        @keyframes v12Tw { 0%,100%{opacity:0.15;} 50%{opacity:1;} }
        .v12-line {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: v12Draw 3s ease-out infinite;
        }
        @keyframes v12Draw {
          0%   { stroke-dashoffset: 100; opacity: 0; }
          30%  { opacity: 1; }
          70%  { stroke-dashoffset: 0;   opacity: 1; }
          100% { stroke-dashoffset: 0;   opacity: 0; }
        }
        .v12-node {
          animation: v12Pulse 2.4s ease-in-out infinite;
        }
        @keyframes v12Pulse { 0%,100%{r:2; opacity:0.5;} 50%{r:3.5; opacity:1;} }
        @media (prefers-reduced-motion: reduce) {
          .v12-dot, .v12-line, .v12-node { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════════
 * V13 · Aurora Borealis — вертикальные северные сияния
 * ═══════════════════════════════════════════════════════════════════════════ */
function BannerV13() {
  return (
    <div
      className="relative rounded-2xl overflow-hidden flex flex-col justify-between"
      style={{
        height: "100%",
        padding: "22px",
        background: "linear-gradient(180deg, #04081A 0%, #0A1438 80%, #1A2858 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 30px 80px -20px rgba(0,0,0,0.6)",
      }}
    >
      {/* Aurora streaks */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="v13-streak v13-s1" />
        <div className="v13-streak v13-s2" />
        <div className="v13-streak v13-s3" />
      </div>
      {/* Stars */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {Array.from({ length: 15 }).map((_, i) => (
          <span key={i} className="v13-star" style={{
            top: `${(i * 23) % 100}%`,
            left: `${(i * 41) % 100}%`,
            animationDelay: `${(i * 0.4) % 4}s`,
          }} />
        ))}
      </div>

      <div className="relative z-10">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold"
          style={{ background: "rgba(255,255,255,0.10)", color: "#FFF", border: "1px solid rgba(255,255,255,0.22)" }}>
          ✦ Сказочная рассрочка
        </span>
        <h2 className="text-lg font-bold leading-tight mt-3" style={{ color: "#FFF" }}>
          Северное<br/>сияние финансов
        </h2>
      </div>

      <div className="relative z-10 text-center">
        <div className="text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>от</div>
        <div className="v13-price">3&nbsp;490&nbsp;₽</div>
        <div className="text-xs font-bold mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>в месяц</div>
      </div>

      <div className="relative z-10">
        <Link href="/catalog/"
          className="block w-full text-center py-2.5 rounded-full text-xs font-bold transition-all hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, #00FF94 0%, #00D4FF 50%, #B43CFF 100%)",
            color: "#04081A",
            boxShadow: "0 10px 28px rgba(0,212,255,0.4)",
          }}
        >
          В каталог →
        </Link>
      </div>

      <style>{`
        .v13-streak {
          position: absolute;
          left: 0; right: 0; height: 200%;
          filter: blur(28px);
          opacity: 0.7;
          mix-blend-mode: screen;
        }
        .v13-s1 {
          background: linear-gradient(180deg, transparent, #00FF94 35%, transparent 70%);
          top: -50%; transform: translateX(-30%) skewX(-10deg);
          animation: v13Drift1 12s ease-in-out infinite;
        }
        .v13-s2 {
          background: linear-gradient(180deg, transparent, #00D4FF 40%, transparent 75%);
          top: -50%; transform: translateX(20%) skewX(8deg);
          animation: v13Drift2 14s ease-in-out infinite;
        }
        .v13-s3 {
          background: linear-gradient(180deg, transparent, #B43CFF 45%, transparent 80%);
          top: -50%; transform: translateX(60%) skewX(-5deg);
          animation: v13Drift3 16s ease-in-out infinite;
        }
        @keyframes v13Drift1 { 0%,100%{transform:translateX(-30%) skewX(-10deg);} 50%{transform:translateX(10%) skewX(-14deg);} }
        @keyframes v13Drift2 { 0%,100%{transform:translateX(20%) skewX(8deg);} 50%{transform:translateX(-20%) skewX(12deg);} }
        @keyframes v13Drift3 { 0%,100%{transform:translateX(60%) skewX(-5deg);} 50%{transform:translateX(20%) skewX(-9deg);} }

        .v13-star {
          position: absolute;
          width: 2px; height: 2px; border-radius: 50%;
          background: #FFF;
          box-shadow: 0 0 4px #FFF;
          animation: v13Tw 3s ease-in-out infinite;
        }
        @keyframes v13Tw { 0%,100%{opacity:0.2;} 50%{opacity:1;} }

        .v13-price {
          font-size: 32px; font-weight: 800; line-height: 1;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, #00FF94, #00D4FF, #B43CFF);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        @media (prefers-reduced-motion: reduce) {
          .v13-streak, .v13-star { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════════
 * V14 · Card Fan — 3 карты веером
 * ═══════════════════════════════════════════════════════════════════════════ */
function BannerV14() {
  return (
    <div
      className="relative rounded-2xl overflow-hidden flex flex-col justify-between v14-card"
      style={{
        height: "100%",
        padding: "22px",
        background: "linear-gradient(160deg, #160C2E 0%, #2E1A56 60%, #4A1F7A 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 30px 80px -20px rgba(0,0,0,0.6)",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{ background: "radial-gradient(ellipse at 80% 20%, rgba(180,60,255,0.30), transparent 55%)" }}
      />

      <div className="relative z-10">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold"
          style={{ background: "rgba(255,255,255,0.12)", color: "#FFF", border: "1px solid rgba(255,255,255,0.22)" }}>
          ✦ Свободный выбор
        </span>
        <h2 className="text-base font-bold leading-tight mt-3" style={{ color: "#FFF" }}>
          Один платёж в месяц.<br/>Сотни товаров.
        </h2>
      </div>

      <div className="relative z-10 flex items-center justify-center" style={{ perspective: "700px" }}>
        <div className="v14-fan">
          <div className="v14-c v14-c-l">
            <div className="v14-c-label">3 мес</div>
            <div className="v14-c-amt">от 7 990 ₽</div>
          </div>
          <div className="v14-c v14-c-m">
            <div className="v14-c-label">6 мес</div>
            <div className="v14-c-amt">от 4 990 ₽</div>
          </div>
          <div className="v14-c v14-c-r">
            <div className="v14-c-label">12 мес</div>
            <div className="v14-c-amt">от 3 490 ₽</div>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <Link href="/catalog/"
          className="block w-full text-center py-2.5 rounded-full text-xs font-bold transition-all hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, #FFFFFF 0%, #E0D0FF 100%)",
            color: "#160C2E",
            boxShadow: "0 10px 28px rgba(180,60,255,0.4)",
          }}
        >
          В каталог →
        </Link>
      </div>

      <style>{`
        .v14-fan {
          position: relative;
          width: 200px; height: 130px;
        }
        .v14-c {
          position: absolute;
          left: 50%; top: 0;
          margin-left: -55px;
          width: 110px; height: 130px;
          border-radius: 14px;
          padding: 14px 12px;
          background: linear-gradient(160deg, rgba(255,255,255,0.20), rgba(255,255,255,0.06));
          border: 1px solid rgba(255,255,255,0.28);
          backdrop-filter: blur(16px);
          box-shadow:
            0 18px 36px -10px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(255,255,255,0.4);
          color: #FFF;
          display: flex; flex-direction: column; justify-content: flex-end;
          transform-origin: 50% 110%;
        }
        .v14-c-l { transform: rotate(-18deg) translateX(-22px); background: linear-gradient(160deg, rgba(180,60,255,0.40), rgba(180,60,255,0.10)); animation: v14L 6s ease-in-out infinite; }
        .v14-c-m { transform: rotate(0) translateY(-10px);      background: linear-gradient(160deg, rgba(255,255,255,0.30), rgba(255,255,255,0.10)); animation: v14M 5s ease-in-out infinite; z-index: 2; }
        .v14-c-r { transform: rotate(18deg) translateX(22px);   background: linear-gradient(160deg, rgba(95,201,167,0.40), rgba(95,201,167,0.10)); animation: v14R 7s ease-in-out infinite; }
        .v14-c-label { font-size: 10px; font-weight: 600; opacity: 0.85; }
        .v14-c-amt   { font-size: 13px; font-weight: 800; margin-top: 2px; }
        @keyframes v14L { 0%,100%{transform:rotate(-18deg) translateX(-22px);} 50%{transform:rotate(-20deg) translateX(-26px) translateY(-3px);} }
        @keyframes v14M { 0%,100%{transform:rotate(0) translateY(-10px);} 50%{transform:rotate(0) translateY(-14px);} }
        @keyframes v14R { 0%,100%{transform:rotate(18deg) translateX(22px);} 50%{transform:rotate(20deg) translateX(26px) translateY(-3px);} }
        @media (prefers-reduced-motion: reduce) {
          .v14-c-l, .v14-c-m, .v14-c-r { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════════
 * V15 · Marquee Ticker — стоп-таймер с бегущими цифрами
 * ═══════════════════════════════════════════════════════════════════════════ */
function BannerV15() {
  const ticks = ["3 490 ₽", "4 990 ₽", "6 990 ₽", "9 990 ₽", "12 490 ₽"];
  return (
    <div
      className="relative rounded-2xl overflow-hidden flex flex-col justify-between"
      style={{
        height: "100%",
        padding: "22px",
        background: "linear-gradient(180deg, #0A0E14 0%, #0F1722 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 30px 80px -20px rgba(0,0,0,0.6)",
        fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
      }}
    >
      <div className="relative z-10">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold"
          style={{ background: "rgba(0,255,148,0.12)", color: "#00FF94", border: "1px solid rgba(0,255,148,0.32)" }}>
          ▲ LIVE прайс
        </span>
        <h2 className="text-base font-bold leading-tight mt-3" style={{ color: "#FFF", fontFamily: "system-ui, sans-serif" }}>
          Платёж по тарифу,<br/>как тебе удобно
        </h2>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>
          от
        </div>
        <div className="v15-ticker">
          <div className="v15-reel">
            {[...ticks, ...ticks].map((t, i) => (
              <div key={i} className="v15-tick">{t}</div>
            ))}
          </div>
        </div>
        <div className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
          / мес — пересчитывается мгновенно
        </div>
      </div>

      <div className="relative z-10">
        <Link href="/catalog/"
          className="block w-full text-center py-2.5 rounded-md text-xs font-bold transition-all hover:opacity-90"
          style={{
            background: "#00FF94",
            color: "#0A0E14",
            boxShadow: "0 0 24px rgba(0,255,148,0.4)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          → купить
        </Link>
      </div>

      <style>{`
        .v15-ticker {
          width: 200px; height: 48px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 8px;
          background: rgba(0,0,0,0.4);
          position: relative;
        }
        .v15-ticker::before, .v15-ticker::after {
          content: ""; position: absolute; left: 0; right: 0; height: 10px;
          z-index: 2; pointer-events: none;
        }
        .v15-ticker::before { top: 0;    background: linear-gradient(180deg, rgba(0,0,0,0.7), transparent); }
        .v15-ticker::after  { bottom: 0; background: linear-gradient(0deg,   rgba(0,0,0,0.7), transparent); }
        .v15-reel {
          animation: v15Roll 10s linear infinite;
        }
        .v15-tick {
          height: 48px; line-height: 48px;
          text-align: center;
          font-size: 24px; font-weight: 800; color: #00FF94;
          font-feature-settings: "tnum";
          text-shadow: 0 0 12px rgba(0,255,148,0.5);
        }
        @keyframes v15Roll {
          from { transform: translateY(0); }
          to   { transform: translateY(-${48 * 5}px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .v15-reel { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
