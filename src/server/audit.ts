import { headers } from "next/headers";
import { db } from "./db";
import type { Prisma } from "@prisma/client";

/**
 * Append-only audit trail (FR-X1). Every server action records the entity,
 * action, and before/after snapshots. The actor is the signed-in user when
 * the app runs behind App Service authentication (Entra ID sends the
 * identity in x-ms-client-principal-name); otherwise the system user.
 */
async function resolveActor() {
  let email: string | null = null;
  let name: string | null = null;
  try {
    const h = headers();
    email = h.get("x-ms-client-principal-name");
    name = h.get("x-ms-client-principal-idp") ? email : null;
  } catch {
    // outside a request scope
  }
  if (email) {
    return db.user.upsert({
      where: { email: email.toLowerCase() },
      update: {},
      create: { email: email.toLowerCase(), name: name ?? email.split("@")[0] },
    });
  }
  return db.user.findFirst({ orderBy: { createdAt: "asc" } });
}

export async function audit(params: {
  entity: string;
  entityId: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "ESCALATE" | "CLOSE" | "REOPEN";
  before?: unknown;
  after?: unknown;
}) {
  const actor = await resolveActor();
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
