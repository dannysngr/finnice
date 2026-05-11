import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { getRedis } from "@/lib/redis";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const redis = getRedis();
    const keys = await redis.keys("application:*");
    const applications: Array<Record<string, unknown> & { id: string; createdAt: string }> = [];

    for (const key of keys) {
      const data = await redis.get(key);
      if (data && typeof data === "object") {
        applications.push({
          ...(data as Record<string, unknown>),
          id: key.replace("application:", ""),
        } as Record<string, unknown> & { id: string; createdAt: string });
      }
    }

    applications.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(applications);
  } catch (err) {
    console.error("Error fetching applications:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
