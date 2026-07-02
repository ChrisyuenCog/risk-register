const SCALE = [1, 2, 3, 4, 5];

/** Likelihood + four impact dimensions (FR-R2), plain selects — no client JS. */
export function ScoreFields({
  prefix = "",
  legend,
  defaults,
}: {
  prefix?: string;
  legend: string;
  defaults?: { likelihood: number; cost: number; time: number; quality: number; reputation: number };
}) {
  const fields = [
    { name: "likelihood", label: "Likelihood", def: defaults?.likelihood },
    { name: "cost", label: "Cost", def: defaults?.cost },
    { name: "time", label: "Time", def: defaults?.time },
    { name: "quality", label: "Quality", def: defaults?.quality },
    { name: "reputation", label: "Reputation", def: defaults?.reputation },
  ];
  return (
    <fieldset className="border border-line rounded-sm p-3">
      <legend className="px-1 text-[11px] uppercase tracking-[0.08em] text-ink/60">{legend}</legend>
      <div className="grid grid-cols-5 gap-2">
        {fields.map((f) => (
          <label key={f.name} className="block">
            <span className="lbl">{f.label}</span>
            <select name={`${prefix}${f.name}`} defaultValue={f.def ?? 3} className="inp" required>
              {SCALE.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
