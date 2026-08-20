import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { listReservations } from "@/lib/services/reservationService";
import { ReservationsBoard } from "@/components/reservations/ReservationsBoard";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Reservations" };

// Soft-gated like the rest of the app's personal features (Mask Finder
// save, species life list): the tab stays visible and useful-looking to
// signed-out visitors instead of hard-redirecting, so it can do its job of
// showing what an account unlocks.
export default async function ReservationsPage() {
  const user = await getCurrentUser();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-display text-3xl text-abyss-900">Reservations</h1>
      <p className="mt-2 text-abyss-500">Track dive trips you&apos;ve booked — upcoming, past, or cancelled.</p>

      <div className="mt-8">
        {user ? (
          <ReservationsBoardData userId={user.id} />
        ) : (
          <div className="rounded-xl2 border border-abyss-100 bg-sand-100 p-6 text-center">
            <p className="font-medium text-abyss-800">Sign in to track your reservations</p>
            <p className="mt-1 text-sm text-abyss-500">
              Once you&apos;re signed in, you&apos;ll be able to keep a record of trips you&apos;ve booked with real
              operators.
            </p>
            <ButtonLink href="/login?redirectTo=/reservations" className="mt-4">
              Sign in
            </ButtonLink>
          </div>
        )}
      </div>

      <p className="mt-6 text-sm text-abyss-400">
        Looking for a place to book?{" "}
        <Link href="/explore" className="text-ocean-600 underline">
          Explore
        </Link>{" "}
        for destinations and real dive operators.
      </p>
    </main>
  );
}

async function ReservationsBoardData({ userId }: { userId: string }) {
  const supabase = await createClient();
  const [reservations, { data: destinationRows }] = await Promise.all([
    listReservations(supabase, userId),
    supabase.from("destinations").select("id, slug, name").eq("status", "published").order("name"),
  ]);

  const destinations = (destinationRows ?? []) as { id: string; slug: string; name: string }[];

  return <ReservationsBoard userId={userId} initialReservations={reservations} destinations={destinations} />;
}
