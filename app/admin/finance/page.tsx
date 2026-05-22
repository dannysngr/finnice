import { redirect } from "next/navigation";
import { canViewFinance } from "@/lib/adminAuth";
import { FinanceClient } from "./FinanceClient";

export const metadata = {
  title: "IRR-монитор — Финнайс",
  robots: { index: false, follow: false },
};

export default async function FinanceAdminPage() {
  if (!(await canViewFinance())) redirect("/admin");
  return <FinanceClient />;
}
