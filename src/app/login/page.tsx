"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { featureFlags } from "@/lib/utils/featureFlags";
import { track } from "@/lib/analytics/analytics";

function LoginInner() {
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(callbackError);

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

      {callbackError && status !== "sent" && (
        <div className="mt-6 rounded-xl2 border border-coral-400/30 bg-coral-400/5 p-4 text-sm text-coral-700">
          <p className="font-medium">The sign-in link didn&apos;t work: {callbackError}</p>
          <p className="mt-1 text-abyss-600">
            This usually happens when the email link opens in a different app&apos;s built-in browser (e.g. the
            Gmail app) than the one you requested it from. Try again below, then open the email link with
            &quot;Open in Safari/Chrome&quot; (long-press the link) instead of tapping it directly.
          </p>
        </div>
      )}

      {status === "sent" ? (
        <div className="mt-8 rounded-xl2 border border-seaglass-200 bg-seaglass-50 p-4 text-sm text-seaglass-700">
          <p>
            Check <strong>{email}</strong> for a magic link to finish signing in.
          </p>
          <p className="mt-2 text-xs text-seaglass-800">
            Tip: long-press the link in the email and choose &quot;Open in Safari&quot; (or your default
            browser) rather than tapping it directly — some email apps open links in a separate browser that
            can&apos;t complete sign-in.
          </p>
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
          {error && !callbackError && <p className="text-sm text-coral-600">{error}</p>}
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

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
