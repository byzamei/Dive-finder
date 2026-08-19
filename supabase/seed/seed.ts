// DiveFinder seed script.
//
// Populates: countries, the 20 real destinations (name/slug/country ONLY —
// no invented dive data), 12 marine species, certification agencies +
// certifications, 3 isolated DEMO destinations with fully fabricated but
// clearly-tagged demo data, and a handful of admin_review_queue /
// data_refresh_jobs rows so the back-office has something to show.
//
// Usage: npm run seed   (reads .env.local via dotenv)
//
// Idempotent: safe to re-run — every insert upserts on its natural unique
// key (slug/name) so re-running never duplicates rows.

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

loadEnv({ path: ".env.local" });
import {
  REAL_COUNTRIES,
  REAL_DESTINATIONS,
  REAL_SPECIES,
  CERTIFICATION_AGENCIES,
  CERTIFICATIONS_BY_AGENCY,
  DEMO_DESTINATIONS,
} from "./data";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Copy .env.example to .env.local, fill in your Supabase project values, then re-run `npm run seed`."
  );
  process.exit(1);
}

const db = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_SOURCE_ID = "00000000-0000-0000-0000-000000000001";

async function upsert<T extends object>(table: string, rows: T[], onConflict: string) {
  if (rows.length === 0) return [] as (T & { id: string })[];
  // Cast to bypass supabase-js's strict per-table row typing — this script
  // runs against a hand-maintained schema without generated Database types.
  const { data, error } = await db
    .from(table)
    .upsert(rows as never, { onConflict })
    .select();
  if (error) {
    throw new Error(`Failed upserting into ${table}: ${error.message}`);
  }
  console.log(`  ✓ ${table}: ${data?.length ?? 0} rows`);
  return data as (T & { id: string })[];
}

