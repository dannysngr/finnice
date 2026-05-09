"use client";

/**
 * AuthModal — модальное окно авторизации.
 *
 * Flow:
 *   phone → [needsTelegram?] → telegram (polling) → otp → /lk
 *                           ↓ нет
 *                           otp → /lk
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants }   from "framer-motion";
import {
  ArrowRight, Edit2, Phone, AlertCircle,
  X, MessageCircle, CheckCircle, Loader2,
} from "lucide-react";

/* ─── helpers ─────────────────────────────────────────────── */
function applyPhoneMask(raw: string): string {
  const digits = raw.replace(/\D/g, "").replace(/^7|^8/, "").slice(0, 10);
  let r = "+7";
  if (digits.length > 0) r += " (" + digits.slice(0, 3);
  if (digits.length >= 3) r += ") " + digits.slice(3, 6);
  if (digits.length >= 6) r += "-"  + digits.slice(6, 8);
  if (digits.length >= 8) r += "-"  + digits.slice(8, 10);
  return r;
}

/* ─── animations ──────────────────────────────────────────── */
const cardVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.95, y: 24 },
  visible: { opacity: 1, scale: 1,    y: 0,
             transition: { duration: 0.35, ease: "easeOut" } },
  exit:    { opacity: 0, scale: 0.95, y: 16,
             transition: { duration: 0.2 } },
};
const slide: Variants = {
  hidden:  { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit:    { opacity: 0, x: -30, transition: { duration: 0.2 } },
};

/* ─── Spinner ─────────────────────────────────────────────── */
function Spinner({ className = "" }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} />;
}

