import type { CurrentLevel, DiveTypeTag, NumberOfDivesBucket, CurrentExperience } from "@/lib/types/domain";

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const DIVE_COUNT_BUCKETS: { value: NumberOfDivesBucket; label: string }[] = [
  { value: "0-9", label: "0–9 dives" },
  { value: "10-24", label: "10–24 dives" },
  { value: "25-49", label: "25–49 dives" },
  { value: "50-99", label: "50–99 dives" },
  { value: "100-249", label: "100–249 dives" },
  { value: "250+", label: "250+ dives" },
];

export const CURRENT_EXPERIENCE: { value: CurrentExperience; label: string }[] = [
  { value: "none", label: "No current experience" },
  { value: "some", label: "Some current experience" },
  { value: "comfortable", label: "Comfortable in current" },
  { value: "expert", label: "Expert in strong current" },
];

export const CURRENT_LEVELS: { value: CurrentLevel; label: string }[] = [
  { value: "none", label: "None" },
  { value: "mild", label: "Mild" },
  { value: "moderate", label: "Moderate" },
  { value: "strong", label: "Strong" },
  { value: "variable", label: "Variable" },
];

export const DIVE_TYPE_TAGS: { value: DiveTypeTag; label: string }[] = [
  { value: "reef", label: "Reef" },
  { value: "wreck", label: "Wreck" },
  { value: "wall", label: "Wall" },
  { value: "drift", label: "Drift" },
  { value: "muck", label: "Muck" },
  { value: "pelagic", label: "Pelagic" },
  { value: "shore", label: "Shore" },
  { value: "boat", label: "Boat" },
  { value: "liveaboard", label: "Liveaboard" },
  { value: "resort", label: "Resort" },
  { value: "macro", label: "Macro" },
  { value: "photo_friendly", label: "Photo-friendly" },
];

export const CURRENCIES = ["EUR", "USD", "GBP", "AUD"];

export const VISIBILITY_BUCKETS: { value: string; label: string }[] = [
  { value: "poor", label: "Poor (<5m)" },
  { value: "fair", label: "Fair (5–10m)" },
  { value: "good", label: "Good (10–20m)" },
  { value: "excellent", label: "Excellent (20m+)" },
];
