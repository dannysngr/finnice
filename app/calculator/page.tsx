import Link from "next/link";
import type { Metadata } from "next";
import { Calculator } from "@/components/Calculator";

export const metadata: Metadata = {
  title:       "Калькулятор рассрочки — Финнайс",
  description: "Рассчитайте платежи по халяльной рассрочке без процентов. Без банка, без скрытых платежей.",
  alternates:  { canonical: "/calculator" },
};

export default function CalculatorPage() {
  return (
    <main>
      {/* Breadcrumb */}
      <div className="bg-[#F4F7FC] border-b border-[#D8E2F0]">
        <div className="section py-3 text-xs text-[#9CA3AF] flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-[#1A3C6E] transition-colors">Главная</Link>
          <span>/</span>
          <span className="text-[#0A1628]">Калькулятор</span>
        </div>
      </div>

      <section
        className="py-6 sm:py-10"
        style={{
          background: "linear-gradient(160deg, #EBF5F0 0%, #F4F7FC 55%, #EDF1F8 100%)",
        }}
      >
        <div className="max-w-[920px] mx-auto px-3 sm:px-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A1628] mb-2">
            Калькулятор рассрочки
          </h1>
          <p className="text-sm text-[#6B7280] mb-5 sm:mb-6">
            Без риба. Без скрытых платежей. Без банка.
          </p>
          <Calculator />
        </div>
      </section>
    </main>
  );
}
