"use client";

import { cn } from "@/lib/utils/cn";

export function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "focus-ring rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        selected
          ? "border-ocean-600 bg-ocean-600 text-white"
          : "border-abyss-200 bg-white text-abyss-700 hover:bg-abyss-50"
      )}
    >
      {children}
    </button>
  );
}
