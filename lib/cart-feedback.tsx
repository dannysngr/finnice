"use client";

/**
 * Контекст для маленькой модалки «Товар добавлен в корзину», которая
 * показывается ОДИН РАЗ при первом добавлении товара (qty 0 → 1).
 * Два действия: «Перейти в корзину» / «Продолжить покупки».
 *
 * Использование:
 *   const { showCartAdded } = useCartFeedback();
 *   showCartAdded({ productName: "iPhone 17 Pro Max 256 ГБ" });
 */

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import Link from "next/link";

interface Feedback {
  productName: string;
}

interface CartFeedbackValue {
  showCartAdded: (f: Feedback) => void;
}

const Ctx = createContext<CartFeedbackValue | null>(null);

export function CartFeedbackProvider({ children }: { children: ReactNode }) {
  const [open, setOpen]         = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const showCartAdded = useCallback((f: Feedback) => {
    setFeedback(f);
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  // Esc закрывает
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <Ctx.Provider value={{ showCartAdded }}>
      {children}
      {open && feedback && <CartAddedModal feedback={feedback} onClose={close} />}
    </Ctx.Provider>
  );
}

export function useCartFeedback(): CartFeedbackValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCartFeedback must be used inside CartFeedbackProvider");
  return ctx;
}

function CartAddedModal({ feedback, onClose }: { feedback: Feedback; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 backdrop-blur-sm
                 animate-[fadein_0.15s_ease-out]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-added-title"
    >
      <style>{`@keyframes fadein { from { opacity: 0 } to { opacity: 1 } }
               @keyframes popin { from { opacity: 0; transform: scale(0.94) translateY(8px) } to { opacity: 1; transform: scale(1) translateY(0) } }`}</style>
      <div
        className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl
                   animate-[popin_0.18s_cubic-bezier(.2,.9,.3,1.2)_both]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center
                          bg-[#D1FAE5] text-[#059669]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 id="cart-added-title" className="font-extrabold text-lg text-[#0A1628] mb-1.5">
            Добавлено в корзину
          </h3>
          <p className="text-sm text-[#6B7280] mb-5 line-clamp-2 px-2">
            {feedback.productName}
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href="/cart"
              onClick={onClose}
              className="bg-[#0C7A58] text-white py-3 rounded-xl font-semibold text-sm
                         hover:bg-[#0a6449] transition-colors active:scale-[0.98]"
            >
              Перейти в корзину
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="border border-[#D8E2F0] text-[#374151] py-3 rounded-xl font-semibold text-sm
                         hover:border-[#0A1628] hover:bg-[#F4F7FC] transition-colors active:scale-[0.98]"
            >
              Продолжить покупки
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
