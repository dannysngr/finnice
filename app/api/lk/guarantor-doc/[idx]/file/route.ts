/**
 * GET /api/lk/guarantor-doc/[idx]/file
 * Отдаёт сам файл скана поручителя. Клиент — свой, админ — любого через ?phone=.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionPhone } from "@/lib/auth-guard";
import { getAdminRole }    from "@/lib/adminAuth";
import { getRedis }        from "@/lib/redis";

interface GuarantorDoc {
  data: string; mime: string; filename: string; uploadedAt: string; size: number;
}

type Params = { params: Promise<{ idx: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await getSessionPhone();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { idx } = await params;
  if (idx !== "1" && idx !== "2") return NextResponse.json({ error: "Bad idx" }, { status: 400 });

  const adminRole = await getAdminRole();
  const queryPhone = new URL(req.url).searchParams.get("phone");
  const phone = (adminRole && queryPhone) ? queryPhone : session;

  const doc = await getRedis().get<GuarantorDoc>(`guarantor_doc:${phone}:${idx}`);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bytes = Buffer.from(doc.data, "base64");
  const disposition = doc.mime === "application/pdf" || doc.mime.startsWith("image/")
    ? "inline"
    : "attachment";
  return new NextResponse(bytes as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type":        doc.mime,
      "Content-Disposition": `${disposition}; filename="${encodeURIComponent(doc.filename)}"`,
      "Cache-Control":       "private, max-age=0, must-revalidate",
    },
  });
}
