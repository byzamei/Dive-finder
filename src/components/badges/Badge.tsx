import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info" | "demo";
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-abyss-100 text-abyss-700",
    success: "bg-seaglass-100 text-seaglass-700",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-coral-400/15 text-coral-600",
    info: "bg-ocean-100 text-ocean-700",
    demo: "bg-abyss-800 text-white",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
