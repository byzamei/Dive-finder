"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  bucketReservation,
  createReservation,
  deleteReservation,
  setReservationStatus,
  type ReservationBucket,
} from "@/lib/services/reservationService";
import type { Reservation } from "@/lib/types/domain";
import { Card, CardBody } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export interface DestinationOption {
  id: string;
  slug: string;
  name: string;
}

const TABS: { value: ReservationBucket; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "cancelled", label: "Cancelled" },
];

function formatDateRange(startDate: string, endDate: string | null): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  const start = new Date(startDate).toLocaleDateString(undefined, opts);
  if (!endDate || endDate === startDate) return start;
  return `${start} — ${new Date(endDate).toLocaleDateString(undefined, opts)}`;
}

export function ReservationsBoard({
  userId,
  initialReservations,
  destinations,
}: {
  userId: string;
  initialReservations: Reservation[];
  destinations: DestinationOption[];
}) {
  const [reservations, setReservations] = useState(initialReservations);
  const [tab, setTab] = useState<ReservationBucket>("upcoming");
  const [showForm, setShowForm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const groups: Record<ReservationBucket, Reservation[]> = { upcoming: [], past: [], cancelled: [] };
    for (const r of reservations) groups[bucketReservation(r)].push(r);
    return groups;
  }, [reservations]);

  function handleAdd(reservation: Reservation) {
    setReservations((rs) => [...rs, reservation]);
    setShowForm(false);
    setTab(bucketReservation(reservation));
  }

  async function handleCancel(id: string) {
    const previous = reservations;
    setReservations((rs) => rs.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r)));
    setActionError(null);
    try {
      const supabase = createClient();
      await setReservationStatus(supabase, id, "cancelled");
    } catch (err) {
      setReservations(previous);
      setActionError(err instanceof Error ? err.message : "Couldn't cancel this reservation");
    }
  }

  async function handleReactivate(id: string) {
    const previous = reservations;
    setReservations((rs) => rs.map((r) => (r.id === id ? { ...r, status: "confirmed" } : r)));
    setActionError(null);
    try {
      const supabase = createClient();
      await setReservationStatus(supabase, id, "confirmed");
    } catch (err) {
      setReservations(previous);
      setActionError(err instanceof Error ? err.message : "Couldn't restore this reservation");
    }
  }

  async function handleDelete(id: string) {
    const previous = reservations;
    setReservations((rs) => rs.filter((r) => r.id !== id));
    setActionError(null);
    try {
      const supabase = createClient();
      await deleteReservation(supabase, id);
    } catch (err) {
      setReservations(previous);
      setActionError(err instanceof Error ? err.message : "Couldn't delete this reservation");
    }
  }

  const visible = grouped[tab];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={`focus-ring rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                tab === t.value ? "bg-ocean-600 text-white" : "bg-abyss-100 text-abyss-700 hover:bg-abyss-200"
              }`}
            >
              {t.label} ({grouped[t.value].length})
            </button>
          ))}
        </div>
        <Button type="button" size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ Add a reservation"}
        </Button>
      </div>

      {showForm && (
        <div className="mt-4">
          <NewReservationForm userId={userId} destinations={destinations} onCreated={handleAdd} />
        </div>
      )}

      {actionError && <p className="mt-4 text-sm text-coral-600">{actionError}</p>}

      {visible.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title={tab === "upcoming" ? "No upcoming reservations" : tab === "past" ? "No past reservations yet" : "Nothing cancelled"}
            description={
              tab === "upcoming"
                ? "Booked a dive trip with an operator? Add it here to keep track of it."
                : undefined
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {visible.map((r) => (
            <Card key={r.id}>
              <CardBody>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {r.destination_id ? (
                      <Link href={`/destinations/${destinations.find((d) => d.id === r.destination_id)?.slug ?? ""}`} className="focus-ring">
                        <p className="truncate font-display text-lg text-abyss-900 hover:underline">
                          {r.destination_name ?? "Destination"}
                        </p>
                      </Link>
                    ) : (
                      <p className="truncate font-display text-lg text-abyss-900">{r.destination_name ?? "Trip"}</p>
                    )}
                    {r.operator_name && <p className="mt-0.5 truncate text-sm text-abyss-500">{r.operator_name}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    aria-label="Delete reservation"
                    className="focus-ring shrink-0 text-abyss-300 hover:text-coral-600"
                  >
                    ✕
                  </button>
                </div>
                <p className="mt-2 text-sm text-abyss-700">{formatDateRange(r.start_date, r.end_date)}</p>
                {r.notes && <p className="mt-1 text-xs text-abyss-500">{r.notes}</p>}
                <div className="mt-3">
                  {r.status === "confirmed" ? (
                    <button type="button" onClick={() => handleCancel(r.id)} className="focus-ring text-xs font-medium text-coral-600 underline">
                      Cancel this reservation
                    </button>
                  ) : (
                    <button type="button" onClick={() => handleReactivate(r.id)} className="focus-ring text-xs font-medium text-ocean-600 underline">
                      Restore
                    </button>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function NewReservationForm({
  userId,
  destinations,
  onCreated,
}: {
  userId: string;
  destinations: DestinationOption[];
  onCreated: (reservation: Reservation) => void;
}) {
  const [destinationId, setDestinationId] = useState("");
  const [destinationName, setDestinationName] = useState("");
  const [operatorName, setOperatorName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate) {
      setError("Pick a start date first.");
      return;
    }
    const selected = destinations.find((d) => d.id === destinationId);
    const resolvedName = selected?.name ?? destinationName.trim();
    if (!resolvedName) {
      setError("Pick a destination, or type its name.");
      return;
    }
    setSaving(true);
    setError(null);
    const input = {
      destinationId: selected?.id ?? null,
      destinationName: resolvedName,
      operatorType: null,
      operatorId: null,
      operatorName: operatorName.trim() || null,
      startDate,
      endDate: endDate || null,
      notes: notes.trim() || null,
    };
    try {
      const supabase = createClient();
      const reservation = await createReservation(supabase, userId, input);
      onCreated(reservation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save this reservation");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-abyss-500">Destination</label>
            <Select value={destinationId} onChange={(e) => setDestinationId(e.target.value)}>
              <option value="">Not in the catalog / other</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
            {!destinationId && (
              <input
                type="text"
                value={destinationName}
                onChange={(e) => setDestinationName(e.target.value)}
                placeholder="Or type a destination name"
                className="focus-ring mt-2 w-full rounded-lg border border-abyss-200 px-3 py-2 text-sm"
              />
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs text-abyss-500" htmlFor="operator_name">
              Dive center or liveaboard (optional)
            </label>
            <input
              id="operator_name"
              type="text"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              placeholder="e.g. the name of the center you booked with"
              className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-abyss-500" htmlFor="start_date">
                Start date *
              </label>
              <input
                id="start_date"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-abyss-500" htmlFor="end_date">
                End date (optional)
              </label>
              <input
                id="end_date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-abyss-500" htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="focus-ring w-full rounded-lg border border-abyss-200 px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-sm text-coral-600">{error}</p>}

          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save reservation"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
