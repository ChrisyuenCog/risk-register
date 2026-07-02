import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { parseRegisterWorkbook, buildTemplateWorkbook, TEMPLATE_COLUMNS } from "./import-core";

function workbookFrom(rows: unknown[][]): Buffer {
  const ws = XLSX.utils.aoa_to_sheet([[...TEMPLATE_COLUMNS], ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Register");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

const validRow = [
  "hs", "", "Travel safety", "Road-traffic incidents on field routes.", "Injury to staff.",
  "People", "Operations Lead",
  3, 4, 3, 2, 4,
  2, 3, 3, 2, 3,
  "medium",
  "Journey management plan", "Ops Lead", "2026-08-01",
  "", "", "",
  "", "", "",
];

describe("parseRegisterWorkbook", () => {
  it("maps a valid row, normalising category and appetite case", () => {
    const { rows, errors } = parseRegisterWorkbook(workbookFrom([validRow]));
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(1);
    const r = rows[0];
    expect(r.category).toBe("HS");
    expect(r.appetite).toBe("MEDIUM");
    expect(r.inherent).toEqual({ likelihood: 3, cost: 4, time: 3, quality: 2, reputation: 4 });
    expect(r.actions).toHaveLength(1);
    expect(r.actions[0].targetDate?.getUTCFullYear()).toBe(2026);
  });

  it("rejects out-of-scale scores with the row number", () => {
    const bad = [...validRow];
    bad[7] = 6; // inherent likelihood
    const { rows, errors } = parseRegisterWorkbook(workbookFrom([bad]));
    expect(rows).toHaveLength(0);
    expect(errors[0]).toMatch(/Row 2/);
    expect(errors[0]).toMatch(/likelihood/);
  });

  it("skips blank rows and keeps valid ones around invalid ones", () => {
    const noTitle = [...validRow];
    noTitle[2] = "";
    const blank = new Array(validRow.length).fill("");
    const { rows, errors } = parseRegisterWorkbook(workbookFrom([validRow, blank, noTitle]));
    expect(rows).toHaveLength(1);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/Row 4/);
  });

  it("round-trips its own template", () => {
    const { rows, errors } = parseRegisterWorkbook(buildTemplateWorkbook());
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(1);
    expect(rows[0].category).toBe("HS");
  });
});
