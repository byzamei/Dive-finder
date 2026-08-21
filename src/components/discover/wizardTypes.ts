import type { SearchCriteria } from "@/lib/types/domain";

// Shared prop types for the per-step field components — every step body
// needs to read/patch the same in-progress criteria the same way.
export type UpdateCriteria = <K extends keyof SearchCriteria>(key: K, value: SearchCriteria[K]) => void;
export type ToggleInArray = <T>(arr: T[] | undefined, value: T) => T[];
