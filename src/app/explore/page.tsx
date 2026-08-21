"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Destination } from "@/lib/types/domain";
import { toPins, type MapPin } from "@/lib/services/mapService";
import { encodeCriteria } from "@/lib/utils/searchParams";
import { MONTHS } from "@/components/discover/wizardOptions";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/badges/Badge";
import { DemoDataBadge } from "@/components/badges/DataBadges";
import { ButtonLink } from "@/components/ui/Button";
import { MapView } from "@/components/map/MapView";
import { cn } from "@/lib/utils/cn";
import { fetchPhoto, type CardPhoto } from "@/lib/utils/clientPhoto";

// A catalog, not a form: three big entry points mirror how people actually
// think about a trip (where / what animal / when) — the same three angles
// that used to gate the Search wizard's first screen, now offered as
// optional ways in rather than a mandatory choice. A destination and a
// dive site are deliberately not the same card here — a destination can
// have many sites, so "Dive sites" is its own distinctly-styled entry
// (not a fourth peer tile), and each destination card shows its site
// count to keep that hierarchy visible.
interface DestinationRow extends Destination {
  countries: { name: string; continent: string | null } | null;
}

// Continents in the order LiveAboard.com's own destination directory uses
// them — matches how divers scan a region list, not alphabetical.
const CONTINENT_ORDER = ["Asia", "Europe", "Africa & Middle East", "Americas", "Pacific"];
const OTHER_CONTINENT = "Other";

