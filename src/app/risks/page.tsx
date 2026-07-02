import Link from "next/link";
import { db } from "@/server/db";
import { loadRegister, sortRegister, type SortKey } from "@/server/register";
import { getCurrentProject } from "@/server/project";
import { RatingBadge, RANKING_LABEL } from "@/components/rating";

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { status?: string; category?: string; q?: string; sort?: string; dir?: string };
}) {
  const project = await getCurrentProject();
  const categories = await db.riskCategory.findMany({
    where: { projectId: project.id },
    orderBy: { code: "asc" },
  });
  const sort = (searchParams.sort as SortKey) || "ref";
  const dir = searchParams.dir === "desc" ? "desc" : "asc";
  const rows = sortRegister(
    await loadRegister({
      projectId: project.id,
      status: searchParams.status,
      categoryId: searchParams.category,
      q: searchParams.q,
    }),
    sort,
    dir
  );

  const SortTh = ({ k, children }: { k: SortKey; children: React.ReactNode }) => {
    const next = sort === k && dir === "asc" ? "desc" : "asc";
    const qs = new URLSearchParams();
    if (searchParams.q) qs.set("q", searchParams.q);
    if (searchParams.status) qs.set("status", searchParams.status);
    if (searchParams.category) qs.set("category", searchParams.category);
    qs.set("sort", k);
    qs.set("dir", next);
    return (
      <th className="th">
        <Link href={`/risks?${qs.toString()}`} className="inline-flex items-center gap-1 hover:text-ink">
          {children}
          <span className="text-[9px]">{sort === k ? (dir === "asc" ? "▲" : "▼") : "△▽"}</span>
        </Link>
      </th>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Risk register <span className="text-ink/50 font-normal">— {project.name}</span></h1>
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
              <SortTh k="ref">Ref</SortTh>
              <SortTh k="title">Risk</SortTh>
              <SortTh k="category">Category</SortTh>
              <SortTh k="owner">Owner(s)</SortTh>
              <SortTh k="inherent">Inherent</SortTh>
              <SortTh k="residual">Residual</SortTh>
              <SortTh k="appetite">Appetite</SortTh>
              <SortTh k="status">Status</SortTh>
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
