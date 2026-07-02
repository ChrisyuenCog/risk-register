import { db } from "./db";
import { breachesAppetite, type Ranking as RankingT } from "@/lib/scoring";
import type { Risk, RiskAssessment, RiskCategory } from "@prisma/client";

export type RiskRow = Risk & {
  category: RiskCategory;
  inherent?: RiskAssessment;
  residual?: RiskAssessment;
  breachesAppetite: boolean;
};

/** Attach the latest inherent and residual assessment to each risk. */
export async function loadRegister(filter?: {
  projectId?: string;
  status?: string;
  categoryId?: string;
  q?: string;
}): Promise<RiskRow[]> {
  const risks = await db.risk.findMany({
    where: {
      projectId: filter?.projectId || undefined,
      status: filter?.status ? (filter.status as Risk["status"]) : undefined,
      categoryId: filter?.categoryId || undefined,
      OR: filter?.q
        ? [
            { title: { contains: filter.q, mode: "insensitive" } },
            { description: { contains: filter.q, mode: "insensitive" } },
            { ref: { contains: filter.q, mode: "insensitive" } },
            { ownerNames: { contains: filter.q, mode: "insensitive" } },
          ]
        : undefined,
    },
    include: {
      category: true,
      assessments: { orderBy: { assessedAt: "desc" } },
    },
    orderBy: { ref: "asc" },
  });

  return risks.map((r) => {
    const inherent = r.assessments.find((a) => a.kind === "INHERENT");
    const residual = r.assessments.find((a) => a.kind === "RESIDUAL");
    return {
      ...r,
      inherent,
      residual,
      breachesAppetite: residual
        ? breachesAppetite(residual.combinedRanking as RankingT, r.appetiteMaxRanking as RankingT)
        : false,
    };
  });
}

export async function dashboardData(projectId: string) {
  const register = await loadRegister({ projectId });
  const open = register.filter((r) => r.status === "OPEN");

  const byRanking = new Map<string, number>();
  const byCategory = new Map<string, number>();
  const matrixCounts = new Map<string, number>();

  for (const r of open) {
    if (!r.residual) continue;
    byRanking.set(r.residual.combinedRanking, (byRanking.get(r.residual.combinedRanking) ?? 0) + 1);
    byCategory.set(r.category.code, (byCategory.get(r.category.code) ?? 0) + 1);
    const key = `${r.residual.likelihood}:${r.residual.combinedImpact}`;
    matrixCounts.set(key, (matrixCounts.get(key) ?? 0) + 1);
  }

  const overdueActions = await db.mitigationAction.count({
    where: {
      status: { in: ["NOT_STARTED", "IN_PROGRESS", "OVERDUE"] },
      targetDate: { lt: new Date() },
      risk: { status: "OPEN", projectId },
    },
  });

  const order = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "VERY_LOW"] as const;
  const topRisks = [...open]
    .filter((r) => r.residual)
    .sort(
      (a, b) =>
        order.indexOf(a.residual!.combinedRanking as (typeof order)[number]) -
          order.indexOf(b.residual!.combinedRanking as (typeof order)[number]) ||
        b.residual!.likelihood * b.residual!.combinedImpact -
          a.residual!.likelihood * a.residual!.combinedImpact
    )
    .slice(0, 5);

  return {
    register,
    open,
    byRanking,
    byCategory,
    matrixCounts,
    breaches: open.filter((r) => r.breachesAppetite),
    escalated: register.filter((r) => r.status === "ESCALATED").length,
    closed: register.filter((r) => r.status === "CLOSED").length,
    overdueActions,
    topRisks,
  };
}

const RANK_ORDER = ["VERY_LOW", "LOW", "MEDIUM", "HIGH", "CRITICAL"];

export type SortKey = "ref" | "title" | "category" | "owner" | "inherent" | "residual" | "appetite" | "status";

/** Sort register rows by a column; ranking columns sort by severity. */
export function sortRegister(rows: RiskRow[], sort: SortKey, dir: "asc" | "desc"): RiskRow[] {
  const mul = dir === "desc" ? -1 : 1;
  const key = (r: RiskRow): string | number => {
    switch (sort) {
      case "title": return r.title.toLowerCase();
      case "category": return r.category.name.toLowerCase();
      case "owner": return r.ownerNames.toLowerCase();
      case "inherent": return r.inherent ? RANK_ORDER.indexOf(r.inherent.combinedRanking) : -1;
      case "residual": return r.residual ? RANK_ORDER.indexOf(r.residual.combinedRanking) : -1;
      case "appetite": return RANK_ORDER.indexOf(r.appetiteMaxRanking);
      case "status": return r.status;
      default: return r.ref;
    }
  };
  return [...rows].sort((a, b) => {
    const ka = key(a), kb = key(b);
    if (typeof ka === "number" && typeof kb === "number") return (ka - kb) * mul;
    return String(ka).localeCompare(String(kb), undefined, { numeric: true }) * mul;
  });
}
