"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { pluralPayment, calcInstallment } from "@/lib/calculator-logic";
import { formatPhone } from "@/lib/phone-mask";
import { computeProfileCompletion } from "@/lib/profile-completion";
import {
  maskPassportSeries, maskPassportNumber, maskDepartmentCode,
  PASSPORT_SERIES_PLACEHOLDER, PASSPORT_NUMBER_PLACEHOLDER, DEPT_CODE_PLACEHOLDER,
} from "@/lib/passport-mask";
import {
  markupRounded, irrMonthly, annualFromMonthly, baselineIrrAnnual,
} from "@/lib/finance/iso-irr";
import type { LoanRecord } from "@/app/api/lk/me/route";

/* ══════════════════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════════════════ */
interface ApplicationItem {
  productName:  string;
  qty:          number;
  costAmount:   number;
  markupAmount: number;
  markupPct:    number;
  totalAmount:  number;
  downAmount:   number;
  monthly:      number;
}

interface Application {
  id: string;
  name: string;
  phone: string;
  product: string;
  price: number;
  down: number;
  term: number;
  monthly: number;
  status: string;
  createdAt: string;

  /* iso-IRR meta из публичного калькулятора (опционально) */
  costAmount?:          number;
  markupAmount?:        number;
  markupPct?:           number;
  downAmount?:          number;
  targetIrrAtCreation?: number;

  /** Многотоварная заявка */
  items?:               ApplicationItem[];
}

interface User {
  phone:      string;
  firstName:  string | null;
  lastName:   string | null;
  patronymic: string | null;
  createdAt:  string;
  loansCount: number;
}

interface UserDetail {
  phone:          string;
  firstName:      string | null;
  lastName:       string | null;
  patronymic:     string | null;
  birthDate:      string | null;
  trustScore:     number;
  blocked:        boolean;
  chatId:         number | null;
  createdAt:      number | null;
  lastLogin:      number | null;
  loansCount:     number;
  loans:          LoanRecord[];
  birthPlaceCity: string | null;
  addrCity:       string | null;
  addrStreet:     string | null;
  addrHouse:      string | null;
  addrApt:        string | null;
  passportSeries?:         string | null;
  passportNumber?:         string | null;
  passportIssueDate?:      string | null;
  passportIssuedBy?:       string | null;
  passportDepartmentCode?: string | null;
  livingSameAsRegister?: boolean;
  livingCity?:   string | null;
  livingStreet?: string | null;
  livingHouse?:  string | null;
  livingApt?:    string | null;
  email?:        string | null;
}

/* ══════════════════════════════════════════════════════════════
   TRUST LEVELS — единый источник правды (совпадает с LkClient)
   ══════════════════════════════════════════════════════════════ */
const TRUST_OPTIONS = [
  {
    label:   "Новичок",
    score:   0,
    color:   "#9CA3AF",
    icon:    "○",
    tooltip: "Базовый уровень после регистрации. Стандартные условия рассрочки.",
  },
  {
    label:   "Надёжный",
    score:   1,
    color:   "#10B981",
    icon:    "◆",
    tooltip: "1 закрытая рассрочка без просрочек. Скидка −0.2% на наценку.",
  },
  {
    label:   "Партнёр",
    score:   3,
    color:   "#3B82F6",
    icon:    "★",
    tooltip: "3 закрытых рассрочки. Лимит до 150 000 ₽ без поручителей. Скидка −0.5%.",
  },
  {
    label:   "Эталон",
    score:   5,
    color:   "#C8972B",
    icon:    "⬡",
    tooltip: "5+ закрытых рассрочек. Персональная скидка −1% на наценку.",
  },
] as const;

type TrustScore = (typeof TRUST_OPTIONS)[number]["score"];

/* ══════════════════════════════════════════════════════════════
   СПРАВОЧНИК ГОРОДОВ ЧЕЧНИ
   ══════════════════════════════════════════════════════════════ */
const CHECHEN_CITIES = [
  "Грозный", "Гудермес", "Аргун", "Шали", "Урус-Мартан",
  "Наур", "Ачхой-Мартан", "Курчалой", "Ножай-Юрт", "Серноводск",
  "Шелковская", "Знаменское", "Бамут", "Самашки", "Старопромысловский",
];

/* ══════════════════════════════════════════════════════════════
   SCHEDULE BUILDER
   ══════════════════════════════════════════════════════════════ */
interface PaymentRow {
  idx:    number;
  date:   string;
  amount: number;
  label:  string;
  paid:   boolean;
}

function buildSchedule(loan: LoanRecord): PaymentRow[] {
  if (!loan.startDate || loan.termMonths < 1) return [];
  const start   = new Date(loan.startDate);
  const monthly = loan.monthlyPayment;
  const term    = loan.termMonths;
  const downAmt = Math.max(0, loan.totalAmount - monthly * (term - 1));
  const today   = new Date(); today.setHours(0, 0, 0, 0);
  let acc       = 0;
  return Array.from({ length: term }, (_, i) => {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i);
    const isFirst = i === 0;
    const amount  = isFirst ? downAmt : monthly;
    acc += amount;
    return {
      idx:    i + 1,
      date:   d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }),
      amount,
      label:  isFirst ? "Взнос" : `Платёж ${i + 1}`,
      paid:   loan.paidAmount >= acc || d < today,
    };
  });
}

const fmt = (n: number) => n.toLocaleString("ru-RU");

/* ══════════════════════════════════════════════════════════════
   ROOT COMPONENT
   ══════════════════════════════════════════════════════════════ */
type AdminRole = "root" | "admin" | "moderator" | null;

