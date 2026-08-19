"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// TopNav (logo + full nav) only renders at md: and up. Below that, the
// BottomNav covers navigation but has no way back to "/" — this fills
// that gap with a minimal, always-present logo/home link on phones.
export function MobileHeader() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <header
      className="sticky top-0 z-40 flex items-center border-b border-abyss-100 bg-sand-50/95 px-4 py-3 backdrop-blur md:hidden"
      style={{ paddingTop: "calc(0.75rem + var(--safe-area-top))" }}
    >
      <Link href="/" className="focus-ring font-display text-lg text-abyss-900">
        DiveFinder
      </Link>
    </header>
  );
}
