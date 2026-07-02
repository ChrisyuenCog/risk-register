import type { Ranking } from "@prisma/client";
import { rank } from "@/lib/scoring";

export const RANKING_LABEL: Record<Ranking, string> = {
  VERY_LOW: "Very Low",
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const RANKING_BG: Record<Ranking, string> = {
  VERY_LOW: "bg-rating-verylow",
  LOW: "bg-rating-low",
  MEDIUM: "bg-rating-medium",
  HIGH: "bg-rating-high",
  CRITICAL: "bg-rating-critical",
};

export function RatingBadge({ ranking }: { ranking: Ranking }) {
  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded-sm text-[11px] font-semibold uppercase tracking-wide text-paper ${RANKING_BG[ranking]}`}
    >
      {RANKING_LABEL[ranking]}
    </span>
  );
}

export type Cell = { likelihood: number; impact: number };

/**
 * The 5×5 impact vs probability matrix (docs/SCORING.md), rendered live.
 * `counts` shades cells by how many risks sit there; `inherent`/`residual`
 * mark a single risk's movement across the matrix.
 */
export function Matrix({
  counts,
  inherent,
  residual,
}: {
  counts?: Map<string, number>;
  inherent?: Cell;
  residual?: Cell;
}) {
  const max = counts ? Math.max(1, ...Array.from(counts.values())) : 1;
  return (
    <div className="inline-block">
      <div className="grid grid-cols-[auto_repeat(5,minmax(2.4rem,1fr))] gap-px bg-line border border-line">
        {[5, 4, 3, 2, 1].map((impact) => (
          <>
            <div key={`l${impact}`} className="bg-paper px-1.5 flex items-center justify-center text-[10px] text-ink/60 font-mono">
              I{impact}
            </div>
            {[1, 2, 3, 4, 5].map((likelihood) => {
              const ranking = rank(likelihood, impact) as Ranking;
              const n = counts?.get(`${likelihood}:${impact}`) ?? 0;
              const isInh = inherent?.likelihood === likelihood && inherent?.impact === impact;
              const isRes = residual?.likelihood === likelihood && residual?.impact === impact;
              return (
                <div
                  key={`${likelihood}:${impact}`}
                  className={`relative aspect-square ${RANKING_BG[ranking]} flex items-center justify-center`}
                  style={counts ? { opacity: n === 0 ? 0.18 : 0.45 + 0.55 * (n / max) } : undefined}
                  title={`Likelihood ${likelihood} × Impact ${impact} — ${RANKING_LABEL[ranking]}${counts ? ` — ${n} risk${n === 1 ? "" : "s"}` : ""}`}
                >
                  {counts && n > 0 && (
                    <span className="text-paper text-xs font-semibold font-mono">{n}</span>
                  )}
                  {isInh && !isRes && (
                    <span className="absolute inset-1 border-2 border-dashed border-paper rounded-sm" title="Inherent" />
                  )}
                  {isRes && (
                    <span className="absolute inset-1 border-2 border-paper rounded-sm bg-paper/20" title="Residual" />
                  )}
                </div>
              );
            })}
          </>
        ))}
        <div className="bg-paper" />
        {[1, 2, 3, 4, 5].map((l) => (
          <div key={`p${l}`} className="bg-paper py-1 text-center text-[10px] text-ink/60 font-mono">
            P{l}
          </div>
        ))}
      </div>
      <p className="mt-1 text-[10px] text-ink/50">
        Impact (rows) × Probability (columns)
        {inherent && " · dashed = inherent, solid = residual"}
      </p>
    </div>
  );
}
