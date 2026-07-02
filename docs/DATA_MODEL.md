# Data Model

Entity overview (see `prisma/schema.prisma` for the authoritative schema).

```
Organisation ─< Project ─< Risk ─< MitigationAction
                    │        │  ─< RiskAssessment (inherent / residual, versioned)
                    │        │  ─< ProgressNote
                    │        │  ─< AssuranceRecord
                    │        └──> Issue (escalation, keeps riskRef)
                    ├─< Issue
                    ├─< ChangeRequest
                    ├─< ReviewCycle ─< AssuranceRecord
                    ├─< RiskCategory
                    └─< ProjectMember (User + Role)
AuditLog — append-only, spans all entities
```

Key design decisions:

1. **Assessments are versioned rows, not columns.** Each `RiskAssessment` stores likelihood + the four impact dimensions + derived scores, with a `kind` of INHERENT or RESIDUAL and a timestamp. History and "change since last review" fall out naturally.
2. **Rankings are stored, not just computed**, so the register is queryable/sortable in SQL, but they are always written by the scoring engine (`src/lib/scoring.ts`) — never by hand.
3. **Appetite lives on the Risk** (`appetiteMaxRanking`), satisfying the governance requirement that appetite is set per risk, not per category. Category-level defaults seed the value.
4. **Escalation preserves lineage.** `Issue.riskId` is nullable — issues may arise directly — but when set, the risk's status becomes ESCALATED and the register shows the issue reference.
5. **AuditLog is append-only** with actor, entity, action, and JSON before/after snapshots.
6. **ReviewCycle** models the quarterly governance rhythm: distribution date, meeting date, per-owner `AssuranceRecord` (CONFIRMED / CHANGES_PROPOSED / CONCERN), and captured decisions.
