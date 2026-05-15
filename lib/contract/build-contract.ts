/**
 * lib/contract/build-contract.ts
 *
 * Программная генерация .docx договора купли-продажи в рассрочку
 * (мусавама — без риба, без штрафов/процентов).
 *
 * Версия документа соответствует утверждённому PDF-образцу
 * "Договор_Финнайс_рассрочка_шариат" (8 страниц):
 *   1) Обложка
 *   2) Преамбула + «Принцип сделки» + §1 Предмет + §2 Природа договора
 *   3) §3 Права и обязанности + §4 Цена (таблица)
 *   4) §5 Залог + §6 Ответственность (callout «ВАЖНО») + §7 Расторжение
 *   5) §8 Обращение взыскания (callout «Возврат излишка») + §9 Форс-мажор
 *   6) §10 Споры + §11 Заключительные + §12 Реквизиты (2 столбца)
 *   7) Приложение №1 — График платежей
 *   8) Приложение №2 — Акт приёма-передачи (callout «Переход риска и залог»)
 */

import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType,
  Header, Footer, PageNumber, BorderStyle,
  type ITableCellOptions,
} from "docx";
import { rublesInWords, dateToRuParts } from "./numbers-to-words";

export interface ContractData {
  /* Метаданные */
  contractNumber: string;
  contractDate:   string;        // ISO yyyy-mm-dd
  contractCity:   string;        // место заключения, по умолчанию "Грозный"
  /* Продавец */
  sellerCompanyName: string;     // "Финнайс" (без ООО, т.к. ЮЛ нет)
  sellerDirectorFullName: string;
  /* Покупатель */
  buyerFullName:  string;
  buyerBirthDate: string;
  buyerPassportSeries:    string;
  buyerPassportNumber:    string;
  buyerPassportIssuedBy:  string;
  buyerPassportIssueDate: string;
  buyerPassportDeptCode:  string;
  buyerRegisterAddress: string;
  buyerLivingAddress:   string;
  buyerPhone:           string;
  buyerEmail?:          string;
  /* Товар */
  productName: string;
  productModel?:   string;
  productQuantity: number;
  /** Многотоварная рассрочка — массив строк для п. 1.2 */
  productItems?: Array<{ name: string; qty: number; totalAmount: number }>;
  /* Деньги */
  totalPrice:    number;
  downPayment:   number;
  remainingPay:  number;
  termMonths:    number;
  /* График платежей */
  schedule: Array<{
    n:        number | "—";    // "—" для взноса
    date:     string;          // ISO yyyy-mm-dd
    amount:   number;
    purpose:  string;          // "Первоначальный взнос" / "Ежемесячный платёж"
  }>;
}

/* ── Цвета (соответствуют PDF-шаблону) ────────────────────────── */
const C_BRAND      = "0C7A58";   // основной зелёный
const C_TEXT       = "0A1628";   // тёмный текст
const C_MUTED      = "6B7280";   // серый
const C_LIGHT_GRAY = "9CA3AF";
const C_TABLE_HEAD = "0C7A58";
const C_CALLOUT_BG = "ECFDF5";   // принцип сделки / возврат излишка / переход риска (зелёный фон)
const C_CALLOUT_BORDER = "86EFAC";
const C_WARN_BG    = "FEF3C7";   // ВАЖНО
const C_WARN_BORDER = "FDE68A";
const C_ROW_ALT    = "F9FAFB";

/* ── Хелперы для построения параграфов / runs ───────────────── */
function p(text: string, opts: { bold?: boolean; align?: typeof AlignmentType[keyof typeof AlignmentType]; size?: number; spacing?: number; color?: string } = {}): Paragraph {
  return new Paragraph({
    alignment: opts.align,
    spacing:   { after: opts.spacing ?? 80 },
    children:  [new TextRun({ text, bold: opts.bold, size: opts.size ?? 22, color: opts.color })],
  });
}

function pRuns(runs: TextRun[], opts: { align?: typeof AlignmentType[keyof typeof AlignmentType]; spacing?: number } = {}): Paragraph {
  return new Paragraph({
    alignment: opts.align,
    spacing:   { after: opts.spacing ?? 80 },
    children:  runs,
  });
}

function r(text: string, opts: { bold?: boolean; size?: number; color?: string } = {}): TextRun {
  return new TextRun({ text, bold: opts.bold, size: opts.size ?? 22, color: opts.color });
}

/** Заголовок раздела (1. ПРЕДМЕТ ДОГОВОРА ...) */
function sectionHead(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 280, after: 140 },
    children: [new TextRun({ text, bold: true, size: 24, color: C_TEXT })],
  });
}

function fmtRub(n: number): string {
  return Math.round(n).toLocaleString("ru-RU");
}

/** Цветной callout-блок (одноячеечная таблица с фоном и рамкой) */
function calloutBox(opts: {
  title:    string;
  body:     string;
  bg:       string;
  border:   string;
  icon?:    string;     // символ-маркер слева от заголовка
}): Table {
  const titleRuns: TextRun[] = [];
  if (opts.icon) titleRuns.push(new TextRun({ text: opts.icon + "  ", bold: true, size: 22, color: C_BRAND }));
  titleRuns.push(new TextRun({ text: opts.title, bold: true, size: 22, color: C_BRAND }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top:    { style: BorderStyle.SINGLE, size: 6, color: opts.border },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: opts.border },
      left:   { style: BorderStyle.SINGLE, size: 6, color: opts.border },
      right:  { style: BorderStyle.SINGLE, size: 6, color: opts.border },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: opts.border },
      insideVertical:   { style: BorderStyle.NONE, size: 0, color: opts.border },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: opts.bg, color: "auto" },
            margins: { top: 160, bottom: 160, left: 240, right: 240 },
            children: [
              new Paragraph({ spacing: { after: 80 }, children: titleRuns }),
              p(opts.body, { size: 22 }),
            ],
          }),
        ],
      }),
    ],
  });
}

