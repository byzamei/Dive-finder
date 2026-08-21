import type { SearchCriteria } from "@/lib/types/domain";
import { MONTHS } from "../wizardOptions";

export function SummaryStep({
  criteria,
  speciesById,
  onEditStep,
}: {
  criteria: SearchCriteria;
  speciesById: Map<string, string>;
  onEditStep: (step: number) => void;
}) {
  const rows: [string, string, number][] = [];
  if (criteria.months?.length) rows.push(["Months", criteria.months.map((m) => MONTHS[m - 1]).join(", "), 0]);
  if (criteria.durationDays) rows.push(["Trip length", `${criteria.durationDays} days`, 0]);
  if (criteria.budgetTotal) rows.push(["Budget", `${criteria.budgetTotal} ${criteria.currency}`, 1]);
  if (criteria.numberOfDivesBucket) rows.push(["Experience", criteria.numberOfDivesBucket, 2]);
  if (criteria.speciesIds?.length)
    rows.push(["Wildlife", criteria.speciesIds.map((id) => speciesById.get(id) ?? id).join(", "), 3]);
  if (criteria.diveTypes?.length) rows.push(["Dive type", criteria.diveTypes.join(", "), 4]);
  if (criteria.acceptedCurrent?.length) rows.push(["Accepted current", criteria.acceptedCurrent.join(", "), 4]);

  if (rows.length === 0) {
    return (
      <p className="rounded-xl2 border border-dashed border-abyss-200 p-4 text-sm text-abyss-500">
        No filters set — we&apos;ll show every published destination. You can still search, or go back and add some.
      </p>
    );
  }

  return (
    <dl className="divide-y divide-abyss-100 overflow-hidden rounded-xl2 border border-abyss-100">
      {rows.map(([k, v, stepIndex]) => (
        <div key={k} className="flex items-center justify-between gap-3 px-4 py-3.5 text-sm">
          <div className="min-w-0">
            <dt className="text-abyss-500">{k}</dt>
            <dd className="mt-0.5 truncate font-medium text-abyss-900">{v}</dd>
          </div>
          <button
            type="button"
            onClick={() => onEditStep(stepIndex)}
            className="focus-ring shrink-0 text-xs font-medium text-ocean-600 underline"
          >
            Edit
          </button>
        </div>
      ))}
    </dl>
  );
}
