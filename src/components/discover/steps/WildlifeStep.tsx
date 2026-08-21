import type { MarineSpecies, SearchCriteria } from "@/lib/types/domain";
import { Chip } from "../Chip";
import { FieldLabel } from "../FieldLabel";
import type { ToggleInArray, UpdateCriteria } from "../wizardTypes";

export function WildlifeStep({
  criteria,
  species,
  update,
  toggleInArray,
}: {
  criteria: SearchCriteria;
  species: MarineSpecies[];
  update: UpdateCriteria;
  toggleInArray: ToggleInArray;
}) {
  return (
    <div>
      <FieldLabel>Animals you&apos;re chasing</FieldLabel>
      <div className="flex flex-wrap gap-2">
        {species.map((s) => (
          <Chip
            key={s.id}
            selected={(criteria.speciesIds ?? []).includes(s.id)}
            onClick={() => update("speciesIds", toggleInArray(criteria.speciesIds, s.id))}
          >
            {s.common_name}
          </Chip>
        ))}
        {species.length === 0 && <p className="text-sm text-abyss-400">Loading species…</p>}
      </div>
    </div>
  );
}
