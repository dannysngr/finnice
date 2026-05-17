/**
 * POST /api/admin/prices/sync-now
 * Триггерит workflow_dispatch GitHub Action "Sync mistore prices".
 * Доступ: только root.
 */

import { NextResponse } from "next/server";
import { getAdminRole } from "@/lib/adminAuth";

const REPO = "dannysngr/finnice";
const WORKFLOW = "sync-mistore-prices.yml";

export async function POST() {
  const role = await getAdminRole();
  if (role !== "root") {
    return NextResponse.json({ error: "Только root" }, { status: 403 });
  }
  const token = process.env.GITHUB_REPO_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "GITHUB_REPO_TOKEN не задан в Vercel env" },
      { status: 500 },
    );
  }
  const r = await fetch(
    `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ref: "main" }),
    },
  );
  if (!r.ok) {
    const detail = await r.text();
    return NextResponse.json(
      { error: `GitHub API ${r.status}`, detail },
      { status: 502 },
    );
  }
  // workflow_dispatch returns 204 No Content
  return NextResponse.json({
    ok: true,
    message: "Workflow запущен. Жди уведомление в Telegram через ~30 секунд.",
  });
}
