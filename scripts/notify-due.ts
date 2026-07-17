/**
 * Due-action notifications.
 *
 * Run daily (see .github/workflows/notify-due.yml). For every OPEN risk:
 *  - actions past their target date are flipped to OVERDUE
 *  - owners with an email receive one digest listing their actions that are
 *    overdue or due within NOTIFY_DAYS (default 7)
 *
 * Required env: DATABASE_URL, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
 * MAIL_FROM. Optional: APP_URL (links in the email), NOTIFY_DAYS.
 * Runs with the standard Prisma client (native engines available on CI).
 */
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";

const db = new PrismaClient();

function fmt(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function main() {
  const days = Number(process.env.NOTIFY_DAYS ?? 7);
  const appUrl = (process.env.APP_URL ?? "").replace(/\/$/, "");
  const now = new Date();
  const horizon = new Date(now.getTime() + days * 86_400_000);

  // 1) Flip past-due open actions to OVERDUE (audit-visible via status change).
  const flipped = await db.mitigationAction.updateMany({
    where: {
      status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
      targetDate: { lt: now },
      risk: { status: "OPEN" },
    },
    data: { status: "OVERDUE" },
  });

  // 2) Collect notifiable actions.
  const actions = await db.mitigationAction.findMany({
    where: {
      status: { in: ["NOT_STARTED", "IN_PROGRESS", "OVERDUE"] },
      targetDate: { not: null, lte: horizon },
      ownerEmail: { not: null },
      risk: { status: "OPEN" },
    },
    include: { risk: { include: { project: true } } },
    orderBy: { targetDate: "asc" },
  });

  const byOwner = new Map<string, typeof actions>();
  for (const a of actions) {
    const key = a.ownerEmail as string;
    byOwner.set(key, [...(byOwner.get(key) ?? []), a]);
  }

  console.log(
    `Marked ${flipped.count} action(s) overdue; ${actions.length} notifiable action(s) across ${byOwner.size} owner(s).`
  );
  if (byOwner.size === 0) return;

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  for (const [email, list] of byOwner) {
    const overdue = list.filter((a) => (a.targetDate as Date) < now);
    const upcoming = list.filter((a) => (a.targetDate as Date) >= now);
    const line = (a: (typeof list)[number]) => {
      const link = appUrl ? `${appUrl}/risks/${a.riskId}` : "";
      return ` • [${a.risk.ref}] ${a.risk.title}\n   Action: ${a.description}\n   Target: ${fmt(a.targetDate as Date)}${link ? `\n   ${link}` : ""}`;
    };
    const parts: string[] = [];
    if (overdue.length)
      parts.push(`OVERDUE (${overdue.length}):\n${overdue.map(line).join("\n\n")}`);
    if (upcoming.length)
      parts.push(`Due within ${days} days (${upcoming.length}):\n${upcoming.map(line).join("\n\n")}`);

    await transport.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: `Risk register: ${overdue.length ? `${overdue.length} overdue, ` : ""}${upcoming.length} action(s) due soon`,
      text: `Hello,\n\nYou own the following mitigation action(s) on the risk register that are overdue or coming due:\n\n${parts.join("\n\n")}\n\nPlease update the action status on the risk page${appUrl ? ` (${appUrl})` : ""} once done.\n\n— Risk Register (automated daily check)`,
    });
    console.log(`Notified ${email}: ${overdue.length} overdue, ${upcoming.length} upcoming.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
