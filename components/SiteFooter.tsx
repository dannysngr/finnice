import Link from "next/link";
import { COMPANY } from "@/lib/data";
import { FinniceLogo } from "@/components/FinniceLogo";

const NAV = [
  { label: "О компании",  href: "/company/" },
  { label: "Блог",        href: "/blog/" },
  { label: "Вакансии",    href: "/info/vacancy/" },
  { label: "Партнеры",    href: "/partners/" },
  { label: "Политика",    href: "/politika/" },
] as const;

export function SiteFooter() {
  return (
    <footer className="bg-[#0a0f1e] border-t border-white/8">
      <div className="section py-8">

        {/* ── Row 1: Logo · Nav · Badges ──────────────────────── */}
        <div className="flex flex-col lg:flex-row items-center gap-6 justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <FinniceLogo size={30} variant="wordmark" color="white" />
          </Link>

          {/* Nav */}
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {NAV.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-sm text-white/45 hover:text-white transition-colors"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/catalog/"
              className="text-sm text-white/45 hover:text-white transition-colors"
            >
              Все категории
            </Link>
          </nav>

          {/* App badges — приложения в разработке */}
          <div className="flex items-center gap-2.5 shrink-0">
            <StoreBadge label="App Store"   sub="Скоро в" icon={<AppleIcon />} />
            <StoreBadge label="Google Play" sub="Скоро в" icon={<PlayIcon />}  />
          </div>
        </div>

        {/* ── Divider ─────────────────────────────────────────── */}
        <div className="border-t border-white/8 my-6" />

        {/* ── Row 2: Contacts · Social ────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* Contacts */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-5 gap-y-2">
            <a
              href={COMPANY.phoneTel}
              className="flex items-center gap-1.5 text-sm text-white/45 hover:text-white transition-colors"
            >
              <PhoneIcon />
              {COMPANY.phone}
            </a>
            <a
              href={`mailto:${COMPANY.email}`}
              className="flex items-center gap-1.5 text-sm text-white/45 hover:text-white transition-colors"
            >
              <MailIcon />
              {COMPANY.email}
            </a>
            <span className="flex items-center gap-1.5 text-sm text-white/30">
              <PinIcon />
              {COMPANY.address}
            </span>
          </div>

          {/* Social */}
          <div className="flex items-center gap-2">
            {[
              { label: "Telegram",  Icon: TgIcon },
              { label: "ВКонтакте", Icon: VkIcon },
              { label: "WhatsApp",  Icon: WaIcon },
            ].map(({ label, Icon }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="w-8 h-8 rounded-full flex items-center justify-center
                           transition-colors hover:bg-white/15"
                style={{ background: "rgba(255,255,255,0.07)" }}
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>

        {/* ── Bottom bar ──────────────────────────────────────── */}
        <div className="border-t border-white/8 mt-6 pt-5 flex flex-col sm:flex-row
                        items-center justify-between gap-2">
          <p className="text-xs text-white/25">
            © {new Date().getFullYear()} {COMPANY.legalName}. Исламская рассрочка в Чеченской Республике.
          </p>
          <p className="text-xs text-white/20">
            {COMPANY.hours}
          </p>
        </div>

      </div>
    </footer>
  );
}

/* ── StoreBadge ──────────────────────────────────────────────── */
function StoreBadge({
  label, sub, icon,
}: {
  label: string;
  sub: string;
  icon: React.ReactNode;
}) {
  /* Приложения пока в разработке — бейдж выключен (cursor-not-allowed,
     приглушённый, с лейблом «В разработке»). При появлении замените на <a>. */
  return (
    <div
      className="relative flex items-center gap-2 px-3.5 py-2.5 rounded-xl select-none"
      title="Мобильное приложение в разработке — ожидайте"
      style={{
        background: "rgba(255,255,255,0.05)",
        border:     "1px dashed rgba(255,255,255,0.18)",
        cursor:     "not-allowed",
        opacity:    0.7,
      }}
    >
      {icon}
      <div>
        <p className="text-[9px] text-white/40 leading-none">{sub}</p>
        <p className="text-xs font-semibold text-white/85 leading-tight">{label}</p>
      </div>
      <span
        className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wider text-[#0A1628]"
        style={{ background: "#C8972B" }}
      >
        В разработке
      </span>
    </div>
  );
}

/* ── Icons ───────────────────────────────────────────────────── */
function PhoneIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 13 13" fill="none">
      <path d="M2 2.5A1.5 1.5 0 013.5 1h.6a1 1 0 01.95.688l.6 1.8a1 1 0 01-.23 1.04l-.7.7S5.5 7 8.5 8.5l.7-.7a1 1 0 011.04-.23l1.8.6A1 1 0 0113 9.1v.9A1.5 1.5 0 0111.5 11.5C5.1 11.5 1 7.4 1 2.5L2 2.5z"
            stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  );
}
function MailIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 13 13" fill="none">
      <rect x="1" y="3" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M1 4.5l5.5 3.5L12 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  );
}
function PinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 13 13" fill="none">
      <path d="M6.5 1a4 4 0 014 4c0 3.5-4 7.5-4 7.5S2.5 8.5 2.5 5a4 4 0 014-4z" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="6.5" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  );
}
function TgIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path d="M12.5 2L1.5 6l4 1.5L12.5 2zm0 0L7 10l-1.5-2.5"
            stroke="rgba(255,255,255,0.7)" strokeWidth="1.1" strokeLinejoin="round"/>
    </svg>
  );
}
function VkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="rgba(255,255,255,0.7)">
      <path d="M7.2 9.7H8c.25 0 .37-.11.37-.36 0-.6.28-.9.85-.9.34 0 .67.22.97.67l.68 1.08c.14.22.3.32.5.32h.87c.46 0 .58-.26.33-.67l-.74-1.14c-.42-.64-.76-.96-1.01-.98.55-.21 1.07-.74 1.53-1.6.17-.32.09-.55-.24-.55h-.85c-.21 0-.35.1-.43.3-.38.82-.78 1.31-1.19 1.49a.29.29 0 01-.3-.06.59.59 0 01-.09-.35V5.1c0-.28-.1-.42-.32-.42H7.34c-.17 0-.29.09-.33.26l-.03.12c.33.08.5.36.5.84v1.97c0 .29-.14.44-.41.44-.67 0-1.35-.8-2.01-2.42-.12-.31-.24-.46-.39-.46H3.8c-.28 0-.42.12-.42.37 0 .09.02.19.05.31.47 1.34 1.07 2.38 1.79 3.13.65.67 1.31 1.01 1.99 1.01v-.33z"/>
    </svg>
  );
}
function WaIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path d="M7 1.5a5.5 5.5 0 00-4.6 8.55L1.5 12.5l2.6-.87A5.5 5.5 0 107 1.5z"
            stroke="rgba(255,255,255,0.7)" strokeWidth="1.1" strokeLinejoin="round"/>
      <path d="M4.5 6.5c.4.9 1.2 1.7 2.1 2.1l.7-.7c.18-.18.44-.18.62 0l.93.93c.18.18.18.44 0 .62l-.44.44C7.8 10.5 5 8.5 4.5 6.5l.44-.44c.18-.18.44-.18.62 0l.93.93"
            stroke="rgba(255,255,255,0.7)" strokeWidth="0.9" strokeLinecap="round"/>
    </svg>
  );
}
function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="rgba(255,255,255,0.85)">
      <path d="M13.46 9.5c-.02-1.81 1.48-2.7 1.55-2.74-.85-1.25-2.17-1.42-2.64-1.44-1.11-.12-2.19.66-2.76.66-.57 0-1.44-.64-2.37-.62-1.21.02-2.34.71-2.97 1.8C3.47 8.94 3.13 10.9 3.47 12.77c.24 1.42.74 2.86 1.49 3.81.5.62 1.23 1.34 2.1 1.3.85-.03 1.17-.54 2.2-.54 1.02 0 1.31.54 2.2.52.91-.02 1.54-.65 2.04-1.27a8.55 8.55 0 00.93-1.47c-1.64-.63-2.67-2.25-2.67-4.32z"/>
      <path d="M11.66 3.65C12.31 2.86 12.73 1.76 12.62.7c-.97.05-2.16.66-2.84 1.44-.62.73-1.16 1.86-1.02 2.95 1.08.08 2.19-.55 2.9-1.44z"/>
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
      <path d="M2.5 2l11.14 6.97L2.5 16V2z" fill="rgba(255,255,255,0.85)"/>
    </svg>
  );
}
