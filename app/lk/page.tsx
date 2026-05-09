"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  LogOut, Shield, CheckCircle, Circle, ChevronDown,
  ChevronUp, CreditCard, User, Phone, Edit2, ArrowRight,
  Clock, FileText, AlertCircle, TrendingUp,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   MOCK DATA — замените на реальный API
   ───────────────────────────────────────────────────────────── */
const MOCK_USER = {
  name:     "Абдуллах",
  phone:    "+7 (928) 456-78-90",
  verified: true,
};

const MOCK_LOAN = {
  contractId:   "2024-05",
  product:      "iPhone 17 Pro Max 512 ГБ",
  totalAmount:  90_000,
  paidAmount:   45_000,
  nextDate:     "15 мая",
  nextAmount:   7_500,
  startDate:    "15 ноя 2025",
  endDate:      "15 ноя 2026",
  payments: [
    { id: 1,  date: "15 ноя 2025", amount: 7_500, status: "paid"     },
    { id: 2,  date: "15 дек 2025", amount: 7_500, status: "paid"     },
    { id: 3,  date: "15 янв 2026", amount: 7_500, status: "paid"     },
    { id: 4,  date: "15 фев 2026", amount: 7_500, status: "paid"     },
    { id: 5,  date: "15 мар 2026", amount: 7_500, status: "paid"     },
    { id: 6,  date: "15 апр 2026", amount: 7_500, status: "paid"     },
    { id: 7,  date: "15 мая 2026", amount: 7_500, status: "upcoming" },
    { id: 8,  date: "15 июн 2026", amount: 7_500, status: "future"   },
    { id: 9,  date: "15 июл 2026", amount: 7_500, status: "future"   },
    { id: 10, date: "15 авг 2026", amount: 7_500, status: "future"   },
    { id: 11, date: "15 сен 2026", amount: 7_500, status: "future"   },
    { id: 12, date: "15 ноя 2026", amount: 7_500, status: "future"   },
  ],
};

/* ─────────────────────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────────────────────── */
function fmtRub(n: number) {
  return n.toLocaleString("ru-RU");
}

function applyPhoneMask(raw: string): string {
  const digits = raw.replace(/\D/g, "").replace(/^7|^8/, "").slice(0, 10);
  let result = "+7";
  if (digits.length > 0) result += " (" + digits.slice(0, 3);
  if (digits.length >= 3) result += ") " + digits.slice(3, 6);
  if (digits.length >= 6) result += "-" + digits.slice(6, 8);
  if (digits.length >= 8) result += "-" + digits.slice(8, 10);
  return result;
}

/* ─────────────────────────────────────────────────────────────
   ANIMATION PRESETS
   ───────────────────────────────────────────────────────────── */
const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut", delay: i * 0.07 },
  }),
  exit: { opacity: 0, y: -16, transition: { duration: 0.25 } },
};

const slideLeft: Variants = {
  hidden:  { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0,  transition: { duration: 0.4, ease: "easeOut" } },
  exit:    { opacity: 0, x: -40, transition: { duration: 0.3 } },
};

/* ═══════════════════════════════════════════════════════════════
   PHASE A — AUTH
   ═══════════════════════════════════════════════════════════════ */

