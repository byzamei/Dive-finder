import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl2 border border-dashed border-abyss-200 bg-white/60 px-6 py-14 text-center">
      {icon && <div className="mb-4 text-abyss-300">{icon}</div>}
      <h3 className="font-display text-lg text-abyss-900">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-abyss-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
