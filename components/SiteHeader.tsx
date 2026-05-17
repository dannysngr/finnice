"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { COMPANY, CATALOG_CATS } from "@/lib/data";
import { onCartChanged, onFavoritesChanged } from "@/lib/cart-events";
import { AuthModal } from "@/components/AuthModal";
import { CalculatorModal } from "@/components/CalculatorModal";
import { FinniceLogo } from "@/components/FinniceLogo";

/* ── Session ────────────────────────────────────────────────── */
interface SessionInfo {
  authed:    boolean;
  firstName: string | null;
  lastName:  string | null;
}
function getInitials(f: string | null, l: string | null): string | null {
  if (f && l) return (f[0] + l[0]).toUpperCase();
  if (f)      return f.slice(0, 2).toUpperCase();
  return null;
}

/* ── Top nav links (без Каталога — он отдельно с dropdown) ─── */
const TOP_NAV = [
  { label: "О компании", href: "/company/" },
  { label: "Блог",       href: "/blog/" },
  { label: "Вакансии",   href: "/info/vacancy/" },
  { label: "Партнёры",   href: "/partners/" },
  { label: "FAQ",        href: "/faq/" },
  { label: "Контакты",   href: "/contacts/" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [authOpen,    setAuthOpen]    = useState(false);
  const [calcOpen,    setCalcOpen]    = useState(false);
  const [scrolled,    setScrolled]    = useState(false);
  const [session,     setSession]     = useState<SessionInfo>({ authed: false, firstName: null, lastName: null });
  const [cartCount,   setCartCount]   = useState(0);
  const [favCount,    setFavCount]    = useState(0);
  const catalogRef = useRef<HTMLDivElement>(null);

  /* auth + cart + favs fetch (with event-bus refresh) */
  useEffect(() => {
    const refreshCart = () =>
      fetch("/api/cart")
        .then(r => r.ok ? r.json() : { items: [] })
        .then(c => setCartCount((c.items ?? []).length))
        .catch(() => {});
    const refreshFavs = () =>
      fetch("/api/favorites")
        .then(r => r.ok ? r.json() : { ids: [] })
        .then(f => setFavCount((f.ids ?? []).length))
        .catch(() => {});

    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.authed) {
          setSession({ authed: true, firstName: d.firstName, lastName: d.lastName });
          refreshCart();
          refreshFavs();
        }
      })
      .catch(() => {});

    // Подписываемся на события — счётчики обновляются сразу при добавлении.
    const unsubCart = onCartChanged(refreshCart);
    const unsubFavs = onFavoritesChanged(refreshFavs);
    return () => { unsubCart(); unsubFavs(); };
  }, []);

  /* Subtle elevation on scroll (fintech-style) */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Close menus on route change */
  useEffect(() => {
    setCatalogOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  const handleAuthSuccess = () => {
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.authed) setSession({ authed: true, firstName: d.firstName, lastName: d.lastName }); })
      .catch(() => {});
  };

  /* Outside click for catalog dropdown */
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (catalogRef.current && !catalogRef.current.contains(e.target as Node)) setCatalogOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  /* Esc closes everything */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCatalogOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-50">
      {/* ════════ TOP INFO BAR ════════ */}
      <div className="hidden lg:block bg-[#0A1628] text-white/80 text-[12px]">
        <div className="section flex items-center h-9 justify-between">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <PinIcon /> {COMPANY.city}
            </span>
            <span className="text-white/30">·</span>
            <span className="flex items-center gap-1.5">
              <ClockIcon /> {COMPANY.hours}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={COMPANY.phoneTel}
              className="flex items-center gap-1.5 font-semibold text-white hover:text-[#C8972B] transition-colors mr-1"
            >
              <PhoneIcon /> {COMPANY.phone}
            </a>
            <a
              href={COMPANY.whatsapp}
              target="_blank"
              rel="noopener"
              aria-label="WhatsApp"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-white/55 hover:text-white hover:bg-white/10 transition-colors"
            >
              <WhatsAppIcon />
            </a>
            <a
              href={COMPANY.telegram}
              target="_blank"
              rel="noopener"
              aria-label="Telegram"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-white/55 hover:text-white hover:bg-white/10 transition-colors"
            >
              <TelegramIcon />
            </a>
          </div>
        </div>
      </div>

      {/* ════════ MAIN HEADER ════════ */}
      <div
        className="bg-white transition-shadow duration-300"
        style={{
          borderBottom: scrolled ? "1px solid transparent" : "1px solid #EBEBEB",
          boxShadow:    scrolled ? "0 2px 16px rgba(10,22,40,0.08)" : "none",
        }}
      >
        <div className="section flex items-center h-16 gap-5">

          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0 group transition-transform">
            <FinniceLogo size={34} variant="wordmark" className="group-hover:opacity-90 transition-opacity" />
          </Link>

          {/* Center nav (desktop) */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {/* Каталог: текст ведёт на /catalog, стрелка раскрывает дропдаун */}
            <div className="relative" ref={catalogRef}>
              {(() => {
                const isCatalogActive = pathname?.startsWith("/catalog") || pathname?.startsWith("/product");
                const isHighlighted = catalogOpen || isCatalogActive;
                const baseStyle = isHighlighted
                  ? { background: "linear-gradient(135deg, #0C7A58, #0a6449)", boxShadow: "0 2px 8px rgba(12,122,88,0.25)" }
                  : undefined;
                const baseClass = `flex items-center rounded-full text-[14px] font-semibold transition-all overflow-hidden ${
                  isHighlighted
                    ? "text-white shadow-md"
                    : "text-[#374151] hover:text-[#0A1628] hover:bg-[#F4F7FC]"
                }`;
                return (
                  <div className={baseClass} style={baseStyle}>
                    <Link
                      href="/catalog"
                      onClick={() => setCatalogOpen(false)}
                      className="pl-4 pr-2 py-2"
                    >
                      Каталог
                    </Link>
                    <button
                      onClick={() => setCatalogOpen(v => !v)}
                      aria-expanded={catalogOpen}
                      aria-label={catalogOpen ? "Скрыть категории" : "Показать категории"}
                      className="pr-3 pl-1 py-2 transition-opacity hover:opacity-80"
                    >
                      <ChevronIcon open={catalogOpen} />
                    </button>
                  </div>
                );
              })()}

              {catalogOpen && (
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white rounded-2xl overflow-hidden"
                  style={{
                    width: 640,
                    boxShadow: "0 16px 48px rgba(10,22,40,0.18), 0 4px 16px rgba(10,22,40,0.08)",
                    border:    "1px solid #EBEBEB",
                  }}
                >
                  <div className="p-2 grid grid-cols-2 gap-1">
                    <Link
                      href="/catalog/"
                      className="col-span-2 flex items-center justify-between px-4 py-3 rounded-xl text-[14px] font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #0C7A58, #0a6449)" }}
                    >
                      <span className="flex items-center gap-2">
                        <CatalogGridIcon /> Весь каталог
                      </span>
                      <ArrowRightIcon />
                    </Link>
                    {CATALOG_CATS.map((c) => (
                      <Link
                        key={c.href}
                        href={c.href}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-[#0A1628]
                                   hover:bg-[#F4F7FC] transition-colors"
                      >
                        <span
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[14px] shrink-0"
                          style={{ background: "linear-gradient(135deg, #F4F7FC, #E5EBF5)" }}
                        >
                          {CATEGORY_EMOJI[c.cat] || "📦"}
                        </span>
                        <span className="truncate">{c.label}</span>
                      </Link>
                    ))}
                  </div>
                  <div className="px-4 py-3 border-t border-[#F3F4F6] bg-[#FAFBFC] text-[11px] text-[#6B7280]">
                    Все категории · {COMPANY.region}
                  </div>
                </div>
              )}
            </div>

            {TOP_NAV.map((l) => {
              /* Нормализуем оба пути (убираем trailing slash), затем сравниваем
                 точно или по префиксу + "/" — чтобы /company матчилось,
                 а /companion НЕ матчилось */
              const norm    = (s: string) => s.replace(/\/+$/, "") || "/";
              const cur     = norm(pathname || "");
              const target  = norm(l.href);
              const isActive = cur === target || cur.startsWith(target + "/");
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`px-4 py-2 rounded-full text-[14px] font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? "text-white shadow-md"
                      : "text-[#374151] hover:text-[#0A1628] hover:bg-[#F4F7FC]"
                  }`}
                  style={isActive
                    ? { background: "linear-gradient(135deg, #0C7A58, #0a6449)", boxShadow: "0 2px 8px rgba(12,122,88,0.25)" }
                    : undefined}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="ml-auto lg:ml-0 flex items-center gap-1.5 shrink-0">

            {/* Favorites */}
            <Link
              href="/favorites"
              aria-label="Избранное"
              className="w-9 h-9 flex items-center justify-center rounded-full relative
                         text-[#6B7280] hover:bg-[#F4F7FC] hover:text-[#0A1628] transition-colors"
            >
              <HeartIcon />
              {favCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#DC2626] text-white
                                 text-[8px] font-black rounded-full flex items-center justify-center
                                 ring-2 ring-white">
                  {favCount > 9 ? "9+" : favCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              aria-label="Корзина"
              className="w-9 h-9 flex items-center justify-center rounded-full relative
                         text-[#6B7280] hover:bg-[#F4F7FC] hover:text-[#0A1628] transition-colors"
            >
              <CartIcon />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#0C7A58] text-white
                                 text-[8px] font-black rounded-full flex items-center justify-center
                                 ring-2 ring-white">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>

            {/* Login / LK */}
            {session.authed ? (
              <Link
                href="/lk"
                aria-label="Личный кабинет"
                className="hidden sm:flex items-center gap-1.5 px-4 h-9 text-[13px] font-bold text-white rounded-full ml-1
                           transition-opacity hover:opacity-90 whitespace-nowrap"
                style={{ background: "linear-gradient(135deg, #0C7A58, #0a6449)" }}
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold text-[#0C7A58] bg-white"
                >
                  {getInitials(session.firstName, session.lastName) ?? "К"}
                </span>
                {session.firstName ?? "Кабинет"}
              </Link>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                aria-label="Войти"
                className="hidden sm:flex items-center px-4 h-9 text-[13px] font-semibold text-[#0A1628]
                           border border-[#D8E2F0] rounded-full ml-1 hover:border-[#0A1628] hover:bg-[#F4F7FC] transition-colors"
              >
                Войти
              </button>
            )}

            {/* Calculator (mobile only) */}
            <button
              onClick={() => setCalcOpen(true)}
              aria-label="Калькулятор"
              className="lg:hidden flex items-center gap-1 px-3 h-9 rounded-full text-white text-[12px] font-semibold whitespace-nowrap transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #0C7A58, #0a6449)" }}
            >
              <CalcIcon /> Калькулятор
            </button>

            {/* Mobile burger */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              aria-label="Меню"
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full
                         text-[#0A1628] hover:bg-[#F4F7FC] transition-colors"
            >
              {mobileOpen ? <CloseIcon /> : <BurgerIcon />}
            </button>
          </div>
        </div>

        {/* ════════ MOBILE CONTACTS ROW ════════
            Виден только на mobile (lg:hidden). Содержит:
            телефон (звонок), WhatsApp, Telegram и кнопку Войти/ЛК.
            Это вынос топ-инфо-бара (который скрыт на mobile) — чтобы
            ключевые контакты были на виду без burger-меню. */}
        <div className="lg:hidden border-t border-[#EBEBEB] bg-[#F9FAFB]">
          <div className="section flex items-center justify-between gap-2 h-11">
            <a
              href={COMPANY.phoneTel}
              className="flex items-center gap-1.5 text-[12px] font-bold text-[#0A1628]"
            >
              <PhoneIcon /> {COMPANY.phone}
            </a>
            <div className="flex items-center gap-1.5">
              <a
                href={COMPANY.whatsapp}
                target="_blank"
                rel="noopener"
                aria-label="WhatsApp"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6B7280] hover:text-[#0A1628] hover:bg-[#F4F7FC] transition-colors"
              >
                <WhatsAppIcon />
              </a>
              <a
                href={COMPANY.telegram}
                target="_blank"
                rel="noopener"
                aria-label="Telegram"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6B7280] hover:text-[#0A1628] hover:bg-[#F4F7FC] transition-colors"
              >
                <TelegramIcon />
              </a>
              {session.authed ? (
                <Link
                  href="/lk"
                  className="flex items-center gap-1 ml-1 px-3 h-7 text-[11px] font-bold text-white rounded-full"
                  style={{ background: "linear-gradient(135deg, #0C7A58, #0a6449)" }}
                >
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-extrabold text-[#0C7A58] bg-white"
                  >
                    {getInitials(session.firstName, session.lastName) ?? "К"}
                  </span>
                  {session.firstName ?? "Кабинет"}
                </Link>
              ) : (
                <button
                  onClick={() => setAuthOpen(true)}
                  className="ml-1 px-3 h-7 text-[11px] font-bold text-white rounded-full transition-opacity hover:opacity-90 active:scale-95"
                  style={{ background: "linear-gradient(135deg, #0C7A58, #0a6449)" }}
                >
                  Войти
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile slide-down ──────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden bg-white px-5 pt-2 pb-4 border-b border-[#EBEBEB]">
          <button
            onClick={() => { setMobileOpen(false); setCalcOpen(true); }}
            className="flex items-center gap-2 py-3.5 text-[15px] font-semibold text-[#0C7A58]
                       border-b border-[#F3F4F6] w-full text-left"
          >
            <CalcIcon /> Калькулятор рассрочки
          </button>

          {/* Catalog with sub-list */}
          <details className="border-b border-[#F3F4F6]">
            <summary className="flex items-center justify-between py-3.5 text-[15px] font-medium text-[#0A1628] cursor-pointer list-none">
              Каталог <ChevronIcon open={false} />
            </summary>
            <ul className="pb-2">
              <li>
                <Link
                  href="/catalog/"
                  onClick={() => setMobileOpen(false)}
                  className="block py-2 pl-3 text-[14px] font-bold text-[#0C7A58]"
                >
                  Весь каталог →
                </Link>
              </li>
              {CATALOG_CATS.map((c) => (
                <li key={c.href}>
                  <Link
                    href={c.href}
                    onClick={() => setMobileOpen(false)}
                    className="block py-2 pl-3 text-[14px] text-[#374151]"
                  >
                    {CATEGORY_EMOJI[c.cat] || "·"} {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </details>

          {TOP_NAV.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center py-3.5 text-[15px] font-medium text-[#0A1628]
                         border-b border-[#F3F4F6] hover:text-[#1A3C6E] transition-colors"
            >
              {l.label}
            </Link>
          ))}

          {/* Phone + socials block */}
          <div className="mt-4 pt-3 border-t border-[#F3F4F6] flex items-center justify-between gap-2">
            <a
              href={COMPANY.phoneTel}
              className="flex items-center gap-2 py-2 text-[14px] font-bold text-[#0A1628]"
            >
              <PhoneIcon /> {COMPANY.phone}
            </a>
            <div className="flex items-center gap-2">
              <a
                href={COMPANY.whatsapp}
                target="_blank"
                rel="noopener"
                aria-label="WhatsApp"
                className="w-9 h-9 flex items-center justify-center rounded-xl text-[#6B7280] hover:text-[#0A1628] hover:bg-[#F4F7FC] transition-colors"
              >
                <WhatsAppIcon />
              </a>
              <a
                href={COMPANY.telegram}
                target="_blank"
                rel="noopener"
                aria-label="Telegram"
                className="w-9 h-9 flex items-center justify-center rounded-xl text-[#6B7280] hover:text-[#0A1628] hover:bg-[#F4F7FC] transition-colors"
              >
                <TelegramIcon />
              </a>
            </div>
          </div>

          {/* Login / LK */}
          {session.authed ? (
            <Link
              href="/lk"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 mt-3 py-3 w-full rounded-full
                         text-white text-sm font-bold"
              style={{ background: "linear-gradient(135deg, #0C7A58, #0a6449)" }}
            >
              {session.firstName ? `Кабинет · ${session.firstName}` : "Личный кабинет"}
            </Link>
          ) : (
            <button
              onClick={() => { setMobileOpen(false); setAuthOpen(true); }}
              className="flex items-center justify-center gap-2 mt-3 py-3 w-full rounded-full
                         text-white text-sm font-bold"
              style={{ background: "linear-gradient(135deg, #0C7A58, #0a6449)" }}
            >
              <UserIcon />
              Войти в кабинет
            </button>
          )}
        </div>
      )}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onSuccess={handleAuthSuccess} />
      <CalculatorModal open={calcOpen} onClose={() => setCalcOpen(false)} />
    </header>
  );
}

/* ── Category emoji map ─────────────────────────────────────── */
const CATEGORY_EMOJI: Record<string, string> = {
  telefony:           "📱",
  planshety:          "📲",
  aksessuary:         "🎧",
  noutbuki:           "💻",
  smart_chasy:        "⌚",
  gadzety_i_konsoli:  "🎮",
  televizory:         "📺",
  bytovaya_tekhnika:  "🧺",
  konditsionery:      "❄️",
  mebel:              "🛋",
  detskie_tovary:     "🧸",
  dlya_doma_i_sada:   "🪴",
  posuda_i_kukhnya:   "🍳",
};

/* ════════ Icons ═══════════════════════════════════════════════ */
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
         style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
      <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 7h8m-3-3l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function CatalogGridIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}
function PinIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
      <path d="M6 11s4-3.5 4-6.5a4 4 0 10-8 0C2 7.5 6 11 6 11z" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="6" cy="4.5" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M6 3.5V6l1.8 1.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}
function WhatsAppIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
      <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
    </svg>
  );
}
function TelegramIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13" />
      <path d="M22 2L15 22L11 13L2 9L22 2Z" />
    </svg>
  );
}
function CalcIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="3" width="14" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="6" y1="7"  x2="14" y2="7"  stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="6" y1="11" x2="9"  y2="11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="6" y1="14" x2="9"  y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="11" y1="11" x2="14" y2="11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="11" y1="14" x2="14" y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}
function BurgerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <line x1="2" y1="5"  x2="16" y2="5"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="2" y1="9"  x2="16" y2="9"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="2" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="14" y1="2" x2="2"  y2="14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}
function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M3 3h1.5l2.5 9h8l2-6H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="9"  cy="16.5" r="1.3" fill="currentColor"/>
      <circle cx="15" cy="16.5" r="1.3" fill="currentColor"/>
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M10 17S3 12.5 3 7a4 4 0 017-2.66A4 4 0 0117 7c0 5.5-7 10-7 10z"
            stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M2 2.5A1.5 1.5 0 013.5 1h.6a1 1 0 01.95.688l.6 1.8a1 1 0 01-.23 1.04l-.7.7S5.5 7 8.5 8.5l.7-.7a1 1 0 011.04-.23l1.8.6A1 1 0 0113 9.1v.9A1.5 1.5 0 0111.5 11.5C5.1 11.5 1 7.4 1 2.5L2 2.5z"
            stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  );
}
