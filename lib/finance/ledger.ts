/* ================================================================
   ledger.ts — главная книга денежных движений
   ----------------------------------------------------------------
   Каждая запись: «когда, куда, сколько, по какому поводу».
   Знак суммы: + приход к нам, − расход с нас.

   Storage: Redis key `ledger:{phone}:{loanId}` → LedgerEntry[]
   Все agg-операции (XIRR, портфельный поток) — реконструируем
   на лету из этих записей.
   ================================================================ */

import { getRedis } from "@/lib/redis";
import { v4 as uuidv4 } from "uuid";
import { irrMonthly, annualFromMonthly } from "@/lib/finance/iso-irr";

export type LedgerKind =
  | "disbursement"          // выплата поставщику (T0)
  | "down_payment"          // первый платёж клиента (T0)
  | "installment_planned"   // запланированный ежемесячный
  | "installment_actual"    // фактический платёж клиента
  | "penalty_charity"       // штраф (в благотворительность, не доход)
  | "writeoff"              // списание (дефолт)
  | "opex"                  // операционный расход
  | "funding";              // приход капитала (инвесторский, наш)

export interface LedgerEntry {
  id:         string;
  date:       string;    // ISO YYYY-MM-DD
  loanId?:    string;
  phone?:     string;
  kind:       LedgerKind;
  amount:     number;    // signed
  paymentIdx?: number;
  note?:      string;
}

/* ── Чтение/запись ─────────────────────────────────────────── */

function ledgerKey(phone: string, loanId: string): string {
  return `ledger:${phone}:${loanId}`;
}

export async function readLedger(phone: string, loanId: string): Promise<LedgerEntry[]> {
  const redis = getRedis();
  const data = await redis.get<LedgerEntry[]>(ledgerKey(phone, loanId));
  return Array.isArray(data) ? data : [];
}

export async function appendLedger(
  phone: string, loanId: string,
  entries: Omit<LedgerEntry, "id">[],
): Promise<LedgerEntry[]> {
  const redis = getRedis();
  const current = await readLedger(phone, loanId);
  const withIds: LedgerEntry[] = entries.map(e => ({ ...e, id: uuidv4(), phone, loanId }));
  const updated = [...current, ...withIds];
  await redis.set(ledgerKey(phone, loanId), updated);
  return updated;
}

export async function replaceLedger(
  phone: string, loanId: string,
  entries: LedgerEntry[],
): Promise<void> {
  const redis = getRedis();
  await redis.set(ledgerKey(phone, loanId), entries);
}

/* ── Builder: новая сделка → начальные записи ─────────────── */

export interface InitialLedgerInput {
  startDate:      string;
  costAmount:     number;
  downAmount:     number;
  monthlyPayment: number;
  termMonths:     number;
}

export function buildInitialLedger(input: InitialLedgerInput): Omit<LedgerEntry, "id">[] {
  const entries: Omit<LedgerEntry, "id">[] = [];

  /* T0: оплата поставщику */
  entries.push({
    date: input.startDate, kind: "disbursement",
    amount: -input.costAmount,
    note: "Оплата товара партнёру",
  });

  /* T0: взнос клиента */
  if (input.downAmount > 0) {
    entries.push({
      date: input.startDate, kind: "down_payment",
      amount: input.downAmount,
      note: "Первоначальный взнос",
    });
  }

  /* T1..Tn: плановые платежи */
  for (let i = 0; i < input.termMonths; i++) {
    const d = new Date(input.startDate);
    d.setMonth(d.getMonth() + i + 1);
    entries.push({
      date: d.toISOString().slice(0, 10),
      kind: "installment_planned",
      amount: input.monthlyPayment,
      paymentIdx: i + 1,
      note: `Плановый платёж #${i + 1}`,
    });
  }

  return entries;
}

/* ── Зафиксировать фактический платёж ─────────────────────── */

export async function recordActualPayment(
  phone: string, loanId: string,
  paymentIdx: number, amount: number,
  date?: string,
): Promise<LedgerEntry[]> {
  const entries = await readLedger(phone, loanId);

  /* Не записываем, если уже есть actual с этим индексом */
  const existing = entries.find(e => e.kind === "installment_actual" && e.paymentIdx === paymentIdx);
  if (existing) return entries;

  const newEntry: LedgerEntry = {
    id: uuidv4(),
    phone, loanId,
    date: date ?? new Date().toISOString().slice(0, 10),
    kind: "installment_actual",
    amount,
    paymentIdx,
    note: `Фактический платёж #${paymentIdx}`,
  };
  const updated = [...entries, newEntry];
  await replaceLedger(phone, loanId, updated);
  return updated;
}

/* ── XIRR из ledger (на фактических датах) ────────────────── */

/**
 * Реальный XIRR сделки на основе только фактических потоков:
 *   disbursement, down_payment, installment_actual.
 * Плановые игнорируются. Возвращает annual rate (compound).
 */
export function actualXirr(entries: LedgerEntry[]): number {
  const cashFlows = entries
    .filter(e => e.kind === "disbursement" || e.kind === "down_payment" || e.kind === "installment_actual" || e.kind === "writeoff")
    .map(e => ({ date: new Date(e.date), amount: e.amount }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (cashFlows.length < 2) return NaN;

  const t0 = cashFlows[0].date.getTime();
  const monthOffsets = cashFlows.map(cf => {
    const days = (cf.date.getTime() - t0) / (1000 * 60 * 60 * 24);
    return days / 30.4375; // средний месяц
  });

  /* Подбираем r такой, что NPV = 0 */
  const npv = (r: number) =>
    cashFlows.reduce((acc, cf, i) => acc + cf.amount / Math.pow(1 + r, monthOffsets[i]), 0);

  let lo = -0.99, hi = 10;
  if (Math.sign(npv(lo)) === Math.sign(npv(hi))) return NaN;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const v = npv(mid);
    if (Math.abs(v) < 1e-9) return annualFromMonthly(mid);
    if (Math.sign(v) === Math.sign(npv(lo))) lo = mid;
    else hi = mid;
  }
  return annualFromMonthly((lo + hi) / 2);
}

/* Резерв: запасной alias для целостности экспортов */
export const _irrMonthly = irrMonthly;
