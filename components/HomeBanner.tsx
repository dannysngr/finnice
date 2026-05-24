/**
 * HomeBanner — основной баннер на главной (V1 · Aurora + Halal Star).
 * Извлечён из app/page.tsx для переиспользования на странице /banner-preview.
 */
import Link from "next/link";

/**
 * HalalStar — стилизованная исламская восьмиконечная звезда (Khatim),
 * заключённая в светящееся кольцо с медленным вращением и шиммером.
 */
function HalalStar() {
  return (
    <div className="relative banner-star-wrap" style={{ width: 120, height: 120 }}>
      {/* Мягкое золотое сияние позади */}
      <div className="absolute inset-0 banner-halo pointer-events-none" />

      {/* Внешнее пунктирное вращающееся кольцо */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 banner-ring-outer"
        style={{ width: "100%", height: "100%" }}
      >
        <circle
          cx="50" cy="50" r="46"
          fill="none"
          stroke="rgba(237,231,218,0.22)"
          strokeWidth="0.6"
          strokeDasharray="1.5 3.5"
        />
      </svg>

      {/* Внутреннее тонкое кольцо — медленное вращение в обратную сторону */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 banner-ring-inner"
        style={{ width: "100%", height: "100%" }}
      >
        <circle
          cx="50" cy="50" r="38"
          fill="none"
          stroke="rgba(201,168,76,0.35)"
          strokeWidth="0.5"
          strokeDasharray="0.5 6"
        />
      </svg>

      {/* Сама звезда */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 banner-star"
        style={{ width: "100%", height: "100%" }}
      >
        <defs>
          <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#FFF4D6" />
            <stop offset="45%"  stopColor="#C9A84C" />
            <stop offset="100%" stopColor="#EDE7DA" />
          </linearGradient>
          <linearGradient id="starShine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0)" />
            <stop offset="50%"  stopColor="rgba(255,255,255,0.65)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {/* 8-конечная звезда = два повёрнутых квадрата */}
        <g transform="translate(50 50)">
          <rect x="-24" y="-24" width="48" height="48" rx="2" fill="url(#starGrad)" opacity="0.92" />
          <rect x="-24" y="-24" width="48" height="48" rx="2" fill="url(#starGrad)" opacity="0.92" transform="rotate(45)" />
        </g>

        {/* Центральный «глаз» */}
        <circle cx="50" cy="50" r="10" fill="#03101F" />
        <circle cx="50" cy="50" r="6"  fill="url(#starGrad)" />
        <circle cx="50" cy="50" r="2"  fill="#03101F" />

        {/* Бегущий шиммер по звезде */}
        <rect x="-30" y="-50" width="20" height="100" fill="url(#starShine)" className="banner-star-shine" />
      </svg>

      {/* Искорки вокруг */}
      <span className="banner-spark s1" />
      <span className="banner-spark s2" />
      <span className="banner-spark s3" />
      <span className="banner-spark s4" />
    </div>
  );
}

export function HomeBanner() {
  return (
    <div
      className="rounded-2xl relative overflow-hidden banner-card banner-card-responsive"
      style={{
        background: `
          radial-gradient(ellipse at 85% 15%, rgba(12,122,88,0.40), transparent 55%),
          radial-gradient(ellipse at 15% 85%, rgba(237,231,218,0.10), transparent 60%),
          linear-gradient(135deg, #03101F 0%, #082848 22%, #054238 58%, #0A5440 100%)
        `,
        boxShadow:      "0 30px 80px -20px rgba(3,16,31,0.45), inset 0 1px 0 rgba(237,231,218,0.08)",
        border:         "1px solid rgba(237,231,218,0.10)",
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
      {/* Aurora — три плавающих блоба создают «живой» mesh-gradient фон */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="banner-blob banner-blob-emerald" />
        <div className="banner-blob banner-blob-gold" />
        <div className="banner-blob banner-blob-ivory" />
      </div>

      {/* Сетка точек (subtle pattern) */}
      <div
        className="absolute inset-0 pointer-events-none banner-grid"
        aria-hidden
        style={{
          backgroundImage: "radial-gradient(rgba(237,231,218,0.10) 1px, transparent 1px)",
          backgroundSize: "14px 14px",
          opacity: 0.35,
          mixBlendMode: "soft-light",
        }}
      />

      {/* Animated subtle sheen overlay */}
      <div
        className="absolute inset-0 pointer-events-none banner-sheen"
        style={{
          background: "linear-gradient(115deg, transparent 30%, rgba(237,231,218,0.08) 50%, transparent 70%)",
        }}
      />

      {/* Badge */}
      <div className="relative z-10 banner-text-block">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold mb-4 banner-badge"
          style={{
            background: "linear-gradient(135deg, rgba(237,231,218,0.16), rgba(201,168,76,0.18))",
            color: "#EDE7DA",
            border: "1px solid rgba(237,231,218,0.28)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        >
          <span className="banner-pulse" />
          Прозрачно · Без риба · Халяль
        </span>
        <h2 className="text-xl sm:text-2xl font-bold leading-tight mb-1.5 banner-heading" style={{ color: "#EDE7DA" }}>
          Бери сегодня —{" "}<br />плати потом
        </h2>
        <p className="text-xs leading-relaxed max-w-[230px]" style={{ color: "rgba(237,231,218,0.65)" }}>
          Халяльная рассрочка без скрытых платежей, штрафов и пени
        </p>
      </div>

      {/* Центральный визуал: исламская звезда + плавающие чипы */}
      <div className="relative z-10 flex items-center justify-center py-2 banner-phone-block">
        <div className="relative banner-star-orbit">
          <HalalStar />

          <div
            className="absolute -right-12 top-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap banner-chip banner-chip-1"
            style={{
              background: "linear-gradient(135deg, #FFF4D6 0%, #EDE7DA 100%)",
              color: "#03101F",
              boxShadow: "0 8px 24px rgba(201,168,76,0.35), 0 2px 6px rgba(0,0,0,0.25)",
              border: "1px solid rgba(201,168,76,0.55)",
            }}
          >
            от 3&nbsp;490 ₽/мес
          </div>

          <div
            className="absolute -left-10 bottom-2 px-2.5 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap banner-chip banner-chip-2"
            style={{
              background: "rgba(3,16,31,0.55)",
              color: "#EDE7DA",
              border: "1px solid rgba(237,231,218,0.30)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            до 12 мес
          </div>

          <div
            className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap banner-chip banner-chip-3"
            style={{
              background: "rgba(12,122,88,0.85)",
              color: "#EDE7DA",
              border: "1px solid rgba(237,231,218,0.30)",
              boxShadow: "0 6px 18px rgba(12,122,88,0.5)",
            }}
          >
            халяль · 0% риба
          </div>
        </div>
      </div>

      {/* CTA с дышащим glow-кольцом */}
      <div className="relative z-10 banner-cta-block">
        <div className="relative banner-cta-wrap">
          <span className="banner-cta-glow" aria-hidden />
          <Link
            href="/catalog/"
            className="relative flex items-center justify-center w-full py-2.5 rounded-full font-bold
                       text-xs transition-all hover:opacity-95 active:scale-[.98] banner-cta"
            style={{
              background: "linear-gradient(135deg, #FFF4D6 0%, #EDE7DA 60%, #C9A84C 100%)",
              color: "#03101F",
              boxShadow: "0 10px 28px rgba(201,168,76,0.35), inset 0 1px 0 rgba(255,255,255,0.55)",
            }}
          >
            В каталог
            <span className="banner-arrow">→</span>
          </Link>
        </div>
      </div>

      {/* Keyframes & animations — scoped to .banner-card */}
      <style>{`
        .banner-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(38px);
          opacity: 0.55;
          mix-blend-mode: screen;
          will-change: transform;
        }
        .banner-blob-emerald {
          width: 220px; height: 220px;
          background: radial-gradient(circle, rgba(12,122,88,0.85), transparent 70%);
          top: -40px; right: -50px;
          animation: bannerBlobA 14s ease-in-out infinite;
        }
        .banner-blob-gold {
          width: 180px; height: 180px;
          background: radial-gradient(circle, rgba(201,168,76,0.55), transparent 70%);
          bottom: -30px; left: -40px;
          animation: bannerBlobB 17s ease-in-out infinite;
        }
        .banner-blob-ivory {
          width: 150px; height: 150px;
          background: radial-gradient(circle, rgba(237,231,218,0.40), transparent 70%);
          top: 35%; left: 30%;
          animation: bannerBlobC 12s ease-in-out infinite;
        }
        @keyframes bannerBlobA {
          0%, 100% { transform: translate(0,0)      scale(1);    }
          33%      { transform: translate(-22px,18px) scale(1.10); }
          66%      { transform: translate(14px,-16px) scale(0.95); }
        }
        @keyframes bannerBlobB {
          0%, 100% { transform: translate(0,0)      scale(1);    }
          50%      { transform: translate(28px,-22px) scale(1.12); }
        }
        @keyframes bannerBlobC {
          0%, 100% { transform: translate(0,0)     scale(1)   rotate(0);   }
          50%      { transform: translate(-18px,8px) scale(1.15) rotate(30deg); }
        }

        @keyframes bannerSheen {
          0%   { transform: translateX(-120%); }
          60%  { transform: translateX(120%);  }
          100% { transform: translateX(120%);  }
        }
        .banner-sheen { animation: bannerSheen 7s cubic-bezier(.6,0,.4,1) infinite; }

        .banner-halo {
          background: radial-gradient(circle, rgba(201,168,76,0.55), rgba(12,122,88,0.20) 45%, transparent 70%);
          filter: blur(10px);
          animation: bannerHalo 4.5s ease-in-out infinite;
        }
        @keyframes bannerHalo {
          0%, 100% { opacity: 0.75; transform: scale(1);    }
          50%      { opacity: 1;    transform: scale(1.10); }
        }
        .banner-ring-outer { animation: bannerSpin 22s linear infinite; transform-origin: 50% 50%; }
        .banner-ring-inner { animation: bannerSpinRev 18s linear infinite; transform-origin: 50% 50%; }
        @keyframes bannerSpin    { from { transform: rotate(0); } to { transform: rotate(360deg); } }
        @keyframes bannerSpinRev { from { transform: rotate(0); } to { transform: rotate(-360deg); } }

        .banner-star { animation: bannerStarFloat 6s ease-in-out infinite; transform-origin: 50% 50%; }
        @keyframes bannerStarFloat {
          0%, 100% { transform: translateY(0)     rotate(0);   }
          50%      { transform: translateY(-3px) rotate(8deg); }
        }
        .banner-star-shine {
          animation: bannerStarShine 4.5s ease-in-out infinite;
          transform-origin: 50% 50%;
        }
        @keyframes bannerStarShine {
          0%   { transform: translate(-30px,0) rotate(20deg); opacity: 0;   }
          40%  { opacity: 1; }
          100% { transform: translate(110px,0) rotate(20deg); opacity: 0;   }
        }

        .banner-spark {
          position: absolute;
          width: 4px; height: 4px;
          border-radius: 50%;
          background: #FFF4D6;
          box-shadow: 0 0 8px #FFF4D6, 0 0 14px rgba(201,168,76,0.7);
          opacity: 0;
        }
        .banner-spark.s1 { top: 6px;  left: 10px;  animation: bannerSpark 3.2s ease-in-out infinite 0s; }
        .banner-spark.s2 { top: 18px; right: 4px;  animation: bannerSpark 2.8s ease-in-out infinite .8s; }
        .banner-spark.s3 { bottom: 12px; left: 8px;animation: bannerSpark 3.6s ease-in-out infinite 1.6s; }
        .banner-spark.s4 { bottom: 8px;  right: 18px;animation: bannerSpark 3.0s ease-in-out infinite 2.2s; }
        @keyframes bannerSpark {
          0%, 100% { opacity: 0; transform: scale(0.4); }
          50%      { opacity: 1; transform: scale(1.2); }
        }

        @keyframes bannerFloatA {
          0%, 100% { transform: translateY(0)    rotate(-3deg); }
          50%      { transform: translateY(-7px) rotate(2deg);  }
        }
        @keyframes bannerFloatB {
          0%, 100% { transform: translateY(0)   rotate(3deg);   }
          50%      { transform: translateY(6px) rotate(-2deg);  }
        }
        @keyframes bannerFloatC {
          0%, 100% { transform: translateX(-50%) translateY(0)    scale(1);    }
          50%      { transform: translateX(-50%) translateY(-3px) scale(1.05); }
        }
        .banner-chip-1 { animation: bannerFloatA 4.5s ease-in-out infinite; }
        .banner-chip-2 { animation: bannerFloatB 5.2s ease-in-out infinite; }
        .banner-chip-3 { animation: bannerFloatC 3.8s ease-in-out infinite; }

        .banner-heading {
          background: linear-gradient(90deg, #EDE7DA 0%, #FFF4D6 25%, #FFFFFF 50%, #FFF4D6 75%, #EDE7DA 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: bannerHeadShimmer 6s ease-in-out infinite;
        }
        @keyframes bannerHeadShimmer {
          0%, 100% { background-position: 200% 0; }
          50%      { background-position: -50% 0; }
        }

        .banner-pulse {
          width: 6px; height: 6px; border-radius: 9999px;
          background: #C9A84C;
          box-shadow: 0 0 6px #C9A84C;
          animation: bannerPulseDot 1.8s ease-out infinite;
        }
        @keyframes bannerPulseDot {
          0%, 100% { box-shadow: 0 0 0 0 rgba(201,168,76,0.70), 0 0 6px #C9A84C; }
          70%      { box-shadow: 0 0 0 7px rgba(201,168,76,0),   0 0 6px #C9A84C; }
        }

        .banner-cta-wrap { position: relative; }
        .banner-cta-glow {
          position: absolute;
          inset: -6px;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(201,168,76,0.55), transparent 70%);
          filter: blur(10px);
          opacity: 0.85;
          z-index: 0;
          animation: bannerCtaGlow 2.6s ease-in-out infinite;
        }
        @keyframes bannerCtaGlow {
          0%, 100% { opacity: 0.55; transform: scale(0.98); }
          50%      { opacity: 1;    transform: scale(1.04); }
        }
        .banner-cta { position: relative; overflow: hidden; }
        .banner-cta::after {
          content: "";
          position: absolute;
          top: 0; left: -60%;
          width: 50%; height: 100%;
          background: linear-gradient(115deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%);
          transform: skewX(-18deg);
          animation: bannerCtaShine 3.4s ease-in-out infinite;
        }
        @keyframes bannerCtaShine {
          0%   { left: -60%; }
          60%  { left: 130%; }
          100% { left: 130%; }
        }
        .banner-arrow {
          display: inline-block;
          margin-left: 6px;
          animation: bannerArrow 1.6s ease-in-out infinite;
        }
        @keyframes bannerArrow {
          0%, 100% { transform: translateX(0);  }
          50%      { transform: translateX(4px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .banner-sheen, .banner-blob, .banner-blob-emerald,
          .banner-blob-gold, .banner-blob-ivory, .banner-halo,
          .banner-ring-outer, .banner-ring-inner, .banner-star,
          .banner-star-shine, .banner-spark, .banner-chip-1,
          .banner-chip-2, .banner-chip-3, .banner-heading,
          .banner-pulse, .banner-cta-glow, .banner-arrow {
            animation: none !important;
          }
          .banner-cta::after { display: none; }
          .banner-heading {
            -webkit-text-fill-color: #EDE7DA;
            background: none;
          }
        }

        @media (max-width: 767px) {
          .banner-card-responsive {
            padding: 14px !important;
            min-height: auto !important;
            display: grid !important;
            grid-template-columns: 1fr auto;
            grid-template-areas:
              "text  phone"
              "cta   cta";
            align-items: center;
            gap: 12px !important;
          }
          .banner-text-block  { grid-area: text;  }
          .banner-phone-block { grid-area: phone; padding: 0 !important; }
          .banner-cta-block   { grid-area: cta;   }
          .banner-card-responsive .banner-badge {
            margin-bottom: 6px !important;
            font-size: 9px !important;
            padding: 2px 7px !important;
          }
          .banner-card-responsive h2 {
            font-size: 17px !important;
            line-height: 1.15 !important;
            margin-bottom: 4px !important;
          }
          .banner-card-responsive h2 br { display: none; }
          .banner-card-responsive p {
            font-size: 11px !important;
            max-width: 100% !important;
          }
          .banner-card-responsive .banner-star-wrap {
            transform: scale(0.65);
            transform-origin: center;
          }
          .banner-card-responsive .banner-chip-1,
          .banner-card-responsive .banner-chip-2,
          .banner-card-responsive .banner-chip-3 {
            display: none !important;
          }
          .banner-card-responsive .banner-cta {
            padding-top: 9px !important;
            padding-bottom: 9px !important;
          }
        }
      `}</style>
    </div>
  );
}
