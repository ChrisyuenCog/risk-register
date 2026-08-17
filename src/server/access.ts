import { db } from "./db";
import { adminEmails, currentUserEmail } from "./admin";
import type { Project } from "@prisma/client";

/**
 * Per-project access control.
 *
 * A project with restricted = true is visible only to:
 *  - administrators (ADMIN_EMAILS), and
 *  - its members (ProjectMember rows, matched by the signed-in email).
 * Unrestricted projects are visible to everyone signed in, as before.
 *
 * Identity comes from App Service authentication. If the app were ever run
 * without the sign-in wall, there is no identity, and restricted projects
 * are inaccessible to everyone rather than open to everyone (fail closed).
 */

export type ProjectWithMembers = Project & { members: { user: { email: string } }[] };

/** Pure rule — also used by tests. */
export function emailCanAccess(
  project: { restricted: boolean },
  memberEmails: string[],
  email: string | null,
  admins: string[] = adminEmails()
): boolean {
  if (!project.restricted) return true;
  if (!email) return false;
  if (admins.includes(email)) return true;
  return memberEmails.includes(email);
}

export async function canAccessProject(projectId: string): Promise<boolean> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { members: { include: { user: true } } },
  });
  if (!project) return false;
  return emailCanAccess(
    project,
    project.members.map((m) => m.user.email.toLowerCase()),
    currentUserEmail()
  );
}

/** Throws (surfacing as an error page) when the current user may not see the project. */
export async function assertProjectAccess(projectId: string): Promise<void> {
  if (!(await canAccessProject(projectId))) {
    throw new Error("Not authorised: this project is restricted to its members.");
  }
}

/** All projects the current user may see, in creation order. */
export async function accessibleProjects() {
  const email = currentUserEmail();
  const projects = await db.project.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      members: { include: { user: true } },
      _count: { select: { risks: true, issues: true } },
    },
  });
  return projects.filter((p) =>
    emailCanAccess(p, p.members.map((m) => m.user.email.toLowerCase()), email)
  );
}
