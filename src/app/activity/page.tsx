import Link from "next/link";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

const ACTION_STYLE: Record<string, string> = {
  CREATE: "text-rating-low",
  UPDATE: "text-steel",
  DELETE: "text-rating-critical",
  ESCALATE: "text-rating-high",
  CLOSE: "text-ink/60",
  REOPEN: "text-rating-medium",
};

type Described = { label: string; href: string | null };

async function describe(entity: string, entityId: string): Promise<Described> {
  try {
    switch (entity) {
      case "Risk": {
        const r = await db.risk.findUnique({ where: { id: entityId } });
        return r ? { label: `${r.ref} — ${r.title}`, href: `/risks/${r.id}` } : { label: entityId, href: null };
      }
      case "RiskAssessment": {
        const a = await db.riskAssessment.findUnique({ where: { id: entityId }, include: { risk: true } });
        return a
          ? { label: `${a.risk.ref} ${a.kind.toLowerCase()} assessment`, href: `/risks/${a.riskId}` }
          : { label: entityId, href: null };
      }
      case "MitigationAction": {
        const m = await db.mitigationAction.findUnique({ where: { id: entityId }, include: { risk: true } });
        return m
          ? { label: `${m.risk.ref} action: ${m.description.slice(0, 50)}`, href: `/risks/${m.riskId}` }
          : { label: entityId, href: null };
      }
      case "ProgressNote": {
        const n = await db.progressNote.findUnique({ where: { id: entityId }, include: { risk: true } });
        return n ? { label: `${n.risk.ref} progress note`, href: `/risks/${n.riskId}` } : { label: entityId, href: null };
      }
      case "Issue": {
        const i = await db.issue.findUnique({ where: { id: entityId } });
        return i ? { label: `${i.ref} — ${i.description.slice(0, 50)}`, href: "/issues" } : { label: entityId, href: null };
      }
      case "ChangeRequest": {
        const c = await db.changeRequest.findUnique({ where: { id: entityId } });
        return c ? { label: `${c.ref} — ${c.description.slice(0, 50)}`, href: "/changes" } : { label: entityId, href: null };
      }
      case "ProjectAction": {
        const a = await db.projectAction.findUnique({ where: { id: entityId } });
        return a ? { label: `${a.ref} — ${a.description.slice(0, 50)}`, href: "/actions" } : { label: entityId, href: null };
      }
      case "Lesson": {
        const l = await db.lesson.findUnique({ where: { id: entityId } });
        return l ? { label: `${l.ref} — ${l.description.slice(0, 50)}`, href: "/lessons" } : { label: entityId, href: null };
      }
      case "Project": {
        const p = await db.project.findUnique({ where: { id: entityId } });
        return p ? { label: `Project: ${p.name}`, href: "/projects" } : { label: entityId, href: null };
      }
      default:
        return { label: entityId, href: null };
    }
  } catch {
    return { label: entityId, href: null };
  }
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: { actor?: string };
}) {
  const actorFilter = (searchParams.actor ?? "").trim().toLowerCase();
  const entries = await db.auditLog.findMany({
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const filtered = actorFilter
    ? entries.filter(
        (e) =>
          (e.actor?.name ?? "").toLowerCase().includes(actorFilter) ||
          (e.actor?.email ?? "").toLowerCase().includes(actorFilter)
      )
    : entries;
  const described = await Promise.all(filtered.map((e) => describe(e.entity, e.entityId)));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Activity</h1>
      <p className="text-sm text-ink/70 max-w-3xl">
        The most recent {filtered.length} audit-trail entries across all projects — who changed
        what, when. The full history of any risk is on its own page.
      </p>
      <form method="get" className="flex gap-2 items-end">
        <label className="block">
          <span className="lbl">Filter by person (name or email)</span>
          <input name="actor" defaultValue={searchParams.actor ?? ""} className="inp" placeholder="e.g. clare" />
        </label>
        <button className="btn-quiet">Filter</button>
        {actorFilter && (
          <Link href="/activity" className="text-sm text-ink/60 hover:underline underline-offset-4 pb-2">
            Clear
          </Link>
        )}
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[56rem]">
          <thead>
            <tr>
              <th className="th">When</th>
              <th className="th">Who</th>
              <th className="th">Action</th>
              <th className="th">What</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e, i) => (
              <tr key={e.id}>
                <td className="td font-mono text-xs whitespace-nowrap">
                  {e.createdAt.toISOString().replace("T", " ").slice(0, 16)}
                </td>
                <td className="td text-ink/80 whitespace-nowrap">
                  {e.actor ? e.actor.name : <span className="text-ink/50">(unattributed)</span>}
                  {e.actor && <span className="block text-[10px] text-ink/50">{e.actor.email}</span>}
                </td>
                <td className="td">
                  <span className={`text-xs font-semibold ${ACTION_STYLE[e.action] ?? "text-ink/70"}`}>
                    {e.action}
                  </span>
                  <span className="block text-[10px] text-ink/50">{e.entity}</span>
                </td>
                <td className="td">
                  {described[i].href ? (
                    <Link href={described[i].href as string} className="hover:underline underline-offset-4">
                      {described[i].label}
                    </Link>
                  ) : (
                    described[i].label
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="td text-ink/60" colSpan={4}>
                  No activity matches that filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
