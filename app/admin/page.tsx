import { cookies } from "next/headers";
import { AdminClient } from "./AdminClient";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { getAdminRole } from "@/lib/adminAuth";

export const metadata = {
  title: "Admin Panel - Финнайс",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  const adminPhone = process.env.ADMIN_PHONE ?? "";
  const normalizedAdminPhone = adminPhone.replace(/\D/g, "");

  let debugPhone    = "(не авторизован)";
  let debugNorm     = "—";
  const debugAdmin  = normalizedAdminPhone || "(ADMIN_PHONE не задан!)";
  let debugErr      = "";

  if (token) {
    const payload = verifySessionToken(token);
    if (payload) {
      debugPhone = payload.phone;
      debugNorm  = payload.phone.replace(/\D/g, "");
    } else {
      debugErr = "Токен недействителен или истёк";
    }
  } else {
    debugErr = "Cookie «" + SESSION_COOKIE + "» не найдена";
  }

  // Новая проверка — пускает root-админа, admin, moderator
  const role = await getAdminRole();
  const isAdmin = role !== null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center p-6">
        <div className="bg-[#1A3C6E]/30 border border-red-500/40 rounded-2xl p-8 max-w-md w-full">
          <h1 className="text-xl font-bold text-red-400 mb-6">🔐 Доступ запрещён</h1>
          <div className="space-y-3 font-mono text-sm">
            <Row label="Cookie" value={SESSION_COOKIE} />
            <Row label="Ваш номер" value={debugPhone} />
            <Row label="Ваш номер (цифры)" value={debugNorm} />
            <Row label="ADMIN_PHONE (root)" value={debugAdmin} />
            <Row label="Роль в БД" value="—" />
            {debugErr && (
              <div className="bg-red-900/30 rounded-lg p-3 border border-red-500/30">
                <p className="text-red-400 text-xs">⚠ {debugErr}</p>
              </div>
            )}
            <p className="text-[#9CA3AF] text-xs mt-4">
              Для доступа войдите как root-админ или попросите root-админа назначить вам роль администратора / модератора.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <AdminClient isAdmin={true} role={role} />;
}

function Row({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="bg-[#0A1628] rounded-lg p-3">
      <p className="text-[#9CA3AF] text-xs mb-1">{label}</p>
      <p className={ok === undefined ? "text-white" : ok ? "text-green-400" : "text-red-400"}>
        {value}
      </p>
    </div>
  );
}
