/**
 * Excel register import (FR-X5) — parsing and validation only.
 * Pure functions (no database, no Next.js) so the mapping is unit-testable.
 * Column layout matches the downloadable template at /import/template.
 */
import * as XLSX from "xlsx";
import { z } from "zod";

const scale = z.coerce.number().int().min(1).max(5);
const optionalText = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v) => (v === undefined ? "" : String(v).trim()));

const rowSchema = z.object({
  category: z.string().min(1, "Category code is required"),
  ref: optionalText,
  title: z.string().min(3, "Title is required"),
  description: z.string().min(3, "Description is required"),
  impactDescription: z.string().min(3, "Impact description is required"),
  impactArea: optionalText,
  owners: z.string().min(1, "Owner(s) required"),
  inherent: z.object({ likelihood: scale, cost: scale, time: scale, quality: scale, reputation: scale }),
  residual: z.object({ likelihood: scale, cost: scale, time: scale, quality: scale, reputation: scale }),
  appetite: z
    .enum(["VERY_LOW", "LOW", "MEDIUM", "HIGH", "CRITICAL"])
    .optional(),
  actions: z.array(
    z.object({ description: z.string().min(3), owner: z.string(), targetDate: z.date().nullable() })
  ),
});

export type ImportRow = z.infer<typeof rowSchema>;
export type ImportResult = { rows: ImportRow[]; errors: string[] };

export const TEMPLATE_COLUMNS = [
  "Category code",
  "Ref (optional)",
  "Title",
  "Description",
  "Impact description",
  "Impact area",
  "Owner(s)",
  "Inherent likelihood",
  "Inherent cost",
  "Inherent time",
  "Inherent quality",
  "Inherent reputation",
  "Residual likelihood",
  "Residual cost",
  "Residual time",
  "Residual quality",
  "Residual reputation",
  "Appetite (Very Low/Low/Medium/High/Critical)",
  "Action 1",
  "Action 1 owner",
  "Action 1 target date",
  "Action 2",
  "Action 2 owner",
  "Action 2 target date",
  "Action 3",
  "Action 3 owner",
  "Action 3 target date",
] as const;

function cell(record: Record<string, unknown>, header: string): unknown {
  // Header match is case- and whitespace-insensitive to tolerate hand-edited files.
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  const key = Object.keys(record).find((k) => norm(k).startsWith(norm(header).split(" (")[0]));
  return key === undefined ? undefined : record[key];
}

function parseAppetite(value: unknown): ImportRow["appetite"] {
  if (value === undefined || value === null || String(value).trim() === "") return undefined;
  const v = String(value).trim().toUpperCase().replace(/\s+/g, "_");
  return ["VERY_LOW", "LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(v)
    ? (v as ImportRow["appetite"])
    : undefined;
}

function parseDate(value: unknown): Date | null {
  if (value === undefined || value === null || value === "") return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    const d = XLSX.SSF.parse_date_code(value);
    return d ? new Date(Date.UTC(d.y, d.m - 1, d.d)) : null;
  }
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? null : d;
}

export function parseRegisterWorkbook(data: ArrayBuffer | Buffer): ImportResult {
  const wb = XLSX.read(data, { type: data instanceof ArrayBuffer ? "array" : "buffer", cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return { rows: [], errors: ["Workbook has no sheets."] };
  const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  const rows: ImportRow[] = [];
  const errors: string[] = [];

  records.forEach((rec, i) => {
    const line = i + 2; // 1-based plus header row
    // Skip fully empty rows.
    if (Object.values(rec).every((v) => String(v ?? "").trim() === "")) return;

    const actions = [1, 2, 3]
      .map((n) => ({
        description: String(cell(rec, `Action ${n}`) ?? "").trim(),
        owner: String(cell(rec, `Action ${n} owner`) ?? "").trim(),
        targetDate: parseDate(cell(rec, `Action ${n} target date`)),
      }))
      .filter((a) => a.description.length > 0);

    const candidate = {
      category: String(cell(rec, "Category code") ?? "").trim().toUpperCase(),
      ref: cell(rec, "Ref"),
      title: String(cell(rec, "Title") ?? "").trim(),
      description: String(cell(rec, "Description") ?? "").trim(),
      impactDescription: String(cell(rec, "Impact description") ?? "").trim(),
      impactArea: cell(rec, "Impact area"),
      owners: String(cell(rec, "Owner(s)") ?? "").trim(),
      inherent: {
        likelihood: cell(rec, "Inherent likelihood"),
        cost: cell(rec, "Inherent cost"),
        time: cell(rec, "Inherent time"),
        quality: cell(rec, "Inherent quality"),
        reputation: cell(rec, "Inherent reputation"),
      },
      residual: {
        likelihood: cell(rec, "Residual likelihood"),
        cost: cell(rec, "Residual cost"),
        time: cell(rec, "Residual time"),
        quality: cell(rec, "Residual quality"),
        reputation: cell(rec, "Residual reputation"),
      },
      appetite: parseAppetite(cell(rec, "Appetite")),
      actions,
    };

    const parsed = rowSchema.safeParse(candidate);
    if (parsed.success) {
      rows.push(parsed.data);
    } else {
      const first = parsed.error.issues[0];
      errors.push(`Row ${line}: ${first.path.join(".")} — ${first.message}`);
    }
  });

  if (records.length === 0) errors.push("The first sheet has no data rows.");
  return { rows, errors };
}

/** Build the empty import template workbook, with one example row. */
export function buildTemplateWorkbook(): Buffer {
  const example = [
    "HS",
    "",
    "Travel safety for field staff",
    "Staff travelling to field offices face road-traffic incidents.",
    "Injury to staff; programme suspension in affected region.",
    "People",
    "Operations Lead",
    3, 4, 3, 2, 4,
    2, 3, 3, 2, 3,
    "Medium",
    "Journey management plan for all field routes", "Operations Lead", "2026-08-01",
    "", "", "",
    "", "", "",
  ];
  const ws = XLSX.utils.aoa_to_sheet([[...TEMPLATE_COLUMNS], example]);
  ws["!cols"] = TEMPLATE_COLUMNS.map((c) => ({ wch: Math.max(14, c.length) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Register");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
