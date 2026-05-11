/**
 * GET  /api/favorites        — список id избранных товаров
 * POST /api/favorites        — переключить товар (добавить / убрать)
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionPhone }           from "@/lib/auth-guard";
import { getRedis }                  from "@/lib/redis";

function key(phone: string) { return `favorites:${phone}`; }

export async function GET() {
  const phone = await getSessionPhone();
  if (!phone) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const redis = getRedis();
  const ids   = (await redis.get<string[]>(key(phone))) ?? [];
  return NextResponse.json({ ids });
}

export async function POST(req: NextRequest) {
  const phone = await getSessionPhone();
  if (!phone) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.productId) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const redis     = getRedis();
  const existing  = (await redis.get<string[]>(key(phone))) ?? [];
  const inFav     = existing.includes(body.productId);
  const updated   = inFav
    ? existing.filter(id => id !== body.productId)
    : [...existing, body.productId];

  await redis.set(key(phone), updated);
  return NextResponse.json({ ids: updated, added: !inFav });
}
