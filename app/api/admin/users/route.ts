import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { getRedis } from "@/lib/redis";
import type { ProfileRecord } from "@/app/api/lk/me/route";

export async function GET() {
  if (!(await isAdminRequest()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const redis       = getRedis();
    const profileKeys = await redis.keys("profile:*");
    const users       = [];

    for (const key of profileKeys) {
      const profile = await redis.get<ProfileRecord & { createdAt?: string }>(key);
      const phone   = key.replace("profile:", "");

      if (profile && typeof profile === "object") {
        const loanKeys = await redis.keys(`loans:${phone}:*`);
        users.push({
          phone,
          firstName:  profile.firstName  ?? null,
          lastName:   profile.lastName   ?? null,
          patronymic: profile.patronymic ?? null,
          createdAt:  (profile.createdAt as string | undefined) ?? new Date().toISOString(),
          loansCount: loanKeys.length,
        });
      }
    }

    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
