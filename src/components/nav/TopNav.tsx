"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { LogoMark } from "@/components/LogoMark";

// Grouped by journey stage, not by when each feature was added: search →
// browse the catalog → track trips/dives → save for later → account.
// Destinations and the map are one merged catalog view under "Explore"
// (list/map toggle, not separate tabs); dive sites, wildlife, and
// comparing destinations are one tap from there rather than their own
// top-level items — see docs/navigation.md.
const items = [
  { href: "/search", label: "Search" },
  { href: "/explore", label: "Explore" },
  { href: "/gear", label: "Gear" },
  { href: "/reservations", label: "Reservations" },
  { href: "/saved", label: "Favorites" },
];

// The account pill used to link straight to /profile, which left Logbook,
// Feed and Divers reachable only via small links buried inside the
// profile page — two clicks and a scroll, versus one tap from the mobile
// hamburger menu (see MobileHeader). This dropdown gives desktop the same
// one-click reach.
const ACCOUNT_MENU_ITEMS = [
  { href: "/profile", label: "Profile" },
  { href: "/logbook", label: "Logbook" },
  { href: "/feed", label: "Feed" },
  { href: "/divers", label: "Find divers" },
];

export function TopNav() {
  const pathname = usePathname();
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => setAccountOpen(false), [pathname]);

  useEffect(() => {
    if (!accountOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setAccountOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [accountOpen]);

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
        <div ref={accountRef} className="relative">
          <button
            type="button"
            onClick={() => setAccountOpen((v) => !v)}
            aria-expanded={accountOpen}
            aria-haspopup="menu"
            aria-controls="account-menu"
            className="focus-ring flex items-center gap-1.5 whitespace-nowrap rounded-full border border-abyss-200 px-4 py-2 text-sm font-medium text-abyss-700 hover:bg-abyss-50"
          >
            Account
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className={cn("h-3.5 w-3.5 transition-transform", accountOpen && "rotate-180")}
              aria-hidden
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {accountOpen && (
            <div
              id="account-menu"
              role="menu"
              className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl2 border border-abyss-100 bg-white py-1.5 shadow-card"
            >
              {ACCOUNT_MENU_ITEMS.map((item) => {
                const active = pathname === item.href || pathname?.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    className={cn(
                      "focus-ring block px-4 py-2 text-sm",
                      active ? "bg-abyss-50 font-medium text-abyss-900" : "text-abyss-600 hover:bg-abyss-50"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
