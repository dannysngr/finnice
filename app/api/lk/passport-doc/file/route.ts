/**
 * GET /api/lk/passport-doc/file
 *
 * Отдаёт сам файл скана/фото паспорта.
 * Клиент — свой. Админ — любого (?phone=...).
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionPhone } from "@/lib/auth-guard";
import { getAdminRole }    from "@/lib/adminAuth";
import { getRedis }        from "@/lib/redis";

interface PassportDoc {
  data: string; mime: string; filename: string; uploadedAt: string; size: number;
}

export async function GET(req: NextRequest) {
  const session = await getSessionPhone();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminRole = await getAdminRole();
  const queryPhone = new URL(req.url).searchParams.get("phone");
  const phone = (adminRole && queryPhone) ? queryPhone : session;

  const doc = await getRedis().get<PassportDoc>(`passport_doc:${phone}`);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bytes = Buffer.from(doc.data, "base64");
  /* Для PDF/изображений отдаём inline, чтобы открыть в новой вкладке */
  const disposition = doc.mime === "application/pdf" || doc.mime.startsWith("image/")
    ? "inline"
    : "attachment";
  return new NextResponse(bytes as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type":         doc.mime,
      "Content-Disposition":  `${disposition}; filename="${encodeURIComponent(doc.filename)}"`,
      "Cache-Control":        "private, max-age=0, must-revalidate",
    },
  });
}
