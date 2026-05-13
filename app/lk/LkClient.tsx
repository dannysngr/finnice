"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, type Variants }    from "framer-motion";
import {
  LogOut, Pencil, Check, X,
  Shield, Phone, CreditCard,
  TrendingUp, Calendar, ChevronRight, Loader2,
  AlertCircle, ArrowRight, Edit2, Sparkles,
} from "lucide-react";
import Link from "next/link";
import type { LoanRecord } from "@/app/api/lk/me/route";
import { pluralPayment } from "@/lib/calculator-logic";
import { computeProfileCompletion } from "@/lib/profile-completion";
import { FinniceLogo } from "@/components/FinniceLogo";
import {
  maskPassportSeries, maskPassportNumber, maskDepartmentCode,
  PASSPORT_SERIES_PLACEHOLDER, PASSPORT_NUMBER_PLACEHOLDER, DEPT_CODE_PLACEHOLDER,
} from "@/lib/passport-mask";
import { phoneInputOnChange, shouldBlockPhoneKeyDown } from "@/lib/phone-mask";

/* ─────────────────────────────────────────────────────────────
   TYPES
   ───────────────────────────────────────────────────────────── */
interface MeData {
  phone:          string;
  lastName:       string | null;
  firstName:      string | null;
  patronymic:     string | null;
  birthDate:      string | null;
  avatarUrl:      string | null;
  trustScore:     number;
  loans:          LoanRecord[];
  birthPlaceCity: string | null;
  addrCity:       string | null;
  addrStreet:     string | null;
  addrHouse:      string | null;
  addrApt:        string | null;
  // Паспорт
  passportSeries?:         string | null;
  passportNumber?:         string | null;
  passportIssueDate?:      string | null;
  passportIssuedBy?:       string | null;
  passportDepartmentCode?: string | null;
  // Адрес проживания
  livingSameAsRegister?: boolean;
  livingCity?:   string | null;
  livingStreet?: string | null;
  livingHouse?:  string | null;
  livingApt?:    string | null;
  email?:        string | null;
  guarantor1FullName?: string | null;
  guarantor1Phone?:    string | null;
  guarantor2FullName?: string | null;
  guarantor2Phone?:    string | null;
  adminRole?:     "root" | "admin" | "moderator" | null;
}

/* ─────────────────────────────────────────────────────────────
   DESIGN TOKENS
   ───────────────────────────────────────────────────────────── */
const C = {
  brand:      "#0C7A58",
  brandDark:  "#074d38",
  brandDeep:  "#062e22",
  brandMid:   "#0a6449",
  brandLight: "#E8F5F0",
  brandSoft:  "rgba(12,122,88,0.12)",
  bg:         "#F0F4F2",
  dark:       "#0a1f17",
  mid:        "#4a7060",
  muted:      "#7a9e90",
  border:     "rgba(255,255,255,0.35)",
  glass:      "rgba(255,255,255,0.60)",
  glassDark:  "rgba(12,74,58,0.55)",
  green:      "#10B981",
  greenLight: "#ECFDF5",
  amber:      "#F59E0B",
  red:        "#EF4444",
};

/* ─────────────────────────────────────────────────────────────
   DAILY TIPS
   ───────────────────────────────────────────────────────────── */
