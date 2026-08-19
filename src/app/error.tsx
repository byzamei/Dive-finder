"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function GlobalErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-2xl text-abyss-900">Something went wrong</h1>
      {!isSupabaseConfigured ? (
        <p className="mt-3 text-sm text-abyss-500">
          This page needs a configured Supabase project. Copy <code>.env.example</code> to{" "}
          <code>.env.local</code>, fill in your Supabase URL/keys, then restart the dev server — see
          README.md §3–6.
        </p>
      ) : (
        <p className="mt-3 text-sm text-abyss-500">Please try again, or head back to the homepage.</p>
      )}
      <div className="mt-6 flex gap-3">
        <Button onClick={reset} variant="outline">
          Try again
        </Button>
        <Button onClick={() => (window.location.href = "/")}>Go home</Button>
      </div>
    </main>
  );
}
