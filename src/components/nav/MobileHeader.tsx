"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { LogoMark } from "@/components/LogoMark";

// TopNav (logo + full nav) only renders at md: and up. BottomNav already
// covers Search/Explore/Reservations/Favorites/Account on phones, so this
// menu only needs the sections that are one level under "Explore" — the
// catalog itself (destinations + map) is already one tap away via the
// bottom bar.
const MENU_ITEMS = [
  { href: "/wildlife", label: "Wildlife" },
  { href: "/sites", label: "Dive sites" },
  { href: "/gear", label: "Gear" },
  { href: "/feed", label: "Feed" },
  { href: "/divers", label: "Divers" },
];

export function MobileHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <header
      className="sticky top-0 z-40 border-b border-abyss-100 bg-sand-50/95 backdrop-blur md:hidden"
      style={{ paddingTop: "var(--safe-area-top)" }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/" className="focus-ring flex items-center gap-2 font-display text-lg text-abyss-900">
          <LogoMark className="h-7 w-7 rounded-md" />
          DiveFinder
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="focus-ring flex h-9 w-9 items-center justify-center rounded-full text-abyss-700 hover:bg-abyss-100"
        >
          {open ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label="All sections" className="border-t border-abyss-100 px-4 pb-4 pt-2">
          <ul className="grid grid-cols-2 gap-2">
            {MENU_ITEMS.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "focus-ring block rounded-xl2 border px-4 py-3 text-sm font-medium",
                      active ? "border-abyss-900 bg-abyss-900 text-white" : "border-abyss-100 bg-white text-abyss-700"
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
}
