import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Gear",
  description: "Tools to help you pick the right dive gear.",
};

const CARDS = [
  {
    href: "/gear/mask-finder",
    title: "Mask Finder",
    description: "An on-device face scan to find a mask shape that suits you.",
    icon: MaskIcon,
  },
] as const;

export default function GearPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-display text-3xl text-abyss-900">Gear</h1>
      <p className="mt-2 text-abyss-500">Tools to help you pick the right dive gear.</p>

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
