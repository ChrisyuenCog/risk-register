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
  status?: string;
  categoryId?: string;
  q?: string;
}): Promise<RiskRow[]> {
  const risks = await db.risk.findMany({
    where: {
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

export async function dashboardData() {
  const register = await loadRegister();
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
      risk: { status: "OPEN" },
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
