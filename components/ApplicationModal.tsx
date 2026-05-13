"use client";

import { useEffect, useRef, useState } from "react";
import { FinniceLogo } from "@/components/FinniceLogo";
import {
  fmtRub, pluralPayment, calcInstallment, calcInstallmentIsoIRR, impliedAnnualIrr,
  getMinDownPct, MIN_TERM, MAX_TERM,
} from "@/lib/calculator-logic";

export interface ModalPreset {
  price:        number;
  down:         number;
  term:         number;
  monthly:      number;
  wbUrl?:       string;
  productName?: string;
  memory?:      string;
  sim?:         string;
  /** Если задано — пакетное оформление из корзины: модал отправит
   *  по одной заявке на каждый item (с qty). После успешной отправки
   *  всех заявок вызывается onAllSent (например, для очистки корзины). */
  cart?: Array<{ productName: string; price: number; qty: number }>;
  onAllSent?: () => void;
}

interface Props {
  open:    boolean;
  onClose: () => void;
  preset?: ModalPreset;
}

interface AuthUser {
  authed:     boolean;
  phone?:     string;
  firstName?: string | null;
  lastName?:  string | null;
}

const TERM_OPTIONS = Array.from({ length: MAX_TERM - MIN_TERM + 1 }, (_, i) => MIN_TERM + i);

// Маска телефона
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

