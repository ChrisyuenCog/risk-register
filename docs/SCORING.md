# Scoring Methodology

## Likelihood (probability), 1–5

| Rating | Meaning |
|---|---|
| 5 | Is almost certain to occur |
| 4 | Is likely to occur |
| 3 | Is as likely as not to occur |
| 2 | May occur occasionally |
| 1 | Unlikely to occur |

## Impact, 1–5 (applied per dimension: Cost, Time, Quality, Reputation)

| Rating | Meaning |
|---|---|
| 5 | Critical |
| 4 | Very High |
| 3 | Medium |
| 2 | Low |
| 1 | Very Low |

## Importance indicator

`importance = likelihood × impact` (per dimension). The overall potential impact is the maximum of the four dimension scores unless overridden.

## Impact vs Probability matrix → Risk Ranking

Rows = impact (5 at top), columns = probability (1–5):

| Impact \ Prob | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| **5** | M | H | H | C | C |
| **4** | L | M | H | H | C |
| **3** | L | L | M | M | H |
| **2** | VL | L | L | M | H |
| **1** | VL | VL | L | L | M |

VL = Very Low, L = Low, M = Medium, H = High, C = Critical.

## Inherent vs Mitigated (residual) risk

- **Inherent** — likelihood and impact scored assuming no mitigation.
- **Mitigated / residual** — re-scored assuming mitigation actions are successful. The residual ranking drives appetite-breach checks and dashboard exposure.

## Issue severity (for escalated risks / issue log)

| Score | Description | Required action |
|---|---|---|
| Critical (C) | "Show stopper" — will stop the programme/go-live | Detailed action plan + executive sign-off |
| High (H) | Workstream cannot move forward / significant scope under threat | Action plan approved by management |
| Medium (M) | Significant part stopped; workarounds in place | Managed within project; monitor; mitigate or close |
| Low (L) | Minor impact | Managed within project; monitor |
| Very Low (VL) | Negligible impact | Managed within project |

Issue progress is tracked with a RAG rating against the action plan.
