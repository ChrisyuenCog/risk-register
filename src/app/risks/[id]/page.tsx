import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { breachesAppetite, type Ranking as RankingT } from "@/lib/scoring";
import {
  addAction,
  addNote,
  closeRisk,
  escalateRisk,
  reassess,
  reopenRisk,
  setActionStatus,
  setAppetite,
} from "@/server/actions";
import { Matrix, RatingBadge, RANKING_LABEL } from "@/components/rating";
import { ScoreFields } from "@/components/score-fields";
import type { RiskAssessment } from "@prisma/client";

export const dynamic = "force-dynamic";

const RANKS = ["VERY_LOW", "LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
const ACTION_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "COMPLETE", "OVERDUE"] as const;

function fmt(d: Date | null | undefined) {
  return d ? new Date(d).toISOString().slice(0, 10) : "—";
}

function AssessmentBlock({ title, a }: { title: string; a?: RiskAssessment }) {
  if (!a) return null;
  const dims = [
    ["Cost", a.costImpact, a.costRanking],
    ["Time", a.timeImpact, a.timeRanking],
    ["Quality", a.qualityImpact, a.qualityRanking],
    ["Reputation", a.reputationImpact, a.reputationRanking],
  ] as const;
  return (
    <div>
      <h3 className="lbl">{title} · assessed {fmt(a.assessedAt)}</h3>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="th">Dimension</th>
            <th className="th">Impact</th>
            <th className="th">Importance (L×I)</th>
            <th className="th">Ranking</th>
          </tr>
        </thead>
        <tbody>
          {dims.map(([label, impact, ranking]) => (
            <tr key={label}>
              <td className="td">{label}</td>
              <td className="td font-mono">{impact}</td>
              <td className="td font-mono">{a.likelihood * impact}</td>
              <td className="td"><RatingBadge ranking={ranking} /></td>
            </tr>
          ))}
          <tr className="bg-field/60">
            <td className="td font-medium">Combined (L{a.likelihood} × I{a.combinedImpact})</td>
            <td className="td font-mono">{a.combinedImpact}</td>
            <td className="td font-mono">{a.likelihood * a.combinedImpact}</td>
            <td className="td"><RatingBadge ranking={a.combinedRanking} /></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default async function RiskPage({ params }: { params: { id: string } }) {
  const risk = await db.risk.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      assessments: { orderBy: { assessedAt: "desc" } },
      actions: { orderBy: { sequence: "asc" } },
      notes: { orderBy: { createdAt: "desc" } },
      issue: true,
    },
  });
  if (!risk) notFound();

  const inherent = risk.assessments.find((a) => a.kind === "INHERENT");
  const residual = risk.assessments.find((a) => a.kind === "RESIDUAL");
  const breach =
    residual &&
    breachesAppetite(residual.combinedRanking as RankingT, risk.appetiteMaxRanking as RankingT);

  const auditRows = await db.auditLog.findMany({
    where: {
      OR: [
        { entity: "Risk", entityId: risk.id },
        { entityId: { in: [...risk.actions.map((a) => a.id), ...risk.assessments.map((a) => a.id), ...risk.notes.map((n) => n.id)] } },
      ],
    },
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  const reassessInherent = reassess.bind(null, risk.id, "INHERENT");
  const reassessResidual = reassess.bind(null, risk.id, "RESIDUAL");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-ink/60 text-sm">{risk.ref} · {risk.category.name} · {risk.impactArea ?? "—"}</p>
          <h1 className="text-xl font-semibold tracking-tight">{risk.title}</h1>
          <p className="text-sm text-ink/70 mt-1 max-w-2xl">{risk.description}</p>
          <p className="text-sm text-ink/70 mt-1 max-w-2xl"><b>Impact:</b> {risk.impactDescription}</p>
          <p className="text-sm text-ink/70 mt-1">Owner(s): {risk.ownerNames}</p>
        </div>
        <div className="text-right space-y-2">
          <p className="text-xs uppercase tracking-wide text-ink/60">Status: <b>{risk.status}</b></p>
          {residual && <RatingBadge ranking={residual.combinedRanking} />}
          {breach && (
            <p className="text-rating-critical text-xs font-semibold uppercase">
              Breaches appetite ({RANKING_LABEL[risk.appetiteMaxRanking]})
            </p>
          )}
          {risk.issue && (
            <p className="text-xs text-ink/60">Escalated as issue <b className="font-mono">{risk.issue.ref}</b></p>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <section className="card p-4 space-y-5">
          <AssessmentBlock title="Inherent — before mitigation" a={inherent} />
          <AssessmentBlock title="Residual — after mitigation" a={residual} />
        </section>
        <section className="card p-4">
          <h2 className="lbl">Position on the matrix</h2>
          <Matrix
            inherent={inherent && { likelihood: inherent.likelihood, impact: inherent.combinedImpact }}
            residual={residual && { likelihood: residual.likelihood, impact: residual.combinedImpact }}
          />
          <form action={setAppetite.bind(null, risk.id)} className="mt-4 space-y-2">
            <label className="block">
              <span className="lbl">Appetite — max acceptable residual</span>
              <select name="appetite" defaultValue={risk.appetiteMaxRanking} className="inp">
                {RANKS.map((r) => (
                  <option key={r} value={r}>{RANKING_LABEL[r]}</option>
                ))}
              </select>
            </label>
            <button className="btn-quiet">Confirm appetite</button>
            {risk.appetiteConfirmed && <p className="text-xs text-ink/50">Appetite confirmed.</p>}
          </form>
        </section>
      </div>

      <section className="card p-4">
        <h2 className="lbl">Mitigation actions</h2>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="th">#</th>
              <th className="th">Action</th>
              <th className="th">Owner</th>
              <th className="th">Target</th>
              <th className="th">Status</th>
            </tr>
          </thead>
          <tbody>
            {risk.actions.map((a) => (
              <tr key={a.id}>
                <td className="td font-mono text-ink/60">{a.sequence}</td>
                <td className="td">{a.description}</td>
                <td className="td text-ink/70">{a.ownerName ?? "—"}</td>
                <td className="td font-mono text-xs">{fmt(a.targetDate)}</td>
                <td className="td">
                  <form action={setActionStatus.bind(null, a.id)} className="flex gap-1.5">
                    <select name="status" defaultValue={a.status} className="inp !w-auto text-xs">
                      {ACTION_STATUSES.map((s) => (
                        <option key={s} value={s}>{s.replace("_", " ").toLowerCase()}</option>
                      ))}
                    </select>
                    <button className="btn-quiet !px-2 !py-1 text-xs">Set</button>
                  </form>
                </td>
              </tr>
            ))}
            {risk.actions.length === 0 && (
              <tr><td className="td text-ink/60" colSpan={5}>No mitigation actions yet — add the first one below.</td></tr>
            )}
          </tbody>
        </table>
        <form action={addAction.bind(null, risk.id)} className="mt-3 grid gap-2 sm:grid-cols-[1fr_12rem_10rem_auto] items-end">
          <label><span className="lbl">New action</span><input name="description" className="inp" required minLength={3} /></label>
          <label><span className="lbl">Owner</span><input name="ownerName" className="inp" /></label>
          <label><span className="lbl">Target date</span><input type="date" name="targetDate" className="inp" /></label>
          <button className="btn">Add action</button>
        </form>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-4 space-y-3">
          <h2 className="lbl">Re-assess</h2>
          <form action={reassessInherent} className="space-y-2">
            <ScoreFields
              legend="New inherent assessment"
              defaults={inherent && {
                likelihood: inherent.likelihood, cost: inherent.costImpact, time: inherent.timeImpact,
                quality: inherent.qualityImpact, reputation: inherent.reputationImpact,
              }}
            />
            <button className="btn-quiet">Record inherent</button>
          </form>
          <form action={reassessResidual} className="space-y-2">
            <ScoreFields
              legend="New residual assessment"
              defaults={residual && {
                likelihood: residual.likelihood, cost: residual.costImpact, time: residual.timeImpact,
                quality: residual.qualityImpact, reputation: residual.reputationImpact,
              }}
            />
            <button className="btn-quiet">Record residual</button>
          </form>
          <p className="text-xs text-ink/50">
            Assessments are versioned — each record is kept, so history and change-since-last-review
            are preserved.
          </p>
        </section>

        <section className="card p-4 space-y-3">
          <h2 className="lbl">Progress notes</h2>
          <form action={addNote.bind(null, risk.id)} className="grid gap-2 sm:grid-cols-[1fr_10rem_auto] items-end">
            <label><span className="lbl">Update</span><input name="body" className="inp" required /></label>
            <label><span className="lbl">Author</span><input name="author" className="inp" required /></label>
            <button className="btn">Add note</button>
          </form>
          <ul className="divide-y divide-line">
            {risk.notes.map((n) => (
              <li key={n.id} className="py-2 text-sm">
                <p>{n.body}</p>
                <p className="text-xs text-ink/50 mt-0.5">{n.author} · {fmt(n.createdAt)}</p>
              </li>
            ))}
            {risk.notes.length === 0 && <li className="py-2 text-sm text-ink/60">No notes yet.</li>}
          </ul>
        </section>
      </div>

      <section className="card p-4">
        <h2 className="lbl">Lifecycle</h2>
        <div className="flex flex-wrap gap-2 items-end">
          {risk.status === "OPEN" && (
            <>
              <form action={escalateRisk.bind(null, risk.id)} className="flex gap-2 items-end">
                <label><span className="lbl">Raised by</span><input name="raisedBy" className="inp !w-40" required /></label>
                <button className="btn-quiet">Escalate to issue</button>
              </form>
              <form action={closeRisk.bind(null, risk.id)}>
                <button className="btn-quiet">Close risk</button>
              </form>
            </>
          )}
          {risk.status === "CLOSED" && (
            <form action={reopenRisk.bind(null, risk.id)}>
              <button className="btn-quiet">Reopen risk</button>
            </form>
          )}
          {risk.status === "ESCALATED" && (
            <p className="text-sm text-ink/60">This risk lives on the issue log as {risk.issue?.ref}. The register entry is retained for lineage.</p>
          )}
        </div>
      </section>

      <section className="card p-4">
        <h2 className="lbl">Audit trail (latest {auditRows.length})</h2>
        <table className="w-full text-sm">
          <thead>
            <tr><th className="th">When</th><th className="th">Actor</th><th className="th">Entity</th><th className="th">Action</th></tr>
          </thead>
          <tbody>
            {auditRows.map((a) => (
              <tr key={a.id}>
                <td className="td font-mono text-xs">{new Date(a.createdAt).toISOString().replace("T", " ").slice(0, 16)}</td>
                <td className="td text-ink/70">{a.actor?.name ?? "system"}</td>
                <td className="td text-ink/70">{a.entity}</td>
                <td className="td text-xs uppercase tracking-wide">{a.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
