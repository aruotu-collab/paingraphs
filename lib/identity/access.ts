import { and, eq } from "drizzle-orm";
import { OWNER_EMAIL } from "@/lib/admin";
import { db } from "@/lib/db";
import {
  permissions,
  rolePermissions,
  roles,
  userRoles,
} from "@/lib/db/schema";
import { writeAuditLog } from "./audit";
import {
  PERMISSION_ADMIN_ACCESS,
  PERMISSION_MARKETING_AGENT_ACCESS,
  ROLE_MEMBER,
  ROLE_OWNER,
} from "./constants";
import { ensureIdentityTables } from "./db";

const CATALOG = {
  roles: [
    { id: ROLE_OWNER, slug: ROLE_OWNER, name: "Owner" },
    { id: ROLE_MEMBER, slug: ROLE_MEMBER, name: "Member" },
  ],
  permissions: [
    {
      id: PERMISSION_ADMIN_ACCESS,
      slug: PERMISSION_ADMIN_ACCESS,
      name: "Admin access",
    },
    {
      id: PERMISSION_MARKETING_AGENT_ACCESS,
      slug: PERMISSION_MARKETING_AGENT_ACCESS,
      name: "Marketing Agent access",
    },
  ],
  grants: [
    [ROLE_OWNER, PERMISSION_ADMIN_ACCESS],
    [ROLE_OWNER, PERMISSION_MARKETING_AGENT_ACCESS],
  ] as const,
};

export type OwnerCapabilities = {
  userId: string;
  roles: string[];
  permissions: string[];
  admin: boolean;
  marketingAgent: boolean;
};

export async function seedPermissionCatalog() {
  await ensureIdentityTables();
  for (const role of CATALOG.roles) {
    await db.insert(roles).values(role).onConflictDoNothing();
  }
  for (const permission of CATALOG.permissions) {
    await db.insert(permissions).values(permission).onConflictDoNothing();
  }
  for (const [roleId, permissionId] of CATALOG.grants) {
    await db
      .insert(rolePermissions)
      .values({ roleId, permissionId })
      .onConflictDoNothing();
  }
}

export async function assignRole(userId: string, roleId: string) {
  await seedPermissionCatalog();
  await db
    .insert(userRoles)
    .values({ userId, roleId })
    .onConflictDoNothing();
}

export async function bootstrapOwnerAccount(user: {
  id: string;
  email?: string | null;
}) {
  const email = user.email?.trim().toLowerCase();
  if (!email || email !== OWNER_EMAIL) return false;

  await seedPermissionCatalog();
  const existing = await db
    .select({ roleId: userRoles.roleId })
    .from(userRoles)
    .where(and(eq(userRoles.userId, user.id), eq(userRoles.roleId, ROLE_OWNER)))
    .limit(1);
  if (existing.length > 0) return true;

  await assignRole(user.id, ROLE_OWNER);
  await assignRole(user.id, ROLE_MEMBER);
  await writeAuditLog({
    actorUserId: user.id,
    action: "owner_role_assigned",
    entityType: "user",
    entityId: user.id,
    metadata: { email },
  });
  return true;
}

export async function ensureMemberRole(userId: string) {
  await assignRole(userId, ROLE_MEMBER);
}

export async function listUserPermissions(userId: string) {
  await seedPermissionCatalog();
  const rows = await db
    .select({
      permission: permissions.slug,
      role: roles.slug,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(userRoles.userId, userId));

  const roleSlugs = new Set<string>();
  const permissionSlugs = new Set<string>();
  for (const row of rows) {
    roleSlugs.add(row.role);
    permissionSlugs.add(row.permission);
  }

  const assigned = await db
    .select({ role: roles.slug })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));
  for (const row of assigned) roleSlugs.add(row.role);

  return {
    roles: [...roleSlugs],
    permissions: [...permissionSlugs],
  };
}

export async function hasPermission(userId: string, permission: string) {
  const granted = await listUserPermissions(userId);
  return granted.permissions.includes(permission);
}

export async function resolveOwnerCapabilities(user: {
  id: string;
  email?: string | null;
}): Promise<OwnerCapabilities> {
  await bootstrapOwnerAccount(user);
  await ensureMemberRole(user.id);
  const granted = await listUserPermissions(user.id);
  return {
    userId: user.id,
    roles: granted.roles,
    permissions: granted.permissions,
    admin: granted.permissions.includes(PERMISSION_ADMIN_ACCESS),
    marketingAgent: granted.permissions.includes(
      PERMISSION_MARKETING_AGENT_ACCESS,
    ),
  };
}
