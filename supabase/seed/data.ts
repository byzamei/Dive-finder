// Seed data definitions for DiveFinder V1.
//
// STRICT RULE (see docs/data-governance.md): everything in `REAL_DESTINATIONS`
// carries ONLY a name, slug and (where unambiguous) a country — no depth,
// temperature, visibility, price, season, or wildlife-probability claim is
// invented. Every other field is left null/absent so the UI shows an
// honest "no verified data yet" state. All fabricated, illustrative content
// lives under `DEMO_DESTINATIONS` and is tagged demo_data = true end to end.

export interface SeedDestination {
  slug: string;
  name: string;
  countryName?: string;
}

// Real-world destination shortlist for V1 (per product brief). Country is
// included only when it is an unambiguous, single-country location — basic
// geography, not a dive-condition claim.
export const REAL_DESTINATIONS: SeedDestination[] = [
  { slug: "maldives", name: "Maldives", countryName: "Maldives" },
  { slug: "raja-ampat", name: "Raja Ampat", countryName: "Indonesia" },
  { slug: "komodo", name: "Komodo", countryName: "Indonesia" },
  { slug: "malapascua", name: "Malapascua", countryName: "Philippines" },
  { slug: "galapagos", name: "Galápagos", countryName: "Ecuador" },
  { slug: "red-sea-egypt", name: "Red Sea — Egypt", countryName: "Egypt" },
  { slug: "socorro", name: "Socorro", countryName: "Mexico" },
  { slug: "cozumel", name: "Cozumel", countryName: "Mexico" },
  { slug: "bonaire", name: "Bonaire", countryName: "Bonaire" },
  { slug: "sipadan", name: "Sipadan", countryName: "Malaysia" },
  { slug: "palau", name: "Palau", countryName: "Palau" },
  { slug: "fiji", name: "Fiji", countryName: "Fiji" },
  { slug: "great-barrier-reef", name: "Great Barrier Reef", countryName: "Australia" },
  { slug: "mozambique", name: "Mozambique", countryName: "Mozambique" },
  { slug: "south-africa-aliwal-sodwana", name: "South Africa — Aliwal/Sodwana", countryName: "South Africa" },
  { slug: "azores", name: "Azores", countryName: "Portugal" },
  { slug: "madeira", name: "Madeira", countryName: "Portugal" },
  { slug: "french-polynesia", name: "French Polynesia", countryName: "French Polynesia" },
  { slug: "bali-nusa-penida", name: "Bali / Nusa Penida", countryName: "Indonesia" },
  { slug: "coron", name: "Coron", countryName: "Philippines" },
];

export const REAL_COUNTRIES: { name: string; iso_code?: string }[] = [
  { name: "Maldives", iso_code: "MV" },
  { name: "Indonesia", iso_code: "ID" },
  { name: "Philippines", iso_code: "PH" },
  { name: "Ecuador", iso_code: "EC" },
  { name: "Egypt", iso_code: "EG" },
  { name: "Mexico", iso_code: "MX" },
  { name: "Bonaire", iso_code: "BQ" },
  { name: "Malaysia", iso_code: "MY" },
  { name: "Palau", iso_code: "PW" },
  { name: "Fiji", iso_code: "FJ" },
  { name: "Australia", iso_code: "AU" },
  { name: "Mozambique", iso_code: "MZ" },
  { name: "South Africa", iso_code: "ZA" },
  { name: "Portugal", iso_code: "PT" },
  { name: "French Polynesia", iso_code: "PF" },
];

export interface SeedSpecies {
  slug: string;
  common_name: string;
  scientific_name: string;
  category: "shark" | "ray" | "mammal" | "turtle" | "fish" | "other";
}

