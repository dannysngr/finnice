"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { COMPANY, NAV_LINKS, CATALOG_CATS } from "@/lib/data";
import { AuthModal } from "@/components/AuthModal";

export function SiteHeader() {
  const [catalogOpen,       setCatalogOpen]       = useState(false);
  const [mobileCatalogOpen, setMobileCatalogOpen] = useState(false);
  const [mobileOpen,        setMobileOpen]        = useState(false);
  const [authOpen,          setAuthOpen]          = useState(false);
  const desktopMenuRef = useRef<HTMLDivElement>(null);

  // Закрываем десктопное меню по клику снаружи
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (desktopMenuRef.current && !desktopMenuRef.current.contains(e.target as Node)) {
        setCatalogOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Блокируем скролл страницы когда мобильный каталог открыт
  useEffect(() => {
    document.body.style.overflow = mobileCatalogOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileCatalogOpen]);

  function toggleMobileCatalog() {
    setMobileCatalogOpen((v) => !v);
    setMobileOpen(false);     // закрываем бургер-меню если открыт
  }
  function toggleMobileMenu() {
    setMobileOpen((v) => !v);
    setMobileCatalogOpen(false); // закрываем каталог если открыт
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#D8E2F0] shadow-sm">

      {/* ── Row 1 ────────────────────────────────────────────── */}
      <div className="section flex items-center gap-3 h-16">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 mr-2">
          <div className="w-8 h-8 rounded-lg grad-main flex items-center justify-center">
            <span className="text-white font-extrabold text-sm leading-none">NF</span>
          </div>
          <span className="font-extrabold text-[#0A1628] text-lg tracking-tight">{COMPANY.name}</span>
        </Link>

        {/* ── Десктопная кнопка «Каталог» + выпадающее меню ── */}
        <div className="relative hidden lg:block" ref={desktopMenuRef}>
          <div className="flex items-center rounded-full border-2 border-[#0A1628] overflow-hidden
                          hover:bg-[#0A1628] hover:text-white transition-colors group">
            <Link
              href="/catalog/"
              className="flex items-center gap-2 pl-4 pr-3 py-2 text-[#0A1628] font-semibold text-sm
                         group-hover:text-white transition-colors"
            >
              <BurgerIcon />
              Каталог
            </Link>
            <button
              onClick={() => setCatalogOpen(!catalogOpen)}
              aria-label="Открыть меню категорий"
              className="px-2 py-2 text-[#0A1628] group-hover:text-white transition-colors
                         border-l border-[#0A1628]/20"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {catalogOpen && (
            <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl
                            shadow-[0_8px_40px_rgba(0,0,0,0.14)] border border-[#D8E2F0] z-50 p-3">
              <div className="grid grid-cols-2 gap-0.5">
                {CATALOG_CATS.map((cat) => (
                  <Link
                    key={cat.label}
                    href={cat.href}
                    onClick={() => setCatalogOpen(false)}
                    className="px-3 py-2 rounded-xl text-sm font-medium text-[#0A1628]
                               hover:bg-[#EBF0F9] hover:text-[#1A3C6E] transition-colors"
                  >
                    {cat.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Мобильная кнопка «Каталог» (только < lg) ── */}
        <button
          onClick={toggleMobileCatalog}
          aria-label="Открыть каталог"
          aria-expanded={mobileCatalogOpen}
          className={`lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2
                      font-semibold text-xs transition-colors shrink-0
                      ${mobileCatalogOpen
                        ? "bg-[#0A1628] border-[#0A1628] text-white"
                        : "border-[#0A1628] text-[#0A1628] hover:bg-[#0A1628] hover:text-white"}`}
        >
          {mobileCatalogOpen ? <CloseIcon /> : <GridIcon />}
          Каталог
        </button>

        {/* Строка поиска (md+) */}
        <div className="flex-1 max-w-xl hidden md:flex">
          <div className="flex w-full rounded-full border border-[#D8E2F0] overflow-hidden
                          focus-within:border-[#1A3C6E] focus-within:ring-2 focus-within:ring-[#1A3C6E]/20 transition-all">
            <input
              type="search"
              placeholder="Поиск"
              className="flex-1 px-5 py-2.5 text-sm text-[#0A1628] outline-none bg-transparent"
            />
            <button className="px-5 bg-[#1A3C6E] hover:bg-[#0E2344] transition-colors flex items-center justify-center">
              <SearchIcon />
            </button>
          </div>
        </div>

        {/* Иконки справа */}
        <div className="ml-auto flex items-center gap-4">
          <Link href="#" className="hidden sm:flex flex-col items-center gap-0.5 text-[#6B7280] hover:text-[#1A3C6E] transition-colors">
            <HeartIcon />
            <span className="text-[10px] leading-none">Избранное</span>
          </Link>
          <button
            onClick={() => setAuthOpen(true)}
            className="hidden sm:flex flex-col items-center gap-0.5 text-[#6B7280]
                       hover:text-[#1A3C6E] transition-colors"
          >
            <UserIcon />
            <span className="text-[10px] leading-none">Войти</span>
          </button>
          {/* Бургер-кнопка (только < lg) */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 text-[#0A1628]"
            aria-label="Меню"
          >
            <BurgerIcon />
          </button>
        </div>
      </div>

      {/* ── Row 2 — вторичная навигация (десктоп) ───────────── */}
      <div className="hidden lg:block border-t border-[#F3F4F6] bg-[#FAFAFA]">
        <div className="section flex items-center justify-between h-10">
          <nav className="flex items-center gap-6">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-[#4B5563] hover:text-[#1A3C6E] font-medium transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <a
            href={COMPANY.phoneTel}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full border-2 border-[#1A3C6E]
                       text-[#1A3C6E] text-sm font-bold hover:bg-[#1A3C6E] hover:text-white transition-colors"
          >
            <PhoneIcon />
            {COMPANY.phone}
          </a>
        </div>
      </div>

      {/* ── Мобильный каталог (overlay + панель) ─────────────── */}
      {mobileCatalogOpen && (
        <div className="lg:hidden fixed inset-0 top-16 z-40 flex flex-col">
          {/* Панель категорий */}
          <div className="bg-white border-b border-[#D8E2F0] shadow-xl px-4 pt-4 pb-5">
            <p className="text-[10px] text-[#9CA3AF] font-semibold uppercase tracking-widest mb-3 px-1">
              Категории
            </p>
            <div className="grid grid-cols-2 gap-2">
              {CATALOG_CATS.map((cat) => (
                <Link
                  key={cat.label}
                  href={cat.href}
                  onClick={() => setMobileCatalogOpen(false)}
                  className="flex items-center px-4 py-3.5 rounded-xl text-sm font-semibold
                             text-[#0A1628] bg-[#F4F7FC] hover:bg-[#EBF0F9] hover:text-[#1A3C6E]
                             transition-colors active:scale-95"
                >
                  {cat.label}
                </Link>
              ))}
            </div>
            <Link
              href="/catalog/"
              onClick={() => setMobileCatalogOpen(false)}
              className="mt-3 flex items-center justify-center gap-2 w-full py-3
                         rounded-xl border-2 border-[#1A3C6E] text-[#1A3C6E] text-sm font-bold
                         hover:bg-[#1A3C6E] hover:text-white transition-colors"
            >
              Весь каталог →
            </Link>
          </div>
          {/* Полупрозрачный backdrop — закрывает при клике */}
          <div
            className="flex-1 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileCatalogOpen(false)}
          />
        </div>
      )}

      {/* ── Мобильное бургер-меню ─────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#D8E2F0] bg-white px-4 py-4 space-y-1">
          <div className="flex w-full rounded-full border border-[#D8E2F0] overflow-hidden mb-4">
            <input type="search" placeholder="Поиск" className="flex-1 px-4 py-2.5 text-sm outline-none" />
            <button className="px-4 bg-[#1A3C6E] flex items-center justify-center"><SearchIcon /></button>
          </div>
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="block py-2.5 px-2 text-sm font-medium text-[#0A1628] border-b border-[#F3F4F6]
                         hover:text-[#1A3C6E] transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <a
            href={COMPANY.phoneTel}
            className="flex items-center justify-center gap-2 mt-3 py-3 rounded-full border-2 border-[#1A3C6E]
                       text-[#1A3C6E] text-sm font-bold"
          >
            <PhoneIcon />
            {COMPANY.phone}
          </a>
          <button
            onClick={() => { setMobileOpen(false); setAuthOpen(true); }}
            className="flex items-center justify-center gap-2 mt-2 py-3 w-full rounded-full
                       bg-[#0C7A58] text-white text-sm font-bold hover:bg-[#0a6449] transition-colors"
          >
            <UserIcon />
            Войти в кабинет
          </button>
        </div>
      )}
      {/* ── Auth Modal ───────────────────────────────────────── */}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

    </header>
  );
}

/* ── Icons ────────────────────────────────────────────────────── */
function BurgerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <line x1="2" y1="5"  x2="16" y2="5"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="2" y1="9"  x2="16" y2="9"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="2" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
/** Иконка сетки (2×2) для мобильной кнопки «Каталог» */
function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  );
}
/** Иконка × для активной кнопки «Каталог» */
function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <line x1="2" y1="2" x2="12" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="12" y1="2" x2="2" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="6.5" cy="6.5" r="5" stroke="white" strokeWidth="1.5"/>
      <line x1="10.5" y1="10.5" x2="13.5" y2="13.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 17S3 12.5 3 7a4 4 0 017-2.66A4 4 0 0117 7c0 5.5-7 10-7 10z"
            stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
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
