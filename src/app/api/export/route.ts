import * as XLSX from "xlsx";
import { db } from "@/server/db";
import { getCurrentProject } from "@/server/project";

export const dynamic = "force-dynamic";

const d = (v: Date | null | undefined) => (v ? new Date(v).toISOString().slice(0, 10) : "");

function fit(ws: XLSX.WorkSheet, widths: number[]) {
  ws["!cols"] = widths.map((wch) => ({ wch }));
}

/**
 * GET /api/export — the project's full RICAL as an Excel workbook:
 * Risk Register, Issue Log, Change Control Log, Action Log, Lessons Learned.
 * Layout mirrors the organisation's RICAL template (one header row per log)
 * so BD can lift the Risk Register sheet straight into tender packs.
 */
export async function GET() {
  const project = await getCurrentProject();

  const [risks, issues, changes, actions, lessons] = await Promise.all([
    db.risk.findMany({
      where: { projectId: project.id },
      include: {
        category: true,
        assessments: { orderBy: { assessedAt: "desc" } },
        actions: { orderBy: { sequence: "asc" } },
        notes: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { ref: "asc" },
    }),
    db.issue.findMany({ where: { projectId: project.id }, include: { risk: true }, orderBy: { ref: "asc" } }),
    db.changeRequest.findMany({ where: { projectId: project.id }, orderBy: { ref: "asc" } }),
    db.projectAction.findMany({ where: { projectId: project.id }, orderBy: { ref: "asc" } }),
    db.lesson.findMany({ where: { projectId: project.id }, orderBy: { ref: "asc" } }),
  ]);

  const wb = XLSX.utils.book_new();

  /* ---- RISK REGISTER ---- */
  const label = (r: string) =>
    ({ VERY_LOW: "Very Low", LOW: "Low", MEDIUM: "Medium", HIGH: "High", CRITICAL: "Critical" })[r] ?? r;
  const riskRows = risks.map((r) => {
    const latest = (kind: string) => r.assessments.find((a) => a.kind === kind);
    const inh = latest("INHERENT");
    const res = latest("RESIDUAL");
    const act = (i: number) => r.actions[i];
    return {
      "Risk ID": r.ref,
      "Risk Title": r.title,
      "Risk Description": r.description,
      "Impact Description": r.impactDescription,
      "Risk Category": r.impactArea ?? r.category.name,
      "Current Status": r.status,
      "Likelihood (1-5)": inh?.likelihood ?? "",
      "Cost Severity (1-5)": inh?.costImpact ?? "",
      "Time Severity (1-5)": inh?.timeImpact ?? "",
      "Quality Severity (1-5)": inh?.qualityImpact ?? "",
      "Reputation Severity (1-5)": inh?.reputationImpact ?? "",
      "Inherent Importance": inh ? inh.likelihood * inh.combinedImpact : "",
      "Inherent Ranking": inh ? label(inh.combinedRanking) : "",
      "Risk Owner": r.ownerNames,
      "Mitigation Action 1": act(0)?.description ?? "",
      "Action 1 Owner": act(0)?.ownerName ?? "",
      "Action 1 Target": d(act(0)?.targetDate),
      "Mitigation Action 2": act(1)?.description ?? "",
      "Action 2 Owner": act(1)?.ownerName ?? "",
      "Action 2 Target": d(act(1)?.targetDate),
      "Mitigation Action 3": act(2)?.description ?? "",
      "Action 3 Owner": act(2)?.ownerName ?? "",
      "Action 3 Target": d(act(2)?.targetDate),
      "Mitigated Likelihood (1-5)": res?.likelihood ?? "",
      "Mitigated Impact (1-5)": res?.combinedImpact ?? "",
      "Mitigated Importance": res ? res.likelihood * res.combinedImpact : "",
      "Mitigated Ranking": res ? label(res.combinedRanking) : "",
      Appetite: label(r.appetiteMaxRanking),
      "Latest Progress Note": r.notes[0]?.body ?? "",
    };
  });
  const wsRisk = XLSX.utils.json_to_sheet(riskRows);
  fit(wsRisk, [8, 28, 40, 40, 16, 12, 10, 10, 10, 10, 12, 10, 10, 20, 34, 14, 12, 34, 14, 12, 34, 14, 12, 10, 10, 12, 12, 10, 40]);
  XLSX.utils.book_append_sheet(wb, wsRisk, "RISK REGISTER");

  /* ---- ISSUE LOG ---- */
  const wsIssue = XLSX.utils.json_to_sheet(
    issues.map((i) => ({
      "Issue ID": i.ref,
      "From Risk": i.risk?.ref ?? "",
      "Issue Description": i.description,
      "Raised By": i.raisedBy,
      "Date Raised": d(i.raisedAt),
      Severity: label(i.severity),
      "RAG": i.rag,
      "Target Date": d(i.targetDate),
      "Date Resolved": d(i.resolvedAt),
      "Progress / Status": i.progress ?? "",
    }))
  );
  fit(wsIssue, [8, 8, 44, 16, 12, 10, 8, 12, 12, 40]);
  XLSX.utils.book_append_sheet(wb, wsIssue, "ISSUE LOG");

  /* ---- CHANGE CONTROL LOG ---- */
  const wsChange = XLSX.utils.json_to_sheet(
    changes.map((c) => ({
      "Change ID": c.ref,
      "Change Description/Identifier": c.description,
      "Raised By": c.raisedBy,
      "Effective Date": d(c.effectiveDate),
      "Implications / Reason": c.reason ?? "",
      Action: c.action ?? "",
      "Detail Agreed Change": c.agreedChange ?? "",
      Closed: c.closed ? "Yes" : "No",
    }))
  );
  fit(wsChange, [9, 40, 16, 12, 36, 24, 36, 8]);
  XLSX.utils.book_append_sheet(wb, wsChange, "CHANGE CONTROL LOG");

  /* ---- ACTION LOG ---- */
  const wsAction = XLSX.utils.json_to_sheet(
    actions.map((a) => ({
      "Action ID": a.ref,
      "Action Description": a.description,
      "Raised By": a.raisedBy ?? "",
      "Date Raised": d(a.raisedAt),
      "Action Owner": a.ownerName ?? "",
      "Owner Email": a.ownerEmail ?? "",
      "Target Date": d(a.targetDate),
      "Progress / Status": a.progress ?? "",
      Status: a.status,
      Completed: a.status === "COMPLETE" ? "Yes" : "No",
    }))
  );
  fit(wsAction, [9, 44, 16, 12, 18, 26, 12, 32, 12, 10]);
  XLSX.utils.book_append_sheet(wb, wsAction, "ACTION LOG");

  /* ---- LESSONS LEARNED LOG ---- */
  const wsLesson = XLSX.utils.json_to_sheet(
    lessons.map((l) => ({
      "Lessons Learnt ID": l.ref,
      "Lessons Learnt Description": l.description,
      "Raised By": l.raisedBy ?? "",
      "Date Raised": d(l.raisedAt),
      Owner: l.ownerName ?? "",
      "Impact and Follow-on Action": l.impact ?? "",
    }))
  );
  fit(wsLesson, [12, 48, 16, 12, 18, 44]);
  XLSX.utils.book_append_sheet(wb, wsLesson, "LESSONS LEARNED LOG");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const body = new Uint8Array(buf);
  const safeName = project.name.replace(/[^A-Za-z0-9_-]+/g, "_");
  const filename = `RICAL_${safeName}_${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
