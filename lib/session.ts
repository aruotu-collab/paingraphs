import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/admin";
import { auth } from "@/lib/auth";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function getAdminSession() {
  const session = await getSession();
  if (!session || !isAdminEmail(session.user.email)) return null;
  return session;
}

export async function requireAdmin(next = "/admin") {
  const session = await getSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }
  if (!isAdminEmail(session.user.email)) notFound();
  return session;
}
