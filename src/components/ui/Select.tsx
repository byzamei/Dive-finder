import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

// Styled wrapper around a native <select> — keeps full accessibility/native
// behavior (screen readers, keyboard, mobile picker wheels) while matching
// the rounded, bordered look used everywhere else in the design system.
export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          "focus-ring w-full appearance-none rounded-xl2 border border-abyss-200 bg-white px-4 py-3 pr-10 text-sm text-abyss-900 shadow-sm transition-colors hover:border-abyss-300 disabled:bg-abyss-50 disabled:text-abyss-400",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-abyss-400"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
}
