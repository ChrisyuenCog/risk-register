"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/server/db";
import { audit } from "@/server/audit";
import { getCurrentProject } from "@/server/project";
import { assess, type Ranking as RankingT } from "@/lib/scoring";
import type { AssessmentKind, Ranking } from "@prisma/client";

const scale = z.coerce.number().int().min(1).max(5);

const assessmentSchema = z.object({
  likelihood: scale,
  costImpact: scale,
  timeImpact: scale,
  qualityImpact: scale,
  reputationImpact: scale,
});

const riskSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(3),
  impactDescription: z.string().min(3),
  categoryId: z.string().min(1),
  impactArea: z.string().optional(),
  ownerNames: z.string().min(1),
});

/** Compute derived scores with the scoring engine and store them (FR-R3, FR-R4). */
async function writeAssessment(riskId: string, kind: AssessmentKind, form: FormData, prefix: string) {
  const a = assessmentSchema.parse({
    likelihood: form.get(`${prefix}likelihood`),
    costImpact: form.get(`${prefix}cost`),
    timeImpact: form.get(`${prefix}time`),
    qualityImpact: form.get(`${prefix}quality`),
    reputationImpact: form.get(`${prefix}reputation`),
  });
  const r = assess({
    likelihood: a.likelihood,
    impacts: {
      cost: a.costImpact,
      time: a.timeImpact,
      quality: a.qualityImpact,
      reputation: a.reputationImpact,
    },
  });
  const created = await db.riskAssessment.create({
    data: {
      riskId,
      kind,
      ...a,
      costRanking: r.cost.ranking as Ranking,
      timeRanking: r.time.ranking as Ranking,
      qualityRanking: r.quality.ranking as Ranking,
      reputationRanking: r.reputation.ranking as Ranking,
      combinedImpact: r.combinedImpact,
      combinedRanking: r.combinedRanking as Ranking,
    },
  });
  await audit({ entity: "RiskAssessment", entityId: created.id, action: "CREATE", after: created });
}

/** Category-prefixed sequential reference, e.g. HS1, PM2 (FR-R1). */
async function nextRef(projectId: string, categoryId: string) {
  const category = await db.riskCategory.findUniqueOrThrow({ where: { id: categoryId } });
  const count = await db.risk.count({ where: { projectId, categoryId } });
  return `${category.code}${count + 1}`;
}

export async function createRisk(form: FormData) {
  const data = riskSchema.parse(Object.fromEntries(form));
  const project = await getCurrentProject();
  const category = await db.riskCategory.findUniqueOrThrow({ where: { id: data.categoryId } });

  const risk = await db.risk.create({
    data: {
      projectId: project.id,
      ref: await nextRef(project.id, data.categoryId),
      ...data,
      appetiteMaxRanking: category.defaultAppetite,
    },
  });
  await audit({ entity: "Risk", entityId: risk.id, action: "CREATE", after: risk });
  await writeAssessment(risk.id, "INHERENT", form, "inherent_");
  await writeAssessment(risk.id, "RESIDUAL", form, "residual_");

  revalidatePath("/");
  redirect(`/risks/${risk.id}`);
}

export async function updateRisk(riskId: string, form: FormData) {
  const data = riskSchema.parse(Object.fromEntries(form));
  const before = await db.risk.findUniqueOrThrow({ where: { id: riskId } });
  const after = await db.risk.update({ where: { id: riskId }, data });
  await audit({ entity: "Risk", entityId: riskId, action: "UPDATE", before, after });
  revalidatePath(`/risks/${riskId}`);
}

export async function reassess(riskId: string, kind: AssessmentKind, form: FormData) {
  await writeAssessment(riskId, kind, form, "");
  revalidatePath(`/risks/${riskId}`);
  revalidatePath("/");
}

