import { NextResponse } from "next/server";
import { getAdminRole, canManageStaff } from "@/lib/adminAuth";
import {
  listStaff, setUserRole, findByPhone, normalizePhoneStrict,
} from "@/lib/user-store";
import type { UserRole } from "@/lib/user-store";

/* GET /api/admin/staff — список всех staff (admin + moderator) */
export async function GET() {
  const role = await getAdminRole();
  if (role === null) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const staff = await listStaff();
  return NextResponse.json({
    currentUserRole: role,
    staff: staff.map(s => ({
      phone:     s.phone,
      firstName: s.firstName,
      role:      s.role,
      createdAt: s.createdAt,
      lastLogin: s.lastLogin,
    })),
  });
}

/* POST /api/admin/staff — назначить роль { phone, role } */
export async function POST(req: Request) {
  if (!(await canManageStaff())) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const rawPhone = String(body.phone ?? "").trim();
  const role     = body.role as UserRole | null;

  if (!rawPhone) return NextResponse.json({ error: "phone required" }, { status: 400 });
  if (role !== null && role !== "admin" && role !== "moderator") {
    return NextResponse.json({ error: "role must be admin/moderator/null" }, { status: 400 });
  }

  let phone: string;
  try { phone = normalizePhoneStrict(rawPhone); }
  catch (e) { return NextResponse.json({ error: String(e) }, { status: 400 }); }

  const user = await findByPhone(phone);
  if (!user) {
    return NextResponse.json(
      { error: "Пользователь не найден — он должен сначала зарегистрироваться через /lk" },
      { status: 404 },
    );
  }

  const updated = await setUserRole(phone, role);
  return NextResponse.json({ ok: true, user: updated });
}

/* DELETE /api/admin/staff?phone=+7... — снять роль */
export async function DELETE(req: Request) {
  if (!(await canManageStaff())) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const rawPhone = url.searchParams.get("phone") ?? "";
  if (!rawPhone) return NextResponse.json({ error: "phone required" }, { status: 400 });

  let phone: string;
  try { phone = normalizePhoneStrict(rawPhone); }
  catch (e) { return NextResponse.json({ error: String(e) }, { status: 400 }); }

  const updated = await setUserRole(phone, null);
  return NextResponse.json({ ok: true, user: updated });
}
