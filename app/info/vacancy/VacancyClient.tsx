"use client";

import { useState, useEffect } from "react";
import {
  formatPhone, phoneInputOnChange, shouldBlockPhoneKeyDown, phoneToE164,
} from "@/lib/phone-mask";

export interface Vacancy {
  dept:    string;
  title:   string;
  desc:    string;
  salary:  string;
  type:    string;
  skills?: string[];
}

export function VacancyClient({ vacancies }: { vacancies: Vacancy[] }) {
  const [openVac, setOpenVac] = useState<Vacancy | null>(null);

  return (
    <>
      <section className="py-12">
        <div className="section max-w-3xl mx-auto space-y-4">
          {vacancies.map((v) => (
            <div key={v.title} className="bg-white rounded-2xl border border-[#E5E7EB] p-6 transition-all hover:border-[#0C7A58]/40 hover:shadow-md">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                <div className="flex-1 min-w-[200px]">
                  <span className="text-xs font-semibold text-[#0C7A58] bg-[#ECFDF5] px-3 py-1 rounded-full mb-2 inline-block">
                    {v.dept}
                  </span>
                  <h2 className="text-lg font-extrabold text-[#0A1628] mb-1.5">{v.title}</h2>
                  <p className="text-[#6B7280] text-sm leading-relaxed">{v.desc}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-extrabold text-[#0A1628]">{v.salary}</p>
                  <p className="text-xs text-[#9CA3AF]">{v.type}</p>
                </div>
              </div>

              {v.skills && v.skills.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {v.skills.map(s => (
                    <span key={s} className="text-[11px] px-2.5 py-1 rounded-full bg-[#F4F7FC] text-[#374151]">
                      {s}
                    </span>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-[#F3F4F6] flex items-center justify-between gap-3 flex-wrap">
                <p className="text-[11px] text-[#9CA3AF]">
                  Грозный · оформление по ТК РФ · обучение за счёт компании
                </p>
                <button
                  onClick={() => setOpenVac(v)}
                  className="px-5 py-2.5 rounded-full text-sm font-bold text-white transition-opacity hover:opacity-90 active:scale-95"
                  style={{ background: "linear-gradient(135deg, #0C7A58, #0a6449)" }}>
                  Откликнуться →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {openVac && (
        <VacancyResponseModal
          vacancy={openVac}
          onClose={() => setOpenVac(null)}
        />
      )}
    </>
  );
}

function VacancyResponseModal({ vacancy, onClose }: { vacancy: Vacancy; onClose: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [expectedSalary, setExpectedSalary] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError("Укажите имя"); return; }
    const e164 = phoneToE164(phone);
    if (!e164 || e164.length !== 12) { setError("Введите корректный номер телефона"); return; }

    setSending(true);
    try {
      const r = await fetch("/api/vacancy-response", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: formatPhone(phone),
          vacancy: `${vacancy.dept} · ${vacancy.title}`,
          message: message.trim() || undefined,
          expectedSalary: expectedSalary.trim() || undefined,
        }),
      });
      const data = await r.json();
      if (!data.ok) throw new Error(data.error || "Ошибка отправки");
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка отправки");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
         onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl my-4"
           onClick={e => e.stopPropagation()}>

        {sent ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-3xl"
                 style={{ background: "linear-gradient(135deg, #ECFDF5, #D1FAE5)" }}>
              ✓
            </div>
            <h3 className="text-xl font-extrabold text-[#0A1628] mb-2">Спасибо за отклик!</h3>
            <p className="text-sm text-[#6B7280] mb-5 leading-relaxed">
              Мы получили ваш отклик на вакансию <b>{vacancy.title}</b> и свяжемся в течение 1–2 рабочих дней.
            </p>
            <button onClick={onClose}
                    className="px-6 py-2.5 rounded-full text-sm font-bold text-white transition-opacity hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #0C7A58, #0a6449)" }}>
              Закрыть
            </button>
          </div>
        ) : (
          <>
            <div className="p-5 border-b border-[#F3F4F6] flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#0C7A58] font-bold mb-1">
                  Отклик на вакансию
                </p>
                <h3 className="text-lg font-extrabold text-[#0A1628] leading-tight">{vacancy.title}</h3>
                <p className="text-xs text-[#6B7280] mt-0.5">{vacancy.dept} · {vacancy.salary}</p>
              </div>
              <button onClick={onClose}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[#9CA3AF] hover:bg-[#F4F7FC] hover:text-[#0A1628] transition-colors text-xl leading-none">×</button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <Field label="Ваше имя *">
                <input value={name} onChange={e => setName(e.target.value)}
                       placeholder="Иван Иванов"
                       autoFocus
                       className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#E5E7EB] focus:border-[#0C7A58] outline-none transition-colors" />
              </Field>

              <Field label="Телефон *">
                <input
                  value={phone}
                  onChange={e => setPhone(phoneInputOnChange(e.target.value))}
                  onKeyDown={e => {
                    if (shouldBlockPhoneKeyDown(e.key, e.currentTarget.selectionStart, e.currentTarget.selectionEnd)) {
                      e.preventDefault();
                    }
                  }}
                  onFocus={() => { if (!phone) setPhone("+7 "); }}
                  onBlur={() => { if (phone === "+7 " || phone === "+7") setPhone(""); }}
                  inputMode="tel"
                  placeholder="+7 9XX XXX XX XX"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#E5E7EB] focus:border-[#0C7A58] outline-none transition-colors"
                />
              </Field>

              <Field label="Зарплатные ожидания (необязательно)">
                <input value={expectedSalary} onChange={e => setExpectedSalary(e.target.value)}
                       placeholder="60 000 ₽"
                       className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#E5E7EB] focus:border-[#0C7A58] outline-none transition-colors" />
              </Field>

              <Field label="О себе / опыт работы (необязательно)">
                <textarea value={message} onChange={e => setMessage(e.target.value)}
                          rows={4}
                          placeholder="Коротко расскажите о вашем опыте и почему вас заинтересовала вакансия"
                          className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#E5E7EB] focus:border-[#0C7A58] outline-none transition-colors resize-none" />
              </Field>

              {error && (
                <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  ⚠ {error}
                </div>
              )}

              <button type="submit" disabled={sending}
                      className="w-full py-3 rounded-full text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                      style={{ background: "linear-gradient(135deg, #0C7A58, #0a6449)" }}>
                {sending ? "Отправка..." : "Отправить отклик"}
              </button>

              <p className="text-[10px] text-[#9CA3AF] text-center leading-relaxed">
                Отправляя отклик, вы соглашаетесь с обработкой персональных данных.
                Мы свяжемся с вами в течение 1–2 рабочих дней.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-[#374151] mb-1.5">{label}</span>
      {children}
    </label>
  );
}
