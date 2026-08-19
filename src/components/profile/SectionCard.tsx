import type { ReactNode } from "react";
import { Card, CardBody } from "@/components/ui/Card";

export function SectionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardBody className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ocean-50 text-ocean-600">
            {icon}
          </div>
          <div>
            <h2 className="font-display text-lg text-abyss-900">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-abyss-500">{description}</p>}
          </div>
        </div>
        <div className="mt-5">{children}</div>
      </CardBody>
    </Card>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-abyss-400">{children}</p>;
}
