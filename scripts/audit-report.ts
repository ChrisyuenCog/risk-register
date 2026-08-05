/**
 * Audit report — prints recent audit-trail entries to the workflow log.
 * Env: DAYS (default 7), ACTOR (optional substring match on the actor's
 * name or email, case-insensitive, e.g. "clare").
 * Run via the "Audit report" workflow with DATABASE_URL.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function describeEntity(entity: string, entityId: string): Promise<string> {
  try {
    switch (entity) {
      case "Risk": {
        const r = await db.risk.findUnique({ where: { id: entityId } });
        return r ? `${r.ref} — ${r.title}` : entityId;
      }
      case "RiskAssessment": {
        const a = await db.riskAssessment.findUnique({ where: { id: entityId }, include: { risk: true } });
        return a ? `${a.risk.ref} ${a.kind.toLowerCase()} assessment` : entityId;
      }
      case "MitigationAction": {
        const m = await db.mitigationAction.findUnique({ where: { id: entityId }, include: { risk: true } });
        return m ? `${m.risk.ref} action ${m.sequence}: ${m.description.slice(0, 60)}` : entityId;
      }
      case "ProgressNote": {
        const n = await db.progressNote.findUnique({ where: { id: entityId }, include: { risk: true } });
        return n ? `${n.risk.ref} progress note` : entityId;
      }
      case "Issue": {
        const i = await db.issue.findUnique({ where: { id: entityId } });
        return i ? `${i.ref} — ${i.description.slice(0, 60)}` : entityId;
      }
      case "ChangeRequest": {
        const c = await db.changeRequest.findUnique({ where: { id: entityId } });
        return c ? `${c.ref} — ${c.description.slice(0, 60)}` : entityId;
      }
      case "ProjectAction": {
        const a = await db.projectAction.findUnique({ where: { id: entityId } });
        return a ? `${a.ref} — ${a.description.slice(0, 60)}` : entityId;
      }
      case "Lesson": {
        const l = await db.lesson.findUnique({ where: { id: entityId } });
        return l ? `${l.ref} — ${l.description.slice(0, 60)}` : entityId;
      }
      case "Project": {
        const p = await db.project.findUnique({ where: { id: entityId } });
        return p ? p.name : entityId;
      }
      default:
        return entityId;
    }
  } catch {
    return entityId;
  }
}

async function main() {
  const days = Number(process.env.DAYS || 7);
  const actorFilter = (process.env.ACTOR || "").trim().toLowerCase();
  const since = new Date(Date.now() - days * 86_400_000);

  const entries = await db.auditLog.findMany({
    where: { createdAt: { gte: since } },
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const filtered = actorFilter
    ? entries.filter(
        (e) =>
          (e.actor?.name ?? "").toLowerCase().includes(actorFilter) ||
          (e.actor?.email ?? "").toLowerCase().includes(actorFilter)
      )
    : entries;

  console.log(
    `Audit entries in the last ${days} day(s)` +
      (actorFilter ? ` for actor matching "${actorFilter}"` : "") +
      `: ${filtered.length}` +
      (entries.length === 500 ? " (capped at 500 total)" : "")
  );
  console.log("");

  for (const e of filtered) {
    const who = e.actor ? `${e.actor.name} <${e.actor.email}>` : "(unattributed)";
    const what = await describeEntity(e.entity, e.entityId);
    const ts = e.createdAt.toISOString().replace("T", " ").slice(0, 16);
    console.log(`${ts}  ${e.action.padEnd(8)} ${e.entity.padEnd(17)} ${what}`);
    console.log(`                  by ${who}`);
  }

  if (filtered.length === 0 && actorFilter) {
    const actors = [...new Set(entries.map((e) => e.actor?.email ?? "(unattributed)"))];
    console.log("No entries matched that actor. Actors active in this window:");
    for (const a of actors) console.log(`  - ${a}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
