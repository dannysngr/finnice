import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY } from "@/lib/data";

export const metadata: Metadata = {
  title:       `Политика конфиденциальности — ${COMPANY.name}`,
  description: `Политика обработки персональных данных ${COMPANY.legalName}.`,
};

export default function PolitikaPage() {
  return (
    <main>
      <div className="bg-[#F4F7FC] border-b border-[#D8E2F0]">
        <div className="section py-3 text-xs text-[#9CA3AF] flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#1A3C6E]">Главная</Link>
          <span>/</span>
          <span className="text-[#0A1628]">Политика конфиденциальности</span>
        </div>
      </div>

      <section className="py-12">
        <div className="section max-w-3xl mx-auto">
          <h1 className="text-3xl font-extrabold text-[#0A1628] mb-8">Политика конфиденциальности</h1>
          <div className="prose prose-sm max-w-none text-[#4B5563] space-y-6">
            <p>
              Настоящая Политика конфиденциальности регулирует порядок обработки персональных данных
              пользователей сайта <strong>{COMPANY.legalName}</strong>.
            </p>
            <h2 className="text-lg font-bold text-[#0A1628]">1. Сбор данных</h2>
            <p>
              Мы собираем следующие персональные данные: ФИО, номер телефона, адрес электронной почты.
              Данные собираются исключительно с согласия пользователя при заполнении форм на сайте.
            </p>
            <h2 className="text-lg font-bold text-[#0A1628]">2. Использование данных</h2>
            <p>
              Персональные данные используются исключительно для обработки заявок на рассрочку,
              связи с клиентами и улучшения качества обслуживания. Данные не передаются третьим лицам.
            </p>
            <h2 className="text-lg font-bold text-[#0A1628]">3. Хранение данных</h2>
            <p>
              Данные хранятся в защищённом формате на территории Российской Федерации в соответствии
              с Федеральным законом № 152-ФЗ «О персональных данных».
            </p>
            <h2 className="text-lg font-bold text-[#0A1628]">4. Контакты</h2>
            <p>
              По вопросам обработки персональных данных обращайтесь:{" "}
              <a href={`mailto:${COMPANY.email}`} className="text-[#1A3C6E] hover:underline">
                {COMPANY.email}
              </a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
