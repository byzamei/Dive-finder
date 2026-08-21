import type { SearchCriteria } from "@/lib/types/domain";
import { Chip } from "../Chip";
import { FieldLabel } from "../FieldLabel";
import { MONTHS } from "../wizardOptions";
import type { ToggleInArray, UpdateCriteria } from "../wizardTypes";

// Used both in step 0's compact Booking-style card and, structurally, is
// the same pair of fields the Review summary links back to — kept as its
// own component so there's exactly one place that renders them.
export function DatesFields({
  criteria,
  update,
  toggleInArray,
}: {
  criteria: SearchCriteria;
  update: UpdateCriteria;
  toggleInArray: ToggleInArray;
}) {
  return (
    <>
      <FieldLabel>Months</FieldLabel>
      <div className="flex flex-wrap gap-2">
        {MONTHS.map((m, i) => (
          <Chip
            key={m}
            selected={(criteria.months ?? []).includes(i + 1)}
            onClick={() => update("months", toggleInArray(criteria.months, i + 1))}
          >
            {m}
          </Chip>
        ))}
      </div>
      <div className="mt-4">
        <FieldLabel>Trip length (days)</FieldLabel>
        <input
          type="number"
          min={1}
          className="focus-ring w-32 rounded-lg border border-abyss-200 px-3 py-2.5 text-sm"
          value={criteria.durationDays ?? ""}
          onChange={(e) => update("durationDays", e.target.value ? Number(e.target.value) : undefined)}
        />
      </div>
    </>
  );
}
