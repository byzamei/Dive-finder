"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { LogoMark } from "@/components/LogoMark";

// Grouped by journey stage, not by when each feature was added: search →
// browse the catalog → track trips/dives → save for later → account.
// Destinations/Sites/Map/Wildlife/Compare/Mask Finder all live under
// "Explore" (a real hub page, not a dropdown) rather than as separate top-
// level items — see docs/navigation.md.
const items = [
  { href: "/discover", label: "Discover" },
  { href: "/explore", label: "Explore" },
  { href: "/reservations", label: "Reservations" },
  { href: "/saved", label: "Favorites" },
];

export function TopNav() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-40 hidden border-b border-abyss-100 bg-sand-50/95 backdrop-blur md:block">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="focus-ring flex items-center gap-2 font-display text-xl text-abyss-900">
          <LogoMark className="h-8 w-8 rounded-lg" />
          DiveFinder
        </Link>
        <nav className="flex items-center gap-2">
          {items.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "focus-ring whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  active ? "bg-abyss-900 text-white" : "text-abyss-600 hover:bg-abyss-100"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/profile"
          className="focus-ring whitespace-nowrap rounded-full border border-abyss-200 px-4 py-2 text-sm font-medium text-abyss-700 hover:bg-abyss-50"
        >
          Account
        </Link>
      </div>
    </header>
  );
}
