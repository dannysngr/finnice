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

const TERM_OPTIONS = Array.from({ length: MAX_TERM - MIN_TERM + 1 }, (_, i) => MIN_TERM + i);

// ─── Маска телефона ───────────────────────────────────────────
const PREFIX = "+7 ";
const extractDigits = (s: string) => s.replace(/\D/g, "").slice(0, 10);
function fmtDigits(d: string) {
  const p: string[] = [];
  if (d.length > 0) p.push(d.slice(0, 3));
  if (d.length > 3) p.push(d.slice(3, 6));
  if (d.length > 6) p.push(d.slice(6, 8));
  if (d.length > 8) p.push(d.slice(8, 10));
  return p.join(" ");
}

// ─── Компонент ────────────────────────────────────────────────
export function ApplicationModal({ open, onClose, preset }: Props) {
  const [name,  setName]  = useState("");
  const [phone, setPhone] = useState("");
  const [sent,  setSent]  = useState(false);
  const [term,  setTerm]  = useState<number>(preset?.term ?? 6);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      if (preset?.term) setTerm(preset.term);
      setPhone("");
      setName("");
      setSent(false);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const price = preset?.price ?? 0;
  const down  = preset?.down  ?? Math.ceil(price * getMinDownPct(price));
  const res   = price > 0
    ? calcInstallment({ price, down, term })
    : { monthly: 0, markup: 0, total: 0, isValidDown: true, minDown: 0, minDownPct: 0 };

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    // Если поле очищено — сбрасываем в пустое (показывается placeholder)
    if (raw === "" || raw === PREFIX.trimEnd()) { setPhone(""); return; }
    if (!raw.startsWith(PREFIX)) { setPhone(PREFIX); return; }
    const digits = extractDigits(raw.slice(PREFIX.length));
    if (digits.length > 0 && digits[0] !== "9") return;
    setPhone(PREFIX + fmtDigits(digits));
  }
  function handlePhoneKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const { selectionStart: ss, selectionEnd: se } = e.currentTarget;
    if ((e.key === "Backspace" || e.key === "Delete") && ss !== null && se !== null
        && ss <= PREFIX.length && se <= PREFIX.length) {
      // При удалении на PREFIX — очищаем поле полностью (чтобы вернуть placeholder)
      setPhone("");
      e.preventDefault();
    }
  }
  const handleSubmit   = (e: React.FormEvent)  => { e.preventDefault(); setSent(true); };
  const handleBackdrop = (e: React.MouseEvent) => { if (e.target === overlayRef.current) onClose(); };

  return (
    <div ref={overlayRef} onClick={handleBackdrop}
         className="fixed inset-0 z-50 flex items-center justify-center p-3
                    bg-black/60 backdrop-blur-sm">

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl
                      overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* ── Шапка (компактная) ── */}
        <div className="flex items-center gap-2.5 px-4 pt-4 pb-3 border-b border-[#D8E2F0]">
          <div className="w-8 h-8 rounded-lg grad-main flex items-center justify-center shrink-0">
            <span className="text-white font-extrabold text-xs">NF</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-extrabold text-[#0A1628] leading-tight">Заявка на рассрочку</h2>
            <p className="text-[10px] text-[#9CA3AF]">ФинНайс · без Риба и скрытых платежей</p>
          </div>
          <button onClick={onClose}
                  className="w-7 h-7 rounded-full bg-[#F3F4F6] flex items-center justify-center
                             text-[#6B7280] hover:bg-[#D8E2F0] transition-colors text-base leading-none shrink-0"
                  aria-label="Закрыть">×</button>
        </div>

        {sent ? (
          /* ── Успех ── */
          <div className="px-5 py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[#D1FAE5] flex items-center justify-center
                            text-2xl mx-auto mb-3">✅</div>
            <h3 className="text-base font-extrabold text-[#0A1628] mb-1">Заявка принята!</h3>
            <p className="text-[#6B7280] text-xs leading-relaxed mb-4">
              Менеджер свяжется с вами в течение 15 минут.
            </p>
            <button onClick={() => { setSent(false); onClose(); }} className="btn-primary text-sm">
              Закрыть
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-4 pt-3 pb-4 space-y-3">

            {preset && (
              <>
                {/* ── Товар + срок в одной строке ── */}
                <div className="flex items-center gap-2">
                  {/* Название + бейджи */}
                  <div className="flex-1 min-w-0 bg-[#F4F7FC] rounded-xl px-3 py-2">
                    {preset.productName && (
                      <p className="font-bold text-[#0A1628] text-xs leading-snug truncate">
                        {preset.productName}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {preset.memory && (
                        <span className="px-1.5 py-0.5 bg-[#EBF0F9] rounded-full text-[9px] font-semibold text-[#1A3C6E]">
                          {preset.memory}
                        </span>
                      )}
                      {preset.sim && (
                        <span className="px-1.5 py-0.5 bg-white rounded-full text-[9px] text-[#6B7280] border border-[#D8E2F0]">
                          {preset.sim}
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 bg-white rounded-full text-[9px] text-[#9CA3AF] border border-[#D8E2F0]">
                        {fmtRub(price)} ₽
                      </span>
                    </div>
                  </div>

                  {/* Срок — select компактный */}
                  <div className="relative shrink-0">
                    <select
                      value={term}
                      onChange={(e) => setTerm(Number(e.target.value))}
                      className="appearance-none bg-white border border-[#D8E2F0] rounded-xl
                                 pl-3 pr-7 py-2 text-xs font-bold text-[#0A1628]
                                 outline-none cursor-pointer hover:border-[#0A1628]
                                 focus:border-[#0A1628] transition-colors touch-manipulation"
                    >
                      {TERM_OPTIONS.map(t => (
                        <option key={t} value={t}>{t} мес.</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2
                                     text-[#6B7280] text-[10px]">▾</span>
                  </div>
                </div>

                {/* ── Сетка 2×2 + платёж ── */}
                <div className="rounded-xl border border-[#D8E2F0] overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y divide-[#E5E7EB]">
                    <Cell label={down > 0 ? "Взнос (25%)" : "Взнос"} value={down > 0 ? `${fmtRub(down)} ₽` : "—"} />
                    <Cell label="Итого с наценкой"  value={`${fmtRub(res.total)} ₽`} />
                    <Cell label="Наценка"            value={`${fmtRub(res.markup)} ₽`} alt />
                    <Cell label="Срок"               value={`${term} мес.`} alt />
                  </div>
                  {/* Акцент: ежемесячный платёж */}
                  <div className="bg-[#0A1628] px-4 py-3 flex items-center justify-between">
                    <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wide">
                      Платёж / мес.
                    </p>
                    <p className="text-white font-extrabold text-xl leading-none tabular-nums">
                      {fmtRub(res.monthly)} ₽
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* ── ФИО ── */}
            <div>
              <label className="block text-[10px] font-semibold text-[#374151] mb-1">ФИО</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                     placeholder="Айдамиров Абузар Абдулхакимович"
                     className="field w-full text-xs py-2" />
            </div>

            {/* ── Телефон ── */}
            <div>
              <label className="block text-[10px] font-semibold text-[#374151] mb-1">Телефон</label>
              <input type="tel" required value={phone}
                     onChange={handlePhoneChange} onKeyDown={handlePhoneKeyDown}
                     onFocus={(e) => {
                       if (!phone) {
                         setPhone(PREFIX);
                         requestAnimationFrame(() => {
                           e.target.setSelectionRange(PREFIX.length, PREFIX.length);
                         });
                       } else {
                         const l = e.target.value.length;
                         e.target.setSelectionRange(l, l);
                       }
                     }}
                     placeholder="+7 (928) 999-99-99"
                     className="field w-full text-xs py-2 tracking-wider" />
            </div>

            {/* ── Согласие ── */}
            <label className="flex items-start gap-1.5 cursor-pointer">
              <input type="checkbox" required className="mt-0.5 accent-[#0C7A58] shrink-0" />
              <span className="text-[10px] text-[#9CA3AF] leading-snug">
                Согласен с{" "}
                <a href="/politika/" className="text-[#1A3C6E] underline">политикой конфиденциальности</a>
              </span>
            </label>

            {/* ── Кнопка ── */}
            <button type="submit"
                    className="w-full py-3 rounded-full font-extrabold text-sm text-white
                               bg-[#0C7A58] hover:bg-[#0A6347] active:scale-95
                               transition-all shadow-md">
              Отправить заявку
            </button>

            <p className="text-center text-[10px] text-[#9CA3AF]">
              Ответим в течение 15 минут · г. Грозный, ул. Орзамиева, 8
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Ячейка сетки ─────────────────────────────────────────────
function Cell({ label, value, alt }: { label: string; value: string; alt?: boolean }) {
  return (
    <div className={`px-3 py-2 ${alt ? "bg-[#F9FAFB]" : "bg-white"}`}>
      <p className="text-[9px] text-[#9CA3AF] mb-0.5 leading-tight">{label}</p>
      <p className="font-extrabold text-[#0A1628] text-xs">{value}</p>
    </div>
  );
}
