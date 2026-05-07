"use client";

import { useEffect, useRef, useState } from "react";
import { fmtRub, calcInstallment, getMinDownPct } from "@/lib/calculator-logic";

export interface ModalPreset {
  price:        number;
  down:         number;
  term:         number;
  monthly:      number;
  wbUrl?:       string;
  productName?: string;
  memory?:      string;
  sim?:         string;
}

interface Props {
  open:    boolean;
  onClose: () => void;
  preset?: ModalPreset;
}

// Доступные сроки рассрочки
const TERMS = [3, 4, 6, 10, 12];

// ─── Телефонная маска ─────────────────────────────────────────
const PREFIX = "+7 ";

function extractDigits(s: string): string {
  return s.replace(/\D/g, "").slice(0, 10);
}

function fmtDigits(d: string): string {
  const parts: string[] = [];
  if (d.length > 0) parts.push(d.slice(0, 3));
  if (d.length > 3) parts.push(d.slice(3, 6));
  if (d.length > 6) parts.push(d.slice(6, 8));
  if (d.length > 8) parts.push(d.slice(8, 10));
  return parts.join(" ");
}

// ─── Компонент ────────────────────────────────────────────────

export function ApplicationModal({ open, onClose, preset }: Props) {
  const [name,    setName]    = useState("");
  const [phone,   setPhone]   = useState(PREFIX);
  const [sent,    setSent]    = useState(false);

  // Интерактивный срок — инициализируем из preset или дефолт 6 мес.
  const [term, setTerm] = useState<number>(preset?.term ?? 6);

  // Пересчитываем платёж при смене preset или срока
  const price   = preset?.price ?? 0;
  const down    = preset?.down  ?? Math.ceil(price * getMinDownPct(price));
  const monthly = price > 0
    ? calcInstallment({ price, down, term }).monthly
    : (preset?.monthly ?? 0);

  const overlayRef = useRef<HTMLDivElement>(null);

  // Сбрасываем срок при открытии нового товара
  useEffect(() => {
    if (open && preset?.term) setTerm(preset.term);
  }, [open, preset?.term]);

  /* Закрыть по Escape */
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /* Блокировка скролла */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  /* ── Телефон ── */
  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (!raw.startsWith(PREFIX)) { setPhone(PREFIX); return; }
    const digits = extractDigits(raw.slice(PREFIX.length));
    if (digits.length > 0 && digits[0] !== "9") return;
    setPhone(PREFIX + fmtDigits(digits));
  }

  function handlePhoneKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const el = e.currentTarget;
    const { selectionStart: ss, selectionEnd: se } = el;
    if (
      (e.key === "Backspace" || e.key === "Delete") &&
      ss !== null && se !== null &&
      ss <= PREFIX.length && se <= PREFIX.length
    ) e.preventDefault();
  }

  function handleSubmit(e: React.FormEvent) { e.preventDefault(); setSent(true); }
  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center p-4
                 bg-black/60 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl
                      overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Шапка */}
        <div className="px-6 pt-6 pb-4 border-b border-[#D8E2F0]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F3F4F6]
                       flex items-center justify-center text-[#6B7280]
                       hover:bg-[#D8E2F0] transition-colors text-lg leading-none"
            aria-label="Закрыть"
          >
            ×
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl grad-main flex items-center justify-center shrink-0">
              <span className="text-white font-extrabold text-sm">NF</span>
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#0A1628]">Заявка на рассрочку</h2>
              <p className="text-xs text-[#6B7280]">ФинНайс — без Риба и скрытых платежей</p>
            </div>
          </div>
        </div>

        {sent ? (
          /* ── Успех ── */
          <div className="px-6 py-10 text-center">
            <div className="w-16 h-16 rounded-full bg-[#D1FAE5] flex items-center justify-center
                            text-3xl mx-auto mb-4">✅</div>
            <h3 className="text-xl font-extrabold text-[#0A1628] mb-2">Заявка принята!</h3>
            <p className="text-[#6B7280] text-sm leading-relaxed mb-6">
              Менеджер свяжется с вами в течение 15 минут.
              Работаем по г. Грозный и Чеченской Республике.
            </p>
            <button
              onClick={() => { setSent(false); onClose(); }}
              className="btn-primary"
            >
              Закрыть
            </button>
          </div>
        ) : (
          /* ── Форма ── */
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

            {/* Параметры рассрочки */}
            {preset && (
              <div className="rounded-2xl bg-[#EBF0F9] p-4 space-y-3">

                {/* Товар */}
                {preset.productName && (
                  <div className="pb-3 border-b border-[#D8E2F0]">
                    <p className="text-[10px] text-[#6B7280] mb-1">Товар</p>
                    <p className="font-bold text-[#0A1628] leading-snug">{preset.productName}</p>
                    {(preset.memory || preset.sim) && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {preset.memory && (
                          <span className="px-2 py-0.5 bg-white rounded-full text-[10px] font-semibold text-[#1A3C6E] border border-[#D8E2F0]">
                            {preset.memory}
                          </span>
                        )}
                        {preset.sim && (
                          <span className="px-2 py-0.5 bg-white rounded-full text-[10px] font-semibold text-[#6B7280] border border-[#D8E2F0]">
                            {preset.sim}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Стоимость + взнос */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div>
                    <p className="text-[10px] text-[#6B7280] mb-0.5">Стоимость</p>
                    <p className="font-extrabold text-[#0A1628] text-sm">{fmtRub(preset.price)} ₽</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#6B7280] mb-0.5">Первоначальный взнос</p>
                    <p className="font-extrabold text-[#0A1628] text-sm">{fmtRub(down)} ₽</p>
                  </div>
                </div>

                {/* ── Выбор срока ── */}
                <div className="border-t border-[#D8E2F0] pt-3">
                  <p className="text-[10px] text-[#6B7280] mb-2 font-semibold">Срок рассрочки</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {TERMS.map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTerm(t)}
                        className={`flex-1 min-w-[44px] py-2 rounded-xl text-sm font-bold
                                    border transition-all touch-manipulation
                                    ${term === t
                                      ? "bg-[#0A1628] text-white border-[#0A1628]"
                                      : "bg-white text-[#374151] border-[#D8E2F0] hover:border-[#0A1628]"}`}
                      >
                        {t}<span className="text-[9px] font-normal ml-0.5">мес</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Итоговый платёж (крупно) ── */}
                <div className="rounded-xl bg-[#0A1628] px-4 py-3 flex items-center justify-between">
                  <p className="text-white/70 text-xs">Платёж / мес.</p>
                  <p className="text-white font-extrabold text-xl leading-none">
                    {fmtRub(monthly)} ₽
                  </p>
                </div>

                {preset.wbUrl && (
                  <p className="text-[11px] text-[#6B7280] truncate">WB: {preset.wbUrl}</p>
                )}
              </div>
            )}

            {/* ФИО */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">ФИО</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Айдамиров Абузар Абдулхакимович"
                className="field w-full"
              />
            </div>

            {/* Телефон */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Телефон</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={handlePhoneChange}
                onKeyDown={handlePhoneKeyDown}
                onFocus={(e) => {
                  const len = e.target.value.length;
                  e.target.setSelectionRange(len, len);
                }}
                placeholder="+7 9__ ___ __ __"
                className="field w-full tracking-wider"
              />
            </div>

            {/* Согласие */}
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" required className="mt-0.5 accent-[#0C7A58]" />
              <span className="text-[11px] text-[#9CA3AF] leading-relaxed">
                Даю согласие на обработку персональных данных в соответствии с{" "}
                <a href="/politika/" className="text-[#1A3C6E] underline">
                  политикой конфиденциальности
                </a>
              </span>
            </label>

            <button
              type="submit"
              className="w-full py-4 rounded-full font-extrabold text-base text-white
                         bg-[#0C7A58] hover:bg-[#0A6347] active:scale-95
                         transition-all shadow-md"
            >
              Отправить заявку
            </button>

            <p className="text-center text-[11px] text-[#9CA3AF]">
              Ответим в течение 15 минут · г. Грозный, ул. Орзамиева, 8
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
