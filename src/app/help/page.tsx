import Link from "next/link";
import { Matrix, RatingBadge } from "@/components/rating";

export const dynamic = "force-dynamic";

/* ---------- inline diagrams (SVG, app palette) ---------- */

function LifecycleDiagram() {
  const box = "fill-white stroke-[#D8DEE4]";
  const label = "fill-[#1B2733] text-[11px] font-sans";
  const sub = "fill-[#1B2733] opacity-60 text-[9px] font-sans";
  const arrow = "stroke-[#2F5D8A] stroke-[1.5]";
  const steps = [
    ["Identify", "describe the risk"],
    ["Assess inherent", "score before mitigation"],
    ["Plan mitigations", "actions + owners"],
    ["Assess residual", "score after mitigation"],
    ["Monitor & review", "notes, action status"],
  ];
  return (
    <svg viewBox="0 0 760 190" className="w-full max-w-3xl" role="img" aria-label="Risk lifecycle: identify, assess inherent, plan mitigations, assess residual, monitor and review, then close or escalate">
      <defs>
        <marker id="arr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill="#2F5D8A" />
        </marker>
      </defs>
      {steps.map(([title, s], i) => (
        <g key={title} transform={`translate(${8 + i * 152}, 20)`}>
          <rect width="128" height="56" rx="3" className={box} strokeWidth="1" />
          <text x="64" y="24" textAnchor="middle" className={label} fontWeight="600">{title}</text>
          <text x="64" y="42" textAnchor="middle" className={sub}>{s}</text>
          {i < steps.length - 1 && <line x1="128" y1="28" x2="150" y2="28" className={arrow} markerEnd="url(#arr)" />}
        </g>
      ))}
      {/* review loop back */}
      <path d="M 692 76 L 692 108 L 388 108 L 388 84" fill="none" className={arrow} strokeDasharray="4 3" markerEnd="url(#arr)" />
      <text x="540" y="122" textAnchor="middle" className={sub}>re-assess at each review cycle</text>
      {/* outcomes */}
      <g transform="translate(236, 140)">
        <rect width="128" height="36" rx="3" fill="#4C8A4F" opacity="0.9" />
        <text x="64" y="22" textAnchor="middle" className="fill-white text-[11px] font-sans" fontWeight="600">Close</text>
      </g>
      <g transform="translate(396, 140)">
        <rect width="128" height="36" rx="3" fill="#A11E2D" opacity="0.9" />
        <text x="64" y="22" textAnchor="middle" className="fill-white text-[11px] font-sans" fontWeight="600">Escalate to issue</text>
      </g>
      <line x1="330" y1="108" x2="300" y2="138" className={arrow} markerEnd="url(#arr)" />
      <line x1="430" y1="108" x2="460" y2="138" className={arrow} markerEnd="url(#arr)" />
      <text x="252" y="128" className={sub}>no longer a threat</text>
      <text x="468" y="128" className={sub}>it happened</text>
    </svg>
  );
}

function ScoringDiagram() {
  return (
    <svg viewBox="0 0 700 120" className="w-full max-w-2xl" role="img" aria-label="Likelihood times impact equals importance, which the matrix turns into a ranking">
      <g transform="translate(10,20)">
        <rect width="150" height="60" rx="3" fill="white" stroke="#D8DEE4" />
        <text x="75" y="26" textAnchor="middle" className="fill-[#1B2733] text-[12px]" fontWeight="600">Likelihood</text>
        <text x="75" y="46" textAnchor="middle" className="fill-[#1B2733] opacity-60 text-[10px]">1 (rare) – 5 (almost certain)</text>
      </g>
      <text x="180" y="56" textAnchor="middle" className="fill-[#2F5D8A] text-[20px]" fontWeight="700">×</text>
      <g transform="translate(200,20)">
        <rect width="150" height="60" rx="3" fill="white" stroke="#D8DEE4" />
        <text x="75" y="26" textAnchor="middle" className="fill-[#1B2733] text-[12px]" fontWeight="600">Impact</text>
        <text x="75" y="46" textAnchor="middle" className="fill-[#1B2733] opacity-60 text-[10px]">1 (minimal) – 5 (severe)</text>
      </g>
      <text x="370" y="56" textAnchor="middle" className="fill-[#2F5D8A] text-[20px]" fontWeight="700">=</text>
      <g transform="translate(390,20)">
        <rect width="130" height="60" rx="3" fill="white" stroke="#D8DEE4" />
        <text x="65" y="26" textAnchor="middle" className="fill-[#1B2733] text-[12px]" fontWeight="600">Importance</text>
        <text x="65" y="46" textAnchor="middle" className="fill-[#1B2733] opacity-60 text-[10px]">1 – 25</text>
      </g>
      <line x1="522" y1="50" x2="552" y2="50" stroke="#2F5D8A" strokeWidth="1.5" markerEnd="url(#arr2)" />
      <defs>
        <marker id="arr2" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill="#2F5D8A" />
        </marker>
      </defs>
      <g transform="translate(556,20)">
        <rect width="134" height="60" rx="3" fill="#1B2733" />
        <text x="67" y="26" textAnchor="middle" className="fill-white text-[12px]" fontWeight="600">Ranking</text>
        <text x="67" y="46" textAnchor="middle" className="fill-white opacity-70 text-[10px]">from the 5×5 matrix</text>
      </g>
    </svg>
  );
}

