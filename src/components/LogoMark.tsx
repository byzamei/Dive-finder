// Inline vector version of the DiveFinder mark (see scripts/logo.svg,
// which is the source of truth for the rasterized app/PWA icons —
// regenerate both together if the design changes).
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden>
      <rect width={512} height={512} rx={112} fill="#0e1725" />
      <circle cx={256} cy={256} r={176} fill="none" stroke="#c9e6f5" strokeWidth={18} />
      <path d="M256 140 L308 330 L256 296 L204 330 Z" fill="#f4703f" />
    </svg>
  );
}
