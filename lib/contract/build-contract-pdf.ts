/**
 * lib/contract/build-contract-pdf.ts
 *
 * PDF-версия договора Финнайс через pdf-lib + DejaVu Sans (TTF с кириллицей).
 * Соответствует утверждённому 8-страничному образцу:
 *   1 — обложка, 2..6 — тело договора, 7 — Приложение №1 (график),
 *   8 — Приложение №2 (Акт приёма-передачи).
 *
 * Брендовая шапка и подвал «Страница X из N» автодорисовываются на
 * каждой странице кроме обложки.
 */

import { PDFDocument, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "node:fs/promises";
import path from "node:path";

import type { ContractData } from "./build-contract";
import { dateToRuParts, rublesInWords } from "./numbers-to-words";

/* ── Геометрия страницы (A4) ─────────────────────────── */
const PAGE_W   = 595.28;
const PAGE_H   = 841.89;
const MARGIN_L = 48;
const MARGIN_R = 48;
const MARGIN_T = 70;   // под брендовую шапку
const MARGIN_B = 50;   // над подвалом

const F_NORMAL = 9.5;
const F_SMALL  = 8.5;
const F_TINY   = 7.5;
const F_H2     = 11;   // заголовок раздела
const F_H1     = 16;   // приложение/титул

/* ── Цвета (RGB 0..1) ────────────────────────────────── */
const COL_BRAND      = rgb(0x0C / 255, 0x7A / 255, 0x58 / 255);
const COL_TEXT       = rgb(0x0A / 255, 0x16 / 255, 0x28 / 255);
const COL_MUTED      = rgb(0x6B / 255, 0x72 / 255, 0x80 / 255);
const COL_LIGHT      = rgb(0x9C / 255, 0xA3 / 255, 0xAF / 255);
const COL_WHITE      = rgb(1, 1, 1);
const COL_CALLOUT_BG = rgb(0xEC / 255, 0xFD / 255, 0xF5 / 255);
const COL_CALLOUT_BR = rgb(0x86 / 255, 0xEF / 255, 0xAC / 255);
const COL_WARN_BG    = rgb(0xFE / 255, 0xF3 / 255, 0xC7 / 255);
const COL_WARN_BR    = rgb(0xFD / 255, 0xE6 / 255, 0x8A / 255);
const COL_ROW_ALT    = rgb(0xF9 / 255, 0xFA / 255, 0xFB / 255);
const COL_DIVIDER    = rgb(0xE5 / 255, 0xE7 / 255, 0xEB / 255);

interface Ctx {
  doc:      PDFDocument;
  page:     PDFPage;
  pages:    PDFPage[];      // для пост-нумерации
  font:     PDFFont;
  fontBold: PDFFont;
  y:        number;
  isCover:  boolean;        // не рисуем шапку/подвал на обложке
}

/* ── Шрифты ──────────────────────────────────────────── */
let cachedFonts: { regular: ArrayBuffer; bold: ArrayBuffer } | null = null;
async function loadFonts() {
  if (cachedFonts) return cachedFonts;
  const dir = path.join(process.cwd(), "public", "fonts");
  const [reg, bld] = await Promise.all([
    fs.readFile(path.join(dir, "DejaVuSans.ttf")),
    fs.readFile(path.join(dir, "DejaVuSans-Bold.ttf")),
  ]);
  cachedFonts = {
    regular: reg.buffer.slice(reg.byteOffset, reg.byteOffset + reg.byteLength) as ArrayBuffer,
    bold:    bld.buffer.slice(bld.byteOffset, bld.byteOffset + bld.byteLength) as ArrayBuffer,
  };
  return cachedFonts;
}

/* ── Утилиты ─────────────────────────────────────────── */
function widthOf(text: string, font: PDFFont, size: number): number {
  return font.widthOfTextAtSize(text, size);
}

function wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
  if (text === "") return [""];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (widthOf(test, font, size) <= maxW) cur = test;
    else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Рисует брендовую шапку (finnice · Исламская рассрочка ... +7) */
function drawHeaderStrip(ctx: Ctx): void {
  const y = PAGE_H - 30;
  ctx.page.drawText("finnice", {
    x: MARGIN_L, y, size: 11, font: ctx.fontBold, color: COL_BRAND,
  });
  const finWidth = widthOf("finnice", ctx.fontBold, 11);
  ctx.page.drawText("  ·  Исламская рассрочка", {
    x: MARGIN_L + finWidth, y, size: 8.5, font: ctx.font, color: COL_MUTED,
  });
  const right = "г. Грозный  ·  +7 (928) 491-08-08";
  ctx.page.drawText(right, {
    x: PAGE_W - MARGIN_R - widthOf(right, ctx.font, 8.5),
    y, size: 8.5, font: ctx.font, color: COL_MUTED,
  });
  /* Тонкая линия под шапкой */
  ctx.page.drawLine({
    start: { x: MARGIN_L, y: y - 6 },
    end:   { x: PAGE_W - MARGIN_R, y: y - 6 },
    color: COL_BRAND, thickness: 0.7,
  });
}

/** Рисует подвал «г. Грозный, ... · www.finnice.ru · Страница X из N» */
function drawFooterStrip(ctx: Ctx, pageNum: number, total: number): void {
  const y = 30;
  ctx.page.drawLine({
    start: { x: MARGIN_L, y: y + 12 },
    end:   { x: PAGE_W - MARGIN_R, y: y + 12 },
    color: COL_DIVIDER, thickness: 0.5,
  });
  ctx.page.drawText("г. Грозный, ул. Орзамиева, 8", {
    x: MARGIN_L, y, size: 7.5, font: ctx.font, color: COL_LIGHT,
  });
  const site = "www.finnice.ru";
  ctx.page.drawText(site, {
    x: (PAGE_W - widthOf(site, ctx.fontBold, 7.5)) / 2,
    y, size: 7.5, font: ctx.fontBold, color: COL_BRAND,
  });
  const right = `Страница ${pageNum} из ${total}`;
  ctx.page.drawText(right, {
    x: PAGE_W - MARGIN_R - widthOf(right, ctx.font, 7.5),
    y, size: 7.5, font: ctx.font, color: COL_LIGHT,
  });
}

function newPage(ctx: Ctx, isCover = false): void {
  ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
  ctx.pages.push(ctx.page);
  ctx.isCover = isCover;
  ctx.y = PAGE_H - MARGIN_T;
  if (!isCover) drawHeaderStrip(ctx);
}

function ensureSpace(ctx: Ctx, neededPx: number): void {
  if (ctx.y - neededPx < MARGIN_B + 10) newPage(ctx);
}

/* ── Базовая отрисовка параграфов ────────────────────── */
function drawPara(
  ctx: Ctx, text: string,
  opts: { bold?: boolean; size?: number; align?: "left" | "center" | "right"; color?: RGB; spacingAfter?: number; indent?: number } = {},
): void {
  const size = opts.size ?? F_NORMAL;
  const font = opts.bold ? ctx.fontBold : ctx.font;
  const color = opts.color ?? COL_TEXT;
  const xLeft = MARGIN_L + (opts.indent ?? 0);
  const maxW = PAGE_W - xLeft - MARGIN_R;
  const lines = wrap(text, font, size, maxW);
  const lh = size + 4;
  for (const line of lines) {
    ensureSpace(ctx, lh);
    const w = widthOf(line, font, size);
    const x = opts.align === "center" ? (PAGE_W - w) / 2
            : opts.align === "right"  ? (PAGE_W - MARGIN_R - w)
            : xLeft;
    ctx.page.drawText(line, { x, y: ctx.y - size, size, font, color });
    ctx.y -= lh;
  }
  if (opts.spacingAfter) ctx.y -= opts.spacingAfter;
}

/** Параграф с микс-рунами (часть жирная, часть нет) */
function drawMixed(ctx: Ctx, runs: Array<{ text: string; bold?: boolean; color?: RGB }>, opts: { spacingAfter?: number } = {}): void {
  const size = F_NORMAL;
  const maxW = PAGE_W - MARGIN_L - MARGIN_R;

  type Tok = { text: string; bold: boolean; color: RGB; width: number };
  const tokens: Tok[] = [];
  for (const run of runs) {
    const color = run.color ?? COL_TEXT;
    for (const part of run.text.split(/(\s+)/).filter(Boolean)) {
      const fnt = run.bold ? ctx.fontBold : ctx.font;
      tokens.push({ text: part, bold: !!run.bold, color, width: widthOf(part, fnt, size) });
    }
  }

  const lines: Tok[][] = [];
  let cur: Tok[] = []; let curW = 0;
  for (const t of tokens) {
    if (curW + t.width <= maxW || cur.length === 0) {
      cur.push(t); curW += t.width;
    } else {
      lines.push(cur);
      if (t.text.trim() === "") { cur = []; curW = 0; }
      else { cur = [t]; curW = t.width; }
    }
  }
  if (cur.length > 0) lines.push(cur);

  const lh = size + 4;
  for (const line of lines) {
    ensureSpace(ctx, lh);
    let x = MARGIN_L;
    for (const tok of line) {
      const font = tok.bold ? ctx.fontBold : ctx.font;
      ctx.page.drawText(tok.text, { x, y: ctx.y - size, size, font, color: tok.color });
      x += tok.width;
    }
    ctx.y -= lh;
  }
  if (opts.spacingAfter) ctx.y -= opts.spacingAfter;
}

/** Заголовок раздела (1. ПРЕДМЕТ ДОГОВОРА ...) */
function drawSectionHead(ctx: Ctx, text: string): void {
  ctx.y -= 8;
  drawPara(ctx, text, { bold: true, size: F_H2, color: COL_TEXT, spacingAfter: 4 });
}

/* ── Callout (цветной блок с рамкой) ─────────────────── */
function drawCallout(ctx: Ctx, opts: {
  icon?: string; title: string; body: string; bg: RGB; border: RGB;
}): void {
  const padX = 16, padY = 12;
  const titleSize = F_NORMAL, bodySize = F_NORMAL;
  const innerW = PAGE_W - MARGIN_L - MARGIN_R - padX * 2;

  /* Заранее измеряем высоту */
  const bodyLines = wrap(opts.body, ctx.font, bodySize, innerW);
  const titleLineH = titleSize + 4;
  const bodyLineH = bodySize + 4;
  const boxH = padY * 2 + titleLineH + 4 + bodyLines.length * bodyLineH;

  ensureSpace(ctx, boxH + 6);

  const x = MARGIN_L;
  const y = ctx.y - boxH;
  ctx.page.drawRectangle({
    x, y, width: PAGE_W - MARGIN_L - MARGIN_R, height: boxH,
    color: opts.bg, borderColor: opts.border, borderWidth: 1,
  });

  /* Заголовок */
  let titleX = x + padX;
  const titleY = ctx.y - padY - titleSize;
  if (opts.icon) {
    ctx.page.drawText(opts.icon, { x: titleX, y: titleY, size: titleSize, font: ctx.fontBold, color: COL_BRAND });
    titleX += widthOf(opts.icon + "  ", ctx.fontBold, titleSize);
  }
  ctx.page.drawText(opts.title, { x: titleX, y: titleY, size: titleSize, font: ctx.fontBold, color: COL_BRAND });

  /* Тело */
  let lineY = titleY - 4 - bodySize;
  for (const line of bodyLines) {
    ctx.page.drawText(line, { x: x + padX, y: lineY, size: bodySize, font: ctx.font, color: COL_TEXT });
    lineY -= bodyLineH;
  }
  ctx.y -= (boxH + 10);
}

/* ── Таблица: общий низкоуровневый рисователь ────────── */
interface Cell {
  text:     string;
  bold?:    boolean;
  align?:   "left" | "center" | "right";
  color?:   RGB;
  bg?:      RGB;
  fontSize?: number;
  colSpan?: number;
}
function drawRow(ctx: Ctx, cells: Cell[], colWidths: number[], rowH: number, options: { borderColor?: RGB } = {}): void {
  ensureSpace(ctx, rowH + 2);
  let x = MARGIN_L;
  let cellIdx = 0;
  const borderColor = options.borderColor ?? COL_DIVIDER;
  for (const cell of cells) {
    const span = cell.colSpan ?? 1;
    let cellW = 0;
    for (let i = 0; i < span && cellIdx + i < colWidths.length; i++) cellW += colWidths[cellIdx + i];
    if (cell.bg) {
      ctx.page.drawRectangle({ x, y: ctx.y - rowH, width: cellW, height: rowH, color: cell.bg });
    }
    /* Рамка */
    ctx.page.drawRectangle({
      x, y: ctx.y - rowH, width: cellW, height: rowH,
      borderColor, borderWidth: 0.5, opacity: 0,
    });
    /* Текст */
    const font = cell.bold ? ctx.fontBold : ctx.font;
    const size = cell.fontSize ?? F_NORMAL;
    const color = cell.color ?? COL_TEXT;
    const tw = widthOf(cell.text, font, size);
    const padX = 6;
    const innerW = cellW - padX * 2;
    let tx: number;
    if (cell.align === "center")     tx = x + (cellW - tw) / 2;
    else if (cell.align === "right") tx = x + cellW - padX - tw;
    else                              tx = x + padX;
    /* обрезка по ширине, если переполнение */
    let drawText = cell.text;
    while (widthOf(drawText, font, size) > innerW && drawText.length > 1) {
      drawText = drawText.slice(0, -1);
    }
    ctx.page.drawText(drawText, { x: tx, y: ctx.y - rowH / 2 - size / 3, size, font, color });
    x += cellW;
    cellIdx += span;
  }
  ctx.y -= rowH;
}

/* ── Таблица цены (§4) ───────────────────────────────── */
function drawPriceTable(ctx: Ctx, data: ContractData, words: { sum: string; down: string; remain: string }): void {
  const labels: Array<[string, string]> = [
    ["Полная цена Товара",          `${fmt(data.totalPrice)} (${words.sum}) руб. 00 коп.`],
    ["Первоначальный взнос",        `${fmt(data.downPayment)} (${words.down}) руб. 00 коп.`],
    ["Сумма к оплате в рассрочку",  `${fmt(data.remainingPay)} (${words.remain}) руб. 00 коп.`],
    ["Срок рассрочки",              `${data.termMonths} месяцев (не более 12 месяцев)`],
  ];
  const colW = [200, PAGE_W - MARGIN_L - MARGIN_R - 200];
  for (const [k, v] of labels) {
    drawRow(ctx, [
      { text: k, bold: true, bg: COL_ROW_ALT },
      { text: v },
    ], colW, 26);
  }
  ctx.y -= 8;
}

/* ── Таблица графика платежей (Приложение №1) ────────── */
function drawScheduleTable(ctx: Ctx, schedule: ContractData["schedule"], totalPrice: number): void {
  const colW = [40, 140, 140, PAGE_W - MARGIN_L - MARGIN_R - 320];
  /* Header */
  drawRow(ctx, [
    { text: "№",            bold: true, color: COL_WHITE, bg: COL_BRAND, align: "center" },
    { text: "Дата платежа", bold: true, color: COL_WHITE, bg: COL_BRAND, align: "center" },
    { text: "Сумма, руб.",  bold: true, color: COL_WHITE, bg: COL_BRAND, align: "center" },
    { text: "Назначение",   bold: true, color: COL_WHITE, bg: COL_BRAND },
  ], colW, 22);

  /* Rows */
  schedule.forEach((row, idx) => {
    const dt = dateToRuParts(row.date);
    const dateStr = `${dt.day}.${String(new Date(row.date).getMonth() + 1).padStart(2, "0")}.${dt.year}`;
    const bg = idx % 2 === 1 ? COL_ROW_ALT : undefined;
    drawRow(ctx, [
      { text: String(row.n), bold: true, align: "center", ...(bg ? { bg } : {}) },
      { text: dateStr,                              ...(bg ? { bg } : {}) },
      { text: fmt(row.amount),                      ...(bg ? { bg } : {}) },
      { text: row.purpose,                          ...(bg ? { bg } : {}) },
    ], colW, 20);
  });

  /* Total */
  drawRow(ctx, [
    { text: "ИТОГО",          bold: true, color: COL_WHITE, bg: COL_BRAND, align: "center", colSpan: 2 },
    { text: fmt(totalPrice),  bold: true, color: COL_WHITE, bg: COL_BRAND },
    { text: "",                          bg: COL_BRAND },
  ], colW, 24);
}

/* ── Таблица товара в Акте (Приложение №2) ───────────── */
function drawActTable(ctx: Ctx, items: Array<{ name: string; qty: number; totalAmount: number }>): void {
  const colW = [40, PAGE_W - MARGIN_L - MARGIN_R - 280, 60, 90, 90];
  drawRow(ctx, [
    { text: "№ п/п",       bold: true, color: COL_WHITE, bg: COL_BRAND, align: "center" },
    { text: "Наименование", bold: true, color: COL_WHITE, bg: COL_BRAND },
    { text: "Кол-во",      bold: true, color: COL_WHITE, bg: COL_BRAND, align: "center" },
    { text: "Цена, руб.",  bold: true, color: COL_WHITE, bg: COL_BRAND, align: "center" },
    { text: "Сумма, руб.", bold: true, color: COL_WHITE, bg: COL_BRAND, align: "center" },
  ], colW, 22);
  items.forEach((it, idx) => {
    const unitPrice = it.totalAmount / Math.max(it.qty, 1);
    drawRow(ctx, [
      { text: String(idx + 1), bold: true, align: "center" },
      { text: it.name },
      { text: String(it.qty), align: "center" },
      { text: fmt(unitPrice), align: "center" },
      { text: fmt(it.totalAmount), align: "center" },
    ], colW, 24);
  });
}

/* ── 2-колоночные реквизиты в §12 ────────────────────── */
function drawRequisites(ctx: Ctx, data: ContractData, passportDate: { day: string; month: string; year: string }): void {
  const passport = `${data.buyerPassportSeries} ${data.buyerPassportNumber}`;
  const colW = (PAGE_W - MARGIN_L - MARGIN_R) / 2;

  /* Заголовки */
  const headerH = 24;
  ensureSpace(ctx, headerH + 6);
  ctx.page.drawRectangle({
    x: MARGIN_L, y: ctx.y - headerH,
    width: colW, height: headerH, color: COL_BRAND,
  });
  ctx.page.drawRectangle({
    x: MARGIN_L + colW, y: ctx.y - headerH,
    width: colW, height: headerH, color: COL_BRAND,
  });
  ctx.page.drawText("ПРОДАВЕЦ", {
    x: MARGIN_L + 16, y: ctx.y - headerH / 2 - 4,
    size: F_NORMAL, font: ctx.fontBold, color: COL_WHITE,
  });
  ctx.page.drawText("ПОКУПАТЕЛЬ", {
    x: MARGIN_L + colW + 16, y: ctx.y - headerH / 2 - 4,
    size: F_NORMAL, font: ctx.fontBold, color: COL_WHITE,
  });
  ctx.y -= headerH;

  /* Содержимое — рисуем построчно в две колонки */
  const sellerLines: Array<{ text: string; bold?: boolean; color?: RGB }> = [
    { text: `ООО «${data.sellerCompanyName}»`, bold: true },
    { text: "ИНН: ___________________" },
    { text: "ОГРН: ___________________" },
    { text: "Юр. адрес: г. Грозный, ул. Орзамиева, 8" },
    { text: "Факт. адрес: ______________________" },
    { text: "" },
    { text: "Р/с: _____________________" },
    { text: "Банк: _____________________" },
    { text: "К/с: _____________________" },
    { text: "БИК: _____________________" },
    { text: "" },
    { text: "Телефон: +7 (928) 491-08-08" },
    { text: "E-mail: info@finnice.ru" },
    { text: "" },
    { text: "____________ / ____________   М.П." },
    { text: "подпись / Ф.И.О.", color: COL_MUTED },
  ];
  const buyerLines: Array<{ text: string; bold?: boolean; color?: RGB }> = [
    { text: "Фамилия, имя, отчество", color: COL_MUTED },
    { text: data.buyerFullName, bold: true },
    { text: `Паспорт: серия ${passport}` },
    { text: `Выдан: ${data.buyerPassportIssuedBy}` },
    { text: `Дата выдачи: «${passportDate.day}» ${passportDate.month} ${passportDate.year} г.` },
    { text: `Код подразделения: ${data.buyerPassportDeptCode}` },
    { text: `Адрес регистрации: ${data.buyerRegisterAddress}` },
    { text: `Адрес проживания: ${data.buyerLivingAddress}` },
    { text: "" },
    { text: `Телефон: ${data.buyerPhone}` },
    { text: data.buyerEmail ? `E-mail: ${data.buyerEmail}` : "" },
    { text: "" },
    { text: "" },
    { text: "" },
    { text: "____________ / ____________" },
    { text: "подпись / Ф.И.О.", color: COL_MUTED },
  ];

  const rowCount = Math.max(sellerLines.length, buyerLines.length);
  const lh = 13;
  ensureSpace(ctx, rowCount * lh + 4);
  const startY = ctx.y - 8;
  for (let i = 0; i < rowCount; i++) {
    const sl = sellerLines[i] || { text: "" };
    const bl = buyerLines[i] || { text: "" };
    const y  = startY - i * lh - F_SMALL;
    if (sl.text) {
      const font = sl.bold ? ctx.fontBold : ctx.font;
      ctx.page.drawText(sl.text, { x: MARGIN_L + 12, y, size: F_SMALL, font, color: sl.color ?? COL_TEXT });
    }
    if (bl.text) {
      const font = bl.bold ? ctx.fontBold : ctx.font;
      ctx.page.drawText(bl.text, { x: MARGIN_L + colW + 12, y, size: F_SMALL, font, color: bl.color ?? COL_TEXT });
    }
  }
  ctx.y -= rowCount * lh + 16;
}

/* ── Хелпер форматирования числа ─────────────────────── */
function fmt(n: number): string {
  return Math.round(n).toLocaleString("ru-RU");
}

/* ══════════════════════════════════════════════════════
   ОБЛОЖКА
   ══════════════════════════════════════════════════════ */
function drawCoverPage(ctx: Ctx, data: ContractData, d: { day: string; month: string; year: string }): void {
  const centerX = PAGE_W / 2;

  /* finnice (большим зелёным) */
  let y = 580;
  const logo = "finnice";
  const logoSize = 48;
  ctx.page.drawText(logo, {
    x: centerX - widthOf(logo, ctx.fontBold, logoSize) / 2,
    y, size: logoSize, font: ctx.fontBold, color: COL_BRAND,
  });
  y -= 28;
  const sub1 = "И С Л А М С К А Я";
  ctx.page.drawText(sub1, {
    x: centerX - widthOf(sub1, ctx.font, 9) / 2,
    y, size: 9, font: ctx.font, color: COL_MUTED,
  });
  y -= 14;
  const sub2 = "Р А С С Р О Ч К А";
  ctx.page.drawText(sub2, {
    x: centerX - widthOf(sub2, ctx.font, 9) / 2,
    y, size: 9, font: ctx.font, color: COL_MUTED,
  });

  /* Халяль · без риба · мусавама */
  y -= 50;
  const halal = "✦  Х А Л Я Л Ь  ·  Б Е З   Р И Б А  ·  М У С А В А М А  ✦";
  ctx.page.drawText(halal, {
    x: centerX - widthOf(halal, ctx.font, 9) / 2,
    y, size: 9, font: ctx.font, color: COL_BRAND,
  });

  /* ДОГОВОР */
  y -= 60;
  const title = "Д О Г О В О Р";
  ctx.page.drawText(title, {
    x: centerX - widthOf(title, ctx.fontBold, 36) / 2,
    y, size: 36, font: ctx.fontBold, color: COL_TEXT,
  });
  y -= 22;
  const subtitle = "купли-продажи товара в рассрочку";
  ctx.page.drawText(subtitle, {
    x: centerX - widthOf(subtitle, ctx.font, 12) / 2,
    y, size: 12, font: ctx.font, color: COL_MUTED,
  });

  /* Тонкая разделительная линия */
  y -= 30;
  ctx.page.drawLine({
    start: { x: MARGIN_L + 80, y },
    end:   { x: PAGE_W - MARGIN_R - 80, y },
    color: COL_BRAND, thickness: 1,
  });

  /* № договора */
  y -= 70;
  const nLabel = "Н О М Е Р   Д О Г О В О Р А";
  ctx.page.drawText(nLabel, {
    x: MARGIN_L + 60, y, size: 8, font: ctx.font, color: COL_MUTED,
  });
  ctx.page.drawText(`№ ${data.contractNumber}`, {
    x: MARGIN_L + 60, y: y - 22, size: 14, font: ctx.fontBold, color: COL_TEXT,
  });
  ctx.page.drawLine({
    start: { x: MARGIN_L + 60, y: y - 32 },
    end:   { x: MARGIN_L + 240, y: y - 32 },
    color: COL_TEXT, thickness: 0.5,
  });

  /* Дата */
  const dLabel = "Д А Т А   П О Д П И С А Н И Я";
  ctx.page.drawText(dLabel, {
    x: PAGE_W - MARGIN_R - 240, y, size: 8, font: ctx.font, color: COL_MUTED,
  });
  ctx.page.drawText(`«${d.day}» ${d.month} ${d.year} г.`, {
    x: PAGE_W - MARGIN_R - 240, y: y - 22, size: 14, font: ctx.fontBold, color: COL_TEXT,
  });
  ctx.page.drawLine({
    start: { x: PAGE_W - MARGIN_R - 240, y: y - 32 },
    end:   { x: PAGE_W - MARGIN_R - 60,  y: y - 32 },
    color: COL_TEXT, thickness: 0.5,
  });

  /* Подвал на обложке */
  const fy = 130;
  const fLine1 = `Чеченская Республика, г. ${data.contractCity}`;
  ctx.page.drawText(fLine1, {
    x: centerX - widthOf(fLine1, ctx.font, 10) / 2,
    y: fy, size: 10, font: ctx.font, color: COL_MUTED,
  });
  const fLine2 = "finnice.ru  ·  +7 (928) 491-08-08";
  ctx.page.drawText(fLine2, {
    x: centerX - widthOf(fLine2, ctx.fontBold, 10) / 2,
    y: fy - 16, size: 10, font: ctx.fontBold, color: COL_BRAND,
  });
}

/* ══════════════════════════════════════════════════════
   ГЛАВНАЯ ФУНКЦИЯ
   ══════════════════════════════════════════════════════ */
export async function buildContractPdf(data: ContractData): Promise<Uint8Array> {
  const { regular, bold } = await loadFonts();

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const font     = await doc.embedFont(regular, { subset: true });
  const fontBold = await doc.embedFont(bold,    { subset: true });

  const firstPage = doc.addPage([PAGE_W, PAGE_H]);
  const ctx: Ctx = {
    doc, page: firstPage, pages: [firstPage], font, fontBold,
    y: PAGE_H - MARGIN_T, isCover: true,
  };

  const d            = dateToRuParts(data.contractDate);
  const passportDate = dateToRuParts(data.buyerPassportIssueDate);
  const sumWords     = rublesInWords(data.totalPrice);
  const downWords    = rublesInWords(data.downPayment);
  const remainWords  = rublesInWords(data.remainingPay);

  /* ────── Страница 1: обложка ────── */
  drawCoverPage(ctx, data, d);

  /* ────── Страница 2: преамбула + §1 + §2 ────── */
  newPage(ctx);

  drawPara(ctx, "ДОГОВОР КУПЛИ-ПРОДАЖИ ТОВАРА В РАССРОЧКУ", {
    bold: true, size: F_H1, align: "center", spacingAfter: 2,
  });
  drawPara(ctx, `№ ${data.contractNumber}  ·  от «${d.day}» ${d.month} ${d.year} г.`, {
    size: F_SMALL, align: "center", color: COL_MUTED, spacingAfter: 14,
  });

  drawMixed(ctx, [
    { text: `Общество с ограниченной ответственностью «${data.sellerCompanyName}» (ООО «${data.sellerCompanyName}»), в лице ` },
    { text: data.sellerDirectorFullName || "_______________________________________", bold: true },
    { text: ", действующего на основании " },
    { text: "___________________", bold: true },
    { text: ", именуемое в дальнейшем «Продавец», с одной стороны, и" },
  ]);

  drawMixed(ctx, [
    { text: "Гражданин(ка) Российской Федерации " },
    { text: data.buyerFullName, bold: true },
    { text: ", паспорт серия " }, { text: data.buyerPassportSeries, bold: true },
    { text: " номер " }, { text: data.buyerPassportNumber, bold: true },
    { text: ", выдан " }, { text: data.buyerPassportIssuedBy, bold: true },
    { text: ` «${passportDate.day}» ${passportDate.month} ${passportDate.year} г., код подразделения ` },
    { text: data.buyerPassportDeptCode, bold: true },
    { text: ", зарегистрирован(а) по адресу: " }, { text: data.buyerRegisterAddress, bold: true },
    { text: ", проживающий(ая) по адресу: " }, { text: data.buyerLivingAddress, bold: true },
    { text: ", телефон: " }, { text: data.buyerPhone, bold: true },
    ...(data.buyerEmail ? [{ text: ", email: " }, { text: data.buyerEmail, bold: true }] : []),
    { text: ", именуемый(ая) в дальнейшем «Покупатель», с другой стороны," },
  ]);

  drawPara(ctx, "именуемые совместно «Стороны», а по отдельности «Сторона», заключили настоящий Договор о нижеследующем.", { spacingAfter: 10 });

  drawCallout(ctx, {
    icon:   "◆",
    title:  "ПРИНЦИП СДЕЛКИ",
    body:   "Настоящий Договор является договором купли-продажи (мусавама / مساومة) с условием о рассрочке оплаты и не является договором займа или кредита. Цена Товара фиксирована, согласована Сторонами по их свободному волеизъявлению и не подлежит изменению в зависимости от срока оплаты. Договор не предусматривает начисления процентов, неустоек, штрафов или пеней.",
    bg:     COL_CALLOUT_BG,
    border: COL_CALLOUT_BR,
  });

  /* §1 ПРЕДМЕТ */
  drawSectionHead(ctx, "1. ПРЕДМЕТ ДОГОВОРА");
  drawPara(ctx, "1.1. Продавец, являясь собственником товара, указанного в пункте 1.2 настоящего Договора (далее — «Товар»), обязуется передать Товар в собственность Покупателя, а Покупатель обязуется принять Товар и уплатить за него установленную настоящим Договором цену в соответствии с Графиком платежей (Приложение № 1 к настоящему Договору, являющееся его неотъемлемой частью).");
  drawPara(ctx, data.productItems && data.productItems.length > 1
    ? "1.2. Характеристики Товаров (Товар представляет собой набор позиций ниже):"
    : "1.2. Характеристики Товара:");
  if (data.productItems && data.productItems.length > 0) {
    for (const it of data.productItems) {
      drawMixed(ctx, [
        { text: "•  Наименование: " }, { text: it.name, bold: true },
        { text: "  ·  Кол-во: " }, { text: `${it.qty} шт.`, bold: true },
        { text: "  ·  Цена: " }, { text: `${fmt(it.totalAmount)} ₽`, bold: true },
      ]);
    }
  } else {
    drawMixed(ctx, [{ text: "•  Наименование: " }, { text: data.productName, bold: true }]);
    drawMixed(ctx, [{ text: "•  Модель / артикул: " }, { text: data.productModel || "—", bold: true }]);
    drawMixed(ctx, [{ text: "•  Количество: " }, { text: `${data.productQuantity} шт.`, bold: true }]);
  }
  drawPara(ctx, "1.3. Продавец заявляет и гарантирует, что на момент заключения настоящего Договора Товар принадлежит Продавцу на праве собственности, приобретён им у поставщика на возмездной основе, свободен от прав и притязаний третьих лиц, не находится под арестом, в залоге или ином обременении.");

  /* §2 ПРИРОДА */
  drawSectionHead(ctx, "2. ПРИРОДА ДОГОВОРА И ЗАЯВЛЕНИЯ СТОРОН");
  drawPara(ctx, "2.1. Стороны признают и подтверждают, что настоящий Договор является договором купли-продажи Товара с условием о рассрочке оплаты и НЕ является договором займа, кредита, потребительского кредита (займа) или иной финансовой сделкой, влекущей возникновение у Покупателя денежного обязательства, не обусловленного передачей встречного товарного предоставления.");
  drawPara(ctx, "2.2. Цена Товара, установленная настоящим Договором, является фиксированной и согласованной Сторонами по их взаимному свободному волеизъявлению. Цена Товара не подлежит изменению в зависимости от срока оплаты, ставок процента, инфляции, изменения курса валют или иных обстоятельств.");
  drawPara(ctx, "2.3. Настоящим Договором НЕ предусматривается начисление каких-либо процентов, неустоек, штрафов, пеней или иных дополнительных денежных сумм в пользу Продавца ни за пользование рассрочкой, ни за нарушение Покупателем сроков оплаты. Единственным денежным обязательством Покупателя по настоящему Договору является обязательство уплатить цену Товара в порядке и сроки, установленные настоящим Договором.");

  /* §3 ПРАВА И ОБЯЗАННОСТИ */
  drawSectionHead(ctx, "3. ПРАВА И ОБЯЗАННОСТИ СТОРОН");
  drawPara(ctx, "3.1. Продавец обязан:", { bold: true });
  drawPara(ctx, "3.1.1. Передать Покупателю Товар надлежащего качества в количестве, ассортименте и комплектации, соответствующих условиям настоящего Договора, в течение 5 (пяти) рабочих дней с момента заключения настоящего Договора.");
  drawPara(ctx, "3.1.2. Передать Товар в упаковке, обеспечивающей его сохранность при обычных условиях хранения и транспортирования. Одновременно с передачей Товара передать Покупателю все принадлежности и относящиеся к Товару документы (технический паспорт, инструкцию по эксплуатации, гарантийный талон и иные документы).");
  drawPara(ctx, "3.1.3. Подписать Акт приёма-передачи Товара, свидетельствующий о передаче Товара Покупателю.");
  drawPara(ctx, "3.2. Продавец имеет право:", { bold: true });
  drawPara(ctx, "3.2.1. Требовать своевременной и полной оплаты Товара Покупателем в соответствии с Графиком платежей.");
  drawPara(ctx, "3.2.2. В случаях, предусмотренных разделом 7 настоящего Договора, требовать досрочной уплаты Покупателем оставшейся неоплаченной части цены Товара.");
  drawPara(ctx, "3.2.3. В случаях, предусмотренных разделом 7 настоящего Договора, обращать взыскание на Предмет залога в порядке, предусмотренном разделом 8 настоящего Договора.");
  drawPara(ctx, "3.3. Покупатель обязан:", { bold: true });
  drawPara(ctx, "3.3.1. Принять Товар от Продавца по Акту приёма-передачи в течение 5 (пяти) рабочих дней с момента подписания настоящего Договора.");
  drawPara(ctx, "3.3.2. Своевременно и в полном объёме производить оплату Товара в соответствии с Графиком платежей.");
  drawPara(ctx, "3.3.3. Поскольку Товар с момента его передачи Покупателю находится в залоге у Продавца в обеспечение исполнения обязательств Покупателя по оплате (раздел 5 настоящего Договора), Покупатель как залогодатель не вправе без письменного согласия Продавца как залогодержателя отчуждать Товар (продавать, дарить, передавать в качестве вклада в уставный капитал и т.д.), передавать его в последующий залог, аренду, безвозмездное пользование или иное обременение третьим лицам до прекращения залога в связи с полной оплатой Товара.");
  drawPara(ctx, "3.3.4. Обеспечивать сохранность Товара, нести расходы, связанные с его содержанием и эксплуатацией.");
  drawPara(ctx, "3.3.5. Не изменять адрес нахождения Товара, указанный Покупателем при заключении настоящего Договора, либо в письменной форме уведомлять Продавца об изменении места нахождения и использования Товара в течение 5 (пяти) рабочих дней с момента такого изменения.");
  drawPara(ctx, "3.3.6. Уведомлять Продавца об утрате, повреждении или ином ухудшении состояния Товара в течение 5 (пяти) рабочих дней с момента наступления соответствующего обстоятельства.");
  drawPara(ctx, "3.4. Покупатель имеет право:", { bold: true });
  drawPara(ctx, "3.4.1. Требовать замены Товара ненадлежащего качества в соответствии с законодательством Российской Федерации до момента подписания Акта приёма-передачи Товара.");
  drawPara(ctx, "3.4.2. Досрочно вносить платежи в счёт оплаты Товара полностью или в части без уплаты каких-либо дополнительных сумм.");

  /* §4 ЦЕНА */
  drawSectionHead(ctx, "4. ЦЕНА ДОГОВОРА И ПОРЯДОК РАСЧЁТОВ");
  drawPriceTable(ctx, data, { sum: sumWords, down: downWords, remain: remainWords });
  drawPara(ctx, "4.1. Полная цена Товара по настоящему Договору указана в таблице выше и составляет согласованную Сторонами фиксированную сумму.");
  drawPara(ctx, "4.2. Покупатель уплачивает Продавцу первоначальный взнос в указанном выше размере в день подписания настоящего Договора.");
  drawPara(ctx, "4.3. Оставшуюся часть цены Товара Покупатель уплачивает Продавцу в рассрочку в соответствии с Графиком платежей (Приложение № 1 к настоящему Договору).");
  drawPara(ctx, "4.4. Полная цена Товара подлежит уплате Покупателем в течение указанного в таблице срока рассрочки, но в любом случае не позднее чем через 12 (двенадцать) месяцев с момента заключения настоящего Договора.");
  drawPara(ctx, "4.5. Оплата Товара производится путём внесения денежных средств в кассу Продавца или путём безналичного перечисления денежных средств на расчётный счёт Продавца, указанный в разделе 12 настоящего Договора. Датой оплаты считается дата поступления денежных средств в кассу или на расчётный счёт Продавца.");
  drawPara(ctx, "4.6. Покупатель вправе досрочно уплатить всю оставшуюся неоплаченную часть цены Товара или любую её часть. Досрочная уплата не влечёт за собой автоматического уменьшения цены Товара, установленной настоящим Договором. Продавец вправе по своему усмотрению предоставить Покупателю скидку при досрочной оплате; предоставление такой скидки является правом, а не обязанностью Продавца.");

  /* §5 ОБЕСПЕЧЕНИЕ */
  drawSectionHead(ctx, "5. ОБЕСПЕЧЕНИЕ ИСПОЛНЕНИЯ ОБЯЗАТЕЛЬСТВ");
  drawPara(ctx, "5.1. Исполнение обязательств Покупателя по оплате цены Товара в соответствии с Графиком платежей обеспечивается залогом Товара (далее — «Предмет залога»).");
  drawPara(ctx, "5.2. С момента передачи Товара Покупателю и до момента полной оплаты Покупателем цены Товара Товар находится в залоге у Продавца в обеспечение исполнения Покупателем его обязательств по настоящему Договору. Продавец является залогодержателем со всеми правами, предусмотренными гражданским законодательством Российской Федерации и настоящим Договором.");
  drawPara(ctx, "5.3. Подписанием настоящего Договора Покупатель предоставляет приобретённый по настоящему Договору Товар в залог Продавцу до момента полного погашения цены Товара.");
  drawPara(ctx, "5.4. Покупатель обязан обеспечивать сохранность Предмета залога и нести расходы, связанные с его содержанием.");
  drawPara(ctx, "5.5. Покупатель не вправе без письменного согласия Продавца отчуждать Предмет залога, передавать его в пользование третьим лицам или иным образом распоряжаться им до полной оплаты его стоимости.");

  /* §6 ОТВЕТСТВЕННОСТЬ */
  drawSectionHead(ctx, "6. ОТВЕТСТВЕННОСТЬ СТОРОН");
  drawPara(ctx, "6.1. Стороны несут ответственность за неисполнение или ненадлежащее исполнение обязательств по настоящему Договору в соответствии с действующим законодательством Российской Федерации и условиями настоящего Договора.");
  drawCallout(ctx, {
    icon:   "⚠",
    title:  "ВАЖНО",
    body:   "Настоящим Договором НЕ предусматривается начисление неустойки, пени, штрафа, процентов или иных финансовых санкций в пользу Продавца за просрочку оплаты Покупателем платежей по Графику платежей. Единственными правовыми последствиями просрочки оплаты со стороны Покупателя являются возникновение у Продавца прав, предусмотренных разделом 7 и разделом 8 настоящего Договора, а также право Продавца требовать возмещения документально подтверждённых убытков в соответствии с законодательством Российской Федерации.",
    bg:     COL_WARN_BG,
    border: COL_WARN_BR,
  });
  drawPara(ctx, "6.2. Продавец отвечает за недостатки Товара, возникшие до его передачи Покупателю и подписания Акта приёма-передачи.");
  drawPara(ctx, "6.3. Риск случайной гибели или случайного повреждения Товара переходит к Покупателю с момента подписания Акта приёма-передачи Товара.");

  /* §7 РАСТОРЖЕНИЕ */
  drawSectionHead(ctx, "7. РАСТОРЖЕНИЕ ДОГОВОРА И ДОСРОЧНОЕ ИСТРЕБОВАНИЕ ОПЛАТЫ");
  drawPara(ctx, "7.1. Ни одна из Сторон не вправе в одностороннем порядке отказаться от исполнения обязательств по настоящему Договору, за исключением случаев, прямо предусмотренных настоящим Договором или законом.");
  drawPara(ctx, "7.2. Настоящий Договор может быть расторгнут по письменному соглашению Сторон.");
  drawPara(ctx, "7.3. При нарушении Покупателем сроков оплаты Товара, предусмотренных Графиком платежей, более чем на 2 (два) месяца либо при задержке платежа более 2 (двух) раз Продавец вправе по своему выбору:");
  drawPara(ctx, "7.3.1. потребовать от Покупателя досрочной уплаты всей оставшейся неоплаченной части цены Товара; и/или");
  drawPara(ctx, "7.3.2. обратить взыскание на Предмет залога в порядке, предусмотренном разделом 8 настоящего Договора; и/или");
  drawPara(ctx, "7.3.3. в одностороннем порядке отказаться от исполнения настоящего Договора, направив Покупателю письменное уведомление об отказе от Договора.");
  drawPara(ctx, "7.4. При оценке нарушения Покупателем сроков оплаты Продавец принимает во внимание обстоятельства, в связи с которыми допущена просрочка. В случае если просрочка вызвана объективными жизненными обстоятельствами Покупателя (тяжёлая болезнь, утрата трудоспособности, потеря источника дохода и иные подобные обстоятельства), Стороны вправе по соглашению заключить дополнительное соглашение об отсрочке или реструктуризации оставшихся платежей.");

  /* §8 ЗАЛОГ */
  drawSectionHead(ctx, "8. ОБРАЩЕНИЕ ВЗЫСКАНИЯ НА ПРЕДМЕТ ЗАЛОГА");
  drawPara(ctx, "8.1. В случаях, предусмотренных пунктом 7.3 настоящего Договора, Продавец вправе обратить взыскание на Предмет залога во внесудебном порядке путём оставления Предмета залога за собой по справедливой рыночной стоимости либо путём его реализации третьим лицам, в порядке, предусмотренном гражданским законодательством Российской Федерации и настоящим Договором.");
  drawPara(ctx, "8.2. Денежные средства, вырученные Продавцом от реализации Предмета залога, либо стоимость Предмета залога при оставлении его Продавцом за собой направляются на удовлетворение требований Продавца по настоящему Договору в следующем порядке:");
  drawPara(ctx, "8.2.1. в первую очередь — на возмещение документально подтверждённых расходов Продавца, связанных с обращением взыскания на Предмет залога и его реализацией;");
  drawPara(ctx, "8.2.2. во вторую очередь — на погашение оставшейся неоплаченной части цены Товара по настоящему Договору.");
  drawCallout(ctx, {
    icon:   "↺",
    title:  "ВОЗВРАТ ИЗЛИШКА",
    body:   "Денежные средства (либо часть стоимости Предмета залога), оставшиеся после удовлетворения требований Продавца, подлежат возврату Покупателю в полном объёме в течение 10 (десяти) рабочих дней с момента реализации Предмета залога либо его оставления Продавцом за собой. Удержание Продавцом каких-либо сумм сверх размера фактических требований по настоящему Договору не допускается.",
    bg:     COL_CALLOUT_BG,
    border: COL_CALLOUT_BR,
  });
  drawPara(ctx, "8.3. В случае если денежных средств, вырученных от реализации Предмета залога (либо стоимости Предмета залога при оставлении его Продавцом за собой), недостаточно для покрытия оставшейся неоплаченной части цены Товара и расходов Продавца, разница остаётся задолженностью Покупателя перед Продавцом и подлежит уплате Покупателем в сроки, согласованные Сторонами, либо в порядке, установленном законодательством Российской Федерации.");

  /* §9 ФОРС-МАЖОР */
  drawSectionHead(ctx, "9. ОБСТОЯТЕЛЬСТВА НЕПРЕОДОЛИМОЙ СИЛЫ");
  drawPara(ctx, "9.1. При наступлении обстоятельств непреодолимой силы (форс-мажор), а именно: пожара, наводнения, землетрясения и иных стихийных бедствий, военных действий, эпидемий, актов государственных органов, препятствующих исполнению обязательств, и иных независящих от Сторон обстоятельств, препятствующих полному или частичному исполнению любой из Сторон обязательств по настоящему Договору, срок исполнения обязательств по настоящему Договору отодвигается соразмерно времени, в течение которого будут действовать такие обстоятельства.");
  drawPara(ctx, "9.2. Сторона, для которой создалась невозможность исполнения обязательств вследствие обстоятельств непреодолимой силы, обязана в течение 10 (десяти) рабочих дней с момента наступления таких обстоятельств уведомить другую Сторону в письменной форме о наступлении и предполагаемом сроке действия таких обстоятельств.");

  /* §10 СПОРЫ */
  drawSectionHead(ctx, "10. РАЗРЕШЕНИЕ СПОРОВ");
  drawPara(ctx, "10.1. Все споры и разногласия, которые могут возникнуть между Сторонами в ходе исполнения ими своих обязательств по настоящему Договору, разрешаются Сторонами путём переговоров, в том числе с участием медиаторов.");
  drawPara(ctx, "10.2. При невозможности урегулирования путём переговоров все споры, разногласия или требования, возникающие из настоящего Договора или в связи с ним, подлежат разрешению в судебном порядке в соответствии с действующим законодательством Российской Федерации.");
  drawPara(ctx, "10.3. Во всём остальном, что не урегулировано настоящим Договором, Стороны руководствуются действующим законодательством Российской Федерации.");

  /* §11 ЗАКЛЮЧИТЕЛЬНЫЕ */
  drawSectionHead(ctx, "11. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ");
  drawPara(ctx, "11.1. Настоящий Договор вступает в силу с момента его подписания Сторонами и действует до полного исполнения Сторонами своих обязательств по нему.");
  drawPara(ctx, "11.2. Все изменения и дополнения к настоящему Договору, уведомления и сообщения по нему действительны лишь в том случае, если они совершены в письменной форме и подписаны уполномоченными представителями Сторон.");
  drawPara(ctx, "11.3. В случае изменения любого из указанных в настоящем Договоре реквизитов соответствующая Сторона обязуется уведомить другую Сторону любым доступным способом в течение 5 (пяти) рабочих дней с момента наступления такого изменения.");
  drawPara(ctx, "11.4. Настоящий Договор составлен в двух экземплярах, имеющих равную юридическую силу, по одному для каждой из Сторон.");
  drawPara(ctx, "11.5. Приложения, являющиеся неотъемлемой частью настоящего Договора:");
  drawPara(ctx, "— Приложение № 1: График платежей;");
  drawPara(ctx, "— Приложение № 2: Акт приёма-передачи Товара.");

  /* §12 РЕКВИЗИТЫ */
  drawSectionHead(ctx, "12. РЕКВИЗИТЫ И ПОДПИСИ СТОРОН");
  drawRequisites(ctx, data, passportDate);

  /* ────── ПРИЛОЖЕНИЕ № 1: ГРАФИК ПЛАТЕЖЕЙ ────── */
  newPage(ctx);
  drawPara(ctx, "П Р И Л О Ж Е Н И Е   №   1", {
    bold: true, size: F_NORMAL, align: "right", color: COL_TEXT, spacingAfter: 2,
  });
  drawPara(ctx, `к Договору купли-продажи товара в рассрочку № ${data.contractNumber} от «${d.day}» ${d.month} ${d.year} г.`, {
    size: F_TINY, align: "right", color: COL_MUTED, spacingAfter: 18,
  });
  drawPara(ctx, "ГРАФИК ПЛАТЕЖЕЙ", { bold: true, size: F_H1 + 4, align: "center", spacingAfter: 4 });
  drawPara(ctx, `г. ${data.contractCity}  ·  «${d.day}» ${d.month} ${d.year} г.`, {
    size: F_SMALL, align: "center", color: COL_MUTED, spacingAfter: 16,
  });

  drawMixed(ctx, [{ text: "Покупатель: " }, { text: data.buyerFullName, bold: true }]);
  drawMixed(ctx, [{ text: "Полная цена Товара: " }, { text: `${fmt(data.totalPrice)} руб. 00 коп.`, bold: true }], { spacingAfter: 10 });

  drawScheduleTable(ctx, data.schedule, data.totalPrice);
  ctx.y -= 12;
  drawMixed(ctx, [
    { text: "Всего к оплате: " },
    { text: `${fmt(data.totalPrice)} `, bold: true },
    { text: `(${sumWords}) рублей 00 копеек.` },
  ]);
  drawPara(ctx, `Настоящий График платежей является неотъемлемой частью Договора № ${data.contractNumber} от «${d.day}» ${d.month} ${d.year} г. и составлен в двух экземплярах, имеющих равную юридическую силу, по одному для каждой из Сторон.`, {
    size: F_TINY, color: COL_MUTED, spacingAfter: 24,
  });

  /* Подписи под графиком */
  const colHalf = (PAGE_W - MARGIN_L - MARGIN_R) / 2;
  ensureSpace(ctx, 50);
  ctx.page.drawText("ПРОДАВЕЦ", { x: MARGIN_L, y: ctx.y, size: F_NORMAL, font: ctx.fontBold, color: COL_BRAND });
  ctx.page.drawText("ПОКУПАТЕЛЬ", { x: MARGIN_L + colHalf, y: ctx.y, size: F_NORMAL, font: ctx.fontBold, color: COL_BRAND });
  ctx.y -= 22;
  ctx.page.drawLine({ start: { x: MARGIN_L, y: ctx.y }, end: { x: MARGIN_L + colHalf - 20, y: ctx.y }, color: COL_TEXT, thickness: 0.5 });
  ctx.page.drawLine({ start: { x: MARGIN_L + colHalf, y: ctx.y }, end: { x: PAGE_W - MARGIN_R, y: ctx.y }, color: COL_TEXT, thickness: 0.5 });
  ctx.y -= 14;
  ctx.page.drawText("подпись / Ф.И.О.    М.П.", { x: MARGIN_L, y: ctx.y, size: F_TINY, font: ctx.font, color: COL_MUTED });
  ctx.page.drawText("подпись / Ф.И.О.", { x: MARGIN_L + colHalf, y: ctx.y, size: F_TINY, font: ctx.font, color: COL_MUTED });
  ctx.y -= 14;

  /* ────── ПРИЛОЖЕНИЕ № 2: АКТ ────── */
  newPage(ctx);
  drawPara(ctx, "П Р И Л О Ж Е Н И Е   №   2", {
    bold: true, size: F_NORMAL, align: "right", color: COL_TEXT, spacingAfter: 2,
  });
  drawPara(ctx, `к Договору купли-продажи товара в рассрочку № ${data.contractNumber} от «${d.day}» ${d.month} ${d.year} г.`, {
    size: F_TINY, align: "right", color: COL_MUTED, spacingAfter: 18,
  });
  drawPara(ctx, "АКТ", { bold: true, size: F_H1 + 8, align: "center", spacingAfter: 2 });
  drawPara(ctx, "приёма-передачи товара", { size: F_NORMAL, align: "center", color: COL_MUTED, spacingAfter: 16 });

  drawMixed(ctx, [
    { text: `г. ${data.contractCity}` },
    { text: "                                                                                       " },
    { text: `«${d.day}» ${d.month} ${d.year} г.` },
  ]);
  ctx.y -= 8;

  drawMixed(ctx, [
    { text: `Общество с ограниченной ответственностью «${data.sellerCompanyName}», в лице ` },
    { text: data.sellerDirectorFullName || "_______________________________________", bold: true },
    { text: ", действующего на основании ___________________, именуемое в дальнейшем «Продавец», с одной стороны, и" },
  ]);
  drawMixed(ctx, [
    { text: "Гражданин(ка) " }, { text: data.buyerFullName, bold: true },
    { text: ", именуемый(ая) в дальнейшем «Покупатель», с другой стороны," },
  ]);
  drawPara(ctx, "именуемые совместно «Стороны», а по отдельности «Сторона», составили настоящий Акт о нижеследующем:", { spacingAfter: 10 });

  drawMixed(ctx, [
    { text: "1. В соответствии с условиями Договора купли-продажи товара в рассрочку № " },
    { text: data.contractNumber, bold: true },
    { text: ` от «${d.day}» ${d.month} ${d.year} г. (далее — «Договор») Продавец передал, а Покупатель принял Товар следующего ассортимента и количества:` },
  ]);
  ctx.y -= 4;

  const actItems = data.productItems && data.productItems.length > 0
    ? data.productItems
    : [{ name: data.productName, qty: data.productQuantity, totalAmount: data.totalPrice }];
  drawActTable(ctx, actItems);
  ctx.y -= 10;

  drawMixed(ctx, [
    { text: "2. Стоимость переданного Товара в соответствии с условиями Договора составляет " },
    { text: `${fmt(data.totalPrice)} `, bold: true },
    { text: `(${sumWords}) рублей 00 копеек.` },
  ]);
  drawPara(ctx, "3. Принятый Покупателем Товар обладает качеством, количеством, ассортиментом и комплектацией, соответствующими условиям Договора. Покупатель не имеет претензий к принятому Товару.");
  drawPara(ctx, "4. Одновременно с передачей Товара Продавец передал Покупателю принадлежности и относящиеся к Товару документы: ___________________________________________.");

  drawCallout(ctx, {
    icon:   "🔒",
    title:  "ПЕРЕХОД РИСКА И ЗАЛОГ",
    body:   "С момента подписания настоящего Акта риск случайной гибели и случайного повреждения Товара переходит к Покупателю. Товар находится в залоге у Продавца до момента полной оплаты его стоимости в соответствии с условиями Договора.",
    bg:     COL_CALLOUT_BG,
    border: COL_CALLOUT_BR,
  });

  drawPara(ctx, "5. Настоящий Акт составлен в двух экземплярах, имеющих равную юридическую силу, по одному экземпляру для каждой из Сторон, и является неотъемлемой частью Договора.", { spacingAfter: 30 });

  /* Подписи под актом */
  ensureSpace(ctx, 50);
  ctx.page.drawText("ПРОДАВЕЦ", { x: MARGIN_L, y: ctx.y, size: F_NORMAL, font: ctx.fontBold, color: COL_BRAND });
  ctx.page.drawText("ПОКУПАТЕЛЬ", { x: MARGIN_L + colHalf, y: ctx.y, size: F_NORMAL, font: ctx.fontBold, color: COL_BRAND });
  ctx.y -= 22;
  ctx.page.drawLine({ start: { x: MARGIN_L, y: ctx.y }, end: { x: MARGIN_L + colHalf - 20, y: ctx.y }, color: COL_TEXT, thickness: 0.5 });
  ctx.page.drawLine({ start: { x: MARGIN_L + colHalf, y: ctx.y }, end: { x: PAGE_W - MARGIN_R, y: ctx.y }, color: COL_TEXT, thickness: 0.5 });
  ctx.y -= 14;
  ctx.page.drawText("подпись / Ф.И.О.    М.П.", { x: MARGIN_L, y: ctx.y, size: F_TINY, font: ctx.font, color: COL_MUTED });
  ctx.page.drawText("подпись / Ф.И.О.", { x: MARGIN_L + colHalf, y: ctx.y, size: F_TINY, font: ctx.font, color: COL_MUTED });

  /* ────── Подвалы со страничной нумерацией ────── */
  const total = ctx.pages.length;
  for (let i = 0; i < ctx.pages.length; i++) {
    /* Обложка тоже получает подвал — это как в PDF-образце */
    const oldPage = ctx.page;
    ctx.page = ctx.pages[i];
    drawFooterStrip(ctx, i + 1, total);
    ctx.page = oldPage;
  }

  return await doc.save();
}
