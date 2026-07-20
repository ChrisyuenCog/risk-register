/**
 * One-off (re-runnable) backfill: set mitigation-action owner emails from
 * each risk's named owner(s), using the mapping agreed on 2026-07-17.
 *
 * Rules:
 *  - Only fills actions whose ownerEmail is currently empty — never
 *    overwrites an email someone has set by hand in the app.
 *  - A risk's first named owner with a known email wins (owners are listed
 *    in accountability order in the register).
 *  - Actions with their own ownerName that maps (e.g. a person's name) are
 *    matched on that first; otherwise the risk owner is used.
 *  - Names with no mapping are left blank and reported, so no mail goes
 *    to non-existent boxes. (Leadership Team, External, and Programme
 *    Director were mapped on 2026-07-20 per Clare's assignments.)
 *
 * Run via the "Backfill action owner emails" workflow (DATABASE_URL secret).
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const EMAILS: Record<string, string> = {
  jenna: "jcrowley@cognitioneducation.com",
  "dr. irene": "ipaulsen@cognitioneducation.com",
  irene: "ipaulsen@cognitioneducation.com",
  wendy: "windu@cognitioneducation.com",
  nancy: "npalmer@cognitioneducation.com",
  lucian: "lkii@cognitionlearninggroup.com",
  pmmo: "pmmo@cognitionlearninggroup.com",
  afroza: "awaduth@cognitionlearninggroup.com",
  hr: "hr@cognitionlearninggroup.com",
  bill: "bgaynor@cognitionevolve.com",
  victoria: "vcockle@cognitioneducation.com",
  vic: "vcockle@cognitioneducation.com",
  chris: "cyuen@cognitionlearninggroup.com",
  // Assignments confirmed by Clare, 2026-07-20:
  "leadership team": "ipaulsen@cognitioneducation.com", // PL4
  external: "cyuen@cognitionlearninggroup.com", // IT5
  "programme director": "ipaulsen@cognitioneducation.com",
};

function lookup(rawName: string): string | null {
  const key = rawName.toLowerCase().replace(/^[.\s]+|[.\s]+$/g, "");
  return EMAILS[key] ?? null;
}

/** First owner in a comma/and/slash-separated list that has a known email. */
function emailForOwners(ownerNames: string): { email: string; matched: string } | null {
  const parts = ownerNames
    .replace(/\band\b/gi, ",")
    .split(/[,/]/)
    .map((p) => p.trim())
    .filter(Boolean);
  for (const p of parts) {
    const email = lookup(p);
    if (email) return { email, matched: p };
  }
  return null;
}

async function main() {
  const actions = await db.mitigationAction.findMany({
    where: { OR: [{ ownerEmail: null }, { ownerEmail: "" }] },
    include: { risk: true },
  });

  let updated = 0;
  const byEmail = new Map<string, number>();
  const unmatched = new Map<string, string[]>();

  for (const a of actions) {
    // Prefer the action's own named owner if it maps; else the risk owner.
    const fromAction = a.ownerName ? lookup(a.ownerName) : null;
    const resolved = fromAction
      ? { email: fromAction, matched: a.ownerName as string }
      : emailForOwners(a.risk.ownerNames);

    if (!resolved) {
      const key = a.ownerName || a.risk.ownerNames || "(no owner recorded)";
      unmatched.set(key, [...(unmatched.get(key) ?? []), a.risk.ref]);
      continue;
    }
    await db.mitigationAction.update({
      where: { id: a.id },
      data: { ownerEmail: resolved.email },
    });
    updated += 1;
    byEmail.set(resolved.email, (byEmail.get(resolved.email) ?? 0) + 1);
  }

  console.log(`Actions examined (blank owner email): ${actions.length}`);
  console.log(`Actions updated: ${updated}\n`);
  console.log("Per owner:");
  for (const [email, n] of [...byEmail.entries()].sort((x, y) => y[1] - x[1])) {
    console.log(`  ${n.toString().padStart(3)}  ${email}`);
  }
  if (unmatched.size) {
    console.log("\nLeft blank (no email mapping) — set these on the risk pages when known:");
    for (const [name, refs] of unmatched) {
      console.log(`  ${name}: ${[...new Set(refs)].join(", ")}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
