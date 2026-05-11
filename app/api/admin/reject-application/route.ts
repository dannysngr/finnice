import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { getRedis } from "@/lib/redis";

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { appId } = await req.json();
    if (!appId) {
      return NextResponse.json({ error: "Missing appId" }, { status: 400 });
    }

    const redis  = getRedis();
    const appKey = `application:${appId}`;
    const appData = await redis.get(appKey);
    if (appData && typeof appData === "object") {
      await redis.set(appKey, {
        ...(appData as Record<string, unknown>),
        status:     "rejected",
        rejectedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error rejecting application:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
