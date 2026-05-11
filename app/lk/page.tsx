import { cookies }           from "next/headers";
import { verifySessionToken } from "@/lib/session";
import LkClient               from "./LkClient";

export default async function LkPage() {
  const jar     = await cookies();
  const token   = jar.get("nf_session")?.value;
  const payload = token ? verifySessionToken(token) : null;
  return <LkClient serverPhone={payload?.phone ?? null} />;
}
