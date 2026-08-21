import type { SearchCriteria } from "@/lib/types/domain";
import { FieldLabel } from "../FieldLabel";
import { CURRENCIES } from "../wizardOptions";
import type { UpdateCriteria } from "../wizardTypes";

export function BudgetStep({ criteria, update }: { criteria: SearchCriteria; update: UpdateCriteria }) {
  return (
    <div>
      <FieldLabel>Total budget</FieldLabel>
      <div className="flex gap-2">
        <input
          type="number"
          min={0}
          placeholder="e.g. 2000"
          className="focus-ring w-40 rounded-lg border border-abyss-200 px-3 py-2.5 text-sm"
          value={criteria.budgetTotal ?? ""}
          onChange={(e) => update("budgetTotal", e.target.value ? Number(e.target.value) : undefined)}
        />
        <select
          className="focus-ring rounded-lg border border-abyss-200 px-3 py-2.5 text-sm"
          value={criteria.currency ?? "EUR"}
          onChange={(e) => update("currency", e.target.value)}
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-6">
        <FieldLabel optional>Departure location</FieldLabel>
        <input
          type="text"
          placeholder="e.g. Paris, France"
          className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-2.5 text-sm"
          value={criteria.departureLocation ?? ""}
          onChange={(e) => update("departureLocation", e.target.value)}
        />
      </div>
    </div>
  );
}
