import { NextResponse } from "next/server";
import { canViewFinance } from "@/lib/adminAuth";
import { getAllLoans, groupByCohort, computePortfolioSummary } from "@/lib/finance/portfolio";

export async function GET() {
  if (!(await canViewFinance())) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

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
