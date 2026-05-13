/**
 * lib/contract/build-contract-pdf.ts
 *
 * PDF-версия договора через pdf-lib + DejaVu Sans (TTF с кириллицей).
 * Используется для скачивания из ЛК клиента (только PDF, без DOCX).
 *
 * Шрифты лежат в public/fonts/, читаются из файловой системы во время
 * выполнения функции.
 */

import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "node:fs/promises";
import path from "node:path";

import type { ContractData } from "./build-contract";
import { dateToRuParts, rublesInWords } from "./numbers-to-words";

const PAGE_W   = 595.28;  // A4
const PAGE_H   = 841.89;
const MARGIN_L = 56;
const MARGIN_R = 56;
const MARGIN_T = 56;
const MARGIN_B = 56;
const LINE_H   = 14;
const FONT_SIZE_NORMAL = 10;
const FONT_SIZE_SMALL  = 9;
const FONT_SIZE_HEADER = 11;
const FONT_SIZE_TITLE  = 14;

interface Ctx {
  doc:      PDFDocument;
  page:     PDFPage;
  font:     PDFFont;
  fontBold: PDFFont;
  y:        number;
}

/* ── Загрузка шрифтов ───────────────────────────────── */
let cachedFonts: { regular: ArrayBuffer; bold: ArrayBuffer } | null = null;
async function loadFonts(): Promise<{ regular: ArrayBuffer; bold: ArrayBuffer }> {
  if (cachedFonts) return cachedFonts;
  const fontsDir = path.join(process.cwd(), "public", "fonts");
  const [regular, bold] = await Promise.all([
    fs.readFile(path.join(fontsDir, "DejaVuSans.ttf")),
    fs.readFile(path.join(fontsDir, "DejaVuSans-Bold.ttf")),
  ]);
  cachedFonts = {
    regular: regular.buffer.slice(regular.byteOffset, regular.byteOffset + regular.byteLength) as ArrayBuffer,
    bold:    bold.buffer.slice(bold.byteOffset, bold.byteOffset + bold.byteLength) as ArrayBuffer,
  };
  return cachedFonts;
}

/* ── Низкоуровневая отрисовка с переносом строк ─────── */

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    const width = font.widthOfTextAtSize(test, size);
    if (width <= maxWidth) cur = test;
    else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

function newPage(ctx: Ctx): void {
  ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
  ctx.y = PAGE_H - MARGIN_T;
}

function ensureSpace(ctx: Ctx, neededLines: number): void {
  const needed = neededLines * LINE_H;
  if (ctx.y - needed < MARGIN_B) newPage(ctx);
}

/** Параграф (с переносами и опциональным жирным/выравниванием). */
function drawParagraph(
  ctx: Ctx, text: string,
  opts: { bold?: boolean; size?: number; align?: "left" | "center"; spacingAfter?: number } = {},
): void {
  const size = opts.size ?? FONT_SIZE_NORMAL;
  const font = opts.bold ? ctx.fontBold : ctx.font;
  const maxW = PAGE_W - MARGIN_L - MARGIN_R;
  const lines = text === "" ? [""] : wrapText(text, font, size, maxW);
  for (const line of lines) {
    ensureSpace(ctx, 1);
    const lineWidth = font.widthOfTextAtSize(line, size);
    const x = opts.align === "center"
      ? (PAGE_W - lineWidth) / 2
      : MARGIN_L;
    ctx.page.drawText(line, { x, y: ctx.y - size, size, font, color: rgb(0, 0, 0) });
    ctx.y -= LINE_H;
  }
  if (opts.spacingAfter) ctx.y -= opts.spacingAfter;
}

/** Заголовок раздела */
function drawHeader(ctx: Ctx, text: string): void {
  ctx.y -= 6;
  drawParagraph(ctx, text, { bold: true, size: FONT_SIZE_HEADER, spacingAfter: 4 });
}

