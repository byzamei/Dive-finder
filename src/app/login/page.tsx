"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { featureFlags } from "@/lib/utils/featureFlags";
import { track } from "@/lib/analytics/analytics";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setStatus("error");
      setError(error.message);
      return;
    }
    setStatus("sent");
    track({ name: "signup_completed", properties: { method: "magic_link" } });
  }

  async function signInWithGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-6 py-16">
      <h1 className="font-display text-2xl text-abyss-900">Sign in to DiveFinder</h1>
      <p className="mt-2 text-sm text-abyss-500">
        You can search and browse without an account. Sign in to save favorites and your diver
        profile.
      </p>

      {status === "sent" ? (
        <div className="mt-8 rounded-xl2 border border-seaglass-200 bg-seaglass-50 p-4 text-sm text-seaglass-700">
          Check <strong>{email}</strong> for a magic link to finish signing in.
        </div>
      ) : (
        <form onSubmit={sendMagicLink} className="mt-8 space-y-3">
          <label className="block text-sm font-medium text-abyss-700" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="focus-ring w-full rounded-lg border border-abyss-200 px-4 py-2.5 text-sm"
          />
          {error && <p className="text-sm text-coral-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={status === "sending"}>
            {status === "sending" ? "Sending…" : "Send magic link"}
          </Button>
        </form>
      )}

      {featureFlags.googleOAuth && (
        <>
          <div className="my-6 flex items-center gap-3 text-xs text-abyss-400">
            <span className="h-px flex-1 bg-abyss-100" /> or <span className="h-px flex-1 bg-abyss-100" />
          </div>
          <Button variant="outline" className="w-full" onClick={signInWithGoogle} type="button">
            Continue with Google
          </Button>
        </>
      )}
    </main>
  );
}