export async function setAppetite(riskId: string, form: FormData) {
  const value = z
    .enum(["VERY_LOW", "LOW", "MEDIUM", "HIGH", "CRITICAL"])
    .parse(form.get("appetite")) as RankingT;
  const before = await db.risk.findUniqueOrThrow({ where: { id: riskId } });
  const after = await db.risk.update({
    where: { id: riskId },
    data: { appetiteMaxRanking: value as Ranking, appetiteConfirmed: true },
  });
  await audit({ entity: "Risk", entityId: riskId, action: "UPDATE", before, after });
  revalidatePath(`/risks/${riskId}`);
  revalidatePath("/");
}

export async function addAction(riskId: string, form: FormData) {
  const description = z.string().min(3).parse(form.get("description"));
  const ownerName = String(form.get("ownerName") ?? "") || null;
  const rawDate = String(form.get("targetDate") ?? "");
  const sequence = (await db.mitigationAction.count({ where: { riskId } })) + 1;
  const created = await db.mitigationAction.create({
    data: { riskId, sequence, description, ownerName, targetDate: rawDate ? new Date(rawDate) : null },
  });
  await audit({ entity: "MitigationAction", entityId: created.id, action: "CREATE", after: created });
  revalidatePath(`/risks/${riskId}`);
}

export async function setActionStatus(actionId: string, form: FormData) {
  const status = z
    .enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETE", "OVERDUE"])
    .parse(form.get("status"));
  const before = await db.mitigationAction.findUniqueOrThrow({ where: { id: actionId } });
  const after = await db.mitigationAction.update({ where: { id: actionId }, data: { status } });
  await audit({ entity: "MitigationAction", entityId: actionId, action: "UPDATE", before, after });
  revalidatePath(`/risks/${before.riskId}`);
  revalidatePath("/");
}

export async function addNote(riskId: string, form: FormData) {
  const body = z.string().min(1).parse(form.get("body"));
  const author = z.string().min(1).parse(form.get("author"));
  const created = await db.progressNote.create({ data: { riskId, body, author } });
  await audit({ entity: "ProgressNote", entityId: created.id, action: "CREATE", after: created });
  revalidatePath(`/risks/${riskId}`);
}

export async function closeRisk(riskId: string) {
  const before = await db.risk.findUniqueOrThrow({ where: { id: riskId } });
  const after = await db.risk.update({ where: { id: riskId }, data: { status: "CLOSED" } });
  await audit({ entity: "Risk", entityId: riskId, action: "CLOSE", before, after });
  revalidatePath(`/risks/${riskId}`);
  revalidatePath("/");
}

export async function reopenRisk(riskId: string) {
  const before = await db.risk.findUniqueOrThrow({ where: { id: riskId } });
  const after = await db.risk.update({ where: { id: riskId }, data: { status: "OPEN" } });
  await audit({ entity: "Risk", entityId: riskId, action: "REOPEN", before, after });
  revalidatePath(`/risks/${riskId}`);
  revalidatePath("/");
}

/** One-click escalation to the issue log, preserving the risk reference (FR-I1). */
export async function escalateRisk(riskId: string, form: FormData) {
  const raisedBy = z.string().min(1).parse(form.get("raisedBy"));
  const risk = await db.risk.findUniqueOrThrow({ where: { id: riskId } });
  const issueCount = await db.issue.count({ where: { projectId: risk.projectId } });
  const issue = await db.issue.create({
    data: {
      projectId: risk.projectId,
      riskId,
      ref: `I${issueCount + 1}`,
      description: `[from ${risk.ref}] ${risk.title} — ${risk.description}`,
      raisedBy,
      likelyImpact: risk.impactDescription,
    },
  });
  const after = await db.risk.update({ where: { id: riskId }, data: { status: "ESCALATED" } });
  await audit({ entity: "Risk", entityId: riskId, action: "ESCALATE", before: risk, after });
  await audit({ entity: "Issue", entityId: issue.id, action: "CREATE", after: issue });
  revalidatePath(`/risks/${riskId}`);
  revalidatePath("/");
}
