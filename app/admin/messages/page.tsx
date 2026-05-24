import { redirect } from "next/navigation";
import { canViewFinance } from "@/lib/adminAuth";
import { TEMPLATES, getTemplateText } from "@/lib/telegram-templates";
import { MessagesClient } from "./MessagesClient";

export const metadata = {
  title: "Сообщения бота — Финнайс",
  robots: { index: false, follow: false },
};

export default async function MessagesAdminPage() {
  // Доступ root + admin (как у /admin/finance) — модератор не редактирует
  // тексты, которые бот шлёт всем клиентам.
  if (!(await canViewFinance())) redirect("/admin");

  const initialTemplates = await Promise.all(TEMPLATES.map(async (t) => {
    const currentText = await getTemplateText(t.key);
    return { ...t, currentText, isCustomized: currentText !== t.defaultText };
  }));

  return <MessagesClient initialTemplates={initialTemplates} />;
}
