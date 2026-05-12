/**
 * /api/admin/investors
 *
 * GET   — список всех инвесторов + агрегаты + прогнозы
 * POST  — единый endpoint с action: create | update | delete |
 *                                    addDeposit | addWithdrawal |
 *                                    removeDeposit | removeWithdrawal
 */

import { NextResponse, type NextRequest } from "next/server";
import { getAdminRole } from "@/lib/adminAuth";
import {
  listInvestors,
  createInvestor,
  updateInvestor,
  deleteInvestor,
  addDeposit,
  addWithdrawal,
  removeDeposit,
  removeWithdrawal,
} from "@/lib/finance/investors-store";
import {
  aggregatePortfolio,
  DEFAULT_POLICY,
  type AdminPolicy,
} from "@/lib/finance/investor-projections";
import { readFinanceConfig } from "@/lib/finance/config-store";
import { getAllLoans, computePortfolioSummary } from "@/lib/finance/portfolio";
import { computeRealInvestorMetrics } from "@/lib/finance/investor-real-metrics";

async function policyFromAdmin(): Promise<AdminPolicy> {
  try {
    const cfg = await readFinanceConfig();
    return {
      ...DEFAULT_POLICY,
      expectedInflationAnnual: cfg.expectedInflationAnnual,
    };
  } catch {
    return DEFAULT_POLICY;
  }
}

export async function GET() {
  const role = await getAdminRole();
  if (role === null) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const investors = await listInvestors();
    const policy    = await policyFromAdmin();
    const { aggregate, projections } = aggregatePortfolio(investors, policy);

    let loans: Awaited<ReturnType<typeof getAllLoans>> = [];
    try { loans = await getAllLoans(); } catch (e) { console.error("getAllLoans:", e); }
    const loansSummary = computePortfolioSummary(loans);
    const { perInvestor, aggregate: realAggregate } =
      computeRealInvestorMetrics(investors, loans, policy);
    const realMetricsByInvestor: Record<string, unknown> = {};
    for (const [id, m] of Array.from(perInvestor.entries())) {
      realMetricsByInvestor[id] = m;
    }

    return NextResponse.json({
      investors, aggregate, projections, policy,
      realAggregate, realMetricsByInvestor, loansSummary,
    });
  } catch (e) {
    console.error("investors GET error:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const role = await getAdminRole();
  if (role === null) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null) as
    | { action: string; [k: string]: unknown }
    | null;
  if (!body || typeof body.action !== "string") {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  try {
    switch (body.action) {
      case "create": {
        const inp = body.investor as {
          fullName: string; phone?: string; email?: string; notes?: string;
        };
        if (!inp?.fullName) return NextResponse.json({ error: "fullName required" }, { status: 400 });
        const inv = await createInvestor(inp);
        return NextResponse.json({ ok: true, investor: inv });
      }
      case "update": {
        const id = body.id as string;
        const patch = body.patch as Record<string, unknown>;
        const inv = await updateInvestor(id, patch as Parameters<typeof updateInvestor>[1]);
        if (!inv) return NextResponse.json({ error: "not found" }, { status: 404 });
        return NextResponse.json({ ok: true, investor: inv });
      }
      case "delete": {
        const id = body.id as string;
        const ok = await deleteInvestor(id);
        if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
        return NextResponse.json({ ok: true });
      }
      case "addDeposit": {
        const id = body.id as string;
        const dep = body.deposit as {
          amount: number; date: string; termMonths: number;
          profitSharePct: number; note?: string;
        };
        if (!id || !dep || !dep.amount || !dep.termMonths) {
          return NextResponse.json({ error: "amount/term required" }, { status: 400 });
        }
        const inv = await addDeposit(id, dep);
        if (!inv) return NextResponse.json({ error: "not found" }, { status: 404 });
        return NextResponse.json({ ok: true, investor: inv });
      }
      case "addWithdrawal": {
        const id = body.id as string;
        const w = body.withdrawal as { amount: number; date: string; note?: string };
        if (!id || !w || !w.amount) {
          return NextResponse.json({ error: "amount required" }, { status: 400 });
        }
        const inv = await addWithdrawal(id, w);
        if (!inv) return NextResponse.json({ error: "not found" }, { status: 404 });
        return NextResponse.json({ ok: true, investor: inv });
      }
      case "removeDeposit": {
        const inv = await removeDeposit(body.id as string, body.depositId as string);
        if (!inv) return NextResponse.json({ error: "not found" }, { status: 404 });
        return NextResponse.json({ ok: true, investor: inv });
      }
      case "removeWithdrawal": {
        const inv = await removeWithdrawal(body.id as string, body.withdrawalId as string);
        if (!inv) return NextResponse.json({ error: "not found" }, { status: 404 });
        return NextResponse.json({ ok: true, investor: inv });
      }
      default:
        return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
  } catch (e) {
    console.error("investors POST error:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
