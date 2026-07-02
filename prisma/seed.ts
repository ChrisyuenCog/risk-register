/**
 * Seed: one project, the eight seed categories (FR-R7), a Risk Manager user,
 * and sample risks including the register rows cited in the scoring tests.
 * Run with: npm run db:seed
 */
import { PrismaClient, AssessmentKind, Ranking } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { assess } from "../src/lib/scoring";

const db = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

const CATEGORIES: Array<[string, string]> = [
  ["HS", "Health & Safety"],
  ["HR", "Human Resources"],
  ["PM", "Project Management"],
  ["OP", "Operations"],
  ["FN", "Financial"],
  ["PL", "Political"],
  ["EN", "Environment"],
  ["IT", "Information Technology"],
];

type SeedRisk = {
  cat: string;
  title: string;
  description: string;
  impactDescription: string;
  impactArea: string;
  ownerNames: string;
  inherent: [number, number, number, number, number]; // L, cost, time, quality, reputation
  residual: [number, number, number, number, number];
  appetite?: Ranking;
  actions: Array<{ description: string; ownerName: string; daysFromNow: number }>;
};

const RISKS: SeedRisk[] = [
  {
    cat: "HS",
    title: "Travel safety for field staff",
    description: "Staff travelling to field offices face road-traffic and security incidents.",
    impactDescription: "Injury to staff; programme suspension in affected region.",
    impactArea: "People",
    ownerNames: "Operations Lead",
    inherent: [3, 4, 3, 2, 4],
    residual: [2, 3, 3, 2, 3],
    actions: [
      { description: "Journey management plan and driver vetting for all field routes", ownerName: "Operations Lead", daysFromNow: 30 },
      { description: "Quarterly security briefing for travelling staff", ownerName: "Security Advisor", daysFromNow: 60 },
      { description: "Incident reporting hotline live in all offices", ownerName: "Operations Lead", daysFromNow: -10 },
    ],
  },
  {
    cat: "PM",
    title: "Deliverables clarity across workstreams",
    description: "Ambiguity in deliverable definitions leads to rework and disputed acceptance.",
    impactDescription: "Schedule slip and cost overrun across dependent workstreams.",
    impactArea: "Quality",
    ownerNames: "PMO Lead",
    inherent: [4, 4, 4, 4, 2],
    residual: [3, 3, 3, 3, 2],
    appetite: Ranking.MEDIUM,
    actions: [
      { description: "Deliverable definition workshop and sign-off per workstream", ownerName: "PMO Lead", daysFromNow: 14 },
      { description: "Acceptance criteria template mandated in the PMP", ownerName: "PMO Lead", daysFromNow: 45 },
      { description: "Monthly cross-workstream dependency review", ownerName: "Programme Director", daysFromNow: 21 },
    ],
  },
  {
    cat: "PL",
    title: "Curriculum sovereignty concerns",
    description: "Host-government stakeholders challenge externally developed curriculum content.",
    impactDescription: "Reputational damage and political escalation; content withdrawal.",
    impactArea: "Reputational",
    ownerNames: "Programme Director",
    inherent: [4, 3, 4, 3, 5],
    residual: [3, 2, 3, 2, 4],
    appetite: Ranking.MEDIUM,
    actions: [
      { description: "Joint curriculum steering group with ministry co-chair", ownerName: "Programme Director", daysFromNow: 7 },
      { description: "Local review panel sign-off before any publication", ownerName: "Curriculum Lead", daysFromNow: 28 },
      { description: "Stakeholder communication plan for sensitive content", ownerName: "Comms Lead", daysFromNow: 28 },
    ],
  },
  {
    cat: "IT",
    title: "Register data loss from spreadsheet handling",
    description: "The current spreadsheet register has no audit trail and is emailed between reviewers.",
    impactDescription: "Loss of governance history; audit finding on records management.",
    impactArea: "Systems",
    ownerNames: "PMO Lead, IT Lead",
    inherent: [4, 2, 2, 4, 3],
    residual: [2, 2, 2, 3, 2],
    actions: [
      { description: "Migrate register to this system with immutable audit log", ownerName: "IT Lead", daysFromNow: 10 },
      { description: "Access control and single source of truth agreed with governance", ownerName: "PMO Lead", daysFromNow: 40 },
      { description: "Retire emailed copies; link-only distribution", ownerName: "PMO Lead", daysFromNow: 50 },
    ],
  },
  {
    cat: "FN",
    title: "Exchange-rate exposure on local costs",
    description: "Local-currency depreciation inflates in-country delivery costs against a fixed budget.",
    impactDescription: "Budget overrun; scope reduction in later phases.",
    impactArea: "Commercial",
    ownerNames: "Finance Lead",
    inherent: [3, 4, 2, 2, 2],
    residual: [3, 3, 2, 2, 2],
    actions: [
      { description: "Quarterly FX exposure review with treasury", ownerName: "Finance Lead", daysFromNow: 20 },
      { description: "Local procurement in local currency where possible", ownerName: "Procurement Lead", daysFromNow: 35 },
      { description: "Contingency line agreed at 5% of local cost base", ownerName: "Finance Lead", daysFromNow: 15 },
    ],
  },
];

