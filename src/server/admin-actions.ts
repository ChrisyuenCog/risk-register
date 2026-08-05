"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { audit } from "@/server/audit";
import { isAdmin, currentUserEmail } from "@/server/admin";

/**
 * Permanently delete a risk and its dependent records (assessments,
 * mitigation actions, progress notes). Admin-only; requires typing the
 * risk's ref to confirm; refuses if the risk has been escalated to an
 * issue (the lineage must survive). The audit trail keeps a DELETE entry
 * with the full before-snapshot — deletion is visible, not silent.
 */
export async function deleteRisk(riskId: string, form: FormData) {
  if (!isAdmin()) {
    throw new Error(`Not authorised: risk deletion is limited to administrators.`);
  }
  const risk = await db.risk.findUniqueOrThrow({
    where: { id: riskId },
    include: { assessments: true, actions: true, notes: true, issue: true },
  });

  const confirm = String(form.get("confirmRef") ?? "").trim();
  if (confirm !== risk.ref) {
    throw new Error(`Confirmation mismatch: type the risk's ref (${risk.ref}) to delete it.`);
  }
  if (risk.issue) {
    throw new Error(
      `${risk.ref} has been escalated to issue ${risk.issue.ref} and cannot be deleted — the lineage must be preserved. Close the risk instead.`
    );
  }

  await db.$transaction([
    db.progressNote.deleteMany({ where: { riskId } }),
    db.mitigationAction.deleteMany({ where: { riskId } }),
    db.riskAssessment.deleteMany({ where: { riskId } }),
    db.risk.delete({ where: { id: riskId } }),
  ]);

  await audit({
    entity: "Risk",
    entityId: riskId,
    action: "DELETE",
    before: {
      ...risk,
      deletedBy: currentUserEmail(),
      counts: {
        assessments: risk.assessments.length,
        actions: risk.actions.length,
        notes: risk.notes.length,
      },
    },
  });

  revalidatePath("/");
  redirect("/risks");
}
