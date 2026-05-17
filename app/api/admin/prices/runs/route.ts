/**
 * GET /api/admin/prices/runs
 * Последние 10 запусков GitHub Action "Sync mistore prices".
 * Доступ: только root.
 */

import { NextResponse } from "next/server";
import { getAdminRole } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

const REPO = "dannysngr/finnice";
const WORKFLOW = "sync-mistore-prices.yml";

interface GhRun {
  id:           number;
  run_number:   number;
  status:       string;
  conclusion:   string | null;
  event:        string;
  created_at:   string;
  updated_at:   string;
  html_url:     string;
  actor:        { login: string };
  head_commit:  { message: string } | null;
}

export async function GET() {
  const role = await getAdminRole();
  if (role !== "root") {
    return NextResponse.json({ error: "Только root" }, { status: 403 });
  }
  const token = process.env.GITHUB_REPO_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "GITHUB_REPO_TOKEN не задан в env", runs: [] },
      { status: 200 },
    );
  }
  try {
    const r = await fetch(
      `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/runs?per_page=10`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        cache: "no-store",
      },
    );
    if (!r.ok) {
      return NextResponse.json(
        { error: `GitHub API ${r.status}`, runs: [] },
        { status: 502 },
      );
    }
    const data = await r.json() as { workflow_runs: GhRun[] };
    const runs = data.workflow_runs.map(w => ({
      id:         w.id,
      number:     w.run_number,
      status:     w.status,
      conclusion: w.conclusion,
      event:      w.event,
      actor:      w.actor.login,
      startedAt:  w.created_at,
      updatedAt:  w.updated_at,
      url:        w.html_url,
      message:    w.head_commit?.message ?? "",
    }));
    return NextResponse.json({ runs });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "fetch failed", runs: [] },
      { status: 502 },
    );
  }
}
