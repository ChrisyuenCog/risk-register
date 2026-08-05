import { db } from "@/server/db";
import { getCurrentProject } from "@/server/project";
import { createProjectAction, setProjectActionStatus } from "@/server/rical-actions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  COMPLETE: "Complete",
  OVERDUE: "Overdue",
};
const STATUS_STYLE: Record<string, string> = {
  NOT_STARTED: "text-ink/60",
  IN_PROGRESS: "text-steel",
  COMPLETE: "text-rating-low",
  OVERDUE: "text-rating-critical",
};
const d = (v: Date | null) => (v ? new Date(v).toISOString().slice(0, 10) : "—");

export default async function ActionsPage() {
  const project = await getCurrentProject();
  const actions = await db.projectAction.findMany({
    where: { projectId: project.id },
    orderBy: { ref: "asc" },
  });
  const openCount = actions.filter((a) => a.status !== "COMPLETE").length;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">
        Action log <span className="text-ink/50 font-normal">— {project.name}</span>
      </h1>
      <p className="text-sm text-ink/70 max-w-3xl">
        Actions from meetings and reviews (distinct from risk mitigation actions, which live on
        each risk). {openCount} open of {actions.length} logged. Owners with an email receive the
        weekday reminder digest when actions are overdue or due within a week; past-due actions
        are marked overdue automatically.
      </p>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[64rem]">
          <thead>
            <tr>
              <th className="th">Ref</th>
              <th className="th">Action</th>
              <th className="th">Raised by</th>
              <th className="th">Raised</th>
              <th className="th">Owner</th>
              <th className="th">Target</th>
              <th className="th">Progress / status</th>
              <th className="th">Update</th>
            </tr>
          </thead>
          <tbody>
            {actions.map((a) => (
              <tr key={a.id} className={a.status === "COMPLETE" ? "opacity-60" : ""}>
                <td className="td font-mono text-ink/70">{a.ref}</td>
                <td className="td max-w-[20rem]">{a.description}</td>
                <td className="td text-ink/70">{a.raisedBy ?? "—"}</td>
                <td className="td font-mono text-xs">{d(a.raisedAt)}</td>
                <td className="td text-ink/70">
                  {a.ownerName ?? "—"}
                  {a.ownerEmail && <span className="block text-[10px] text-ink/50">{a.ownerEmail}</span>}
                </td>
                <td className="td font-mono text-xs">{d(a.targetDate)}</td>
                <td className="td">
                  <span className={`text-xs font-semibold ${STATUS_STYLE[a.status]}`}>
                    {STATUS_LABEL[a.status]}
                  </span>
                  {a.progress && <span className="block text-xs text-ink/60 max-w-[14rem]">{a.progress}</span>}
                </td>
                <td className="td">
                  {a.status !== "COMPLETE" ? (
                    <div className="space-y-1">
                      <form action={setProjectActionStatus.bind(null, a.id, "IN_PROGRESS")} className="flex gap-1">
                        <input name="progress" className="inp text-xs" placeholder="Progress note…" defaultValue="" />
                        <button className="btn-quiet text-xs">Note</button>
                      </form>
                      <form action={setProjectActionStatus.bind(null, a.id, "COMPLETE")}>
                        <button className="btn-quiet text-xs">Mark complete</button>
                      </form>
                    </div>
                  ) : (
                    <form action={setProjectActionStatus.bind(null, a.id, "IN_PROGRESS")}>
                      <button className="btn-quiet text-xs">Reopen</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {actions.length === 0 && (
              <tr>
                <td className="td text-ink/60" colSpan={8}>
                  No actions logged for this project.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form action={createProjectAction} className="card p-4 space-y-3">
        <h2 className="lbl">Log an action</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="lbl">Action description</span>
            <input name="description" className="inp" required minLength={3} />
          </label>
          <label className="block">
            <span className="lbl">Raised by</span>
            <input name="raisedBy" className="inp" />
          </label>
          <label className="block">
            <span className="lbl">Owner</span>
            <input name="ownerName" className="inp" />
          </label>
          <label className="block">
            <span className="lbl">Owner email (for reminders)</span>
            <input type="email" name="ownerEmail" className="inp" />
          </label>
          <label className="block">
            <span className="lbl">Target date</span>
            <input type="date" name="targetDate" className="inp" />
          </label>
        </div>
        <button className="btn">Log action</button>
      </form>
    </div>
  );
}
