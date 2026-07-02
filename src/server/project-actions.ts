"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/server/db";
import { audit } from "@/server/audit";
import { ensureCategories } from "@/server/bootstrap";

export async function switchProject(form: FormData) {
  const id = z.string().min(1).parse(form.get("projectId"));
  await db.project.findUniqueOrThrow({ where: { id } });
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
