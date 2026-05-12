import { redirect } from "next/navigation";
import { getAdminRole } from "@/lib/adminAuth";
import { listInvestors } from "@/lib/finance/investors-store";
import {
  aggregatePortfolio,
  DEFAULT_POLICY,
  type AdminPolicy,
} from "@/lib/finance/investor-projections";
import { readFinanceConfig } from "@/lib/finance/config-store";
import { PortfolioClient } from "./PortfolioClient";

export const metadata = {
  title: "Портфель инвесторов — ФинНайс",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const role = await getAdminRole();
  if (role === null) redirect("/admin");

  let investors: Awaited<ReturnType<typeof listInvestors>> = [];
  try { investors = await listInvestors(); } catch (e) { console.error("listInvestors:", e); }

  let policy: AdminPolicy = DEFAULT_POLICY;
  try {
    const cfg = await readFinanceConfig();
    policy = { ...DEFAULT_POLICY, expectedInflationAnnual: cfg.expectedInflationAnnual };
  } catch {}

  const { aggregate, projections } = aggregatePortfolio(investors, policy);

  return (
    <PortfolioClient
      initialInvestors={investors}
      initialAggregate={aggregate}
      initialProjections={projections}
      policy={policy}
    />
  );
}
