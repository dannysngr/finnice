"use client";

/**
 * AuthModal — модальное окно авторизации в стиле Dodo Pizza.
 * Открывается по клику на «Войти» в шапке.
 * Flow: PhoneScreen → OTPScreen → редирект на /lk
 */

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { ArrowRight, Edit2, Phone, AlertCircle, X } from "lucide-react";

/* ─── helpers ─────────────────────────────────────────────── */
function applyPhoneMask(raw: string): string {
  const digits = raw.replace(/\D/g, "").replace(/^7|^8/, "").slice(0, 10);
  let result = "+7";
  if (digits.length > 0) result += " (" + digits.slice(0, 3);
  if (digits.length >= 3) result += ") " + digits.slice(3, 6);
  if (digits.length >= 6) result += "-" + digits.slice(6, 8);
  if (digits.length >= 8) result += "-" + digits.slice(8, 10);
  return result;
}

/* ─── animation presets ───────────────────────────────────── */
const cardVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.95, y: 24 },
  visible: { opacity: 1, scale: 1,    y: 0,
             transition: { duration: 0.35, ease: "easeOut" } },
  exit:    { opacity: 0, scale: 0.95, y: 16,
             transition: { duration: 0.2 } },
};

const slideLeft: Variants = {
  hidden:  { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit:    { opacity: 0, x: -30, transition: { duration: 0.2 } },
};

/* ─── Spinner ─────────────────────────────────────────────── */
function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4" />
      <path  className="opacity-75" fill="currentColor"
             d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16 8 8 0 01-8-8z" />
    </svg>
  );
}

