/**
 * /api/lk/passport-doc
 *
 * Хранение скана/фото паспорта клиента.
 *
 *   GET    — вернуть текущий файл (base64 + mime + uploadedAt) для текущей сессии
 *   PUT    — загрузить файл (multipart/form-data, поле "file")
 *   DELETE — удалить файл
 *
 * Файлы хранятся в Redis по ключу `passport_doc:{phone}` как JSON {
 *   data: base64,
 *   mime: string,
 *   filename: string,
 *   uploadedAt: ISO string,
 *   size: bytes,
 * }.
 *
 * Лимит размера — 5 МБ.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionPhone } from "@/lib/auth-guard";
import { getRedis }        from "@/lib/redis";

const MAX_BYTES = 5 * 1024 * 1024;   // 5 MB
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
]);

interface PassportDoc {
  data:       string;   // base64 (без data: префикса)
  mime:       string;
  filename:   string;
  uploadedAt: string;
  size:       number;
}

export async function GET() {
  const phone = await getSessionPhone();
  if (!phone) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const doc = await getRedis().get<PassportDoc>(`passport_doc:${phone}`);
  if (!doc) return NextResponse.json({ exists: false });
  /* Не возвращаем сами байты — только мета. Скачивание идёт отдельным route'ом */
  return NextResponse.json({
    exists:     true,
    mime:       doc.mime,
    filename:   doc.filename,
    uploadedAt: doc.uploadedAt,
    size:       doc.size,
  });
}

export async function PUT(req: NextRequest) {
  const phone = await getSessionPhone();
  if (!phone) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "Файл пустой" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: `Файл слишком большой (${Math.round(file.size / 1024 / 1024 * 10) / 10} МБ, лимит 5 МБ)` }, { status: 400 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: `Неподдерживаемый тип файла: ${file.type}. Разрешены PDF и фото (jpg, png, webp, heic).` }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const base64 = Buffer.from(bytes).toString("base64");

  const doc: PassportDoc = {
    data: base64,
    mime: file.type,
    filename: (file as File).name || "passport",
    uploadedAt: new Date().toISOString(),
    size: file.size,
  };

  await getRedis().set(`passport_doc:${phone}`, doc);
  return NextResponse.json({
    ok: true,
    mime: doc.mime,
    filename: doc.filename,
    uploadedAt: doc.uploadedAt,
    size: doc.size,
  });
}

export async function DELETE() {
  const phone = await getSessionPhone();
  if (!phone) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await getRedis().del(`passport_doc:${phone}`);
  return NextResponse.json({ ok: true });
}