/* ─── Shared header ───────────────────────────────────────── */
function ModalHeader({
  onClose,
  backLabel,
  onBack,
}: {
  onClose: () => void;
  backLabel?: string;
  onBack?:   () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {onBack ? (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-semibold
                       text-[#6B7280] hover:text-[#0A1628] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 13L5 8l5-5" stroke="currentColor" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {backLabel ?? "Назад"}
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
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
        )}
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
  );
}

/* ═══════════════════════════════════════════════════════════
   SCREEN 1 — Phone input
   ═══════════════════════════════════════════════════════════ */
function PhoneScreen({
  onSuccess,
  onNeedsTelegram,
  onClose,
}: {
  onSuccess:       (phone: string) => void;
  onNeedsTelegram: (phone: string) => void;
  onClose:         () => void;
}) {
  const [phone,    setPhone]    = useState("+7");
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState("");

  const isReady = phone.replace(/\D/g, "").length === 11;

  const handleSubmit = async () => {
    if (!isReady || loading) return;
    setLoading(true);
    setApiError("");
    try {
      const res  = await fetch("/api/auth/send-code", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (data.needsTelegram) {
        onNeedsTelegram(phone);
        return;
      }
      if (!res.ok || !data.ok) {
        setApiError(data.error ?? "Ошибка отправки кода");
        return;
      }
      onSuccess(phone);
    } catch {
      setApiError("Нет соединения с сервером");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div key="phone" variants={slide} initial="hidden" animate="visible" exit="exit">
      <ModalHeader onClose={onClose} />

      <h2 className="text-[22px] font-black text-[#0A1628] leading-tight tracking-tight mb-6">
        Войти в кабинет
      </h2>

      <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-2 block">
        Номер телефона
      </label>
      <div className="relative mb-4">
        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
        <input
          type="tel"
          inputMode="numeric"
          value={phone}
          onChange={e => { setPhone(applyPhoneMask(e.target.value)); setApiError(""); }}
          onFocus={() => { if (phone === "+7") setPhone("+7 ("); }}
          onKeyDown={e => { if (e.key === "Enter" && isReady) handleSubmit(); }}
          placeholder="+7 (___) ___-__-__"
          className="w-full pl-11 pr-4 py-4 rounded-[14px] bg-[#F3F3F7] text-[#0A1628]
                     font-semibold text-base outline-none transition-all
                     focus:ring-2 focus:ring-[#0C7A58]/40
                     placeholder:text-[#D1D5DB] placeholder:font-normal"
        />
      </div>

      {apiError && (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1.5 text-sm text-red-500 mb-3"
        >
          <AlertCircle className="w-4 h-4 shrink-0" /> {apiError}
        </motion.p>
      )}

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
        {loading
          ? <><Spinner className="w-4 h-4" /> Отправляем код…</>
          : <>Продолжить <ArrowRight className="w-4 h-4" /></>}
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

/* ═══════════════════════════════════════════════════════════
   SCREEN 2 — Telegram linking (shown when no chatId)
   ═══════════════════════════════════════════════════════════ */
function TelegramScreen({
  phone,
  onLinked,
  onBack,
  onClose,
}: {
  phone:    string;
  onLinked: () => void;   // вызывается когда бот привязан
  onBack:   () => void;
  onClose:  () => void;
}) {
  const [status,    setStatus]    = useState<"waiting" | "checking" | "error">("waiting");
  const [pollCount, setPollCount] = useState(0);

  // Polling: проверяем каждые 3 секунды
  useEffect(() => {
    const interval = setInterval(async () => {
      setStatus("checking");
      try {
        const res  = await fetch(`/api/auth/check-linked?phone=${encodeURIComponent(phone)}`);
        const data = await res.json();
        if (data.linked) {
          clearInterval(interval);
          // Номер привязан — отправляем код автоматически
          await fetch("/api/auth/send-code", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ phone }),
          });
          onLinked();
        } else {
          setStatus("waiting");
          setPollCount(c => c + 1);
        }
      } catch {
        setStatus("waiting");
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [phone, onLinked]);

  const dots = ".".repeat((pollCount % 3) + 1).padEnd(3, " ");

  return (
    <motion.div key="telegram" variants={slide} initial="hidden" animate="visible" exit="exit">
      <ModalHeader onClose={onClose} onBack={onBack} backLabel="Назад" />

      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-[20px] bg-[#039BE5]/10 flex items-center justify-center
                        mx-auto mb-4">
          <MessageCircle className="w-8 h-8 text-[#039BE5]" />
        </div>
        <h2 className="text-[20px] font-black text-[#0A1628] tracking-tight mb-2">
          Подключите Telegram
        </h2>
        <p className="text-sm text-[#6B7280] leading-relaxed">
          Ваш номер{" "}
          <span className="font-semibold text-[#0A1628]">{phone}</span>
          {" "}ещё не привязан к боту.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-3 mb-6">
        {[
          { n: "1", text: "Откройте бота по кнопке ниже" },
          { n: "2", text: "Нажмите /start и следуйте инструкциям" },
          { n: "3", text: "Поделитесь своим контактом одним касанием" },
        ].map(s => (
          <div key={s.n} className="flex items-center gap-3 bg-[#F9FAFB] rounded-[12px] px-4 py-3">
            <span className="w-6 h-6 rounded-full bg-[#0C7A58]/15 text-[#0C7A58]
                             text-xs font-black flex items-center justify-center shrink-0">
              {s.n}
            </span>
            <p className="text-sm text-[#374151]">{s.text}</p>
          </div>
        ))}
      </div>

      {/* Open bot button */}
      <a
        href="https://t.me/finnic3_bot"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-4 rounded-[14px]
                   bg-[#039BE5] hover:bg-[#0288CC] text-white font-bold text-base
                   transition-colors shadow-lg shadow-[#039BE5]/25 mb-4"
      >
        <MessageCircle className="w-5 h-5" />
        Открыть @finnic3_bot
      </a>

      {/* Polling status */}
      <div className={`flex items-center justify-center gap-2 py-2 rounded-[10px]
                       text-sm transition-colors
                       ${status === "checking"
                         ? "text-[#0C7A58] bg-[#0C7A58]/6"
                         : "text-[#9CA3AF] bg-[#F3F3F7]"}`}>
        {status === "checking"
          ? <><CheckCircle className="w-4 h-4" /> Проверяем привязку…</>
          : <><Spinner className="w-4 h-4 text-[#9CA3AF]" /> Ожидаем{dots}</>}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SCREEN 3 — OTP input
   ═══════════════════════════════════════════════════════════ */
function OTPScreen({
  phone,
  onSuccess,
  onBack,
  onClose,
}: {
  phone:      string;
  onSuccess:  () => void;
  onBack:     () => void;
  onClose:    () => void;
}) {
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");
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
    setErrMsg("");
    try {
      const res  = await fetch("/api/auth/verify-code", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ phone, code }),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        onSuccess();
      } else {
        setErrMsg(data.error ?? "Неверный код");
        setStatus("error");
        setDigits(["", "", "", ""]);
        setTimeout(() => { refs.current[0]?.focus(); setStatus("idle"); }, 800);
      }
    } catch {
      setErrMsg("Нет соединения с сервером");
      setStatus("error");
      setTimeout(() => { setStatus("idle"); }, 1500);
    }
  };

  const resendCode = async () => {
    await fetch("/api/auth/send-code", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ phone }),
    });
    setDigits(["", "", "", ""]);
    setStatus("idle");
    setErrMsg("");
    refs.current[0]?.focus();
  };

  return (
    <motion.div key="otp" variants={slide} initial="hidden" animate="visible" exit="exit">
      <ModalHeader onClose={onClose} onBack={onBack} backLabel="Назад" />

      <h2 className="text-[22px] font-black text-[#0A1628] leading-tight tracking-tight mb-1">
        Введите код
      </h2>
      <div className="flex items-center gap-1.5 mb-6 flex-wrap">
        <p className="text-sm text-[#6B7280]">Из Telegram на</p>
        <span className="text-sm font-semibold text-[#0A1628]">{phone}</span>
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-semibold text-[#0C7A58]
                     hover:text-[#0a6449] transition-colors"
        >
          <Edit2 className="w-3 h-3" />
          Изменить
        </button>
      </div>

      {/* 4 cells */}
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
      <div className="min-h-[28px] flex items-center justify-center mb-2">
        {status === "loading" && (
          <span className="flex items-center gap-2 text-sm text-[#6B7280]">
            <Spinner className="w-4 h-4" /> Проверяем…
          </span>
        )}
        {status === "error" && errMsg && (
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1.5 text-sm text-red-500"
          >
            <AlertCircle className="w-4 h-4" /> {errMsg}
          </motion.span>
        )}
      </div>

      <p className="text-xs text-[#9CA3AF] text-center">
        Не получили?{" "}
        <button
          onClick={resendCode}
          className="text-[#0C7A58] font-semibold hover:text-[#0a6449] transition-colors"
        >
          Отправить снова
        </button>
      </p>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROOT — AuthModal
   ═══════════════════════════════════════════════════════════ */
type Phase = "phone" | "telegram" | "otp";

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("phone");
  const [phone, setPhone] = useState("");

  const resetAndClose = useCallback(() => {
    onClose();
    // Сбрасываем фазу с задержкой, чтобы анимация закрытия успела сыграть
    setTimeout(() => { setPhase("phone"); setPhone(""); }, 300);
  }, [onClose]);

  // Сбрасываем при каждом открытии
  useEffect(() => {
    if (open) { setPhase("phone"); setPhone(""); }
  }, [open]);

  // Блокируем scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") resetAndClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [resetAndClose]);

  const handleSuccess = () => {
    resetAndClose();
    router.push("/lk");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={resetAndClose}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
          />

          {/* Card */}
          <div className="fixed inset-0 z-[61] flex items-center justify-center
                          px-4 py-8 pointer-events-none">
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
                {phase === "phone" && (
                  <PhoneScreen
                    key="phone"
                    onSuccess={p => { setPhone(p); setPhase("otp"); }}
                    onNeedsTelegram={p => { setPhone(p); setPhase("telegram"); }}
                    onClose={resetAndClose}
                  />
                )}
                {phase === "telegram" && (
                  <TelegramScreen
                    key="telegram"
                    phone={phone}
                    onLinked={() => setPhase("otp")}
                    onBack={() => setPhase("phone")}
                    onClose={resetAndClose}
                  />
                )}
                {phase === "otp" && (
                  <OTPScreen
                    key="otp"
                    phone={phone}
                    onSuccess={handleSuccess}
                    onBack={() => setPhase("phone")}
                    onClose={resetAndClose}
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
