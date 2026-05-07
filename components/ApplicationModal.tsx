"use client";

import { useEffect, useRef, useState } from "react";
import { fmtRub, calcInstallment, getMinDownPct, MIN_TERM, MAX_TERM } from "@/lib/calculator-logic";

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

// Диапазон сроков: 3..24 мес.
const TERM_OPTIONS = Array.from(
  { length: MAX_TERM - MIN_TERM + 1 },
  (_, i) => MIN_TERM + i
);

// ─── Телефонная маска ─────────────────────────────────────────
const PREFIX = "+7 ";

function extractDigits(s: string): string {
  return s.replace(/\D/g, "").slice(0, 10);
}
function fmtDigits(d: string): string {
  const p: string[] = [];
  if (d.length > 0) p.push(d.slice(0, 3));
  if (d.length > 3) p.push(d.slice(3, 6));
  if (d.length > 6) p.push(d.slice(6, 8));
  if (d.length > 8) p.push(d.slice(8, 10));
  return p.join(" ");
}

// ─── Строка информационного блока ────────────────────────────
function InfoRow({
  label, value, accent = false, large = false,
}: {
  label: string; value: string; accent?: boolean; large?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <p className={`text-xs leading-tight ${accent ? "text-white/80" : "text-[#6B7280]"}`}>
        {label}
      </p>
      <p className={`font-extrabold whitespace-nowrap
                     ${large  ? "text-xl"  : "text-sm"}
                     ${accent ? "text-white" : "text-[#0A1628]"}`}>
        {value}
      </p>
    </div>
  );
}

// ─── Компонент ────────────────────────────────────────────────

export function ApplicationModal({ open, onClose, preset }: Props) {
  const [name,  setName]  = useState("");
  const [phone, setPhone] = useState(PREFIX);
  const [sent,  setSent]  = useState(false);
  const [term,  setTerm]  = useState<number>(preset?.term ?? 6);

  const overlayRef = useRef<HTMLDivElement>(null);

  // Сброс срока при открытии нового товара
  useEffect(() => {
    if (open && preset?.term) setTerm(preset.term);
  }, [open, preset?.term]);

  // Закрыть по Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Блокировка скролла
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  // ── Расчёт (живой пересчёт при смене term) ──
  const price = preset?.price ?? 0;
  const down  = preset?.down  ?? Math.ceil(price * getMinDownPct(price));
  const res   = price > 0
    ? calcInstallment({ price, down, term })
    : { monthly: 0, markup: 0, total: 0, isValidDown: true, minDown: 0, minDownPct: 0 };

  // ── Телефон ──
  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (!raw.startsWith(PREFIX)) { setPhone(PREFIX); return; }
    const digits = extractDigits(raw.slice(PREFIX.length));
    if (digits.length > 0 && digits[0] !== "9") return;
    setPhone(PREFIX + fmtDigits(digits));
  }
  function handlePhoneKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const { selectionStart: ss, selectionEnd: se } = e.currentTarget;
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
                      overflow-hidden animate-in fade-in zoom-in duration-200
                      max-h-[90dvh] overflow-y-auto">

        {/* ── Шапка ── */}
        <div className="sticky top-0 z-10 px-6 pt-6 pb-4 bg-white border-b border-[#D8E2F0]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F3F4F6]
                       flex items-center justify-center text-[#6B7280]
                       hover:bg-[#D8E2F0] transition-colors text-lg leading-none"
            aria-label="Закрыть"
          >×</button>
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
            <button onClick={() => { setSent(false); onClose(); }} className="btn-primary">
              Закрыть
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

            {preset && (
              <>
                {/* ── Товар ── */}
                {preset.productName && (
                  <div className="rounded-2xl border border-[#D8E2F0] px-4 py-3">
                    <p className="text-[10px] text-[#9CA3AF] mb-1 font-semibold uppercase tracking-wide">Товар</p>
                    <p className="font-bold text-[#0A1628] leading-snug">{preset.productName}</p>
                    {(preset.memory || preset.sim) && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {preset.memory && (
                          <span className="px-2 py-0.5 bg-[#EBF0F9] rounded-full text-[10px] font-semibold text-[#1A3C6E]">
                            {preset.memory}
                          </span>
                        )}
                        {preset.sim && (
                          <span className="px-2 py-0.5 bg-[#F4F7FC] rounded-full text-[10px] text-[#6B7280]">
                            {preset.sim}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Выбор срока ── */}
                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                    Срок рассрочки
                  </label>
                  <div className="relative">
                    <select
                      value={term}
                      onChange={(e) => setTerm(Number(e.target.value))}
                      className="w-full appearance-none bg-white border border-[#D8E2F0]
                                 rounded-xl px-4 py-3 text-sm font-bold text-[#0A1628]
                                 outline-none cursor-pointer transition-colors
                                 hover:border-[#0A1628] focus:border-[#0A1628]
                                 touch-manipulation"
                    >
                      {TERM_OPTIONS.map(t => (
                        <option key={t} value={t}>{t} месяцев</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2
                                     text-[#6B7280] text-xs">▾</span>
                  </div>
                </div>

                {/* ── Детальная разбивка ── */}
                <div className="rounded-2xl border border-[#D8E2F0] overflow-hidden">
                  <div className="px-4 divide-y divide-[#F3F4F6]">
                    <InfoRow label="Полная стоимость товара"  value={`${fmtRub(price)} ₽`} />
                    <InfoRow
                      label={down > 0 ? "Первоначальный взнос (25%)" : "Первоначальный взнос"}
                      value={down > 0 ? `${fmtRub(down)} ₽` : "не требуется"}
                    />
                    <InfoRow label={`Наценка (${term} мес.)`}    value={`${fmtRub(res.markup)} ₽`} />
                    <InfoRow label="Итоговая стоимость"          value={`${fmtRub(res.total)} ₽`} />
                  </div>

                  {/* Ежемесячный платёж — акцентный блок */}
                  <div className="bg-[#0A1628] px-4 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wide mb-0.5">
                        Ежемесячный платёж
                      </p>
                      <p className="text-white/50 text-[10px]">за {term} мес.</p>
                    </div>
                    <p className="text-white font-extrabold text-2xl leading-none">
                      {fmtRub(res.monthly)} ₽
                    </p>
                  </div>
                </div>

                {preset.wbUrl && (
                  <p className="text-[11px] text-[#6B7280] truncate px-1">
                    WB: {preset.wbUrl}
                  </p>
                )}
              </>
            )}

            {/* ── ФИО ── */}
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

            {/* ── Телефон ── */}
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

            {/* ── Согласие ── */}
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

            <p className="text-center text-[11px] text-[#9CA3AF] pb-1">
              Ответим в течение 15 минут · г. Грозный, ул. Орзамиева, 8
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
