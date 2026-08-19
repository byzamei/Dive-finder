"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { featureFlags } from "@/lib/utils/featureFlags";
import { track } from "@/lib/analytics/analytics";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");
  const redirectTo = searchParams.get("redirectTo") ?? "/profile";

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "verifying">("idle");
  const [error, setError] = useState<string | null>(callbackError);
  const [codeError, setCodeError] = useState<string | null>(null);

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
      setStatus("idle");
      setError(error.message);
      return;
    }
    setStatus("sent");
    track({ name: "signup_completed", properties: { method: "magic_link" } });
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setStatus("verifying");
    setCodeError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: "email" });
    if (error) {
      setStatus("sent");
      setCodeError(error.message);
      return;
    }
    router.push(redirectTo);
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-6 py-16">
      <h1 className="font-display text-2xl text-abyss-900">Sign in to DiveFinder</h1>
      <p className="mt-2 text-sm text-abyss-500">
        You can search and browse without an account. Sign in to save favorites and your diver
        profile.
      </p>

      {callbackError && status === "idle" && (
        <div className="mt-6 rounded-xl2 border border-coral-400/30 bg-coral-400/5 p-4 text-sm text-coral-700">
          <p className="font-medium">The sign-in link didn&apos;t work: {callbackError}</p>
          <p className="mt-1 text-abyss-600">
            Email links can get mangled by some mail apps (Gmail&apos;s link scanning is a common culprit).
            Request a new code below and use the 6-digit code instead of the link — it&apos;s more reliable.
          </p>
        </div>
      )}

      {status === "sent" || status === "verifying" ? (
        <div className="mt-8 space-y-5">
          <div className="rounded-xl2 border border-seaglass-200 bg-seaglass-50 p-4 text-sm text-seaglass-700">
            <p>
              We sent an email to <strong>{email}</strong>.
            </p>
            <p className="mt-1 text-xs text-seaglass-800">
              Either tap the link in that email, or — more reliable if links don&apos;t work in your mail app —
              type the 6-digit code from the same email below.
            </p>
          </div>

          <form onSubmit={verifyCode} className="space-y-3">
            <label className="block text-sm font-medium text-abyss-700" htmlFor="code">
              6-digit code
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className="focus-ring w-full rounded-lg border border-abyss-200 px-4 py-2.5 text-center text-lg tracking-[0.3em]"
            />
            {codeError && <p className="text-sm text-coral-600">{codeError}</p>}
            <Button type="submit" className="w-full" disabled={status === "verifying" || code.length < 6}>
              {status === "verifying" ? "Verifying…" : "Verify code"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => {
              setStatus("idle");
              setCode("");
              setCodeError(null);
            }}
            className="focus-ring text-sm text-abyss-500 underline"
          >
            Use a different email
          </button>
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
            {status === "sending" ? "Sending…" : "Send sign-in code"}
          </Button>
        </form>
      )}

      {featureFlags.googleOAuth && status !== "sent" && status !== "verifying" && (
        <>
          <div className="my-6 flex items-center gap-3 text-xs text-abyss-400">
            <span className="h-px flex-1 bg-abyss-100" /> or <span className="h-px flex-1 bg-abyss-100" />
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo: `${window.location.origin}/auth/callback` },
              });
            }}
            type="button"
          >
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
