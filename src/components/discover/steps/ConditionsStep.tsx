import type { SearchCriteria } from "@/lib/types/domain";
import { Chip } from "../Chip";
import { FieldLabel } from "../FieldLabel";
import { CURRENT_LEVELS, DIVE_TYPE_TAGS } from "../wizardOptions";
import type { ToggleInArray, UpdateCriteria } from "../wizardTypes";

export function ConditionsStep({
  criteria,
  update,
  toggleInArray,
}: {
  criteria: SearchCriteria;
  update: UpdateCriteria;
  toggleInArray: ToggleInArray;
}) {
  return (
    <div>
      <FieldLabel>Current you accept</FieldLabel>
      <div className="flex flex-wrap gap-2">
        {CURRENT_LEVELS.map((c) => (
          <Chip
            key={c.value}
            selected={(criteria.acceptedCurrent ?? []).includes(c.value)}
            onClick={() => update("acceptedCurrent", toggleInArray(criteria.acceptedCurrent, c.value))}
          >
            {c.label}
          </Chip>
        ))}
      </div>
      <div className="mt-6">
        <FieldLabel>Dive type</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {DIVE_TYPE_TAGS.map((t) => (
            <Chip
              key={t.value}
              selected={(criteria.diveTypes ?? []).includes(t.value)}
              onClick={() => update("diveTypes", toggleInArray(criteria.diveTypes, t.value))}
            >
              {t.label}
            </Chip>
          ))}
        </div>
      </div>
      <div className="mt-6">
        <FieldLabel>Photography</FieldLabel>
        <Chip selected={criteria.photoFriendly ?? false} onClick={() => update("photoFriendly", !criteria.photoFriendly)}>
          Photo-friendly preferred
        </Chip>
      </div>
    </div>
  );
}
