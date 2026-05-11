/**
 * lib/adminAuth.ts
 * Проверка прав доступа к admin-зоне.
 *
 * Кому открыт доступ:
 *   1. Пользователю с телефоном из ENV `ADMIN_PHONE` (root-админ)
 *   2. Любому пользователю с `role: "admin"` в БД
 *   3. Любому пользователю с `role: "moderator"` в БД
 *
 * Различение admin vs moderator делается через `getAdminRole()`.
 */

import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { findByPhone } from "@/lib/user-store";
import type { UserRole } from "@/lib/user-store";

export type AccessRole = "root" | "admin" | "moderator" | null;

/**
 * Возвращает роль текущего пользователя:
 *   "root"      — ENV-админ (полные права + неудаляемый)
 *   "admin"     — назначенный администратор (может управлять модераторами)
 *   "moderator" — модератор (доступ к админ-панели, но без управления ролями)
 *   null        — нет доступа
 */
export async function getAdminRole(): Promise<AccessRole> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = verifySessionToken(token);
  if (!payload?.phone) return null;

  const userPhoneNorm = payload.phone.replace(/\D/g, "");

  // 1) ENV root admin
  const rootPhone = (process.env.ADMIN_PHONE ?? "").replace(/\D/g, "");
  if (rootPhone && userPhoneNorm === rootPhone) return "root";

  // 2) DB role
  const rec = await findByPhone(payload.phone);
  if (rec?.role === "admin")     return "admin";
  if (rec?.role === "moderator") return "moderator";

  return null;
}

/** Проверка: есть ли доступ к админ-зоне (любая из 3-х ролей) */
export async function isAdminRequest(): Promise<boolean> {
  const r = await getAdminRole();
  return r !== null;
}

/** Может ли управлять модераторами (только root + admin) */
export async function canManageStaff(): Promise<boolean> {
  const r = await getAdminRole();
  return r === "root" || r === "admin";
}

/** Возвращает телефон текущего пользователя (если авторизован) */
export async function getAdminPhone(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = verifySessionToken(token);
  return payload?.phone ?? null;
}

export type { UserRole };
