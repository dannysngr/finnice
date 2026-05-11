/* ================================================================
   policy-history.ts — журнал изменений финансовой политики
   ----------------------------------------------------------------
   Каждый POST на /api/admin/finance-config дописывает запись.
   Хранится отдельным JSON в .data/finance-policy-history.json.
   ================================================================ */
import { promises as fs } from "fs";
import path from "path";

export interface PolicyHistoryEntry {
  at:        string;
  by:        string;
  inflation: number;
  overrides: number;        // count
  diff?:     string;        // human-readable summary
}

const HISTORY_PATH = path.join(process.cwd(), ".data", "finance-policy-history.json");

async function ensureDir(): Promise<void> {
  const dir = path.dirname(HISTORY_PATH);
  try { await fs.mkdir(dir, { recursive: true }); } catch {}
}

export async function readPolicyHistory(): Promise<PolicyHistoryEntry[]> {
  try {
    const raw = await fs.readFile(HISTORY_PATH, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function appendPolicyHistory(entry: PolicyHistoryEntry): Promise<void> {
  await ensureDir();
  const current = await readPolicyHistory();
  const updated = [entry, ...current].slice(0, 100); // храним последние 100
  await fs.writeFile(HISTORY_PATH, JSON.stringify(updated, null, 2), "utf-8");
}
