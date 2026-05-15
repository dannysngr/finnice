import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY } from "@/lib/data";
import { Phone, MessageCircle, Send, MapPin, Clock, Mail, Camera } from "lucide-react";

export const metadata: Metadata = {
  title:       `Контакты — ${COMPANY.name} | ${COMPANY.city}`,
  description: `Офис ${COMPANY.legalName} в г. ${COMPANY.city}. ${COMPANY.address}. Тел: ${COMPANY.phone}. График: ${COMPANY.hours}.`,
  keywords:    `контакты Финнайс, ${COMPANY.city}, адрес офиса, исламская рассрочка ${COMPANY.city}`,
};

export default function ContactsPage() {
  return (
    <main className="bg-white">
      <div className="bg-[#F4F7FC] border-b border-[#D8E2F0]">
        <div className="section py-3 text-xs text-[#9CA3AF] flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#1A3C6E] transition-colors">Главная</Link>
          <span>/</span>
          <span className="text-[#0A1628]">Контакты</span>
        </div>
      </div>

      {/* Hero — premium dark */}
      <section className="relative overflow-hidden"
               style={{ background: "#0A1628" }}>
        <div className="absolute inset-0 opacity-30"
             style={{
               background: "radial-gradient(circle at 20% 80%, #3FCFA5 0%, transparent 50%), radial-gradient(circle at 80% 20%, #1A3C6E 0%, transparent 55%)",
             }} />
        <div className="absolute top-20 left-[8%] w-32 h-32 rounded-full opacity-25"
             style={{ background: "radial-gradient(circle, #3FCFA5, transparent)", filter: "blur(50px)" }} />
        <div className="absolute bottom-10 right-[10%] w-48 h-48 rounded-full opacity-20"
             style={{ background: "radial-gradient(circle, #C8972B, transparent)", filter: "blur(60px)" }} />

        <div className="section relative py-16 lg:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-[11px] uppercase tracking-widest font-bold text-[#3FCFA5] mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3FCFA5] animate-pulse"></span>
              На связи · {COMPANY.hours}
            </span>
            <h1 className="text-4xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-5">
              Свяжитесь<br/>
              <span style={{ background: "linear-gradient(90deg, #3FCFA5, #ffffff)",
                             WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                с нами
              </span>
            </h1>
            <p className="text-white/75 text-lg lg:text-xl leading-relaxed max-w-2xl">
              Звоните, пишите в мессенджеры или заходите в офис в Грозном.
              Менеджер отвечает в течение 15 минут в рабочее время.
            </p>
          </div>
        </div>
      </section>

      {/* Quick contact strip */}
      <section className="relative -mt-8 z-10">
        <div className="section max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a href={COMPANY.phoneTel}
               className="group bg-white rounded-2xl p-5 border border-[#E5E7EB] flex items-center gap-3 transition-all hover:border-[#0C7A58]/40 hover:shadow-lg hover:-translate-y-0.5">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                   style={{ background: "linear-gradient(135deg, #0E2344, #1A3C6E)" }}>
                <Phone className="w-5 h-5 text-white" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-bold">Позвонить</p>
                <p className="font-extrabold text-[#0A1628] truncate">{COMPANY.phone}</p>
              </div>
            </a>
            <a href={COMPANY.whatsapp} target="_blank" rel="noopener"
               className="group bg-white rounded-2xl p-5 border border-[#E5E7EB] flex items-center gap-3 transition-all hover:border-[#25D366]/40 hover:shadow-lg hover:-translate-y-0.5">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                   style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}>
                <MessageCircle className="w-5 h-5 text-white" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-bold">WhatsApp</p>
                <p className="font-extrabold text-[#0A1628]">Написать сейчас</p>
              </div>
            </a>
            <a href={COMPANY.telegram} target="_blank" rel="noopener"
               className="group bg-white rounded-2xl p-5 border border-[#E5E7EB] flex items-center gap-3 transition-all hover:border-[#2AABEE]/40 hover:shadow-lg hover:-translate-y-0.5">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                   style={{ background: "linear-gradient(135deg, #2AABEE, #229ED9)" }}>
                <Send className="w-5 h-5 text-white" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-bold">Telegram</p>
                <p className="font-extrabold text-[#0A1628]">Открыть чат</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      <section className="py-14 lg:py-20">
        <div className="section grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">

          {/* Info cards */}
          <div className="lg:col-span-1 space-y-3">

            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                     style={{ background: "linear-gradient(135deg, #ECFDF5, #D1FAE5)" }}>
                  <MapPin className="w-5 h-5 text-[#0C7A58]" strokeWidth={2.2} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#0C7A58] font-bold mb-1">Адрес</p>
                  <p className="font-bold text-[#0A1628] text-sm">{COMPANY.address}</p>
                  <p className="text-[#9CA3AF] text-xs mt-0.5">Чеченская Республика</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                     style={{ background: "linear-gradient(135deg, #FEF3C7, #FDE68A)" }}>
                  <Clock className="w-5 h-5 text-[#C8972B]" strokeWidth={2.2} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#C8972B] font-bold mb-1">График</p>
                  <p className="font-bold text-[#0A1628] text-sm">{COMPANY.hours}</p>
                  <p className="text-[#9CA3AF] text-xs mt-0.5">Сб–Вс — выходной</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                     style={{ background: "linear-gradient(135deg, #EBF0F9, #DBE7F5)" }}>
                  <Mail className="w-5 h-5 text-[#1A3C6E]" strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-[#1A3C6E] font-bold mb-1">Email</p>
                  <a href={`mailto:${COMPANY.email}`} className="font-bold text-[#0A1628] text-sm hover:text-[#1A3C6E] truncate block">
                    {COMPANY.email}
                  </a>
                  <p className="text-[#9CA3AF] text-xs mt-0.5">Для документов и заявок</p>
                </div>
              </div>
            </div>

          </div>

          {/* Map + social */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-3xl overflow-hidden border-2 border-[#E5E7EB] h-80 md:h-[480px] shadow-md">
              {/* ll=lon,lat — координаты дома; pt=lon,lat,pm2dgnl — зелёный пин.
                  text= не используем намеренно: он триггерит карточку
                  «улица ... · Организации в доме · Сообщить об ошибке». */}
              <iframe
                src="https://yandex.ru/map-widget/v1/?ll=45.679763%2C43.322269&z=17&l=map&pt=45.679763%2C43.322269%2Cpm2dgnl&lang=ru_RU"
                width="100%" height="100%" style={{ border: 0 }}
                allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                title="Финнайс на карте — г. Грозный, ул. Орзамиева, 8"
              />
            </div>

            <div className="flex items-center justify-between gap-3 bg-[#F4F7FC] rounded-2xl px-5 py-4 border border-[#D8E2F0]">
              <div>
                <p className="font-bold text-[#0A1628] text-sm">{COMPANY.address}</p>
                <p className="text-[#6B7280] text-xs mt-0.5">5 минут от центра Грозного</p>
              </div>
              <a href="https://yandex.ru/maps/?text=%D0%93%D1%80%D0%BE%D0%B7%D0%BD%D1%8B%D0%B9%2C+%D1%83%D0%BB.+%D0%9E%D1%80%D0%B7%D0%B0%D0%BC%D0%B8%D0%B5%D0%B2%D0%B0%2C+8"
                 target="_blank" rel="noopener noreferrer"
                 className="shrink-0 px-4 py-2.5 rounded-full text-sm font-bold text-white transition-opacity hover:opacity-90 whitespace-nowrap"
                 style={{ background: "linear-gradient(135deg, #0C7A58, #0a6449)" }}>
                Маршрут →
              </a>
            </div>

            {/* Social grid */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
              <h2 className="text-base font-extrabold text-[#0A1628] mb-4">Мы в соцсетях</h2>
              <div className="grid grid-cols-3 gap-2.5">
                <a href={COMPANY.telegram} target="_blank" rel="noopener noreferrer"
                   className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl text-white font-bold text-xs transition-transform hover:scale-105 active:scale-95"
                   style={{ background: "linear-gradient(135deg, #2AABEE, #229ED9)" }}>
                  <Send className="w-5 h-5" strokeWidth={2.2} /> Telegram
                </a>
                <a href={COMPANY.whatsapp} target="_blank" rel="noopener noreferrer"
                   className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl text-white font-bold text-xs transition-transform hover:scale-105 active:scale-95"
                   style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}>
                  <MessageCircle className="w-5 h-5" strokeWidth={2.2} /> WhatsApp
                </a>
                <a href={COMPANY.instagram} target="_blank" rel="noopener noreferrer"
                   className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl text-white font-bold text-xs transition-transform hover:scale-105 active:scale-95"
                   style={{ background: "linear-gradient(135deg, #F58529, #DD2A7B 60%, #8134AF)" }}>
                  <Camera className="w-5 h-5" strokeWidth={2.2} /> Instagram
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-[#0A1628] relative overflow-hidden">
        <div className="absolute inset-0 opacity-20"
             style={{ background: "radial-gradient(circle at 50% 50%, #0C7A58 0%, transparent 60%)" }} />
        <div className="section relative max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-white mb-3">
            Готовы оформить рассрочку?
          </h2>
          <p className="text-white/65 text-base mb-8 leading-relaxed">
            Рассчитайте платёж в калькуляторе или приезжайте в офис — оформим за 15 минут.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/#calculator"
                  className="px-6 py-3 rounded-full font-bold inline-flex items-center gap-2 bg-white text-[#0A1628] hover:bg-white/90 transition-colors">
              🧮 Калькулятор
            </Link>
            <a href={COMPANY.phoneTel}
               className="px-6 py-3 rounded-full font-bold text-white border border-white/30 hover:bg-white/10 transition-colors inline-flex items-center gap-2">
              <Phone className="w-4 h-4" strokeWidth={2.2} /> {COMPANY.phone}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
