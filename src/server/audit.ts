import { db } from "./db";
import type { Prisma } from "@prisma/client";

/**
 * Append-only audit trail (FR-X1). Every server action records the
 * entity, action, and before/after snapshots. Until authentication
 * lands (roadmap phase 5), the actor is the seeded Risk Manager user.
 */
export async function audit(params: {
  entity: string;
  entityId: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "ESCALATE" | "CLOSE" | "REOPEN";
  before?: unknown;
  after?: unknown;
}) {
  const actor = await db.user.findFirst({ orderBy: { createdAt: "asc" } });
  await db.auditLog.create({
    data: {
      actorId: actor?.id,
      entity: params.entity,
      entityId: params.entityId,
      action: params.action,
      before: (params.before ?? undefined) as Prisma.InputJsonValue | undefined,
      after: (params.after ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}