async function main() {
  const user = await db.user.upsert({
    where: { email: "risk.manager@example.org" },
    update: {},
    create: { email: "risk.manager@example.org", name: "Risk Manager" },
  });

  let project = await db.project.findFirst();
  if (!project) {
    project = await db.project.create({
      data: { name: "SSEIP", client: "Programme Client", division: "Programmes" },
    });
    await db.projectMember.create({
      data: { projectId: project.id, userId: user.id, role: "RISK_MANAGER" },
    });
  }

  for (const [code, name] of CATEGORIES) {
    await db.riskCategory.upsert({
      where: { projectId_code: { projectId: project.id, code } },
      update: {},
      create: { projectId: project.id, code, name },
    });
  }

  const existing = await db.risk.count({ where: { projectId: project.id } });
  if (existing > 0) {
    console.log("Risks already present — skipping sample data.");
    return;
  }

  const seq = new Map<string, number>();
  for (const r of RISKS) {
    const category = await db.riskCategory.findUniqueOrThrow({
      where: { projectId_code: { projectId: project.id, code: r.cat } },
    });
    const n = (seq.get(r.cat) ?? 0) + 1;
    seq.set(r.cat, n);

    const risk = await db.risk.create({
      data: {
        projectId: project.id,
        ref: `${r.cat}${n}`,
        title: r.title,
        description: r.description,
        impactDescription: r.impactDescription,
        categoryId: category.id,
        impactArea: r.impactArea,
        ownerNames: r.ownerNames,
        appetiteMaxRanking: r.appetite ?? category.defaultAppetite,
      },
    });

    for (const [kind, scores] of [
      [AssessmentKind.INHERENT, r.inherent],
      [AssessmentKind.RESIDUAL, r.residual],
    ] as const) {
      const [likelihood, cost, time, quality, reputation] = scores;
      const res = assess({ likelihood, impacts: { cost, time, quality, reputation } });
      await db.riskAssessment.create({
        data: {
          riskId: risk.id,
          kind,
          likelihood,
          costImpact: cost,
          timeImpact: time,
          qualityImpact: quality,
          reputationImpact: reputation,
          costRanking: res.cost.ranking as Ranking,
          timeRanking: res.time.ranking as Ranking,
          qualityRanking: res.quality.ranking as Ranking,
          reputationRanking: res.reputation.ranking as Ranking,
          combinedImpact: res.combinedImpact,
          combinedRanking: res.combinedRanking as Ranking,
        },
      });
    }

    let s = 0;
    for (const a of r.actions) {
      s += 1;
      await db.mitigationAction.create({
        data: {
          riskId: risk.id,
          sequence: s,
          description: a.description,
          ownerName: a.ownerName,
          targetDate: new Date(Date.now() + a.daysFromNow * 86_400_000),
          status: a.daysFromNow < 0 ? "IN_PROGRESS" : "NOT_STARTED",
        },
      });
    }

    await db.auditLog.create({
      data: { actorId: user.id, entity: "Risk", entityId: risk.id, action: "CREATE", after: { ref: risk.ref, title: risk.title } },
    });
  }

  console.log(`Seeded ${RISKS.length} risks in project ${project.name}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