/** Параграф из mixed runs (часть жирная, часть нет). */
function drawMixed(ctx: Ctx, runs: Array<{ text: string; bold?: boolean }>): void {
  const size = FONT_SIZE_NORMAL;
  const maxW = PAGE_W - MARGIN_L - MARGIN_R;

  /* Разворачиваем runs в массив { word, bold }, потом собираем строки */
  const tokens: Array<{ text: string; bold: boolean }> = [];
  for (const run of runs) {
    const parts = run.text.split(/(\s+)/).filter(Boolean);
    for (const part of parts) tokens.push({ text: part, bold: Boolean(run.bold) });
  }

  type Token = { text: string; bold: boolean; width: number };
  const measured: Token[] = tokens.map(t => ({
    ...t,
    width: (t.bold ? ctx.fontBold : ctx.font).widthOfTextAtSize(t.text, size),
  }));

  const lines: Token[][] = [];
  let curLine: Token[] = [];
  let curWidth = 0;
  for (const tok of measured) {
    const newWidth = curWidth + tok.width;
    if (newWidth <= maxW || curLine.length === 0) {
      curLine.push(tok);
      curWidth = newWidth;
    } else {
      lines.push(curLine);
      /* Не начинаем строку с пробела */
      if (tok.text.trim() === "") { curLine = []; curWidth = 0; }
      else { curLine = [tok]; curWidth = tok.width; }
    }
  }
  if (curLine.length > 0) lines.push(curLine);

  for (const line of lines) {
    ensureSpace(ctx, 1);
    let x = MARGIN_L;
    for (const tok of line) {
      const font = tok.bold ? ctx.fontBold : ctx.font;
      ctx.page.drawText(tok.text, { x, y: ctx.y - size, size, font, color: rgb(0, 0, 0) });
      x += tok.width;
    }
    ctx.y -= LINE_H;
  }
}

/** Простая таблица для графика платежей */
function drawScheduleTable(ctx: Ctx, schedule: ContractData["schedule"]): void {
  const colW = [40, 110, 130, 200];     // sums to 480
  const tableW = colW.reduce((s, w) => s + w, 0);
  const startX = MARGIN_L + (PAGE_W - MARGIN_L - MARGIN_R - tableW) / 2;
  const size = FONT_SIZE_SMALL;
  const rowH = 16;

  const drawCell = (x: number, w: number, text: string, bold = false) => {
    const font = bold ? ctx.fontBold : ctx.font;
    /* рамка */
    ctx.page.drawRectangle({ x, y: ctx.y - rowH, width: w, height: rowH, borderColor: rgb(0.6, 0.6, 0.6), borderWidth: 0.5 });
    /* текст с обрезкой по ширине */
    const padding = 4;
    const maxW = w - padding * 2;
    let drawText = text;
    while (font.widthOfTextAtSize(drawText, size) > maxW && drawText.length > 0) {
      drawText = drawText.slice(0, -1);
    }
    ctx.page.drawText(drawText, { x: x + padding, y: ctx.y - rowH + 4, size, font, color: rgb(0, 0, 0) });
  };

  /* Header */
  ensureSpace(ctx, 2);
  const heads = ["№", "Дата платежа", "Сумма (₽)", "Назначение"];
  let cx = startX;
  for (let i = 0; i < heads.length; i++) {
    drawCell(cx, colW[i], heads[i], true);
    cx += colW[i];
  }
  ctx.y -= rowH;

  /* Rows */
  for (const row of schedule) {
    ensureSpace(ctx, 2);
    cx = startX;
    const dt = dateToRuParts(row.date);
    const dateStr = `${dt.day}.${String(new Date(row.date).getMonth() + 1).padStart(2, "0")}.${dt.year}`;
    const cells = [
      String(row.n),
      dateStr,
      Math.round(row.amount).toLocaleString("ru-RU"),
      row.purpose,
    ];
    for (let i = 0; i < cells.length; i++) {
      drawCell(cx, colW[i], cells[i], false);
      cx += colW[i];
    }
    ctx.y -= rowH;
  }
}

/* ────────────────────────────────────────────────────── */

