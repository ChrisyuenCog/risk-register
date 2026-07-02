import { db } from "@/server/db";
import { getCurrentProject } from "@/server/project";
import { createRisk } from "@/server/actions";
import { ScoreFields } from "@/components/score-fields";

export const dynamic = "force-dynamic";

const IMPACT_AREAS = ["People", "Operations", "Commercial", "Reputational", "Quality", "Systems"];

export default async function NewRiskPage() {
  const project = await getCurrentProject();
  const categories = await db.riskCategory.findMany({
    where: { projectId: project.id },
    orderBy: { code: "asc" },
  });

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">New risk</h1>
      <form action={createRisk} className="card p-4 space-y-4">
        <label className="block">
          <span className="lbl">Title</span>
          <input name="title" className="inp" required minLength={3} />
        </label>
        <label className="block">
          <span className="lbl">Description — what might happen, and why</span>
          <textarea name="description" className="inp" rows={3} required minLength={3} />
        </label>
        <label className="block">
          <span className="lbl">Impact description — the consequence if it does</span>
          <textarea name="impactDescription" className="inp" rows={2} required minLength={3} />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="lbl">Category</span>
            <select name="categoryId" className="inp" required>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="lbl">Impact area</span>
            <select name="impactArea" className="inp">
              <option value="">—</option>
              {IMPACT_AREAS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="lbl">Risk owner(s)</span>
            <input name="ownerNames" className="inp" required placeholder="Name, Name" />
          </label>
        </div>

        <ScoreFields prefix="inherent_" legend="Inherent assessment — before mitigation" />
        <ScoreFields prefix="residual_" legend="Residual assessment — assuming mitigations succeed" />

        <p className="text-xs text-ink/60">
          The reference (e.g. HS1) is assigned automatically from the category. Importance and
          ranking are derived by the scoring engine; appetite defaults from the category and can
          be adjusted on the risk page.
        </p>
        <button className="btn">Create risk</button>
      </form>
    </div>
  );
}
