"use client";
import { useEffect } from "react";
import { Calculator } from "@/components/Calculator";

interface Props {
  open:    boolean;
  onClose: () => void;
}

export function CalculatorModal({ open, onClose }: Props) {
  // Lock body scroll while open + close on Esc
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-[640px] max-h-[92vh] overflow-y-auto
                   rounded-t-3xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/95
                     flex items-center justify-center hover:bg-white shadow-md
                     transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <line x1="2" y1="2"  x2="12" y2="12" stroke="#0A1628" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="12" y1="2" x2="2"  y2="12" stroke="#0A1628" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>

        <Calculator />
      </div>
    </div>
  );
}
