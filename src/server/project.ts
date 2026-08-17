import { cookies } from "next/headers";
import { db } from "./db";
import { ensureCoreData } from "./bootstrap";
import { canAccessProject, accessibleProjects } from "./access";
import type { Project } from "@prisma/client";

const COOKIE = "projectId";

/**
 * Resolve the active project from the cookie, enforcing access: a
 * restricted project is only returned to its members/admins. Otherwise
 * fall back to the first project the user may see (bootstrapping one if
 * the database is empty).
 */
export async function getCurrentProject(): Promise<Project> {
  const id = cookies().get(COOKIE)?.value;
  if (id && (await canAccessProject(id))) {
    const project = await db.project.findUnique({ where: { id } });
    if (project) return project;
  }
  const visible = await accessibleProjects();
  if (visible.length > 0) return visible[0];
  return ensureCoreData();
}

/** Projects the current user may see (used by the projects page). */
export async function listProjects() {
  return accessibleProjects();
}
