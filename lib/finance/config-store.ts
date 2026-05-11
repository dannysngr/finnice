/* ================================================================
   config-store.ts — JSON-хранилище pricing policy
   ----------------------------------------------------------------
   Эталон 6мес/25%/25% — аксиома модели (фиксирован в iso-irr.ts).
   В конфиге храним только то, что может меняться оператором:
   инфляция, лимиты, ручные override наценок.
   ================================================================ */
import { promises as fs } from "fs";
import path from "path";

export interface FinanceConfig {
  /** Ожидаемая годовая инфляция / девальвация (0..1) */
  expectedInflationAnnual: number;

  /** Допустимые границы для калькулятора */
  minTerm:    number;
  maxTerm:    number;
  minDownPct: number;
  maxDownPct: number;

  /** Ручные override наценок: key = "n:d" (например "12:0.25"), value = decimal 0..1 */
  matrixOverrides?: Record<string, number>;

  /** Meta */
  updatedAt:  string;
  updatedBy?: string;
}

const DEFAULT_CONFIG: FinanceConfig = {
  expectedInflationAnnual: 0.12,
  minTerm:    3,
  maxTerm:    24,
  minDownPct: 0,
  maxDownPct: 0.5,
  matrixOverrides: {},
  updatedAt: new Date().toISOString(),
};

const CONFIG_PATH = path.join(process.cwd(), ".data", "finance-config.json");

async function ensureDir(): Promise<void> {
  const dir = path.dirname(CONFIG_PATH);
  try { await fs.mkdir(dir, { recursive: true }); } catch {}
}

export async function readFinanceConfig(): Promise<FinanceConfig> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<FinanceConfig>;
    // backward compat: old configs могли иметь targetRealIrrAnnual — игнорируем
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      // sanitize
      expectedInflationAnnual:
        typeof parsed.expectedInflationAnnual === "number"
          ? parsed.expectedInflationAnnual
          : DEFAULT_CONFIG.expectedInflationAnnual,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function writeFinanceConfig(
  cfg: Partial<FinanceConfig>,
  updatedBy?: string,
): Promise<FinanceConfig> {
  await ensureDir();
  const current = await readFinanceConfig();
  const merged: FinanceConfig = {
    ...current,
    ...cfg,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
  await fs.writeFile(CONFIG_PATH, JSON.stringify(merged, null, 2), "utf-8");
  return merged;
}
