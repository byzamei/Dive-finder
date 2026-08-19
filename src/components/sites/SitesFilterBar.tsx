"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/Select";
import type { AccessType, Destination } from "@/lib/types/domain";

const ACCESS_TYPES: { value: AccessType; label: string }[] = [
  { value: "shore", label: "Shore" },
  { value: "boat", label: "Boat" },
  { value: "liveaboard", label: "Liveaboard" },
];

export function SitesFilterBar({ destinations }: { destinations: Destination[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/sites?${params.toString()}`);
  }

  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:max-w-md">
      <Select value={searchParams.get("destination") ?? ""} onChange={(e) => updateParam("destination", e.target.value)}>
        <option value="">All destinations</option>
        {destinations.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </Select>
      <Select value={searchParams.get("access") ?? ""} onChange={(e) => updateParam("access", e.target.value)}>
        <option value="">All access types</option>
        {ACCESS_TYPES.map((a) => (
          <option key={a.value} value={a.value}>
            {a.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
