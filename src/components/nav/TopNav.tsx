"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { LogoMark } from "@/components/LogoMark";

// Primary items stay directly in the bar. Less-central ones move into a
// "More" dropdown — with 8 sections, showing all of them as pills got
// cramped enough to wrap onto two lines (see git history). This keeps the
// bar airy while still reaching every section in two clicks at most.
const PRIMARY_ITEMS = [
  { href: "/discover", label: "Discover" },
  { href: "/wildlife", label: "Wildlife" },
  { href: "/map", label: "Map" },
  { href: "/gear/mask-finder", label: "Mask Finder" },
  { href: "/saved", label: "Saved" },
];

const MORE_ITEMS = [
  { href: "/sites", label: "Sites" },
  { href: "/compare", label: "Compare" },
  { href: "/logbook", label: "Logbook" },
];

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "focus-ring whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors",
        active ? "bg-abyss-900 text-white" : "text-abyss-600 hover:bg-abyss-100"
      )}
    >
      {label}
    </Link>
  );
}

function MoreMenu({ pathname }: { pathname: string | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const someActive = MORE_ITEMS.some((item) => pathname === item.href || pathname?.startsWith(item.href + "/"));

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          "focus-ring flex items-center gap-1 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors",
          someActive ? "bg-abyss-900 text-white" : "text-abyss-600 hover:bg-abyss-100"
        )}
      >
        More
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 min-w-[10rem] rounded-xl2 border border-abyss-100 bg-white p-1.5 shadow-card">
          {MORE_ITEMS.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "focus-ring block rounded-lg px-3 py-2 text-sm font-medium",
                  active ? "bg-abyss-100 text-abyss-900" : "text-abyss-600 hover:bg-abyss-100"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
          {PRIMARY_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              active={pathname === item.href || Boolean(pathname?.startsWith(item.href + "/"))}
            />
          ))}
          <MoreMenu pathname={pathname} />
        </nav>
        <Link
          href="/profile"
          className="focus-ring whitespace-nowrap rounded-full border border-abyss-200 px-4 py-2 text-sm font-medium text-abyss-700 hover:bg-abyss-50"
        >
          Profile
        </Link>
      </div>
    </header>
  );
}
