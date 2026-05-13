/**
 * lib/contract/numbers-to-words.ts
 * Преобразование числа в текст прописью по-русски (для договоров).
 *   numberToWordsRubles(12500) → "двенадцать тысяч пятьсот"
 *   В договоре пишется: "12 500 (двенадцать тысяч пятьсот) рублей 00 копеек"
 */

const ones    = ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
const onesF   = ["", "одна", "две", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"]; // женский род для тысяч
const teens   = ["десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать"];
const tens    = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"];
const hundreds = ["", "сто", "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот"];

function tripletToWords(n: number, feminine = false): string {
  if (n === 0) return "";
  const o = feminine ? onesF : ones;
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const u = n % 10;
  if (h > 0) parts.push(hundreds[h]);
  if (t === 1) parts.push(teens[u]);
  else {
    if (t > 0) parts.push(tens[t]);
    if (u > 0) parts.push(o[u]);
  }
  return parts.join(" ");
}

function pluralForm(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

/** Целое неотрицательное число прописью (для рублей) */
export function numberToWords(n: number): string {
  n = Math.max(0, Math.floor(n));
  if (n === 0) return "ноль";

  const billion  = Math.floor(n / 1_000_000_000);
  const million  = Math.floor((n % 1_000_000_000) / 1_000_000);
  const thousand = Math.floor((n % 1_000_000) / 1_000);
  const rest     = n % 1_000;

  const parts: string[] = [];
  if (billion > 0)  parts.push(tripletToWords(billion) + " " + pluralForm(billion, "миллиард", "миллиарда", "миллиардов"));
  if (million > 0)  parts.push(tripletToWords(million) + " " + pluralForm(million, "миллион", "миллиона", "миллионов"));
  if (thousand > 0) parts.push(tripletToWords(thousand, true) + " " + pluralForm(thousand, "тысяча", "тысячи", "тысяч"));
  if (rest > 0)     parts.push(tripletToWords(rest));

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/** "12 500 (двенадцать тысяч пятьсот) рублей 00 копеек" */
export function rublesInWords(n: number): string {
  const intPart = Math.floor(n);
  const fmt = intPart.toLocaleString("ru-RU");
  return `${fmt} (${numberToWords(intPart)}) рублей 00 копеек`;
}

/** Дата формата "15" "мая" 2026 г. */
const monthsGenitive = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

export function dateToRuParts(isoDate: string): { day: string; month: string; year: string } {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return { day: "___", month: "_______", year: "___" };
  return {
    day:   String(d.getDate()).padStart(2, "0"),
    month: monthsGenitive[d.getMonth()],
    year:  String(d.getFullYear()),
  };
}
