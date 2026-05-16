import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY } from "@/lib/data";

export const metadata: Metadata = {
  title:       `Партнёры — ${COMPANY.name} | ${COMPANY.city}`,
  description: `Партнёрская программа ${COMPANY.legalName}: магазины, поставщики и реселлеры. Запуск скоро.`,
};

export default function PartnersPage() {
  return (
    <main className="bg-white">
      <div className="bg-[#F4F7FC] border-b border-[#D8E2F0]">
        <div className="section py-3 text-xs text-[#9CA3AF] flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#1A3C6E]">Главная</Link>
          <span>/</span>
          <span className="text-[#0A1628]">Партнёры</span>
        </div>
      </div>

      {/* Hero — coming soon */}
      <section className="relative overflow-hidden"
               style={{ background: "#0A1628" }}>
        <div className="absolute inset-0 opacity-30"
             style={{
               background: "radial-gradient(circle at 20% 80%, #3FCFA5 0%, transparent 50%), radial-gradient(circle at 80% 20%, #1A3C6E 0%, transparent 55%)",
             }} />

        {/* Floating shapes */}
        <div className="absolute top-20 left-[10%] w-32 h-32 rounded-full opacity-20"
             style={{ background: "radial-gradient(circle, #3FCFA5, transparent)", filter: "blur(40px)" }} />
        <div className="absolute bottom-10 right-[15%] w-48 h-48 rounded-full opacity-25"
             style={{ background: "radial-gradient(circle, #C8972B, transparent)", filter: "blur(50px)" }} />

        <div className="section relative py-20 lg:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-[11px] uppercase tracking-widest font-bold text-[#3FCFA5] mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3FCFA5] animate-pulse"></span>
              Скоро запуск
            </span>

            <h1 className="text-4xl lg:text-6xl font-extrabold text-white tracking-tight mb-5 leading-[1.1]">
              Партнёрская сеть<br/>
              <span style={{ background: "linear-gradient(90deg, #3FCFA5, #ffffff)",
                             WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                в разработке
              </span>
            </h1>

            <p className="text-white/75 text-lg lg:text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
              Мы запускаем партнёрскую программу для магазинов электроники, мебели и бытовой техники
              в Чеченской Республике. Цель — дать вашим клиентам халяльную рассрочку и расширить
              средний чек без комиссий с продавца.
            </p>

            <div className="flex items-center justify-center gap-3 flex-wrap">
              <a href={COMPANY.whatsapp} target="_blank" rel="noopener"
                 className="px-6 py-3.5 rounded-full font-bold text-[#0A1628] bg-white hover:bg-white/95 transition-all inline-flex items-center gap-2 active:scale-95">
                💬 Стать партнёром
              </a>
              <Link href="/contacts/"
                    className="px-6 py-3.5 rounded-full font-bold text-white border border-white/30 hover:bg-white/10 transition-all">
                Обсудить условия
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Что мы готовим */}
      <section className="py-16 lg:py-20">
        <div className="section max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[11px] uppercase tracking-widest font-bold text-[#0C7A58] mb-3">
              Что готовим
            </p>
            <h2 className="text-3xl font-extrabold text-[#0A1628] mb-3">
              Программа для бизнеса
            </h2>
            <p className="text-[#6B7280] max-w-xl mx-auto">
              Подключение займёт меньше дня. Без проводок через банк, без долгих согласований.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i}
                   className="bg-white rounded-2xl border border-[#E5E7EB] p-6 transition-all hover:border-[#0C7A58]/30 hover:shadow-md">
                <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center text-2xl"
                     style={{ background: "linear-gradient(135deg, #ECFDF5, #D1FAE5)" }}>
                  {f.icon}
                </div>
                <h3 className="text-base font-extrabold text-[#0A1628] mb-2">{f.title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Этапы */}
      <section className="py-14 bg-[#F4F7FC]">
        <div className="section max-w-3xl mx-auto">
          <h2 className="text-2xl font-extrabold text-[#0A1628] mb-2 text-center">
            Дорожная карта запуска
          </h2>
          <p className="text-[#6B7280] text-center text-sm mb-10">
            Мы движемся быстро. Хотите быть среди первых партнёров — оставьте заявку прямо сейчас.
          </p>

          <ol className="relative space-y-6 pl-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-[#D8E2F0]">
            {ROADMAP.map((r, i) => (
              <li key={i} className="relative">
                <div className="absolute -left-[1.65rem] top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 bg-white"
                     style={{
                       borderColor: r.done ? "#0C7A58" : "#D8E2F0",
                       color:       r.done ? "#0C7A58" : "#9CA3AF",
                     }}>
                  {r.done ? "✓" : i + 1}
                </div>
                <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <h3 className="font-extrabold text-[#0A1628] text-base">{r.title}</h3>
                    <span className="text-[10px] uppercase tracking-wider font-bold shrink-0"
                          style={{ color: r.done ? "#0C7A58" : "#9CA3AF" }}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-sm text-[#6B7280] leading-relaxed">{r.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA в конце */}
      <section className="py-16 bg-[#0A1628] relative overflow-hidden">
        <div className="absolute inset-0 opacity-20"
             style={{ background: "radial-gradient(circle at 50% 50%, #0C7A58 0%, transparent 60%)" }} />
        <div className="section relative max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-white mb-3">
            Готовы к диалогу первым?
          </h2>
          <p className="text-white/65 text-base mb-8 leading-relaxed">
            Если у вас есть магазин в Чеченской Республике и вы хотите быть среди первых партнёров —
            напишите нам сегодня. Зафиксируем самые выгодные условия для пилотной группы.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a href={COMPANY.whatsapp} target="_blank" rel="noopener"
               className="px-6 py-3 rounded-full font-bold text-white inline-flex items-center gap-2"
               style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}>
              💬 WhatsApp
            </a>
            <a href={COMPANY.telegram} target="_blank" rel="noopener"
               className="px-6 py-3 rounded-full font-bold text-white inline-flex items-center gap-2"
               style={{ background: "linear-gradient(135deg, #2AABEE, #229ED9)" }}>
              ✈ Telegram
            </a>
            <a href={COMPANY.phoneTel}
               className="px-6 py-3 rounded-full font-bold inline-flex items-center gap-2 bg-white text-[#0A1628] hover:bg-white/90 transition-colors">
              📞 {COMPANY.phone}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

const FEATURES = [
  {
    icon: "🤝",
    title: "0% комиссии",
    desc: "С продавца мы не берём процент — наценка ложится только на клиента, прозрачно и заранее.",
  },
  {
    icon: "⚡",
    title: "Заявка за минуту",
    desc: "Клиент оформляет рассрочку онлайн или у вас в магазине, одобрение приходит в течение часа.",
  },
  {
    icon: "📈",
    title: "+15–30% к среднему чеку",
    desc: "Рассрочка без переплат увеличивает покупку, особенно на технику и мебель свыше 50 000 ₽.",
  },
  {
    icon: "🛡",
    title: "100% Халяль",
    desc: "Договор купли-продажи с рассрочкой — соответствует нормам Шариата.",
  },
  {
    icon: "💼",
    title: "Юридическая чистота",
    desc: "Никаких финансовых лицензий, ни ваша компания, ни клиент не оформляют кредит.",
  },
  {
    icon: "🚀",
    title: "Маркетинг с нами",
    desc: "Партнёры попадают на витрину сайта, в каталог, в рассылки и обзоры в нашем блоге.",
  },
];

const ROADMAP = [
  {
    title:  "Запуск пилотной группы",
    desc:   "Подключение 5–10 первых магазинов электроники, мебели и техники в Грозном.",
    status: "Прямо сейчас",
    done:   true,
  },
  {
    title:  "Каталог-витрина партнёров",
    desc:   "Партнёрские магазины и их товары появятся отдельным разделом на сайте.",
    status: "Q2",
    done:   false,
  },
  {
    title:  "Открытие API для интеграции",
    desc:   "Партнёры смогут принимать оплату Финнайс прямо на своих сайтах и кассах.",
    status: "Q3",
    done:   false,
  },
  {
    title:  "Расширение по СКФО",
    desc:   "Выход в другие регионы Северо-Кавказского округа и Поволжья.",
    status: "Q4",
    done:   false,
  },
];
