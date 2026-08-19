// Centralised, safe access to Supabase env vars. Reading through here (rather
// than process.env directly) means a missing key produces one clear error
// message instead of a cryptic client-side crash.

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
