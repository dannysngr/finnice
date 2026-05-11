/**
 * GET /api/auth/me
 * Возвращает данные текущего сеанса для клиентских компонентов.
 * Не бросает 401 — просто возвращает { authed: false } без куки.
 */

import { NextResponse }    from "next/server";
import { getSessionPhone } from "@/lib/auth-guard";
import { getRedis }        from "@/lib/redis";
import { findByPhone }     from "@/lib/user-store";

export async function GET() {
  const phone = await getSessionPhone();
  if (!phone) return NextResponse.json({ authed: false });

  const [user, profile] = await Promise.all([
    findByPhone(phone),
    getRedis().get<{ firstName: string; lastName: string }>(`profile:${phone}`),
  ]);

  const firstName = profile?.firstName ?? user?.firstName ?? null;
  const lastName  = profile?.lastName  ?? null;

  return NextResponse.json({ authed: true, phone, firstName, lastName });
}
