import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./env";

// Service-role Supabase client. NEVER import this from client code or any
// module reachable by a client bundle — `server-only` throws a build error
// if that happens. Used by: seed script, scripts/create-admin.ts, and
// server-only routes that must bypass RLS (e.g. logging an anonymous
// search, generating Data Health aggregates).
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "createAdminClient() requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to be set."
    );
  }
  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