export function ApplicationModal({ open, onClose, preset }: Props) {
  const [name,     setName]    = useState("");
  const [phone,    setPhone]   = useState("");
  const [sent,     setSent]    = useState(false);
  const [sending,  setSending] = useState(false);
  const [sendErr,  setSendErr] = useState("");
  const [term,     setTerm]    = useState<number>(preset?.term ?? 6);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Сбрасываем форму при открытии + загружаем сессию
  useEffect(() => {
    if (open) {
      if (preset?.term) setTerm(preset.term);
      setPhone("");
      setName("");
      setSent(false);
      setSendErr("");
      fetch("/api/auth/me")
        .then(r => r.json())
        .then((data: AuthUser) => setAuthUser(data))
        .catch(() => setAuthUser({ authed: false }));
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

  /* iso-IRR публичная политика — ВАЖНО: хуки должны идти ДО раннего return */
  const [policy, setPolicy] = useState<{ inflation: number; overrides: Record<string, number>; loaded: boolean }>({
    inflation: 0.12, overrides: {}, loaded: false,
  });
  useEffect(() => {
    fetch("/api/finance/public-config")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && typeof d.expectedInflationAnnual === "number") {
          setPolicy({ inflation: d.expectedInflationAnnual, overrides: d.matrixOverrides ?? {}, loaded: true });
        }
      })
      .catch(() => {});
  }, []);

  if (!open) return null;

  const isAuthed  = authUser?.authed === true;
  const price     = preset?.price ?? 0;
  const down      = preset?.down  ?? Math.ceil(price * getMinDownPct(price));

  const res = price > 0
    ? (policy.loaded
        ? calcInstallmentIsoIRR(price, down, term, policy.inflation, policy.overrides)
        : calcInstallment({ price, down, term }))
    : { monthly: 0, markup: 0, total: 0, isValidDown: true, minDown: 0, minDownPct: 0, rate: 0, guarantors: 0 };

  // Отображаемое имя из профиля
  const profileName = [authUser?.firstName, authUser?.lastName].filter(Boolean).join(" ") || "—";
  const profilePhone = authUser?.phone ?? "—";

  // Имя и телефон для отправки
  const submitName  = isAuthed ? profileName  : name.trim();
  const submitPhone = isAuthed ? profilePhone : phone.trim();

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (raw === "") { setPhone(""); return; }
    const digits = extractDigits(raw.startsWith(PREFIX) ? raw.slice(PREFIX.length) : raw);
    if (digits.length === 0) { setPhone(""); return; }
    if (digits[0] !== "9") return;
    setPhone(PREFIX + fmtDigits(digits));
  }
  function handlePhoneBlur() {
    if (phone === PREFIX || phone === PREFIX.trim()) setPhone("");
  }
  function handlePhoneKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const { selectionStart: ss, selectionEnd: se } = e.currentTarget;
    if ((e.key === "Backspace" || e.key === "Delete") && ss !== null && se !== null
        && ss <= PREFIX.length && se <= PREFIX.length) {
      setPhone("");
      e.preventDefault();
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSendErr("");
    try {
      /* Пакетный режим из корзины — одна заявка, items[] внутри */
      if (preset?.cart && preset.cart.length > 0) {
        const items = preset.cart.map(item => {
          const itemDown = Math.ceil(item.price * getMinDownPct(item.price));
          const itemRes  = policy.loaded
            ? calcInstallmentIsoIRR(item.price, itemDown, term, policy.inflation, policy.overrides)
            : calcInstallment({ price: item.price, down: itemDown, term });
          const itemMarkupPct = item.price > 0 ? itemRes.markup / item.price : 0;
          const itemTotalPrice = item.price + itemRes.markup;
          return {
            productName: item.productName,
            qty:         item.qty,
            costAmount:  item.price * item.qty,
            markupAmount: itemRes.markup * item.qty,
            markupPct:   itemMarkupPct,
            totalAmount: itemTotalPrice * item.qty,
            downAmount:  itemDown * item.qty,
            monthly:     itemRes.monthly * item.qty,
          };
        });

        /* Аггрегаты по всей заявке */
        const aggCost   = items.reduce((s, i) => s + i.costAmount, 0);
        const aggMarkup = items.reduce((s, i) => s + i.markupAmount, 0);
        const aggTotal  = items.reduce((s, i) => s + i.totalAmount, 0);
        const aggDown   = items.reduce((s, i) => s + i.downAmount, 0);
        const aggMonthly = items.reduce((s, i) => s + i.monthly, 0);
        const aggMarkupPct = aggCost > 0 ? aggMarkup / aggCost : 0;
        const summaryName = items.length === 1
          ? items[0].productName
          : items.map(i => i.qty > 1 ? `${i.productName} × ${i.qty}` : i.productName).join("; ");

        try {
          const r = await fetch("/api/applications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name:    submitName,
              phone:   submitPhone,
              product: summaryName,
              price:   aggTotal,
              down:    aggDown,
              term,
              monthly: aggMonthly,
              costAmount:   aggCost,
              markupAmount: aggMarkup,
              markupPct:    aggMarkupPct,
              downAmount:   aggDown,
              targetIrrAtCreation: 0,
              items,
            }),
          });
          const d = await r.json();
          if (d.ok) {
            setSent(true);
            preset.onAllSent?.();
          } else {
            setSendErr(d.error || "Ошибка отправки. Попробуйте ещё раз.");
          }
        } catch {
          setSendErr("Сетевая ошибка");
        }
        return;
      }

      /* Обычный режим — одна заявка */
      const markupPct = price > 0 ? res.markup / price : 0;
      const totalPrice = price + res.markup;
      const targetIrrAtCreation = res.rate > 0 ? impliedAnnualIrr(res.rate) : 0;

      const r = await fetch("/api/applications", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:    submitName,
          phone:   submitPhone,
          product: preset?.productName ?? "",
          price:   totalPrice,    /* total для клиента */
          down,
          term,
          monthly: res.monthly,

          /* iso-IRR meta */
          costAmount:          price,        /* стоимость у партнёра */
          markupAmount:        res.markup,
          markupPct,
          downAmount:          down,
          targetIrrAtCreation,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setSent(true);
      } else {
        setSendErr(data.error ?? "Ошибка отправки. Попробуйте ещё раз.");
      }
    } catch {
      setSendErr("Нет соединения. Попробуйте ещё раз.");
    } finally {
      setSending(false);
    }
  };

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div ref={overlayRef} onClick={handleBackdrop}
         className="fixed inset-0 z-50 flex items-center justify-center p-3
                    bg-black/60 backdrop-blur-sm">

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl
                      overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Шапка */}
        <div className="flex items-center gap-2.5 px-4 pt-4 pb-3 border-b border-[#D8E2F0]">
          <FinniceLogo size={30} variant="mark" />
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-extrabold text-[#0A1628] leading-tight">Заявка на рассрочку</h2>
            <p className="text-[10px] text-[#9CA3AF]">ФинНайс · без риба и скрытых платежей</p>
          </div>
          <button onClick={onClose}
                  className="w-7 h-7 rounded-full bg-[#F3F4F6] flex items-center justify-center
                             text-[#6B7280] hover:bg-[#D8E2F0] transition-colors text-base leading-none shrink-0"
                  aria-label="Закрыть">×</button>
        </div>

        {sent ? (
          /* Успех */
          <div className="relative overflow-hidden px-6 py-10 text-center
                          animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div className="absolute inset-0 bg-gradient-to-b from-white via-[#F4F7FC] to-white opacity-80 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48
                            bg-[#C8972B]/8 rounded-full blur-3xl pointer-events-none" />
            <div className="relative mx-auto mb-5 w-16 h-16
                            rounded-2xl bg-gradient-to-br from-[#C8972B]/15 to-[#C8972B]/5
                            border border-[#C8972B]/20 shadow-[0_4px_24px_rgba(200,151,43,0.15)]
                            flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                   stroke="#C8972B" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
                   className="animate-in zoom-in duration-500 delay-150">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="relative text-lg font-semibold text-[#0A1628] mb-2 tracking-[-0.02em] leading-tight">
              Заявка принята
            </h3>
            <p className="relative text-[#9CA3AF] text-xs leading-relaxed mb-7 max-w-[220px] mx-auto">
              Менеджер свяжется с вами в ближайшее время
            </p>
            <button
              onClick={() => { setSent(false); onClose(); }}
              className="relative w-full max-w-[200px] py-2.5 rounded-full
                         border border-[#D8E2F0] bg-white text-[#0A1628] text-xs font-semibold
                         hover:bg-[#0A1628] hover:text-white hover:border-[#0A1628]
                         shadow-sm hover:shadow-md transition-all duration-200 ease-out active:scale-95">
              Закрыть
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-4 pt-3 pb-4 space-y-3">

            {preset?.cart && preset.cart.length > 0 && (
              <div className="bg-[#F4F7FC] rounded-xl px-3 py-2.5 border border-[#D8E2F0]">
                <p className="text-[10px] uppercase tracking-wider text-[#6B7280] font-bold mb-1.5">
                  Одна заявка, {preset.cart.length} {preset.cart.length === 1 ? "товар" : "товаров"}
                </p>
                <ul className="text-xs text-[#0A1628] space-y-1">
                  {preset.cart.map((it, i) => (
                    <li key={i} className="flex justify-between gap-2">
                      <span className="truncate">
                        {it.productName}{it.qty > 1 && ` × ${it.qty}`}
                      </span>
                      <span className="text-[#6B7280] shrink-0 tabular-nums">
                        {fmtRub(it.price * it.qty)} ₽
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-[10px] text-[#6B7280] mt-2 leading-snug">
                  Все товары оформляются единой рассрочкой с общим графиком платежей
                  и одним договором. Срок ниже применится ко всей покупке.
                </p>
              </div>
            )}

            {preset && (
              <>
                {/* Товар + выбор срока */}
                <div className="flex items-center gap-2">
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
                        <option key={t} value={t}>{pluralPayment(t)}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2
                                     text-[#6B7280] text-[10px]">▾</span>
                  </div>
                </div>

                {/* Сетка параметров */}
                <div className="rounded-xl border border-[#D8E2F0] overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y divide-[#E5E7EB]">
                    <Cell label={down > 0 ? "Взнос (25%)" : "Взнос"} value={down > 0 ? `${fmtRub(down)} ₽` : "—"} />
                    <Cell label="Итого с наценкой"  value={`${fmtRub(res.total)} ₽`} />
                    <Cell label="Наценка"              value={`${fmtRub(res.markup)} ₽`} alt />
                    <Cell label="Кол-во платежей"    value={pluralPayment(term)} alt />
                  </div>
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

            {/* Данные плательщика */}
            {isAuthed ? (
              /* Авторизован — показываем данные из профиля */
              <div className="flex items-start gap-2.5 bg-[#EBF0F9] rounded-xl px-3 py-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#1A3C6E] flex items-center justify-center shrink-0 mt-0.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                       stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[#1A3C6E] mb-0.5">Данные плательщика</p>
                  <p className="text-xs font-bold text-[#0A1628]">{profileName}</p>
                  <p className="text-[11px] text-[#6B7280] font-mono">{profilePhone}</p>
                </div>
              </div>
            ) : (
              /* Не авторизован — поля ввода */
              <>
                <div>
                  <label className="block text-[10px] font-semibold text-[#374151] mb-1">ФИО</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                         placeholder="Айдамиров Абузар Абдулхакимович"
                         className="field w-full text-xs py-2" />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-[#374151] mb-1">Телефон</label>
                  <input type="tel" required value={phone}
                         onChange={handlePhoneChange}
                         onKeyDown={handlePhoneKeyDown}
                         onBlur={handlePhoneBlur}
                         onFocus={(e) => {
                           if (phone) {
                             const l = e.target.value.length;
                             e.target.setSelectionRange(l, l);
                           }
                         }}
                         placeholder="+7 928 000 00 00"
                         className="field w-full text-xs py-2 tracking-wider" />
                </div>
              </>
            )}

            {/* Согласие */}
            <label className="flex items-start gap-1.5 cursor-pointer">
              <input type="checkbox" required className="mt-0.5 accent-[#0C7A58] shrink-0" />
              <span className="text-[10px] text-[#9CA3AF] leading-snug">
                Согласен с{" "}
                <a href="/politika/" className="text-[#1A3C6E] underline">политикой конфиденциальности</a>
              </span>
            </label>

            {sendErr && (
              <p className="text-center text-xs text-red-500 font-medium">{sendErr}</p>
            )}

            <button type="submit" disabled={sending}
                    className="w-full py-3 rounded-full font-extrabold text-sm text-white
                               bg-[#0C7A58] hover:bg-[#0A6347] active:scale-95
                               transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed
                               flex items-center justify-center gap-2">
              {sending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Отправляем…
                </>
              ) : "Отправить заявку"}
            </button>

            <p className="text-center text-[10px] text-[#9CA3AF]">
              Ответим в ближайшее время · г. Грозный, ул. Орзамиева, 8
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

function Cell({ label, value, alt }: { label: string; value: string; alt?: boolean }) {
  return (
    <div className={`px-3 py-2 ${alt ? "bg-[#F9FAFB]" : "bg-white"}`}>
      <p className="text-[9px] text-[#9CA3AF] mb-0.5 leading-tight">{label}</p>
      <p className="font-extrabold text-[#0A1628] text-xs">{value}</p>
    </div>
  );
}