export function AdminClient({ isAdmin, role }: { isAdmin: boolean; role?: AdminRole }) {
  const canManageStaff = role === "root" || role === "admin";
  const canDeleteRecords = role === "root" || role === "admin";
  const canDeleteUser    = role === "root";
  const router = useRouter();
  const [activeTab,    setActiveTab]    = useState<"applications" | "users" | "staff">("applications");
  const [applications, setApplications] = useState<Application[]>([]);
  const [users,        setUsers]        = useState<User[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [approveApp,   setApproveApp]   = useState<Application | null>(null);
  const [approving,    setApproving]    = useState(false);
  const [userModal,    setUserModal]    = useState<UserDetail | null>(null);

  useEffect(() => {
    if (!isAdmin) { router.push("/"); return; }
    loadData();
  }, [isAdmin, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appsRes, usersRes] = await Promise.all([
        fetch("/api/admin/applications"),
        fetch("/api/admin/users"),
      ]);
      if (appsRes.ok)  setApplications(await appsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
    } finally { setLoading(false); }
  };

  const handleOpenUserProfile = async (phone: string) => {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(phone)}`);
    if (res.ok) setUserModal(await res.json());
  };

  const handleSaveUser = async (phone: string, data: Partial<UserDetail>) => {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(phone)}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) { setUserModal(null); loadData(); }
  };

  const handleMarkPaid = async (phone: string, loanId: string, paymentIdx: number) => {
    const res = await fetch("/api/admin/loans/mark-paid", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, loanId, paymentIdx }),
    });
    if (res.ok) {
      const { paidAmount, status } = await res.json();
      setUserModal(prev => prev ? {
        ...prev,
        loans: prev.loans.map(l => l.id === loanId ? { ...l, paidAmount, status } : l),
      } : prev);
    }
  };

  const handleEditLoan = async (phone: string, loanId: string, patch: Partial<LoanRecord>) => {
    const res = await fetch("/api/admin/loans/edit", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, loanId, ...patch }),
    });
    if (res.ok) {
      const { loan } = await res.json();
      setUserModal(prev => prev ? {
        ...prev,
        loans: prev.loans.map(l => l.id === loanId ? loan : l),
      } : prev);
    }
  };

  const handleDeleteLoan = async (phone: string, loanId: string) => {
    if (!confirm("Удалить рассрочку? Это действие необратимо.")) return;
    const res = await fetch("/api/admin/loans/delete", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, loanId }),
    });
    if (res.ok) {
      setUserModal(prev => prev ? {
        ...prev,
        loans:      prev.loans.filter(l => l.id !== loanId),
        loansCount: Math.max(0, prev.loansCount - 1),
      } : prev);
    }
  };

  const handleDeleteUser = async (phone: string) => {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(phone)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({ error: "Ошибка" }));
      alert(d.error || "Не удалось удалить пользователя");
      return;
    }
    setUserModal(null);
    loadData();
  };

  const handleCreateLoan = async (phone: string, payload: Record<string, unknown>) => {
    const res = await fetch("/api/admin/loans/create", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, ...payload }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({ error: "Ошибка" }));
      throw new Error(d.error || "Не удалось создать");
    }
    const { loan } = await res.json();
    setUserModal(prev => prev ? {
      ...prev,
      loans:      [...prev.loans, loan as LoanRecord],
      loansCount: prev.loansCount + 1,
    } : prev);
  };

  const handleReject = async (appId: string) => {
    if (!confirm("Отклонить заявку?")) return;
    await fetch("/api/admin/reject-application", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appId }),
    });
    loadData();
  };

  const handleConfirmApprove = async (
    finalData: Partial<Application> & {
      costAmount?: number;
      markupAmount?: number;
      markupPct?: number;
      downAmount?: number;
      targetIrrAtCreation?: number;
    },
  ) => {
    if (!approveApp) return;
    setApproving(true);
    try {
      const res = await fetch("/api/admin/approve-application", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId: approveApp.id, phone: approveApp.phone, ...finalData }),
      });
      if (res.ok) {
        const phone = approveApp.phone;
        setApproveApp(null);
        loadData();
        /* Авто-переключение в карточку клиента для скачивания договора */
        await handleOpenUserProfile(phone);
      }
    } finally { setApproving(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
      <div className="text-white text-lg">Загрузка...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A1628]">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 border-b border-[#1A3C6E]/30 bg-[#0A1628]/95 backdrop-blur">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center flex-wrap gap-x-3">
              ФинНайс Admin
              {role && (
                <span className="text-[11px] font-bold uppercase px-2.5 py-1 rounded-md"
                      style={{
                        background: role === "root"  ? "#C8972B"
                                  : role === "admin" ? "#0C7A58"
                                  : "#1A3C6E",
                        color: "#fff",
                      }}>
                  {role}
                </span>
              )}
            </h1>
            <p className="text-xs text-[#9CA3AF] mt-1">
              {role === "moderator"
                ? "Управление заявками и клиентами"
                : "Управление заявками, клиентами и финансами"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Финансы и Портфель — только root + admin */}
            {(role === "root" || role === "admin") && (
              <>
                <button onClick={() => router.push("/admin/finance")}
                        className="px-4 py-2 text-sm font-semibold text-white rounded-full
                                   transition-opacity hover:opacity-90 flex items-center gap-1.5"
                        style={{ background: "linear-gradient(135deg, #0C7A58, #0a6449)" }}>
                  🧪 Симуляция
                </button>
                <button onClick={() => router.push("/admin/finance/portfolio")}
                        className="px-4 py-2 text-sm font-semibold text-white rounded-full
                                   transition-opacity hover:opacity-90 flex items-center gap-1.5"
                        style={{ background: "linear-gradient(135deg, #1A3C6E, #0E2344)" }}>
                  📊 Портфель
                </button>
              </>
            )}
            <button onClick={() => router.push("/lk")}
                    className="px-4 py-2 text-sm font-semibold text-white border border-[#1A3C6E] rounded-full
                               hover:bg-[#1A3C6E]/30 transition-colors">
              Кабинет
            </button>
            <button onClick={() => router.push("/")}
                    className="px-4 py-2 text-sm font-semibold text-[#0A1628] bg-white rounded-full
                               hover:bg-gray-100 transition-colors">
              На сайт
            </button>
          </div>
        </div>
        <div className="border-t border-[#1A3C6E]/30 px-6 flex gap-8">
          {(["applications", "users", ...(canManageStaff ? (["staff"] as const) : [])] as const).map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); loadData(); }}
                    className={`py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${
                      activeTab === tab
                        ? "border-[#C8972B] text-[#C8972B]"
                        : "border-transparent text-[#9CA3AF] hover:text-white"}`}>
              {tab === "applications"
                ? `Новые заявки (${applications.filter(a => a.status === "pending").length})`
                : tab === "users"
                  ? `Пользователи (${users.length})`
                  : "Сотрудники"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {activeTab === "applications" && (
          <ApplicationsTab apps={applications} onApprove={setApproveApp} onReject={handleReject} />
        )}
        {activeTab === "users" && (
          <UsersTab users={users} onOpenProfile={handleOpenUserProfile} onRefresh={loadData} />
        )}
        {activeTab === "staff" && canManageStaff && (
          <StaffTab currentRole={role} />
        )}
      </div>

      {/* Modals */}
      {userModal && (
        <UserProfileModal
          user={userModal}
          onSave={handleSaveUser}
          onClose={() => setUserModal(null)}
          onMarkPaid={handleMarkPaid}
          onEditLoan={handleEditLoan}
          onDeleteLoan={handleDeleteLoan}
          onCreateLoan={handleCreateLoan}
          canDeleteLoans={canDeleteRecords}
          canDeleteUser={canDeleteUser}
          onDeleteUser={handleDeleteUser}
        />
      )}
      {approveApp && (
        <ApproveModal app={approveApp}
                      onConfirm={handleConfirmApprove}
                      onOpenClientProfile={async (phone) => {
                        setApproveApp(null);
                        await handleOpenUserProfile(phone);
                      }}
                      onCancel={() => setApproveApp(null)} isLoading={approving} />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   APPLICATIONS TAB
   ══════════════════════════════════════════════════════════════ */
function ApplicationsTab({
  apps, onApprove, onReject,
}: {
  apps: Application[];
  onApprove: (app: Application) => void;
  onReject: (appId: string) => void;
}) {
  const pending = apps.filter(a => a.status === "pending");
  if (pending.length === 0) return (
    <div className="text-center py-12">
      <p className="text-[#9CA3AF] text-lg">Нет новых заявок</p>
    </div>
  );

  return (
    <div className="grid gap-4">
      {pending.map(app => (
        <div key={app.id}
             className="bg-[#1A3C6E]/20 border border-[#1A3C6E]/50 rounded-xl p-5
                        hover:border-[#C8972B]/50 transition-colors">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <Stat label="Имя"     value={app.name} />
            <Stat label="Телефон" value={formatPhone(app.phone) || app.phone} mono />
            <Stat
              label={app.items && app.items.length > 0 ? `Товаров: ${app.items.length}` : "Товар"}
              value={app.items && app.items.length > 0
                ? app.items.map(i => i.qty > 1 ? `${i.productName} × ${i.qty}` : i.productName).join("; ")
                : (app.product || "—")} />
            <Stat label="Сумма"   value={`${fmt(app.price)} ₽`} />
          </div>
          {app.items && app.items.length > 0 && (
            <div className="mb-4 -mt-2 px-3 py-2 rounded-lg bg-[#0A1628]/40 border border-[#1A3C6E]/40">
              <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF] mb-1.5">Состав заявки</p>
              <ul className="text-xs text-white/90 space-y-0.5">
                {app.items.map((it, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span className="truncate">
                      • {it.productName}{it.qty > 1 && ` × ${it.qty}`}
                    </span>
                    <span className="shrink-0 text-[#9CA3AF] tabular-nums">
                      cost {fmt(it.costAmount)} · total {fmt(it.totalAmount)} ₽
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <Stat label="Взнос"    value={`${fmt(app.down)} ₽`} />
            <Stat label="Платежей" value={pluralPayment(app.term)} />
            <Stat label="Платёж"   value={`${fmt(app.monthly)} ₽/мес.`} />
            <Stat label="Время"    value={new Date(app.createdAt).toLocaleString("ru-RU")} small />
          </div>
          <div className="flex gap-3">
            <button onClick={() => onApprove(app)}
                    className="flex-1 py-2 rounded-full bg-[#C8972B] text-[#0A1628] font-semibold text-sm
                               hover:bg-[#E8B84B] transition-colors active:scale-95">
              ✓ Одобрить
            </button>
            <button onClick={() => onReject(app.id)}
                    className="flex-1 py-2 rounded-full border border-red-500/50 text-red-400 font-semibold text-sm
                               hover:bg-red-500/10 transition-colors active:scale-95">
              ✕ Отклонить
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value, mono, small }: { label: string; value: string; mono?: boolean; small?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-[#9CA3AF] uppercase font-semibold mb-1">{label}</p>
      <p className={`text-white ${mono ? "font-mono text-sm" : "font-semibold"} ${small ? "text-xs" : ""}`}>{value}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   USERS TAB — поиск + ФИО + создание
   ══════════════════════════════════════════════════════════════ */
function UsersTab({
  users, onOpenProfile, onRefresh,
}: {
  users:         User[];
  onOpenProfile: (phone: string) => void;
  onRefresh:     () => void;
}) {
  const [query,       setQuery]       = useState("");
  const [showCreate,  setShowCreate]  = useState(false);
  const [createBusy,  setCreateBusy]  = useState(false);
  const [createForm,  setCreateForm]  = useState({
    phone: "", firstName: "", lastName: "", patronymic: "", birthDate: "",
  });
  const [createError, setCreateError] = useState("");

  const fullName = (u: User) =>
    [u.lastName, u.firstName, u.patronymic].filter(Boolean).join(" ");

  const q = query.toLowerCase().trim();
  const filtered = q
    ? users.filter(u =>
        u.phone.includes(q) || fullName(u).toLowerCase().includes(q)
      )
    : users;

  const handleCreate = async () => {
    setCreateBusy(true); setCreateError("");
    try {
      const res = await fetch("/api/admin/users/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (res.ok) {
        setShowCreate(false);
        setCreateForm({ phone: "", firstName: "", lastName: "", patronymic: "", birthDate: "" });
        onRefresh();
      } else {
        setCreateError(data.error ?? "Ошибка при создании");
      }
    } finally { setCreateBusy(false); }
  };

  return (
    <div>
      {/* ── Панель управления ─────────────────────────────── */}
      <div className="flex gap-3 mb-4">
        {/* Поиск */}
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-sm select-none">🔍</span>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Поиск по ФИО или телефону..."
            className="w-full pl-9 pr-4 py-2 rounded-full bg-[#1A3C6E]/30 border border-[#1A3C6E]/50
                       text-white text-sm placeholder:text-[#9CA3AF]/60 outline-none
                       focus:border-[#C8972B]/60 transition-colors"
          />
        </div>
        {/* Кнопка создания */}
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#C8972B] text-[#0A1628]
                     font-semibold text-sm hover:bg-[#E8B84B] transition-colors active:scale-95 shrink-0"
        >
          + Новый пользователь
        </button>
      </div>

      {/* ── Список ────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[#9CA3AF] text-lg">
            {q ? `Ничего не найдено по «${q}»` : "Нет пользователей"}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(user => {
            const name = fullName(user);
            return (
              <div key={user.phone}
                   className="bg-[#1A3C6E]/20 border border-[#1A3C6E]/50 rounded-lg p-4
                              flex items-center justify-between hover:border-[#C8972B]/40 transition-colors">
                <div>
                  <p className="text-white font-semibold text-sm">
                    {name || <span className="text-[#9CA3AF]/60 font-normal italic">Имя не указано</span>}
                  </p>
                  <p className="text-[#9CA3AF] font-mono text-xs mt-0.5">
                    {formatPhone(user.phone) || user.phone}
                  </p>
                  <p className="text-xs text-[#9CA3AF] mt-1">
                    Рассрочек: {user.loansCount} · Присоединился:{" "}
                    {new Date(user.createdAt).toLocaleDateString("ru-RU")}
                  </p>
                </div>
                <button onClick={() => onOpenProfile(user.phone)}
                        className="px-4 py-2 text-sm font-semibold text-white bg-[#1A3C6E]/60 rounded-full
                                   hover:bg-[#C8972B] hover:text-[#0A1628] transition-colors active:scale-95 shrink-0">
                  Профиль →
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Модалка создания ─────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
             onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="w-full max-w-md bg-[#0E2344] rounded-2xl shadow-2xl border border-[#1A3C6E]/60 p-6">
            <h2 className="text-lg font-bold text-white mb-5">Новый пользователь</h2>
            <div className="space-y-3 mb-5">
              <FieldRow label="Телефон *" placeholder="+79001234567" value={createForm.phone}
                        onChange={v => setCreateForm(f => ({ ...f, phone: v }))} />
              <div className="grid grid-cols-3 gap-2">
                <FieldRow placeholder="Фамилия"  value={createForm.lastName}
                          onChange={v => setCreateForm(f => ({ ...f, lastName: v }))} />
                <FieldRow placeholder="Имя"      value={createForm.firstName}
                          onChange={v => setCreateForm(f => ({ ...f, firstName: v }))} />
                <FieldRow placeholder="Отчество" value={createForm.patronymic}
                          onChange={v => setCreateForm(f => ({ ...f, patronymic: v }))} />
              </div>
              <FieldRow label="Дата рождения" type="date" value={createForm.birthDate}
                        onChange={v => setCreateForm(f => ({ ...f, birthDate: v }))} />
              {createError && (
                <p className="text-red-400 text-xs">{createError}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCreate(false)}
                      className="flex-1 py-2 rounded-full border border-[#9CA3AF]/30 text-white
                                 font-semibold text-sm hover:bg-[#1A3C6E]/40 transition-colors">
                Отмена
              </button>
              <button onClick={handleCreate} disabled={createBusy || !createForm.phone.trim()}
                      className="flex-1 py-2 rounded-full bg-[#C8972B] text-[#0A1628] font-bold text-sm
                                 hover:bg-[#E8B84B] transition-colors disabled:opacity-60 active:scale-95">
                {createBusy ? "Создаю..." : "Создать"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   APPROVE MODAL
   ══════════════════════════════════════════════════════════════ */
function ApproveModal({ app, onConfirm, onCancel, isLoading, onOpenClientProfile }: {
  app: Application;
  onConfirm: (data: Partial<Application> & {
    costAmount: number; markupAmount: number; markupPct: number;
    downAmount: number; targetIrrAtCreation: number;
  }) => void;
  onCancel: () => void;
  isLoading: boolean;
  onOpenClientProfile: (phone: string) => void;
}) {
  /* ── Финансовая политика ─────────────────────────────── */
  const [inflation, setInflation] = useState(0.12);

  useEffect(() => {
    fetch("/api/admin/finance-config")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (typeof d?.expectedInflationAnnual === "number") setInflation(d.expectedInflationAnnual); })
      .catch(() => {});
  }, []);

  /* ── Профиль клиента — для проверки заполненности ────── */
  const [clientProfile, setClientProfile] = useState<Record<string, unknown> | null>(null);
  const [hasPassportDocApp, setHasPassportDocApp] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  useEffect(() => {
    setProfileLoading(true);
    Promise.all([
      fetch(`/api/admin/users/${encodeURIComponent(app.phone)}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`/api/admin/passport-doc/${encodeURIComponent(app.phone)}`).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([profile, doc]) => {
      setClientProfile(profile);
      setHasPassportDocApp(Boolean(doc?.exists));
    }).finally(() => setProfileLoading(false));
  }, [app.phone]);
  const profileCompletion = computeProfileCompletion(
    { ...(clientProfile ?? {}), _passportDocUploaded: hasPassportDocApp },
    { requirePassportScan: true },
  );

  /* ── Входные данные (то, что админ видит/правит) ─────── */
  const isMulti = Array.isArray(app.items) && app.items.length > 0;
  const itemsLabel = isMulti
    ? app.items!.map(i => i.qty > 1 ? `${i.productName} × ${i.qty}` : i.productName).join("; ")
    : app.product;
  const [product, setProduct] = useState(itemsLabel);
  /* Стоимость у партнёра — для multi-заявки сумма costAmount по всем items;
     для одиночной — приоритет iso-IRR meta, иначе price / 1.25 */
  const defaultCost = isMulti
    ? Math.round(app.items!.reduce((s, i) => s + i.costAmount, 0))
    : (app.costAmount && app.costAmount > 0
        ? app.costAmount
        : Math.round(app.price / 1.25));
  const [cost, setCost]   = useState<number>(defaultCost);
  const [term, setTerm]   = useState<number>(app.term);
  /* Взнос как доля от cost */
  const initialDownPct = defaultCost > 0
    ? Math.max(0, Math.min(0.5, app.down / defaultCost))
    : 0.25;
  const [downPct, setDownPct] = useState<number>(initialDownPct);

  /* ── Вычисляемое ─────────────────────────────────────── */
  const suggestedMarkup = markupRounded(term, downPct, inflation);
  const [useOverride, setUseOverride] = useState(false);
  const [overrideMarkup, setOverrideMarkup] = useState(suggestedMarkup);
  const markupPct = useOverride ? overrideMarkup : suggestedMarkup;

  const markupAmount  = cost * markupPct;
  const totalPrice    = cost + markupAmount;
  const downAmount    = cost * downPct;
  const remainingPay  = totalPrice - downAmount;
  const monthlyPayment = remainingPay / term;
  const capitalT0     = cost - downAmount;

  /* Фактический IRR этой сделки */
  const flows: number[] = [-capitalT0];
  for (let i = 0; i < term; i++) flows.push(monthlyPayment);
  const irrM    = irrMonthly(flows);
  const irrYear = isFinite(irrM) ? annualFromMonthly(irrM) : NaN;

  const targetIrr = baselineIrrAnnual();   /* эталон не зависит от инфляции при ≤6мес */
  const irrDelta  = isFinite(irrYear) ? irrYear - targetIrr : NaN;

  const fmtR = (n: number) => Math.round(n).toLocaleString("ru-RU");
  const fmtP = (n: number, d = 1) => (isFinite(n) ? (n * 100).toFixed(d) + "%" : "—");
  const fmtPInt = (n: number) => (isFinite(n) ? Math.round(n * 100) + "%" : "—");

  const handleSubmit = () => {
    onConfirm({
      product,
      price:   Math.round(totalPrice),
      down:    Math.round(downAmount),
      term,
      monthly: Math.round(monthlyPayment),
      costAmount:          Math.round(cost),
      markupAmount:        Math.round(markupAmount),
      markupPct,
      downAmount:          Math.round(downAmount),
      targetIrrAtCreation: targetIrr,
      /* Передаём состав заявки целиком — это будет частью loanRecord */
      ...(isMulti ? { items: app.items } : {}),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-3xl bg-[#1A3C6E] rounded-2xl shadow-2xl p-6 border border-[#C8972B]/30 my-8">
        <h2 className="text-xl font-bold text-white mb-1">Подтверждение одобрения</h2>
        <p className="text-xs text-white/60 mb-3">
          Клиент: <b>{app.name}</b> · {formatPhone(app.phone) || app.phone}
        </p>

        {isMulti && (
          <div className="mb-4 px-3 py-2.5 rounded-lg bg-[#0A1628]/60 border border-[#1A3C6E]/60">
            <p className="text-[10px] uppercase tracking-wider text-[#C8972B] mb-1.5">
              Состав заявки — {app.items!.length} {app.items!.length === 1 ? "товар" : "товаров"}
              <span className="text-white/40 normal-case ml-2">
                (всё оформляется одним договором)
              </span>
            </p>
            <ul className="text-xs text-white/90 space-y-0.5">
              {app.items!.map((it, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span className="truncate">• {it.productName}{it.qty > 1 && ` × ${it.qty}`}</span>
                  <span className="shrink-0 text-white/50 tabular-nums">
                    cost {fmt(it.costAmount)} · total {fmt(it.totalAmount)} ₽
                  </span>
                </li>
              ))}
              <li className="flex justify-between gap-3 pt-1.5 mt-1.5 border-t border-white/10 font-bold text-[#C8972B]">
                <span>Итого cost</span>
                <span className="tabular-nums">{fmt(defaultCost)} ₽</span>
              </li>
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* ── Левая часть: входные данные ──────────────── */}
          <div className="space-y-3">
            <h3 className="text-[10px] uppercase font-bold tracking-wider text-[#C8972B]">Параметры сделки</h3>

            <FieldRow label="Товар" value={product} onChange={setProduct} />

            <FieldRow label="Стоимость у партнёра (cost), ₽"
              type="number" value={String(cost)}
              onChange={v => setCost(Math.max(0, Number(v)))} />

            <div>
              <label className="text-[10px] uppercase text-white/60 font-semibold mb-1 block">
                Срок: <span className="text-white font-bold">{term} мес</span>
              </label>
              <input type="range" min={3} max={24} step={1} value={term}
                onChange={e => setTerm(Number(e.target.value))} className="w-full" />
            </div>

            <div>
              <label className="text-[10px] uppercase text-white/60 font-semibold mb-1 block">
                Взнос: <span className="text-white font-bold">{fmtPInt(downPct)}</span>
                <span className="text-white/40 ml-2">= {fmtR(downAmount)} ₽</span>
              </label>
              <input type="range" min={0} max={0.5} step={0.05} value={downPct}
                onChange={e => setDownPct(Number(e.target.value))} className="w-full" />
            </div>

            {/* Override наценки */}
            <div className="rounded-lg p-3 border border-[#C8972B]/30 bg-[#0A1628]/40">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={useOverride}
                  onChange={e => setUseOverride(e.target.checked)}
                  className="w-4 h-4 accent-[#C8972B]" />
                <span className="text-xs font-bold text-white">Override наценки</span>
              </label>
              {useOverride && (
                <div className="mt-2">
                  <input type="number" step={1} min={0} max={500}
                    value={Math.round(overrideMarkup * 100)}
                    onChange={e => setOverrideMarkup(Number(e.target.value) / 100)}
                    className="w-full px-2 py-1.5 rounded bg-[#0A1628] text-white text-sm border border-[#C8972B]/40 outline-none focus:border-[#C8972B]" />
                  <p className="text-[10px] text-white/50 mt-1">% от cost</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Правая часть: финансовый расчёт ───────────── */}
          <div className="space-y-3">
            <h3 className="text-[10px] uppercase font-bold tracking-wider text-[#0C7A58]">Финансовый расчёт</h3>

            {/* iso-IRR policy */}
            <div className="rounded-lg p-3 bg-[#0A1628]/60 border border-[#0C7A58]/30">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-[9px] uppercase text-white/50">Реком. наценка</div>
                  <div className="text-white font-bold">{fmtPInt(suggestedMarkup)}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase text-white/50">Применяется</div>
                  <div className="font-bold" style={{ color: useOverride ? "#FCD34D" : "#fff" }}>
                    {fmtPInt(markupPct)} {useOverride && <span className="text-[9px]">(override)</span>}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase text-white/50">Целевой IRR</div>
                  <div className="text-white font-bold">{fmtP(targetIrr, 0)}/год</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase text-white/50">Факт. IRR</div>
                  <div className="font-bold"
                       style={{ color: !isFinite(irrYear) ? "#9CA3AF" :
                                       Math.abs(irrDelta) < 0.05 ? "#86EFAC" :
                                       irrDelta > 0 ? "#86EFAC" : "#FCA5A5" }}>
                    {fmtP(irrYear, 0)}/год
                  </div>
                </div>
              </div>
              {isFinite(irrDelta) && (
                <div className="mt-2 pt-2 border-t border-white/10">
                  <span className="text-[10px] text-white/50">Δ vs target: </span>
                  <span className="text-xs font-bold"
                        style={{ color: Math.abs(irrDelta) < 0.05 ? "#86EFAC" :
                                        irrDelta > 0 ? "#86EFAC" : "#FCA5A5" }}>
                    {irrDelta >= 0 ? "+" : ""}{(irrDelta * 100).toFixed(1)} пп
                  </span>
                </div>
              )}
            </div>

            {/* Cash split */}
            <div className="rounded-lg p-3 bg-[#0A1628]/60 border border-white/10 space-y-1.5 text-xs">
              <Row2 k="Cost (партнёру)" v={fmtR(cost) + " ₽"} />
              <Row2 k="+ Наценка" v={fmtR(markupAmount) + " ₽"} accent="green" />
              <div className="border-t border-white/10 pt-1.5">
                <Row2 k="= Итого клиенту" v={fmtR(totalPrice) + " ₽"} bold />
              </div>
              <div className="border-t border-white/10 pt-1.5">
                <Row2 k="− Взнос клиента" v={fmtR(downAmount) + " ₽"} />
                <Row2 k="= Остаток в рассрочку" v={fmtR(remainingPay) + " ₽"} />
                <Row2 k={`÷ ${term} = платёж/мес`} v={fmtR(monthlyPayment) + " ₽"} bold />
              </div>
              <div className="border-t border-white/10 pt-1.5">
                <Row2 k="Наш капитал T0" v={fmtR(capitalT0) + " ₽"} accent="orange" />
                <Row2 k="Прибыль сделки" v={fmtR(markupAmount) + " ₽"} accent="green" />
              </div>
            </div>

            {!useOverride && Math.abs(suggestedMarkup - markupPct) < 1e-6 && (
              <p className="text-[10px] text-[#86EFAC] italic">
                ✓ Цена соответствует iso-IRR политике
              </p>
            )}
            {useOverride && (
              <p className="text-[10px] text-[#FCD34D] italic">
                ⚠ Наценка переопределена вручную. Сделка отклоняется от целевой IRR.
              </p>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} disabled={isLoading}
            className="flex-1 py-2.5 rounded-full border border-white/20 text-white font-semibold
                       hover:bg-white/10 transition-colors disabled:opacity-60">
            Отмена
          </button>
          <button onClick={handleSubmit}
                  disabled={isLoading || cost <= 0 || !profileCompletion.isComplete || profileLoading}
                  title={!profileCompletion.isComplete
                    ? `Профиль клиента заполнен на ${profileCompletion.percent}%. Заполните недостающие поля в карточке клиента, чтобы одобрить рассрочку.`
                    : ""}
            className="flex-1 py-2.5 rounded-full bg-[#C8972B] text-[#0A1628] font-bold
                       hover:bg-[#E8B84B] transition-colors disabled:opacity-60 active:scale-95">
            {isLoading ? "Сохраняю..."
              : profileLoading ? "Проверка профиля..."
              : !profileCompletion.isComplete ? `Профиль ${profileCompletion.percent}% — заполните данные`
              : `Одобрить · клиент платит ${fmtR(totalPrice)} ₽`}
          </button>
        </div>

        {!profileCompletion.isComplete && !profileLoading && (
          <div className="mt-3 p-3 rounded-xl bg-red-900/20 border border-red-500/40 text-xs text-red-200 leading-snug">
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <div>
                <b>Профиль заполнен на {profileCompletion.percent}%</b>{" "}
                ({profileCompletion.filled} из {profileCompletion.total}).
                Не хватает:{" "}
                {Object.entries(profileCompletion.missingByGroup)
                  .map(([g, fs]) => `${g} (${fs.map(f => f.label.toLowerCase()).join(", ")})`)
                  .join("; ")}.
              </div>
              <button
                onClick={() => onOpenClientProfile(app.phone)}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold bg-[#C8972B] text-[#0A1628] hover:bg-[#E8B84B] transition-colors active:scale-95"
              >
                Открыть карточку →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row2({ k, v, accent, bold }: { k: string; v: string; accent?: "green" | "orange"; bold?: boolean }) {
  const color = accent === "green" ? "#86EFAC" : accent === "orange" ? "#FCD34D" : "#fff";
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/60">{k}</span>
      <span className={`font-mono tabular-nums ${bold ? "font-bold text-sm" : ""}`} style={{ color }}>
        {v}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TRUST LEVEL SIDEBAR  — вертикальный стек с тултипами
   ══════════════════════════════════════════════════════════════ */
function TrustLevelSidebar({
  current,
  onChange,
}: {
  current: number;
  onChange: (score: number) => void;
}) {
  const [tip, setTip] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1">
        Индекс доверия
      </p>

      {TRUST_OPTIONS.map((opt, idx) => {
        const isActive = current === opt.score;
        const isPrev   = current > opt.score;  // уже пройден

        return (
          <div key={opt.score} className="relative">
            {/* Вертикальный коннектор */}
            {idx < TRUST_OPTIONS.length - 1 && (
              <div
                className="absolute left-[11px] top-full w-[2px] h-1.5 -translate-x-1/2 z-0"
                style={{ background: isPrev ? opt.color + "80" : "#1A3C6E50" }}
              />
            )}

            <button
              onClick={() => onChange(opt.score)}
              onMouseEnter={() => setTip(idx)}
              onMouseLeave={() => setTip(null)}
              className="relative z-10 w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg
                         border text-left transition-all duration-200 group"
              style={{
                borderColor: isActive ? opt.color : isPrev ? opt.color + "40" : "#1A3C6E40",
                background:  isActive ? opt.color + "18" : "transparent",
              }}
            >
              {/* Иконка / индикатор */}
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0
                           transition-all duration-200"
                style={{
                  background: isActive ? opt.color : isPrev ? opt.color + "30" : "#1A3C6E30",
                  color:      isActive ? "#fff"    : isPrev ? opt.color         : "#9CA3AF",
                  boxShadow:  isActive ? `0 0 8px ${opt.color}60` : "none",
                }}
              >
                {isActive ? "✓" : opt.icon}
              </span>

              <span
                className="text-[11px] font-bold leading-none"
                style={{ color: isActive ? opt.color : isPrev ? opt.color + "cc" : "#9CA3AF80" }}
              >
                {opt.label}
              </span>

              {isActive && (
                <span
                  className="ml-auto text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0"
                  style={{ background: opt.color + "25", color: opt.color }}
                >
                  ●
                </span>
              )}
            </button>

            {/* Тултип */}
            {tip === idx && (
              <div
                className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 w-52
                           rounded-xl px-3 py-2.5 text-[11px] leading-relaxed shadow-2xl pointer-events-none"
                style={{
                  background:   "#0A1628",
                  border:       `1px solid ${opt.color}40`,
                  color:        "#CBD5E1",
                  boxShadow:    `0 0 20px ${opt.color}20`,
                }}
              >
                <p className="font-bold mb-1" style={{ color: opt.color }}>{opt.label}</p>
                {opt.tooltip}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ADMIN CREATE LOAN FORM — ручное добавление рассрочки клиенту
   ══════════════════════════════════════════════════════════════ */
function AdminCreateLoanForm({
  onCancel, onCreate,
}: {
  onCancel: () => void;
  onCreate: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [product,  setProduct]  = useState("");
  const [price,    setPrice]    = useState(30_000);
  const [down,     setDown]     = useState(0);
  const [term,     setTerm]     = useState(6);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [notify,   setNotify]   = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  /* Авторасчёт по той же логике, что и публичный калькулятор */
  const calc = calcInstallment({ price, down, term });
  const monthly = calc.monthly;
  const markup  = calc.markup;
  const total   = calc.total;

  const fmt = (n: number) => n.toLocaleString("ru-RU");

  const canSubmit = product.trim().length > 0 && price > 0 && term >= 1 && monthly > 0 && !saving;

  const handleSubmit = async () => {
    setError(null);
    setSaving(true);
    try {
      await onCreate({
        product:      product.trim(),
        price:        total,           // полная сумма к выплате клиентом
        term,
        monthly,
        downAmount:   down,
        costAmount:   price,           // что отдали поставщику (цена товара)
        markupAmount: markup,
        markupPct:    price > 0 ? markup / price : 0,
        startDate,
        notify,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка создания");
      setSaving(false);
    }
  };

  return (
    <div className="mb-3 bg-[#0A1628] border border-[#C8972B]/40 rounded-xl p-4 space-y-3">
      <h4 className="text-xs font-bold text-[#C8972B] uppercase tracking-wider">
        + Создать рассрочку
      </h4>

      <div>
        <p className="text-[10px] text-[#9CA3AF] mb-1 uppercase tracking-wider">Товар *</p>
        <input
          value={product}
          onChange={e => setProduct(e.target.value)}
          placeholder="iPhone 16 Pro 256GB"
          className="w-full px-2.5 py-2 rounded-lg bg-[#0E2344] text-white text-sm
                     border border-[#1A3C6E] focus:border-[#C8972B] outline-none transition-colors
                     placeholder:text-[#9CA3AF]/40" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div>
          <p className="text-[10px] text-[#9CA3AF] mb-1 uppercase tracking-wider">Цена (₽)</p>
          <input type="number" value={price}
                 onChange={e => setPrice(Math.max(0, Number(e.target.value) || 0))}
                 className="w-full px-2.5 py-2 rounded-lg bg-[#0E2344] text-white text-sm
                            border border-[#1A3C6E] focus:border-[#C8972B] outline-none" />
        </div>
        <div>
          <p className="text-[10px] text-[#9CA3AF] mb-1 uppercase tracking-wider">Взнос (₽)</p>
          <input type="number" value={down}
                 onChange={e => setDown(Math.max(0, Number(e.target.value) || 0))}
                 className="w-full px-2.5 py-2 rounded-lg bg-[#0E2344] text-white text-sm
                            border border-[#1A3C6E] focus:border-[#C8972B] outline-none" />
        </div>
        <div>
          <p className="text-[10px] text-[#9CA3AF] mb-1 uppercase tracking-wider">Срок (мес)</p>
          <input type="number" value={term} min={1} max={24}
                 onChange={e => setTerm(Math.max(1, Number(e.target.value) || 1))}
                 className="w-full px-2.5 py-2 rounded-lg bg-[#0E2344] text-white text-sm
                            border border-[#1A3C6E] focus:border-[#C8972B] outline-none" />
        </div>
        <div>
          <p className="text-[10px] text-[#9CA3AF] mb-1 uppercase tracking-wider">Дата начала</p>
          <input type="date" value={startDate}
                 onChange={e => setStartDate(e.target.value)}
                 className="w-full px-2.5 py-2 rounded-lg bg-[#0E2344] text-white text-sm
                            border border-[#1A3C6E] focus:border-[#C8972B] outline-none" />
        </div>
      </div>

      {/* Превью расчёта */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-[#1A3C6E]/20 rounded-lg p-2.5">
        <CalcPreview label="Платёж/мес" value={fmt(monthly) + " ₽"} accent />
        <CalcPreview label="Наценка"     value={fmt(markup) + " ₽"} />
        <CalcPreview label="К возврату"  value={fmt(total) + " ₽"} />
        <CalcPreview label="Ставка"      value={(calc.rate * 100).toFixed(2) + "%/мес"} />
      </div>

      <label className="inline-flex items-center gap-2 text-[11px] text-[#9CA3AF] cursor-pointer">
        <input type="checkbox" checked={notify} onChange={e => setNotify(e.target.checked)}
               className="accent-[#C8972B]" />
        Отправить уведомление клиенту в Telegram
      </label>

      {error && (
        <div className="text-xs text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2">
          ⚠ {error}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} disabled={saving}
                className="flex-1 py-2 rounded-full border border-[#9CA3AF]/30 text-white
                           font-semibold text-xs hover:bg-[#1A3C6E]/40 transition-colors disabled:opacity-50">
          Отмена
        </button>
        <button onClick={handleSubmit} disabled={!canSubmit}
                className="flex-1 py-2 rounded-full font-bold text-xs transition-colors active:scale-95
                           disabled:opacity-40 bg-[#C8972B] text-[#0A1628] hover:bg-[#E8B84B]">
          {saving ? "Создаю..." : "Создать рассрочку"}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ADMIN PASSPORT DOC UPLOADER
   ══════════════════════════════════════════════════════════════ */
function AdminPassportDocUploader({
  phone, onChange,
}: {
  phone: string;
  onChange: (hasDoc: boolean) => void;
}) {
  const [meta, setMeta] = useState<{ mime: string; filename: string; uploadedAt: string; size: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const url = `/api/admin/passport-doc/${encodeURIComponent(phone)}`;

  const fetchMeta = useCallback(async () => {
    try {
      const r = await fetch(url, { cache: "no-store" });
      const d = await r.json();
      if (d?.exists) { setMeta(d); onChange(true); }
      else { setMeta(null); onChange(false); }
    } catch {}
  }, [url, onChange]);
  useEffect(() => { fetchMeta(); }, [fetchMeta]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch(url, { method: "PUT", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Ошибка загрузки");
      setMeta(d);
      onChange(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (!confirm("Удалить загруженный скан паспорта?")) return;
    setBusy(true);
    try {
      await fetch(url, { method: "DELETE" });
      setMeta(null);
      onChange(false);
    } finally { setBusy(false); }
  };

  const dlUrl = `/api/lk/passport-doc/file?phone=${encodeURIComponent(phone)}`;
  const sizeKb = meta ? (meta.size / 1024).toFixed(1) : "";
  const uploadedStr = meta
    ? new Date(meta.uploadedAt).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className="mt-3 pt-3 border-t border-[#1A3C6E]/40">
      <p className="text-[10px] text-[#9CA3AF] font-semibold uppercase tracking-wider mb-1.5">
        Скан/фото паспорта <span className="text-red-400">*</span>
        <span className="text-[#9CA3AF]/60 normal-case ml-1">(обязательно для одобрения)</span>
      </p>

      {meta ? (
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#0A1628] border border-[#1A3C6E]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg">{meta.mime === "application/pdf" ? "📄" : "🖼"}</span>
            <div className="min-w-0">
              <p className="text-xs text-white truncate font-semibold">{meta.filename}</p>
              <p className="text-[10px] text-[#9CA3AF]">{sizeKb} КБ · {uploadedStr}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <a href={dlUrl} target="_blank" rel="noopener"
               className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#C8972B] text-[#0A1628] hover:bg-[#E8B84B]">
              Открыть
            </a>
            <button onClick={() => inputRef.current?.click()} disabled={busy}
                    className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#1A3C6E]/60 text-white hover:bg-[#1A3C6E] disabled:opacity-50">
              Заменить
            </button>
            <button onClick={handleDelete} disabled={busy}
                    className="w-5 h-5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50">
              ×
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()} disabled={busy}
                className="w-full p-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 border border-dashed border-[#C8972B]/40 text-[#C8972B] hover:bg-[#C8972B]/10">
          {busy ? "Загружаю..." : "📎 Загрузить (PDF / JPG / PNG, до 5 МБ)"}
        </button>
      )}
      <input ref={inputRef} type="file" hidden
             accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp,image/heic"
             onChange={handleFile} />
      {err && <p className="text-[11px] text-red-400 mt-1.5">⚠ {err}</p>}
    </div>
  );
}

function CalcPreview({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[9px] text-[#9CA3AF]/70 uppercase">{label}</p>
      <p className={`text-[12px] font-bold mt-0.5 ${accent ? "text-[#C8972B]" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ADMIN LOAN CARD  — с редактированием и удалением
   ══════════════════════════════════════════════════════════════ */
function AdminLoanCard({
  loan, phone, onMarkPaid, onEdit, onDelete, canDelete,
}: {
  loan:       LoanRecord;
  phone:      string;
  onMarkPaid: (phone: string, loanId: string, idx: number) => Promise<void>;
  onEdit:     (phone: string, loanId: string, patch: Partial<LoanRecord>) => Promise<void>;
  onDelete:   (phone: string, loanId: string) => Promise<void>;
  canDelete:  boolean;
}) {
  const [open,    setOpen]    = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy,    setBusy]    = useState<number | null>(null);   // idx платежа
  const [editF,   setEditF]   = useState({
    product:        loan.product,
    totalAmount:    loan.totalAmount,
    monthlyPayment: loan.monthlyPayment,
    termMonths:     loan.termMonths,
    startDate:      loan.startDate,
  });
  const [saving, setSaving] = useState(false);

  const schedule  = buildSchedule(loan);
  const pct       = loan.totalAmount > 0 ? Math.round((loan.paidAmount / loan.totalAmount) * 100) : 0;
  const remaining = Math.max(0, loan.totalAmount - loan.paidAmount);

  const handlePay = async (idx: number) => {
    setBusy(idx);
    await onMarkPaid(phone, loan.id, idx);
    setBusy(null);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    await onEdit(phone, loan.id, editF);
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="bg-[#0A1628] border border-[#1A3C6E]/60 rounded-xl overflow-hidden">
      {/* ── Шапка карточки ───────────────────────────────────── */}
      <div className="p-3">
        {editing ? (
          /* ── Форма редактирования ──────────────────────────── */
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#C8972B] mb-2">
              Редактирование рассрочки
            </p>
            <FieldRow label="Товар" value={editF.product}
                      onChange={v => setEditF(f => ({ ...f, product: v }))} />
            <div className="grid grid-cols-2 gap-2">
              <FieldRow label="Сумма" type="number" value={String(editF.totalAmount)}
                        onChange={v => setEditF(f => ({ ...f, totalAmount: Number(v) }))} />
              <FieldRow label="Платёж/мес." type="number" value={String(editF.monthlyPayment)}
                        onChange={v => setEditF(f => ({ ...f, monthlyPayment: Number(v) }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <FieldRow label="Кол-во платежей" type="number" value={String(editF.termMonths)}
                        onChange={v => setEditF(f => ({ ...f, termMonths: Number(v) }))} />
              <FieldRow label="Дата начала" type="date" value={editF.startDate}
                        onChange={v => setEditF(f => ({ ...f, startDate: v }))} />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setEditing(false)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-[#9CA3AF]
                                 border border-[#1A3C6E]/50 hover:border-[#9CA3AF]/40 transition-colors">
                Отмена
              </button>
              <button onClick={handleSaveEdit} disabled={saving}
                      className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-[#C8972B] text-[#0A1628]
                                 hover:bg-[#E8B84B] transition-colors disabled:opacity-60">
                {saving ? "Сохраняю..." : "Сохранить"}
              </button>
            </div>
          </div>
        ) : (
          /* ── Отображение карточки ──────────────────────────── */
          <>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm truncate">{loan.product}</p>
                <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                  {loan.startDate} · {pluralPayment(loan.termMonths)}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  loan.status === "completed"
                    ? "bg-green-500/15 text-green-400"
                    : "bg-[#C8972B]/15 text-[#C8972B]"}`}>
                  {loan.status === "completed" ? "✓ Закрыта" : "Активна"}
                </span>
                {/* Кнопки управления */}
                <a
                  href={`/api/lk/contract/${loan.id}?phone=${encodeURIComponent(phone)}`}
                  title="Скачать договор"
                  className="w-6 h-6 rounded-md flex items-center justify-center text-[#9CA3AF]
                             hover:bg-[#C8972B]/20 hover:text-[#C8972B] transition-colors text-xs"
                >
                  📄
                </a>
                <button
                  onClick={() => { setEditing(true); setOpen(false); }}
                  title="Редактировать"
                  className="w-6 h-6 rounded-md flex items-center justify-center text-[#9CA3AF]
                             hover:bg-[#1A3C6E] hover:text-white transition-colors text-xs"
                >
                  ✏️
                </button>
                {canDelete && (
                  <button
                    onClick={() => onDelete(phone, loan.id)}
                    title="Удалить рассрочку"
                    className="w-6 h-6 rounded-md flex items-center justify-center text-[#9CA3AF]
                               hover:bg-red-500/20 hover:text-red-400 transition-colors text-xs"
                  >
                    🗑
                  </button>
                )}
              </div>
            </div>

            {/* Суммы */}
            <div className="flex gap-3 text-xs mb-1.5">
              <span className="text-[#9CA3AF]">Выплачено: <strong className="text-white">{fmt(loan.paidAmount)} ₽</strong></span>
              <span className="text-[#9CA3AF]">Осталось: <strong className="text-[#C8972B]">{fmt(remaining)} ₽</strong></span>
              <span className="text-[#9CA3AF]">Итого: <strong className="text-white">{fmt(loan.totalAmount)} ₽</strong></span>
            </div>

            {/* Прогресс-бар */}
            <div className="w-full h-1.5 rounded-full bg-[#1A3C6E]/50 overflow-hidden mb-2">
              <div className="h-full rounded-full transition-all duration-500"
                   style={{
                     width: `${Math.min(100, pct)}%`,
                     background: pct >= 100
                       ? "linear-gradient(90deg,#10B981,#34d399)"
                       : "linear-gradient(90deg,#C8972B,#E8B84B)",
                   }} />
            </div>

            {/* Кнопка графика */}
            {schedule.length > 0 && (
              <button onClick={() => setOpen(v => !v)}
                      className="text-[11px] font-semibold text-[#C8972B] hover:text-[#E8B84B] transition-colors">
                {open ? "▲ Скрыть график" : "▼ Показать график платежей"}
              </button>
            )}
          </>
        )}
      </div>

      {/* ── График платежей ──────────────────────────────────── */}
      {open && !editing && (
        <div className="border-t border-[#1A3C6E]/40">
          {/* Шапка */}
          <div className="grid grid-cols-[2rem_1fr_5rem_6rem_5.5rem] gap-x-2 px-3 py-1.5
                          bg-[#1A3C6E]/20 text-[10px] font-bold uppercase tracking-wide text-[#9CA3AF]">
            <span>№</span><span>Дата</span>
            <span className="text-right">Сумма</span>
            <span className="text-right">Статус</span>
            <span />
          </div>

          {schedule.map(row => (
            <div key={row.idx}
                 className={`grid grid-cols-[2rem_1fr_5rem_6rem_5.5rem] gap-x-2 px-3 py-1.5 text-xs
                             border-t border-[#1A3C6E]/20 ${row.paid ? "bg-green-500/5" : ""}`}>
              <span className="text-[#9CA3AF] font-bold self-center">{row.idx}</span>
              <div className="self-center">
                <p className="text-white font-medium">{row.label}</p>
                <p className="text-[#9CA3AF] text-[10px]">{row.date}</p>
              </div>
              <span className="text-right self-center text-white font-semibold">{fmt(row.amount)} ₽</span>
              <span className={`text-right self-center font-semibold text-[11px]
                                ${row.paid ? "text-green-400" : "text-[#F59E0B]"}`}>
                {row.paid ? "✓ Оплачено" : "• Ожидает"}
              </span>
              <div className="flex items-center justify-end">
                {!row.paid && (
                  <button disabled={busy === row.idx} onClick={() => handlePay(row.idx)}
                          className="text-[10px] font-semibold px-2 py-1 rounded-md
                                     bg-[#C8972B]/20 text-[#C8972B] hover:bg-[#C8972B]/40
                                     disabled:opacity-50 disabled:cursor-wait whitespace-nowrap transition-colors">
                    {busy === row.idx ? "..." : "Оплачено ✓"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   USER PROFILE MODAL  — 2-column layout
   ══════════════════════════════════════════════════════════════ */
function UserProfileModal({
  user, onSave, onClose, onMarkPaid, onEditLoan, onDeleteLoan, onCreateLoan,
  canDeleteLoans, canDeleteUser, onDeleteUser,
}: {
  user:          UserDetail;
  onSave:        (phone: string, data: Partial<UserDetail>) => Promise<void>;
  onClose:       () => void;
  onMarkPaid:    (phone: string, loanId: string, idx: number) => Promise<void>;
  onEditLoan:    (phone: string, loanId: string, patch: Partial<LoanRecord>) => Promise<void>;
  onDeleteLoan:  (phone: string, loanId: string) => Promise<void>;
  onCreateLoan:  (phone: string, payload: Record<string, unknown>) => Promise<void>;
  canDeleteLoans: boolean;
  canDeleteUser:  boolean;
  onDeleteUser:   (phone: string) => Promise<void>;
}) {
  const [showAddLoan, setShowAddLoan] = useState(false);
  const [form, setForm] = useState({
    firstName:      user.firstName      ?? "",
    lastName:       user.lastName       ?? "",
    patronymic:     user.patronymic     ?? "",
    birthDate:      user.birthDate      ?? "",
    trustScore:     user.trustScore     ?? 0,
    blocked:        user.blocked        ?? false,
    birthPlaceCity: user.birthPlaceCity ?? "",
    addrCity:       user.addrCity       ?? "",
    addrStreet:     user.addrStreet     ?? "",
    addrHouse:      user.addrHouse      ?? "",
    addrApt:        user.addrApt        ?? "",
    passportSeries:         user.passportSeries         ?? "",
    passportNumber:         user.passportNumber         ?? "",
    passportIssueDate:      user.passportIssueDate      ?? "",
    passportIssuedBy:       user.passportIssuedBy       ?? "",
    passportDepartmentCode: user.passportDepartmentCode ?? "",
    livingSameAsRegister: user.livingSameAsRegister ?? false,
    livingCity:   user.livingCity   ?? "",
    livingStreet: user.livingStreet ?? "",
    livingHouse:  user.livingHouse  ?? "",
    livingApt:    user.livingApt    ?? "",
    email:        user.email        ?? "",
  });
  const [saving,   setSaving]   = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [flash,    setFlash]    = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(user.phone, form);
    setFlash(true);
    setSaving(false);
    setTimeout(() => setFlash(false), 2000);
  };

  const handleBlock = async () => {
    const nb = !form.blocked;
    if (!confirm(`${nb ? "Заблокировать" : "Разблокировать"} ${formatPhone(user.phone) || user.phone}?`)) return;
    setBlocking(true);
    const newForm = { ...form, blocked: nb };
    setForm(newForm);
    await onSave(user.phone, newForm);
    setBlocking(false);
  };

  const createdStr  = user.createdAt  ? new Date(user.createdAt).toLocaleDateString("ru-RU") : "—";
  const lastLoginStr = user.lastLogin ? new Date(user.lastLogin).toLocaleString("ru-RU")     : "—";

  const [hasPassportDoc, setHasPassportDoc] = useState(false);
  const completion = computeProfileCompletion(
    { ...form, _passportDocUploaded: hasPassportDoc },
    { requirePassportScan: true },
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm"
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-2xl bg-[#0E2344] rounded-2xl shadow-2xl border border-[#1A3C6E]/60
                      max-h-[92vh] overflow-y-auto flex flex-col">

        {/* ── Sticky header ──────────────────────────────────── */}
        <div className="sticky top-0 bg-[#0E2344] border-b border-[#1A3C6E]/50 px-5 py-3
                        flex items-center justify-between rounded-t-2xl z-10 shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">Профиль пользователя</h2>
            <p className="text-xs text-[#9CA3AF] font-mono">{formatPhone(user.phone) || user.phone}</p>
          </div>
          <button onClick={onClose}
                  className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center
                             text-white hover:bg-white/20 transition-colors text-lg leading-none">×</button>
        </div>

        {/* ── Двухколоночное тело ────────────────────────────── */}
        <div className="flex gap-0 flex-1">

          {/* LEFT — Trust level sidebar */}
          <div className="w-36 shrink-0 border-r border-[#1A3C6E]/40 p-4 flex flex-col">
            <TrustLevelSidebar
              current={form.trustScore}
              onChange={score => setForm(f => ({ ...f, trustScore: score as TrustScore }))}
            />
            {/* Подсказка */}
            <p className="text-[9px] text-[#9CA3AF]/50 mt-3 leading-relaxed">
              Нажмите на уровень, чтобы назначить. Наведите для подробностей.
            </p>
          </div>

          {/* RIGHT — Main data */}
          <div className="flex-1 px-5 py-4 space-y-4 min-w-0">

            {/* Мета-статистика */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Рассрочек",   value: String(user.loansCount) },
                { label: "Регистрация", value: createdStr },
                { label: "Вход",        value: lastLoginStr },
                { label: "TG ID",       value: user.chatId ? String(user.chatId) : "—" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#1A3C6E]/20 rounded-lg p-2">
                  <p className="text-[9px] text-[#9CA3AF] uppercase font-semibold mb-0.5">{label}</p>
                  <p className="text-white text-[11px] font-semibold truncate">{value}</p>
                </div>
              ))}
            </div>

            {/* ФИО — одна строка */}
            <div>
              <p className="text-[10px] text-[#9CA3AF] font-semibold uppercase tracking-wider mb-1.5">ФИО</p>
              <div className="grid grid-cols-3 gap-2">
                <FieldRow placeholder="Фамилия"  value={form.lastName}   onChange={v => setForm(f => ({ ...f, lastName: v }))} />
                <FieldRow placeholder="Имя"      value={form.firstName}  onChange={v => setForm(f => ({ ...f, firstName: v }))} />
                <FieldRow placeholder="Отчество" value={form.patronymic} onChange={v => setForm(f => ({ ...f, patronymic: v }))} />
              </div>
            </div>

            {/* Дата рождения */}
            <div>
              <p className="text-[10px] text-[#9CA3AF] font-semibold uppercase tracking-wider mb-1.5">
                Дата рождения
              </p>
              <input type="date" value={form.birthDate}
                     onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))}
                     className="w-44 px-2.5 py-2 rounded-lg bg-[#0A1628] text-white text-sm
                                border border-[#1A3C6E] focus:border-[#C8972B] outline-none transition-colors" />
            </div>

            {/* Место рождения — свободный ввод */}
            <FieldRow
              label="Место рождения"
              placeholder="Город, регион или страна"
              value={form.birthPlaceCity}
              onChange={v => setForm(f => ({ ...f, birthPlaceCity: v }))}
            />

            {/* Адрес регистрации */}
            <div>
              <p className="text-[10px] text-[#9CA3AF] font-semibold uppercase tracking-wider mb-1.5">
                Адрес регистрации (по паспорту)
              </p>
              {/* Datalist для города */}
              <datalist id="admin-chechen-cities">
                {CHECHEN_CITIES.map(c => <option key={c} value={c} />)}
              </datalist>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <p className="text-[9px] text-[#9CA3AF]/60 mb-1">Регион</p>
                  <div className="px-2.5 py-2 rounded-lg bg-[#0A1628]/60 border border-[#1A3C6E]/40 text-white/50 text-sm cursor-not-allowed">
                    Чеченская Республика
                  </div>
                </div>
                <div>
                  <p className="text-[9px] text-[#9CA3AF]/60 mb-1">Населённый пункт</p>
                  <input
                    list="admin-chechen-cities"
                    value={form.addrCity}
                    onChange={e => setForm(f => ({ ...f, addrCity: e.target.value }))}
                    placeholder="Выберите или введите город"
                    className="w-full px-2.5 py-2 rounded-lg bg-[#0A1628] text-white text-sm
                               border border-[#1A3C6E] focus:border-[#C8972B] outline-none transition-colors
                               placeholder:text-[#9CA3AF]/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-[1fr_5rem_5rem] gap-2">
                <FieldRow placeholder="Улица *"   value={form.addrStreet} onChange={v => setForm(f => ({ ...f, addrStreet: v }))} />
                <FieldRow placeholder="Дом *"     value={form.addrHouse}  onChange={v => setForm(f => ({ ...f, addrHouse: v }))} />
                <FieldRow placeholder="Квартира"  value={form.addrApt}    onChange={v => setForm(f => ({ ...f, addrApt: v }))} />
              </div>
            </div>

            {/* Паспорт */}
            <div>
              <p className="text-[10px] text-[#9CA3AF] font-semibold uppercase tracking-wider mb-1.5">
                Паспортные данные <span className="text-red-400">*</span>
              </p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <p className="text-[9px] text-[#9CA3AF]/60 mb-1">Серия *</p>
                  <input value={form.passportSeries}
                         onChange={e => setForm(f => ({ ...f, passportSeries: maskPassportSeries(e.target.value) }))}
                         inputMode="numeric" placeholder={PASSPORT_SERIES_PLACEHOLDER}
                         className="w-full px-2.5 py-2 rounded-lg bg-[#0A1628] text-white text-sm font-mono
                                    border border-[#1A3C6E] focus:border-[#C8972B] outline-none transition-colors
                                    placeholder:text-[#9CA3AF]/50" />
                </div>
                <div>
                  <p className="text-[9px] text-[#9CA3AF]/60 mb-1">Номер *</p>
                  <input value={form.passportNumber}
                         onChange={e => setForm(f => ({ ...f, passportNumber: maskPassportNumber(e.target.value) }))}
                         inputMode="numeric" placeholder={PASSPORT_NUMBER_PLACEHOLDER}
                         className="w-full px-2.5 py-2 rounded-lg bg-[#0A1628] text-white text-sm font-mono
                                    border border-[#1A3C6E] focus:border-[#C8972B] outline-none transition-colors
                                    placeholder:text-[#9CA3AF]/50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <p className="text-[9px] text-[#9CA3AF]/60 mb-1">Дата выдачи *</p>
                  <input type="date" value={form.passportIssueDate}
                         onChange={e => setForm(f => ({ ...f, passportIssueDate: e.target.value }))}
                         className="w-full px-2.5 py-2 rounded-lg bg-[#0A1628] text-white text-sm
                                    border border-[#1A3C6E] focus:border-[#C8972B] outline-none transition-colors" />
                </div>
                <div>
                  <p className="text-[9px] text-[#9CA3AF]/60 mb-1">Код подразделения *</p>
                  <input value={form.passportDepartmentCode}
                         onChange={e => setForm(f => ({ ...f, passportDepartmentCode: maskDepartmentCode(e.target.value) }))}
                         inputMode="numeric" placeholder={DEPT_CODE_PLACEHOLDER}
                         className="w-full px-2.5 py-2 rounded-lg bg-[#0A1628] text-white text-sm font-mono
                                    border border-[#1A3C6E] focus:border-[#C8972B] outline-none transition-colors
                                    placeholder:text-[#9CA3AF]/50" />
                </div>
              </div>
              <div>
                <p className="text-[9px] text-[#9CA3AF]/60 mb-1">Кем выдан *</p>
                <textarea value={form.passportIssuedBy}
                          onChange={e => setForm(f => ({ ...f, passportIssuedBy: e.target.value }))}
                          rows={2}
                          placeholder="Например: ОУФМС России по г. Москве по району Якиманка"
                          className="w-full px-2.5 py-2 rounded-lg bg-[#0A1628] text-white text-sm resize-none
                                     border border-[#1A3C6E] focus:border-[#C8972B] outline-none transition-colors
                                     placeholder:text-[#9CA3AF]/50" />
              </div>

              {/* Скан/фото паспорта — обязательно для админа */}
              <AdminPassportDocUploader
                phone={user.phone}
                onChange={u => setHasPassportDoc(u)}
              />
            </div>

            {/* Адрес проживания */}
            <div>
              <p className="text-[10px] text-[#9CA3AF] font-semibold uppercase tracking-wider mb-1.5">
                Адрес проживания <span className="text-red-400">*</span>
              </p>
              <label className="inline-flex items-center gap-2 mb-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.livingSameAsRegister}
                       onChange={e => setForm(f => ({ ...f, livingSameAsRegister: e.target.checked }))}
                       className="accent-[#C8972B]" />
                <span className="text-xs text-white">Совпадает с адресом регистрации</span>
              </label>
              {!form.livingSameAsRegister && (
                <>
                  <div className="mb-2">
                    <input value={form.livingCity}
                           onChange={e => setForm(f => ({ ...f, livingCity: e.target.value }))}
                           placeholder="Город *"
                           className="w-full px-2.5 py-2 rounded-lg bg-[#0A1628] text-white text-sm
                                      border border-[#1A3C6E] focus:border-[#C8972B] outline-none transition-colors
                                      placeholder:text-[#9CA3AF]/50" />
                  </div>
                  <div className="grid grid-cols-[1fr_5rem_5rem] gap-2">
                    <FieldRow placeholder="Улица *"   value={form.livingStreet} onChange={v => setForm(f => ({ ...f, livingStreet: v }))} />
                    <FieldRow placeholder="Дом *"     value={form.livingHouse}  onChange={v => setForm(f => ({ ...f, livingHouse: v }))} />
                    <FieldRow placeholder="Квартира"  value={form.livingApt}    onChange={v => setForm(f => ({ ...f, livingApt: v }))} />
                  </div>
                </>
              )}
            </div>

            {/* Email */}
            <div>
              <p className="text-[10px] text-[#9CA3AF] font-semibold uppercase tracking-wider mb-1.5">
                Email <span className="text-[#9CA3AF]/60 normal-case">(необязательно)</span>
              </p>
              <FieldRow placeholder="name@example.com" type="email"
                        value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} />
            </div>

            {/* Заполненность профиля */}
            <div className="rounded-xl p-3"
                 style={{
                   background: completion.isComplete ? "rgba(34,197,94,0.10)" : (completion.percent >= 75 ? "rgba(245,158,11,0.10)" : "rgba(239,68,68,0.10)"),
                   border: `1px solid ${completion.isComplete ? "rgba(34,197,94,0.30)" : (completion.percent >= 75 ? "rgba(245,158,11,0.30)" : "rgba(239,68,68,0.30)")}`,
                 }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-white">
                  📋 Профиль заполнен на {completion.percent}%
                </span>
                <span className="text-[10px] text-white/60">{completion.filled} / {completion.total}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.10)" }}>
                <div className="h-full rounded-full transition-all"
                     style={{
                       width: `${completion.percent}%`,
                       background: completion.isComplete ? "#22C55E" : (completion.percent >= 75 ? "#F59E0B" : "#EF4444"),
                     }} />
              </div>
              {completion.isComplete ? (
                <p className="text-[10px] text-green-400">
                  ✓ Все обязательные поля заполнены — рассрочка может быть одобрена.
                </p>
              ) : (
                <p className="text-[10px] text-white/70 leading-snug">
                  Не хватает для одобрения: {Object.entries(completion.missingByGroup)
                    .map(([g, fs]) => `${g} (${fs.map(f => f.label.toLowerCase()).join(", ")})`)
                    .join("; ")}.
                </p>
              )}
            </div>

            {/* Статус аккаунта */}
            <div className="bg-red-900/10 border border-red-500/20 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Статус аккаунта</p>
                <p className="text-xs text-[#9CA3AF]">
                  {form.blocked ? "🔴 Заблокирован" : "🟢 Активен"}
                </p>
              </div>
              <button onClick={handleBlock} disabled={blocking}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors active:scale-95 ${
                        form.blocked
                          ? "bg-green-600/20 border border-green-500/40 text-green-400 hover:bg-green-600/30"
                          : "bg-red-600/20 border border-red-500/40 text-red-400 hover:bg-red-600/30"}`}>
                {blocking ? "..." : form.blocked ? "Разблокировать" : "Заблокировать"}
              </button>
            </div>

            {/* Удаление пользователя — только root */}
            {canDeleteUser && (
              <div className="bg-red-900/20 border border-red-500/40 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-red-300">Удалить пользователя</p>
                  <p className="text-[11px] text-red-400/80 leading-snug">
                    Полностью удалит профиль, все рассрочки, корзину, ledger и связанные данные.
                    Действие необратимо.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    const ph = formatPhone(user.phone) || user.phone;
                    if (!confirm(`Полностью удалить пользователя ${ph}?\nЭто действие необратимо.`)) return;
                    if (!confirm("Точно? Все данные будут стёрты.")) return;
                    await onDeleteUser(user.phone);
                  }}
                  className="px-3 py-1.5 rounded-full text-xs font-bold transition-colors active:scale-95 bg-red-600 text-white hover:bg-red-700">
                  🗑 Удалить
                </button>
              </div>
            )}

            {/* Кнопки */}
            <div className="flex gap-3">
              <button onClick={onClose}
                      className="flex-1 py-2 rounded-full border border-[#9CA3AF]/30 text-white
                                 font-semibold text-sm hover:bg-[#1A3C6E]/40 transition-colors">
                Закрыть
              </button>
              <button onClick={handleSave} disabled={saving}
                      className="flex-1 py-2 rounded-full font-bold text-sm transition-colors active:scale-95
                                 disabled:opacity-60 bg-[#C8972B] text-[#0A1628] hover:bg-[#E8B84B]">
                {flash ? "✓ Сохранено" : saving ? "Сохраняю..." : "Сохранить изменения"}
              </button>
            </div>
          </div>
        </div>

        {/* ── Блок рассрочек (full-width снизу) ─────────────── */}
        <div className="border-t border-[#1A3C6E]/40 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white">
              Рассрочки
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#9CA3AF]">
                {user.loans?.filter(l => l.status === "active").length ?? 0} активных ·{" "}
                {user.loans?.length ?? 0} всего
              </span>
              <button
                onClick={() => setShowAddLoan(s => !s)}
                className="px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors active:scale-95
                           bg-[#C8972B] text-[#0A1628] hover:bg-[#E8B84B]">
                {showAddLoan ? "✕ Отмена" : "+ Добавить"}
              </button>
            </div>
          </div>

          {showAddLoan && (
            <AdminCreateLoanForm
              onCancel={() => setShowAddLoan(false)}
              onCreate={async (payload) => {
                await onCreateLoan(user.phone, payload);
                setShowAddLoan(false);
              }}
            />
          )}

          {user.loans?.length > 0 ? (
            <div className="space-y-3">
              {user.loans.map(loan => (
                <AdminLoanCard
                  key={loan.id}
                  loan={loan}
                  phone={user.phone}
                  onMarkPaid={onMarkPaid}
                  onEdit={onEditLoan}
                  onDelete={onDeleteLoan}
                  canDelete={canDeleteLoans}
                />
              ))}
            </div>
          ) : (
            !showAddLoan && <p className="text-center text-xs text-[#9CA3AF] py-3">Нет рассрочек</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════════ */
function FieldRow({
  label, placeholder, value, onChange, type = "text", disabled,
}: {
  label?:      string;
  placeholder?: string;
  value:       string;
  onChange:    (v: string) => void;
  type?:       string;
  disabled?:   boolean;
}) {
  return (
    <div>
      {label && (
        <p className="text-[10px] text-[#9CA3AF] font-semibold uppercase tracking-wider mb-1">
          {label}
        </p>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        className="w-full px-2.5 py-2 rounded-lg bg-[#0A1628] text-white text-sm
                   border border-[#1A3C6E] focus:border-[#C8972B] outline-none transition-colors
                   placeholder:text-[#9CA3AF]/50 disabled:opacity-50"
      />
    </div>
  );
}


/* ════════════════════════════════════════════════════════════
   StaffTab — управление сотрудниками (admin + moderator)
   ════════════════════════════════════════════════════════════ */
interface StaffMember {
  phone:     string;
  firstName: string | null;
  role:      "admin" | "moderator";
  createdAt: number;
  lastLogin: number | null;
}

function StaffTab({ currentRole }: { currentRole: AdminRole }) {
  const [staff, setStaff]     = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string>("");
  const [phone,   setPhone]   = useState("");
  const [newRole, setNewRole] = useState<"admin" | "moderator">("moderator");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/staff");
      if (res.ok) {
        const data = await res.json();
        setStaff(data.staff ?? []);
      } else setError("Не удалось загрузить");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function addStaff() {
    if (!phone.trim()) return;
    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Ошибка"); return; }
      setPhone("");
      await load();
    } finally { setSubmitting(false); }
  }

  async function removeStaff(p: string) {
    if (!confirm("Снять роль с " + p + "?")) return;
    await fetch("/api/admin/staff?phone=" + encodeURIComponent(p), { method: "DELETE" });
    await load();
  }

  async function changeRole(p: string, role: "admin" | "moderator") {
    await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: p, role }),
    });
    await load();
  }

  return (
    <div className="space-y-6">
      {/* Add form */}
      <div className="bg-[#1A3C6E]/20 border border-[#1A3C6E]/40 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Назначить роль</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="tel"
            placeholder="+7 999 123 45 67"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-lg bg-[#0A1628] text-white border border-[#1A3C6E] focus:border-[#C8972B] outline-none"
          />
          <select
            value={newRole}
            onChange={e => setNewRole(e.target.value as "admin" | "moderator")}
            className="px-4 py-2.5 rounded-lg bg-[#0A1628] text-white border border-[#1A3C6E] focus:border-[#C8972B] outline-none"
          >
            <option value="moderator">Модератор</option>
            <option value="admin">Администратор</option>
          </select>
          <button
            onClick={addStaff}
            disabled={submitting}
            className="px-5 py-2.5 rounded-lg font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #0C7A58, #0a6449)" }}
          >
            {submitting ? "..." : "Назначить"}
          </button>
        </div>
        {error && <p className="mt-3 text-red-400 text-sm">⚠ {error}</p>}
        <p className="mt-3 text-xs text-[#9CA3AF]">
          Пользователь должен быть уже зарегистрирован на сайте (войти через /lk). Root-админ из ENV ADMIN_PHONE назначается через переменную окружения и не отображается здесь.
        </p>
      </div>

      {/* List */}
      <div className="bg-[#1A3C6E]/20 border border-[#1A3C6E]/40 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1A3C6E]/40 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Сотрудники ({staff.length})</h2>
          <button onClick={load} className="text-xs text-[#9CA3AF] hover:text-white">↻ Обновить</button>
        </div>
        {loading ? (
          <p className="p-6 text-center text-[#9CA3AF]">Загрузка...</p>
        ) : staff.length === 0 ? (
          <p className="p-6 text-center text-[#9CA3AF]">Сотрудников пока нет</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#0A1628]">
              <tr className="text-left text-[10px] uppercase text-[#9CA3AF]">
                <th className="px-6 py-3">Имя</th>
                <th className="px-6 py-3">Телефон</th>
                <th className="px-6 py-3">Роль</th>
                <th className="px-6 py-3">Последний вход</th>
                <th className="px-6 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {staff.map(s => (
                <tr key={s.phone} className="border-t border-[#1A3C6E]/40 hover:bg-[#1A3C6E]/10">
                  <td className="px-6 py-4 text-white font-semibold">{s.firstName || "—"}</td>
                  <td className="px-6 py-4 text-[#9CA3AF] font-mono">{s.phone}</td>
                  <td className="px-6 py-4">
                    <select
                      value={s.role}
                      onChange={e => changeRole(s.phone, e.target.value as "admin" | "moderator")}
                      className="px-2 py-1 rounded bg-[#0A1628] text-white border border-[#1A3C6E] text-xs"
                    >
                      <option value="moderator">Модератор</option>
                      <option value="admin">Администратор</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-[#9CA3AF] text-xs">
                    {s.lastLogin ? new Date(s.lastLogin).toLocaleString("ru-RU") : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => removeStaff(s.phone)}
                      className="text-red-400 hover:text-red-300 text-xs font-semibold"
                    >
                      Снять роль
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {currentRole === "moderator" && (
        <p className="text-xs text-[#9CA3AF] text-center">
          Эта вкладка доступна только администраторам.
        </p>
      )}
    </div>
  );
}

