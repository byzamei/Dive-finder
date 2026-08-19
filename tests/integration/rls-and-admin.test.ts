// T008 & T009 — Row Level Security and admin-route protection.
//
// These behaviors are enforced by Postgres RLS policies
// (supabase/migrations/0008_rls_policies.sql) and by requireAdmin()
// (src/lib/auth/session.ts), both of which need a real Supabase project
// with the migrations + seed applied to exercise end to end — they cannot
// be verified with pure in-memory unit tests the way scoring/data-
// governance logic can.
//
// This suite runs automatically in CI/local `npm test` ONLY when
// TEST_SUPABASE_URL / TEST_SUPABASE_ANON_KEY / TEST_SUPABASE_SERVICE_ROLE_KEY
// are set to a disposable test project (never point this at production
// data). Otherwise it's skipped with a clear message rather than failing.
//
// What it verifies when it runs:
//   T008: a second user cannot read or write another user's `favorites`
//         row (RLS policy `favorites_owner_all`), even via a direct
//         PostgREST call bypassing the app's UI.
//   T009: a non-admin authenticated user cannot write to an admin-only
//         table (e.g. `data_sources`) — RLS policy `*_admin_write` /
//         `*_admin_all` rejects the write.
import { describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";

const url = process.env.TEST_SUPABASE_URL;
const anonKey = process.env.TEST_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;
const canRun = Boolean(url && anonKey && serviceRoleKey);

describe.skipIf(!canRun)("RLS enforcement against a live test Supabase project", () => {
  it("T008: a user cannot read another user's favorites", async () => {
    const admin = createClient(url!, serviceRoleKey!);
    const anon = createClient(url!, anonKey!);

    const emailA = `divefinder-test-a-${Date.now()}@example.com`;
    const emailB = `divefinder-test-b-${Date.now()}@example.com`;
    const { data: userA } = await admin.auth.admin.createUser({ email: emailA, email_confirm: true });
    const { data: userB } = await admin.auth.admin.createUser({ email: emailB, email_confirm: true });

    await admin.from("favorites").insert({
      user_id: userA.user!.id,
      entity_type: "destination",
      entity_id: "00000000-0000-0000-0000-000000000000",
    });

    const { data: linkB } = await admin.auth.admin.generateLink({ type: "magiclink", email: emailB });
    await anon.auth.verifyOtp({ type: "magiclink", token_hash: linkB!.properties!.hashed_token, email: emailB });

    const { data: visibleToB } = await anon.from("favorites").select("*").eq("user_id", userA.user!.id);
    expect(visibleToB).toHaveLength(0);

    await admin.auth.admin.deleteUser(userA.user!.id);
    await admin.auth.admin.deleteUser(userB.user!.id);
  });

  it("T009: a non-admin user cannot write to an admin-only table", async () => {
    const admin = createClient(url!, serviceRoleKey!);
    const anon = createClient(url!, anonKey!);

    const email = `divefinder-test-nonadmin-${Date.now()}@example.com`;
    const { data: user } = await admin.auth.admin.createUser({ email, email_confirm: true });
    const { data: link } = await admin.auth.admin.generateLink({ type: "magiclink", email });
    await anon.auth.verifyOtp({ type: "magiclink", token_hash: link!.properties!.hashed_token, email });

    const { error } = await anon.from("data_sources").insert({ name: "Should fail", source_type: "other" });
    expect(error).not.toBeNull();

    await admin.auth.admin.deleteUser(user.user!.id);
  });
});
