import { importRegister } from "@/server/import-action";
import { TEMPLATE_COLUMNS } from "@/server/import-core";

export const dynamic = "force-dynamic";

export default function ImportPage({
  searchParams,
}: {
  searchParams: { created?: string; failure?: string | string[]; error?: string };
}) {
  const failures = [searchParams.failure ?? []].flat();
  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Import register from Excel</h1>
      <p className="text-sm text-ink/70">
        Upload an .xlsx file in the template layout to migrate an existing register. Each row
        becomes a risk with its inherent and residual assessments and up to three mitigation
        actions. Rankings are recomputed by the scoring engine on import.
      </p>

      {searchParams.error && (
        <div className="card p-3 text-sm border-rating-critical text-rating-critical">{searchParams.error}</div>
      )}
      {searchParams.created !== undefined && (
        <div className="card p-3 text-sm space-y-1">
          <p><b>{searchParams.created}</b> risk{searchParams.created === "1" ? "" : "s"} imported.</p>
          {failures.length > 0 && (
            <div>
              <p className="text-rating-critical font-medium">Rows not imported:</p>
              <ul className="list-none text-ink/70">
                {failures.map((f, i) => (<li key={i}>{f}</li>))}
              </ul>
            </div>
          )}
        </div>
      )}

      <form action={importRegister} className="card p-4 space-y-3">
        <label className="block">
          <span className="lbl">Register file (.xlsx)</span>
          <input type="file" name="file" accept=".xlsx" required className="inp" />
        </label>
        <button className="btn">Import</button>
      </form>

      <div className="card p-4 text-sm space-y-2">
        <p className="lbl">Template</p>
        <p>
          <a href="/import/template" className="underline underline-offset-4">
            Download the import template (.xlsx)
          </a>{" "}
          — first sheet, one risk per row, headers in row 1:
        </p>
        <p className="text-xs text-ink/60 font-mono leading-relaxed">{TEMPLATE_COLUMNS.join(" · ")}</p>
        <p className="text-xs text-ink/60">
          Category codes must already exist in the project (HS, HR, PM, OP, FN, PL, EN, IT by
          default). Scores are whole numbers 1–5. A provided Ref is kept if unused, otherwise the
          next reference in the category is assigned.
        </p>
      </div>
    </div>
  );
}
