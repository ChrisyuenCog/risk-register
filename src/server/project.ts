import { cookies } from "next/headers";
import { db } from "./db";
import { ensureCoreData, ensureCategories } from "./bootstrap";
import type { Project } from "@prisma/client";

const COOKIE = "projectId";

/**
 * Resolve the active project from the cookie, falling back to the first
 * project (bootstrapping one if the database is empty). Server components
 * can read the cookie; switching happens via the switchProject action.
 */
export async function getCurrentProject(): Promise<Project> {
  const id = cookies().get(COOKIE)?.value;
  if (id) {
    const project = await db.project.findUnique({ where: { id } });
    if (project) return project;
  }
  return ensureCoreData();
}

export async function listProjects() {
  return db.project.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { risks: true, issues: true } } },
  });
}