function groupByContinentAndCountry(destinations: DestinationRow[]) {
  const byContinent = new Map<string, Map<string, DestinationRow[]>>();
  for (const d of destinations) {
    const continent = d.countries?.continent ?? OTHER_CONTINENT;
    const country = d.countries?.name ?? "Unknown";
    if (!byContinent.has(continent)) byContinent.set(continent, new Map());
    const byCountry = byContinent.get(continent)!;
    if (!byCountry.has(country)) byCountry.set(country, []);
    byCountry.get(country)!.push(d);
  }
  const continents = [...byContinent.keys()].sort((a, b) => {
    const ai = CONTINENT_ORDER.indexOf(a);
    const bi = CONTINENT_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  return continents.map((continent) => ({
    continent,
    countries: [...byContinent.get(continent)!.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([country, dests]) => ({ country, destinations: dests })),
  }));
}

export default function ExplorePage() {
  const [destinations, setDestinations] = useState<DestinationRow[] | null>(null);
  const [siteCounts, setSiteCounts] = useState<Map<string, number>>(new Map());
  const [photos, setPhotos] = useState<Map<string, CardPhoto>>(new Map());
  const [view, setView] = useState<"list" | "map">("list");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [seasonOpen, setSeasonOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("destinations")
      .select("*, countries(name, continent)")
      .eq("status", "published")
      .order("name")
      .then(async ({ data }) => {
        const rows = (data ?? []) as unknown as DestinationRow[];
        setDestinations(rows);
        const fetched = await Promise.all(
          rows.filter((d) => !d.demo_data).map((d) => fetchPhoto(`${d.name} scuba diving`))
        );
        const photoMap = new Map<string, CardPhoto>();
        rows.filter((d) => !d.demo_data).forEach((d, i) => {
          const photo = fetched[i];
          if (photo) photoMap.set(d.id, photo);
        });
        setPhotos(photoMap);
      });
    supabase
      .from("dive_sites")
      .select("destination_id")
      .eq("status", "published")
      .then(({ data }) => {
        const counts = new Map<string, number>();
        ((data ?? []) as { destination_id: string }[]).forEach((row) => {
          counts.set(row.destination_id, (counts.get(row.destination_id) ?? 0) + 1);
        });
        setSiteCounts(counts);
      });
  }, []);

  function toggleCompare(id: string) {
    setCompareIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : ids.length < 4 ? [...ids, id] : ids));
  }

  const pins: MapPin[] = useMemo(() => (destinations ? toPins(destinations) : []), [destinations]);
  const grouped = useMemo(() => (destinations ? groupByContinentAndCountry(destinations) : []), [destinations]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-3xl text-abyss-900">Explore</h1>
      <p className="mt-2 text-abyss-500">Browse the catalog however makes sense to you.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <CategoryTile
          icon={PinIcon}
          title="Destinations"
          description="By country or region"
          href="#destinations"
        />
        <CategoryTile icon={FishIcon} title="Animals" description="Find where to see a species" href="/wildlife" />
        <CategoryTile
          icon={CalendarIcon}
          title="Season"
          description="Best months to go"
          onClick={() => setSeasonOpen((v) => !v)}
        />
      </div>

      {seasonOpen && (
        <div className="mt-3 rounded-xl2 border border-abyss-100 bg-white p-4 shadow-card">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-abyss-400">Pick a month</p>
          <div className="flex flex-wrap gap-2">
            {MONTHS.map((m, i) => (
              <Link
                key={m}
                href={`/results?c=${encodeCriteria({ months: [i + 1] })}`}
                className="focus-ring rounded-full border border-abyss-200 px-3.5 py-1.5 text-sm text-abyss-700 hover:bg-abyss-50"
              >
                {m}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        <Link href="/sites" className="focus-ring flex items-center justify-between gap-4 rounded-xl2 border border-dashed border-abyss-200 bg-abyss-50/60 p-4 hover:bg-abyss-50">
          <div>
            <p className="text-sm font-medium text-abyss-800">Looking for a specific dive site instead?</p>
            <p className="mt-0.5 text-xs text-abyss-500">
              A destination can have many individual dive sites — browse every spot directly, across every destination.
            </p>
          </div>
          <span aria-hidden className="shrink-0 text-lg text-ocean-600">
            →
          </span>
        </Link>
      </div>

      <div id="destinations" className="mt-10 scroll-mt-20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl text-abyss-900">Destinations</h2>
          <div className="flex rounded-full border border-abyss-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "focus-ring rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                view === "list" ? "bg-abyss-900 text-white" : "text-abyss-600"
              )}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setView("map")}
              className={cn(
                "focus-ring rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                view === "map" ? "bg-abyss-900 text-white" : "text-abyss-600"
              )}
            >
              Map
            </button>
          </div>
        </div>

        {compareIds.length > 0 && (
          <div className="mt-4 flex items-center justify-between rounded-xl2 border border-ocean-200 bg-ocean-50 px-4 py-3">
            <p className="text-sm text-ocean-800">{compareIds.length} selected to compare</p>
            <ButtonLink size="sm" href={`/compare?ids=${compareIds.join(",")}`}>
              Compare
            </ButtonLink>
          </div>
        )}

        <div className="mt-4">
          {destinations === null ? (
            <p className="text-sm text-abyss-400">Loading…</p>
          ) : view === "map" ? (
            <MapView pins={pins} />
          ) : (
            <div className="space-y-8">
              {grouped.map(({ continent, countries }) => (
                <div key={continent}>
                  <h3 className="font-display text-lg text-ocean-700">{continent}</h3>
                  <div className="mt-3 space-y-5">
                    {countries.map(({ country, destinations: dests }) => (
                      <div key={country}>
                        <p className="text-xs font-semibold uppercase tracking-wide text-abyss-400">{country}</p>
                        <div className="mt-2 grid gap-4 sm:grid-cols-2">
                          {dests.map((d) => (
                            <DestinationCard
                              key={d.id}
                              destination={d}
                              siteCount={siteCounts.get(d.id) ?? 0}
                              checked={compareIds.includes(d.id)}
                              compareDisabled={!compareIds.includes(d.id) && compareIds.length >= 4}
                              onToggleCompare={() => toggleCompare(d.id)}
                              photo={photos.get(d.id)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function DestinationCard({
  destination: d,
  siteCount,
  checked,
  compareDisabled,
  onToggleCompare,
  photo,
}: {
  destination: DestinationRow;
  siteCount: number;
  checked: boolean;
  compareDisabled: boolean;
  onToggleCompare: () => void;
  photo?: CardPhoto;
}) {
  return (
    <Card>
      {photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo.url} alt={photo.alt} className="h-32 w-full rounded-t-xl2 object-cover" />
      )}
      <CardBody>
        <Link href={`/destinations/${d.slug}`} className="focus-ring block">
          <div className="flex items-center gap-2">
            <p className="font-display text-lg text-abyss-900">{d.name}</p>
            {d.demo_data && <DemoDataBadge />}
          </div>
          <p className="mt-1 text-xs text-abyss-400">
            {siteCount} dive site{siteCount === 1 ? "" : "s"}
          </p>
          {d.dive_type_tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {d.dive_type_tags.map((t) => (
                <Badge key={t} tone="neutral">
                  {t.replace("_", " ")}
                </Badge>
              ))}
            </div>
          )}
        </Link>
        <label className="focus-ring mt-3 flex w-fit items-center gap-2 text-xs font-medium text-abyss-600">
          <input type="checkbox" checked={checked} disabled={compareDisabled} onChange={onToggleCompare} />
          Compare
        </label>
      </CardBody>
    </Card>
  );
}

function CategoryTile({
  icon: Icon,
  title,
  description,
  href,
  onClick,
}: {
  icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement;
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ocean-50 text-ocean-600">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-display text-lg text-abyss-900">{title}</p>
        <p className="mt-1 text-sm text-abyss-500">{description}</p>
      </div>
    </>
  );
  const className =
    "focus-ring flex items-start gap-3.5 rounded-xl2 border border-abyss-100 bg-white p-5 text-left shadow-card transition-transform hover:-translate-y-0.5";

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cn(className, "w-full")}>
      {inner}
    </button>
  );
}

function PinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M12 21s-7-6.5-7-11.5A7 7 0 0119 9.5C19 14.5 12 21 12 21Z" />
      <circle cx={12} cy={9.5} r={2.5} />
    </svg>
  );
}
function FishIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M3 12c3-4 8-6 13-4 2 .8 3.5 2.2 5 4-1.5 1.8-3 3.2-5 4-5 2-10 0-13-4Z" />
      <path d="M17 9.5v5" />
      <circle cx={7.5} cy={11.5} r={0.5} fill="currentColor" />
    </svg>
  );
}
function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <rect x={3.5} y={5} width={17} height={16} rx={2} />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </svg>
  );
}
