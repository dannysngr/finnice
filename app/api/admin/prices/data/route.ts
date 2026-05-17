/**
 * GET /api/admin/prices/data
 * Возвращает содержимое lib/tg-sync-meta.json (полные метаданные синхронизации).
 * Доступ: только root.
 */

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getAdminRole } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  const role = await getAdminRole();
  if (role !== "root") {
    return NextResponse.json({ error: "Только root" }, { status: 403 });
  }
  try {
    const file = path.join(process.cwd(), "lib", "tg-sync-meta.json");
    const text = await fs.readFile(file, "utf-8");
    return NextResponse.json(JSON.parse(text));
  } catch (e: unknown) {
    return NextResponse.json(
      { error: "tg-sync-meta.json не найден — запусти scripts/fetch-mistore-prices.py",
        detail: e instanceof Error ? e.message : String(e) },
      { status: 404 },
    );
  }
}
