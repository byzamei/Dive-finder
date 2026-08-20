// Shared domain types for DiveFinder.
//
// These are hand-written to mirror supabase/migrations/*.sql. If you have a
// live Supabase project you can additionally generate stricter types with
// `supabase gen types typescript` — see README.md. Hand-written types are
// kept here so the app builds and typechecks without a live database.

export type UUID = string;
export type ISODateString = string;

export type Confidence = "high" | "medium" | "low";
export type ReviewStatus = "pending" | "verified" | "disputed" | "rejected";
export type Suitability = "excellent" | "good" | "possible" | "low" | "unknown";
export type CurrentLevel = "none" | "mild" | "moderate" | "strong" | "variable";
export type AccessType = "shore" | "boat" | "liveaboard";
export type DiveTypeTag =
  | "reef"
  | "wreck"
  | "wall"
  | "drift"
  | "muck"
  | "pelagic"
  | "shore"
  | "boat"
  | "liveaboard"
  | "resort"
  | "macro"
  | "photo_friendly";

export interface Country {
  id: UUID;
  name: string;
  iso_code: string | null;
  continent: string | null;
}

export interface Region {
  id: UUID;
  country_id: UUID | null;
  name: string;
}

export interface Destination {
  id: UUID;
  slug: string;
  name: string;
  country_id: UUID | null;
  region_id: UUID | null;
  latitude: number | null;
  longitude: number | null;
  summary: string | null;
  hero_image_url: string | null;
  dive_type_tags: DiveTypeTag[];
  demo_data: boolean;
  status: "draft" | "published";
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface DiveSite {
  id: UUID;
  slug: string;
  destination_id: UUID;
  name: string;
  latitude: number | null;
  longitude: number | null;
  access_type: AccessType | null;
  site_type: DiveTypeTag[];
  min_depth_m: number | null;
  max_depth_m: number | null;
  typical_current: CurrentLevel | null;
  typical_visibility_m_min: number | null;
  typical_visibility_m_max: number | null;
  recommended_level: string | null;
  hazards: string[] | null;
  demo_data: boolean;
  status: "draft" | "published";
}

export type SpeciesCategory = "shark" | "ray" | "mammal" | "turtle" | "fish" | "other";

export interface MarineSpecies {
  id: UUID;
  slug: string;
  common_name: string;
  scientific_name: string;
  category: SpeciesCategory | null;
  notes: string | null;
  image_url: string | null;
}

export interface SpeciesSeasonality {
  id: UUID;
  destination_id: UUID | null;
  site_id: UUID | null;
  species_id: UUID;
  month: number; // 1-12
  suitability: Suitability;
  source_id: UUID | null;
  demo_data: boolean;
}

export interface EnvironmentalSeasonality {
  id: UUID;
  destination_id: UUID | null;
  site_id: UUID | null;
  month: number;
  water_temp_c_min: number | null;
  water_temp_c_max: number | null;
  visibility_m_min: number | null;
  visibility_m_max: number | null;
  typical_conditions: string | null;
  source_id: UUID | null;
  demo_data: boolean;
}

export interface CertificationAgency {
  id: UUID;
  name: string;
  website: string | null;
}

export interface Certification {
  id: UUID;
  agency_id: UUID;
  name: string;
  level_rank: number | null;
  min_age: number | null;
  notes: string | null;
}

export interface DiveCenter {
  id: UUID;
  destination_id: UUID;
  name: string;
  center_type: string[];
  website: string | null;
  demo_data: boolean;
}

export interface Liveaboard {
  id: UUID;
  destination_id: UUID | null;
  region_id: UUID | null;
  name: string;
  operator_name: string | null;
  itinerary_notes: string | null;
  demo_data: boolean;
}

export type PriceType =
  | "single_dive"
  | "package"
  | "day_boat"
  | "resort"
  | "liveaboard"
  | "rental"
  | "nitrox"
  | "transfer"
  | "tax";

export interface Price {
  id: UUID;
  entity_type: "destination" | "dive_center" | "liveaboard";
  entity_id: UUID;
  price_type: PriceType;
  amount_min: number | null;
  amount_max: number | null;
  currency: string;
  inclusions: string[];
  exclusions: string[];
  provider: string | null;
  source_id: UUID | null;
  observed_at: ISODateString | null;
  expires_at: ISODateString | null;
  demo_data: boolean;
}

export interface DataSource {
  id: UUID;
  name: string;
  source_type:
    | "official_operator"
    | "tourism_board"
    | "scientific"
    | "editorial"
    | "community"
    | "government"
    | "demo"
    | "other";
  url: string | null;
  reliability: Confidence;
  notes: string | null;
}

export interface DataClaim {
  id: UUID;
  entity_type: string;
  entity_id: UUID;
  field_name: string;
  value_json: unknown;
  unit: string | null;
  source_id: UUID | null;
  source_type: string | null;
  observed_at: ISODateString | null;
  verified_at: ISODateString | null;
  valid_from: ISODateString | null;
  valid_to: ISODateString | null;
  expires_at: ISODateString | null;
  confidence: Confidence;
  review_status: ReviewStatus;
  reviewer_notes: string | null;
  superseded_by: UUID | null;
  demo_data: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface DataRefreshJob {
  id: UUID;
  job_name: string;
  entity_type: string | null;
  field_name: string | null;
  ttl_category:
    | "prices"
    | "operator_status"
    | "taxes_rules"
    | "seasonal_editorial"
    | "climate_normals"
    | "site_stable"
    | "recent_sighting"
    | null;
  last_run_at: ISODateString | null;
  next_due_at: ISODateString | null;
  status: "idle" | "running" | "success" | "error";
  last_error: string | null;
}

export interface AdminReviewQueueItem {
  id: UUID;
  entity_type: string;
  entity_id: UUID;
  claim_id: UUID | null;
  reason: "expired" | "disputed" | "missing_field" | "new_submission" | "flagged";
  status: "open" | "in_progress" | "resolved" | "dismissed";
  assigned_to: UUID | null;
  notes: string | null;
  created_at: ISODateString;
}

export interface Profile {
  id: UUID;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  home_base: string | null;
  role: "user" | "admin";
  created_at: ISODateString;
}

export type NumberOfDivesBucket = "0-9" | "10-24" | "25-49" | "50-99" | "100-249" | "250+";
export type CurrentExperience = "none" | "some" | "comfortable" | "expert";

export interface DiverProfile {
  id: UUID;
  user_id: UUID;
  certification_agency_id: UUID | null;
  certification_id: UUID | null;
  number_of_dives_bucket: NumberOfDivesBucket | null;
  training_max_depth_m: number | null;
  nitrox_certified: boolean;
  current_experience: CurrentExperience | null;
  drift_experience: boolean;
  wreck_experience: boolean;
  night_experience: boolean;
  dry_suit_experience: boolean;
  cave_experience_declared: boolean;
  species_preferences: UUID[];
  preferred_water_temp_min_c: number | null;
  preferred_water_temp_max_c: number | null;
  preferred_dive_types: DiveTypeTag[];
  // Qualitative categories only — never raw measurements or coordinates.
  // Saved only if the user opts in from the Mask Finder. See
  // docs/gear-mask-finder.md.
  mask_face_width: FaceWidthCategory | null;
  mask_nose_bridge: NoseBridgeCategory | null;
  mask_face_shape: FaceShapeCategory | null;
  mask_fit_concerns: MaskFitConcern[];
}

export interface Favorite {
  id: UUID;
  user_id: UUID;
  entity_type: "destination" | "site";
  entity_id: UUID;
  list_id: UUID | null;
  created_at: ISODateString;
}

export interface SavedList {
  id: UUID;
  user_id: UUID;
  name: string;
  created_at: ISODateString;
}

export interface UserSpeciesSeen {
  id: UUID;
  user_id: UUID;
  species_id: UUID;
  seen_on: ISODateString | null;
  note: string | null;
  created_at: ISODateString;
}

// ── Badges ──────────────────────────────────────────────────────────────
// Computed deterministically from profile data — never stored, never
// awarded by an opaque process. See src/lib/profile/badges.ts.
export interface EarnedBadge {
  id: string;
  label: string;
  description: string;
}

export type GasType = "air" | "nitrox" | "other";

export interface DiveLogEntry {
  id: UUID;
  user_id: UUID;
  dive_date: ISODateString;
  site_id: UUID | null;
  site_name: string | null;
  destination_id: UUID | null;
  duration_minutes: number | null;
  max_depth_m: number | null;
  avg_depth_m: number | null;
  water_temp_c: number | null;
  visibility_bucket: string | null;
  current_bucket: CurrentLevel | null;
  buddy_name: string | null;
  gas_type: GasType | null;
  nitrox_percentage: number | null;
  species_observed: UUID[];
  rating: number | null;
  notes: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface Review {
  id: UUID;
  user_id: UUID | null;
  entity_type: "destination" | "site" | "dive_center" | "liveaboard";
  entity_id: UUID;
  rating: number | null;
  dive_date: ISODateString | null;
  visibility_bucket: string | null;
  current_bucket: CurrentLevel | null;
  water_temp_c: number | null;
  species_observed: UUID[];
  operator_name: string | null;
  note: string | null;
  status: "pending" | "published" | "rejected";
  created_at: ISODateString;
}

// ── Search / scoring domain ────────────────────────────────────────────

export interface SearchCriteria {
  months?: number[]; // 1-12, multi-select
  dateMode?: "exact" | "flexible";
  startDate?: ISODateString;
  endDate?: ISODateString;
  durationDays?: number;
  budgetTotal?: number;
  currency?: string;
  departureLocation?: string;
  certificationAgencyId?: UUID;
  certificationId?: UUID;
  numberOfDivesBucket?: NumberOfDivesBucket;
  currentExperience?: CurrentExperience;
  nitroxCertified?: boolean;
  speciesIds?: UUID[];
  preferredWaterTempMinC?: number;
  preferredWaterTempMaxC?: number;
  acceptedCurrent?: CurrentLevel[];
  diveTypes?: DiveTypeTag[];
  macroOrPelagic?: "macro" | "pelagic" | "either";
  photoFriendly?: boolean;
  caveDeclared?: boolean;
}

export interface ScoreBreakdown {
  seasonality: number | null;
  wildlifeMatch: number | null;
  budgetFit: number | null;
  levelFit: number | null;
  conditionsFit: number | null;
  diveTypeFit: number | null;
  accessibility: number | null;
  qualityReviews: number | null;
}

export interface ScoredDestination {
  destination: Destination;
  matchScore: number; // 0-100, computed only from known dimensions
  dataCompletenessPct: number; // 0-100, % of scoring dimensions with data
  breakdown: ScoreBreakdown;
  reasons: string[]; // "Why it matches"
  tradeOffs: string[];
  unknowns: string[]; // dimensions with no data, shown explicitly
  hardFilterWarnings: string[]; // non-blocking safety notes ("check operator requirements")
  dataConfidence: Confidence;
  lastUpdated: ISODateString | null;
}

// ── Gear / Mask Finder domain ───────────────────────────────────────────
// See docs/gear-mask-finder.md. All face-derived values are qualitative
// categories only, computed entirely on-device — never coordinates, never
// an image, never sent to or stored on a server unless the user explicitly
// opts to save the category labels to their diver profile.

export type FaceWidthCategory = "narrow" | "medium" | "wide";
export type NoseBridgeCategory = "narrow" | "medium" | "wide";
export type FaceShapeCategory = "long" | "oval" | "round";
export type MaskLensType = "single" | "dual" | "frameless";
export type MaskVolumeCategory = "low" | "medium" | "high";
export type MaskFitConcern =
  | "leaks"
  | "fogs"
  | "nose_pain"
  | "too_tight"
  | "too_loose"
  | "facial_hair"
  | "hard_to_equalize";

export interface FaceProfile {
  faceWidth: FaceWidthCategory;
  noseBridge: NoseBridgeCategory;
  faceShape: FaceShapeCategory;
}

export interface Mask {
  id: UUID;
  slug: string;
  name: string;
  brand: string;
  lens_type: MaskLensType;
  volume_category: MaskVolumeCategory;
  fit_face_width: FaceWidthCategory[];
  fit_nose_bridge: NoseBridgeCategory[];
  notes: string | null;
  image_url: string | null;
  demo_data: boolean;
  status: "draft" | "published";
}

export interface MaskMatch {
  mask: Mask;
  suitability: Suitability;
  reasons: string[];
}
