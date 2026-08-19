"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const items = [
  { href: "/discover", label: "Discover", icon: CompassIcon },
  { href: "/gear/mask-finder", label: "Mask", icon: MaskIcon },
  { href: "/map", label: "Map", icon: MapIcon },
  { href: "/saved", label: "Saved", icon: HeartIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-abyss-100 bg-white/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "var(--safe-area-bottom)" }}
      aria-label="Primary"
    >
      <ul className="flex">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(href + "/");
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "focus-ring flex flex-col items-center gap-1 py-2.5 text-xs",
                  active ? "text-ocean-600" : "text-abyss-400"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function CompassIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <circle cx={12} cy={12} r={9} />
      <path d="M15 9l-2 6-4-2 2-6 4 2z" />
    </svg>
  );
}
function MaskIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <circle cx={7.5} cy={12} r={4} />
      <circle cx={16.5} cy={12} r={4} />
      <path d="M11.2 12h1.6" />
      <path d="M3.5 12v2.5a2 2 0 002 2H6" />
    </svg>
  );
}
function MapIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2-6-2z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  );
}
function HeartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path d="M12 20s-7-4.5-9.5-9A5 5 0 0112 6a5 5 0 019.5 5c-2.5 4.5-9.5 9-9.5 9z" />
    </svg>
  );
}
function UserIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <circle cx={12} cy={8} r={4} />
      <path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" />
    </svg>
  );
}
