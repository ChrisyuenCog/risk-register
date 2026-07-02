import { listProjects, getCurrentProject } from "@/server/project";
import { switchProject, createProject } from "@/server/project-actions";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const [projects, current] = await Promise.all([listProjects(), getCurrentProject()]);

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Projects</h1>
      <p className="text-sm text-ink/70">
        Each project has its own register, references, categories, and issue log. The active
        project is shown in the header; switching applies to your browser only.
      </p>

      <div className="card divide-y divide-line">
        {projects.map((p) => (
          <div key={p.id} className="p-3 flex items-center gap-3">
            <div className="flex-1">
              <p className="font-medium">
                {p.name}
                {p.id === current.id && (
                  <span className="ml-2 text-[11px] uppercase tracking-wide text-steel">active</span>
                )}
              </p>
              <p className="text-xs text-ink/60">
                {p.client ?? "—"} · {p._count.risks} risk{p._count.risks === 1 ? "" : "s"} ·{" "}
                {p._count.issues} issue{p._count.issues === 1 ? "" : "s"}
              </p>
            </div>
            {p.id !== current.id && (
              <form action={switchProject}>
                <input type="hidden" name="projectId" value={p.id} />
                <button className="btn-quiet">Switch</button>
              </form>
            )}
          </div>
        ))}
      </div>

      <form action={createProject} className="card p-4 space-y-3">
        <h2 className="lbl">New project</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="lbl">Name</span>
            <input name="name" className="inp" required minLength={2} />
          </label>
          <label className="block">
            <span className="lbl">Client</span>
            <input name="client" className="inp" />
          </label>
          <label className="block">
            <span className="lbl">Division</span>
            <input name="division" className="inp" />
          </label>
        </div>
        <p className="text-xs text-ink/60">
          The standard category set (HS, HR, PM, OP, FN, PL, EN, IT) is created automatically,
          and you're switched to the new project.
        </p>
        <button className="btn">Create project</button>
      </form>
    </div>
  );
}
