import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./env";

interface CookieToSet {
  name: string;
  value: string;
  options?: CookieOptions;
}

// Server Component / Route Handler / Server Action Supabase client. Reads
// and writes the auth cookie via next/headers so sessions survive SSR.
// Still uses only the anon key — RLS governs access.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component that can't set cookies (no
          // active response). Safe to ignore when middleware refreshes
          // the session — see middleware.ts.
        }
      },
    },
  });
}