/** Ячейка таблицы реквизитов / графика без рамок (для 2-колоночной разметки) */
function cleanCell(children: Paragraph[], opts: Partial<ITableCellOptions> = {}): TableCell {
  return new TableCell({
    margins: { top: 120, bottom: 120, left: 120, right: 120 },
    borders: {
      top:    { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      left:   { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      right:  { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
    children,
    ...opts,
  });
}

/* ────────────────────────────────────────────────────────────── */

export async function buildContract(data: ContractData): Promise<Uint8Array> {
  const d            = dateToRuParts(data.contractDate);
  const passport     = `${data.buyerPassportSeries} ${data.buyerPassportNumber}`;
  const passportDate = dateToRuParts(data.buyerPassportIssueDate);
  const sumWords     = rublesInWords(data.totalPrice);
  const downWords    = rublesInWords(data.downPayment);
  const remainWords  = rublesInWords(data.remainingPay);

  /* ══ Header: брендовая полоска finnice ══════════════════════ */
  const brandHeader = new Header({
    children: [
      new Paragraph({
        spacing: { after: 0 },
        children: [
          new TextRun({ text: "finnice", bold: true, size: 22, color: C_BRAND }),
          new TextRun({ text: "  ·  Исламская рассрочка", size: 18, color: C_MUTED }),
          new TextRun({ text: "                                              ", size: 18 }),
          new TextRun({ text: "г. Грозный  ·  +7 (928) 491-08-08", size: 18, color: C_MUTED }),
        ],
      }),
    ],
  });

  /* ══ Footer: адрес офиса / сайт / номер страницы ════════════ */
  const brandFooter = new Footer({
    children: [
      new Paragraph({
        spacing: { before: 0 },
        children: [
          new TextRun({ text: "г. Грозный, ул. Орзамиева, 8", size: 16, color: C_LIGHT_GRAY }),
          new TextRun({ text: "                                                   ", size: 16 }),
          new TextRun({ text: "www.finnice.ru", size: 16, color: C_BRAND }),
          new TextRun({ text: "                                                   ", size: 16 }),
          new TextRun({ text: "Страница ", size: 16, color: C_LIGHT_GRAY }),
          new TextRun({ children: [PageNumber.CURRENT], size: 16, color: C_LIGHT_GRAY, bold: true }),
          new TextRun({ text: " из ", size: 16, color: C_LIGHT_GRAY }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: C_LIGHT_GRAY, bold: true }),
        ],
      }),
    ],
  });

  /* ══ Таблица графика платежей ═══════════════════════════════ */
  const scheduleHeaderCells = ["№", "Дата платежа", "Сумма, руб.", "Назначение"].map(
    text => new TableCell({
      shading: { type: ShadingType.CLEAR, fill: C_TABLE_HEAD, color: "auto" },
      margins: { top: 100, bottom: 100, left: 120, right: 120 },
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, bold: true, size: 22, color: "FFFFFF" })],
      })],
    })
  );

  const scheduleRows = data.schedule.map((row, idx) => {
    const dt = dateToRuParts(row.date);
    const dateStr = `${dt.day}.${String(new Date(row.date).getMonth() + 1).padStart(2, "0")}.${dt.year}`;
    const altShading = idx % 2 === 1
      ? { shading: { type: ShadingType.CLEAR, fill: C_ROW_ALT, color: "auto" } }
      : {};
    return new TableRow({
      children: [
        new TableCell({ ...altShading, margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [r(String(row.n), { bold: true })] })] }),
        new TableCell({ ...altShading, margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [p(dateStr)] }),
        new TableCell({ ...altShading, margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [p(fmtRub(row.amount))] }),
        new TableCell({ ...altShading, margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [p(row.purpose)] }),
      ],
    });
  });

  const scheduleTotalRow = new TableRow({
    children: [
      new TableCell({
        columnSpan: 2,
        shading: { type: ShadingType.CLEAR, fill: C_TABLE_HEAD, color: "auto" },
        margins: { top: 100, bottom: 100, left: 120, right: 120 },
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "ИТОГО", bold: true, size: 22, color: "FFFFFF" })],
        })],
      }),
      new TableCell({
        shading: { type: ShadingType.CLEAR, fill: C_TABLE_HEAD, color: "auto" },
        margins: { top: 100, bottom: 100, left: 120, right: 120 },
        children: [new Paragraph({
          children: [new TextRun({ text: fmtRub(data.totalPrice), bold: true, size: 22, color: "FFFFFF" })],
        })],
      }),
      new TableCell({
        shading: { type: ShadingType.CLEAR, fill: C_TABLE_HEAD, color: "auto" },
        children: [new Paragraph({ children: [new TextRun({ text: "", size: 22 })] })],
      }),
    ],
  });

  const scheduleTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: scheduleHeaderCells, tableHeader: true }),
      ...scheduleRows,
      scheduleTotalRow,
    ],
  });

  /* ══ §4 Цена — таблица 2×4 ══════════════════════════════════ */
  const priceTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: C_ROW_ALT, color: "auto" },
            margins: { top: 100, bottom: 100, left: 160, right: 160 },
            children: [p("Полная цена Товара", { bold: true })],
          }),
          new TableCell({
            margins: { top: 100, bottom: 100, left: 160, right: 160 },
            children: [pRuns([
              r(`${fmtRub(data.totalPrice)} `, { bold: true }),
              r(`(${sumWords}) руб. 00 коп.`),
            ])],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: C_ROW_ALT, color: "auto" },
            margins: { top: 100, bottom: 100, left: 160, right: 160 },
            children: [p("Первоначальный взнос", { bold: true })],
          }),
          new TableCell({
            margins: { top: 100, bottom: 100, left: 160, right: 160 },
            children: [pRuns([
              r(`${fmtRub(data.downPayment)} `, { bold: true }),
              r(`(${downWords}) руб. 00 коп.`),
            ])],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: C_ROW_ALT, color: "auto" },
            margins: { top: 100, bottom: 100, left: 160, right: 160 },
            children: [p("Сумма к оплате в рассрочку", { bold: true })],
          }),
          new TableCell({
            margins: { top: 100, bottom: 100, left: 160, right: 160 },
            children: [pRuns([
              r(`${fmtRub(data.remainingPay)} `, { bold: true }),
              r(`(${remainWords}) руб. 00 коп.`),
            ])],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: C_ROW_ALT, color: "auto" },
            margins: { top: 100, bottom: 100, left: 160, right: 160 },
            children: [p("Срок рассрочки", { bold: true })],
          }),
          new TableCell({
            margins: { top: 100, bottom: 100, left: 160, right: 160 },
            children: [pRuns([
              r(`${data.termMonths} `, { bold: true }),
              r(`месяцев (не более 12 месяцев)`),
            ])],
          }),
        ],
      }),
    ],
  });

  /* ══ §12 Реквизиты — 2 колонки ══════════════════════════════ */
  const requisitesTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      /* Заголовки */
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: C_TABLE_HEAD, color: "auto" },
            margins: { top: 120, bottom: 120, left: 200, right: 120 },
            children: [new Paragraph({
              children: [new TextRun({ text: "ПРОДАВЕЦ", bold: true, size: 22, color: "FFFFFF" })],
            })],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: C_TABLE_HEAD, color: "auto" },
            margins: { top: 120, bottom: 120, left: 200, right: 120 },
            children: [new Paragraph({
              children: [new TextRun({ text: "ПОКУПАТЕЛЬ", bold: true, size: 22, color: "FFFFFF" })],
            })],
          }),
        ],
      }),
      /* Реквизиты */
      new TableRow({
        children: [
          cleanCell([
            p(`Общество с ограниченной ответственностью «${data.sellerCompanyName}»`, { bold: true }),
            p("ИНН: ___________________"),
            p("ОГРН: ___________________"),
            p("Юр. адрес: г. Грозный, ул. Орзамиева, 8"),
            p("Факт. адрес: ___________________________________"),
            p(" "),
            p("Р/с: _____________________"),
            p("Банк: _____________________"),
            p("К/с: _____________________"),
            p("БИК: _____________________"),
            p(" "),
            pRuns([r("Телефон: "), r("+7 (928) 491-08-08", { bold: true })]),
            pRuns([r("E-mail: "), r("info@finnice.ru", { bold: true })]),
            p(" "),
            p("____________________ / ___________________   М.П.", { spacing: 60 }),
            p("подпись / Ф.И.О.", { size: 18, color: C_MUTED }),
          ]),
          cleanCell([
            p("Фамилия, имя, отчество", { size: 18, color: C_MUTED }),
            p(data.buyerFullName, { bold: true }),
            pRuns([r("Паспорт: серия "), r(passport, { bold: true })]),
            pRuns([r("Выдан: "), r(data.buyerPassportIssuedBy, { bold: true })]),
            pRuns([r("Дата выдачи: «"), r(passportDate.day, { bold: true }),
                   r("» "), r(passportDate.month, { bold: true }),
                   r(" "), r(passportDate.year, { bold: true }), r(" г.")]),
            pRuns([r("Код подразделения: "), r(data.buyerPassportDeptCode, { bold: true })]),
            pRuns([r("Адрес регистрации: "), r(data.buyerRegisterAddress, { bold: true })]),
            pRuns([r("Адрес проживания: "), r(data.buyerLivingAddress, { bold: true })]),
            p(" "),
            pRuns([r("Телефон: "), r(data.buyerPhone, { bold: true })]),
            ...(data.buyerEmail ? [pRuns([r("E-mail: "), r(data.buyerEmail, { bold: true })])] : [p(" ")]),
            p(" "),
            p("____________________ / ___________________", { spacing: 60 }),
            p("подпись / Ф.И.О.", { size: 18, color: C_MUTED }),
          ]),
        ],
      }),
    ],
  });

  /* ══ Приложение №2 — Акт приёма-передачи: таблица товара ════ */
  const actHeader = ["№ п/п", "Наименование", "Кол-во", "Цена, руб.", "Сумма, руб."].map(
    text => new TableCell({
      shading: { type: ShadingType.CLEAR, fill: C_TABLE_HEAD, color: "auto" },
      margins: { top: 100, bottom: 100, left: 100, right: 100 },
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, bold: true, size: 20, color: "FFFFFF" })],
      })],
    })
  );

  const actItems = data.productItems && data.productItems.length > 0
    ? data.productItems
    : [{ name: data.productName, qty: data.productQuantity, totalAmount: data.totalPrice }];

  const actRows = actItems.map((it, idx) => new TableRow({
    children: [
      new TableCell({ margins: { top: 80, bottom: 80, left: 100, right: 100 },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [r(String(idx + 1), { bold: true })] })] }),
      new TableCell({ margins: { top: 80, bottom: 80, left: 100, right: 100 },
        children: [p(it.name)] }),
      new TableCell({ margins: { top: 80, bottom: 80, left: 100, right: 100 },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [r(String(it.qty))] })] }),
      new TableCell({ margins: { top: 80, bottom: 80, left: 100, right: 100 },
        children: [p(fmtRub(it.totalAmount / Math.max(it.qty, 1)))] }),
      new TableCell({ margins: { top: 80, bottom: 80, left: 100, right: 100 },
        children: [p(fmtRub(it.totalAmount))] }),
    ],
  }));

  const actTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: actHeader, tableHeader: true }), ...actRows],
  });

  /* ══ Документ ═══════════════════════════════════════════════ */
  const doc = new Document({
    creator: "Финнайс",
    title:   `Договор купли-продажи в рассрочку №${data.contractNumber}`,
    styles:  {
      default: { document: { run: { font: "Helvetica", size: 22 } } },
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 1400, bottom: 1100, left: 1100, right: 1100 },
        },
      },
      headers: { default: brandHeader },
      footers: { default: brandFooter },
      children: [
        /* ═══════════════════════════════════════════════════════
           СТРАНИЦА 1 — ОБЛОЖКА
           ═══════════════════════════════════════════════════════ */
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 2400, after: 240 },
          children: [
            new TextRun({ text: "finnice", bold: true, size: 72, color: C_BRAND }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [
            new TextRun({ text: "И С Л А М С К А Я", size: 18, color: C_MUTED }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
          children: [
            new TextRun({ text: "Р А С С Р О Ч К А", size: 18, color: C_MUTED }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
          children: [
            new TextRun({ text: "✦  Х А Л Я Л Ь  ·  Б Е З   Р И Б А  ·  М У С А В А М А  ✦", size: 18, color: C_BRAND }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [
            new TextRun({ text: "Д О Г О В О Р", bold: true, size: 60, color: C_TEXT }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 1200 },
          children: [
            new TextRun({ text: "купли-продажи товара в рассрочку", italics: true, size: 24, color: C_MUTED }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [
            new TextRun({ text: "Н О М Е Р   Д О Г О В О Р А", size: 18, color: C_MUTED }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [
            new TextRun({ text: `№ ${data.contractNumber}`, bold: true, size: 28, color: C_TEXT }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [
            new TextRun({ text: "Д А Т А   П О Д П И С А Н И Я", size: 18, color: C_MUTED }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 1200 },
          children: [
            new TextRun({ text: `«${d.day}» ${d.month} ${d.year} г.`, bold: true, size: 28, color: C_TEXT }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [
            new TextRun({ text: `Чеченская Республика, г. ${data.contractCity}`, size: 20, color: C_MUTED }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 },
          children: [
            new TextRun({ text: "finnice.ru  ·  +7 (928) 491-08-08", bold: true, size: 20, color: C_BRAND }),
          ],
        }),

        /* ═══════════════════════════════════════════════════════
           СТРАНИЦА 2 — ПРЕАМБУЛА + §1 + §2
           ═══════════════════════════════════════════════════════ */
        new Paragraph({
          pageBreakBefore: true,
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: "ДОГОВОР КУПЛИ-ПРОДАЖИ ТОВАРА В РАССРОЧКУ", bold: true, size: 26, color: C_TEXT })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [new TextRun({
            text: `№ ${data.contractNumber}  ·  от «${d.day}» ${d.month} ${d.year} г.`,
            size: 20,
            color: C_MUTED,
          })],
        }),

        /* Преамбула */
        pRuns([
          r(`Общество с ограниченной ответственностью «${data.sellerCompanyName}» (ООО «${data.sellerCompanyName}»), в лице `),
          r(data.sellerDirectorFullName || "_______________________________________", { bold: true }),
          r(`, действующего на основании `),
          r("___________________", { bold: true }),
          r(`, именуемое в дальнейшем «Продавец», с одной стороны, и`),
        ]),
        pRuns([
          r(`Гражданин(ка) Российской Федерации `),
          r(data.buyerFullName, { bold: true }),
          r(`, паспорт серия `),
          r(data.buyerPassportSeries, { bold: true }),
          r(` номер `),
          r(data.buyerPassportNumber, { bold: true }),
          r(`, выдан `),
          r(data.buyerPassportIssuedBy, { bold: true }),
          r(` «${passportDate.day}» ${passportDate.month} ${passportDate.year} г., код подразделения `),
          r(data.buyerPassportDeptCode, { bold: true }),
          r(`, зарегистрирован(а) по адресу: `),
          r(data.buyerRegisterAddress, { bold: true }),
          r(`, проживающий(ая) по адресу: `),
          r(data.buyerLivingAddress, { bold: true }),
          r(`, телефон: `),
          r(data.buyerPhone, { bold: true }),
          ...(data.buyerEmail ? [r(", email: "), r(data.buyerEmail, { bold: true })] : []),
          r(`, именуемый(ая) в дальнейшем «Покупатель», с другой стороны,`),
        ]),
        p("именуемые совместно «Стороны», а по отдельности «Сторона», заключили настоящий Договор о нижеследующем.", { spacing: 200 }),

        /* Callout: Принцип сделки */
        calloutBox({
          icon:   "◆",
          title:  "ПРИНЦИП СДЕЛКИ",
          body:   "Настоящий Договор является договором купли-продажи (мусавама / مساومة) с условием о рассрочке оплаты и не является договором займа или кредита. Цена Товара фиксирована, согласована Сторонами по их свободному волеизъявлению и не подлежит изменению в зависимости от срока оплаты. Договор не предусматривает начисления процентов, неустоек, штрафов или пеней.",
          bg:     C_CALLOUT_BG,
          border: C_CALLOUT_BORDER,
        }),
        p(" ", { spacing: 160 }),

        /* 1. ПРЕДМЕТ */
        sectionHead("1. ПРЕДМЕТ ДОГОВОРА"),
        p("1.1. Продавец, являясь собственником товара, указанного в пункте 1.2 настоящего Договора (далее — «Товар»), обязуется передать Товар в собственность Покупателя, а Покупатель обязуется принять Товар и уплатить за него установленную настоящим Договором цену в соответствии с Графиком платежей (Приложение № 1 к настоящему Договору, являющееся его неотъемлемой частью)."),
        p(data.productItems && data.productItems.length > 1
          ? "1.2. Характеристики Товаров (Товар представляет собой набор позиций ниже):"
          : "1.2. Характеристики Товара:"),
        ...(data.productItems && data.productItems.length > 0
          ? data.productItems.flatMap((it) => [
              pRuns([
                r("•  Наименование: "), r(it.name, { bold: true }),
                r("  ·  Количество: "), r(`${it.qty} шт.`, { bold: true }),
                r("  ·  Цена позиции: "), r(`${fmtRub(it.totalAmount)} ₽`, { bold: true }),
              ]),
            ])
          : [
              pRuns([r("•  Наименование: "), r(data.productName, { bold: true })]),
              pRuns([r("•  Модель / артикул: "), r(data.productModel || "—", { bold: true })]),
              pRuns([r("•  Количество: "), r(`${data.productQuantity} шт.`, { bold: true })]),
              pRuns([r("•  Иные индивидуализирующие признаки: "), r("___________________________________________", { bold: true })]),
            ]),
        p("1.3. Продавец заявляет и гарантирует, что на момент заключения настоящего Договора Товар принадлежит Продавцу на праве собственности, приобретён им у поставщика на возмездной основе, свободен от прав и притязаний третьих лиц, не находится под арестом, в залоге или ином обременении."),

        /* 2. ПРИРОДА */
        sectionHead("2. ПРИРОДА ДОГОВОРА И ЗАЯВЛЕНИЯ СТОРОН"),
        p("2.1. Стороны признают и подтверждают, что настоящий Договор является договором купли-продажи Товара с условием о рассрочке оплаты и НЕ является договором займа, кредита, потребительского кредита (займа) или иной финансовой сделкой, влекущей возникновение у Покупателя денежного обязательства, не обусловленного передачей встречного товарного предоставления."),
        p("2.2. Цена Товара, установленная настоящим Договором, является фиксированной и согласованной Сторонами по их взаимному свободному волеизъявлению. Цена Товара не подлежит изменению в зависимости от срока оплаты, ставок процента, инфляции, изменения курса валют или иных обстоятельств."),
        p("2.3. Настоящим Договором НЕ предусматривается начисление каких-либо процентов, неустоек, штрафов, пеней или иных дополнительных денежных сумм в пользу Продавца ни за пользование рассрочкой, ни за нарушение Покупателем сроков оплаты. Единственным денежным обязательством Покупателя по настоящему Договору является обязательство уплатить цену Товара в порядке и сроки, установленные настоящим Договором."),

        /* 3. ПРАВА И ОБЯЗАННОСТИ */
        sectionHead("3. ПРАВА И ОБЯЗАННОСТИ СТОРОН"),
        p("3.1. Продавец обязан:", { bold: true }),
        p("3.1.1. Передать Покупателю Товар надлежащего качества в количестве, ассортименте и комплектации, соответствующих условиям настоящего Договора, в течение 5 (пяти) рабочих дней с момента заключения настоящего Договора."),
        p("3.1.2. Передать Товар в упаковке, обеспечивающей его сохранность при обычных условиях хранения и транспортирования. Одновременно с передачей Товара передать Покупателю все принадлежности и относящиеся к Товару документы (технический паспорт, инструкцию по эксплуатации, гарантийный талон и иные документы)."),
        p("3.1.3. Подписать Акт приёма-передачи Товара, свидетельствующий о передаче Товара Покупателю."),
        p("3.2. Продавец имеет право:", { bold: true }),
        p("3.2.1. Требовать своевременной и полной оплаты Товара Покупателем в соответствии с Графиком платежей."),
        p("3.2.2. В случаях, предусмотренных разделом 7 настоящего Договора, требовать досрочной уплаты Покупателем оставшейся неоплаченной части цены Товара."),
        p("3.2.3. В случаях, предусмотренных разделом 7 настоящего Договора, обращать взыскание на Предмет залога в порядке, предусмотренном разделом 8 настоящего Договора."),
        p("3.3. Покупатель обязан:", { bold: true }),
        p("3.3.1. Принять Товар от Продавца по Акту приёма-передачи в течение 5 (пяти) рабочих дней с момента подписания настоящего Договора."),
        p("3.3.2. Своевременно и в полном объёме производить оплату Товара в соответствии с Графиком платежей."),
        p("3.3.3. Поскольку Товар с момента его передачи Покупателю находится в залоге у Продавца в обеспечение исполнения обязательств Покупателя по оплате (раздел 5 настоящего Договора), Покупатель как залогодатель не вправе без письменного согласия Продавца как залогодержателя отчуждать Товар (продавать, дарить, передавать в качестве вклада в уставный капитал и т.д.), передавать его в последующий залог, аренду, безвозмездное пользование или иное обременение третьим лицам до прекращения залога в связи с полной оплатой Товара."),
        p("3.3.4. Обеспечивать сохранность Товара, нести расходы, связанные с его содержанием и эксплуатацией."),
        p("3.3.5. Не изменять адрес нахождения Товара, указанный Покупателем при заключении настоящего Договора, либо в письменной форме уведомлять Продавца об изменении места нахождения и использования Товара в течение 5 (пяти) рабочих дней с момента такого изменения."),
        p("3.3.6. Уведомлять Продавца об утрате, повреждении или ином ухудшении состояния Товара в течение 5 (пяти) рабочих дней с момента наступления соответствующего обстоятельства."),
        p("3.4. Покупатель имеет право:", { bold: true }),
        p("3.4.1. Требовать замены Товара ненадлежащего качества в соответствии с законодательством Российской Федерации до момента подписания Акта приёма-передачи Товара."),
        p("3.4.2. Досрочно вносить платежи в счёт оплаты Товара полностью или в части без уплаты каких-либо дополнительных сумм."),

        /* 4. ЦЕНА */
        sectionHead("4. ЦЕНА ДОГОВОРА И ПОРЯДОК РАСЧЁТОВ"),
        priceTable,
        p(" ", { spacing: 100 }),
        p("4.1. Полная цена Товара по настоящему Договору указана в таблице выше и составляет согласованную Сторонами фиксированную сумму."),
        p("4.2. Покупатель уплачивает Продавцу первоначальный взнос в указанном выше размере в день подписания настоящего Договора."),
        p("4.3. Оставшуюся часть цены Товара Покупатель уплачивает Продавцу в рассрочку в соответствии с Графиком платежей (Приложение № 1 к настоящему Договору)."),
        p("4.4. Полная цена Товара подлежит уплате Покупателем в течение указанного в таблице срока рассрочки, но в любом случае не позднее чем через 12 (двенадцать) месяцев с момента заключения настоящего Договора."),
        p("4.5. Оплата Товара производится путём внесения денежных средств в кассу Продавца или путём безналичного перечисления денежных средств на расчётный счёт Продавца, указанный в разделе 12 настоящего Договора. Датой оплаты считается дата поступления денежных средств в кассу или на расчётный счёт Продавца."),
        p("4.6. Покупатель вправе досрочно уплатить всю оставшуюся неоплаченную часть цены Товара или любую её часть. Досрочная уплата не влечёт за собой автоматического уменьшения цены Товара, установленной настоящим Договором. Продавец вправе по своему усмотрению предоставить Покупателю скидку при досрочной оплате; предоставление такой скидки является правом, а не обязанностью Продавца."),

        /* 5. ОБЕСПЕЧЕНИЕ */
        sectionHead("5. ОБЕСПЕЧЕНИЕ ИСПОЛНЕНИЯ ОБЯЗАТЕЛЬСТВ"),
        p("5.1. Исполнение обязательств Покупателя по оплате цены Товара в соответствии с Графиком платежей обеспечивается залогом Товара (далее — «Предмет залога»)."),
        p("5.2. С момента передачи Товара Покупателю и до момента полной оплаты Покупателем цены Товара Товар находится в залоге у Продавца в обеспечение исполнения Покупателем его обязательств по настоящему Договору. Продавец является залогодержателем со всеми правами, предусмотренными гражданским законодательством Российской Федерации и настоящим Договором."),
        p("5.3. Подписанием настоящего Договора Покупатель предоставляет приобретённый по настоящему Договору Товар в залог Продавцу до момента полного погашения цены Товара."),
        p("5.4. Покупатель обязан обеспечивать сохранность Предмета залога и нести расходы, связанные с его содержанием."),
        p("5.5. Покупатель не вправе без письменного согласия Продавца отчуждать Предмет залога, передавать его в пользование третьим лицам или иным образом распоряжаться им до полной оплаты его стоимости."),

        /* 6. ОТВЕТСТВЕННОСТЬ */
        sectionHead("6. ОТВЕТСТВЕННОСТЬ СТОРОН"),
        p("6.1. Стороны несут ответственность за неисполнение или ненадлежащее исполнение обязательств по настоящему Договору в соответствии с действующим законодательством Российской Федерации и условиями настоящего Договора."),
        calloutBox({
          icon:   "⚠",
          title:  "ВАЖНО",
          body:   "Настоящим Договором НЕ предусматривается начисление неустойки, пени, штрафа, процентов или иных финансовых санкций в пользу Продавца за просрочку оплаты Покупателем платежей по Графику платежей. Единственными правовыми последствиями просрочки оплаты со стороны Покупателя являются возникновение у Продавца прав, предусмотренных разделом 7 и разделом 8 настоящего Договора, а также право Продавца требовать возмещения документально подтверждённых убытков в соответствии с законодательством Российской Федерации.",
          bg:     C_WARN_BG,
          border: C_WARN_BORDER,
        }),
        p(" ", { spacing: 100 }),
        p("6.2. Продавец отвечает за недостатки Товара, возникшие до его передачи Покупателю и подписания Акта приёма-передачи."),
        p("6.3. Риск случайной гибели или случайного повреждения Товара переходит к Покупателю с момента подписания Акта приёма-передачи Товара."),

        /* 7. РАСТОРЖЕНИЕ */
        sectionHead("7. РАСТОРЖЕНИЕ ДОГОВОРА И ДОСРОЧНОЕ ИСТРЕБОВАНИЕ ОПЛАТЫ"),
        p("7.1. Ни одна из Сторон не вправе в одностороннем порядке отказаться от исполнения обязательств по настоящему Договору, за исключением случаев, прямо предусмотренных настоящим Договором или законом."),
        p("7.2. Настоящий Договор может быть расторгнут по письменному соглашению Сторон."),
        p("7.3. При нарушении Покупателем сроков оплаты Товара, предусмотренных Графиком платежей, более чем на 2 (два) месяца либо при задержке платежа более 2 (двух) раз Продавец вправе по своему выбору:"),
        p("7.3.1. потребовать от Покупателя досрочной уплаты всей оставшейся неоплаченной части цены Товара; и/или"),
        p("7.3.2. обратить взыскание на Предмет залога в порядке, предусмотренном разделом 8 настоящего Договора; и/или"),
        p("7.3.3. в одностороннем порядке отказаться от исполнения настоящего Договора, направив Покупателю письменное уведомление об отказе от Договора."),
        p("7.4. При оценке нарушения Покупателем сроков оплаты Продавец принимает во внимание обстоятельства, в связи с которыми допущена просрочка. В случае если просрочка вызвана объективными жизненными обстоятельствами Покупателя (тяжёлая болезнь, утрата трудоспособности, потеря источника дохода и иные подобные обстоятельства), Стороны вправе по соглашению заключить дополнительное соглашение об отсрочке или реструктуризации оставшихся платежей."),

        /* 8. ЗАЛОГ */
        sectionHead("8. ОБРАЩЕНИЕ ВЗЫСКАНИЯ НА ПРЕДМЕТ ЗАЛОГА"),
        p("8.1. В случаях, предусмотренных пунктом 7.3 настоящего Договора, Продавец вправе обратить взыскание на Предмет залога во внесудебном порядке путём оставления Предмета залога за собой по справедливой рыночной стоимости либо путём его реализации третьим лицам, в порядке, предусмотренном гражданским законодательством Российской Федерации и настоящим Договором."),
        p("8.2. Денежные средства, вырученные Продавцом от реализации Предмета залога, либо стоимость Предмета залога при оставлении его Продавцом за собой направляются на удовлетворение требований Продавца по настоящему Договору в следующем порядке:"),
        p("8.2.1. в первую очередь — на возмещение документально подтверждённых расходов Продавца, связанных с обращением взыскания на Предмет залога и его реализацией;"),
        p("8.2.2. во вторую очередь — на погашение оставшейся неоплаченной части цены Товара по настоящему Договору."),
        calloutBox({
          icon:   "↺",
          title:  "ВОЗВРАТ ИЗЛИШКА",
          body:   "Денежные средства (либо часть стоимости Предмета залога), оставшиеся после удовлетворения требований Продавца, подлежат возврату Покупателю в полном объёме в течение 10 (десяти) рабочих дней с момента реализации Предмета залога либо его оставления Продавцом за собой. Удержание Продавцом каких-либо сумм сверх размера фактических требований по настоящему Договору не допускается.",
          bg:     C_CALLOUT_BG,
          border: C_CALLOUT_BORDER,
        }),
        p(" ", { spacing: 100 }),
        p("8.3. В случае если денежных средств, вырученных от реализации Предмета залога (либо стоимости Предмета залога при оставлении его Продавцом за собой), недостаточно для покрытия оставшейся неоплаченной части цены Товара и расходов Продавца, разница остаётся задолженностью Покупателя перед Продавцом и подлежит уплате Покупателем в сроки, согласованные Сторонами, либо в порядке, установленном законодательством Российской Федерации."),

        /* 9. ФОРС-МАЖОР */
        sectionHead("9. ОБСТОЯТЕЛЬСТВА НЕПРЕОДОЛИМОЙ СИЛЫ"),
        p("9.1. При наступлении обстоятельств непреодолимой силы (форс-мажор), а именно: пожара, наводнения, землетрясения и иных стихийных бедствий, военных действий, эпидемий, актов государственных органов, препятствующих исполнению обязательств, и иных независящих от Сторон обстоятельств, препятствующих полному или частичному исполнению любой из Сторон обязательств по настоящему Договору, срок исполнения обязательств по настоящему Договору отодвигается соразмерно времени, в течение которого будут действовать такие обстоятельства."),
        p("9.2. Сторона, для которой создалась невозможность исполнения обязательств вследствие обстоятельств непреодолимой силы, обязана в течение 10 (десяти) рабочих дней с момента наступления таких обстоятельств уведомить другую Сторону в письменной форме о наступлении и предполагаемом сроке действия таких обстоятельств."),

        /* 10. СПОРЫ */
        sectionHead("10. РАЗРЕШЕНИЕ СПОРОВ"),
        p("10.1. Все споры и разногласия, которые могут возникнуть между Сторонами в ходе исполнения ими своих обязательств по настоящему Договору, разрешаются Сторонами путём переговоров, в том числе с участием медиаторов."),
        p("10.2. При невозможности урегулирования путём переговоров все споры, разногласия или требования, возникающие из настоящего Договора или в связи с ним, в том числе касающиеся его исполнения, нарушения, прекращения или недействительности, подлежат разрешению в судебном порядке в соответствии с действующим законодательством Российской Федерации."),
        p("10.3. Во всём остальном, что не урегулировано настоящим Договором, Стороны руководствуются действующим законодательством Российской Федерации."),

        /* 11. ЗАКЛЮЧИТЕЛЬНЫЕ */
        sectionHead("11. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ"),
        p("11.1. Настоящий Договор вступает в силу с момента его подписания Сторонами и действует до полного исполнения Сторонами своих обязательств по нему."),
        p("11.2. Все изменения и дополнения к настоящему Договору, уведомления и сообщения по нему действительны лишь в том случае, если они совершены в письменной форме и подписаны уполномоченными представителями Сторон. Сообщения считаются надлежаще направленными, если они посланы заказным письмом с уведомлением о вручении или доставлены лично с получением под расписку."),
        p("11.3. В случае изменения любого из указанных в настоящем Договоре реквизитов соответствующая Сторона обязуется уведомить другую Сторону любым доступным способом в течение 5 (пяти) рабочих дней с момента наступления такого изменения."),
        p("11.4. Настоящий Договор составлен в двух экземплярах, имеющих равную юридическую силу, по одному для каждой из Сторон."),
        p("11.5. Приложения, являющиеся неотъемлемой частью настоящего Договора:"),
        p("— Приложение № 1: График платежей;"),
        p("— Приложение № 2: Акт приёма-передачи Товара."),

        /* 12. РЕКВИЗИТЫ */
        sectionHead("12. РЕКВИЗИТЫ И ПОДПИСИ СТОРОН"),
        requisitesTable,

        /* ═══════════════════════════════════════════════════════
           ПРИЛОЖЕНИЕ № 1 — ГРАФИК ПЛАТЕЖЕЙ
           ═══════════════════════════════════════════════════════ */
        new Paragraph({
          pageBreakBefore: true,
          alignment: AlignmentType.RIGHT,
          spacing: { after: 80 },
          children: [
            new TextRun({ text: "П Р И Л О Ж Е Н И Е   №  1", bold: true, size: 22, color: C_TEXT }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { after: 240 },
          children: [
            new TextRun({
              text: `к Договору купли-продажи товара в рассрочку № ${data.contractNumber} от «${d.day}» ${d.month} ${d.year} г.`,
              size: 18, color: C_MUTED,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: "ГРАФИК ПЛАТЕЖЕЙ", bold: true, size: 36, color: C_TEXT })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 280 },
          children: [
            new TextRun({ text: `г. ${data.contractCity}  ·  «${d.day}» ${d.month} ${d.year} г.`, size: 18, color: C_MUTED }),
          ],
        }),
        pRuns([r("Покупатель: "), r(data.buyerFullName, { bold: true })]),
        pRuns([r("Полная цена Товара: "), r(`${fmtRub(data.totalPrice)} руб. 00 коп.`, { bold: true })], { spacing: 200 }),
        scheduleTable,
        p(" ", { spacing: 200 }),
        pRuns([
          r("Всего к оплате: "),
          r(`${fmtRub(data.totalPrice)} `, { bold: true }),
          r(`(${sumWords}) рублей 00 копеек.`),
        ]),
        p(`Настоящий График платежей является неотъемлемой частью Договора купли-продажи товара в рассрочку № ${data.contractNumber} от «${d.day}» ${d.month} ${d.year} г. и составлен в двух экземплярах, имеющих равную юридическую силу, по одному для каждой из Сторон.`, { size: 20, color: C_MUTED, spacing: 240 }),

        /* Подписи под графиком */
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                cleanCell([
                  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "ПРОДАВЕЦ", bold: true, size: 20, color: C_BRAND })] }),
                  p("____________________________"),
                  p("подпись / Ф.И.О.    М.П.", { size: 18, color: C_MUTED }),
                ]),
                cleanCell([
                  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "ПОКУПАТЕЛЬ", bold: true, size: 20, color: C_BRAND })] }),
                  p("____________________________"),
                  p("подпись / Ф.И.О.", { size: 18, color: C_MUTED }),
                ]),
              ],
            }),
          ],
        }),

        /* ═══════════════════════════════════════════════════════
           ПРИЛОЖЕНИЕ № 2 — АКТ ПРИЁМА-ПЕРЕДАЧИ
           ═══════════════════════════════════════════════════════ */
        new Paragraph({
          pageBreakBefore: true,
          alignment: AlignmentType.RIGHT,
          spacing: { after: 80 },
          children: [
            new TextRun({ text: "П Р И Л О Ж Е Н И Е   №  2", bold: true, size: 22, color: C_TEXT }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { after: 240 },
          children: [
            new TextRun({
              text: `к Договору купли-продажи товара в рассрочку № ${data.contractNumber} от «${d.day}» ${d.month} ${d.year} г.`,
              size: 18, color: C_MUTED,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: "АКТ", bold: true, size: 40, color: C_TEXT })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 },
          children: [
            new TextRun({ text: "приёма-передачи товара", italics: true, size: 22, color: C_MUTED }),
          ],
        }),
        pRuns([
          r(`г. ${data.contractCity}`),
          r("                                                                                       "),
          r(`«${d.day}» ${d.month} ${d.year} г.`),
        ], { spacing: 200 }),

        pRuns([
          r(`Общество с ограниченной ответственностью «${data.sellerCompanyName}», в лице `),
          r(data.sellerDirectorFullName || "_______________________________________", { bold: true }),
          r(`, действующего на основании ___________________, именуемое в дальнейшем «Продавец», с одной стороны, и`),
        ]),
        pRuns([
          r("Гражданин(ка) "),
          r(data.buyerFullName, { bold: true }),
          r(", именуемый(ая) в дальнейшем «Покупатель», с другой стороны,"),
        ]),
        p("именуемые совместно «Стороны», а по отдельности «Сторона», составили настоящий Акт о нижеследующем:", { spacing: 200 }),

        pRuns([
          r(`1. В соответствии с условиями Договора купли-продажи товара в рассрочку № `),
          r(data.contractNumber, { bold: true }),
          r(` от «${d.day}» ${d.month} ${d.year} г. (далее — «Договор») Продавец передал, а Покупатель принял Товар следующего ассортимента и количества:`),
        ]),
        p(" ", { spacing: 100 }),
        actTable,
        p(" ", { spacing: 200 }),

        pRuns([
          r(`2. Стоимость переданного Товара в соответствии с условиями Договора составляет `),
          r(`${fmtRub(data.totalPrice)} `, { bold: true }),
          r(`(${sumWords}) рублей 00 копеек.`),
        ]),
        p("3. Принятый Покупателем Товар обладает качеством, количеством, ассортиментом и комплектацией, соответствующими условиям Договора. Покупатель не имеет претензий к принятому Товару."),
        p("4. Одновременно с передачей Товара Продавец передал Покупателю принадлежности и относящиеся к Товару документы: ___________________________________________."),

        calloutBox({
          icon:   "🔒",
          title:  "ПЕРЕХОД РИСКА И ЗАЛОГ",
          body:   "С момента подписания настоящего Акта риск случайной гибели и случайного повреждения Товара переходит к Покупателю. Товар находится в залоге у Продавца до момента полной оплаты его стоимости в соответствии с условиями Договора.",
          bg:     C_CALLOUT_BG,
          border: C_CALLOUT_BORDER,
        }),
        p(" ", { spacing: 100 }),
        p("5. Настоящий Акт составлен в двух экземплярах, имеющих равную юридическую силу, по одному экземпляру для каждой из Сторон, и является неотъемлемой частью Договора."),
        p(" ", { spacing: 300 }),

        /* Подписи под актом */
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                cleanCell([
                  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "ПРОДАВЕЦ", bold: true, size: 20, color: C_BRAND })] }),
                  p("____________________________"),
                  p("подпись / Ф.И.О.    М.П.", { size: 18, color: C_MUTED }),
                ]),
                cleanCell([
                  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "ПОКУПАТЕЛЬ", bold: true, size: 20, color: C_BRAND })] }),
                  p("____________________________"),
                  p("подпись / Ф.И.О.", { size: 18, color: C_MUTED }),
                ]),
              ],
            }),
          ],
        }),
      ],
    }],
  });

  const blob = await Packer.toBuffer(doc);
  return new Uint8Array(blob);
}

/* ── Хелпер: сгенерировать данные графика из loan ────────────── */
export function buildSchedule(opts: {
  startDate:      string;
  downPayment:    number;
  monthlyPayment: number;
  termMonths:     number;
}): ContractData["schedule"] {
  const out: ContractData["schedule"] = [];
  const start = new Date(opts.startDate);

  out.push({
    n:        "—",
    date:     opts.startDate,
    amount:   opts.downPayment,
    purpose:  "Первоначальный взнос",
  });

  for (let i = 1; i <= opts.termMonths; i++) {
    const dt = new Date(start);
    dt.setMonth(dt.getMonth() + i);
    out.push({
      n:        i,
      date:     dt.toISOString().slice(0, 10),
      amount:   opts.monthlyPayment,
      purpose:  "Ежемесячный платёж",
    });
  }
  return out;
}
