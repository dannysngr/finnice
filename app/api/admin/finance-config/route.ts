import { NextResponse } from "next/server";
import { readFinanceConfig, writeFinanceConfig, FinanceConfig } from "@/lib/finance/config-store";
import { baselineIrrAnnual, baselineIrrMonthly } from "@/lib/finance/iso-irr";
import { getAdminRole, getAdminPhone } from "@/lib/adminAuth";
import { appendPolicyHistory, readPolicyHistory } from "@/lib/finance/policy-history";

async function requireAdmin() {
  const role = await getAdminRole();
  /* Финансы — только root + admin, не модератор */
  if (role !== "root" && role !== "admin") return null;
  const phone = await getAdminPhone();
  return { phone: phone ?? "", role };
}

function enrichConfig(cfg: FinanceConfig) {
  return {
    ...cfg,
    baselineAnnualIrr:  baselineIrrAnnual(),
    baselineMonthlyIrr: baselineIrrMonthly(),
  };
}

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const cfg = await readFinanceConfig();
  const url = new URL(req.url);
  if (url.searchParams.get("history") === "1") {
    const history = await readPolicyHistory();
    return NextResponse.json({ ...enrichConfig(cfg), history });
  }
  return NextResponse.json(enrichConfig(cfg));
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const patch: Partial<FinanceConfig> = {};

  if (typeof body.expectedInflationAnnual === "number") {
    patch.expectedInflationAnnual = Math.max(0, Math.min(1, body.expectedInflationAnnual));
  }
  if (typeof body.minTerm === "number")    patch.minTerm = body.minTerm;
  if (typeof body.maxTerm === "number")    patch.maxTerm = body.maxTerm;
  if (typeof body.minDownPct === "number") patch.minDownPct = body.minDownPct;
  if (typeof body.maxDownPct === "number") patch.maxDownPct = body.maxDownPct;
  if (body.matrixOverrides && typeof body.matrixOverrides === "object") {
    patch.matrixOverrides = body.matrixOverrides;
  }

  const before = await readFinanceConfig();
  const saved = await writeFinanceConfig(patch, admin.phone);

  /* Audit-log */
  try {
    const diffs: string[] = [];
    if (before.expectedInflationAnnual !== saved.expectedInflationAnnual) {
      diffs.push(`инфляция: ${(before.expectedInflationAnnual * 100).toFixed(1)}% → ${(saved.expectedInflationAnnual * 100).toFixed(1)}%`);
    }
    const beforeOverrides = Object.keys(before.matrixOverrides ?? {}).length;
    const afterOverrides  = Object.keys(saved.matrixOverrides ?? {}).length;
    if (beforeOverrides !== afterOverrides) {
      diffs.push(`overrides: ${beforeOverrides} → ${afterOverrides}`);
    }
    if (diffs.length > 0) {
      await appendPolicyHistory({
        at:        saved.updatedAt,
        by:        admin.phone,
        inflation: saved.expectedInflationAnnual,
        overrides: afterOverrides,
        diff:      diffs.join(" · "),
      });
    }
  } catch (e) {
    console.warn("[finance-config] history append failed:", e);
  }

  return NextResponse.json(enrichConfig(saved));
}
