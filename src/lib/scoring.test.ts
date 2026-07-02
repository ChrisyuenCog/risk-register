import { describe, it, expect } from "vitest";
import { assess, rank, breachesAppetite } from "./scoring";

describe("impact vs probability matrix", () => {
  it("matches published matrix corners", () => {
    expect(rank(1, 1)).toBe("VERY_LOW");
    expect(rank(5, 1)).toBe("MEDIUM");
    expect(rank(1, 5)).toBe("MEDIUM");
    expect(rank(5, 5)).toBe("CRITICAL");
    expect(rank(3, 5)).toBe("HIGH"); // example from methodology doc
  });

  it("rejects out-of-scale values", () => {
    expect(() => rank(0, 3)).toThrow(RangeError);
    expect(() => rank(3, 6)).toThrow(RangeError);
  });
});

describe("assess() against real register rows", () => {
  // The source workbook's Impact-vs-Probability matrix (and docs/SCORING.md)
  // give I3×P2 = Low. The old register's ranking cells said Medium for this
  // row, but those cells were internally inconsistent (importance 2, 3 and 4
  // each appear with two different labels across the sheet) and are not
  // authoritative; the matrix is.
  it("HS1 Travel safety: L2, impacts 3/3/2/3 → Low per the matrix, combined importance 6", () => {
    const r = assess({
      likelihood: 2,
      impacts: { cost: 3, time: 3, quality: 2, reputation: 3 },
    });
    expect(r.cost.importance).toBe(6);
    expect(r.cost.ranking).toBe("LOW");
    expect(r.quality.importance).toBe(4);
    expect(r.quality.ranking).toBe("LOW");
    expect(r.combinedImpact).toBe(3);
    expect(r.combinedImportance).toBe(6);
    expect(r.combinedRanking).toBe("LOW");
  });

  it("PM2 Deliverables clarity: L4, impacts 4/4/4/2 → High 16", () => {
    const r = assess({
      likelihood: 4,
      impacts: { cost: 4, time: 4, quality: 4, reputation: 2 },
    });
    expect(r.cost.importance).toBe(16);
    expect(r.cost.ranking).toBe("HIGH");
    expect(r.combinedImportance).toBe(16);
    expect(r.combinedRanking).toBe("HIGH");
  });

  it("PL4 Curriculum sovereignty: L4, reputation 5 → importance 20, Critical", () => {
    const r = assess({
      likelihood: 4,
      impacts: { cost: 3, time: 4, quality: 3, reputation: 5 },
    });
    expect(r.reputation.importance).toBe(20);
    expect(r.reputation.ranking).toBe("CRITICAL");
    expect(r.combinedImpact).toBe(5);
  });
});

describe("risk appetite", () => {
  it("flags breaches above the per-risk threshold", () => {
    expect(breachesAppetite("HIGH", "MEDIUM")).toBe(true);
    expect(breachesAppetite("MEDIUM", "MEDIUM")).toBe(false);
    expect(breachesAppetite("LOW", "MEDIUM")).toBe(false);
  });
});
