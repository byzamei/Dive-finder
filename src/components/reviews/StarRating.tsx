function Star({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 1.5} className="h-full w-full">
      <path d="M10 1.5l2.6 5.4 5.9.9-4.3 4.2 1 5.9L10 15l-5.2 2.9 1-5.9-4.3-4.2 5.9-.9L10 1.5Z" />
    </svg>
  );
}

export function StarRating({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  const dim = size === "md" ? "h-5 w-5" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5 text-amber-500" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={dim}>
          <Star filled={n <= Math.round(value)} />
        </span>
      ))}
    </div>
  );
}

export function StarRatingInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1 text-amber-500">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className="focus-ring h-7 w-7 rounded"
        >
          <Star filled={n <= value} />
        </button>
      ))}
    </div>
  );
}
