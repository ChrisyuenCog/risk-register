"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { getCurrentProject } from "@/server/project";
import { audit } from "@/server/audit";
import { parseRegisterWorkbook, type ImportRow } from "@/server/import-core";
import { assess } from "@/lib/scoring";
import type { AssessmentKind, Ranking } from "@prisma/client";

async function createAssessment(riskId: string, kind: AssessmentKind, s: ImportRow["inherent"]) {
  const r = assess({
    likelihood: s.likelihood,
    impacts: { cost: s.cost, time: s.time, quality: s.quality, reputation: s.reputation },
  });
  await db.riskAssessment.create({
    data: {
      riskId,
      kind,
      likelihood: s.likelihood,
      costImpact: s.cost,
      timeImpact: s.time,
      qualityImpact: s.quality,
      reputationImpact: s.reputation,
      costRanking: r.cost.ranking as Ranking,
      timeRanking: r.time.ranking as Ranking,
      qualityRanking: r.quality.ranking as Ranking,
      reputationRanking: r.reputation.ranking as Ranking,
      combinedImpact: r.combinedImpact,
      combinedRanking: r.combinedRanking as Ranking,
    },
  });
}

export async function importRegister(form: FormData) {
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect(`/import?error=${encodeURIComponent("Choose an .xlsx file to import.")}`);
  }

  const { rows, errors } = parseRegisterWorkbook(await (file as File).arrayBuffer());
  const project = await getCurrentProject();
  const categories = await db.riskCategory.findMany({ where: { projectId: project.id } });
  const byCode = new Map(categories.map((c) => [c.code, c]));

  let created = 0;
  const failures: string[] = [...errors];

  for (const row of rows) {
    const category = byCode.get(row.category);
    if (!category) {
      failures.push(`"${row.title}": unknown category code ${row.category}`);
      continue;
    }
    // Ref: honour a provided ref if free, otherwise assign the next in sequence.
    let ref = row.ref?.toUpperCase() ?? "";
    if (!ref || (await db.risk.findUnique({ where: { projectId_ref: { projectId: project.id, ref } } }))) {
      const count = await db.risk.count({ where: { projectId: project.id, categoryId: category.id } });
      ref = `${category.code}${count + 1}`;
    }

    const risk = await db.risk.create({
      data: {
        projectId: project.id,
        categoryId: category.id,
        ref,
        title: row.title,
        description: row.description,
        impactDescription: row.impactDescription,
        impactArea: row.impactArea || null,
        ownerNames: row.owners,
        appetiteMaxRanking: (row.appetite ?? category.defaultAppetite) as Ranking,
      },
    });
    await createAssessment(risk.id, "INHERENT", row.inherent);
    await createAssessment(risk.id, "RESIDUAL", row.residual);
    let sequence = 0;
    for (const a of row.actions) {
      sequence += 1;
      await db.mitigationAction.create({
        data: { riskId: risk.id, sequence, description: a.description, ownerName: a.owner || null, targetDate: a.targetDate },
      });
    }
    await audit({ entity: "Risk", entityId: risk.id, action: "CREATE", after: { ref, title: risk.title, source: "excel-import" } });
    created += 1;
  }

  revalidatePath("/");
  revalidatePath("/risks");
  const params = new URLSearchParams({ created: String(created) });
  failures.slice(0, 8).forEach((f) => params.append("failure", f));
  if (failures.length > 8) params.append("failure", `…and ${failures.length - 8} more`);
  redirect(`/import?${params.toString()}`);
}
