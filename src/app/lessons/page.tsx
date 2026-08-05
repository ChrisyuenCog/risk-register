import { db } from "@/server/db";
import { getCurrentProject } from "@/server/project";
import { createLesson } from "@/server/rical-actions";

export const dynamic = "force-dynamic";

const d = (v: Date) => new Date(v).toISOString().slice(0, 10);

export default async function LessonsPage() {
  const project = await getCurrentProject();
  const lessons = await db.lesson.findMany({
    where: { projectId: project.id },
    orderBy: { ref: "asc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">
        Lessons learned <span className="text-ink/50 font-normal">— {project.name}</span>
      </h1>
      <p className="text-sm text-ink/70 max-w-3xl">
        Collect lessons throughout the project — don't wait for closure. Record what happened,
        and what future projects should do differently.
      </p>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[56rem]">
          <thead>
            <tr>
              <th className="th">Ref</th>
              <th className="th">Lesson</th>
              <th className="th">Raised by</th>
              <th className="th">Date</th>
              <th className="th">Owner</th>
              <th className="th">Impact & follow-on action</th>
            </tr>
          </thead>
          <tbody>
            {lessons.map((l) => (
              <tr key={l.id}>
                <td className="td font-mono text-ink/70">{l.ref}</td>
                <td className="td max-w-[20rem]">{l.description}</td>
                <td className="td text-ink/70">{l.raisedBy ?? "—"}</td>
                <td className="td font-mono text-xs">{d(l.raisedAt)}</td>
                <td className="td text-ink/70">{l.ownerName ?? "—"}</td>
                <td className="td text-ink/70 max-w-[20rem]">{l.impact ?? "—"}</td>
              </tr>
            ))}
            {lessons.length === 0 && (
              <tr>
                <td className="td text-ink/60" colSpan={6}>
                  No lessons captured yet for this project.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form action={createLesson} className="card p-4 space-y-3">
        <h2 className="lbl">Capture a lesson</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="lbl">Lesson description</span>
            <textarea name="description" rows={2} className="inp" required minLength={3} />
          </label>
          <label className="block">
            <span className="lbl">Raised by</span>
            <input name="raisedBy" className="inp" />
          </label>
          <label className="block">
            <span className="lbl">Owner</span>
            <input name="ownerName" className="inp" />
          </label>
          <label className="block sm:col-span-2">
            <span className="lbl">Impact & follow-on action</span>
            <textarea name="impact" rows={2} className="inp" />
          </label>
        </div>
        <button className="btn">Capture lesson</button>
      </form>
    </div>
  );
}
