"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Investor } from "@/lib/finance/investors-store";
import type {
  InvestorProjection,
  PortfolioAggregate,
  AdminPolicy,
} from "@/lib/finance/investor-projections";
import {
  formatPhone,
  phoneInputOnChange,
  shouldBlockPhoneKeyDown,
  phoneToE164,
} from "@/lib/phone-mask";

const fmt = (n: number) =>
  Math.round(n).toLocaleString("ru-RU");
const fmtPct = (n: number, d = 1) =>
  isFinite(n) ? `${(n * 100).toFixed(d)}%` : "—";
const todayISO = () => new Date().toISOString().slice(0, 10);

interface Props {
  initialInvestors:   Investor[];
  initialAggregate:   PortfolioAggregate;
  initialProjections: InvestorProjection[];
  policy:             AdminPolicy;
}

export function PortfolioClient({
  initialInvestors, initialAggregate, initialProjections, policy,
}: Props) {
  const router = useRouter();
  const [investors,   setInvestors]   = useState(initialInvestors);
  const [aggregate,   setAggregate]   = useState(initialAggregate);
  const [projections, setProjections] = useState(initialProjections);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [openDetailId, setOpenDetailId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  async function refresh() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/investors", { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setInvestors(data.investors);
      setAggregate(data.aggregate);
      setProjections(data.projections);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка обновления");
    } finally {
      setBusy(false);
    }
  }

  async function callApi(action: string, payload: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/investors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Ошибка");
      await refresh();
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projections;
    return projections.filter(p => p.fullName.toLowerCase().includes(q));
  }, [projections, search]);

  const openDetail = openDetailId ? projections.find(p => p.investorId === openDetailId) : null;
  const openInvestor = openDetailId ? investors.find(i => i.id === openDetailId) : null;

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-[1400px] mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0A1628]">
              📊 Портфель инвесторов
            </h1>
            <p className="text-xs text-[#6B7280] mt-1">
              Управление вкладами, прогноз доходностей, денежный поток.
              Расчёты по admin-policy (инфляция {fmtPct(policy.expectedInflationAnnual, 1)}).
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => router.push("/admin/finance")}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-[#E5E7EB] text-[#374151] hover:bg-[#F3F4F6]">
              ← В Симуляцию
            </button>
            <button onClick={() => router.push("/admin")}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-[#E5E7EB] text-[#374151] hover:bg-[#F3F4F6]">
              В админку
            </button>
            <button onClick={refresh} disabled={busy}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0A1628] text-white disabled:opacity-50">
              {busy ? "..." : "↻ Обновить"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[#FEF2F2] border border-[#FCA5A5] text-sm text-[#991B1B]">
            ⚠ {error}
          </div>
        )}

        {/* Dashboard cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <DashCard label="Инвесторов"        value={aggregate.totalInvestors.toString()} />
          <DashCard label="Поднято всего"     value={fmt(aggregate.totalCapitalRaised) + " ₽"} accent />
          <DashCard label="Тело в работе"     value={fmt(aggregate.totalActivePrincipal) + " ₽"} />
          <DashCard label="Выведено"          value={fmt(aggregate.totalWithdrawnAll) + " ₽"} />
          <DashCard label="Ожид. прибыль"     value={fmt(aggregate.totalExpectedProfit) + " ₽"} positive />
          <DashCard label="Средний ROI/год"   value={fmtPct(aggregate.weightedAvgRoiAnnual, 1)} positive />
        </div>

        {/* Cash flow forecast */}
        {aggregate.upcomingPayouts.length > 0 && (
          <div className="mb-6 bg-white rounded-2xl border border-[#E5E7EB] p-4">
            <h2 className="text-sm font-bold text-[#0A1628] mb-3">
              📅 Прогноз выплат инвесторам (24 мес)
            </h2>
            <div className="overflow-x-auto">
              <div className="flex gap-2 pb-2 min-w-max">
                {aggregate.upcomingPayouts.slice(0, 24).map(p => (
                  <div key={p.monthOffset}
                       className="flex flex-col items-center min-w-[88px] p-2 rounded-lg bg-[#F0FDF4] border border-[#86EFAC]">
                    <div className="text-[10px] text-[#065F46] font-medium">
                      {new Date(p.date).toLocaleDateString("ru-RU", { month: "short", year: "2-digit" })}
                    </div>
                    <div className="text-xs font-extrabold text-[#065F46] mt-1">
                      {fmt(p.amount)}
                    </div>
                    <div className="text-[9px] text-[#6B7280]">₽</div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[10px] text-[#9CA3AF] mt-2">
              Сумма включает возврат тела депозита в месяц maturity + равномерно распределённую прибыль.
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <input type="text" placeholder="Поиск по ФИО..." value={search}
                   onChange={e => setSearch(e.target.value)}
                   className="px-3 py-1.5 text-sm border border-[#E5E7EB] rounded-lg bg-white w-56 focus:outline-none focus:border-[#0C7A58]" />
            <span className="text-xs text-[#6B7280]">
              Показано: {filtered.length} из {projections.length}
            </span>
          </div>
          <button onClick={() => setShowAddForm(s => !s)}
                  className="px-4 py-1.5 text-sm font-semibold rounded-lg text-white"
                  style={{ background: "linear-gradient(135deg, #0C7A58, #0a6449)" }}>
            {showAddForm ? "✕ Закрыть" : "+ Добавить инвестора"}
          </button>
        </div>

        {showAddForm && (
          <AddInvestorForm
            onSubmit={async (form) => {
              const res = await callApi("create", { investor: form.investor });
              const inv = (res as { ok: boolean; investor: Investor } | undefined)?.investor;
              if (inv && form.deposit) {
                await callApi("addDeposit", { id: inv.id, deposit: form.deposit });
              }
              setShowAddForm(false);
            }}
          />
        )}

        {/* Investors table */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <tr>
                  <Th>ФИО</Th>
                  <Th>Внесено</Th>
                  <Th>Выведено</Th>
                  <Th>Тело в работе</Th>
                  <Th>Ожид. прибыль</Th>
                  <Th>Накоплено</Th>
                  <Th>Баланс</Th>
                  <Th>ROI/год</Th>
                  <Th>Депозитов</Th>
                  <Th>Ближайший maturity</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-12 text-[#6B7280]">
                      {projections.length === 0
                        ? "Инвесторов пока нет. Нажмите «+ Добавить инвестора»."
                        : "Ничего не найдено."}
                    </td>
                  </tr>
                ) : filtered.map(p => (
                  <tr key={p.investorId}
                      className="border-b border-[#F3F4F6] hover:bg-[#FAFAFA] cursor-pointer"
                      onClick={() => setOpenDetailId(p.investorId)}>
                    <Td bold>{p.fullName}</Td>
                    <Td>{fmt(p.totalDeposited)} ₽</Td>
                    <Td>{fmt(p.totalWithdrawn)} ₽</Td>
                    <Td>{fmt(p.activePrincipal)} ₽</Td>
                    <Td positive>{fmt(p.expectedProfitTotal)} ₽</Td>
                    <Td>{fmt(p.accruedProfitTotal)} ₽</Td>
                    <Td bold>{fmt(p.currentBalance)} ₽</Td>
                    <Td positive>{fmtPct(p.weightedAvgRoiAnnual, 1)}</Td>
                    <Td>{p.deposits.length}</Td>
                    <Td>{p.earliestMaturity ?? "—"}</Td>
                    <Td>
                      <button onClick={e => { e.stopPropagation(); setOpenDetailId(p.investorId); }}
                              className="text-xs text-[#0C7A58] hover:underline">
                        Открыть →
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-[11px] text-[#9CA3AF] mt-4">
          ℹ️ Метрики рассчитываются по текущей admin-policy (инфляция, дефолты, opex, deploy, recovery).
          Изменения параметров в Симуляторе автоматически отражаются здесь после обновления.
        </p>
      </div>

      {openDetail && openInvestor && (
        <InvestorDetailModal
          investor={openInvestor}
          projection={openDetail}
          onClose={() => setOpenDetailId(null)}
          onAction={callApi}
          busy={busy}
        />
      )}
    </div>
  );
}

/* ─── small components ─────────────────────────────────────── */

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="text-left text-[10px] uppercase tracking-wide text-[#6B7280] font-semibold px-3 py-2.5">
      {children}
    </th>
  );
}

function Td({ children, bold, positive }: {
  children: React.ReactNode; bold?: boolean; positive?: boolean;
}) {
  return (
    <td className="px-3 py-2.5 whitespace-nowrap"
        style={{ fontWeight: bold ? 700 : 400, color: positive ? "#065F46" : "#0A1628" }}>
      {children}
    </td>
  );
}

function DashCard({ label, value, accent, positive }: {
  label: string; value: string; accent?: boolean; positive?: boolean;
}) {
  let bg = "#fff", border = "#E5E7EB", fg = "#0A1628";
  if (accent)   { bg = "#ECFDF5"; border = "#A7F3D0"; fg = "#065F46"; }
  if (positive) { bg = "#F5F3FF"; border = "#C4B5FD"; fg = "#5b21b6"; }
  return (
    <div className="rounded-xl p-3" style={{ background: bg, border: `1px solid ${border}` }}>
      <div className="text-[10px] uppercase tracking-wide text-[#6B7280]">{label}</div>
      <div className="text-base font-extrabold mt-1" style={{ color: fg }}>{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] text-[#6B7280] mb-1">{label}</span>
      {children}
    </label>
  );
}

/* ─── Add investor form ────────────────────────────────────── */

function AddInvestorForm({ onSubmit }: {
  onSubmit: (data: {
    investor: { fullName: string; phone?: string; email?: string; notes?: string };
    deposit?: { amount: number; date: string; termMonths: number; profitSharePct: number; note?: string };
  }) => Promise<void>;
}) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [withDeposit, setWithDeposit] = useState(true);
  const [amount, setAmount] = useState(1_000_000);
  const [date, setDate] = useState(todayISO());
  const [termMonths, setTermMonths] = useState(12);
  const [profitSharePct, setProfitSharePct] = useState(40);
  const [depNote, setDepNote] = useState("");

  const canSubmit = fullName.trim().length > 0 && (!withDeposit || (amount > 0 && termMonths > 0));

  return (
    <div className="mb-4 bg-white rounded-2xl border-2 border-[#0C7A58] p-5">
      <h3 className="text-sm font-bold text-[#0A1628] mb-3">Новый инвестор</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <Field label="ФИО *">
          <input value={fullName} onChange={e => setFullName(e.target.value)}
                 placeholder="Иванов Иван Иванович"
                 className="w-full px-3 py-1.5 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#0C7A58]" />
        </Field>
        <Field label="Телефон">
          <input value={phone}
                 onChange={e => setPhone(phoneInputOnChange(e.target.value))}
                 onKeyDown={e => {
                   if (shouldBlockPhoneKeyDown(e.key, e.currentTarget.selectionStart, e.currentTarget.selectionEnd)) {
                     e.preventDefault();
                   }
                 }}
                 onFocus={() => { if (!phone) setPhone("+7 "); }}
                 onBlur={() => { if (phone === "+7 " || phone === "+7") setPhone(""); }}
                 inputMode="tel"
                 placeholder="+7 9XX XXX XX XX"
                 className="w-full px-3 py-1.5 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#0C7A58]" />
        </Field>
        <Field label="Email">
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="name@..."
                 className="w-full px-3 py-1.5 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#0C7A58]" />
        </Field>
        <Field label="Заметки">
          <input value={notes} onChange={e => setNotes(e.target.value)}
                 className="w-full px-3 py-1.5 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#0C7A58]" />
        </Field>
      </div>

      <div className="border-t border-[#E5E7EB] pt-3 mb-3">
        <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#0A1628] cursor-pointer">
          <input type="checkbox" checked={withDeposit} onChange={e => setWithDeposit(e.target.checked)}
                 className="accent-[#0C7A58]" />
          Сразу добавить первый депозит
        </label>
      </div>

      {withDeposit && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <Field label="Сумма ₽">
            <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value) || 0)}
                   className="w-full px-3 py-1.5 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#0C7A58]" />
          </Field>
          <Field label="Дата">
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
                   className="w-full px-3 py-1.5 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#0C7A58]" />
          </Field>
          <Field label="Срок (мес)">
            <input type="number" value={termMonths} onChange={e => setTermMonths(Number(e.target.value) || 0)}
                   min={1} max={60}
                   className="w-full px-3 py-1.5 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#0C7A58]" />
          </Field>
          <Field label="Доля прибыли (%)">
            <input type="number" value={profitSharePct} onChange={e => setProfitSharePct(Number(e.target.value) || 0)}
                   min={0} max={100} step={5}
                   className="w-full px-3 py-1.5 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#0C7A58]" />
          </Field>
          <Field label="Заметка к депозиту">
            <input value={depNote} onChange={e => setDepNote(e.target.value)}
                   className="w-full px-3 py-1.5 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#0C7A58]" />
          </Field>
        </div>
      )}

      <button disabled={!canSubmit}
              onClick={() => onSubmit({
                investor: {
                  fullName: fullName.trim(),
                  phone: phoneToE164(phone) || undefined,
                  email: email.trim() || undefined,
                  notes: notes.trim() || undefined,
                },
                deposit: withDeposit ? {
                  amount, date, termMonths,
                  profitSharePct: profitSharePct / 100,
                  note: depNote.trim() || undefined,
                } : undefined,
              })}
              className="px-4 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #0C7A58, #0a6449)" }}>
        Создать инвестора
      </button>
    </div>
  );
}

/* ─── Detail modal ─────────────────────────────────────────── */

function InvestorDetailModal({
  investor, projection, onClose, onAction, busy,
}: {
  investor: Investor;
  projection: InvestorProjection;
  onClose: () => void;
  onAction: (action: string, payload: Record<string, unknown>) => Promise<unknown>;
  busy: boolean;
}) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  const [tab, setTab] = useState<"overview" | "deposit" | "withdraw">("overview");
  const [amount, setAmount] = useState(500_000);
  const [date, setDate] = useState(todayISO());
  const [termMonths, setTermMonths] = useState(12);
  const [profitSharePct, setProfitSharePct] = useState(40);
  const [note, setNote] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4"
         onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-4xl w-full my-4 shadow-2xl" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between p-5 border-b border-[#E5E7EB]">
          <div>
            <h2 className="text-lg font-extrabold text-[#0A1628]">{investor.fullName}</h2>
            <div className="text-xs text-[#6B7280] mt-0.5">
              {investor.phone && <span>📞 {formatPhone(investor.phone) || investor.phone}</span>}
              {investor.phone && investor.email && <span className="mx-2">·</span>}
              {investor.email && <span>✉ {investor.email}</span>}
            </div>
            {investor.notes && (
              <p className="text-xs text-[#374151] mt-1 italic">{investor.notes}</p>
            )}
          </div>
          <button onClick={onClose} className="text-2xl text-[#6B7280] hover:text-[#0A1628]">×</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5 bg-[#F9FAFB]">
          <DashCard label="Внесено"       value={fmt(projection.totalDeposited) + " ₽"} />
          <DashCard label="Тело в работе" value={fmt(projection.activePrincipal) + " ₽"} />
          <DashCard label="Накоплено"     value={fmt(projection.accruedProfitTotal) + " ₽"} positive />
          <DashCard label="Баланс"        value={fmt(projection.currentBalance) + " ₽"} accent />
        </div>

        <div className="border-b border-[#E5E7EB] px-5 flex gap-2">
          {(["overview", "deposit", "withdraw"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
                    className="px-3 py-2 text-xs font-semibold border-b-2 transition-colors"
                    style={{
                      borderColor: tab === t ? "#0C7A58" : "transparent",
                      color: tab === t ? "#0C7A58" : "#6B7280",
                    }}>
              {t === "overview" ? "Обзор" : t === "deposit" ? "+ Депозит" : "− Вывод"}
            </button>
          ))}
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {tab === "overview" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-bold uppercase text-[#6B7280] mb-2">Депозиты ({investor.deposits.length})</h3>
                {investor.deposits.length === 0 ? (
                  <p className="text-sm text-[#9CA3AF]">Депозитов пока нет.</p>
                ) : (
                  <div className="space-y-2">
                    {investor.deposits.map(d => {
                      const dp = projection.deposits.find(p => p.depositId === d.id);
                      return (
                        <div key={d.id} className="border border-[#E5E7EB] rounded-lg p-3 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-semibold text-[#0A1628]">
                              {fmt(d.amount)} ₽ на {d.termMonths} мес · {fmtPct(d.profitSharePct, 0)} прибыли
                            </div>
                            <button onClick={() => onAction("removeDeposit", { id: investor.id, depositId: d.id })}
                                    disabled={busy}
                                    className="text-[10px] text-[#991B1B] hover:underline disabled:opacity-50">
                              Удалить
                            </button>
                          </div>
                          <div className="text-[#6B7280]">
                            Внесено: {d.date} → maturity: {dp?.maturityDate ?? "—"}{" "}
                            (прошло {dp?.monthsElapsed ?? 0} мес, осталось {dp?.monthsRemaining ?? 0})
                          </div>
                          {dp && (
                            <div className="mt-1 text-[#374151]">
                              Ожид. прибыль: <b>{fmt(dp.expectedProfit)} ₽</b> ·
                              ROI: <b className="text-[#065F46]">{fmtPct(dp.expectedRoiAnnual, 1)}/год</b> ·
                              К возврату: <b>{fmt(dp.totalReturn)} ₽</b>
                            </div>
                          )}
                          {d.note && <div className="text-[10px] text-[#9CA3AF] italic mt-1">{d.note}</div>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase text-[#6B7280] mb-2">Выводы ({investor.withdrawals.length})</h3>
                {investor.withdrawals.length === 0 ? (
                  <p className="text-sm text-[#9CA3AF]">Выводов пока не было.</p>
                ) : (
                  <div className="space-y-1.5">
                    {investor.withdrawals.map(w => (
                      <div key={w.id} className="flex items-center justify-between border border-[#E5E7EB] rounded-lg p-2 text-xs">
                        <span>
                          <b>{fmt(w.amount)} ₽</b> · {w.date}
                          {w.note && <span className="text-[#9CA3AF] italic ml-2">— {w.note}</span>}
                        </span>
                        <button onClick={() => onAction("removeWithdrawal", { id: investor.id, withdrawalId: w.id })}
                                disabled={busy}
                                className="text-[10px] text-[#991B1B] hover:underline disabled:opacity-50">
                          Удалить
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {projection.upcomingPayouts.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase text-[#6B7280] mb-2">Прогноз выплат (24 мес)</h3>
                  <div className="overflow-x-auto">
                    <div className="flex gap-1.5 pb-2 min-w-max">
                      {projection.upcomingPayouts.map(u => (
                        <div key={u.monthOffset}
                             className="flex flex-col items-center min-w-[72px] p-2 rounded-lg bg-[#F5F3FF] border border-[#C4B5FD]">
                          <div className="text-[9px] text-[#5b21b6]">
                            {new Date(u.date).toLocaleDateString("ru-RU", { month: "short", year: "2-digit" })}
                          </div>
                          <div className="text-[11px] font-extrabold text-[#5b21b6] mt-0.5">{fmt(u.amount)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-[#E5E7EB] pt-4">
                <button onClick={async () => {
                          if (confirm(`Удалить инвестора "${investor.fullName}" со всеми его данными?`)) {
                            await onAction("delete", { id: investor.id });
                            onClose();
                          }
                        }}
                        disabled={busy}
                        className="text-xs text-[#991B1B] hover:underline disabled:opacity-50">
                  🗑 Удалить инвестора
                </button>
              </div>
            </div>
          )}

          {tab === "deposit" && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#0A1628]">Добавить депозит</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Сумма ₽">
                  <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value) || 0)}
                         className="w-full px-3 py-1.5 text-sm border border-[#E5E7EB] rounded-lg" />
                </Field>
                <Field label="Дата">
                  <input type="date" value={date} onChange={e => setDate(e.target.value)}
                         className="w-full px-3 py-1.5 text-sm border border-[#E5E7EB] rounded-lg" />
                </Field>
                <Field label="Срок (мес)">
                  <input type="number" value={termMonths} onChange={e => setTermMonths(Number(e.target.value) || 0)}
                         min={1} max={60}
                         className="w-full px-3 py-1.5 text-sm border border-[#E5E7EB] rounded-lg" />
                </Field>
                <Field label="Доля прибыли (%)">
                  <input type="number" value={profitSharePct} onChange={e => setProfitSharePct(Number(e.target.value) || 0)}
                         min={0} max={100} step={5}
                         className="w-full px-3 py-1.5 text-sm border border-[#E5E7EB] rounded-lg" />
                </Field>
                <Field label="Заметка">
                  <input value={note} onChange={e => setNote(e.target.value)}
                         className="w-full px-3 py-1.5 text-sm border border-[#E5E7EB] rounded-lg" />
                </Field>
              </div>
              <button disabled={busy || amount <= 0}
                      onClick={async () => {
                        await onAction("addDeposit", {
                          id: investor.id,
                          deposit: { amount, date, termMonths, profitSharePct: profitSharePct / 100, note: note.trim() || undefined },
                        });
                        setNote(""); setTab("overview");
                      }}
                      className="px-4 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg, #0C7A58, #0a6449)" }}>
                + Добавить депозит
              </button>
            </div>
          )}

          {tab === "withdraw" && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#0A1628]">Зафиксировать вывод</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Сумма ₽">
                  <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value) || 0)}
                         className="w-full px-3 py-1.5 text-sm border border-[#E5E7EB] rounded-lg" />
                </Field>
                <Field label="Дата">
                  <input type="date" value={date} onChange={e => setDate(e.target.value)}
                         className="w-full px-3 py-1.5 text-sm border border-[#E5E7EB] rounded-lg" />
                </Field>
                <Field label="Заметка">
                  <input value={note} onChange={e => setNote(e.target.value)}
                         className="w-full px-3 py-1.5 text-sm border border-[#E5E7EB] rounded-lg" />
                </Field>
              </div>
              <button disabled={busy || amount <= 0}
                      onClick={async () => {
                        await onAction("addWithdrawal", {
                          id: investor.id,
                          withdrawal: { amount, date, note: note.trim() || undefined },
                        });
                        setNote(""); setTab("overview");
                      }}
                      className="px-4 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg, #B91C1C, #991B1B)" }}>
                − Зафиксировать вывод
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
