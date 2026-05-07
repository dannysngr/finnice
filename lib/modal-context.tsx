"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { ApplicationModal, type ModalPreset } from "@/components/ApplicationModal";

// ─── Контекст ─────────────────────────────────────────────────

interface ModalContextValue {
  openModal:  (preset: ModalPreset) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

// ─── Провайдер ────────────────────────────────────────────────

export function ModalProvider({ children }: { children: ReactNode }) {
  const [open,   setOpen]   = useState(false);
  const [preset, setPreset] = useState<ModalPreset | undefined>();

  const openModal = useCallback((p: ModalPreset) => {
    setPreset(p);
    setOpen(true);
  }, []);

  const closeModal = useCallback(() => setOpen(false), []);

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      <ApplicationModal open={open} onClose={closeModal} preset={preset} />
    </ModalContext.Provider>
  );
}

// ─── Хук ──────────────────────────────────────────────────────

export function useAppModal(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useAppModal must be used inside <ModalProvider>");
  return ctx;
}