export const REAL_SPECIES: SeedSpecies[] = [
  { slug: "whale-shark", common_name: "Whale shark", scientific_name: "Rhincodon typus", category: "shark" },
  { slug: "oceanic-manta-ray", common_name: "Oceanic manta ray", scientific_name: "Mobula birostris", category: "ray" },
  { slug: "reef-manta-ray", common_name: "Reef manta ray", scientific_name: "Mobula alfredi", category: "ray" },
  { slug: "thresher-shark", common_name: "Thresher shark", scientific_name: "Alopias spp.", category: "shark" },
  { slug: "scalloped-hammerhead", common_name: "Scalloped hammerhead", scientific_name: "Sphyrna lewini", category: "shark" },
  { slug: "tiger-shark", common_name: "Tiger shark", scientific_name: "Galeocerdo cuvier", category: "shark" },
  { slug: "bull-shark", common_name: "Bull shark", scientific_name: "Carcharhinus leucas", category: "shark" },
  { slug: "oceanic-whitetip", common_name: "Oceanic whitetip", scientific_name: "Carcharhinus longimanus", category: "shark" },
  { slug: "mola-mola", common_name: "Mola mola", scientific_name: "Mola mola", category: "fish" },
  { slug: "dugong", common_name: "Dugong", scientific_name: "Dugong dugon", category: "mammal" },
  { slug: "humpback-whale", common_name: "Humpback whale", scientific_name: "Megaptera novaeangliae", category: "mammal" },
  { slug: "sea-turtle", common_name: "Sea turtle", scientific_name: "Chelonioidea", category: "turtle" },
];

export const CERTIFICATION_AGENCIES = [
  { name: "PADI", website: "https://www.padi.com" },
  { name: "SSI", website: "https://www.divessi.com" },
  { name: "NAUI", website: "https://www.naui.org" },
  { name: "CMAS", website: "https://www.cmas.org" },
  { name: "BSAC", website: "https://www.bsac.com" },
  { name: "RAID", website: "https://www.diveraid.com" },
];

// level_rank is an internal sort order WITHIN a single agency only. It must
// never be used to compare prerogatives across agencies.
export const CERTIFICATIONS_BY_AGENCY: Record<string, { name: string; level_rank: number }[]> = {
  PADI: [
    { name: "Open Water Diver", level_rank: 1 },
    { name: "Advanced Open Water Diver", level_rank: 2 },
    { name: "Rescue Diver", level_rank: 3 },
    { name: "Divemaster", level_rank: 4 },
  ],
  SSI: [
    { name: "Open Water Diver", level_rank: 1 },
    { name: "Advanced Adventurer", level_rank: 2 },
    { name: "Dive Guide", level_rank: 3 },
  ],
  NAUI: [
    { name: "Scuba Diver", level_rank: 1 },
    { name: "Advanced Scuba Diver", level_rank: 2 },
  ],
  CMAS: [
    { name: "One Star Diver (P1)", level_rank: 1 },
    { name: "Two Star Diver (P2)", level_rank: 2 },
    { name: "Three Star Diver (P3)", level_rank: 3 },
  ],
  BSAC: [
    { name: "Ocean Diver", level_rank: 1 },
    { name: "Sports Diver", level_rank: 2 },
    { name: "Dive Leader", level_rank: 3 },
  ],
  RAID: [
    { name: "Open Water 20", level_rank: 1 },
    { name: "Advanced 35", level_rank: 2 },
  ],
};

// ── DEMO ONLY below this line — clearly synthetic, never mixed with real
// destinations in default search results. ─────────────────────────────────

export const DEMO_DESTINATIONS = [
  {
    slug: "demo-island-a",
    name: "Demo Island A",
    summary:
      "Illustrative placeholder destination used to demonstrate the DiveFinder UI end to end. All figures below are fabricated demo data, not real observations.",
    latitude: 4.1755,
    longitude: 73.5093,
    hero_image_url: null,
    dive_type_tags: ["reef", "pelagic", "boat", "liveaboard"],
  },
  {
    slug: "demo-island-b",
    name: "Demo Island B",
    summary:
      "Illustrative placeholder destination (macro / muck diving profile) used to demonstrate filtering and comparison. All figures are fabricated demo data.",
    latitude: -8.6705,
    longitude: 115.2126,
    hero_image_url: null,
    dive_type_tags: ["muck", "macro", "shore", "photo_friendly"],
  },
  {
    slug: "demo-island-c",
    name: "Demo Island C",
    summary:
      "Illustrative placeholder destination (wreck / wall diving profile) used to demonstrate the compare and map screens. All figures are fabricated demo data.",
    latitude: 27.2579,
    longitude: 33.8116,
    hero_image_url: null,
    dive_type_tags: ["wreck", "wall", "boat"],
  },
];