/* ── Screen 1: Phone input ──────────────────────────────────── */
function PhoneScreen({ onNext }: { onNext: (phone: string) => void }) {
  const [phone, setPhone] = useState("+7");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(applyPhoneMask(e.target.value));
  };

  const isReady = phone.replace(/\D/g, "").length === 11;

  const handleSubmit = async () => {
    if (!isReady) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    onNext(phone);
  };

  return (
    <motion.div
      key="phone"
      variants={slideLeft}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col items-center justify-center min-h-screen px-5 bg-[#F3F3F7]"
    >
      {/* Logo */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
        className="mb-10 flex flex-col items-center"
      >
        <div className="w-16 h-16 rounded-[20px] bg-[#0C7A58] flex items-center justify-center mb-4 shadow-lg shadow-[#0C7A58]/30">
          <span className="text-white font-black text-2xl tracking-tight">NF</span>
        </div>
        <h1 className="text-2xl font-black text-[#0A1628] tracking-tight">ФинНайс</h1>
        <p className="text-sm text-[#6B7280] mt-1">Исламская рассрочка</p>
      </motion.div>

      {/* Card */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={1}
        className="w-full max-w-sm bg-white rounded-[24px] p-6 shadow-[0_4px_32px_rgba(10,22,40,0.08)]"
      >
        <h2 className="text-[22px] font-black text-[#0A1628] mb-1 tracking-tight">
          Войти в кабинет
        </h2>
        <p className="text-sm text-[#6B7280] mb-7">
          Введите номер телефона, привязанный к договору
        </p>

        <label className="text-xs font-semibold text-[#374151] uppercase tracking-widest mb-2 block">
          Номер телефона
        </label>
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={handleInput}
            onFocus={() => { if (phone === "+7") setPhone("+7 ("); }}
            placeholder="+7 (___) ___-__-__"
            className="w-full pl-11 pr-4 py-4 rounded-[14px] bg-[#F3F3F7] text-[#0A1628]
                       font-semibold text-lg outline-none focus:ring-2 focus:ring-[#0C7A58]/40
                       transition-all placeholder:text-[#D1D5DB] placeholder:font-normal
                       placeholder:text-base"
          />
        </div>

        <motion.button
          onClick={handleSubmit}
          disabled={!isReady || loading}
          whileTap={{ scale: 0.97 }}
          className={`mt-5 w-full py-4 rounded-[14px] font-bold text-base text-white
                      flex items-center justify-center gap-2 transition-all duration-200
                      ${isReady && !loading
                        ? "bg-[#0C7A58] hover:bg-[#0a6449] shadow-lg shadow-[#0C7A58]/30 active:scale-[.98]"
                        : "bg-[#D1D5DB] cursor-not-allowed"}`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Spinner /> Отправляем код…
            </span>
          ) : (
            <>
              Продолжить
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </motion.div>

      {/* Quran badge */}
      <motion.p
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={2}
        className="mt-6 text-xs text-[#9CA3AF] text-center"
      >
        Без процентов · Без штрафов · Сура 2:275
      </motion.p>
    </motion.div>
  );
}

/* ── Screen 2: OTP ──────────────────────────────────────────── */
function OTPScreen({
  phone,
  onBack,
  onSuccess,
}: {
  phone: string;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [digits, setDigits]   = useState(["", "", "", ""]);
  const [status, setStatus]   = useState<"idle" | "loading" | "error">("idle");
  const inputRefs             = useRef<(HTMLInputElement | null)[]>([]);

  const handleDigit = (idx: number, val: string) => {
    const d = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = d;
    setDigits(next);
    if (d && idx < 3) inputRefs.current[idx + 1]?.focus();
    if (d && idx === 3) verify(next.join(""));
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (text.length === 4) {
      setDigits(text.split(""));
      verify(text);
    }
  };

  const verify = async (code: string) => {
    setStatus("loading");
    await new Promise(r => setTimeout(r, 1100));
    if (code === "1234" || code.length === 4) {
      onSuccess();
    } else {
      setStatus("error");
      setDigits(["", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  return (
    <motion.div
      key="otp"
      variants={slideLeft}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col items-center justify-center min-h-screen px-5 bg-[#F3F3F7]"
    >
      {/* Logo */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
        className="mb-10 flex flex-col items-center"
      >
        <div className="w-16 h-16 rounded-[20px] bg-[#0C7A58] flex items-center justify-center mb-4 shadow-lg shadow-[#0C7A58]/30">
          <span className="text-white font-black text-2xl tracking-tight">NF</span>
        </div>
      </motion.div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={1}
        className="w-full max-w-sm bg-white rounded-[24px] p-6 shadow-[0_4px_32px_rgba(10,22,40,0.08)]"
      >
        <h2 className="text-[22px] font-black text-[#0A1628] mb-1 tracking-tight">
          Введите код
        </h2>
        <p className="text-sm text-[#6B7280] mb-1">
          Из Telegram или СМС
        </p>
        <div className="flex items-center gap-1.5 mb-7">
          <p className="text-sm text-[#9CA3AF]">на {phone}</p>
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm font-semibold text-[#0C7A58]
                       hover:text-[#0a6449] transition-colors"
          >
            <Edit2 className="w-3 h-3" />
            Изменить
          </button>
        </div>

        {/* 4-digit OTP */}
        <div className="flex gap-3 justify-center mb-5" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <motion.input
              key={i}
              ref={el => { inputRefs.current[i] = el; }}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              animate={status === "error" ? { x: [0, -6, 6, -6, 6, 0] } : {}}
              transition={{ duration: 0.35 }}
              className={`w-14 h-16 text-center text-2xl font-black rounded-[14px]
                          outline-none transition-all duration-150 caret-transparent
                          ${d
                            ? "bg-[#0C7A58]/10 text-[#0C7A58] ring-2 ring-[#0C7A58]/40"
                            : "bg-[#F3F3F7] text-[#0A1628] ring-0 focus:ring-2 focus:ring-[#0C7A58]/40"}
                          ${status === "error" ? "ring-2 ring-red-400" : ""}`}
            />
          ))}
        </div>

        {status === "loading" && (
          <div className="flex items-center justify-center gap-2 text-sm text-[#6B7280] py-2">
            <Spinner /> Проверяем…
          </div>
        )}
        {status === "error" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm text-red-500 justify-center py-1"
          >
            <AlertCircle className="w-4 h-4" />
            Неверный код. Попробуйте ещё раз
          </motion.div>
        )}

        <p className="text-xs text-[#9CA3AF] text-center mt-4">
          Не получили? <button className="text-[#0C7A58] font-semibold">Отправить снова</button>
        </p>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PHASE B — DASHBOARD
   ═══════════════════════════════════════════════════════════════ */

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [showTerms, setShowTerms]     = useState(false);
  const [showAllPay, setShowAllPay]   = useState(false);
  const loan = MOCK_LOAN;
  const user = MOCK_USER;

  const paidPct   = Math.round((loan.paidAmount / loan.totalAmount) * 100);
  const remaining = loan.totalAmount - loan.paidAmount;
  const visiblePayments = showAllPay ? loan.payments : loan.payments.slice(0, 5);

  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#F3F3F7] pb-10"
    >
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="bg-white shadow-[0_2px_16px_rgba(10,22,40,0.06)] sticky top-0 z-20 px-5 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-[12px] bg-[#0C7A58]/15 flex items-center justify-center">
              <span className="text-[#0C7A58] font-black text-sm">{user.name[0]}</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-[#0A1628] text-sm leading-none">{user.name}</p>
                {user.verified && (
                  <Shield className="w-3.5 h-3.5 text-[#0C7A58]" />
                )}
              </div>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Договор {loan.contractId}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#0A1628]
                       transition-colors px-3 py-2 rounded-[10px] hover:bg-[#F3F3F7]"
          >
            <LogOut className="w-4 h-4" />
            Выйти
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">

        {/* ── Debt Tracker ─────────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="bg-white rounded-[24px] p-6 shadow-[0_4px_32px_rgba(10,22,40,0.08)]
                     relative overflow-hidden"
        >
          {/* Decorative gradient blob */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#0C7A58]/6 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-[#1A3C6E]/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest mb-1">
                  Активная рассрочка
                </p>
                <p className="text-[13px] text-[#9CA3AF]">Договор № {loan.contractId}</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#0C7A58]/10 text-[#0C7A58]
                               text-xs font-bold">
                Активен
              </span>
            </div>

            {/* Product name */}
            <p className="text-sm text-[#374151] font-medium mb-4">{loan.product}</p>

            {/* Remaining amount */}
            <div className="mb-5">
              <p className="text-xs text-[#9CA3AF] mb-1">Остаток к оплате</p>
              <p className="text-[40px] font-black text-[#0A1628] leading-none tracking-tighter">
                {fmtRub(remaining)}
                <span className="text-2xl font-bold text-[#6B7280] ml-1">₽</span>
              </p>
            </div>

            {/* Progress bar */}
            <div className="mb-5">
              <div className="flex justify-between text-xs text-[#9CA3AF] mb-2">
                <span>Выплачено {fmtRub(loan.paidAmount)} ₽</span>
                <span>{paidPct}%</span>
              </div>
              <div className="w-full h-2.5 bg-[#F3F3F7] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${paidPct}%` }}
                  transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                  className="h-full rounded-full bg-gradient-to-r from-[#0C7A58] to-[#16a37a]"
                />
              </div>
              <div className="flex justify-between text-[11px] text-[#D1D5DB] mt-1.5">
                <span>{loan.startDate}</span>
                <span>{loan.endDate}</span>
              </div>
            </div>

            {/* Next payment */}
            <div className="bg-[#F9FAFB] rounded-[16px] p-4 mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[12px] bg-[#0C7A58]/12 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#0C7A58]" />
                </div>
                <div>
                  <p className="text-xs text-[#9CA3AF]">Ближайший платёж</p>
                  <p className="font-bold text-[#0A1628] text-sm">До {loan.nextDate}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-[#9CA3AF]">Сумма</p>
                <p className="font-black text-[#0A1628] text-lg leading-none">
                  {fmtRub(loan.nextAmount)} ₽
                </p>
              </div>
            </div>

            {/* CTA */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 rounded-[14px] bg-[#0C7A58] text-white font-bold text-base
                         flex items-center justify-center gap-2
                         hover:bg-[#0a6449] active:scale-[.98] transition-all duration-200
                         shadow-lg shadow-[#0C7A58]/30"
            >
              <CreditCard className="w-5 h-5" />
              Внести платёж
            </motion.button>
          </div>
        </motion.div>

        {/* ── Payment Schedule ─────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="bg-white rounded-[24px] p-6 shadow-[0_4px_32px_rgba(10,22,40,0.08)]"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-black text-[#0A1628] text-lg tracking-tight">
              График платежей
            </h3>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#0C7A58]" />
              <span className="text-xs text-[#0C7A58] font-semibold">
                {loan.payments.filter(p => p.status === "paid").length} / {loan.payments.length}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <AnimatePresence initial={false}>
              {visiblePayments.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                  className={`flex items-center justify-between py-3 px-4 rounded-[12px]
                              transition-colors duration-150
                              ${p.status === "upcoming"
                                ? "bg-[#FFF8E6] ring-1 ring-[#F59E0B]/30"
                                : "hover:bg-[#F9FAFB]"}`}
                >
                  <div className="flex items-center gap-3">
                    {p.status === "paid" ? (
                      <CheckCircle className="w-5 h-5 text-[#0C7A58] shrink-0" />
                    ) : p.status === "upcoming" ? (
                      <div className="w-5 h-5 rounded-full border-2 border-[#F59E0B]
                                      flex items-center justify-center shrink-0">
                        <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                      </div>
                    ) : (
                      <Circle className="w-5 h-5 text-[#D1D5DB] shrink-0" />
                    )}
                    <div>
                      <p className={`text-sm font-semibold leading-none
                                     ${p.status === "paid"
                                       ? "text-[#6B7280]"
                                       : p.status === "upcoming"
                                         ? "text-[#92400E]"
                                         : "text-[#0A1628]"}`}>
                        {p.date}
                      </p>
                      {p.status === "upcoming" && (
                        <p className="text-[11px] text-[#F59E0B] font-semibold mt-0.5">
                          Ближайший платёж
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`text-sm font-bold
                                    ${p.status === "paid"
                                      ? "text-[#9CA3AF] line-through"
                                      : p.status === "upcoming"
                                        ? "text-[#92400E]"
                                        : "text-[#0A1628]"}`}>
                    {fmtRub(p.amount)} ₽
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {loan.payments.length > 5 && (
            <button
              onClick={() => setShowAllPay(v => !v)}
              className="mt-4 w-full py-3 rounded-[12px] text-sm font-semibold
                         text-[#0C7A58] flex items-center justify-center gap-1.5
                         hover:bg-[#F3F3F7] transition-colors"
            >
              {showAllPay ? (
                <><ChevronUp className="w-4 h-4" />Свернуть</>
              ) : (
                <><ChevronDown className="w-4 h-4" />Показать все {loan.payments.length} платежей</>
              )}
            </button>
          )}
        </motion.div>

        {/* ── Contract Terms ───────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="bg-white rounded-[24px] shadow-[0_4px_32px_rgba(10,22,40,0.08)] overflow-hidden"
        >
          <button
            onClick={() => setShowTerms(v => !v)}
            className="w-full flex items-center justify-between p-6
                       hover:bg-[#F9FAFB] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[12px] bg-[#0C7A58]/12 flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#0C7A58]" />
              </div>
              <span className="font-bold text-[#0A1628] text-[15px]">Условия договора</span>
            </div>
            <motion.div animate={{ rotate: showTerms ? 180 : 0 }} transition={{ duration: 0.25 }}>
              <ChevronDown className="w-5 h-5 text-[#9CA3AF]" />
            </motion.div>
          </button>

          <AnimatePresence initial={false}>
            {showTerms && (
              <motion.div
                key="terms"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6 space-y-3">
                  {[
                    { icon: "✅", text: "Фиксированная цена — 0% переплат" },
                    { icon: "📖", text: "Мурабаха — дозволенная форма рассрочки по Шариату" },
                    { icon: "🚫", text: "Без штрафов и пени за просрочку" },
                    { icon: "🔒", text: "Цена зафиксирована в договоре и не меняется" },
                    { icon: "📜", text: "Сура 2:275 — запрет риба соблюдается строго" },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.3 }}
                      className="flex items-start gap-3 py-2 border-b border-[#F3F3F7] last:border-0"
                    >
                      <span className="text-lg leading-none mt-0.5">{item.icon}</span>
                      <p className="text-sm text-[#374151] leading-relaxed">{item.text}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Profile ──────────────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="bg-white rounded-[24px] p-6 shadow-[0_4px_32px_rgba(10,22,40,0.08)]"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-[12px] bg-[#EBF0F9] flex items-center justify-center">
              <User className="w-5 h-5 text-[#1A3C6E]" />
            </div>
            <h3 className="font-black text-[#0A1628] text-lg tracking-tight">Профиль</h3>
          </div>

          <div className="space-y-0">
            {[
              { label: "Имя", value: user.name },
              { label: "Телефон", value: user.phone },
              { label: "Договор", value: `№ ${loan.contractId}` },
              { label: "Начало", value: loan.startDate },
              { label: "Окончание", value: loan.endDate },
            ].map(({ label, value }) => (
              <div key={label}
                   className="flex items-center justify-between py-3
                              border-b border-[#F3F3F7] last:border-0">
                <p className="text-sm text-[#9CA3AF]">{label}</p>
                <p className="text-sm font-semibold text-[#0A1628]">{value}</p>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SPINNER
   ───────────────────────────────────────────────────────────── */
function Spinner() {
  return (
    <svg
      className="animate-spin w-4 h-4 text-current"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16 8 8 0 01-8-8z" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT — flow controller
   ═══════════════════════════════════════════════════════════════ */
type Phase = "phone" | "otp" | "dashboard";

export default function LKPage() {
  const [phase, setPhase] = useState<Phase>("phone");
  const [phone, setPhone] = useState("");

  return (
    <div className="font-[system-ui,-apple-system,Segoe_UI,sans-serif]">
      <AnimatePresence mode="wait">
        {phase === "phone" && (
          <PhoneScreen
            key="phone"
            onNext={p => { setPhone(p); setPhase("otp"); }}
          />
        )}
        {phase === "otp" && (
          <OTPScreen
            key="otp"
            phone={phone}
            onBack={() => setPhase("phone")}
            onSuccess={() => setPhase("dashboard")}
          />
        )}
        {phase === "dashboard" && (
          <Dashboard
            key="dashboard"
            onLogout={() => setPhase("phone")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
