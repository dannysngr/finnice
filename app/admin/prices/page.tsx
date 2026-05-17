import { redirect } from "next/navigation";
import { getAdminRole } from "@/lib/adminAuth";
import { AdminPricesClient } from "./AdminPricesClient";

export const dynamic = "force-dynamic";

export default async function AdminPricesPage() {
  const role = await getAdminRole();
  if (role !== "root") redirect("/admin");
  return <AdminPricesClient />;
}
