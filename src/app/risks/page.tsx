import Link from "next/link";
import { db } from "@/server/db";
import { loadRegister } from "@/server/register";
import { RatingBadge, RANKING_LABEL } from "@/components/rating";

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { status?: string; category?: string; q?: string };
}) {
  const categories = await db.riskCategory.findMany({ orderBy: { code: "asc" } });
  const rows = await loadRegister({
    status: searchParams.status,
    categoryId: searchParams.category,
    q: searchParams.q,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Risk register</h1>
        <Link href="/risks/new" className="btn">New risk</Link>
      </div>

      <form className="card p-3 flex flex-wrap items-end gap-3" method="get">
        <label>
          <span className="lbl">Search</span>
          <input name="q" defaultValue={searchParams.q ?? ""} className="inp w-56" placeholder="ref, title, owner…" />
        </label>
        <label>
          <span className="lbl">Status</span>
          <select name="status" defaultValue={searchParams.status ?? ""} className="inp">
            <option value="">All</option>
            <option value="OPEN">Open</option>
            <option value="ESCALATED">Escalated</option>
            <option value="CLOSED">Closed</option>
          </select>
        </label>
        <label>
          <span className="lbl">Category</span>
          <select name="category" defaultValue={searchParams.category ?? ""} className="inp">
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
            ))}
          </select>
        </label>
        <button className="btn-quiet">Apply</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[56rem]">
          <thead>
            <tr>
              <th className="th">Ref</th>
              <th className="th">Risk</th>
              <th className="th">Category</th>
              <th className="th">Owner(s)</th>
              <th className="th">Inherent</th>
              <th className="th">Residual</th>
              <th className="th">Appetite</th>
              <th className="th">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-field/60">
                <td className="td font-mono text-ink/70">{r.ref}</td>
                <td className="td">
                  <Link href={`/risks/${r.id}`} className="font-medium hover:underline">{r.title}</Link>
                </td>
                <td className="td text-ink/70">{r.category.name}</td>
                <td className="td text-ink/70">{r.ownerNames}</td>
                <td className="td">{r.inherent && <RatingBadge ranking={r.inherent.combinedRanking} />}</td>
                <td className="td">{r.residual && <RatingBadge ranking={r.residual.combinedRanking} />}</td>
                <td className="td text-xs">
                  {RANKING_LABEL[r.appetiteMaxRanking]}
                  {r.breachesAppetite && (
                    <span className="ml-1.5 text-rating-critical font-semibold uppercase text-[10px]">breach</span>
                  )}
                </td>
                <td className="td text-xs uppercase tracking-wide text-ink/60">{r.status}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="td text-ink/60" colSpan={8}>
                  No risks match these filters. Adjust the filters or add a new risk.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
