import { redirect } from "next/navigation";
import { getAdminRole } from "@/lib/adminAuth";
import { getAllLoans, groupByCohort, computePortfolioSummary } from "@/lib/finance/portfolio";
import { readFinanceConfig } from "@/lib/finance/config-store";
import { baselineIrrAnnual } from "@/lib/finance/iso-irr";
import { PortfolioClient } from "./PortfolioClient";

export const metadata = {
  title: "Реальный портфель — ФинНайс",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const role = await getAdminRole();
  if (role === null) redirect("/admin");

  const [loans, cfg] = await Promise.all([
    getAllLoans(),
    readFinanceConfig(),
  ]);
  const cohorts = groupByCohort(loans);
  const summary = computePortfolioSummary(loans);

  return (
    <PortfolioClient
      initialLoans={loans}
      initialCohorts={cohorts}
      initialSummary={summary}
      targetIrrAnnual={baselineIrrAnnual()}
      inflationAnnual={cfg.expectedInflationAnnual}
    />
  );
}
