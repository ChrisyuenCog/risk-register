"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { audit } from "@/server/audit";
import { getCurrentProject } from "@/server/project";

async function nextRef(prefix: "C" | "A" | "L", projectId: string): Promise<string> {
  const count =
    prefix === "C"
      ? await db.changeRequest.count({ where: { projectId } })
      : prefix === "A"
        ? await db.projectAction.count({ where: { projectId } })
        : await db.lesson.count({ where: { projectId } });
  // Refs are never reused; if a ref exists (after deletions elsewhere), walk forward.
  let n = count + 1;
  for (;;) {
    const ref = `${prefix}${n}`;
    const clash =
      prefix === "C"
        ? await db.changeRequest.findFirst({ where: { projectId, ref } })
        : prefix === "A"
          ? await db.projectAction.findFirst({ where: { projectId, ref } })
          : await db.lesson.findFirst({ where: { projectId, ref } });
    if (!clash) return ref;
    n += 1;
  }
}

const dateOrNull = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s ? new Date(s) : null;
};
const strOrNull = (v: FormDataEntryValue | null) => String(v ?? "").trim() || null;

/* ---------------- Change Control ---------------- */

export async function createChange(form: FormData) {
  const project = await getCurrentProject();
  const created = await db.changeRequest.create({
    data: {
      projectId: project.id,
      ref: await nextRef("C", project.id),
      description: z.string().min(3).parse(form.get("description")),
      raisedBy: String(form.get("raisedBy") ?? "").trim() || "Unspecified",
      effectiveDate: dateOrNull(form.get("effectiveDate")),
      reason: strOrNull(form.get("reason")),
      action: strOrNull(form.get("action")),
      agreedChange: strOrNull(form.get("agreedChange")),
    },
  });
  await audit({ entity: "ChangeRequest", entityId: created.id, action: "CREATE", after: created });
  revalidatePath("/changes");
}

export async function setChangeClosed(id: string, closed: boolean) {
  const before = await db.changeRequest.findUniqueOrThrow({ where: { id } });
  const after = await db.changeRequest.update({ where: { id }, data: { closed } });
  await audit({ entity: "ChangeRequest", entityId: id, action: "UPDATE", before, after });
  revalidatePath("/changes");
}

export async function recordAgreedChange(id: string, form: FormData) {
  const before = await db.changeRequest.findUniqueOrThrow({ where: { id } });
  const after = await db.changeRequest.update({
    where: { id },
    data: { agreedChange: strOrNull(form.get("agreedChange")) },
  });
  await audit({ entity: "ChangeRequest", entityId: id, action: "UPDATE", before, after });
  revalidatePath("/changes");
}

/* ---------------- Action Log (meeting actions) ---------------- */

export async function createProjectAction(form: FormData) {
  const project = await getCurrentProject();
  const created = await db.projectAction.create({
    data: {
      projectId: project.id,
      ref: await nextRef("A", project.id),
      description: z.string().min(3).parse(form.get("description")),
      raisedBy: strOrNull(form.get("raisedBy")),
      ownerName: strOrNull(form.get("ownerName")),
      ownerEmail: String(form.get("ownerEmail") ?? "").trim().toLowerCase() || null,
      targetDate: dateOrNull(form.get("targetDate")),
    },
  });
  await audit({ entity: "ProjectAction", entityId: created.id, action: "CREATE", after: created });
  revalidatePath("/actions");
}

export async function setProjectActionStatus(id: string, status: string, form: FormData) {
  const parsed = z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETE", "OVERDUE"]).parse(status);
  const before = await db.projectAction.findUniqueOrThrow({ where: { id } });
  const progress = strOrNull(form.get("progress"));
  const after = await db.projectAction.update({
    where: { id },
    data: {
      status: parsed,
      completedAt: parsed === "COMPLETE" ? new Date() : null,
      ...(progress !== null ? { progress } : {}),
    },
  });
  await audit({ entity: "ProjectAction", entityId: id, action: "UPDATE", before, after });
  revalidatePath("/actions");
}

/* ---------------- Lessons Learned ---------------- */

export async function createLesson(form: FormData) {
  const project = await getCurrentProject();
  const created = await db.lesson.create({
    data: {
      projectId: project.id,
      ref: await nextRef("L", project.id),
      description: z.string().min(3).parse(form.get("description")),
      raisedBy: strOrNull(form.get("raisedBy")),
      ownerName: strOrNull(form.get("ownerName")),
      impact: strOrNull(form.get("impact")),
    },
  });
  await audit({ entity: "Lesson", entityId: created.id, action: "CREATE", after: created });
  revalidatePath("/lessons");
}
