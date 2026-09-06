import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { ensureIdentityTables } from "./db";

export async function writeAuditLog(input: {
  actorUserId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  await ensureIdentityTables();
  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    actorUserId: input.actorUserId ?? null,
    action: input.action,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
  });
}
