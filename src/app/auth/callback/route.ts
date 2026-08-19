import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

// Handles the magic-link / Google OAuth callback. Supabase can land here
// either as a PKCE `?code=` (the common case when the link is opened in
// the SAME browser that requested it) or as an implicit `?token_hash=` +
// `&type=` pair. Both are handled explicitly, and — unlike before — a
// failure is surfaced back to /login with a clear reason instead of
// silently redirecting to a page that will just bounce the user back to
// the login form with no explanation (the "keeps asking for my email"
// symptom).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const redirectTo = searchParams.get("redirectTo") ?? "/profile";

  const supabase = await createClient();
  let error: string | null = null;

  if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    error = result.error?.message ?? null;
  } else if (tokenHash && type) {
    const result = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    error = result.error?.message ?? null;
  } else {
    error = "Missing sign-in code — the link may be incomplete.";
  }

  if (error) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", error);
    if (redirectTo !== "/profile") loginUrl.searchParams.set("redirectTo", redirectTo);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(`${origin}${redirectTo}`);
}
