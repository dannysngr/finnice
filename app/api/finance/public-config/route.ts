/**
 * GET /api/finance/public-config
 * Public read-only endpoint — отдаёт только то, что нужно публичному калькулятору:
 * инфляция и ручные override наценок. Никаких админских данных, никакой auth.
 */
import { NextResponse } from "next/server";
import { readFinanceConfig } from "@/lib/finance/config-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cfg = await readFinanceConfig();
    return NextResponse.json({
      expectedInflationAnnual: cfg.expectedInflationAnnual,
      matrixOverrides:         cfg.matrixOverrides ?? {},
    });
  } catch {
    /* fallback к дефолтам если файла нет */
    return NextResponse.json({
      expectedInflationAnnual: 0.12,
      matrixOverrides:         {},
    });
  }
}