function AppetiteDiagram() {
  return (
    <svg viewBox="0 0 640 110" className="w-full max-w-xl" role="img" aria-label="A residual rating above the appetite threshold is a breach">
      <text x="10" y="18" className="fill-[#1B2733] text-[11px]" fontWeight="600">Rating scale</text>
      {[
        ["Very Low", "#7C8B99"],
        ["Low", "#4C8A4F"],
        ["Medium", "#C9A227"],
        ["High", "#D97C1E"],
        ["Critical", "#A11E2D"],
      ].map(([label, color], i) => (
        <g key={label} transform={`translate(${10 + i * 124}, 30)`}>
          <rect width="116" height="30" rx="3" fill={color} opacity="0.9" />
          <text x="58" y="19" textAnchor="middle" className="fill-white text-[11px]" fontWeight="600">{label}</text>
        </g>
      ))}
      {/* appetite line between Medium and High */}
      <line x1="378" y1="24" x2="378" y2="72" stroke="#1B2733" strokeWidth="2" strokeDasharray="5 3" />
      <text x="378" y="90" textAnchor="middle" className="fill-[#1B2733] text-[10px]" fontWeight="600">appetite: Medium</text>
      <text x="196" y="80" textAnchor="middle" className="fill-[#4C8A4F] text-[10px]">acceptable</text>
      <text x="506" y="80" textAnchor="middle" className="fill-[#A11E2D] text-[10px]" fontWeight="600">breach — needs attention</text>
    </svg>
  );
}

/* ---------- page ---------- */

const SECTIONS = [
  ["concepts", "Core concepts"],
  ["scoring", "How scoring works"],
  ["workflow", "The risk lifecycle"],
  ["pages", "What each page does"],
  ["howto", "Common tasks"],
] as const;

