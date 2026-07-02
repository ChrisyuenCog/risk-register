import Link from "next/link";
import { db } from "@/server/db";
import { RatingBadge } from "@/components/rating";

export const dynamic = "force-dynamic";

const RAG_STYLE: Record<string, string> = {
  RED: "bg-rating-critical",
  AMBER: "bg-rating-medium",
  GREEN: "bg-rating-low",
};

export default async function IssuesPage() {
  const issues = await db.issue.findMany({
    include: { risk: true },
    orderBy: { raisedAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Issue log</h1>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[48rem]">
          <thead>
            <tr>
              <th className="th">Ref</th>
              <th className="th">Description</th>
              <th className="th">From risk</th>
              <th className="th">Raised by</th>
              <th className="th">Severity</th>
              <th className="th">RAG</th>
              <th className="th">Target</th>
              <th className="th">Resolved</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((i) => (
              <tr key={i.id}>
                <td className="td font-mono text-ink/70">{i.ref}</td>
                <td className="td">{i.description}</td>
                <td className="td font-mono text-xs">
                  {i.risk ? (
                    <Link href={`/risks/${i.risk.id}`} className="hover:underline">{i.risk.ref}</Link>
                  ) : ("—")}
                </td>
                <td className="td text-ink/70">{i.raisedBy}</td>
                <td className="td"><RatingBadge ranking={i.severity} /></td>
                <td className="td">
                  <span className={`inline-block w-3 h-3 rounded-full ${RAG_STYLE[i.rag]}`} title={i.rag} />
                </td>
                <td className="td font-mono text-xs">{i.targetDate ? new Date(i.targetDate).toISOString().slice(0, 10) : "—"}</td>
                <td className="td font-mono text-xs">{i.resolvedAt ? new Date(i.resolvedAt).toISOString().slice(0, 10) : "open"}</td>
              </tr>
            ))}
            {issues.length === 0 && (
              <tr>
                <td className="td text-ink/60" colSpan={8}>
                  No issues yet. Escalating a risk from its detail page creates one here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
