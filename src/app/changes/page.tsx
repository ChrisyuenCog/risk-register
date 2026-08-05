import { db } from "@/server/db";
import { getCurrentProject } from "@/server/project";
import { createChange, setChangeClosed, recordAgreedChange } from "@/server/rical-actions";

export const dynamic = "force-dynamic";

const d = (v: Date | null) => (v ? new Date(v).toISOString().slice(0, 10) : "—");

export default async function ChangesPage() {
  const project = await getCurrentProject();
  const changes = await db.changeRequest.findMany({
    where: { projectId: project.id },
    orderBy: { ref: "asc" },
  });
  const open = changes.filter((c) => !c.closed).length;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">
        Change control log <span className="text-ink/50 font-normal">— {project.name}</span>
      </h1>
      <p className="text-sm text-ink/70 max-w-3xl">
        A Change Control Request must be raised for any change to agreed scope, deliverables,
        schedule, or budget. {open} open of {changes.length} raised. Every entry and update is
        audit-logged.
      </p>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[64rem]">
          <thead>
            <tr>
              <th className="th">Ref</th>
              <th className="th">Change description</th>
              <th className="th">Raised by</th>
              <th className="th">Effective date</th>
              <th className="th">Implications / reason</th>
              <th className="th">Agreed change</th>
              <th className="th">Status</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody>
            {changes.map((c) => (
              <tr key={c.id} className={c.closed ? "opacity-60" : ""}>
                <td className="td font-mono text-ink/70">{c.ref}</td>
                <td className="td max-w-[18rem]">{c.description}</td>
                <td className="td text-ink/70">{c.raisedBy}</td>
                <td className="td font-mono text-xs">{d(c.effectiveDate)}</td>
                <td className="td text-ink/70 max-w-[16rem]">{c.reason ?? "—"}</td>
                <td className="td max-w-[16rem]">
                  {c.agreedChange ? (
                    c.agreedChange
                  ) : c.closed ? (
                    "—"
                  ) : (
                    <form action={recordAgreedChange.bind(null, c.id)} className="flex gap-1">
                      <input name="agreedChange" className="inp text-xs" placeholder="Detail agreed change…" />
                      <button className="btn-quiet text-xs">Save</button>
                    </form>
                  )}
                </td>
                <td className="td">
                  <span className={`text-xs font-semibold ${c.closed ? "text-ink/50" : "text-steel"}`}>
                    {c.closed ? "CLOSED" : "OPEN"}
                  </span>
                </td>
                <td className="td">
                  <form action={setChangeClosed.bind(null, c.id, !c.closed)}>
                    <button className="btn-quiet text-xs">{c.closed ? "Reopen" : "Close"}</button>
                  </form>
                </td>
              </tr>
            ))}
            {changes.length === 0 && (
              <tr>
                <td className="td text-ink/60" colSpan={8}>
                  No change requests raised for this project.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form action={createChange} className="card p-4 space-y-3">
        <h2 className="lbl">Raise a change control request</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="lbl">Change description / identifier</span>
            <input name="description" className="inp" required minLength={3} />
          </label>
          <label className="block">
            <span className="lbl">Raised by</span>
            <input name="raisedBy" className="inp" />
          </label>
          <label className="block">
            <span className="lbl">Effective date</span>
            <input type="date" name="effectiveDate" className="inp" />
          </label>
          <label className="block sm:col-span-2">
            <span className="lbl">Implications / reason</span>
            <textarea name="reason" rows={2} className="inp" />
          </label>
          <label className="block sm:col-span-2">
            <span className="lbl">Detail agreed change (if already agreed)</span>
            <input name="agreedChange" className="inp" />
          </label>
        </div>
        <button className="btn">Raise change request</button>
      </form>
    </div>
  );
}
