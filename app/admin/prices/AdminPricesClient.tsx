"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

interface MatchedItem {
  sku: string;
  name: string;
  basePrice: number | null;
  tgPrice: number;
  finalPrice: number;
  delta: number;
  tgKey: string | null;
  source: string;
  perChannel: Record<string, number>;  // {"mistore095": 41900, ...}
}
interface UnmatchedKey {
  key: string;
  tgPrice: number;
  finalPrice: number;
  source: string;
}
interface UnmatchedRaw { raw: string; tgPrice: number; }
interface ChannelStat {
  name: string;
  displayName: string;
  postIds: number[];
  linesTotal: number;
  winsMax: number;
}
interface MetaData {
  syncedAt: string;
  markup: number;
  strategy: string;
  channels: ChannelStat[];
  totals: { matched: number; unmatchedKeys: number; unmatchedRaw: number };
  matched: MatchedItem[];
  unmatchedKeys: UnmatchedKey[];
  unmatchedByBrand: Record<string, UnmatchedRaw[]>;
}
interface Run {
  id: number; number: number; status: string; conclusion: string | null;
  event: string; actor: string; startedAt: string; updatedAt: string;
  url: string; message: string;
}

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("ru-RU") + " ₽";

const timeAgo = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)    return `${Math.floor(diff)}с назад`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}м назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}ч назад`;
  return `${Math.floor(diff / 86400)}д назад`;
};

export function AdminPricesClient() {
  const [meta, setMeta]       = useState<MetaData | null>(null);
  const [runs, setRuns]       = useState<Run[]>([]);
  const [tab, setTab]         = useState<"matched" | "unmatchedKeys" | "unmatchedRaw" | "runs">("matched");
  const [filter, setFilter]   = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [runsError, setRunsError] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    setError(null);
    const [m, r] = await Promise.all([
      fetch("/api/admin/prices/data").then(x => x.ok ? x.json() : x.json().then(j => Promise.reject(j))),
      fetch("/api/admin/prices/runs").then(x => x.json()),
    ]);
    setMeta(m);
    setRuns(r.runs || []);
    setRunsError(r.error || null);
    setLoading(false);
  }

  useEffect(() => {
    loadAll().catch(e => { setError(e.error || "Ошибка загрузки"); setLoading(false); });
  }, []);

  async function syncNow() {
    if (!confirm("Запустить синхронизацию сейчас? Тебе придёт уведомление в Telegram.")) return;
    setSyncing(true); setSyncMsg(null);
    const r = await fetch("/api/admin/prices/sync-now", { method: "POST" });
    const d = await r.json();
    setSyncMsg(d.ok ? `✅ ${d.message}` : `⚠️ ${d.error}${d.detail ? `\n${d.detail}` : ""}`);
    setSyncing(false);
    // Через 5 сек обновим список runs
    setTimeout(loadAll, 5000);
  }

  // Уникальные источники в matched
  const sources = useMemo(() => {
    if (!meta) return [];
    return Array.from(new Set(meta.matched.map(m => m.source).filter(Boolean)));
  }, [meta]);

  const filteredMatched = useMemo(() => {
    if (!meta) return [];
    const q = filter.trim().toLowerCase();
    return meta.matched.filter(m => {
      if (sourceFilter !== "all" && m.source !== sourceFilter) return false;
      if (q && !m.name.toLowerCase().includes(q) && !m.sku.includes(q)) return false;
      return true;
    });
  }, [meta, filter, sourceFilter]);

  return (
    <div className="min-h-screen bg-[#0A1628] text-white">
      {/* Header */}
      <div className="border-b border-[#1A3C6E]/30 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            📊 Цены — синхронизация с TG-каналами
            <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-md"
                  style={{ background: "#C8972B", color: "#fff" }}>
              root
            </span>
          </h1>
          {meta && (
            <p className="text-xs text-[#9CA3AF] mt-1">
              Последняя синхронизация:{" "}
              <span className="text-white">
                {new Date(meta.syncedAt).toLocaleString("ru-RU", {
                  day: "2-digit", month: "2-digit", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </span>{" "}
              ({timeAgo(meta.syncedAt)}) · markup +{meta.markup} ₽ · стратегия: {meta.strategy}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={syncNow} disabled={syncing}
                  className="px-4 py-2 text-sm font-semibold rounded-full transition-opacity
                             hover:opacity-90 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #C8972B, #a87d22)", color: "#fff" }}>
            {syncing ? "Запускаю…" : "🔄 Sync now"}
          </button>
          <Link href="/admin"
                className="px-4 py-2 text-sm font-semibold text-white border border-[#1A3C6E] rounded-full
                           hover:bg-[#1A3C6E]/30 transition-colors">
            ← В админку
          </Link>
        </div>
      </div>

      {syncMsg && (
        <div className="mx-6 mt-3 px-4 py-2 rounded-lg text-sm whitespace-pre-line"
             style={{ background: "rgba(200,151,43,0.15)", border: "1px solid rgba(200,151,43,0.40)" }}>
          {syncMsg}
        </div>
      )}

      {/* Channels stats */}
      {meta && (
        <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          {meta.channels.map(c => (
            <div key={c.name} className="bg-[#0E2344] border border-[#1A3C6E]/50 rounded-xl p-4">
              <p className="text-sm font-bold text-[#C8972B]">{c.displayName}</p>
              <p className="text-[10px] text-[#9CA3AF]">@{c.name} · {c.postIds.length} постов</p>
              <p className="text-[11px] text-[#9CA3AF] mt-1">{c.linesTotal} строк парсилось</p>
              <p className="text-lg font-extrabold mt-2 text-white">{c.winsMax}<span className="text-xs text-[#9CA3AF] font-normal"> побед MAX</span></p>
            </div>
          ))}
          <div className="bg-[#0E2344] border border-[#1A3C6E]/50 rounded-xl p-4">
            <p className="text-sm font-bold text-[#3FCFA5]">Сводка</p>
            <p className="text-xs text-[#9CA3AF] mt-1">Сматчено в каталог</p>
            <p className="text-lg font-extrabold text-white">{meta.totals.matched}</p>
            <p className="text-xs text-[#9CA3AF]">
              Без матча: ключей <b className="text-orange-400">{meta.totals.unmatchedKeys}</b>{" "}
              · строк <b className="text-orange-400">{meta.totals.unmatchedRaw}</b>
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-t border-b border-[#1A3C6E]/30 px-6 flex gap-6 mt-2">
        {([
          ["matched", `Сматчено (${meta?.totals.matched ?? 0})`],
          ["unmatchedKeys", `Без товара в каталоге (${meta?.totals.unmatchedKeys ?? 0})`],
          ["unmatchedRaw", `Не распарсилось (${meta?.totals.unmatchedRaw ?? 0})`],
          ["runs", `Запуски (${runs.length})`],
        ] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
                  className={`py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${
                    tab === k
                      ? "border-[#C8972B] text-[#C8972B]"
                      : "border-transparent text-[#9CA3AF] hover:text-white"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        {loading && <p className="text-[#9CA3AF]">Загрузка…</p>}
        {error && <p className="text-red-400">⚠️ {error}</p>}

        {meta && tab === "matched" && (
          <>
            <div className="flex gap-2 mb-3 flex-wrap">
              <input
                type="text" placeholder="Фильтр по названию или SKU…"
                value={filter} onChange={e => setFilter(e.target.value)}
                className="flex-1 min-w-[200px] px-3 py-2 text-sm bg-[#0E2344] border border-[#1A3C6E]/50 rounded-lg"
              />
              <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
                      className="px-3 py-2 text-sm bg-[#0E2344] border border-[#1A3C6E]/50 rounded-lg">
                <option value="all">Все источники</option>
                {sources.map(s => <option key={s} value={s}>@{s}</option>)}
              </select>
            </div>
            <p className="text-xs text-[#9CA3AF] mb-2">Показано: {filteredMatched.length} из {meta.matched.length}</p>
            <div className="bg-[#0E2344] border border-[#1A3C6E]/50 rounded-xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#0A1628] text-[#9CA3AF] text-xs">
                  <tr>
                    <th className="text-left px-3 py-2">Товар</th>
                    {meta.channels.map(c => (
                      <th key={c.name} className="text-right px-3 py-2">{c.displayName}</th>
                    ))}
                    <th className="text-right px-3 py-2 border-l border-[#1A3C6E]/40">Финнайс</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMatched.map(m => {
                    // Минимальная цена среди магазинов — её красим в зелёный
                    const prices = Object.values(m.perChannel).filter(p => p > 0);
                    const minPrice = prices.length ? Math.min(...prices) : null;
                    return (
                      <tr key={m.sku} className="border-t border-[#1A3C6E]/20 hover:bg-[#1A3C6E]/20">
                        <td className="px-3 py-2">
                          <div className="font-medium">{m.name}</div>
                          <div className="text-[10px] text-[#9CA3AF] font-mono">{m.sku}</div>
                        </td>
                        {meta.channels.map(c => {
                          const price = m.perChannel[c.name];
                          const isMin = price != null && price === minPrice;
                          return (
                            <td key={c.name}
                                className={`px-3 py-2 text-right tabular-nums ${
                                  price == null ? "text-[#4B5563]"
                                  : isMin       ? "text-emerald-400 font-bold"
                                                : "text-white"}`}>
                              {price == null ? "—" : fmt(price)}
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 text-right tabular-nums font-bold border-l border-[#1A3C6E]/40">
                          {fmt(m.finalPrice)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-[#9CA3AF] mt-2">
              💡 Зелёным выделена самая низкая цена среди магазинов. «Финнайс» — наша
              финальная (max от магазинов + {meta.markup}₽ markup).
            </p>
          </>
        )}

        {meta && tab === "unmatchedKeys" && (
          <>
            <p className="text-xs text-[#9CA3AF] mb-3">
              Эти товары есть в TG-каналах, но не нашлось соответствия в нашем каталоге
              (lib/data.ts или lib/biggeek-products.ts). Можно добавить в каталог через tg-additions.ts.
            </p>
            <div className="bg-[#0E2344] border border-[#1A3C6E]/50 rounded-xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#0A1628] text-[#9CA3AF] text-xs">
                  <tr>
                    <th className="text-left px-3 py-2">Ключ TG</th>
                    <th className="text-right px-3 py-2">TG-цена</th>
                    <th className="text-right px-3 py-2">Финал (+markup)</th>
                    <th className="text-left px-3 py-2">Источник</th>
                  </tr>
                </thead>
                <tbody>
                  {meta.unmatchedKeys.map(k => (
                    <tr key={k.key} className="border-t border-[#1A3C6E]/20">
                      <td className="px-3 py-2 font-mono text-xs">{k.key}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmt(k.tgPrice)}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-bold">{fmt(k.finalPrice)}</td>
                      <td className="px-3 py-2 text-xs">@{k.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {meta && tab === "unmatchedRaw" && (
          <>
            <p className="text-xs text-[#9CA3AF] mb-3">
              Строки из каналов, которые не удалось нормализовать в наш формат «Brand|Model|Memory».
              Чаще всего — бренды, которых не парсит скрипт (Samsung, Xiaomi, Garmin и т.д.).
              Сгруппировано по бренду для удобства.
            </p>
            <div className="space-y-3">
              {Object.entries(meta.unmatchedByBrand).map(([brand, items]) => (
                <details key={brand} className="bg-[#0E2344] border border-[#1A3C6E]/50 rounded-xl">
                  <summary className="cursor-pointer px-4 py-2 font-semibold text-sm flex items-center justify-between">
                    <span>{brand}</span>
                    <span className="text-xs text-[#9CA3AF]">{items.length} строк</span>
                  </summary>
                  <table className="w-full text-sm">
                    <tbody>
                      {items.map((it, i) => (
                        <tr key={i} className="border-t border-[#1A3C6E]/20">
                          <td className="px-4 py-1.5 text-xs">{it.raw}</td>
                          <td className="px-4 py-1.5 text-right tabular-nums text-xs whitespace-nowrap">{fmt(it.tgPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              ))}
            </div>
          </>
        )}

        {tab === "runs" && (
          <>
            {runsError && (
              <p className="text-orange-400 text-sm mb-3">⚠️ {runsError}</p>
            )}
            {!runsError && runs.length === 0 && !loading && (
              <p className="text-[#9CA3AF] text-sm">Запусков пока нет.</p>
            )}
            <div className="space-y-2">
              {runs.map(r => (
                <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
                   className="block bg-[#0E2344] border border-[#1A3C6E]/50 rounded-xl p-3 hover:border-[#C8972B]/50 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {r.conclusion === "success" ? "✅"
                          : r.conclusion === "failure" ? "❌"
                          : r.status === "in_progress" || r.status === "queued" ? "⏳"
                          : "·"}
                      </span>
                      <div>
                        <p className="text-sm font-semibold">Run #{r.number} <span className="text-xs text-[#9CA3AF] font-normal">({r.event})</span></p>
                        <p className="text-[11px] text-[#9CA3AF]">{r.actor} · {timeAgo(r.startedAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase font-bold"
                         style={{ color: r.conclusion === "success" ? "#3FCFA5"
                                       : r.conclusion === "failure" ? "#FF6B6B"
                                       : "#9CA3AF" }}>
                        {r.status} {r.conclusion ? `/ ${r.conclusion}` : ""}
                      </p>
                    </div>
                  </div>
                  {r.message && (
                    <p className="text-xs text-[#9CA3AF] mt-2 ml-9 line-clamp-2">
                      {r.message.split("\n")[0]}
                    </p>
                  )}
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
