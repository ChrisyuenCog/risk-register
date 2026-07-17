/**
 * Reminder email templates (pure functions — no I/O) used by notify-due.ts.
 * HTML is table-based with inline styles for broad mail-client support,
 * in the app's palette (ink #1B2733, critical #A11E2D, medium #C9A227).
 */

export type ReminderAction = {
  riskId: string;
  riskRef: string;
  riskTitle: string;
  description: string;
  targetDate: Date;
  overdue: boolean;
};

const fmt = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function buildSubject(overdue: number, upcoming: number): string {
  if (overdue && upcoming)
    return `Risk register — ${overdue} overdue and ${upcoming} due soon: action required`;
  if (overdue) return `Risk register — ${overdue} overdue action${overdue === 1 ? "" : "s"}: action required`;
  return `Risk register — ${upcoming} action${upcoming === 1 ? "" : "s"} due soon`;
}

export function buildText(actions: ReminderAction[], appUrl: string, days: number): string {
  const line = (a: ReminderAction) =>
    ` • [${a.riskRef}] ${a.riskTitle}\n   Action: ${a.description}\n   Target: ${a.targetDate.toISOString().slice(0, 10)}${appUrl ? `\n   ${appUrl}/risks/${a.riskId}` : ""}`;
  const overdue = actions.filter((a) => a.overdue);
  const upcoming = actions.filter((a) => !a.overdue);
  const parts: string[] = [];
  if (overdue.length) parts.push(`OVERDUE (${overdue.length}):\n${overdue.map(line).join("\n\n")}`);
  if (upcoming.length)
    parts.push(`Due within ${days} days (${upcoming.length}):\n${upcoming.map(line).join("\n\n")}`);
  return `Hello,\n\nYou own the following mitigation action(s) on the risk register that are overdue or coming due:\n\n${parts.join("\n\n")}\n\nPlease update the action status on the risk page${appUrl ? ` (${appUrl})` : ""} once done.\n\n— Risk Register (automated daily check)`;
}

function actionCard(a: ReminderAction, appUrl: string): string {
  const color = a.overdue ? "#A11E2D" : "#C9A227";
  const label = a.overdue ? "OVERDUE" : "DUE SOON";
  const link = `${appUrl}/risks/${a.riskId}`;
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #D8DEE4;border-left:4px solid ${color};border-radius:3px;margin:0 0 12px 0;background:#FFFFFF;">
    <tr>
      <td style="padding:14px 16px;">
        <div style="font:600 11px/1.4 Arial,sans-serif;color:${color};letter-spacing:1px;">${label} &nbsp;·&nbsp; TARGET ${fmt(a.targetDate).toUpperCase()}</div>
        <div style="font:700 14px/1.5 Arial,sans-serif;color:#1B2733;padding-top:4px;">
          <span style="font-family:Consolas,Menlo,monospace;background:#F4F6F8;border:1px solid #D8DEE4;border-radius:3px;padding:1px 6px;font-size:12px;">${esc(a.riskRef)}</span>
          &nbsp;${esc(a.riskTitle)}
        </div>
        <div style="font:400 13px/1.6 Arial,sans-serif;color:#3D4B59;padding-top:6px;">${esc(a.description)}</div>
        <div style="padding-top:12px;">
          <a href="${link}" style="font:600 12px/1 Arial,sans-serif;color:#FFFFFF;background:#1B2733;text-decoration:none;padding:9px 14px;border-radius:3px;display:inline-block;">Open risk ${esc(a.riskRef)} &rarr;</a>
        </div>
      </td>
    </tr>
  </table>`;
}

export function buildHtml(actions: ReminderAction[], appUrl: string, days: number): string {
  const overdue = actions.filter((a) => a.overdue);
  const upcoming = actions.filter((a) => !a.overdue);
  const section = (title: string, color: string, list: ReminderAction[]) =>
    list.length
      ? `<div style="font:700 12px/1 Arial,sans-serif;color:${color};letter-spacing:1.5px;padding:18px 0 10px 0;">${title} (${list.length})</div>${list
          .map((a) => actionCard(a, appUrl))
          .join("")}`
      : "";
  const summary = [
    overdue.length ? `<strong style="color:#A11E2D;">${overdue.length} overdue</strong>` : "",
    upcoming.length ? `<strong style="color:#8A6D00;">${upcoming.length} due within ${days} days</strong>` : "",
  ]
    .filter(Boolean)
    .join(" and ");

  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#F4F6F8;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6F8;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:#1B2733;border-radius:4px 4px 0 0;padding:16px 24px;">
            <span style="font:700 18px/1 Arial,sans-serif;color:#FFFFFF;">Risk<span style="color:#9AA7B2;">Register</span></span>
            <span style="font:400 12px/1 Arial,sans-serif;color:#9AA7B2;float:right;padding-top:4px;">Mitigation action reminder</span>
          </td>
        </tr>
        <tr>
          <td style="background:#FFFFFF;border:1px solid #D8DEE4;border-top:0;padding:22px 24px 8px 24px;">
            <p style="font:400 14px/1.6 Arial,sans-serif;color:#1B2733;margin:0 0 4px 0;">
              You own ${summary ? summary : "the following"} mitigation action${actions.length === 1 ? "" : "s"} on the risk register.
              Please progress ${actions.length === 1 ? "it" : "them"} and update the status on the risk page.
            </p>
            ${section("OVERDUE", "#A11E2D", overdue)}
            ${section("DUE SOON", "#8A6D00", upcoming)}
          </td>
        </tr>
        <tr>
          <td style="background:#FFFFFF;border:1px solid #D8DEE4;border-top:0;border-radius:0 0 4px 4px;padding:14px 24px 20px 24px;">
            <p style="font:400 12px/1.6 Arial,sans-serif;color:#6B7A88;margin:0;border-top:1px solid #D8DEE4;padding-top:14px;">
              This is an automated daily check from the
              <a href="${appUrl}" style="color:#2F5D8A;">risk register</a>.
              You are receiving it because your email address is set as the owner of the action(s) above.
              Marking an action <em>Complete</em> on its risk page stops further reminders for it.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
