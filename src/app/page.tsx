import Link from "next/link";
import { dashboardData } from "@/server/register";
import { Matrix, RatingBadge, RANKING_LABEL, RANKING_BG } from "@/components/rating";
import type { Ranking } from "@prisma/client";

export const dynamic = "force-dynamic";

const ORDER: Ranking[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "VERY_LOW"];

export default async function Dashboard() {
  const d = await dashboardData();
  const openWithResidual = d.open.filter((r) => r.residual).length || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Live dashboard</h1>
        <p className="text-sm text-ink/60">
          {d.open.length} open · {d.escalated} escalated · {d.closed} closed
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <section className="card p-4 space-y-4">
          <h2 className="lbl">Residual exposure profile (open risks)</h2>
          <div className="space-y-1.5">
            {ORDER.map((rank) => {
              const n = d.byRanking.get(rank) ?? 0;
              const pct = Math.round((n / openWithResidual) * 100);
              return (
                <div key={rank} className="grid grid-cols-[6rem_1fr_5rem] items-center gap-2 text-sm">
                  <span className="text-ink/70">{RANKING_LABEL[rank]}</span>
                  <div className="h-4 bg-field rounded-sm overflow-hidden">
                    <div className={`h-full ${RANKING_BG[rank]}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="font-mono text-xs text-ink/70">{n} · {pct}%</span>
                </div>
              );
            })}
          </div>

          <h2 className="lbl pt-2">Distribution by category</h2>
          <div className="flex flex-wrap gap-2">
            {Array.from(d.byCategory.entries()).map(([code, n]) => (
              <span key={code} className="border border-line rounded-sm px-2 py-1 text-sm font-mono">
                {code} <b>{n}</b>
              </span>
            ))}
          </div>
        </section>

        <section className="card p-4">
          <h2 className="lbl">Register heatmap — residual position</h2>
          <Matrix counts={d.matrixCounts} />
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card p-4">
          <h2 className="lbl">Appetite breaches ({d.breaches.length})</h2>
          {d.breaches.length === 0 ? (
            <p className="text-sm text-ink/60">No open risk exceeds its appetite threshold.</p>
          ) : (
            <ul className="divide-y divide-line">
              {d.breaches.map((r) => (
                <li key={r.id} className="py-2 flex items-center gap-3 text-sm">
                  <span className="font-mono text-ink/70 w-10">{r.ref}</span>
                  <Link href={`/risks/${r.id}`} className="flex-1 hover:underline">{r.title}</Link>
                  <RatingBadge ranking={r.residual!.combinedRanking} />
                  <span className="text-ink/50 text-xs">appetite {RANKING_LABEL[r.appetiteMaxRanking]}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-sm">
            <span className="font-semibold">{d.overdueActions}</span>{" "}
            <span className="text-ink/60">mitigation actions past their target date</span>
          </p>
        </section>

        <section className="card p-4">
          <h2 className="lbl">Top risks by residual rating</h2>
          <ul className="divide-y divide-line">
            {d.topRisks.map((r) => (
              <li key={r.id} className="py-2 flex items-center gap-3 text-sm">
                <span className="font-mono text-ink/70 w-10">{r.ref}</span>
                <Link href={`/risks/${r.id}`} className="flex-1 hover:underline">{r.title}</Link>
                <RatingBadge ranking={r.residual!.combinedRanking} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
