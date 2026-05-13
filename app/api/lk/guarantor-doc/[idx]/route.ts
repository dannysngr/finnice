/**
 * /api/lk/guarantor-doc/[idx]
 *
 * Скан/фото паспорта ПОРУЧИТЕЛЯ клиента. Структура полностью повторяет
 * /api/lk/passport-doc, но хранится по ключу `guarantor_doc:{phone}:{idx}`,
 * где idx = 1 или 2 — два слота поручителей.
 *
 *   GET    — мета текущего файла для текущей сессии
 *   PUT    — multipart upload (поле "file"), до 5 МБ
 *   DELETE — удаление файла из слота
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionPhone } from "@/lib/auth-guard";
import { getRedis }        from "@/lib/redis";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic",
]);
const ALLOWED_IDX = new Set(["1", "2"]);

interface GuarantorDoc {
  data:       string;
  mime:       string;
  filename:   string;
  uploadedAt: string;
  size:       number;
}

type Params = { params: Promise<{ idx: string }> };

function keyFor(phone: string, idx: string): string {
  return `guarantor_doc:${phone}:${idx}`;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const phone = await getSessionPhone();
  if (!phone) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { idx } = await params;
  if (!ALLOWED_IDX.has(idx)) return NextResponse.json({ error: "Bad idx" }, { status: 400 });

  const doc = await getRedis().get<GuarantorDoc>(keyFor(phone, idx));
  if (!doc) return NextResponse.json({ exists: false });
  return NextResponse.json({
    exists: true,
    mime: doc.mime, filename: doc.filename,
    uploadedAt: doc.uploadedAt, size: doc.size,
  });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const phone = await getSessionPhone();
  if (!phone) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { idx } = await params;
  if (!ALLOWED_IDX.has(idx)) return NextResponse.json({ error: "Bad idx" }, { status: 400 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof Blob))      return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
  if (file.size === 0)              return NextResponse.json({ error: "Файл пустой" }, { status: 400 });
  if (file.size > MAX_BYTES)        return NextResponse.json({ error: `Файл слишком большой (${Math.round(file.size / 1024 / 1024 * 10) / 10} МБ, лимит 5 МБ)` }, { status: 400 });
  if (!ALLOWED_MIME.has(file.type)) return NextResponse.json({ error: `Тип ${file.type} не поддерживается` }, { status: 400 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const doc: GuarantorDoc = {
    data: Buffer.from(bytes).toString("base64"),
    mime: file.type,
    filename: (file as File).name || `guarantor-${idx}`,
    uploadedAt: new Date().toISOString(),
    size: file.size,
  };
  await getRedis().set(keyFor(phone, idx), doc);
  return NextResponse.json({
    ok: true, mime: doc.mime, filename: doc.filename, uploadedAt: doc.uploadedAt, size: doc.size,
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const phone = await getSessionPhone();
  if (!phone) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { idx } = await params;
  if (!ALLOWED_IDX.has(idx)) return NextResponse.json({ error: "Bad idx" }, { status: 400 });
  await getRedis().del(keyFor(phone, idx));
  return NextResponse.json({ ok: true });
}