export async function buildContractPdf(data: ContractData): Promise<Uint8Array> {
  const { regular, bold } = await loadFonts();

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const font     = await doc.embedFont(regular, { subset: true });
  const fontBold = await doc.embedFont(bold,    { subset: true });

  const page = doc.addPage([PAGE_W, PAGE_H]);
  const ctx: Ctx = { doc, page, font, fontBold, y: PAGE_H - MARGIN_T };

  const d = dateToRuParts(data.contractDate);
  const passport = `${data.buyerPassportSeries} ${data.buyerPassportNumber}`;
  const passportDate = dateToRuParts(data.buyerPassportIssueDate);
  const sumWords = rublesInWords(data.totalPrice);
  const downWords = rublesInWords(data.downPayment);
  const remainingWords = rublesInWords(data.remainingPay);

  /* ── Шапка ───────────────────────────────────────── */
  drawParagraph(ctx, "ДОГОВОР", { bold: true, size: FONT_SIZE_TITLE, align: "center" });
  drawParagraph(ctx, `купли-продажи товара в рассрочку № ${data.contractNumber}`, { bold: true, size: FONT_SIZE_HEADER, align: "center", spacingAfter: 8 });
  drawMixed(ctx, [
    { text: `г. ${data.contractCity}` },
    { text: `                                                                                                  ` },
    { text: `«${d.day}» ${d.month} ${d.year} г.` },
  ]);
  ctx.y -= 6;

  /* ── Преамбула ──────────────────────────────────── */
  drawMixed(ctx, [
    { text: `Компания «${data.sellerCompanyName}», в лице ` },
    { text: data.sellerDirectorFullName || "генерального директора ___________________", bold: true },
    { text: `, именуемая в дальнейшем «Продавец», с одной стороны, и` },
  ]);
  drawMixed(ctx, [
    { text: `Гражданин(ка) Российской Федерации ` },
    { text: data.buyerFullName, bold: true },
    { text: `, паспорт серия ` },
    { text: passport, bold: true },
    { text: `, выдан ` },
    { text: data.buyerPassportIssuedBy, bold: true },
    { text: ` «${passportDate.day}» ${passportDate.month} ${passportDate.year} г., код подразделения ` },
    { text: data.buyerPassportDeptCode, bold: true },
    { text: `, зарегистрирован(а) по адресу: ` },
    { text: data.buyerRegisterAddress, bold: true },
    { text: `, проживающий(ая) по адресу: ` },
    { text: data.buyerLivingAddress, bold: true },
    { text: `, телефон: ` },
    { text: data.buyerPhone, bold: true },
    ...(data.buyerEmail ? [{ text: ", email: " }, { text: data.buyerEmail, bold: true }] : []),
    { text: `, именуемый(ая) в дальнейшем «Покупатель», с другой стороны,` },
  ]);
  drawParagraph(ctx, "именуемые совместно «Стороны», а по отдельности «Сторона», заключили настоящий Договор о нижеследующем.", { spacingAfter: 6 });

  /* ── 1. ПРЕДМЕТ ─────────────────────────────────── */
  drawHeader(ctx, "1. ПРЕДМЕТ ДОГОВОРА");
  drawParagraph(ctx, "1.1. Продавец, являясь собственником товара, указанного в пункте 1.2 настоящего Договора (далее — «Товар»), обязуется передать Товар в собственность Покупателя, а Покупатель обязуется принять Товар и уплатить за него установленную настоящим Договором цену в соответствии с Графиком платежей (Приложение № 1, являющееся неотъемлемой частью).");
  if (data.productItems && data.productItems.length > 0) {
    drawParagraph(ctx, data.productItems.length > 1
      ? "1.2. Характеристики Товаров (Товар представляет собой набор позиций ниже):"
      : "1.2. Характеристики Товара:");
    for (const it of data.productItems) {
      drawMixed(ctx, [
        { text: "•  Наименование: " }, { text: it.name, bold: true },
        { text: "  ·  Количество: " }, { text: `${it.qty} шт.`, bold: true },
        { text: "  ·  Цена позиции: " }, { text: `${Math.round(it.totalAmount).toLocaleString("ru-RU")} ₽`, bold: true },
      ]);
    }
  } else {
    drawParagraph(ctx, "1.2. Характеристики Товара:");
    drawMixed(ctx, [{ text: "•  Наименование: " }, { text: data.productName, bold: true }]);
    drawMixed(ctx, [{ text: "•  Модель / артикул: " }, { text: data.productModel || "—", bold: true }]);
    drawMixed(ctx, [{ text: "•  Количество: " }, { text: `${data.productQuantity} шт.`, bold: true }]);
  }
  drawParagraph(ctx, "1.3. Продавец заявляет и гарантирует, что на момент заключения настоящего Договора Товар принадлежит Продавцу на праве собственности, приобретён им у поставщика на возмездной основе, свободен от прав и притязаний третьих лиц.");

  /* ── 2. ПРИРОДА ─────────────────────────────────── */
  drawHeader(ctx, "2. ПРИРОДА ДОГОВОРА И ЗАЯВЛЕНИЯ СТОРОН");
  drawParagraph(ctx, "2.1. Стороны признают и подтверждают, что настоящий Договор является договором купли-продажи Товара с условием о рассрочке оплаты и НЕ является договором займа, кредита, потребительского кредита (займа) или иной финансовой сделкой, влекущей возникновение у Покупателя денежного обязательства, не обусловленного передачей встречного товарного предоставления.");
  drawParagraph(ctx, "2.2. Цена Товара, установленная настоящим Договором, является фиксированной и согласованной Сторонами. Цена не подлежит изменению в зависимости от срока оплаты, ставок процента, инфляции, изменения курса валют или иных обстоятельств.");
  drawParagraph(ctx, "2.3. Настоящим Договором НЕ предусматривается начисление каких-либо процентов, неустоек, штрафов, пеней или иных дополнительных денежных сумм в пользу Продавца. Единственное денежное обязательство Покупателя — уплатить цену Товара в порядке и сроки, установленные настоящим Договором.");

  /* ── 3. ПРАВА И ОБЯЗАННОСТИ ─────────────────────── */
  drawHeader(ctx, "3. ПРАВА И ОБЯЗАННОСТИ СТОРОН");
  drawParagraph(ctx, "3.1. Продавец обязан:");
  drawParagraph(ctx, "3.1.1. Передать Покупателю Товар надлежащего качества в течение 5 (пяти) рабочих дней с момента заключения Договора.");
  drawParagraph(ctx, "3.1.2. Передать Товар в упаковке, обеспечивающей его сохранность, со всеми принадлежностями и документами.");
  drawParagraph(ctx, "3.1.3. Подписать Акт приёма-передачи Товара.");
  drawParagraph(ctx, "3.2. Продавец имеет право требовать своевременной и полной оплаты Товара; в случаях раздела 7 — досрочной уплаты или обращения взыскания на залог.");
  drawParagraph(ctx, "3.3. Покупатель обязан:");
  drawParagraph(ctx, "3.3.1. Принять Товар по Акту в течение 5 (пяти) рабочих дней с момента подписания Договора.");
  drawParagraph(ctx, "3.3.2. Своевременно и в полном объёме производить оплату Товара по Графику.");
  drawParagraph(ctx, "3.3.3. Не отчуждать Товар, не передавать его в залог, аренду или иное обременение третьим лицам без письменного согласия Продавца.");
  drawParagraph(ctx, "3.3.4. Обеспечивать сохранность Товара, нести расходы по его содержанию.");
  drawParagraph(ctx, "3.3.5. Уведомлять Продавца об изменении места нахождения Товара в течение 5 (пяти) рабочих дней.");
  drawParagraph(ctx, "3.3.6. Уведомлять Продавца об утрате или повреждении Товара в течение 5 (пяти) рабочих дней.");
  drawParagraph(ctx, "3.4. Покупатель имеет право требовать замены Товара ненадлежащего качества и досрочно вносить платежи без дополнительных сумм.");

  /* ── 4. ЦЕНА ────────────────────────────────────── */
  drawHeader(ctx, "4. ЦЕНА ДОГОВОРА И ПОРЯДОК РАСЧЁТОВ");
  drawMixed(ctx, [{ text: "4.1. Полная цена Товара составляет " }, { text: sumWords, bold: true }, { text: "." }]);
  drawMixed(ctx, [{ text: "4.2. Первоначальный взнос: " }, { text: downWords, bold: true }, { text: " — в день подписания Договора." }]);
  drawMixed(ctx, [{ text: "4.3. Оставшаяся часть в размере " }, { text: remainingWords, bold: true }, { text: " — в рассрочку по Графику (Приложение № 1)." }]);
  drawMixed(ctx, [{ text: "4.4. Срок полной уплаты — " }, { text: `${data.termMonths} месяцев`, bold: true }, { text: " с момента заключения Договора, но не позднее 12 месяцев." }]);
  drawParagraph(ctx, "4.5. Оплата производится наличными в кассу либо безналично на расчётный счёт Продавца. Датой оплаты считается дата поступления средств.");
  drawParagraph(ctx, "4.6. Покупатель вправе досрочно уплатить всю или часть оставшейся суммы. Досрочная уплата не уменьшает цены Товара автоматически.");

  /* ── 5. ОБЕСПЕЧЕНИЕ ─────────────────────────────── */
  drawHeader(ctx, "5. ОБЕСПЕЧЕНИЕ ИСПОЛНЕНИЯ ОБЯЗАТЕЛЬСТВ");
  drawParagraph(ctx, "5.1. Исполнение обязательств Покупателя обеспечивается залогом Товара («Предмет залога»).");
  drawParagraph(ctx, "5.2. С момента передачи Товара и до полной оплаты Товар находится в залоге у Продавца.");
  drawParagraph(ctx, "5.3. Подписанием Договора Покупатель предоставляет Товар в залог Продавцу до момента полного погашения цены.");
  drawParagraph(ctx, "5.4. Покупатель обязан обеспечивать сохранность Предмета залога и нести расходы по его содержанию.");
  drawParagraph(ctx, "5.5. Покупатель не вправе без письменного согласия Продавца отчуждать или передавать Предмет залога третьим лицам.");

  /* ── 6. ОТВЕТСТВЕННОСТЬ ─────────────────────────── */
  drawHeader(ctx, "6. ОТВЕТСТВЕННОСТЬ СТОРОН");
  drawParagraph(ctx, "6.1. Стороны несут ответственность в соответствии с законодательством РФ.");
  drawParagraph(ctx, "6.2. Договором НЕ предусматриваются неустойки, пени, штрафы или проценты за просрочку. Последствия просрочки — права Продавца по разделам 7 и 8.");
  drawParagraph(ctx, "6.3. Продавец отвечает за недостатки Товара, возникшие до передачи Покупателю.");
  drawParagraph(ctx, "6.4. Риск случайной гибели Товара переходит к Покупателю с момента подписания Акта приёма-передачи.");

  /* ── 7. РАСТОРЖЕНИЕ ─────────────────────────────── */
  drawHeader(ctx, "7. РАСТОРЖЕНИЕ ДОГОВОРА И ДОСРОЧНОЕ ИСТРЕБОВАНИЕ");
  drawParagraph(ctx, "7.1. Ни одна Сторона не вправе в одностороннем порядке отказаться от исполнения обязательств, кроме случаев, прямо предусмотренных Договором или законом.");
  drawParagraph(ctx, "7.2. Договор может быть расторгнут по письменному соглашению Сторон.");
  drawParagraph(ctx, "7.3. При просрочке оплаты более 2 месяцев или более 2 раз Продавец вправе: (7.3.1) потребовать досрочной уплаты; (7.3.2) обратить взыскание на Предмет залога; (7.3.3) отказаться от Договора с письменным уведомлением.");
  drawParagraph(ctx, "7.4. Продавец учитывает объективные жизненные обстоятельства Покупателя (болезнь, потеря дохода и т.п.). Возможно дополнительное соглашение о реструктуризации.");

  /* ── 8. ЗАЛОГ ───────────────────────────────────── */
  drawHeader(ctx, "8. ОБРАЩЕНИЕ ВЗЫСКАНИЯ НА ПРЕДМЕТ ЗАЛОГА");
  drawParagraph(ctx, "8.1. Продавец вправе обратить взыскание во внесудебном порядке путём оставления Предмета залога за собой по справедливой рыночной стоимости либо его реализации.");
  drawParagraph(ctx, "8.2. Вырученные средства идут: (1) на расходы по обращению взыскания; (2) на погашение остатка цены Товара.");
  drawParagraph(ctx, "8.3. Остаток после удовлетворения требований Продавца возвращается Покупателю в течение 10 рабочих дней.");
  drawParagraph(ctx, "8.4. Если средств недостаточно — разница остаётся задолженностью Покупателя.");

  /* ── 9. ФОРС-МАЖОР ──────────────────────────────── */
  drawHeader(ctx, "9. ОБСТОЯТЕЛЬСТВА НЕПРЕОДОЛИМОЙ СИЛЫ");
  drawParagraph(ctx, "9.1. При наступлении обстоятельств непреодолимой силы срок исполнения отодвигается соразмерно времени их действия.");
  drawParagraph(ctx, "9.2. Сторона обязана уведомить другую о наступлении таких обстоятельств в течение 10 рабочих дней.");

  /* ── 10. СПОРЫ ──────────────────────────────────── */
  drawHeader(ctx, "10. РАЗРЕШЕНИЕ СПОРОВ");
  drawParagraph(ctx, "10.1. Споры разрешаются переговорами, в том числе с участием медиаторов.");
  drawParagraph(ctx, "10.2. При невозможности — в судебном порядке по законодательству РФ.");
  drawParagraph(ctx, "10.3. Не урегулированное Договором — по закону.");

  /* ── 11. ЗАКЛЮЧИТЕЛЬНЫЕ ─────────────────────────── */
  drawHeader(ctx, "11. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ");
  drawParagraph(ctx, "11.1. Договор вступает в силу с момента подписания и действует до полного исполнения обязательств.");
  drawParagraph(ctx, "11.2. Изменения и дополнения — только в письменной форме, подписанные Сторонами.");
  drawParagraph(ctx, "11.3. При изменении реквизитов Сторона обязана уведомить в течение 5 рабочих дней.");
  drawParagraph(ctx, "11.4. Договор составлен в двух экземплярах равной юридической силы.");
  drawParagraph(ctx, "11.5. Приложения: № 1 — График платежей; № 2 — Акт приёма-передачи.");

  /* ── 12. РЕКВИЗИТЫ И ПОДПИСИ ────────────────────── */
  drawHeader(ctx, "12. РЕКВИЗИТЫ И ПОДПИСИ СТОРОН");
  drawParagraph(ctx, "ПРОДАВЕЦ:", { bold: true });
  drawMixed(ctx, [{ text: "Компания «" }, { text: data.sellerCompanyName, bold: true }, { text: "»" }]);
  drawParagraph(ctx, "ИНН: ___________________");
  drawParagraph(ctx, "ОГРН: ___________________");
  drawParagraph(ctx, "Юридический адрес: ___________________________________________");
  drawParagraph(ctx, "Р/с: ___________________ в _________________________________");
  drawParagraph(ctx, "К/с: _____________________ БИК: ______________________________");
  drawParagraph(ctx, "Телефон: __________________  E-mail: ___________________", { spacingAfter: 12 });
  drawParagraph(ctx, "_______________ / _______________________  М.П.");
  drawParagraph(ctx, "(подпись)            (Ф.И.О.)", { size: FONT_SIZE_SMALL, spacingAfter: 12 });

  drawParagraph(ctx, "ПОКУПАТЕЛЬ:", { bold: true });
  drawParagraph(ctx, data.buyerFullName, { bold: true });
  drawMixed(ctx, [
    { text: "Паспорт: серия " }, { text: passport, bold: true },
    { text: `, выдан ${data.buyerPassportIssuedBy} «${passportDate.day}» ${passportDate.month} ${passportDate.year} г.` },
    { text: `, код подразделения ${data.buyerPassportDeptCode}` },
  ]);
  drawMixed(ctx, [{ text: "Адрес регистрации: " }, { text: data.buyerRegisterAddress, bold: true }]);
  drawMixed(ctx, [{ text: "Адрес проживания: " }, { text: data.buyerLivingAddress, bold: true }]);
  drawMixed(ctx, [{ text: "Телефон: " }, { text: data.buyerPhone, bold: true },
    ...(data.buyerEmail ? [{ text: ",  E-mail: " }, { text: data.buyerEmail, bold: true }] : []),
  ]);
  ctx.y -= 12;
  drawParagraph(ctx, "_______________ / _______________________");
  drawParagraph(ctx, "(подпись)            (Ф.И.О.)", { size: FONT_SIZE_SMALL });

  /* ── Приложение № 1 ─────────────────────────────── */
  newPage(ctx);
  drawParagraph(ctx, "Приложение № 1", { bold: true, size: FONT_SIZE_HEADER, align: "center" });
  drawParagraph(ctx, `к Договору купли-продажи товара в рассрочку № ${data.contractNumber} от «${d.day}» ${d.month} ${d.year} г.`, { size: FONT_SIZE_SMALL, align: "center", spacingAfter: 12 });
  drawParagraph(ctx, "ГРАФИК ПЛАТЕЖЕЙ", { bold: true, size: FONT_SIZE_TITLE, align: "center", spacingAfter: 12 });
  drawMixed(ctx, [{ text: `г. ${data.contractCity}` }, { text: `                                                                              ` }, { text: `«${d.day}» ${d.month} ${d.year} г.` }]);
  drawMixed(ctx, [{ text: "Покупатель: " }, { text: data.buyerFullName, bold: true }]);
  drawMixed(ctx, [{ text: "Полная цена Товара: " }, { text: sumWords, bold: true }, { text: "." }]);
  ctx.y -= 8;
  drawScheduleTable(ctx, data.schedule);

  return await doc.save();
}
