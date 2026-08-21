import Link from "next/link";
import { cn } from "@/lib/utils/cn";

// Plain <Link>-based — works from a Server Component with no client JS,
// and preserves whatever other query params the caller already has
// (filters, etc.) via buildHref.
export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-3">
      <PageLink href={page > 1 ? buildHref(page - 1) : null} disabled={page <= 1}>
        Previous
      </PageLink>
      <span className="text-sm text-abyss-500">
        Page {page} of {totalPages}
      </span>
      <PageLink href={page < totalPages ? buildHref(page + 1) : null} disabled={page >= totalPages}>
        Next
      </PageLink>
    </nav>
  );
}

function PageLink({ href, disabled, children }: { href: string | null; disabled: boolean; children: React.ReactNode }) {
  const className = cn(
    "focus-ring rounded-full border px-4 py-2 text-sm font-medium transition-colors",
    disabled
      ? "cursor-not-allowed border-abyss-100 text-abyss-300"
      : "border-abyss-200 text-abyss-700 hover:bg-abyss-50"
  );
  if (disabled || !href) {
    return (
      <span className={className} aria-disabled="true">
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
