import { NextResponse } from "next/server";
import { getAdminRole } from "@/lib/adminAuth";
import { getAllLoans, groupByCohort, computePortfolioSummary } from "@/lib/finance/portfolio";

export async function GET() {
  const role = await getAdminRole();
  if (role === null) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const loans   = await getAllLoans();
    const cohorts = groupByCohort(loans);
    const summary = computePortfolioSummary(loans);

    return NextResponse.json({ loans, cohorts, summary });
  } catch (e) {
    console.error("portfolio error:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
