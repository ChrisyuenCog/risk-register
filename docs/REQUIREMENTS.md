# Requirements Specification — RiskRegister

Version 0.1 — derived from an operating project risk register (SI SSEIP, 51 risks), the governance team meeting of 25 June 2026, and the quarterly risk presentation to governance.

## 1. Purpose

Provide a single, governed, auditable system for identifying, assessing, mitigating, and reviewing project risks and issues, supporting monthly project-team workshops and quarterly governance reviews.

## 2. Roles

| Role | Description |
|---|---|
| Administrator | Manages users, projects, reference data, appetite defaults |
| Risk Manager (e.g. PMMO Lead) | Owns the register, runs workshops and governance reviews, distributes register, records decisions |
| Risk Owner | Accountable for a risk; reviews and provides assurance before governance meetings |
| Action Owner | Delivers a specific mitigation action |
| Governance Member | Reviews dashboards and register, comments, confirms appetite |
| Viewer | Read-only access |

## 3. Functional requirements

### 3.1 Risk management (FR-R)

- FR-R1: Create, edit, and close risks with: reference ID (auto, category-prefixed e.g. HS1, PM2), title, description, impact description, category, status (Open/Closed/Escalated).
- FR-R2: Score likelihood 1–5 and impact 1–5 in four dimensions: **Cost, Time, Quality, Reputation**.
- FR-R3: Auto-calculate per-dimension importance indicator (likelihood × impact) and risk ranking (Low/Medium/High/Critical) from the impact vs probability matrix (see docs/SCORING.md).
- FR-R4: Record **Inherent** (pre-mitigation) and **Mitigated/Residual** (post-mitigation) likelihood and impact; auto-derive combined rankings for both.
- FR-R5: Support multiple mitigation actions per risk (minimum 3, unbounded), each with description, action owner, target date, and status.
- FR-R6: Assign one or more risk owners per risk.
- FR-R7: Risk categories are configurable per project; seed set: Health & Safety (HS), Human Resources (HR), Project Management (PM), Operations (OP), Financial (FN), Political (PL), Environment (EN), Information Technology (IT). Impact categories: People, Operations, Commercial, Reputational, Quality, Systems.
- FR-R8: Track "change since last review" per risk (new / increased / decreased / unchanged) automatically from history.
- FR-R9: Progress/status free-text updates with timestamped entries (not overwrite).

### 3.2 Risk appetite (FR-A)

- FR-A1: Set an appetite threshold **per individual risk** (not only per category), expressed as a maximum acceptable residual ranking or score.
- FR-A2: Flag risks whose residual rating breaches appetite.
- FR-A3: Governance members can confirm or propose adjustments to appetite thresholds; proposals require Risk Manager acceptance and are audit-logged.

### 3.3 Issues and change control (FR-I)

- FR-I1: Escalate a risk to an issue in one action, preserving the risk reference; issue log records description, raiser, date raised, likely impact, management actions, action owner, RAG progress rating, target date, date resolved.
- FR-I2: Standalone issues (not originating from risks) can also be raised.
- FR-I3: Issue severity scale: Critical / High / Medium / Low / Very Low, with the escalation rules for each (e.g. Critical requires exec sign-off of a detailed action plan).
- FR-I4: Change Control Log: record CCRs with description, raiser, effective date, implications/reason, action, agreed change, closure status, and attachment of the signed CCR document.

### 3.4 Governance workflow (FR-G)

Derived directly from the 25 June 2026 governance meeting actions:

- FR-G1: **Pre-meeting distribution** — Risk Manager schedules a review cycle; the system notifies all risk owners/leads with a link to the current register filtered to their risks, in advance of each quarterly meeting.
- FR-G2: **Assurance sign-off** — each owner reviews relevance, risk levels, and mitigations for their risks and records assurance (confirmed / changes proposed / concern raised) with comments, before the meeting.
- FR-G3: **Live meeting mode** — a presentation view of the live register for on-screen review during governance meetings, with real-time capture of decisions and comments against each risk.
- FR-G4: **Between-meeting updates** — when a risk is added or materially changes, the Risk Manager can trigger (or the system auto-sends) an email summary of significant updates to the management team.
- FR-G5: Meeting records — attach agenda, attendance, decisions, and action items to each governance review; export minutes.
- FR-G6: Feedback — governance members can leave suggestions/comments on the register and process.

### 3.5 Dashboards & reporting (FR-D)

- FR-D1: Live dashboard: total risks, counts by rating (High/Medium/Low/Critical), exposure profile percentages, distribution by category, top risks, appetite breaches, overdue actions.
- FR-D2: Trend view: rating movements between review points; changes since last review.
- FR-D3: Exports: full register to Excel and PDF; dashboard to PDF/PPTX-friendly format for governance packs.
- FR-D4: Filter/search across all fields; saved views per role.

### 3.6 Audit, notifications, administration (FR-X)

- FR-X1: Immutable audit trail of every create/update/delete with actor, timestamp, before/after values (addresses records-management/audit-trail risk).
- FR-X2: Email notifications: review requests, assurance reminders, action due/overdue, appetite breaches, significant-change digests.
- FR-X3: Multi-project support with per-project membership and roles.
- FR-X4: Reference-data administration: categories, scales, matrix, appetite defaults.
- FR-X5: Import from Excel (mapping to the existing register template) to migrate current registers.

## 4. Non-functional requirements

- NFR-1 Security: SSO (Azure AD/Google), RBAC, encryption in transit and at rest, least-privilege access.
- NFR-2 Availability: usable on low-bandwidth connections (relevant to field offices); responsive UI; graceful offline read where feasible.
- NFR-3 Auditability: no hard deletes of scored/reviewed risks; full history retained.
- NFR-4 Data protection: configurable retention; data classification guidance; no personal data beyond names/emails of users and owners.
- NFR-5 Performance: register views < 2s for 1,000 risks per project.
- NFR-6 Accessibility: WCAG 2.1 AA.

## 5. Phased roadmap

| Phase | Scope |
|---|---|
| 1 — Core register | Auth, projects, risk CRUD, scoring engine, mitigations, audit trail, Excel import |
| 2 — Governance | Review cycles, assurance sign-off, live meeting mode, appetite per risk, notifications |
| 3 — Issues & change control | Issue log, escalation, CCR log, attachments |
| 4 — Dashboards & reporting | Dashboard, trends, Excel/PDF exports, saved views |
| 5 — Hardening | SSO, accessibility, performance, multi-tenancy polish |
