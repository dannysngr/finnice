"use client";

import { useState } from "react";
import Link from "next/link";
import type { TemplateDef } from "@/lib/telegram-templates";

interface TemplateWithText extends TemplateDef {
  currentText:  string;
  isCustomized: boolean;
}

interface Props {
  initialTemplates: TemplateWithText[];
}

export function MessagesClient({ initialTemplates }: Props) {
  const [templates, setTemplates] = useState<TemplateWithText[]>(initialTemplates);

  const client = templates.filter(t => t.audience === "client");
  const admin  = templates.filter(t => t.audience === "admin");

  function patchOne(key: string, currentText: string) {
    setTemplates(ts => ts.map(t =>
      t.key === key
        ? { ...t, currentText, isCustomized: currentText !== t.defaultText }
        : t
    ));
  }

  return (
    <main className="min-h-screen bg-[#f6f7fb] py-8">
      <div className="max-w-[1000px] mx-auto px-6 space-y-6">

        {/* Header */}
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#0A1628]">
              Сообщения бота
            </h1>
            <p className="text-sm text-[#6B7280]">
              Тексты, которые бот отправляет клиентам и в админ-чат.
              Переменные пишутся в виде <code className="bg-[#F9FAFB] border border-[#E5E7EB] px-1 rounded">{`{name}`}</code>.
            </p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 text-sm font-semibold text-[#0A1628] border border-[#D1D5DB]
                       rounded-lg hover:border-[#0A1628] transition-colors whitespace-nowrap"
          >
            ← В админку
          </Link>
        </header>

        {/* Клиенту */}
        <section>
          <h2 className="text-base font-bold text-[#0A1628] mb-3">
            📱 Клиенту в Telegram <span className="text-xs font-normal text-[#9CA3AF]">({client.length})</span>
          </h2>
          <div className="space-y-3">
            {client.map(t => (
              <TemplateCard key={t.key} tpl={t} onChanged={patchOne} />
            ))}
          </div>
        </section>

        {/* Админу */}
        <section>
          <h2 className="text-base font-bold text-[#0A1628] mb-3">
            🛎 В админ-чат <span className="text-xs font-normal text-[#9CA3AF]">({admin.length})</span>
          </h2>
          <div className="space-y-3">
            {admin.map(t => (
              <TemplateCard key={t.key} tpl={t} onChanged={patchOne} />
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}

/* ────────────────────────────────────────────────────────────── */

function TemplateCard({
  tpl, onChanged,
}: {
  tpl:        TemplateWithText;
  onChanged:  (key: string, text: string) => void;
}) {
  const [text, setText]       = useState(tpl.currentText);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [err, setErr]         = useState<string | null>(null);

  const dirty      = text !== tpl.currentText;
  const customized = text !== tpl.defaultText;

  async function save() {
    setSaving(true); setErr(null); setSaved(false);
    try {
      const r = await fetch("/api/admin/messages", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ key: tpl.key, text }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Ошибка сохранения");
      onChanged(tpl.key, text);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function resetToDefault() {
    if (!confirm(`Сбросить «${tpl.label}» к дефолтному тексту?`)) return;
    setSaving(true); setErr(null);
    try {
      const r = await fetch(`/api/admin/messages?key=${encodeURIComponent(tpl.key)}`, {
        method: "DELETE",
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Ошибка сброса");
      setText(tpl.defaultText);
      onChanged(tpl.key, tpl.defaultText);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
      {/* Заголовок */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold text-[#0A1628]">
            {tpl.label}
            {customized && (
              <span className="ml-2 text-[10px] font-bold uppercase tracking-wider
                               px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] align-middle">
                изменён
              </span>
            )}
          </h3>
          <p className="text-xs text-[#6B7280] mt-0.5">{tpl.description}</p>
          <p className="text-[10px] text-[#9CA3AF] mt-1">
            <code className="bg-[#F9FAFB] px-1 rounded">key: {tpl.key}</code>
            {" · "}
            <code className="bg-[#F9FAFB] px-1 rounded">parse_mode: {tpl.parseMode}</code>
          </p>
        </div>
      </div>

      {/* Доступные переменные */}
      {tpl.variables.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] uppercase tracking-wider text-[#6B7280] font-bold mb-1.5">
            Переменные
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tpl.variables.map(v => (
              <button
                key={v.name}
                type="button"
                onClick={() => navigator.clipboard?.writeText(`{${v.name}}`)}
                title={`${v.description}${v.example ? ` · пример: ${v.example}` : ""}`}
                className="px-2 py-1 text-[11px] font-mono bg-[#EBF0F9] text-[#1A3C6E]
                           rounded border border-[#D8E2F0] hover:border-[#1A3C6E] transition-colors"
              >
                {`{${v.name}}`}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-[#9CA3AF] mt-1">
            Кликните по переменной — скопируется в буфер.
          </p>
        </div>
      )}

      {/* Textarea */}
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={Math.min(14, Math.max(4, text.split("\n").length + 1))}
        className="w-full px-3 py-2.5 text-sm font-mono leading-snug rounded-lg
                   border border-[#D1D5DB] focus:border-[#1A3C6E] outline-none transition-colors
                   bg-[#FCFCFD]"
      />

      {/* Действия */}
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="px-4 py-2 text-sm font-bold rounded-lg text-white transition-opacity
                     hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg, #0C7A58, #0a6449)" }}
        >
          {saving ? "Сохраняю…" : dirty ? "Сохранить" : "Сохранено"}
        </button>
        <button
          onClick={resetToDefault}
          disabled={saving || !customized}
          className="px-3 py-2 text-sm font-semibold text-[#0A1628] border border-[#D1D5DB]
                     rounded-lg hover:border-[#0A1628] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Сбросить к дефолту
        </button>
        {saved && (
          <span className="text-xs text-[#0C7A58] font-semibold">✓ Сохранено</span>
        )}
        {err && (
          <span className="text-xs text-[#DC2626] font-semibold">⚠ {err}</span>
        )}
      </div>
    </div>
  );
}
