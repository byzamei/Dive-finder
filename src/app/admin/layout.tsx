import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/data-health", label: "Data Health" },
  { href: "/admin/review", label: "Review queue" },
  { href: "/admin/claims", label: "Claims" },
  { href: "/admin/sources", label: "Sources" },
  { href: "/admin/destinations", label: "Destinations" },
  { href: "/admin/sites", label: "Dive sites" },
  { href: "/admin/species", label: "Species" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-6 py-8">
      <aside className="w-48 shrink-0">
        <p className="mb-3 font-display text-lg text-abyss-900">Admin</p>
        <nav className="space-y-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="focus-ring block rounded-lg px-3 py-2 text-sm text-abyss-600 hover:bg-abyss-100"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
