import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY } from "@/lib/data";

export const metadata: Metadata = {
  title:       `Политика конфиденциальности — ${COMPANY.name}`,
  description: `Политика обработки персональных данных ${COMPANY.legalName}.`,
};

export default function PolitikaPage() {
  return (
    <main className="bg-white">
      <div className="bg-[#F4F7FC] border-b border-[#D8E2F0]">
        <div className="section py-3 text-xs text-[#9CA3AF] flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#1A3C6E] transition-colors">Главная</Link>
          <span>/</span>
          <span className="text-[#0A1628]">Политика конфиденциальности</span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden"
               style={{ background: "linear-gradient(135deg, #062E22 0%, #0a6449 50%, #0C7A58 100%)" }}>
        <div className="absolute inset-0 opacity-30"
             style={{
               background: "radial-gradient(circle at 20% 80%, #3FCFA5 0%, transparent 50%), radial-gradient(circle at 80% 20%, #1A3C6E 0%, transparent 55%)",
             }} />
        <div className="absolute top-20 left-[8%] w-32 h-32 rounded-full opacity-25"
             style={{ background: "radial-gradient(circle, #3FCFA5, transparent)", filter: "blur(50px)" }} />
        <div className="absolute bottom-10 right-[10%] w-48 h-48 rounded-full opacity-20"
             style={{ background: "radial-gradient(circle, #C8972B, transparent)", filter: "blur(60px)" }} />

        <div className="section relative py-14 lg:py-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-[11px] uppercase tracking-widest font-bold text-[#3FCFA5] mb-5">
              🔒 ФЗ-152 · Хранение в РФ
            </span>
            <h1 className="text-3xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.1] mb-4">
              Политика<br/>
              <span style={{ background: "linear-gradient(90deg, #3FCFA5, #ffffff)",
                             WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                конфиденциальности
              </span>
            </h1>
            <p className="text-white/75 text-base lg:text-lg leading-relaxed max-w-2xl">
              Как мы собираем, храним и используем ваши данные. Только то, что нужно для оформления
              рассрочки — без передачи третьим лицам.
            </p>
          </div>
        </div>
      </section>

      <section className="py-14 lg:py-20">
        <div className="section max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10">
            <Pillar icon="🛡" title="Защита" desc="Шифрование TLS, доступ только для авторизованных сотрудников" />
            <Pillar icon="🇷🇺" title="Хранение в РФ" desc="Все серверы и резервные копии — на территории Российской Федерации" />
            <Pillar icon="🚫" title="Без передачи" desc="Никому не передаём, кроме случаев, прямо предусмотренных законом" />
          </div>

          <div className="space-y-6 text-[#374151] leading-relaxed">
            <p>
              Настоящая Политика конфиденциальности регулирует порядок обработки персональных данных
              пользователей сайта <strong>{COMPANY.legalName}</strong>.
            </p>

            <Block num="1" title="Сбор данных">
              Мы собираем следующие персональные данные: ФИО, дата рождения, номер телефона,
              адрес электронной почты, паспортные данные, адрес регистрации и проживания.
              Данные собираются исключительно с согласия пользователя при оформлении заявки
              или регистрации в Личном кабинете.
            </Block>

            <Block num="2" title="Использование данных">
              Персональные данные используются исключительно для оформления договоров рассрочки,
              связи с клиентами и улучшения качества обслуживания. Данные не передаются третьим
              лицам, кроме случаев, прямо предусмотренных законом РФ.
            </Block>

            <Block num="3" title="Хранение данных">
              Данные хранятся в защищённом формате на серверах, расположенных на территории
              Российской Федерации, в соответствии с Федеральным законом № 152-ФЗ
              «О персональных данных».
            </Block>

            <Block num="4" title="Права пользователя">
              Вы вправе в любой момент запросить у нас отчёт о ваших данных, потребовать их
              исправления или удаления. Для этого напишите нам на{" "}
              <a href={`mailto:${COMPANY.email}`} className="text-[#0C7A58] font-semibold hover:underline">
                {COMPANY.email}
              </a>.
            </Block>

            <Block num="5" title="Cookies и аналитика">
              Мы используем cookies для технической работы сайта (сессии входа, корзина) и
              анонимной статистики посещений. Cookies не содержат персональных данных и не
              передаются третьим лицам.
            </Block>

            <Block num="6" title="Контакты">
              По всем вопросам обработки персональных данных обращайтесь:{" "}
              <a href={`mailto:${COMPANY.email}`} className="text-[#0C7A58] font-semibold hover:underline">
                {COMPANY.email}
              </a>
              {" "}или по телефону{" "}
              <a href={COMPANY.phoneTel} className="text-[#0C7A58] font-semibold hover:underline">
                {COMPANY.phone}
              </a>.
            </Block>
          </div>

          <div className="mt-10 p-5 rounded-2xl bg-[#F0FDF4] border border-[#86EFAC] flex items-start gap-3">
            <span className="text-2xl shrink-0">📌</span>
            <p className="text-sm text-[#065F46] leading-relaxed">
              <b>Кратко:</b> мы собираем только то, что нужно для договора рассрочки.
              Никому не продаём, не передаём и храним в России. Удалим по вашему запросу.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function Pillar({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 transition-all hover:border-[#0C7A58]/40 hover:shadow-md">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 text-xl"
           style={{ background: "linear-gradient(135deg, #ECFDF5, #D1FAE5)" }}>
        {icon}
      </div>
      <h3 className="font-extrabold text-[#0A1628] text-sm mb-1">{title}</h3>
      <p className="text-xs text-[#6B7280] leading-relaxed">{desc}</p>
    </div>
  );
}

function Block({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="border-l-2 border-[#0C7A58]/30 pl-5 py-1">
      <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#0A1628] mb-2">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold text-white"
              style={{ background: "linear-gradient(135deg, #0C7A58, #0a6449)" }}>
          {num}
        </span>
        {title}
      </h2>
      <div className="text-[#374151] text-[15px] leading-relaxed">
        {children}
      </div>
    </div>
  );
}
