import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Explore",
  description: "Browse DiveFinder's catalog — destinations, sites, wildlife, the map, and comparisons.",
};

const CARDS = [
  {
    href: "/destinations",
    title: "Destinations",
    description: "Every published destination in the catalog, browsable directly.",
    icon: DestinationIcon,
  },
  {
    href: "/sites",
    title: "Dive sites",
    description: "Every published spot, filtered by destination or access type.",
    icon: SiteIcon,
  },
  {
    href: "/map",
    title: "Map",
    description: "See destinations laid out geographically.",
    icon: MapIcon,
  },
  {
    href: "/wildlife",
    title: "Wildlife",
    description: "Browse species, check seasonality, and track your own life list.",
    icon: FishIcon,
  },
  {
    href: "/compare",
    title: "Compare",
    description: "Put a few destinations side by side.",
    icon: CompareIcon,
  },
  {
    href: "/gear/mask-finder",
    title: "Mask Finder",
    description: "An on-device face scan to find a mask shape that suits you.",
    icon: MaskIcon,
  },
] as const;

export default function ExplorePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-3xl text-abyss-900">Explore</h1>
      <p className="mt-2 text-abyss-500">Every way to browse DiveFinder&apos;s catalog, in one place.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {CARDS.map(({ href, title, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="focus-ring flex items-start gap-4 rounded-xl2 border border-abyss-100 bg-white p-5 shadow-card transition-transform hover:-translate-y-0.5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ocean-50 text-ocean-600">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg text-abyss-900">{title}</h2>
              <p className="mt-1 text-sm text-abyss-500">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}

function DestinationIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M12 21s-7-6.5-7-11.5A7 7 0 0119 9.5C19 14.5 12 21 12 21Z" />
      <circle cx={12} cy={9.5} r={2.5} />
    </svg>
  );
}
function SiteIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2-6-2z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  );
}
function MapIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <circle cx={12} cy={12} r={9} />
      <path d="M3 12h18M12 3c2.5 2.5 4 5.6 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.6-4-9s1.5-6.5 4-9Z" />
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
function CompareIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M8 3v18M16 3v18M4 8h4M16 8h4M4 16h4M16 16h4" />
    </svg>
  );
}
function MaskIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <circle cx={7.5} cy={12} r={4} />
      <circle cx={16.5} cy={12} r={4} />
      <path d="M11.2 12h1.6" />
      <path d="M3.5 12v2.5a2 2 0 002 2H6" />
    </svg>
  );
}
