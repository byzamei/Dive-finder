import type { EarnedBadge } from "@/lib/types/domain";

function BadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <circle cx="12" cy="9" r="5.5" />
      <path d="M9 13.5 7.5 21l4.5-2.5L16.5 21l-1.5-7.5" />
    </svg>
  );
}

export function BadgeGrid({ badges }: { badges: EarnedBadge[] }) {
  if (badges.length === 0) {
    return (
      <p className="text-sm text-abyss-400">
        No badges yet — fill in your experience and start saving destinations to earn some.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((b) => (
        <span
          key={b.id}
          title={b.description}
          className="inline-flex items-center gap-1.5 rounded-full border border-seaglass-200 bg-seaglass-50 px-3 py-1.5 text-xs font-medium text-seaglass-800"
        >
          <BadgeIcon />
          {b.label}
        </span>
      ))}
    </div>
  );
}
