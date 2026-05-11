/**
 * GET    /api/cart           — содержимое корзины
 * POST   /api/cart           — добавить / изменить количество
 * DELETE /api/cart           — убрать товар
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionPhone }           from "@/lib/auth-guard";
import { getRedis }                  from "@/lib/redis";

export interface CartItem {
  productId: string;
  qty:       number;
}

function key(phone: string) { return `cart:${phone}`; }

export async function GET() {
  const phone = await getSessionPhone();
  if (!phone) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const redis = getRedis();
  const items = (await redis.get<CartItem[]>(key(phone))) ?? [];
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const phone = await getSessionPhone();
  if (!phone) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.productId) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const redis    = getRedis();
  const existing = (await redis.get<CartItem[]>(key(phone))) ?? [];
  const idx      = existing.findIndex(i => i.productId === body.productId);

  if (idx === -1) {
    existing.push({ productId: body.productId, qty: body.qty ?? 1 });
  } else {
    existing[idx].qty = body.qty ?? existing[idx].qty + 1;
  }

  await redis.set(key(phone), existing);
  return NextResponse.json({ items: existing });
}

export async function DELETE(req: NextRequest) {
  const phone = await getSessionPhone();
  if (!phone) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.productId) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const redis   = getRedis();
  const updated = ((await redis.get<CartItem[]>(key(phone))) ?? [])
    .filter(i => i.productId !== body.productId);

  await redis.set(key(phone), updated);
  return NextResponse.json({ items: updated });
}
