# RiskRegister — Professional Project Risk Management

A commercial-grade risk register application for professional project risk management, replacing spreadsheet-based registers with a governed, auditable, collaborative platform.

Born from real-world practice: the requirements are derived from an operating risk register (51 risks, 8 categories), a quarterly governance review process, and management-team feedback on assurance, risk appetite, and dashboarding.

## Why

Spreadsheet risk registers break down at scale:

- No audit trail of who changed what, when, and why
- No workflow for pre-meeting review and assurance by risk owners
- Risk appetite set by broad category instead of per-risk thresholds
- Dashboards rebuilt by hand for every governance meeting
- No notifications when risks change between meetings
- Risks that become issues are re-keyed manually into a separate log

This application addresses each of those directly.

## Core capabilities (target)

- **Risk lifecycle** — identify, assess, mitigate, monitor, close, or escalate to issue
- **5×5 scoring model** — likelihood × impact across four dimensions (Cost, Time, Quality, Reputation), with automatic Inherent and Mitigated (residual) risk ratings via the impact/probability matrix
- **Risk appetite per risk** — thresholds set and confirmed at the individual risk level, with breach indicators
- **Mitigation actions** — multiple actions per risk, each with an owner, due date, and status
- **Governance workflow** — pre-meeting review assignments for risk owners/leads, sign-off ("assurance") tracking, live meeting review mode, and decision/action logging
- **Issue log & change control log** — one-click conversion of a risk to an issue (preserving the risk reference), RAG progress tracking, and a change control register
- **Dashboards** — live exposure profile, distribution by category/rating, trend over time, and change-since-last-review indicators
- **Notifications** — email digests to the management team when significant risks change between meetings
- **Audit trail** — full immutable history of every change (a recurring audit finding for records management)
- **RBAC** — administrator, risk manager, risk owner, action owner, governance viewer

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14 (App Router), React, TypeScript, Tailwind CSS |
| Backend | Next.js API routes / server actions |
| Database | PostgreSQL via Prisma ORM |
| Auth | NextAuth.js (SSO-ready: Azure AD / Google) |
| CI | GitHub Actions |

## Getting started

Requirements: Node.js 20+, Docker (or any PostgreSQL 14+).

```bash
npm install                # installs deps and downloads Prisma engines
docker compose up -d       # local PostgreSQL on :5432
cp .env.example .env       # DATABASE_URL already matches docker-compose
npx prisma migrate deploy  # apply migrations
npm run db:seed            # sample project, categories, and risks
npm run dev                # http://localhost:3000
```

Run the scoring-engine tests with `npm test`.

### Database access

Prisma is configured with the `driverAdapters` preview feature and the
`pg` driver adapter (`src/server/db.ts`), which works in standard and
serverless deployments alike. Migrations live in `prisma/migrations/`
and are applied with `prisma migrate deploy`.

## What exists today (Phase 1 — core register)

- Dashboard: exposure profile, category distribution, live 5×5 matrix
  heatmap, appetite breaches, overdue actions, top risks
- Register: filterable/searchable table with inherent & residual
  rankings and per-risk appetite breach flags
- Risks: create with auto category-prefixed refs (HS1, PM2, …),
  inherent + residual scoring across Cost/Time/Quality/Reputation,
  versioned re-assessment, per-risk appetite, mitigation actions,
  progress notes, one-click escalation to the issue log, close/reopen
- Audit: append-only log of every mutation, shown on each risk

Not yet built (see roadmap below): authentication/RBAC, governance
review cycles and assurance sign-off, notifications, Excel import and
exports, issue & change-control screens.

## Repository layout

```
docs/            Requirements, data model, scoring methodology
prisma/          Database schema, migrations, seed script
src/app/         Next.js App Router pages (dashboard, register, risk)
src/components/  Shared UI (rating badges, 5×5 matrix, score fields)
src/lib/         Domain logic (risk scoring engine, matrix)
src/server/      Prisma client, server actions, audit helper, queries
.github/         CI workflows
```

## Documentation

- [Requirements specification](docs/REQUIREMENTS.md)
- [Data model](docs/DATA_MODEL.md)
- [Scoring methodology](docs/SCORING.md)

## Status

🚧 Foundation stage — requirements, data model, and scoring engine are in place. See [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) for the phased roadmap.

## License

Proprietary — all rights reserved (update as appropriate).
