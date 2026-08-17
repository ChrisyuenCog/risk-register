import { cookies } from "next/headers";
import { db } from "./db";
import { ensureCoreData } from "./bootstrap";
import { canAccessProject, accessibleProjects } from "./access";
import { currentUserEmail } from "./admin";
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
  if (visible.length > 0) return chooseDefaultProject(visible, currentUserEmail());
  return ensureCoreData();
}

/**
 * First-visit default: prefer the first project the user is a member of
 * (membership is a stronger "this is your project" signal than creation
 * order) — a board member with no cookie lands on Board, not SSEIP.
 * Falls back to the first accessible project. Pure, for testability.
 */
export function chooseDefaultProject<
  T extends { members: { user: { email: string } }[] },
>(visible: T[], email: string | null): T {
  if (email) {
    const memberOf = visible.find((p) =>
      p.members.some((m) => m.user.email.toLowerCase() === email)
    );
    if (memberOf) return memberOf;
  }
  return visible[0];
}

/** Projects the current user may see (used by the projects page). */
export async function listProjects() {
  return accessibleProjects();
}
