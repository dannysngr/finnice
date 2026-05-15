import { redirect } from "next/navigation";
import { readFinanceConfig } from "@/lib/finance/config-store";
import { baselineIrrAnnual, baselineIrrMonthly } from "@/lib/finance/iso-irr";
import { canViewFinance } from "@/lib/adminAuth";
import { FinanceClient } from "./FinanceClient";

export const metadata = {
  title: "Finance · iso-IRR — Финнайс",
  robots: { index: false, follow: false },
};

export default async function FinanceAdminPage() {
  if (!(await canViewFinance())) redirect("/admin");

  const cfg = await readFinanceConfig();

  return (
    <FinanceClient
      initial={cfg}
      baseline={{
        annualIrr:  baselineIrrAnnual(),
        monthlyIrr: baselineIrrMonthly(),
      }}
    />
  );
}
