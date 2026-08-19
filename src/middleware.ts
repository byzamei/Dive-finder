import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl, isSupabaseConfigured } from "@/lib/supabase/env";

interface CookieToSet {
  name: string;
  value: string;
  options?: CookieOptions;
}

// Refreshes the Supabase auth session on every request so server
// components always see an up-to-date session cookie. No-ops gracefully
// when Supabase env vars are not configured yet (fresh clone before
// .env.local is filled in).
export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  if (!isSupabaseConfigured) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/).*)"],
};
