import { NextResponse } from "next/server";

const HTML = `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Финнайс — на обслуживании</title>
<style>
  html,body{margin:0;height:100%;font-family:-apple-system,system-ui,sans-serif;
    background:radial-gradient(ellipse at 50% 30%,#0C7A58 0%,#03101F 70%);color:#EDE7DA}
  .wrap{min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;
    text-align:center;padding:24px}
  h1{font-size:28px;font-weight:800;margin:0 0 8px;letter-spacing:-.02em}
  p{font-size:15px;line-height:1.5;opacity:.75;max-width:420px;margin:0}
  .badge{display:inline-flex;align-items:center;gap:8px;padding:6px 12px;border-radius:999px;
    background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);font-size:11px;
    font-weight:600;margin-bottom:20px;text-transform:uppercase;letter-spacing:.15em}
  .dot{width:6px;height:6px;border-radius:50%;background:#C9A84C;box-shadow:0 0 8px #C9A84C;
    animation:p 1.6s ease-out infinite}
  @keyframes p{0%,100%{opacity:.4}50%{opacity:1}}
</style></head><body><div class="wrap">
<span class="badge"><span class="dot"></span>Обслуживание</span>
<h1>Скоро вернёмся</h1>
<p>Сайт временно недоступен — проводим технические работы. Спасибо за терпение.</p>
</div></body></html>`;

export function middleware() {
  return new NextResponse(HTML, {
    status: 503,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "retry-after": "3600",
      "cache-control": "no-store",
    },
  });
}

// Всё, кроме статики Next и favicon
export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico|robots.txt).*)",
};
