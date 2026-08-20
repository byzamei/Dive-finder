"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getCheapestPricePerDestination, type DestinationStartingPrice } from "@/lib/services/operatorService";
import { formatDestinationPrice } from "@/components/results/FilteredExplorer";

interface InspirationDestination {
  id: string;
  slug: string;
  name: string;
  country: string | null;
  demo_data: boolean;
}

// Booking.com-style inspiration rail under Search's first question — real
// destinations and real prices where we have them (never fabricated), but
// no photography: DiveFinder has no licensed destination or wildlife
// photos yet, so a gradient + icon stands in rather than a stock photo
// pretending to be a real place. Swap ICONS for real photo URLs once the
// catalog has licensed images (see docs/data-governance.md — images would
// need the same sourcing discipline as any other claim).
const ICONS = [WaveIcon, FishIcon, TurtleIcon, ShellIcon];

export function SearchInspiration() {
  const [destinations, setDestinations] = useState<InspirationDestination[] | null>(null);
  const [prices, setPrices] = useState<Map<string, DestinationStartingPrice>>(new Map());

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data } = await supabase
        .from("destinations")
        .select("id, slug, name, demo_data, countries(name)")
        .eq("status", "published")
        .order("name");
      const rows = ((data ?? []) as unknown as { id: string; slug: string; name: string; demo_data: boolean; countries: { name: string } | null }[]).map(
        (d) => ({ id: d.id, slug: d.slug, name: d.name, country: d.countries?.name ?? null, demo_data: d.demo_data })
      );
      setDestinations(rows);
      setPrices(await getCheapestPricePerDestination(supabase, rows.map((d) => d.id)));
    }
    load();
  }, []);

  if (destinations === null) return null;

  const withPrice = destinations.filter((d) => prices.has(d.id)).slice(0, 6);
  const exploreByCountry = destinations.filter((d) => d.country).slice(0, 8);

  if (withPrice.length === 0 && exploreByCountry.length === 0) return null;

  return (
    <div className="mt-8 border-t border-abyss-100 pt-6">
      {withPrice.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-abyss-400">Idées de dernière minute</p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {withPrice.map((d, i) => (
              <InspirationCard key={d.id} destination={d} priceLabel={formatDestinationPrice(prices.get(d.id)!)} icon={ICONS[i % ICONS.length]!} />
            ))}
          </div>
        </div>
      )}

      {exploreByCountry.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-abyss-400">Explorez un pays en particulier</p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {exploreByCountry.map((d, i) => (
              <InspirationCard key={d.id} destination={d} icon={ICONS[i % ICONS.length]!} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InspirationCard({
  destination,
  priceLabel,
  icon: Icon,
}: {
  destination: InspirationDestination;
  priceLabel?: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement;
}) {
  return (
    <Link
      href={`/destinations/${destination.slug}`}
      className="focus-ring block w-40 shrink-0 overflow-hidden rounded-xl2 border border-abyss-100 bg-white shadow-card transition-transform hover:-translate-y-0.5"
    >
      <div className="flex h-24 items-center justify-center bg-gradient-to-br from-ocean-600 to-seaglass-500 text-white/90">
        <Icon className="h-9 w-9" />
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-medium text-abyss-900">{destination.name}</p>
        {destination.country && <p className="truncate text-xs text-abyss-500">{destination.country}</p>}
        {priceLabel && <p className="mt-1 text-sm font-semibold text-ocean-700">{priceLabel}</p>}
      </div>
    </Link>
  );
}

function WaveIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path d="M2 17c1.5-2 3.5-2 5 0s3.5 2 5 0 3.5-2 5 0 3.5 2 5 0" />
      <path d="M2 12c1.5-2 3.5-2 5 0s3.5 2 5 0 3.5-2 5 0 3.5 2 5 0" />
    </svg>
  );
}
function FishIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path d="M3 12c3-4 8-6 13-4 2 .8 3.5 2.2 5 4-1.5 1.8-3 3.2-5 4-5 2-10 0-13-4Z" />
      <path d="M17 9.5v5" />
      <circle cx={7.5} cy={11.5} r={0.6} fill="currentColor" />
    </svg>
  );
}
function TurtleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <ellipse cx={12} cy={13} rx={7} ry={5} />
      <path d="M5 11l-3-1M19 11l3-1M8 18l-2 3M16 18l2 3M9 8l-1.5-3M15 8l1.5-3" />
    </svg>
  );
}
function ShellIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path d="M12 3c5 0 9 4.5 9 10 0 3.5-2 7-9 7s-9-3.5-9-7c0-5.5 4-10 9-10Z" />
      <path d="M12 5v15M8 8v11M16 8v11M5.5 12v6M18.5 12v6" />
    </svg>
  );
}