/* ─── PhoneScreen ─────────────────────────────────────────── */
function PhoneScreen({
  onNext,
  onClose,
}: {
  onNext: (phone: string) => void;
  onClose: () => void;
}) {
  const [phone,   setPhone]   = useState("+7");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(applyPhoneMask(e.target.value));
  };

  const isReady = phone.replace(/\D/g, "").length === 11;

  const handleSubmit = async () => {
    if (!isReady || loading) return;
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
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[14px] bg-[#0C7A58] flex items-center justify-center
                          shadow-md shadow-[#0C7A58]/30">
            <span className="text-white font-black text-base tracking-tight">NF</span>
          </div>
          <div>
            <p className="font-black text-[#0A1628] text-base leading-none tracking-tight">
              ФинНайс
            </p>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">Личный кабинет</p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Закрыть"
          className="w-8 h-8 rounded-full bg-[#F3F3F7] hover:bg-[#E5E7EB]
                     flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-[#6B7280]" />
        </button>
      </div>

      <h2 className="text-[22px] font-black text-[#0A1628] leading-tight tracking-tight mb-6">
        Войти в кабинет
      </h2>

      <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-2 block">
        Номер телефона
      </label>
      <div className="relative mb-4">
        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          value={phone}
          onChange={handleInput}
          onFocus={() => { if (phone === "+7") setPhone("+7 ("); }}
          onKeyDown={e => { if (e.key === "Enter" && isReady) handleSubmit(); }}
          placeholder="+7 (___) ___-__-__"
          className="w-full pl-11 pr-4 py-4 rounded-[14px] bg-[#F3F3F7] text-[#0A1628]
                     font-semibold text-base outline-none transition-all
                     focus:ring-2 focus:ring-[#0C7A58]/40
                     placeholder:text-[#D1D5DB] placeholder:font-normal"
        />
      </div>

      <motion.button
        onClick={handleSubmit}
        disabled={!isReady || loading}
        whileTap={{ scale: 0.97 }}
        className={`w-full py-4 rounded-[14px] font-bold text-base text-white
                    flex items-center justify-center gap-2 transition-all duration-200
                    ${isReady && !loading
                      ? "bg-[#0C7A58] hover:bg-[#0a6449] shadow-lg shadow-[#0C7A58]/25"
                      : "bg-[#D1D5DB] cursor-not-allowed"}`}
      >
        {loading ? (
          <><Spinner /> Отправляем код…</>
        ) : (
          <>Продолжить <ArrowRight className="w-4 h-4" /></>
        )}
      </motion.button>

      <p className="text-[11px] text-[#9CA3AF] text-center mt-4 leading-relaxed">
        Продолжая, вы соглашаетесь с условиями наших{" "}
        <a href="/politika/" className="underline underline-offset-2 hover:text-[#0C7A58] transition-colors">
          юридических документов
        </a>
      </p>
    </motion.div>
  );
}

/* ─── OTPScreen ───────────────────────────────────────────── */
function OTPScreen({
  phone,
  onBack,
  onSuccess,
  onClose,
}: {
  phone: string;
  onBack: () => void;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { refs.current[0]?.focus(); }, []);

  const handleDigit = (idx: number, val: string) => {
    const d = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = d;
    setDigits(next);
    if (d && idx < 3) refs.current[idx + 1]?.focus();
    if (d && idx === 3) verify(next.join(""));
  };

  const handleKey = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (text.length === 4) { setDigits(text.split("")); verify(text); }
  };

  const verify = async (code: string) => {
    setStatus("loading");
    await new Promise(r => setTimeout(r, 1100));
    if (code.length === 4) {
      onSuccess();
    } else {
      setStatus("error");
      setDigits(["", "", "", ""]);
      refs.current[0]?.focus();
    }
  };

  return (
    <motion.div
      key="otp"
      variants={slideLeft}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-[#6B7280]
                     hover:text-[#0A1628] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 13L5 8l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Назад
        </button>
        <button
          onClick={onClose}
          aria-label="Закрыть"
          className="w-8 h-8 rounded-full bg-[#F3F3F7] hover:bg-[#E5E7EB]
                     flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-[#6B7280]" />
        </button>
      </div>

      <h2 className="text-[22px] font-black text-[#0A1628] leading-tight tracking-tight mb-1">
        Введите код
      </h2>
      <div className="flex items-center gap-1.5 mb-6">
        <p className="text-sm text-[#6B7280]">Из Telegram или СМС на {phone}</p>
        <button
          onClick={onBack}
          className="shrink-0 flex items-center gap-1 text-sm font-semibold
                     text-[#0C7A58] hover:text-[#0a6449] transition-colors"
        >
          <Edit2 className="w-3 h-3" />
          Изменить
        </button>
      </div>

      {/* 4 OTP cells */}
      <div className="flex gap-3 justify-between mb-4" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <motion.input
            key={i}
            ref={el => { refs.current[i] = el; }}
            type="tel"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={e => handleDigit(i, e.target.value)}
            onKeyDown={e => handleKey(i, e)}
            animate={status === "error" ? { x: [0, -5, 5, -5, 5, 0] } : {}}
            transition={{ duration: 0.3 }}
            className={`w-full aspect-square max-w-[72px] text-center text-2xl font-black
                        rounded-[14px] outline-none transition-all duration-150 caret-transparent
                        ${d
                          ? "bg-[#0C7A58]/10 text-[#0C7A58] ring-2 ring-[#0C7A58]/40"
                          : "bg-[#F3F3F7] text-[#0A1628] focus:ring-2 focus:ring-[#0C7A58]/40"}
                        ${status === "error" ? "ring-2 ring-red-400 bg-red-50" : ""}`}
          />
        ))}
      </div>

      {/* Status */}
      <div className="min-h-[28px] flex items-center justify-center">
        {status === "loading" && (
          <span className="flex items-center gap-2 text-sm text-[#6B7280]">
            <Spinner /> Проверяем…
          </span>
        )}
        {status === "error" && (
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1.5 text-sm text-red-500"
          >
            <AlertCircle className="w-4 h-4" />
            Неверный код. Попробуйте ещё раз
          </motion.span>
        )}
      </div>

      <p className="text-xs text-[#9CA3AF] text-center mt-3">
        Не получили?{" "}
        <button className="text-[#0C7A58] font-semibold hover:text-[#0a6449] transition-colors">
          Отправить снова
        </button>
      </p>
    </motion.div>
  );
}

/* ═══ AuthModal — root export ═════════════════════════════════ */
type AuthPhase = "phone" | "otp";

export function AuthModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<AuthPhase>("phone");
  const [phone, setPhone] = useState("");

  /* reset when modal opens */
  useEffect(() => {
    if (open) { setPhase("phone"); setPhone(""); }
  }, [open]);

  /* lock body scroll */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  /* close on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSuccess = () => {
    onClose();
    router.push("/lk");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Backdrop ─────────────────────────────────────── */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
          />

          {/* ── Modal card ───────────────────────────────────── */}
          <div className="fixed inset-0 z-[61] flex items-center justify-center px-4 py-8
                          pointer-events-none">
            <motion.div
              key="card"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-[28px]
                         shadow-[0_24px_80px_rgba(10,22,40,0.22)]
                         p-6 pointer-events-auto overflow-hidden"
            >
              <AnimatePresence mode="wait">
                {phase === "phone" ? (
                  <PhoneScreen
                    key="phone"
                    onNext={p => { setPhone(p); setPhase("otp"); }}
                    onClose={onClose}
                  />
                ) : (
                  <OTPScreen
                    key="otp"
                    phone={phone}
                    onBack={() => setPhase("phone")}
                    onSuccess={handleSuccess}
                    onClose={onClose}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
