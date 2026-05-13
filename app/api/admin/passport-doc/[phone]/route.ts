/**
 * /api/admin/passport-doc/[phone]
 *
 * Админский эндпоинт: GET (meta) / PUT (upload) / DELETE.
 * Возвращает то же самое, что и /api/lk/passport-doc, но для произвольного клиента.
 */

import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { getRedis }       from "@/lib/redis";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic",
]);

interface PassportDoc {
  data: string; mime: string; filename: string; uploadedAt: string; size: number;
}

type Params = { params: Promise<{ phone: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { phone: raw } = await params;
  const phone = decodeURIComponent(raw);
  const doc = await getRedis().get<PassportDoc>(`passport_doc:${phone}`);
  if (!doc) return NextResponse.json({ exists: false });
  return NextResponse.json({
    exists: true,
    mime: doc.mime, filename: doc.filename,
    uploadedAt: doc.uploadedAt, size: doc.size,
  });
}

export async function PUT(req: NextRequest, { params }: Params) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { phone: raw } = await params;
  const phone = decodeURIComponent(raw);

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof Blob)) return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
  if (file.size === 0)         return NextResponse.json({ error: "Файл пустой" }, { status: 400 });
  if (file.size > MAX_BYTES)   return NextResponse.json({ error: `Файл больше 5 МБ` }, { status: 400 });
  if (!ALLOWED_MIME.has(file.type)) return NextResponse.json({ error: `Тип ${file.type} не поддерживается` }, { status: 400 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const doc: PassportDoc = {
    data: Buffer.from(bytes).toString("base64"),
    mime: file.type,
    filename: (file as File).name || "passport",
    uploadedAt: new Date().toISOString(),
    size: file.size,
  };
  await getRedis().set(`passport_doc:${phone}`, doc);
  return NextResponse.json({
    ok: true, mime: doc.mime, filename: doc.filename, uploadedAt: doc.uploadedAt, size: doc.size,
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { phone: raw } = await params;
  const phone = decodeURIComponent(raw);
  await getRedis().del(`passport_doc:${phone}`);
  return NextResponse.json({ ok: true });
}
