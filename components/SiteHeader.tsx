"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { COMPANY } from "@/lib/data";
import { AuthModal } from "@/components/AuthModal";
import { CalculatorModal } from "@/components/CalculatorModal";

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

/* ── Top nav links ──────────────────────────────────────────── */
const TOP_NAV = [
  { label: "Каталог",   href: "/catalog/" },
  { label: "Смартфоны", href: "/catalog/?cat=smartphones" },
  { label: "Умра",      href: "/blog/umra-rassrochka/" },
  { label: "FAQ",       href: "/faq/" },
] as const;

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [authOpen,   setAuthOpen]   = useState(false);
  const [calcOpen,   setCalcOpen]   = useState(false);
  const [session,    setSession]    = useState<SessionInfo>({ authed: false, firstName: null, lastName: null });
  const [cartCount,  setCartCount]  = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);

  /* auth + cart fetch */
  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.authed) {
          setSession({ authed: true, firstName: d.firstName, lastName: d.lastName });
          fetch("/api/cart")
            .then(r => r.ok ? r.json() : { items: [] })
            .then(c => setCartCount((c.items ?? []).length));
        }
      })
      .catch(() => {});
  }, []);

  const handleAuthSuccess = () => {
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.authed) setSession({ authed: true, firstName: d.firstName, lastName: d.lastName }); })
      .catch(() => {});
  };

  /* close search on outside click */
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white" style={{ borderBottom: "1px solid #EBEBEB" }}>
      <div className="section flex items-center h-16 gap-6">

        {/* ── Logo ────────────────────────────────────────── */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #0E2344 0%, #1A3C6E 55%, #0C7A58 100%)" }}
          >
            <span className="text-white font-extrabold text-[11px] leading-none">NF</span>
          </div>
          <span className="font-extrabold text-[#0A1628] text-[17px] tracking-tight">
            {COMPANY.name}
          </span>
        </Link>

        {/* ── Center nav (desktop) ────────────────────────── */}
        <nav className="hidden lg:flex items-center gap-10 flex-1 justify-center">
          {TOP_NAV.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[14px] font-medium text-[#222] hover:text-[#1A3C6E]
                         transition-colors whitespace-nowrap"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* ── Right side ──────────────────────────────────── */}
        <div className="ml-auto lg:ml-0 flex items-center gap-1.5">

          {/* Search */}
          <div className="relative" ref={searchRef}>
            <button
              onClick={() => setSearchOpen(v => !v)}
              aria-label="Поиск"
              className="w-9 h-9 flex items-center justify-center rounded-full
                         text-[#6B7280] hover:bg-[#F5F5F5] transition-colors"
            >
              <SearchIcon />
            </button>
            {searchOpen && (
              <div className="absolute top-full right-0 mt-2 z-50" style={{ width: 280 }}>
                <div
                  className="flex overflow-hidden"
                  style={{
                    borderRadius:  50,
                    border:        "1.5px solid #e5e7eb",
                    boxShadow:     "0 4px 20px rgba(0,0,0,0.10)",
                  }}
                >
                  <input
                    autoFocus
                    type="search"
                    placeholder="Поиск товаров..."
                    className="flex-1 px-5 py-2.5 text-[13px] text-[#0A1628] outline-none bg-white"
                  />
                  <button
                    className="px-4 bg-[#0A1628] text-white flex items-center justify-center
                               hover:bg-[#1A3C6E] transition-colors shrink-0"
                  >
                    <SearchIconWhite />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Cart */}
          <Link
            href="/cart"
            aria-label="Корзина"
            className="w-9 h-9 flex items-center justify-center rounded-full relative
                       text-[#6B7280] hover:bg-[#F5F5F5] transition-colors"
          >
            <CartIcon />
            {cartCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#0C7A58] text-white
                               text-[8px] font-black rounded-full flex items-center justify-center">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </Link>

          {/* Login / LK — outline button */}
          {session.authed ? (
            <Link
              href="/lk"
              aria-label="Личный кабинет"
              className="hidden sm:flex items-center px-4 h-9 text-[13px] font-semibold
                         text-[#0A1628] border border-[#CFCFCF] rounded-lg ml-1
                         hover:border-[#0A1628] transition-colors whitespace-nowrap"
            >
              {getInitials(session.firstName, session.lastName) ?? "Кабинет"}
            </Link>
          ) : (
            <button
              onClick={() => setAuthOpen(true)}
              aria-label="Войти"
              className="hidden sm:flex items-center px-4 h-9 text-[13px] font-semibold
                         text-[#0A1628] border border-[#CFCFCF] rounded-lg ml-1
                         hover:border-[#0A1628] transition-colors"
            >
              Войти
            </button>
          )}

          {/* Calculator button — mobile only */}
          <button
            onClick={() => setCalcOpen(true)}
            aria-label="Калькулятор"
            className="lg:hidden flex items-center gap-1 px-3 h-9 rounded-full
                       text-white text-[12px] font-semibold whitespace-nowrap
                       transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #0C7A58, #0a6449)" }}
          >
            <CalcIcon /> Калькулятор
          </button>

          {/* Mobile burger */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Меню"
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full
                       text-[#0A1628] hover:bg-[#F5F5F5] transition-colors"
          >
            {mobileOpen ? <CloseIcon /> : <BurgerIcon />}
          </button>
        </div>
      </div>

      {/* ── Mobile slide-down ────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="lg:hidden bg-white px-5 pt-2 pb-4"
          style={{ borderBottom: "1px solid #EBEBEB" }}
        >
          {/* Calculator entry — mobile menu */}
          <button
            onClick={() => { setMobileOpen(false); setCalcOpen(true); }}
            className="flex items-center gap-2 py-3.5 text-[15px] font-semibold text-[#0C7A58]
                       border-b border-[#F3F4F6] w-full text-left"
          >
            <CalcIcon /> Калькулятор рассрочки
          </button>

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

          {/* Phone */}
          <a
            href={COMPANY.phoneTel}
            className="flex items-center gap-2 mt-3 py-2 text-[14px] font-medium text-[#6B7280]"
          >
            <PhoneIcon />
            {COMPANY.phone}
          </a>

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

      {/* ── Auth Modal ──────────────────────────────────────────── */}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onSuccess={handleAuthSuccess} />

      {/* ── Calculator Modal (mobile only entry, but works everywhere) ── */}
      <CalculatorModal open={calcOpen} onClose={() => setCalcOpen(false)} />
    </header>
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

/* ── Icons ──────────────────────────────────────────────────── */
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
function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="11.5" y1="11.5" x2="15.5" y2="15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function SearchIconWhite() {
  return (
    <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
      <circle cx="7.5" cy="7.5" r="5.5" stroke="white" strokeWidth="1.5"/>
      <line x1="11.5" y1="11.5" x2="15.5" y2="15.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
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
function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 13 13" fill="none">
      <path d="M2 2.5A1.5 1.5 0 013.5 1h.6a1 1 0 01.95.688l.6 1.8a1 1 0 01-.23 1.04l-.7.7S5.5 7 8.5 8.5l.7-.7a1 1 0 011.04-.23l1.8.6A1 1 0 0113 9.1v.9A1.5 1.5 0 0111.5 11.5C5.1 11.5 1 7.4 1 2.5L2 2.5z"
            stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  );
}
