/**
 * /api/admin/messages — управление шаблонами сообщений Telegram-бота.
 *
 *   GET    → список всех шаблонов с текущим текстом.
 *   POST   → сохранить пользовательский текст: { key, text }.
 *   DELETE ?key=X → сбросить шаблон к дефолту.
 */

import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import {
  TEMPLATES, getTemplateText, setTemplateText, resetTemplate, getTemplateDef,
} from "@/lib/telegram-templates";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await Promise.all(TEMPLATES.map(async (t) => ({
    ...t,
    currentText: await getTemplateText(t.key),
    isCustomized: (await getTemplateText(t.key)) !== t.defaultText,
  })));

  return NextResponse.json({ templates: items });
}

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { key?: string; text?: string };
  try {
    body = await req.json() as { key?: string; text?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { key, text } = body;
  if (!key || typeof text !== "string") {
    return NextResponse.json({ error: "key and text required" }, { status: 400 });
  }
  if (!getTemplateDef(key)) {
    return NextResponse.json({ error: "Unknown template key" }, { status: 404 });
  }
  if (text.length > 4000) {
    return NextResponse.json({ error: "Text too long (max 4000 chars)" }, { status: 400 });
  }

  await setTemplateText(key, text);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const key = new URL(req.url).searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "key required" }, { status: 400 });
  }
  if (!getTemplateDef(key)) {
    return NextResponse.json({ error: "Unknown template key" }, { status: 404 });
  }
  await resetTemplate(key);
  return NextResponse.json({ ok: true });
}
