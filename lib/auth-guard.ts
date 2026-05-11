/**
 * lib/auth-guard.ts
 * Хелпер для защищённых API-роутов: читает nf_session cookie и
 * возвращает телефон пользователя или null.
 */

import { cookies }             from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "./session";

export async function getSessionPhone(): Promise<string | null> {
  const jar   = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token)?.phone ?? null;
}
