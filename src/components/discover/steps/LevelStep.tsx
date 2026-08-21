import type { SearchCriteria } from "@/lib/types/domain";
import { Chip } from "../Chip";
import { FieldLabel } from "../FieldLabel";
import { CURRENT_EXPERIENCE, DIVE_COUNT_BUCKETS } from "../wizardOptions";
import type { UpdateCriteria } from "../wizardTypes";

export function LevelStep({ criteria, update }: { criteria: SearchCriteria; update: UpdateCriteria }) {
  return (
    <div>
      <FieldLabel>Number of logged dives</FieldLabel>
      <div className="flex flex-wrap gap-2">
        {DIVE_COUNT_BUCKETS.map((b) => (
          <Chip key={b.value} selected={criteria.numberOfDivesBucket === b.value} onClick={() => update("numberOfDivesBucket", b.value)}>
            {b.label}
          </Chip>
        ))}
      </div>
      <div className="mt-6">
        <FieldLabel>Comfort in current</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {CURRENT_EXPERIENCE.map((c) => (
            <Chip key={c.value} selected={criteria.currentExperience === c.value} onClick={() => update("currentExperience", c.value)}>
              {c.label}
            </Chip>
          ))}
        </div>
      </div>
      <div className="mt-6">
        <FieldLabel>Certifications</FieldLabel>
        <Chip selected={criteria.nitroxCertified ?? false} onClick={() => update("nitroxCertified", !criteria.nitroxCertified)}>
          Nitrox certified
        </Chip>
      </div>
    </div>
  );
}
