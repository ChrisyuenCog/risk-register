/**
 * Risk scoring engine.
 * Encodes the 5x5 likelihood x impact model with four impact dimensions
 * (Cost, Time, Quality, Reputation) and the impact-vs-probability matrix.
 * See docs/SCORING.md.
 */

export type Ranking = "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ImpactScores {
  cost: number; // 1–5
  time: number;
  quality: number;
  reputation: number;
}

export interface AssessmentInput {
  likelihood: number; // 1–5
  impacts: ImpactScores;
}

export interface DimensionResult {
  importance: number; // likelihood x impact
  ranking: Ranking;
}

export interface AssessmentResult {
  cost: DimensionResult;
  time: DimensionResult;
  quality: DimensionResult;
  reputation: DimensionResult;
  combinedImpact: number; // max of dimensions
  combinedImportance: number;
  combinedRanking: Ranking;
}

/**
 * Impact vs probability matrix. MATRIX[impact - 1][likelihood - 1].
 * Rows: impact 1..5 (bottom to top of the published matrix).
 */
const MATRIX: Ranking[][] = [
  ["VERY_LOW", "VERY_LOW", "LOW", "LOW", "MEDIUM"], // impact 1
  ["VERY_LOW", "LOW", "LOW", "MEDIUM", "HIGH"], // impact 2
  ["LOW", "LOW", "MEDIUM", "MEDIUM", "HIGH"], // impact 3
  ["LOW", "MEDIUM", "HIGH", "HIGH", "CRITICAL"], // impact 4
  ["MEDIUM", "HIGH", "HIGH", "CRITICAL", "CRITICAL"], // impact 5
];

const RANK_ORDER: Ranking[] = [
  "VERY_LOW",
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
];

function assertScale(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new RangeError(`${label} must be an integer between 1 and 5, got ${value}`);
  }
}

export function rank(likelihood: number, impact: number): Ranking {
  assertScale(likelihood, "likelihood");
  assertScale(impact, "impact");
  return MATRIX[impact - 1][likelihood - 1];
}

export function assess(input: AssessmentInput): AssessmentResult {
  const { likelihood, impacts } = input;
  assertScale(likelihood, "likelihood");

  const dim = (impact: number, label: string): DimensionResult => {
    assertScale(impact, label);
    return { importance: likelihood * impact, ranking: rank(likelihood, impact) };
  };

  const cost = dim(impacts.cost, "cost impact");
  const time = dim(impacts.time, "time impact");
  const quality = dim(impacts.quality, "quality impact");
  const reputation = dim(impacts.reputation, "reputation impact");

  const combinedImpact = Math.max(
    impacts.cost,
    impacts.time,
    impacts.quality,
    impacts.reputation
  );

  return {
    cost,
    time,
    quality,
    reputation,
    combinedImpact,
    combinedImportance: likelihood * combinedImpact,
    combinedRanking: rank(likelihood, combinedImpact),
  };
}

/** True if a residual ranking breaches the per-risk appetite threshold. */
export function breachesAppetite(residual: Ranking, appetiteMax: Ranking): boolean {
  return RANK_ORDER.indexOf(residual) > RANK_ORDER.indexOf(appetiteMax);
}

/** Compare two rankings: negative = a < b, 0 = equal, positive = a > b. */
export function compareRankings(a: Ranking, b: Ranking): number {
  return RANK_ORDER.indexOf(a) - RANK_ORDER.indexOf(b);
}
