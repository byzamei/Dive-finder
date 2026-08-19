// Promotes an existing DiveFinder user to the admin role.
//
// Usage:
//   npm run create-admin -- you@example.com
//
// The user must already have signed up (via magic link or Google OAuth) at
// least once — this script only flips profiles.role to 'admin' for an
// existing profiles row.

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

loadEnv({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2];

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

if (!email) {
  console.error("Usage: npm run create-admin -- you@example.com");
  process.exit(1);
}

const db = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: profile, error: findError } = await db
    .from("profiles")
    .select("id, email, role")
    .eq("email", email)
    .maybeSingle();

  if (findError) throw findError;

  if (!profile) {
    console.error(
      `No profile found for ${email}. Sign up in the app first (magic link or Google), then re-run this script.`
    );
    process.exit(1);
  }

  const { error: updateError } = await db.from("profiles").update({ role: "admin" }).eq("id", profile.id);
  if (updateError) throw updateError;

  console.log(`✓ ${email} is now an admin. Sign out and back in for the role to take effect.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
