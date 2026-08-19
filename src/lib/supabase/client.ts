"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./env";

// Browser-side Supabase client, safe to import from client components.
// Only ever uses the anon key — RLS enforces per-user access.
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
