"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { LogoMark } from "@/components/LogoMark";

const items = [
  { href: "/discover", label: "Discover" },
  { href: "/wildlife", label: "Wildlife" },
  { href: "/map", label: "Map" },
  { href: "/compare", label: "Compare" },
  { href: "/gear/mask-finder", label: "Mask Finder" },
  { href: "/saved", label: "Saved" },
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
        <nav className="flex items-center gap-1">
          {items.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "focus-ring rounded-full px-4 py-2 text-sm font-medium transition-colors",
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
          className="focus-ring rounded-full border border-abyss-200 px-4 py-2 text-sm font-medium text-abyss-700 hover:bg-abyss-50"
        >
          Profile
        </Link>
      </div>
    </header>
  );
}
