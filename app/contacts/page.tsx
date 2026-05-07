import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY, REP } from "@/lib/data";

export const metadata: Metadata = {
  title:       `Контакты — ${COMPANY.name} | ${COMPANY.city}`,
  description: `Офис ${COMPANY.legalName} в г. ${COMPANY.city}. ${COMPANY.address}. Тел: ${COMPANY.phone}. График: ${COMPANY.hours}.`,
  keywords:    `контакты ФинНайс, ${COMPANY.city}, адрес офиса, исламская рассрочка ${COMPANY.city}`,
};

export default function ContactsPage() {
  return (
    <main>
      {/* ── Breadcrumb ── */}
      <div className="bg-[#F4F7FC] border-b border-[#D8E2F0]">
        <div className="section py-3 text-xs text-[#9CA3AF] flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#1A3C6E] transition-colors">Главная</Link>
          <span>/</span>
          <span className="text-[#0A1628]">Контакты</span>
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="py-14 bg-[#F4F7FC]">
        <div className="section">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-[#0A1628] mb-2">Контакты</h1>
          <p className="text-[#6B7280]">
            {COMPANY.legalName} — исламская рассрочка в Чеченской Республике
          </p>
        </div>
      </section>

      <div className="section py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left: contact cards ── */}
          <div className="lg:col-span-1 space-y-4">

            {/* Address */}
            <div className="card p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#EBF0F9] flex items-center justify-center shrink-0 text-xl">
                  📍
                </div>
                <div>
                  <h3 className="font-bold text-[#0A1628] text-sm mb-1">Адрес офиса</h3>
                  <p className="text-[#4B5563] text-sm leading-relaxed">{COMPANY.address}</p>
                  <p className="text-[#9CA3AF] text-xs mt-1">г. Грозный, Чеченская Республика</p>
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="card p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#EBF0F9] flex items-center justify-center shrink-0 text-xl">
                  📞
                </div>
                <div>
                  <h3 className="font-bold text-[#0A1628] text-sm mb-1">Телефон</h3>
                  <a href={COMPANY.phoneTel}
                     className="text-[#1A3C6E] font-semibold text-sm hover:underline">
                    {COMPANY.phone}
                  </a>
                  <p className="text-[#9CA3AF] text-xs mt-1">Звонки и WhatsApp</p>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="card p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#EBF0F9] flex items-center justify-center shrink-0 text-xl">
                  ✉️
                </div>
                <div>
                  <h3 className="font-bold text-[#0A1628] text-sm mb-1">Email</h3>
                  <a href={`mailto:${COMPANY.email}`}
                     className="text-[#1A3C6E] font-semibold text-sm hover:underline">
                    {COMPANY.email}
                  </a>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div className="card p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#EBF0F9] flex items-center justify-center shrink-0 text-xl">
                  🕐
                </div>
                <div>
                  <h3 className="font-bold text-[#0A1628] text-sm mb-1">График работы</h3>
                  <p className="text-[#4B5563] text-sm">{COMPANY.hours}</p>
                  <p className="text-[#9CA3AF] text-xs mt-1">Суббота и воскресенье — выходной</p>
                </div>
              </div>
            </div>

            {/* Rep card */}
            <div className="card p-6 border-[#1A3C6E]/20 bg-[#EBF0F9]/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-[#EBF0F9] border-2 border-[#1A3C6E]
                                flex items-center justify-center text-xl shrink-0">
                  👤
                </div>
                <div>
                  <p className="font-bold text-[#0A1628] text-sm">{REP.name}</p>
                  <p className="text-xs text-[#6B7280]">{REP.title}</p>
                </div>
              </div>
              <p className="text-xs text-[#4B5563] leading-relaxed italic">
                &ldquo;{REP.quote}&rdquo;
              </p>
            </div>
          </div>

          {/* ── Right: map + social ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* ── Yandex Maps iframe ── */}
            <div className="rounded-3xl overflow-hidden border border-[#D8E2F0] h-80 md:h-[420px]">
              <iframe
                src="https://yandex.ru/map-widget/v1/?text=%D0%93%D1%80%D0%BE%D0%B7%D0%BD%D1%8B%D0%B9%2C+%D1%83%D0%BB.+%D0%9E%D1%80%D0%B7%D0%B0%D0%BC%D0%B8%D0%B5%D0%B2%D0%B0%2C+8&z=17&l=map&lang=ru_RU"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="ФинНайс на карте — г. Грозный, ул. Орзамиева, 8"
              />
            </div>

            {/* External map link */}
            <div className="flex items-center justify-between bg-[#F4F7FC] rounded-2xl px-5 py-4">
              <div>
                <p className="font-bold text-[#0A1628] text-sm">{COMPANY.address}</p>
                <p className="text-[#6B7280] text-xs mt-0.5">г. Грозный, Чеченская Республика</p>
              </div>
              <a
                href="https://yandex.ru/maps/?text=%D0%93%D1%80%D0%BE%D0%B7%D0%BD%D1%8B%D0%B9%2C+%D1%83%D0%BB.+%D0%9E%D1%80%D0%B7%D0%B0%D0%BC%D0%B8%D0%B5%D0%B2%D0%B0%2C+8"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-sm whitespace-nowrap"
              >
                Открыть карту →
              </a>
            </div>

            {/* Social */}
            <div className="card p-6">
              <h2 className="text-lg font-extrabold text-[#0A1628] mb-4">Мы в соцсетях</h2>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: "Telegram",  icon: "✈️",  color: "bg-[#229ED9]" },
                  { label: "ВКонтакте", icon: "🔵",  color: "bg-[#4C75A3]" },
                  { label: "WhatsApp",  icon: "💬",  color: "bg-[#25D366]" },
                  { label: "Instagram", icon: "📸",  color: "bg-gradient-to-br from-[#F58529] to-[#DD2A7B]" },
                ].map((s) => (
                  <a key={s.label} href="#"
                     className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-white
                                 font-semibold text-sm transition-opacity hover:opacity-90 ${s.color}`}>
                    <span>{s.icon}</span>
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA strip ── */}
      <section className="py-12 bg-[#0A1628]">
        <div className="section text-center">
          <h2 className="text-2xl font-extrabold text-white mb-3">
            Остались вопросы?
          </h2>
          <p className="text-white/60 text-sm mb-6 max-w-md mx-auto">
            Позвоните нам или оставьте заявку — менеджер ответит в течение 15 минут.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href={COMPANY.phoneTel} className="btn-primary px-8 py-3">
              {COMPANY.phone}
            </a>
            <Link href="/#calculator" className="btn-white px-8 py-3">
              Рассчитать рассрочку
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
