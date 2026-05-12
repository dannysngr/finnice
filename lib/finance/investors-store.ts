/**
 * lib/finance/investors-store.ts
 *
 * Хранилище инвесторов в Redis.
 *
 * Модель данных:
 *   Investor — сущность с ФИО, контактами, заметками
 *   Investor.deposits[] — пополнения (можно вносить в несколько траншей)
 *   Investor.withdrawals[] — выводы
 *
 * Каждый депозит несёт собственный срок и контрактную долю прибыли,
 * чтобы можно было моделировать ситуации, когда инвестор вносит
 * разные суммы на разных условиях.
 *
 * Redis keys:
 *   investors:all → JSON.stringify(Investor[])  (один ключ — список небольшой)
 */

import { getRedis } from "@/lib/redis";

const KEY = "investors:all";

export interface Deposit {
  id: string;
  amount: number;          // ₽
  date: string;            // ISO yyyy-mm-dd — дата внесения
  termMonths: number;      // на какой срок внесено
  profitSharePct: number;  // 0..1 — контрактная доля прибыли инвестора (например 0.4 = 40%)
  note?: string;
}

export interface Withdrawal {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

export interface Investor {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  deposits: Deposit[];
  withdrawals: Withdrawal[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type InvestorInput = Omit<Investor, "id" | "createdAt" | "updatedAt" | "deposits" | "withdrawals"> & {
  deposits?: Deposit[];
  withdrawals?: Withdrawal[];
};

function genId(prefix = "inv"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function listInvestors(): Promise<Investor[]> {
  const r = getRedis();
  const raw = await r.get<string | Investor[]>(KEY);
  if (!raw) return [];
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return raw as Investor[];
}

async function saveAll(list: Investor[]): Promise<void> {
  const r = getRedis();
  await r.set(KEY, JSON.stringify(list));
}

export async function createInvestor(input: InvestorInput): Promise<Investor> {
  const list = await listInvestors();
  const now = new Date().toISOString();
  const inv: Investor = {
    id: genId(),
    fullName: input.fullName.trim(),
    phone: input.phone?.trim() || undefined,
    email: input.email?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    deposits: input.deposits ?? [],
    withdrawals: input.withdrawals ?? [],
    createdAt: now,
    updatedAt: now,
  };
  list.unshift(inv);
  await saveAll(list);
  return inv;
}

export async function updateInvestor(id: string, patch: Partial<InvestorInput>): Promise<Investor | null> {
  const list = await listInvestors();
  const idx = list.findIndex(i => i.id === id);
  if (idx < 0) return null;
  const cur = list[idx];
  const next: Investor = {
    ...cur,
    fullName: patch.fullName?.trim() ?? cur.fullName,
    phone:    patch.phone !== undefined    ? (patch.phone?.trim() || undefined)    : cur.phone,
    email:    patch.email !== undefined    ? (patch.email?.trim() || undefined)    : cur.email,
    notes:    patch.notes !== undefined    ? (patch.notes?.trim() || undefined)    : cur.notes,
    deposits:    patch.deposits    ?? cur.deposits,
    withdrawals: patch.withdrawals ?? cur.withdrawals,
    updatedAt: new Date().toISOString(),
  };
  list[idx] = next;
  await saveAll(list);
  return next;
}

export async function deleteInvestor(id: string): Promise<boolean> {
  const list = await listInvestors();
  const next = list.filter(i => i.id !== id);
  if (next.length === list.length) return false;
  await saveAll(next);
  return true;
}

export async function addDeposit(investorId: string, dep: Omit<Deposit, "id">): Promise<Investor | null> {
  const list = await listInvestors();
  const idx = list.findIndex(i => i.id === investorId);
  if (idx < 0) return null;
  const newDep: Deposit = { id: genId("dep"), ...dep };
  list[idx] = {
    ...list[idx],
    deposits: [...list[idx].deposits, newDep],
    updatedAt: new Date().toISOString(),
  };
  await saveAll(list);
  return list[idx];
}

export async function addWithdrawal(investorId: string, w: Omit<Withdrawal, "id">): Promise<Investor | null> {
  const list = await listInvestors();
  const idx = list.findIndex(i => i.id === investorId);
  if (idx < 0) return null;
  const newW: Withdrawal = { id: genId("wd"), ...w };
  list[idx] = {
    ...list[idx],
    withdrawals: [...list[idx].withdrawals, newW],
    updatedAt: new Date().toISOString(),
  };
  await saveAll(list);
  return list[idx];
}

export async function removeDeposit(investorId: string, depositId: string): Promise<Investor | null> {
  const list = await listInvestors();
  const idx = list.findIndex(i => i.id === investorId);
  if (idx < 0) return null;
  list[idx] = {
    ...list[idx],
    deposits: list[idx].deposits.filter(d => d.id !== depositId),
    updatedAt: new Date().toISOString(),
  };
  await saveAll(list);
  return list[idx];
}

export async function removeWithdrawal(investorId: string, withdrawalId: string): Promise<Investor | null> {
  const list = await listInvestors();
  const idx = list.findIndex(i => i.id === investorId);
  if (idx < 0) return null;
  list[idx] = {
    ...list[idx],
    withdrawals: list[idx].withdrawals.filter(w => w.id !== withdrawalId),
    updatedAt: new Date().toISOString(),
  };
  await saveAll(list);
  return list[idx];
}