const TIPS = [
  { icon: "🌙", ar: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", ru: "«Поистине, после трудности — облегчение»", ref: "Сура 94:6" },
  { icon: "📖", ar: "وَعَلَى اللَّهِ فَتَوَكَّلُوا", ru: "«И на Аллаха уповайте» — Он достаточен тому, кто полагается на Него", ref: "Сура 5:23" },
  { icon: "🤲", ar: "أَدُّوا الْأَمَانَاتِ إِلَى أَهْلِهَا", ru: "«Возвращайте доверенное тем, кто вверил вам» — добросовестная выплата долга — знак честности", ref: "Сура 4:58" },
  { icon: "⭐", ar: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ", ru: "«Кто полагается на Аллаха — тому Он достаточен» — планируйте, доверяя Творцу", ref: "Сура 65:3" },
  { icon: "💚", ar: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا", ru: "«Аллах не возлагает на душу больше, чем она может снести» — вы справитесь", ref: "Сура 2:286" },
  { icon: "🕌", ar: "خُذِ الْعَفْوَ وَأْمُرْ بِالْعُرْفِ", ru: "«Будь снисходителен, повелевай одобряемое» — умеренность в расходах — мудрость", ref: "Сура 7:199" },
  { icon: "✨", ar: "وَأَن لَّيْسَ لِلْإِنسَانِ إِلَّا مَا سَعَى", ru: "«Человеку принадлежит лишь то, к чему он стремился» — каждый платёж приближает свободу", ref: "Сура 53:39" },
];

/* ─────────────────────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────────────────────── */
function fmt(n: number) { return n.toLocaleString("ru-RU"); }

function displayPhone(phone: string) {
  const d = phone.replace(/\D/g, "").replace(/^[78]/, "");
  if (d.length !== 10) return phone;
  return `+7 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8)}`;
}

function initials(lastName?: string | null, firstName?: string | null, phone?: string) {
  if (lastName && firstName) return (lastName[0] + firstName[0]).toUpperCase();
  if (firstName) return firstName.slice(0, 2).toUpperCase();
  if (lastName)  return lastName.slice(0, 2).toUpperCase();
  const d = (phone ?? "").replace(/\D/g, "").slice(-2);
  return d || "?";
}

function getTodayTip() {
  return TIPS[new Date().getDay() % TIPS.length];
}

function formatGreeting(firstName: string | null, lastName: string | null): string {
  const name = firstName?.trim() ?? lastName?.trim() ?? null;
  return name
    ? `Мир и благословение Творца тебе, ${name}`
    : "Мир и благословение Творца тебе";
}

/* Trust Rating helpers */
interface TrustLevel {
  label:    string;
  minScore: number;
  color:    string;
  discount: string;
  next:     string | null;
  nextScore: number;
}
const TRUST_LEVELS: TrustLevel[] = [
  { label: "Standart", minScore: 0, color: "#9CA3AF", discount: "",      next: "Bronze", nextScore: 1 },
  { label: "Bronze",   minScore: 1, color: "#B45309", discount: "−0.2%", next: "Silver", nextScore: 3 },
  { label: "Silver",   minScore: 3, color: "#94A3B8", discount: "−0.5%", next: "Gold",   nextScore: 5 },
  { label: "Gold",     minScore: 5, color: "#C8972B", discount: "−1%",   next: null,     nextScore: 5 },
];
function getTrustLevel(score: number): TrustLevel {
  return [...TRUST_LEVELS].reverse().find(l => score >= l.minScore) ?? TRUST_LEVELS[0];
}

/* Подсказки для sidebar */
const TRUST_TOOLTIPS: Record<string, string> = {
  "Standart": "Базовый уровень после регистрации. Стандартные условия рассрочки.",
  "Bronze":   "1 закрытая рассрочка без просрочек. Скидка −0.2% на наценку.",
  "Silver":   "3 закрытых рассрочки. Лимит до 150 000 ₽ без поручителей. Скидка −0.5% на наценку.",
  "Gold":     "5+ закрытых рассрочек — высший уровень. Персональная скидка −1% и приоритетная обработка заявок.",
};

/* Города Чеченской Республики */
const CHECHEN_CITIES = [
  "Грозный", "Гудермес", "Аргун", "Шали", "Урус-Мартан",
  "Наур", "Ачхой-Мартан", "Курчалой", "Ножай-Юрт", "Серноводск",
  "Шелковская", "Знаменское", "Бамут", "Самашки", "Старопромысловский",
];

/* ─────────────────────────────────────────────────────────────
   TRUST SIDEBAR  — вертикальная шкала уровней доверия для ЛК
   ───────────────────────────────────────────────────────────── */
function TrustSidebar({ score }: { score: number }) {
  const [tip, setTip] = useState<string | null>(null);

  return (
    <div className="flex flex-col">
      <p className="text-[10px] font-black uppercase tracking-widest mb-4"
         style={{ color: C.muted }}>Уровень</p>

      {TRUST_LEVELS.map((lvl, idx) => {
        const isActive = score >= lvl.minScore && (
          TRUST_LEVELS[idx + 1] ? score < TRUST_LEVELS[idx + 1].minScore : true
        );
        const isPassed = score >= (TRUST_LEVELS[idx + 1]?.minScore ?? Infinity);

        return (
          <div key={lvl.label} className="relative flex flex-col">
            {/* Коннектор между уровнями */}
            {idx < TRUST_LEVELS.length - 1 && (
              <div
                className="absolute left-[13px] top-[28px] w-[2px] h-[22px] -translate-x-1/2 z-0 rounded-full"
                style={{ background: isPassed ? lvl.color + "70" : "rgba(0,0,0,0.10)" }}
              />
            )}

            <button
              onMouseEnter={() => setTip(lvl.label)}
              onMouseLeave={() => setTip(null)}
              className="relative z-10 flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] border
                         text-left transition-all duration-200 cursor-default mb-[22px] last:mb-0"
              style={{
                borderColor: isActive ? lvl.color + "90" : isPassed ? lvl.color + "35" : "rgba(0,0,0,0.07)",
                background:  isActive ? lvl.color + "18" : "transparent",
                boxShadow:   isActive ? `0 2px 10px ${lvl.color}25` : "none",
              }}
            >
              {/* Кружок-иконка */}
              <span
                className="w-[22px] h-[22px] rounded-full shrink-0 flex items-center justify-center text-[11px] font-black"
                style={{
                  background: isActive ? lvl.color
                            : isPassed ? lvl.color + "25"
                            : "rgba(0,0,0,0.08)",
                  color:      isActive ? "#fff"
                            : isPassed ? lvl.color
                            : C.muted,
                  boxShadow:  isActive ? `0 0 8px ${lvl.color}70` : "none",
                }}
              >
                {isPassed || isActive ? "✓" : "·"}
              </span>

              {/* Название уровня */}
              <span
                className="text-[13px] font-semibold leading-none whitespace-nowrap"
                style={{
                  color: isActive ? lvl.color
                       : isPassed ? lvl.color + "cc"
                       : "rgba(0,0,0,0.25)",
                }}
              >
                {lvl.label}
              </span>
            </button>

            {/* Tooltip */}
            {tip === lvl.label && (
              <div
                className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 w-48 rounded-[12px]
                           px-3 py-2.5 text-[11px] leading-relaxed shadow-2xl pointer-events-none"
                style={{
                  background: C.dark,
                  border:     `1px solid ${lvl.color}50`,
                  color:      "rgba(255,255,255,0.80)",
                }}
              >
                <p className="font-bold text-[12px] mb-1" style={{ color: lvl.color }}>{lvl.label}</p>
                {TRUST_TOOLTIPS[lvl.label]}
                {lvl.discount && (
                  <p className="mt-1.5 font-semibold" style={{ color: lvl.color }}>
                    Скидка: {lvl.discount}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ANIMATION VARIANTS
   ───────────────────────────────────────────────────────────── */
const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: i * 0.09 },
  }),
};

const slideIn: Variants = {
  hidden:  { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, x: -40, transition: { duration: 0.25 } },
};

/* ═══════════════════════════════════════════════════════════════
   AUTH GATE
   ═══════════════════════════════════════════════════════════════ */
type AuthStep = "phone" | "telegram" | "otp";

function AuthGate() {
  const [step, setStep]     = useState<AuthStep>("phone");
  const [phoneDigits, setPhoneDigits] = useState(""); // только цифры, макс 10
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [code, setCode]     = useState(["", "", "", ""]);
  const [busy, setBusy]     = useState(false);
  const [err,  setErr]      = useState("");
  const inputRefs           = useRef<(HTMLInputElement | null)[]>([]);
  const phoneInputRef       = useRef<HTMLInputElement | null>(null);
  const pollRef             = useRef<ReturnType<typeof setInterval> | null>(null);

  const phoneReady = phoneDigits.length === 10;
  const fullPhone  = "+7" + phoneDigits;

  // Форматирование только для визуального слоя
  const phoneFormatted = (() => {
    const d = phoneDigits;
    const parts: string[] = [];
    if (d.length > 0) parts.push(d.slice(0, 3));
    if (d.length > 3) parts.push(d.slice(3, 6));
    if (d.length > 6) parts.push(d.slice(6, 8));
    if (d.length > 8) parts.push(d.slice(8, 10));
    return parts.join(" ");
  })();

  const handleSendCode = async () => {
    if (!phoneReady || busy) return;
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/auth/send-code", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone }),
      });
      const d = await r.json();
      if (d.needsTelegram) { setStep("telegram"); startPolling(); }
      else if (d.ok)        setStep("otp");
      else                  setErr(d.error ?? "Ошибка. Повторите.");
    } catch { setErr("Нет соединения."); }
    finally  { setBusy(false); }
  };

  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const r = await fetch(`/api/auth/check-linked?phone=${encodeURIComponent(fullPhone)}`);
      const d = await r.json();
      if (d.linked) {
        clearInterval(pollRef.current!);
        await fetch("/api/auth/send-code", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: fullPhone }),
        });
        setStep("otp");
      }
    }, 2500);
  }, [fullPhone]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const handleDigit = (i: number, val: string) => {
    const d = val.replace(/\D/g, "").slice(-1);
    const next = [...code]; next[i] = d; setCode(next);
    if (d && i < 3) inputRefs.current[i + 1]?.focus();
    if (d && i === 3) verifyOtp(next.join(""));
  };
  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (text.length === 4) { setCode(text.split("")); verifyOtp(text); }
  };

  const verifyOtp = async (c: string) => {
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/auth/verify-code", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone, code: c }),
      });
      const d = await r.json();
      if (d.ok) window.location.reload();
      else { setErr(d.error ?? "Неверный код"); setCode(["","","",""]); inputRefs.current[0]?.focus(); }
    } catch { setErr("Нет соединения."); }
    finally  { setBusy(false); }
  };

  useEffect(() => { if (step === "otp") inputRefs.current[0]?.focus(); }, [step]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
         style={{ background: `linear-gradient(160deg, ${C.brandDeep} 0%, ${C.brandDark} 40%, #0f5c40 70%, #1a8a62 100%)` }}>
      {/* Decorative orbs */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
           style={{ background: "radial-gradient(circle, #22c55e, transparent)" }} />
      <div className="absolute -bottom-40 -left-20 w-80 h-80 rounded-full opacity-15 blur-3xl pointer-events-none"
           style={{ background: "radial-gradient(circle, #4ade80, transparent)" }} />

      <div className="w-full max-w-sm relative z-10">
        <motion.div variants={fadeUp} initial="hidden" animate="visible"
                    className="flex flex-col items-center mb-8">
          <Link href="/" className="flex flex-col items-center group mb-3">
            <div className="w-16 h-16 rounded-[20px] flex items-center justify-center mb-4 shadow-lg"
                 style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)",
                   border: "1px solid rgba(255,255,255,0.25)" }}>
              <FinniceLogo size={40} variant="mark" />
            </div>
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-white" style={{ fontFamily: "system-ui" }}>
            finnice
          </h1>
          <p className="text-sm mt-1 text-white/60">Рассрочка по Шариату</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === "phone" && (
            <motion.div key="phone" variants={slideIn} initial="hidden" animate="visible" exit="exit"
                        className="rounded-[24px] p-6"
                        style={{ background: C.glass, backdropFilter: "blur(24px) saturate(1.5)",
                          border: `1px solid ${C.border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
              <h2 className="text-[20px] font-black mb-1" style={{ color: C.dark }}>Войти в кабинет</h2>
              <p className="text-sm mb-6" style={{ color: C.mid }}>Введите ваш номер телефона</p>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
                     style={{ color: C.mid }}>Телефон</label>

              {/* ── Ghost Input ─────────────────────────────────────────── */}
              <div className="relative"
                   onClick={() => phoneInputRef.current?.focus()}>

                {/* Скрытый инпут — браузер видит только чистые цифры, никаких масок */}
                <input
                  ref={phoneInputRef}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={phoneDigits}
                  maxLength={10}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setPhoneDigits(digits);
                    setErr("");
                  }}
                  onFocus={() => setPhoneFocused(true)}
                  onBlur={() => setPhoneFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && phoneReady) handleSendCode();
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-text z-10"
                  style={{ caretColor: "transparent" }}
                  aria-label="Номер телефона"
                />

                {/* Визуальный слой */}
                <div className="w-full pl-11 pr-4 py-4 rounded-[14px] text-base font-semibold select-none flex items-center transition-all"
                     style={{
                       background: "rgba(255,255,255,0.7)",
                       boxShadow: `inset 0 0 0 2px ${
                         phoneFocused ? C.brand + "80"
                         : phoneReady  ? C.brand + "55"
                         : "transparent"
                       }`,
                     }}>
                  <Phone className="shrink-0 mr-3 w-4 h-4" style={{ color: C.muted }} />
                  <span className="flex items-center">
                    {phoneDigits ? (
                      <>
                        <span style={{ color: C.mid }}>+7 </span>
                        <span style={{ color: C.dark }}>{phoneFormatted}</span>
                      </>
                    ) : (
                      <span style={{ color: C.muted }}>+7 928 491 08 08</span>
                    )}
                    {phoneFocused && (
                      <span className="nf-caret inline-block w-px rounded-sm ml-px"
                            style={{ height: "1.15em", background: C.brand, verticalAlign: "text-bottom" }} />
                    )}
                  </span>
                </div>
              </div>
              {err && <p className="text-sm mt-3 text-red-500 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />{err}</p>}
              <motion.button onClick={handleSendCode} disabled={!phoneReady || busy} whileTap={{ scale: 0.97 }}
                className="mt-5 w-full py-4 rounded-[14px] font-bold text-white text-base flex items-center justify-center gap-2 transition-all"
                style={{ background: phoneReady && !busy
                  ? `linear-gradient(135deg, ${C.brand}, ${C.brandMid})`
                  : "rgba(0,0,0,0.12)",
                  cursor: phoneReady && !busy ? "pointer" : "not-allowed" }}>
                {busy ? <><Loader2 className="w-4 h-4 animate-spin" />Отправляем…</>
                      : <>Продолжить <ArrowRight className="w-4 h-4" /></>}
              </motion.button>
            </motion.div>
          )}

          {step === "telegram" && (
            <motion.div key="telegram" variants={slideIn} initial="hidden" animate="visible" exit="exit"
                        className="rounded-[24px] p-6 text-center"
                        style={{ background: C.glass, backdropFilter: "blur(24px)",
                          border: `1px solid ${C.border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl"
                   style={{ background: C.brandLight }}>✈️</div>
              <h2 className="text-[20px] font-black mb-2" style={{ color: C.dark }}>Привяжите Telegram</h2>
              <p className="text-sm mb-5" style={{ color: C.mid }}>
                Откройте бота и поделитесь контактом — код придёт автоматически
              </p>
              <a href="https://t.me/finnic3_bot" target="_blank" rel="noreferrer"
                 className="inline-flex items-center gap-2 px-5 py-3 rounded-[14px] font-bold text-white mb-5"
                 style={{ background: "#0088CC" }}>
                Открыть @finnic3_bot <ChevronRight className="w-4 h-4" />
              </a>
              <div className="flex items-center gap-2 justify-center text-sm" style={{ color: C.mid }}>
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: C.brand }} />
                Ожидаем подтверждение…
              </div>
              <button onClick={() => setStep("phone")} className="mt-4 text-sm underline" style={{ color: C.muted }}>
                Изменить номер
              </button>
            </motion.div>
          )}

          {step === "otp" && (
            <motion.div key="otp" variants={slideIn} initial="hidden" animate="visible" exit="exit"
                        className="rounded-[24px] p-6"
                        style={{ background: C.glass, backdropFilter: "blur(24px)",
                          border: `1px solid ${C.border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
              <h2 className="text-[20px] font-black mb-1" style={{ color: C.dark }}>Введите код</h2>
              <div className="flex items-center gap-2 mb-6">
                <p className="text-sm" style={{ color: C.mid }}>Из Telegram на +7 {phoneFormatted}</p>
                <button onClick={() => { setStep("phone"); setPhoneDigits(""); setErr(""); }} className="flex items-center gap-1 text-sm font-semibold"
                        style={{ color: C.brand }}>
                  <Edit2 className="w-3 h-3" />Изменить
                </button>
              </div>
              <div className="flex gap-3 justify-center mb-4" onPaste={handlePaste}>
                {code.map((d, i) => (
                  <motion.input key={i} animate={err ? { x: [0,-6,6,-6,0] } : {}} transition={{ duration: 0.3 }}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="tel" inputMode="numeric" maxLength={1} value={d}
                    onChange={e => handleDigit(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className="w-14 h-16 text-center text-2xl font-black rounded-[14px] outline-none transition-all caret-transparent"
                    style={{
                      background: d ? C.brandLight : "rgba(255,255,255,0.7)",
                      color: d ? C.brand : C.dark,
                      boxShadow: `inset 0 0 0 2px ${err ? C.red : d ? C.brand : "transparent"}`,
                    }} />
                ))}
              </div>
              {busy && <p className="text-sm text-center flex items-center justify-center gap-2" style={{ color: C.mid }}>
                <Loader2 className="w-4 h-4 animate-spin" />Проверяем…</p>}
              {err && <p className="text-sm text-center flex items-center justify-center gap-1.5 text-red-500">
                <AlertCircle className="w-4 h-4" />{err}</p>}
              <p className="text-xs text-center mt-4" style={{ color: C.mid }}>
                Не пришёл?{" "}
                <button className="font-semibold underline" style={{ color: C.brand }}
                        onClick={handleSendCode}>Отправить снова</button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-xs mt-6 text-white/40">Без процентов · Сура 2:275</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PROGRESS BAR  (с опциональным glow через пропс)
   ═══════════════════════════════════════════════════════════════ */
function ProgressBar({ pct, glow = false }: { pct: number; glow?: boolean }) {
  return (
    <div className="w-full h-2.5 rounded-full overflow-visible"
         style={{ background: "rgba(0,0,0,0.07)" }}>
      <motion.div
        className="h-full rounded-full transition-all duration-300"
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, pct)}%` }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
        style={{
          background: pct >= 100
            ? `linear-gradient(90deg, ${C.green}, #34d399)`
            : `linear-gradient(90deg, ${C.brandDark}, ${C.brand}, #34d399)`,
          boxShadow: glow
            ? `0 0 12px 3px rgba(12,122,88,0.55), 0 0 4px 1px rgba(52,211,153,0.4)`
            : "none",
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAYMENT SCHEDULE generator
   ═══════════════════════════════════════════════════════════════ */
interface PaymentRow {
  idx:    number;    // 1-based
  date:   string;   // "DD.MM.YYYY"
  amount: number;
  label:  string;   // "Взнос" | "Платёж N"
  paid:   boolean;
}

function buildSchedule(loan: LoanRecord): PaymentRow[] {
  if (!loan.startDate || loan.termMonths < 1) return [];

  const start     = new Date(loan.startDate);
  const monthly   = loan.monthlyPayment;
  const term      = loan.termMonths;
  // Взнос = сумма – ежемесячный × (срок – 1)
  const downAmt   = Math.max(0, loan.totalAmount - monthly * (term - 1));
  const today     = new Date();
  today.setHours(0, 0, 0, 0);

  // Накопленный итог для определения «оплачено»
  let accumulated = 0;

  return Array.from({ length: term }, (_, i) => {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i);
    const isFirst  = i === 0;
    const amount   = isFirst ? downAmt : monthly;
    accumulated   += amount;
    const paid     = loan.paidAmount >= accumulated || d < today;
    const dateStr  = d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
    return {
      idx:    i + 1,
      date:   dateStr,
      amount,
      label:  isFirst ? "Взнос" : `Платёж ${i + 1}`,
      paid,
    };
  });
}

/* ═══════════════════════════════════════════════════════════════
   LOAN CARD  — glassmorphism + hover lift + progress glow
   ═══════════════════════════════════════════════════════════════ */
function LoanCard({ loan }: { loan: LoanRecord }) {
  const [hovered,      setHovered]      = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const pct       = loan.totalAmount > 0 ? Math.round((loan.paidAmount / loan.totalAmount) * 100) : 0;
  const remaining = loan.totalAmount - loan.paidAmount;
  const schedule  = buildSchedule(loan);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3, transition: { duration: 0.22, ease: "easeOut" } }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="rounded-[18px] p-4 relative cursor-default"
      style={{
        background:     C.glass,
        backdropFilter: "blur(20px) saturate(1.6)",
        WebkitBackdropFilter: "blur(20px) saturate(1.6)",
        border:         `1px solid ${hovered ? "rgba(255,255,255,0.6)" : C.border}`,
        boxShadow:      hovered
          ? `0 20px 50px rgba(12,74,58,0.20), 0 4px 16px rgba(0,0,0,0.08)`
          : `0 6px 28px rgba(12,74,58,0.10), 0 2px 8px rgba(0,0,0,0.05)`,
        transition: "box-shadow 0.25s ease, border-color 0.25s ease",
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <motion.div
          className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
          animate={{ background: hovered
            ? `linear-gradient(135deg, ${C.brand}, ${C.brandMid})`
            : C.brandLight }}
          transition={{ duration: 0.3 }}
        >
          <CreditCard className="w-5 h-5" style={{ color: hovered ? "white" : C.brand,
            transition: "color 0.3s" }} />
        </motion.div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm leading-snug truncate" style={{ color: C.dark }}>
            {loan.product}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: pct >= 100 ? C.greenLight : C.brandLight,
                    color:      pct >= 100 ? C.green      : C.brand,
                  }}>
              {pct >= 100 ? "✓ Выплачено" : "Активна"}
            </span>
            <span className="text-[11px]" style={{ color: C.muted }}>{loan.startDate}</span>
          </div>
        </div>
      </div>

      {/* Amounts */}
      <div className="flex justify-between items-baseline mb-2">
        <div>
          <p className="text-[11px] mb-0.5" style={{ color: C.muted }}>Выплачено</p>
          <p className="text-lg font-black leading-none" style={{ color: C.dark }}>
            {fmt(loan.paidAmount)}{" "}
            <span className="text-sm font-bold" style={{ color: C.muted }}>₽</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] mb-0.5" style={{ color: C.muted }}>Осталось</p>
          <p className="text-lg font-black leading-none"
             style={{ color: remaining <= 0 ? C.green : C.dark }}>
            {fmt(remaining)}{" "}
            <span className="text-sm font-bold" style={{ color: C.muted }}>₽</span>
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <ProgressBar pct={pct} glow={hovered} />
      <div className="flex justify-between mt-1.5 mb-2">
        <span className="text-[11px]" style={{ color: C.muted }}>{fmt(loan.paidAmount)} ₽</span>
        <motion.span
          className="text-[11px] font-bold"
          animate={{ color: hovered ? C.brand : C.mid }}
          transition={{ duration: 0.2 }}
        >{pct}%</motion.span>
        <span className="text-[11px]" style={{ color: C.muted }}>{fmt(loan.totalAmount)} ₽</span>
      </div>

      {/* Footer: инфо + кнопка графика */}
      <div className="flex items-center justify-between pt-2 border-t"
           style={{ borderColor: "rgba(0,0,0,0.06)" }}>
        {loan.monthlyPayment > 0 ? (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: C.muted }} />
            <span className="text-xs" style={{ color: C.muted }}>
              {fmt(loan.monthlyPayment)} ₽/мес. · {pluralPayment(loan.termMonths)}
            </span>
          </div>
        ) : <span />}

        <div className="flex items-center gap-2 shrink-0 ml-2">
          <a
            href={`/api/lk/contract/${loan.id}`}
            className="flex items-center gap-1 text-xs font-semibold transition-colors px-2 py-1 rounded"
            style={{ color: C.brand, background: C.brandLight }}
            title="Скачать готовый договор"
          >
            📄 Договор
          </a>
          {schedule.length > 0 && (
            <button
              onClick={() => setScheduleOpen(v => !v)}
              className="flex items-center gap-1 text-xs font-semibold transition-colors"
              style={{ color: scheduleOpen ? C.brand : C.mid }}
            >
              График
              <ChevronRight
                className="w-3.5 h-3.5 transition-transform"
                style={{ transform: scheduleOpen ? "rotate(90deg)" : "rotate(0deg)" }}
              />
            </button>
          )}
        </div>
      </div>

      {/* График платежей — аккордеон */}
      <AnimatePresence>
        {scheduleOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="mt-3 rounded-[12px] overflow-hidden border"
                 style={{ borderColor: "rgba(0,0,0,0.07)", background: "rgba(255,255,255,0.45)" }}>
              {/* Шапка таблицы */}
              <div className="grid grid-cols-[1.5rem_1fr_auto_auto] gap-x-3 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide border-b"
                   style={{ color: C.muted, borderColor: "rgba(0,0,0,0.06)" }}>
                <span>№</span>
                <span>Дата</span>
                <span className="text-right">Сумма</span>
                <span className="text-right">Статус</span>
              </div>
              {schedule.map(row => (
                <div
                  key={row.idx}
                  className="grid grid-cols-[1.5rem_1fr_auto_auto] gap-x-3 px-3 py-2 text-xs border-b last:border-b-0"
                  style={{
                    borderColor: "rgba(0,0,0,0.04)",
                    background: row.paid ? "rgba(16,185,129,0.04)" : "transparent",
                  }}
                >
                  <span className="font-bold" style={{ color: C.muted }}>{row.idx}</span>
                  <div>
                    <p className="font-semibold" style={{ color: C.dark }}>{row.label}</p>
                    <p style={{ color: C.muted }}>{row.date}</p>
                  </div>
                  <span className="text-right font-bold self-center" style={{ color: C.dark }}>
                    {fmt(row.amount)} ₽
                  </span>
                  <span
                    className="text-right self-center font-semibold text-[10px]"
                    style={{ color: row.paid ? C.green : C.amber }}
                  >
                    {row.paid ? "✓" : "•"}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PASSPORT DOC UPLOADER — общий компонент для ЛК и админки
   ═══════════════════════════════════════════════════════════════ */
function PassportDocUploader({
  uploadUrl, downloadUrl, hint,
}: {
  uploadUrl:   string;       // PUT / DELETE / GET (meta)
  downloadUrl: string;       // GET file
  hint?:       string;
}) {
  const [meta, setMeta] = useState<{
    mime: string; filename: string; uploadedAt: string; size: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchMeta = useCallback(async () => {
    try {
      const r = await fetch(uploadUrl, { cache: "no-store" });
      const d = await r.json();
      if (d?.exists) setMeta(d);
      else setMeta(null);
    } catch {}
  }, [uploadUrl]);

  useEffect(() => { fetchMeta(); }, [fetchMeta]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch(uploadUrl, { method: "PUT", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Ошибка загрузки");
      setMeta({ mime: d.mime, filename: d.filename, uploadedAt: d.uploadedAt, size: d.size });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (!confirm("Удалить загруженный документ?")) return;
    setBusy(true);
    try {
      await fetch(uploadUrl, { method: "DELETE" });
      setMeta(null);
    } finally { setBusy(false); }
  };

  const sizeKb = meta ? (meta.size / 1024).toFixed(1) : "";
  const uploadedStr = meta
    ? new Date(meta.uploadedAt).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className="border-t pt-5" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
      <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
             style={{ color: C.mid }}>Скан или фото паспорта</label>

      {meta ? (
        <div className="flex items-center justify-between gap-3 p-3 rounded-[12px]"
             style={{ background: C.brandLight, border: `1px solid ${C.brand}33` }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="text-2xl">{meta.mime === "application/pdf" ? "📄" : "🖼"}</div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: C.dark }}>{meta.filename}</p>
              <p className="text-[11px]" style={{ color: C.mid }}>{sizeKb} КБ · загружен {uploadedStr}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a href={downloadUrl} target="_blank" rel="noopener"
               className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
               style={{ background: C.brand, color: "#fff" }}>
              Открыть
            </a>
            <button onClick={() => inputRef.current?.click()} disabled={busy}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-50"
                    style={{ background: "rgba(0,0,0,0.08)", color: C.dark }}>
              Заменить
            </button>
            <button onClick={handleDelete} disabled={busy}
                    className="w-7 h-7 rounded-full text-xs font-bold transition-colors disabled:opacity-50"
                    style={{ background: "rgba(239,68,68,0.10)", color: "#EF4444" }}>
              ×
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()} disabled={busy}
                className="w-full p-4 rounded-[12px] text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                style={{
                  background: "rgba(255,255,255,0.65)",
                  color: C.brand,
                  border: `1.5px dashed ${C.brand}66`,
                }}>
          {busy ? "Загружаю..." : "📎 Загрузить скан/фото паспорта"}
        </button>
      )}

      <input ref={inputRef} type="file" hidden
             accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp,image/heic"
             onChange={handleFile} />

      {err && (
        <p className="text-xs mt-2" style={{ color: "#EF4444" }}>⚠ {err}</p>
      )}
      {hint && !err && (
        <p className="text-[11px] mt-2" style={{ color: C.muted }}>{hint}</p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PROFILE CARD  — glassmorphism
   ═══════════════════════════════════════════════════════════════ */
function ProfileCard({ data, onUpdate }: { data: MeData; onUpdate: (patch: Partial<MeData>) => void }) {
  const [editing,        setEditing]        = useState(false);
  const [lastName,       setLastName]       = useState(data.lastName       ?? "");
  const [firstName,      setFirstName]      = useState(data.firstName      ?? "");
  const [patronymic,     setPatronymic]     = useState(data.patronymic     ?? "");
  const [birthDate,      setBirthDate]      = useState(data.birthDate      ?? "");
  const [avatarUrl,      setAvatarUrl]      = useState(data.avatarUrl      ?? "");
  const [birthPlaceCity, setBirthPlaceCity] = useState(data.birthPlaceCity ?? "");
  const [addrCity,       setAddrCity]       = useState(data.addrCity       ?? "");
  const [addrStreet,     setAddrStreet]     = useState(data.addrStreet     ?? "");
  const [addrHouse,      setAddrHouse]      = useState(data.addrHouse      ?? "");
  const [addrApt,        setAddrApt]        = useState(data.addrApt        ?? "");
  /* Паспорт */
  const [passportSeries,         setPassportSeries]         = useState(data.passportSeries         ?? "");
  const [passportNumber,         setPassportNumber]         = useState(data.passportNumber         ?? "");
  const [passportIssueDate,      setPassportIssueDate]      = useState(data.passportIssueDate      ?? "");
  const [passportIssuedBy,       setPassportIssuedBy]       = useState(data.passportIssuedBy       ?? "");
  const [passportDepartmentCode, setPassportDepartmentCode] = useState(data.passportDepartmentCode ?? "");
  /* Адрес проживания */
  const [livingSameAsRegister, setLivingSameAsRegister] = useState(data.livingSameAsRegister ?? false);
  const [livingCity,   setLivingCity]   = useState(data.livingCity   ?? "");
  const [livingStreet, setLivingStreet] = useState(data.livingStreet ?? "");
  const [livingHouse,  setLivingHouse]  = useState(data.livingHouse  ?? "");
  const [livingApt,    setLivingApt]    = useState(data.livingApt    ?? "");
  const [email,        setEmail]        = useState(data.email        ?? "");
  /* Поручители */
  const [g1Name, setG1Name] = useState(data.guarantor1FullName ?? "");
  const [g1Phone, setG1Phone] = useState(data.guarantor1Phone   ?? "");
  const [g2Name, setG2Name] = useState(data.guarantor2FullName ?? "");
  const [g2Phone, setG2Phone] = useState(data.guarantor2Phone   ?? "");
  const [saving,         setSaving]         = useState(false);
  const [tooltip,        setTooltip]        = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const completedLoans = data.loans.filter(l => l.status === "completed").length;
  // Индекс доверия — берём значение из профиля (устанавливается администратором),
  // но не меньше числа закрытых рассрочек (нельзя понизить earned-уровень)
  const trustScore     = Math.max(data.trustScore ?? 0, completedLoans);
  const trustLevel     = getTrustLevel(trustScore);
  const nextLevel      = trustLevel.next
    ? TRUST_LEVELS.find(l => l.label === trustLevel.next)
    : null;
  const progressToNext = nextLevel
    ? Math.min(100, (trustScore / nextLevel.minScore) * 100)
    : 100;

  const totalPaid = data.loans.reduce((s, l) => s + l.paidAmount, 0);
  const activeCnt = data.loans.filter(l => l.status === "active").length;

  const save = async () => {
    setSaving(true);
    try {
      const payload = { lastName, firstName, patronymic, birthDate, avatarUrl,
        birthPlaceCity, addrCity, addrStreet, addrHouse, addrApt,
        passportSeries, passportNumber, passportIssueDate, passportIssuedBy, passportDepartmentCode,
        livingSameAsRegister, livingCity, livingStreet, livingHouse, livingApt, email,
        guarantor1FullName: g1Name, guarantor1Phone: g1Phone,
        guarantor2FullName: g2Name, guarantor2Phone: g2Phone,
      };
      const r = await fetch("/api/lk/profile", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (r.ok) {
        onUpdate(payload);
        setEditing(false);
      }
    } finally { setSaving(false); }
  };

  const cancel = () => {
    setLastName(data.lastName ?? "");   setFirstName(data.firstName ?? "");
    setPatronymic(data.patronymic ?? ""); setBirthDate(data.birthDate ?? "");
    setAvatarUrl(data.avatarUrl ?? "");
    setBirthPlaceCity(data.birthPlaceCity ?? ""); setAddrCity(data.addrCity ?? "");
    setAddrStreet(data.addrStreet ?? ""); setAddrHouse(data.addrHouse ?? ""); setAddrApt(data.addrApt ?? "");
    setPassportSeries(data.passportSeries ?? ""); setPassportNumber(data.passportNumber ?? "");
    setPassportIssueDate(data.passportIssueDate ?? ""); setPassportIssuedBy(data.passportIssuedBy ?? "");
    setPassportDepartmentCode(data.passportDepartmentCode ?? "");
    setLivingSameAsRegister(data.livingSameAsRegister ?? false);
    setLivingCity(data.livingCity ?? ""); setLivingStreet(data.livingStreet ?? "");
    setLivingHouse(data.livingHouse ?? ""); setLivingApt(data.livingApt ?? "");
    setEmail(data.email ?? "");
    setG1Name(data.guarantor1FullName ?? ""); setG1Phone(data.guarantor1Phone ?? "");
    setG2Name(data.guarantor2FullName ?? ""); setG2Phone(data.guarantor2Phone ?? "");
    setEditing(false);
  };

  /* Profile completion */
  const completion = computeProfileCompletion({
    lastName, firstName, patronymic, birthDate, birthPlaceCity,
    addrCity, addrStreet, addrHouse,
    passportSeries, passportNumber, passportIssueDate, passportIssuedBy, passportDepartmentCode,
    livingSameAsRegister, livingCity, livingStreet, livingHouse,
  });

  /* Загрузка аватара — принимаем до 5 МБ, потом сжимаем на canvas до
     512×512 jpeg(0.85). Это держит размер base64 ~50–150 КБ и не раздувает
     профиль в Redis. */
  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Файл слишком большой. Максимум 5 МБ.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      alert("Загрузите изображение (JPG, PNG, WEBP или HEIC).");
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      const src = ev.target?.result as string;
      if (!src) return;
      const img = new Image();
      img.onload = () => {
        const MAX = 512;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const w = Math.round(img.width  * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) { setAvatarUrl(src); return; }
        ctx.drawImage(img, 0, 0, w, h);
        try {
          setAvatarUrl(canvas.toDataURL("image/jpeg", 0.85));
        } catch {
          /* fallback на исходник, если canvas не справился */
          setAvatarUrl(src);
        }
      };
      img.onerror = () => setAvatarUrl(src);
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const displayName = [data.lastName, data.firstName, data.patronymic].filter(Boolean).join(" ") || "Не указано";
  const avatarSrc   = data.avatarUrl || avatarUrl;

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}
                className="rounded-[20px] h-fit overflow-hidden"
                style={{
                  background: C.glass, backdropFilter: "blur(24px) saturate(1.5)",
                  WebkitBackdropFilter: "blur(24px) saturate(1.5)",
                  border: `1px solid ${C.border}`,
                  boxShadow: "0 8px 40px rgba(12,74,58,0.12), 0 2px 12px rgba(0,0,0,0.06)",
                }}>

      {/* ── 2-колоночный layout: sidebar слева + контент справа ─── */}
      <div className="flex">

        {/* Левый sidebar — шкала доверия (скрывается в режиме редактирования) */}
        {!editing && (
          <div className="w-[176px] shrink-0 border-r p-4 pt-6 overflow-visible"
               style={{ borderColor: "rgba(0,0,0,0.07)", background: "rgba(255,255,255,0.25)" }}>
            <TrustSidebar score={trustScore} />
          </div>
        )}

        {/* Правая часть — основной контент */}
        <div className={`flex-1 min-w-0 ${editing ? "p-6 sm:p-8" : "p-4 sm:p-5"}`}>

      {/* ── Аватар ─────────────────────────────────────────────── */}
      <div className="flex flex-col items-center text-center mb-3">
        <div className="relative mb-1.5 group">
          {/* Круглый аватар */}
          <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-lg font-black text-white"
               style={{ background: `linear-gradient(145deg, ${C.brand}, ${C.brandMid})`,
                 boxShadow: `0 8px 24px ${C.brandSoft}` }}>
            {avatarSrc
              ? <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
              : initials(data.lastName, data.firstName, data.phone)
            }
          </div>
          {/* Значок верификации */}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
               style={{ background: C.greenLight, border: "2px solid white" }}>
            <Shield className="w-3 h-3" style={{ color: C.green }} />
          </div>
          {/* Кнопка смены фото (при редактировании) */}
          {editing && (
            <button onClick={() => fileRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center
                               opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Edit2 className="w-5 h-5 text-white" />
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
        </div>

        {!editing ? (
          <>
            <h2 className="text-sm font-black tracking-tight" style={{ color: C.dark }}>{displayName}</h2>
            {data.birthDate && (
              <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>
                {new Date(data.birthDate).toLocaleDateString("ru-RU")}
              </p>
            )}
            <p className="text-xs mt-0.5" style={{ color: C.mid }}>{displayPhone(data.phone)}</p>
            <span className="mt-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ background: C.greenLight, color: C.green }}>
              Телефон подтверждён
            </span>
          </>
        ) : (
          <div className="w-full text-left mt-4">
            {/* Datalist для города регистрации */}
            <datalist id="lk-chechen-cities">
              {CHECHEN_CITIES.map(c => <option key={c} value={c} />)}
            </datalist>

            {/* ━━━ БЛОК 1: ЛИЧНЫЕ ДАННЫЕ ━━━━━━━━━━━━━━━━━━━━━━ */}
            <p className="text-[10px] font-black uppercase tracking-[0.12em] mb-5"
               style={{ color: C.mid }}>Личные данные</p>

            <div className="space-y-5">
              {[
                { label: "Фамилия *",   val: lastName,   set: setLastName   },
                { label: "Имя *",       val: firstName,  set: setFirstName  },
                { label: "Отчество *",  val: patronymic, set: setPatronymic },
              ].map(({ label, val, set }) => (
                <div key={label}>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
                         style={{ color: C.mid }}>{label}</label>
                  <input
                    value={val}
                    onChange={e => set(e.target.value)}
                    placeholder={label.replace(" *", "")}
                    className="w-full px-4 py-4 rounded-[12px] text-base font-medium outline-none
                               transition-all"
                    style={{
                      background: "rgba(255,255,255,0.85)",
                      color: C.dark,
                      boxShadow: `inset 0 0 0 1.5px ${C.brand}44`,
                    }}
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
                       style={{ color: C.mid }}>Дата рождения *</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                  required
                  className="w-full px-4 py-4 rounded-[12px] text-base font-medium outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.85)",
                    color: C.dark,
                    boxShadow: `inset 0 0 0 1.5px ${C.brand}44`,
                  }}
                />
              </div>
            </div>

            {/* ━━━ БЛОК 2: МЕСТО РОЖДЕНИЯ ━━━━━━━━━━━━━━━━━━━━ */}
            <div className="border-t mt-8 pt-6" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] mb-5"
                 style={{ color: C.mid }}>Место рождения <span style={{ color: "#EF4444" }}>*</span></p>
              <input
                value={birthPlaceCity}
                onChange={e => setBirthPlaceCity(e.target.value)}
                placeholder="Любой город, регион или страна"
                className="w-full px-4 py-4 rounded-[12px] text-base font-medium outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.85)",
                  color: C.dark,
                  boxShadow: `inset 0 0 0 1.5px ${C.brand}44`,
                }}
              />
            </div>

            {/* ━━━ БЛОК 3: АДРЕС РЕГИСТРАЦИИ ━━━━━━━━━━━━━━━━━ */}
            <div className="border-t mt-8 pt-6" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] mb-5"
                 style={{ color: C.mid }}>Адрес регистрации по паспорту <span style={{ color: "#EF4444" }}>*</span></p>

              <div className="space-y-5">
                {/* Регион — фиксирован */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
                         style={{ color: C.mid }}>Регион</label>
                  <div className="w-full px-4 py-4 rounded-[12px] text-base"
                       style={{
                         background: "rgba(0,0,0,0.05)",
                         color: C.muted,
                         border: "1px dashed rgba(0,0,0,0.12)",
                       }}>
                    Чеченская Республика
                  </div>
                </div>

                {/* Населённый пункт — datalist */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
                         style={{ color: C.mid }}>Населённый пункт *</label>
                  <input
                    list="lk-chechen-cities"
                    value={addrCity}
                    onChange={e => setAddrCity(e.target.value)}
                    placeholder="Выберите из списка или введите вручную"
                    className="w-full px-4 py-4 rounded-[12px] text-base font-medium outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.85)",
                      color: C.dark,
                      boxShadow: `inset 0 0 0 1.5px ${C.brand}44`,
                    }}
                  />
                </div>

                {/* Улица */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
                         style={{ color: C.mid }}>Улица *</label>
                  <input
                    value={addrStreet}
                    onChange={e => setAddrStreet(e.target.value)}
                    placeholder="Название улицы"
                    className="w-full px-4 py-4 rounded-[12px] text-base font-medium outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.85)",
                      color: C.dark,
                      boxShadow: `inset 0 0 0 1.5px ${C.brand}44`,
                    }}
                  />
                </div>

                {/* Дом + Квартира — Дом обязательный */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Дом *",      val: addrHouse, set: setAddrHouse },
                    { label: "Квартира", val: addrApt,   set: setAddrApt   },
                  ].map(({ label, val, set }) => (
                    <div key={label}>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
                             style={{ color: C.mid }}>{label}</label>
                      <input
                        value={val}
                        onChange={e => set(e.target.value)}
                        placeholder={label.replace(" *", "")}
                        className="w-full px-4 py-4 rounded-[12px] text-base font-medium outline-none transition-all"
                        style={{
                          background: "rgba(255,255,255,0.85)",
                          color: C.dark,
                          boxShadow: `inset 0 0 0 1.5px ${C.brand}44`,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ━━━ БЛОК 4: ПАСПОРТ ━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <div className="border-t mt-8 pt-6" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] mb-2"
                 style={{ color: C.mid }}>
                Паспортные данные
                <span style={{ color: "#EF4444", marginLeft: 4 }}>*</span>
              </p>
              <p className="text-[11px] mb-5" style={{ color: C.muted }}>
                Нужны для оформления договора при одобрении рассрочки.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
                         style={{ color: C.mid }}>Серия *</label>
                  <input
                    value={passportSeries}
                    onChange={e => setPassportSeries(maskPassportSeries(e.target.value))}
                    inputMode="numeric"
                    placeholder={PASSPORT_SERIES_PLACEHOLDER}
                    className="w-full px-4 py-4 rounded-[12px] text-base font-medium outline-none transition-all font-mono"
                    style={{ background: "rgba(255,255,255,0.85)", color: C.dark,
                             boxShadow: `inset 0 0 0 1.5px ${C.brand}44` }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
                         style={{ color: C.mid }}>Номер *</label>
                  <input
                    value={passportNumber}
                    onChange={e => setPassportNumber(maskPassportNumber(e.target.value))}
                    inputMode="numeric"
                    placeholder={PASSPORT_NUMBER_PLACEHOLDER}
                    className="w-full px-4 py-4 rounded-[12px] text-base font-medium outline-none transition-all font-mono"
                    style={{ background: "rgba(255,255,255,0.85)", color: C.dark,
                             boxShadow: `inset 0 0 0 1.5px ${C.brand}44` }}
                  />
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
                       style={{ color: C.mid }}>Дата выдачи *</label>
                <input type="date" value={passportIssueDate}
                       onChange={e => setPassportIssueDate(e.target.value)}
                       className="w-full px-4 py-4 rounded-[12px] text-base font-medium outline-none transition-all"
                       style={{ background: "rgba(255,255,255,0.85)", color: C.dark,
                                boxShadow: `inset 0 0 0 1.5px ${C.brand}44` }} />
              </div>

              <div className="mb-5">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
                       style={{ color: C.mid }}>Кем выдан *</label>
                <textarea value={passportIssuedBy}
                          onChange={e => setPassportIssuedBy(e.target.value)}
                          rows={2}
                          placeholder="Например: ОУФМС России по г. Москве по району Якиманка"
                          className="w-full px-4 py-3 rounded-[12px] text-sm font-medium outline-none transition-all resize-none"
                          style={{ background: "rgba(255,255,255,0.85)", color: C.dark,
                                   boxShadow: `inset 0 0 0 1.5px ${C.brand}44` }} />
              </div>

              <div className="mb-5">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
                       style={{ color: C.mid }}>Код подразделения *</label>
                <input
                  value={passportDepartmentCode}
                  onChange={e => setPassportDepartmentCode(maskDepartmentCode(e.target.value))}
                  inputMode="numeric"
                  placeholder={DEPT_CODE_PLACEHOLDER}
                  className="w-44 px-4 py-4 rounded-[12px] text-base font-medium outline-none transition-all font-mono"
                  style={{ background: "rgba(255,255,255,0.85)", color: C.dark,
                           boxShadow: `inset 0 0 0 1.5px ${C.brand}44` }}
                />
              </div>

              {/* Скан / фото паспорта — опционально для клиента */}
              <PassportDocUploader
                uploadUrl="/api/lk/passport-doc"
                downloadUrl="/api/lk/passport-doc/file"
                hint="PDF или фото (jpg, png, webp, heic), до 5 МБ. Не обязательно — можно принести оригинал на встрече."
              />
            </div>

            {/* ━━━ БЛОК 5: АДРЕС ПРОЖИВАНИЯ ━━━━━━━━━━━━━━━━━ */}
            <div className="border-t mt-8 pt-6" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] mb-3"
                 style={{ color: C.mid }}>
                Адрес проживания
                <span style={{ color: "#EF4444", marginLeft: 4 }}>*</span>
              </p>

              <label className="flex items-center gap-2 mb-5 cursor-pointer select-none">
                <input type="checkbox" checked={livingSameAsRegister}
                       onChange={e => setLivingSameAsRegister(e.target.checked)}
                       className="w-4 h-4 accent-[#0C7A58]" />
                <span className="text-sm" style={{ color: C.dark }}>
                  Совпадает с адресом регистрации
                </span>
              </label>

              {!livingSameAsRegister && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
                           style={{ color: C.mid }}>Город *</label>
                    <input value={livingCity} onChange={e => setLivingCity(e.target.value)}
                           placeholder="Город или населённый пункт"
                           className="w-full px-4 py-4 rounded-[12px] text-base font-medium outline-none transition-all"
                           style={{ background: "rgba(255,255,255,0.85)", color: C.dark,
                                    boxShadow: `inset 0 0 0 1.5px ${C.brand}44` }} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
                           style={{ color: C.mid }}>Улица *</label>
                    <input value={livingStreet} onChange={e => setLivingStreet(e.target.value)}
                           placeholder="Название улицы"
                           className="w-full px-4 py-4 rounded-[12px] text-base font-medium outline-none transition-all"
                           style={{ background: "rgba(255,255,255,0.85)", color: C.dark,
                                    boxShadow: `inset 0 0 0 1.5px ${C.brand}44` }} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Дом *",   val: livingHouse, set: setLivingHouse },
                      { label: "Квартира", val: livingApt,  set: setLivingApt   },
                    ].map(({ label, val, set }) => (
                      <div key={label}>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
                               style={{ color: C.mid }}>{label}</label>
                        <input value={val} onChange={e => set(e.target.value)}
                               placeholder={label.replace(" *", "")}
                               className="w-full px-4 py-4 rounded-[12px] text-base font-medium outline-none transition-all"
                               style={{ background: "rgba(255,255,255,0.85)", color: C.dark,
                                        boxShadow: `inset 0 0 0 1.5px ${C.brand}44` }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ━━━ БЛОК 6: EMAIL (опционально) ━━━━━━━━━━━━━━━ */}
            <div className="border-t mt-8 pt-6" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] mb-3"
                 style={{ color: C.mid }}>Email <span className="text-[#9CA3AF] normal-case">(необязательно)</span></p>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                     placeholder="name@example.com"
                     className="w-full px-4 py-4 rounded-[12px] text-base font-medium outline-none transition-all"
                     style={{ background: "rgba(255,255,255,0.85)", color: C.dark,
                              boxShadow: `inset 0 0 0 1.5px ${C.brand}44` }} />
            </div>

            {/* ━━━ БЛОК 7: ПОРУЧИТЕЛИ ━━━━━━━━━━━━━━━━━━━━━━━ */}
            <div className="border-t mt-8 pt-6" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] mb-2"
                 style={{ color: C.mid }}>
                Поручители <span className="text-[#9CA3AF] normal-case">(необязательно)</span>
              </p>
              <p className="text-[11px] mb-5" style={{ color: C.muted }}>
                Поручительство может потребоваться при оформлении рассрочки от 80 000 ₽.
                Заполнить можно сейчас, чтобы ускорить одобрение.
              </p>

              <div className="space-y-6">
                {[
                  { idx: 1 as const, name: g1Name, setName: setG1Name, phone: g1Phone, setPhone: setG1Phone },
                  { idx: 2 as const, name: g2Name, setName: setG2Name, phone: g2Phone, setPhone: setG2Phone },
                ].map(g => (
                  <div key={g.idx} className="rounded-[14px] p-4"
                       style={{ background: "rgba(255,255,255,0.45)", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <p className="text-[11px] font-extrabold mb-3" style={{ color: C.dark }}>
                      Поручитель № {g.idx}
                    </p>
                    <div className="space-y-3 mb-3">
                      <input value={g.name}
                             onChange={e => g.setName(e.target.value)}
                             placeholder="ФИО полностью"
                             className="w-full px-4 py-3 rounded-[12px] text-sm font-medium outline-none transition-all"
                             style={{ background: "rgba(255,255,255,0.85)", color: C.dark,
                                      boxShadow: `inset 0 0 0 1.5px ${C.brand}44` }} />
                      <input value={g.phone}
                             onChange={e => g.setPhone(phoneInputOnChange(e.target.value))}
                             onKeyDown={e => {
                               if (shouldBlockPhoneKeyDown(e.key, e.currentTarget.selectionStart, e.currentTarget.selectionEnd)) {
                                 e.preventDefault();
                               }
                             }}
                             inputMode="tel"
                             placeholder="+7 9XX XXX XX XX"
                             className="w-full px-4 py-3 rounded-[12px] text-sm font-medium outline-none transition-all"
                             style={{ background: "rgba(255,255,255,0.85)", color: C.dark,
                                      boxShadow: `inset 0 0 0 1.5px ${C.brand}44` }} />
                    </div>
                    <PassportDocUploader
                      uploadUrl={`/api/lk/guarantor-doc/${g.idx}`}
                      downloadUrl={`/api/lk/guarantor-doc/${g.idx}/file`}
                      hint="Скан/фото паспорта поручителя. PDF или изображение, до 5 МБ."
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Заполненность профиля ─────────────────────────────── */}
      {!completion.isComplete && (
        <div className="rounded-[12px] p-3 mb-3"
             style={{ background: completion.percent >= 75 ? "#FEF3C7" : "#FEE2E2",
                      border: `1px solid ${completion.percent >= 75 ? "#FCD34D" : "#FCA5A5"}` }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold" style={{ color: completion.percent >= 75 ? "#78350F" : "#991B1B" }}>
              📋 Профиль заполнен на {completion.percent}%
            </span>
            <span className="text-[10px]" style={{ color: completion.percent >= 75 ? "#92400E" : "#7F1D1D" }}>
              {completion.filled} / {completion.total}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden mb-2"
               style={{ background: "rgba(0,0,0,0.10)" }}>
            <div className="h-full rounded-full transition-all"
                 style={{ width: `${completion.percent}%`,
                          background: completion.percent >= 75 ? "#F59E0B" : "#EF4444" }} />
          </div>
          <p className="text-[10px] leading-snug" style={{ color: completion.percent >= 75 ? "#92400E" : "#7F1D1D" }}>
            Не хватает для одобрения рассрочки:{" "}
            {Object.entries(completion.missingByGroup)
              .map(([g, fs]) => `${g} (${fs.map(f => f.label.toLowerCase()).join(", ")})`)
              .join("; ")}.
          </p>
        </div>
      )}
      {completion.isComplete && (
        <div className="rounded-[12px] p-2.5 mb-3"
             style={{ background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
          <p className="text-xs font-bold" style={{ color: "#065F46" }}>
            ✓ Профиль заполнен полностью — рассрочка может быть одобрена
          </p>
        </div>
      )}

      {/* ── Индекс доверия ─────────────────────────────────────── */}
      <div className="rounded-[12px] p-3 mb-3 relative"
           style={{ background: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.4)" }}>
        {/* Заголовок с tooltip */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black" style={{ color: C.dark }}>Индекс доверия</span>
            <button
              onMouseEnter={() => setTooltip(true)}
              onMouseLeave={() => setTooltip(false)}
              onTouchStart={() => setTooltip(v => !v)}
              className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center cursor-help"
              style={{ background: C.brandLight, color: C.brand }}>?</button>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: trustLevel.color + "22", color: trustLevel.color }}>
            {trustLevel.label}
          </span>
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div className="absolute left-3 right-3 -top-14 z-20 rounded-xl px-3 py-2 text-xs leading-snug text-white shadow-lg"
               style={{ background: C.dark }}>
            Рейтинг растёт с каждой вовремя закрытой рассрочкой и даёт скидки на наценку
          </div>
        )}

        {/* Прогресс-бар */}
        <div className="h-1 rounded-full overflow-hidden mb-1"
             style={{ background: "rgba(0,0,0,0.08)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressToNext}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full"
            style={{ background: trustLevel.color }}
          />
        </div>

        {/* Подпись */}
        {nextLevel ? (
          <p className="text-[11px]" style={{ color: C.muted }}>
            Балл: <strong style={{ color: C.dark }}>{trustScore}</strong> из <strong>{nextLevel.minScore}</strong> до «{nextLevel.label}»
            {nextLevel.discount && <span style={{ color: C.brand }}> ({nextLevel.discount})</span>}
            {completedLoans > 0 && (
              <span style={{ color: C.muted }}> · {completedLoans} закрытых</span>
            )}
          </p>
        ) : (
          <p className="text-[11px] font-semibold" style={{ color: trustLevel.color }}>
            Максимальный уровень — скидка {trustLevel.discount} на наценку
          </p>
        )}
      </div>

      {/* ── Прогресс до следующего уровня (геймификация) ───────── */}
      {nextLevel && (
        <div className="rounded-[10px] px-2.5 py-1.5 mb-2 flex items-center gap-1.5"
             style={{ background: `${trustLevel.color}12`, border: `1px solid ${trustLevel.color}30` }}>
          <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: trustLevel.color }} />
          <p className="text-[11px] leading-snug" style={{ color: C.dark }}>
            Ещё <strong>{nextLevel.minScore - trustScore}</strong>{" "}
            {nextLevel.minScore - trustScore === 1 ? "рассрочка" : "рассрочки"} до статуса{" "}
            <strong style={{ color: nextLevel.color }}>«{nextLevel.label}»</strong>
            {nextLevel.discount && <span style={{ color: C.brand }}> (скидка {nextLevel.discount})</span>}
          </p>
        </div>
      )}

      {/* Edit / Save */}
      {!editing ? (
        <button onClick={() => setEditing(true)}
                className="w-full py-2 rounded-[10px] font-semibold text-xs flex items-center justify-center gap-2"
                style={{ background: C.brandLight, color: C.brand }}>
          <Pencil className="w-4 h-4" />Редактировать профиль
        </button>
      ) : (
        <div className="flex gap-2">
          <button onClick={cancel}
                  className="flex-1 py-2 rounded-[10px] font-semibold text-xs flex items-center justify-center gap-1.5"
                  style={{ background: "rgba(0,0,0,0.06)", color: C.mid }}>
            <X className="w-3.5 h-3.5" />Отмена
          </button>
          <motion.button onClick={save} disabled={saving} whileTap={{ scale: 0.97 }}
                         className="flex-1 py-2 rounded-[10px] font-bold text-xs text-white flex items-center justify-center gap-1.5 disabled:opacity-50"
                         style={{ background: `linear-gradient(135deg, ${C.brand}, ${C.brandMid})` }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Сохранить
          </motion.button>
        </div>
      )}

      {/* Stats */}
      <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2"
           style={{ borderColor: "rgba(0,0,0,0.06)" }}>
        {[
          { icon: <CreditCard className="w-3.5 h-3.5" />, label: "Рассрочек",  value: String(activeCnt)      },
          { icon: <TrendingUp className="w-3.5 h-3.5" />, label: "Выплачено",  value: `${fmt(totalPaid)} ₽`  },
        ].map(({ icon, label, value }) => (
          <div key={label} className="rounded-[10px] p-2 flex flex-col gap-0.5"
               style={{ background: "rgba(255,255,255,0.5)" }}>
            <div className="flex items-center gap-1" style={{ color: C.brand }}>
              {icon}
              <span className="text-[11px]" style={{ color: C.mid }}>{label}</span>
            </div>
            <p className="font-black text-sm" style={{ color: C.dark }}>{value}</p>
          </div>
        ))}
      </div>

        </div>{/* end right content column */}
      </div>{/* end 2-col flex */}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DAILY TIP CARD
   ═══════════════════════════════════════════════════════════════ */
function DailyTipCard() {
  const tip = getTodayTip();

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={6}
                className="rounded-[22px] p-5 relative overflow-hidden"
                style={{
                  background:     C.glassDark,
                  backdropFilter: "blur(20px) saturate(1.4)",
                  WebkitBackdropFilter: "blur(20px) saturate(1.4)",
                  border:         "1px solid rgba(255,255,255,0.12)",
                  boxShadow:      "0 8px 32px rgba(6,46,34,0.25)",
                }}>
      {/* Decorative glow */}
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full pointer-events-none opacity-20 blur-2xl"
           style={{ background: "radial-gradient(circle, #4ade80, transparent)" }} />

      <div className="relative flex items-start gap-4">
        <div className="text-2xl shrink-0 mt-0.5">{tip.icon}</div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-white/50" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
              Совет дня
            </span>
          </div>
          {/* Arabic text */}
          <p className="text-right text-base font-medium mb-2 text-white/70 leading-relaxed"
             dir="rtl" lang="ar"
             style={{ fontFamily: "serif" }}>
            {tip.ar}
          </p>
          <p className="text-sm leading-relaxed text-white/90">{tip.ru}</p>
          <p className="text-[11px] mt-2 text-white/40">{tip.ref}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════════════════════════ */
function Dashboard({ initialData }: { initialData: MeData }) {
  const [data, setData] = useState(initialData);

  const handleUpdateProfile = (patch: Partial<MeData>) =>
    setData(d => ({ ...d, ...patch }));

  // Рефетч при возврате на вкладку — данные обновятся без перезагрузки страницы
  useEffect(() => {
    const refetch = () => {
      if (document.visibilityState !== "visible") return;
      fetch("/api/lk/me")
        .then(r => r.ok ? r.json() : Promise.reject())
        .then((fresh: MeData) => setData(fresh))
        .catch(() => {/* silent */});
    };
    document.addEventListener("visibilitychange", refetch);
    return () => document.removeEventListener("visibilitychange", refetch);
  }, []);

  const logout = async () => {
    document.cookie = "nf_session=; Max-Age=0; path=/";
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden"
         style={{ background: `linear-gradient(170deg, ${C.brandDeep} 0%, ${C.brandDark} 30%, #0f6644 55%, ${C.bg} 80%)` }}>

      {/* Background orbs */}
      <div className="fixed -top-40 -right-40 w-[500px] h-[500px] rounded-full pointer-events-none"
           style={{ background: "radial-gradient(circle, rgba(52,211,153,0.12), transparent 70%)" }} />
      <div className="fixed bottom-0 left-0 w-96 h-96 rounded-full pointer-events-none"
           style={{ background: "radial-gradient(circle, rgba(12,122,88,0.10), transparent 70%)" }} />

      {/* ── Hero / Header ─────────────────────────────────────── */}
      <header className="relative z-10 max-w-5xl mx-auto px-4 pt-3 pb-3">
        {/* Top row */}
        <div className="flex items-center justify-between mb-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center"
                 style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)",
                   border: "1px solid rgba(255,255,255,0.2)" }}>
              <FinniceLogo size={22} variant="mark" />
            </div>
            <span className="text-white font-black tracking-tight text-base group-hover:text-white/80 transition-colors"
                  style={{ fontFamily: "system-ui" }}>
              finnice
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {data.adminRole && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-sm font-bold
                           text-white transition-opacity hover:opacity-90 whitespace-nowrap"
                style={{ background: "linear-gradient(135deg, #C8972B, #a87a1f)" }}
                title={`Роль: ${data.adminRole}`}
              >
                <Shield className="w-4 h-4" /> Админ-панель
              </Link>
            )}
            <button onClick={logout}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-sm font-semibold
                               text-white/60 hover:text-white transition-colors"
                    style={{ background: "rgba(255,255,255,0.08)" }}>
              <LogOut className="w-4 h-4" />Выйти
            </button>
          </div>
        </div>

        {/* Greeting */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
          <h1 className="text-sm sm:text-base font-black text-white leading-tight tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
            {formatGreeting(data.firstName, data.lastName)}
          </h1>
          <p className="text-xs text-white/55 mt-0.5">Ваш личный кабинет ФинНайс</p>
        </motion.div>
      </header>

      {/* ── Content (white-ish section) ────────────────────────── */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 pb-5">
        <div className="grid grid-cols-1 lg:grid-cols-[480px_1fr] gap-5">

          {/* LEFT — Profile */}
          <ProfileCard data={data} onUpdate={handleUpdateProfile} />

          {/* RIGHT — Loans */}
          <div className="space-y-3">
            {/* Section header */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}>
              <h2 className="text-xl font-black tracking-tight text-white">Мои рассрочки</h2>
              <p className="text-sm text-white/55">
                {data.loans.length === 0
                  ? "Рассрочек пока нет"
                  : `${data.loans.filter(l => l.status === "active").length} активных`}
              </p>
            </motion.div>

            {/* Только активные рассрочки (одобренные администратором) */}
            {(() => {
              const activeLoans = data.loans.filter(l => l.status === "active");
              return (
                <AnimatePresence mode="popLayout">
                  {activeLoans.length === 0 ? (
                    <motion.div key="empty" variants={fadeUp} initial="hidden" animate="visible" custom={2}
                                className="rounded-[20px] p-8 flex flex-col items-center text-center"
                                style={{ background: C.glass, backdropFilter: "blur(20px)",
                                  border: `1px solid ${C.border}` }}>
                      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3 text-2xl"
                           style={{ background: C.brandLight }}>💳</div>
                      <p className="font-bold text-sm mb-1" style={{ color: C.dark }}>Нет активных рассрочек</p>
                      <p className="text-xs leading-relaxed max-w-xs" style={{ color: C.mid }}>
                        Здесь появятся ваши активные рассрочки после одобрения администратором
                      </p>
                    </motion.div>
                  ) : (
                    activeLoans.map((loan, i) => (
                      <motion.div key={loan.id} variants={fadeUp} initial="hidden" animate="visible" custom={i + 2}>
                        <LoanCard loan={loan} />
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              );
            })()}

            {/* Summary strip — только по активным */}
            {data.loans.filter(l => l.status === "active").length > 0 && (() => {
              const active = data.loans.filter(l => l.status === "active");
              const cells = [
                { label: "Договоров", value: String(active.length) },
                { label: "Всего",     value: `${fmt(active.reduce((s,l) => s + l.totalAmount, 0))} ₽` },
                { label: "Выплачено", value: `${fmt(active.reduce((s,l) => s + l.paidAmount,  0))} ₽` },
              ];
              return (
                <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={active.length + 2}
                            className="rounded-[20px] p-4 grid grid-cols-3 gap-2"
                            style={{ background: C.glassDark, backdropFilter: "blur(16px)",
                              border: "1px solid rgba(255,255,255,0.1)" }}>
                  {cells.map(({ label, value }) => (
                    <div key={label} className="text-center">
                      <p className="text-[11px] mb-1 text-white/40">{label}</p>
                      <p className="font-black text-sm text-white">{value}</p>
                    </div>
                  ))}
                </motion.div>
              );
            })()}

            {/* Daily tip */}
            <DailyTipCard />
          </div>
        </div>
      </main>

    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LOADING
   ═══════════════════════════════════════════════════════════════ */
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center"
         style={{ background: `linear-gradient(160deg, ${C.brandDeep}, ${C.brand})` }}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-[18px] flex items-center justify-center"
             style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)",
               border: "1px solid rgba(255,255,255,0.25)" }}>
          <FinniceLogo size={36} variant="mark" />
        </div>
        <Loader2 className="w-5 h-5 animate-spin text-white/60" />
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT
   ═══════════════════════════════════════════════════════════════ */
export default function LkClient({ serverPhone }: { serverPhone: string | null }) {
  const [meData,  setMeData]  = useState<MeData | null>(null);
  const [loading, setLoading] = useState(!!serverPhone);

  useEffect(() => {
    if (!serverPhone) return;
    fetch("/api/lk/me")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setMeData(d))
      .catch(() => setMeData(null))
      .finally(() => setLoading(false));
  }, [serverPhone]);

  if (!serverPhone) return <AuthGate />;
  if (loading)      return <LoadingScreen />;
  if (!meData)      return <AuthGate />;
  return <Dashboard initialData={meData} />;
}
