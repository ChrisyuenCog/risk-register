import { db } from "./db";

const CATEGORIES: Array<[string, string]> = [
  ["HS", "Health & Safety"],
  ["HR", "Human Resources"],
  ["PM", "Project Management"],
  ["OP", "Operations"],
  ["FN", "Financial"],
  ["PL", "Political"],
  ["EN", "Environment"],
  ["IT", "Information Technology"],
];

/**
 * Ensure the core reference data exists (project, categories, audit user).
 * Idempotent and cheap when data is present; lets a freshly migrated,
 * unseeded database work immediately. Project name/client can be set via
 * PROJECT_NAME / PROJECT_CLIENT environment variables.
 */
export async function ensureCoreData() {
  let project = await db.project.findFirst();
  if (!project) {
    project = await db.project.create({
      data: {
        name: process.env.PROJECT_NAME ?? "SSEIP",
        client: process.env.PROJECT_CLIENT ?? null,
      },
    });
  }

  const user = await db.user.upsert({
    where: { email: "risk.manager@example.org" },
    update: {},
    create: { email: "risk.manager@example.org", name: "Risk Manager" },
  });
  const membership = await db.projectMember.findFirst({
    where: { projectId: project.id, userId: user.id },
  });
  if (!membership) {
    await db.projectMember.create({
      data: { projectId: project.id, userId: user.id, role: "RISK_MANAGER" },
    });
  }

  for (const [code, name] of CATEGORIES) {
    await db.riskCategory.upsert({
      where: { projectId_code: { projectId: project.id, code } },
      update: {},
      create: { projectId: project.id, code, name },
    });
  }

  return project;
}
