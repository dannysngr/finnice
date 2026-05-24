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
