import { redirect } from "next/navigation";
import { canViewFinance } from "@/lib/adminAuth";
import { listInvestors } from "@/lib/finance/investors-store";
import {
  aggregatePortfolio,
  DEFAULT_POLICY,
  type AdminPolicy,
} from "@/lib/finance/investor-projections";
import { readFinanceConfig } from "@/lib/finance/config-store";
import { getAllLoans, computePortfolioSummary } from "@/lib/finance/portfolio";
import { computeRealInvestorMetrics } from "@/lib/finance/investor-real-metrics";
import { PortfolioClient } from "./PortfolioClient";

export const metadata = {
  title: "Портфель инвесторов — ФинНайс",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  if (!(await canViewFinance())) redirect("/admin");

  let investors: Awaited<ReturnType<typeof listInvestors>> = [];
  try { investors = await listInvestors(); } catch (e) { console.error("listInvestors:", e); }

  let policy: AdminPolicy = DEFAULT_POLICY;
  try {
    const cfg = await readFinanceConfig();
    policy = { ...DEFAULT_POLICY, expectedInflationAnnual: cfg.expectedInflationAnnual };
  } catch {}

  let loans: Awaited<ReturnType<typeof getAllLoans>> = [];
  try { loans = await getAllLoans(); } catch (e) { console.error("getAllLoans:", e); }
  const loansSummary = computePortfolioSummary(loans);

  const { aggregate, projections } = aggregatePortfolio(investors, policy);
  const { perInvestor: realPerInvestor, aggregate: realAggregate } =
    computeRealInvestorMetrics(investors, loans, policy);

  /* Сериализуем Map → объект для передачи в client */
  const realMetricsByInvestor: Record<string, ReturnType<typeof realPerInvestor.get>> = {};
  for (const [id, m] of Array.from(realPerInvestor.entries())) {
    realMetricsByInvestor[id] = m;
  }

  return (
    <PortfolioClient
      initialInvestors={investors}
      initialAggregate={aggregate}
      initialProjections={projections}
      policy={policy}
      realAggregate={realAggregate}
      realMetricsByInvestor={realMetricsByInvestor}
      loansSummary={loansSummary}
    />
  );
}