async function main() {
  console.log("Seeding DiveFinder…\n");

  console.log("Countries");
  const countries = await upsert("countries", REAL_COUNTRIES, "name");
  const countryIdByName = new Map(countries.map((c) => [c.name as string, c.id as string]));

  console.log("Real destinations (name/slug/country only — no invented dive data)");
  const destinationRows = REAL_DESTINATIONS.map((d) => ({
    slug: d.slug,
    name: d.name,
    country_id: d.countryName ? countryIdByName.get(d.countryName) ?? null : null,
    status: "published" as const,
    demo_data: false,
  }));
  await upsert("destinations", destinationRows, "slug");

  console.log("Marine species");
  await upsert("marine_species", REAL_SPECIES, "slug");

  console.log("Certification agencies");
  const agencies = await upsert("certification_agencies", CERTIFICATION_AGENCIES, "name");
  const agencyIdByName = new Map(agencies.map((a) => [a.name as string, a.id as string]));

  console.log("Certifications");
  const certRows = Object.entries(CERTIFICATIONS_BY_AGENCY).flatMap(([agencyName, certs]) =>
    certs.map((c) => ({
      agency_id: agencyIdByName.get(agencyName),
      name: c.name,
      level_rank: c.level_rank,
    }))
  );
  await upsert("certifications", certRows, "agency_id,name");

  console.log("\nDEMO destinations (fully fabricated, demo_data=true, isolated from real data)");
  const demoDestRows = DEMO_DESTINATIONS.map((d) => ({
    slug: d.slug,
    name: d.name,
    summary: d.summary,
    latitude: d.latitude,
    longitude: d.longitude,
    hero_image_url: d.hero_image_url,
    dive_type_tags: d.dive_type_tags,
    status: "published" as const,
    demo_data: true,
  }));
  const demoDests = await upsert("destinations", demoDestRows, "slug");
  const demoDestIdBySlug = new Map(demoDests.map((d) => [d.slug as string, d.id as string]));

  console.log("DEMO dive sites (one per demo destination)");
  const demoSiteRows = [
    {
      slug: "demo-island-a-north-wall",
      destination_id: demoDestIdBySlug.get("demo-island-a"),
      name: "North Wall (Demo)",
      latitude: 4.185,
      longitude: 73.515,
      access_type: "boat" as const,
      site_type: ["wall", "pelagic"],
      min_depth_m: 5,
      max_depth_m: 40,
      typical_current: "moderate" as const,
      typical_visibility_m_min: 15,
      typical_visibility_m_max: 30,
      recommended_level: "Advanced Open Water (demo)",
      hazards: ["Strong current possible (demo)"] as string[],
      status: "published" as const,
      demo_data: true,
    },
    {
      slug: "demo-island-b-muck-flats",
      destination_id: demoDestIdBySlug.get("demo-island-b"),
      name: "Muck Flats (Demo)",
      latitude: -8.675,
      longitude: 115.22,
      access_type: "shore" as const,
      site_type: ["muck", "macro"],
      min_depth_m: 3,
      max_depth_m: 18,
      typical_current: "mild" as const,
      typical_visibility_m_min: 8,
      typical_visibility_m_max: 15,
      recommended_level: "Open Water (demo)",
      hazards: [] as string[],
      status: "published" as const,
      demo_data: true,
    },
    {
      slug: "demo-island-c-wreck-point",
      destination_id: demoDestIdBySlug.get("demo-island-c"),
      name: "Wreck Point (Demo)",
      latitude: 27.26,
      longitude: 33.82,
      access_type: "boat" as const,
      site_type: ["wreck", "wall"],
      min_depth_m: 12,
      max_depth_m: 35,
      typical_current: "variable" as const,
      typical_visibility_m_min: 10,
      typical_visibility_m_max: 25,
      recommended_level: "Advanced Open Water (demo)",
      hazards: ["Penetration requires wreck specialty (demo)"] as string[],
      status: "published" as const,
      demo_data: true,
    },
  ];
  const demoSites = await upsert("dive_sites", demoSiteRows, "slug");

  console.log("DEMO environmental + species seasonality (a few months only, clearly demo)");
  const { data: species } = await db.from("marine_species").select("id, slug");
  const speciesIdBySlug = new Map((species ?? []).map((s) => [s.slug as string, s.id as string]));

  const demoIslandA = demoDestIdBySlug.get("demo-island-a");
  const envSeasonRows = [1, 2, 3, 4].map((month) => ({
    destination_id: demoIslandA,
    month,
    water_temp_c_min: 26,
    water_temp_c_max: 29,
    visibility_m_min: 15,
    visibility_m_max: 30,
    typical_conditions: "Calm mornings, moderate afternoon current (demo)",
    source_id: DEMO_SOURCE_ID,
    demo_data: true,
  }));
  // No natural unique key beyond id, so re-seeding deletes prior demo rows
  // for this destination first, then inserts fresh ones (idempotent).
  if (demoIslandA) {
    await db.from("environmental_seasonality").delete().eq("destination_id", demoIslandA).eq("demo_data", true);
    await db.from("environmental_seasonality").insert(envSeasonRows);
  }

  const whaleSharkId = speciesIdBySlug.get("whale-shark");
  const mantaId = speciesIdBySlug.get("oceanic-manta-ray");
  if (demoIslandA && whaleSharkId && mantaId) {
    await db.from("species_seasonality").delete().eq("destination_id", demoIslandA).eq("demo_data", true);
    await db.from("species_seasonality").insert(
      [1, 2, 3].flatMap((month) => [
        {
          destination_id: demoIslandA,
          species_id: whaleSharkId,
          month,
          suitability: "good" as const,
          source_id: DEMO_SOURCE_ID,
          demo_data: true,
        },
        {
          destination_id: demoIslandA,
          species_id: mantaId,
          month,
          suitability: "excellent" as const,
          source_id: DEMO_SOURCE_ID,
          demo_data: true,
        },
      ])
    );
    await db
      .from("destination_species")
      .upsert(
        [
          { destination_id: demoIslandA, species_id: whaleSharkId, demo_data: true },
          { destination_id: demoIslandA, species_id: mantaId, demo_data: true },
        ],
        { onConflict: "destination_id,species_id" }
      );
  }

  console.log("DEMO prices");
  if (demoIslandA) {
    await db.from("prices").delete().eq("entity_id", demoIslandA).eq("demo_data", true);
    await db.from("prices").insert([
      {
        entity_type: "destination",
        entity_id: demoIslandA,
        price_type: "package",
        amount_min: 1200,
        amount_max: 1800,
        currency: "EUR",
        inclusions: ["6 nights accommodation (demo)", "10 boat dives (demo)"],
        exclusions: ["Flights", "Nitrox"],
        provider: "Demo Dive Resort",
        source_id: DEMO_SOURCE_ID,
        observed_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
        demo_data: true,
      },
    ]);
  }

  console.log("DEMO data claims (illustrate provenance UI + an intentionally EXPIRED price claim)");
  if (demoIslandA) {
    await db.from("data_claims").delete().eq("entity_id", demoIslandA).eq("demo_data", true);
    await db.from("data_claims").insert([
      {
        entity_type: "destination",
        entity_id: demoIslandA,
        field_name: "recommended_level",
        value_json: "Advanced Open Water (demo)",
        source_id: DEMO_SOURCE_ID,
        source_type: "demo",
        observed_at: new Date().toISOString(),
        verified_at: new Date().toISOString(),
        confidence: "low",
        review_status: "verified",
        demo_data: true,
      },
      {
        // Intentionally expired — demonstrates T003 (never shown as "current").
        entity_type: "destination",
        entity_id: demoIslandA,
        field_name: "amount_min",
        value_json: 900,
        unit: "EUR",
        source_id: DEMO_SOURCE_ID,
        source_type: "demo",
        observed_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 200).toISOString(),
        expires_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
        confidence: "low",
        review_status: "verified",
        demo_data: true,
      },
    ]);
  }

  console.log("\nAdmin review queue + refresh job samples");
  const { data: dests } = await db.from("destinations").select("id, name, demo_data").limit(3);
  const firstReal = (dests ?? []).find((d) => !d.demo_data);
  if (firstReal) {
    await db.from("admin_review_queue").insert([
      {
        entity_type: "destination",
        entity_id: firstReal.id,
        reason: "missing_field",
        status: "open",
        notes: `${firstReal.name} has no verified critical fields yet — needs sourced data.`,
      },
    ]);
  }
  await db.from("data_refresh_jobs").upsert(
    [
      { job_name: "refresh-prices", ttl_category: "prices", status: "idle" },
      { job_name: "refresh-seasonal-editorial", ttl_category: "seasonal_editorial", status: "idle" },
      { job_name: "refresh-climate-normals", ttl_category: "climate_normals", status: "idle" },
    ],
    { onConflict: "job_name" }
  );

  console.log("\nDone. 20 real destinations (data-empty by design), 12 species, certification");
  console.log("reference data, and 3 isolated Demo Island destinations are now seeded.");
  console.log("Next: use /admin to add sourced DataClaims for real destinations.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
