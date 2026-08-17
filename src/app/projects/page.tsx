import { listProjects, getCurrentProject } from "@/server/project";
import { switchProject, createProject, setProjectRestricted, addProjectMember, removeProjectMember } from "@/server/project-actions";
import { isAdmin } from "@/server/admin";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const [projects, current] = await Promise.all([listProjects(), getCurrentProject()]);
  const admin = isAdmin();
  const memberships = admin
    ? await db.projectMember.findMany({ include: { user: true } })
    : [];

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Projects</h1>
      <p className="text-sm text-ink/70">
        Each project has its own register, references, categories, and issue log. The active
        project is shown in the header; switching applies to your browser only.
      </p>

      <div className="card divide-y divide-line">
        {projects.map((p) => (
          <div key={p.id}><div className="p-3 flex items-center gap-3">
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
            {admin && (
              <div className="px-3 pb-3 -mt-1 space-y-2">
                <div className="flex items-center gap-3 text-xs">
                  <span className={`font-semibold ${p.restricted ? "text-rating-critical" : "text-ink/50"}`}>
                    {p.restricted ? "RESTRICTED — members only" : "Open to all signed-in users"}
                  </span>
                  <form action={setProjectRestricted.bind(null, p.id, !p.restricted)}>
                    <button className="btn-quiet text-xs">{p.restricted ? "Make open" : "Make restricted"}</button>
                  </form>
                </div>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {memberships.filter((m) => m.projectId === p.id).map((m) => (
                    <span key={m.id} className="inline-flex items-center gap-1 border border-line rounded-sm px-1.5 py-0.5 text-[11px]">
                      {m.user.email}
                      <form action={removeProjectMember.bind(null, m.id)}>
                        <button className="text-ink/50 hover:text-rating-critical" title="Remove member">✕</button>
                      </form>
                    </span>
                  ))}
                  <form action={addProjectMember.bind(null, p.id)} className="inline-flex gap-1">
                    <input type="email" name="email" className="inp text-xs py-0.5" placeholder="add member email…" required />
                    <button className="btn-quiet text-xs">Add</button>
                  </form>
                </div>
              </div>
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
