import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  PERMISSION_ADMIN_ACCESS,
  PERMISSION_MARKETING_AGENT_ACCESS,
} from "@/lib/identity/constants";
import {
  resolveOwnerCapabilities,
  type OwnerCapabilities,
} from "@/lib/identity/access";
import { ensureUserProfile } from "@/lib/identity/profile";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession(next = "/home") {
  const session = await getSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }
  return session;
}

export async function getAccess(user: { id: string; email?: string | null }) {
  const [capabilities, profile] = await Promise.all([
    resolveOwnerCapabilities(user),
    ensureUserProfile(user.id),
  ]);
  return { capabilities, profile };
}

export async function getOwnerCapabilities(): Promise<OwnerCapabilities | null> {
  const session = await getSession();
  if (!session) return null;
  return resolveOwnerCapabilities(session.user);
}

export async function getAdminSession() {
  const session = await getSession();
  if (!session) return null;
  const capabilities = await resolveOwnerCapabilities(session.user);
  if (!capabilities.admin) return null;
  return session;
}

export async function requirePermission(
  permission: string,
  next = "/",
) {
  const session = await requireSession(next);
  const capabilities = await resolveOwnerCapabilities(session.user);
  if (!capabilities.permissions.includes(permission)) {
    redirect("/forbidden");
  }
  return { session, capabilities };
}

export async function requireAdmin(next = "/admin") {
  return requirePermission(PERMISSION_ADMIN_ACCESS, next);
}

export async function requireMarketingAgent(next = "/marketing-agent") {
  return requirePermission(PERMISSION_MARKETING_AGENT_ACCESS, next);
}
