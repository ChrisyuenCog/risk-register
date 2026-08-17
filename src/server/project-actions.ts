"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/server/db";
import { audit } from "@/server/audit";
import { ensureCategories } from "@/server/bootstrap";
import { canAccessProject } from "@/server/access";
import { isAdmin } from "@/server/admin";

export async function switchProject(form: FormData) {
  const id = z.string().min(1).parse(form.get("projectId"));
  await db.project.findUniqueOrThrow({ where: { id } });
  if (!(await canAccessProject(id))) {
    throw new Error("Not authorised: this project is restricted to its members.");
  }
  cookies().set("projectId", id, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
  redirect("/");
}

export async function createProject(form: FormData) {
  const name = z.string().min(2).parse(form.get("name"));
  const client = String(form.get("client") ?? "").trim() || null;
  const division = String(form.get("division") ?? "").trim() || null;
  const project = await db.project.create({ data: { name, client, division } });
  await ensureCategories(project.id);
  await audit({ entity: "Project", entityId: project.id, action: "CREATE", after: project });
  cookies().set("projectId", project.id, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
  redirect("/");
}

/* ---------------- Restricted-project administration (admins only) ---------------- */

export async function setProjectRestricted(projectId: string, restricted: boolean) {
  if (!isAdmin()) throw new Error("Not authorised: administrators only.");
  const before = await db.project.findUniqueOrThrow({ where: { id: projectId } });
  const after = await db.project.update({ where: { id: projectId }, data: { restricted } });
  await audit({ entity: "Project", entityId: projectId, action: "UPDATE", before, after });
  revalidatePath("/projects");
}

export async function addProjectMember(projectId: string, form: FormData) {
  if (!isAdmin()) throw new Error("Not authorised: administrators only.");
  const email = z.string().email().parse(String(form.get("email") ?? "").trim().toLowerCase());
  const user = await db.user.upsert({
    where: { email },
    update: {},
    create: { email, name: email.split("@")[0] },
  });
  const existing = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  if (!existing) {
    const created = await db.projectMember.create({
      data: { projectId, userId: user.id, role: "VIEWER" },
    });
    await audit({ entity: "ProjectMember", entityId: created.id, action: "CREATE", after: { projectId, email } });
  }
  revalidatePath("/projects");
}

export async function removeProjectMember(memberId: string) {
  if (!isAdmin()) throw new Error("Not authorised: administrators only.");
  const before = await db.projectMember.findUniqueOrThrow({
    where: { id: memberId },
    include: { user: true },
  });
  await db.projectMember.delete({ where: { id: memberId } });
  await audit({
    entity: "ProjectMember",
    entityId: memberId,
    action: "DELETE",
    before: { projectId: before.projectId, email: before.user.email },
  });
  revalidatePath("/projects");
}
