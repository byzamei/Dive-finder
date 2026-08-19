import { cn } from "@/lib/utils/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function ResultCardSkeleton() {
  return (
    <div className="rounded-xl2 border border-abyss-100 bg-white p-4 shadow-card">
      <Skeleton className="h-40 w-full mb-4" />
      <Skeleton className="h-5 w-2/3 mb-2" />
      <Skeleton className="h-4 w-1/3 mb-4" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  );
}
