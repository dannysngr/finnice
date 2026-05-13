/**
 * lib/profile-completion.ts
 *
 * Расчёт заполненности профиля клиента — общая логика для:
 *  • ЛК клиента (прогресс-бар сверху)
 *  • Админ-карточки клиента
 *  • Формы одобрения заявки (блокирует кнопку «Одобрить», пока не 100%)
 *
 * Email НЕ считается обязательным. Все остальные поля для договора —
 * обязательны. Совпадение адресов проживания/регистрации делает 4
 * поля проживания опциональными.
 */

import type { ProfileRecord } from "@/app/api/lk/me/route";

export type ProfileLike = Partial<ProfileRecord> & Record<string, unknown>;

export interface RequiredFieldSpec {
  key:   string;
  label: string;
  group: "ФИО" | "Личные" | "Паспорт" | "Адрес регистрации" | "Адрес проживания";
}

/** Базовый список обязательных полей (без email).
 *  Лейблы пишутся коротко, без повтора имени группы, — чтобы
 *  describeMissing давал "Паспорт (серия, номер, ...)" без тавтологии. */
const BASE_REQUIRED: RequiredFieldSpec[] = [
  { key: "lastName",   label: "Фамилия",  group: "ФИО" },
  { key: "firstName",  label: "Имя",      group: "ФИО" },
  { key: "patronymic", label: "Отчество", group: "ФИО" },

  { key: "birthDate",      label: "Дата рождения",  group: "Личные" },
  { key: "birthPlaceCity", label: "Место рождения", group: "Личные" },

  { key: "passportSeries",         label: "Серия",              group: "Паспорт" },
  { key: "passportNumber",         label: "Номер",              group: "Паспорт" },
  { key: "passportIssueDate",      label: "Дата выдачи",        group: "Паспорт" },
  { key: "passportIssuedBy",       label: "Кем выдан",          group: "Паспорт" },
  { key: "passportDepartmentCode", label: "Код подразделения",  group: "Паспорт" },

  { key: "addrCity",   label: "Город",  group: "Адрес регистрации" },
  { key: "addrStreet", label: "Улица",  group: "Адрес регистрации" },
  { key: "addrHouse",  label: "Дом",    group: "Адрес регистрации" },
];

const LIVING_REQUIRED: RequiredFieldSpec[] = [
  { key: "livingCity",   label: "Город", group: "Адрес проживания" },
  { key: "livingStreet", label: "Улица", group: "Адрес проживания" },
  { key: "livingHouse",  label: "Дом",   group: "Адрес проживания" },
];

function isFilled(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (typeof v === "number") return Number.isFinite(v);
  return Boolean(v);
}

export interface CompletionReport {
  percent:      number;          // 0..100 (целое)
  filled:       number;
  total:        number;
  missing:      RequiredFieldSpec[];
  missingByGroup: Record<string, RequiredFieldSpec[]>;
  isComplete:   boolean;
}

export function computeProfileCompletion(profile: ProfileLike | null | undefined): CompletionReport {
  const p = profile ?? {};

  /* Если адрес проживания совпадает с регистрацией — поля проживания не нужны */
  const includeLiving = !p.livingSameAsRegister;
  const required = includeLiving
    ? [...BASE_REQUIRED, ...LIVING_REQUIRED]
    : BASE_REQUIRED;

  const missing: RequiredFieldSpec[] = [];
  let filled = 0;
  for (const f of required) {
    if (isFilled((p as Record<string, unknown>)[f.key])) {
      filled++;
    } else {
      missing.push(f);
    }
  }

  const total = required.length;
  const percent = total === 0 ? 100 : Math.round((filled / total) * 100);

  const missingByGroup: Record<string, RequiredFieldSpec[]> = {};
  for (const m of missing) {
    if (!missingByGroup[m.group]) missingByGroup[m.group] = [];
    missingByGroup[m.group].push(m);
  }

  return {
    percent,
    filled,
    total,
    missing,
    missingByGroup,
    isComplete: filled === total,
  };
}

/** Краткое описание для tooltip / inline message */
export function describeMissing(report: CompletionReport): string {
  if (report.isComplete) return "Профиль заполнен полностью.";
  const groups = Object.entries(report.missingByGroup)
    .map(([g, fields]) => `${g}: ${fields.map(f => f.label.toLowerCase()).join(", ")}`)
    .join("; ");
  return `Не заполнено (${report.missing.length}): ${groups}.`;
}