export default function HelpPage() {
  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Help & guide</h1>
        <p className="text-sm text-ink/70 mt-1 max-w-2xl">
          How this register works, the risk-management ideas behind it, and where to click. Ten
          minutes here covers everything a risk owner needs.
        </p>
        <nav className="mt-3 flex flex-wrap gap-2 text-sm">
          {SECTIONS.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="border border-line rounded-sm px-2 py-1 hover:border-ink/50">
              {label}
            </a>
          ))}
        </nav>
      </div>

      <section id="concepts" className="card p-5 space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Core concepts</h2>
        <p className="text-sm max-w-2xl">
          A <b>risk</b> is something that <i>might</i> happen and would matter if it did — it has a
          likelihood and an impact. An <b>issue</b> is a risk that has actually happened (or a
          problem that arrived unannounced); it has no likelihood any more, only consequences to
          manage. When a risk materialises, you <b>escalate</b> it: the register entry is kept for
          lineage and a linked entry appears on the issue log.
        </p>
        <p className="text-sm max-w-2xl">
          Every risk is assessed twice. The <b>inherent</b> assessment scores it as if you did
          nothing — the raw exposure. The <b>residual</b> assessment scores it assuming your
          mitigation actions succeed. The gap between the two is what your mitigations buy you,
          and it's drawn on each risk's matrix: dashed marker = inherent, solid = residual.
        </p>
        <p className="text-sm max-w-2xl">
          <b>Appetite</b> is the maximum residual rating you're prepared to live with for a given
          risk (it defaults from the category). If the residual rating lands above the appetite,
          that's a <b>breach</b> — flagged in red on the register and counted on the dashboard.
        </p>
        <AppetiteDiagram />
      </section>

      <section id="scoring" className="card p-5 space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">How scoring works</h2>
        <p className="text-sm max-w-2xl">
          You score <b>likelihood</b> once and <b>impact</b> four times — Cost, Time, Quality, and
          Reputation — each on a 1–5 scale. For each dimension, likelihood × impact gives an{" "}
          <b>importance</b> score (1–25) used for ordering, and the 5×5 matrix below turns the
          likelihood/impact pair into a <b>ranking</b>. The risk's <b>combined</b> rating uses the
          highest of the four impacts — a risk is as serious as its worst dimension.
        </p>
        <ScoringDiagram />
        <div className="grid gap-6 sm:grid-cols-[auto_1fr] items-start">
          <div>
            <h3 className="lbl">The matrix (methodology: docs/SCORING.md)</h3>
            <Matrix />
          </div>
          <div className="text-sm space-y-2 max-w-md">
            <p>Rankings, in order:</p>
            <p className="flex flex-wrap gap-1.5">
              <RatingBadge ranking="VERY_LOW" /> <RatingBadge ranking="LOW" />{" "}
              <RatingBadge ranking="MEDIUM" /> <RatingBadge ranking="HIGH" />{" "}
              <RatingBadge ranking="CRITICAL" />
            </p>
            <p className="text-ink/70">
              Everything derived — importance, per-dimension rankings, the combined rating, breach
              flags — is computed by the system from your five scores. You never pick a colour by
              hand, so two risks with the same scores always get the same rating.
            </p>
          </div>
        </div>
      </section>

      <section id="workflow" className="card p-5 space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">The risk lifecycle</h2>
        <LifecycleDiagram />
        <p className="text-sm max-w-2xl text-ink/70">
          Risks aren't static: at each review cycle, owners re-assess (the register keeps every
          assessment, so history is preserved), update action statuses, and add progress notes.
          A risk leaves the register by being <b>closed</b> (no longer a threat) or{" "}
          <b>escalated</b> (it happened — continue on the issue log). Every change along the way
          is recorded in the audit trail shown at the bottom of each risk's page.
        </p>
      </section>

      <section id="pages" className="card p-5 space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">What each page does</h2>
        <table className="w-full text-sm">
          <tbody>
            {[
              ["Dashboard", "The live picture: exposure profile, category spread, the register heatmap, appetite breaches, overdue actions, top risks. Bars, chips, and heatmap cells are clickable — they drill into the register filtered to exactly what you clicked."],
              ["Register", "Every risk in the active project. Search, filter by status/category, and click any column heading to sort (click again to reverse). Click a ref or title to open the risk."],
              ["New risk", "Create a risk: description, category (which assigns the reference, e.g. HS3), owners, and both assessments. Appetite defaults from the category."],
              ["Issues", "The issue log: escalated risks with severity, RAG status, and a link back to the source risk."],
              ["Import", "Migrate a register from Excel using the downloadable template. Rankings are recomputed on import; rejected rows are reported with row numbers."],
              ["Projects (header, right)", "Each project has its own register, references, and issue log. Click the project name to switch or create projects."],
              ["Help", "This page."],
            ].map(([name, desc]) => (
              <tr key={name}>
                <td className="td font-medium whitespace-nowrap">{name}</td>
                <td className="td text-ink/80">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section id="howto" className="card p-5 space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Common tasks</h2>
        <dl className="text-sm space-y-3 max-w-2xl">
          <div>
            <dt className="font-medium">Raise a new risk</dt>
            <dd className="text-ink/70">Nav → <Link className="underline underline-offset-4" href="/risks/new">New risk</Link>. Describe what might happen, why, and the consequence; pick the category and owner; score inherent and residual. The reference is assigned automatically.</dd>
          </div>
          <div>
            <dt className="font-medium">Re-assess a risk at review</dt>
            <dd className="text-ink/70">Open the risk → “Re-assess” panel → adjust the five scores → record. Previous assessments are kept; the matrix shows the movement.</dd>
          </div>
          <div>
            <dt className="font-medium">Track mitigation actions</dt>
            <dd className="text-ink/70">On the risk page, add actions with an owner and target date; update their status from the same table. Actions past their target date count as overdue on the dashboard.</dd>
          </div>
          <div>
            <dt className="font-medium">Record progress</dt>
            <dd className="text-ink/70">Add a progress note on the risk page — a dated, attributed running commentary for reviews.</dd>
          </div>
          <div>
            <dt className="font-medium">Escalate or close</dt>
            <dd className="text-ink/70">In the risk's “Lifecycle” panel. Escalating creates a linked issue and keeps the risk for lineage; closed risks can be reopened.</dd>
          </div>
          <div>
            <dt className="font-medium">Find what's hurting</dt>
            <dd className="text-ink/70">Dashboard → click the Critical/High bars or the hottest heatmap cells, or sort the register by Residual (descending). Breaches are flagged in red.</dd>
          </div>
        </dl>
      </section>

      <p className="text-xs text-ink/50">
        Methodology reference: the scoring matrix and definitions live in the repository under{" "}
        <span className="font-mono">docs/SCORING.md</span>, <span className="font-mono">docs/REQUIREMENTS.md</span>, and{" "}
        <span className="font-mono">docs/DATA_MODEL.md</span>.
      </p>
    </div>
  );
}
