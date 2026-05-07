import Link from "next/link";
import {
  COMPANY, REP,
  FOOTER_COL1, FOOTER_COL2, FOOTER_COL3,
} from "@/lib/data";

export function SiteFooter() {
  return (
    <footer>

      {/* ── Pre-footer trust bar ─────────────────────────── */}
      <div className="bg-[#F4F7FC] border-t border-[#D8E2F0]">
        <div className="section py-8 flex flex-col md:flex-row items-center gap-6 justify-between">

          {/* Rep + tagline */}
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-[#EBF0F9] border-2 border-[#1A3C6E]
                            flex items-center justify-center shrink-0">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="10" r="6" stroke="#1A3C6E" strokeWidth="1.8"/>
                <path d="M3 27c0-6.075 4.925-11 11-11s11 4.925 11 11"
                      stroke="#1A3C6E" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p className="font-bold text-[#0A1628] text-base leading-snug">
                {COMPANY.slogan}
              </p>
              <p className="text-xs text-[#6B7280] mt-0.5">{REP.name} — {REP.title}</p>
              <Link href="/company/"
                    className="text-xs text-[#1A3C6E] underline underline-offset-2 mt-1 inline-block">
                Подробнее о нашем подходе
              </Link>
            </div>
          </div>

          {/* App badges */}
          <div className="flex items-center gap-3">
            <StoreBadge label="App Store"    sub="скачайте в" icon={<AppleIcon />} />
            <StoreBadge label="Google Play"  sub="скачайте в" icon={<PlayIcon />}  />
          </div>
        </div>
      </div>

      {/* ── Main body ────────────────────────────────────── */}
      <div className="bg-[#0A1628] text-white">
        <div className="section py-12">

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">

            {/* Компания */}
            <FooterCol heading="Компания" links={FOOTER_COL1} />

            {/* Информация */}
            <FooterCol heading="Информация" links={FOOTER_COL2} />

            {/* Помощь */}
            <FooterCol heading="Помощь" links={FOOTER_COL3} />

            {/* Контакты */}
            <div>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Контакты</p>
              <ul className="space-y-3 text-sm text-white/70">
                <li>
                  <a href={COMPANY.phoneTel}
                     className="hover:text-white transition-colors flex items-start gap-2">
                    <PhoneIcon className="shrink-0 mt-0.5"/>
                    {COMPANY.phone}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${COMPANY.email}`}
                     className="hover:text-white transition-colors flex items-start gap-2">
                    <MailIcon className="shrink-0 mt-0.5"/>
                    {COMPANY.email}
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <PinIcon className="shrink-0 mt-0.5"/>
                  {COMPANY.address}
                </li>
                <li className="flex items-start gap-2">
                  <ClockIcon className="shrink-0 mt-0.5"/>
                  {COMPANY.hours}
                </li>
              </ul>

              {/* Social */}
              <div className="flex items-center gap-2.5 mt-5">
                {[
                  { label: "Telegram",   Icon: TgIcon },
                  { label: "ВКонтакте",  Icon: VkIcon },
                  { label: "WhatsApp",   Icon: WaIcon },
                ].map(({ label, Icon }) => (
                  <a key={label} href="#" aria-label={label}
                     className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#1A3C6E]
                                flex items-center justify-center transition-colors">
                    <Icon />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 mt-10 pt-6
                          flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg grad-main flex items-center justify-center">
                <span className="text-white font-extrabold text-xs">NF</span>
              </div>
              <span className="font-extrabold text-white">{COMPANY.name}</span>
              <span className="text-white/30 text-xs">{COMPANY.legalName}</span>
            </div>
            <p className="text-xs text-white/35 text-center">
              © {new Date().getFullYear()} {COMPANY.legalName}. Исламская рассрочка в {COMPANY.region}.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ── Sub-components ──────────────────────────────────────────── */

function FooterCol({
  heading,
  links,
}: {
  heading: string;
  links: ReadonlyArray<{ label: string; href: string }>;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">{heading}</p>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href}
                  className="text-sm text-white/65 hover:text-white transition-colors">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StoreBadge({
  label, sub, icon,
}: {
  label: string;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <a href="#"
       className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/15
                  transition-colors rounded-xl border border-white/20 cursor-pointer">
      {icon}
      <div>
        <p className="text-[9px] text-white/55 leading-none">{sub}</p>
        <p className="text-sm font-semibold text-white leading-tight">{label}</p>
      </div>
    </a>
  );
}

/* ── Icons ───────────────────────────────────────────────────── */
function PhoneIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className={className}>
      <path d="M2 2.5A1.5 1.5 0 013.5 1h.6a1 1 0 01.95.688l.6 1.8a1 1 0 01-.23 1.04l-.7.7S5.5 7 8.5 8.5l.7-.7a1 1 0 011.04-.23l1.8.6A1 1 0 0113 9.1v.9A1.5 1.5 0 0111.5 11.5C5.1 11.5 1 7.4 1 2.5L2 2.5z"
            stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  );
}
function MailIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className={className}>
      <rect x="1" y="3" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M1 4.5l5.5 3.5L12 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  );
}
function PinIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className={className}>
      <path d="M6.5 1a4 4 0 014 4c0 3.5-4 7.5-4 7.5S2.5 8.5 2.5 5a4 4 0 014-4z" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="6.5" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  );
}
function ClockIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className={className}>
      <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M6.5 4v2.5l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}
function TgIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M12.5 2L1.5 6l4 1.5L12.5 2zm0 0L7 10l-1.5-2.5" stroke="white" strokeWidth="1.1" strokeLinejoin="round"/>
    </svg>
  );
}
function VkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="white">
      <path d="M7.2 9.7H8c.25 0 .37-.11.37-.36 0-.6.28-.9.85-.9.34 0 .67.22.97.67l.68 1.08c.14.22.3.32.5.32h.87c.46 0 .58-.26.33-.67l-.74-1.14c-.42-.64-.76-.96-1.01-.98.55-.21 1.07-.74 1.53-1.6.17-.32.09-.55-.24-.55h-.85c-.21 0-.35.1-.43.3-.38.82-.78 1.31-1.19 1.49a.29.29 0 01-.3-.06.59.59 0 01-.09-.35V5.1c0-.28-.1-.42-.32-.42H7.34c-.17 0-.29.09-.33.26l-.03.12c.33.08.5.36.5.84v1.97c0 .29-.14.44-.41.44-.67 0-1.35-.8-2.01-2.42-.12-.31-.24-.46-.39-.46H3.8c-.28 0-.42.12-.42.37 0 .09.02.19.05.31.47 1.34 1.07 2.38 1.79 3.13.65.67 1.31 1.01 1.99 1.01v-.33z"/>
    </svg>
  );
}
function WaIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1.5a5.5 5.5 0 00-4.6 8.55L1.5 12.5l2.6-.87A5.5 5.5 0 107 1.5z"
            stroke="white" strokeWidth="1.1" strokeLinejoin="round"/>
      <path d="M4.5 6.5c.4.9 1.2 1.7 2.1 2.1l.7-.7c.18-.18.44-.18.62 0l.93.93c.18.18.18.44 0 .62l-.44.44C7.8 10.5 5 8.5 4.5 6.5l.44-.44c.18-.18.44-.18.62 0l.93.93"
            stroke="white" strokeWidth="0.9" strokeLinecap="round"/>
    </svg>
  );
}
function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="white">
      <path d="M13.46 9.5c-.02-1.81 1.48-2.7 1.55-2.74-.85-1.25-2.17-1.42-2.64-1.44-1.11-.12-2.19.66-2.76.66-.57 0-1.44-.64-2.37-.62-1.21.02-2.34.71-2.97 1.8C3.47 8.94 3.13 10.9 3.47 12.77c.24 1.42.74 2.86 1.49 3.81.5.62 1.23 1.34 2.1 1.3.85-.03 1.17-.54 2.2-.54 1.02 0 1.31.54 2.2.52.91-.02 1.54-.65 2.04-1.27a8.55 8.55 0 00.93-1.47c-1.64-.63-2.67-2.25-2.67-4.32z"/>
      <path d="M11.66 3.65C12.31 2.86 12.73 1.76 12.62.7c-.97.05-2.16.66-2.84 1.44-.62.73-1.16 1.86-1.02 2.95 1.08.08 2.19-.55 2.9-1.44z"/>
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M2.5 2L10 9 2.5 16V2z" fill="#EA4335"/>
      <path d="M2.5 2l11.14 6.97L11.5 10.7 2.5 2z" fill="#FBBC04"/>
      <path d="M2.5 16l9.35-6.07L11.5 10.7 2.5 16z" fill="#34A853"/>
      <path d="M13.64 8.97L11.5 10.7l1.81 1.02c.45-.26.78-.73.78-1.24 0-.52-.33-.98-.78-1.23l-.03-.02.36.54z" fill="#4285F4"/>
    </svg>
  );
}
