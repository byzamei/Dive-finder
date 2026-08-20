-- DiveFinder — 0017: personal reservation tracker.
-- Phase 1 of the booking roadmap: divers manually record trips they've
-- booked elsewhere (a dive center, a liveaboard, or just a destination),
-- and track them as upcoming/past/cancelled — a Booking.com-style trip
-- list. Not a real booking/payment flow yet; that requires operator
-- partnerships first. operator_id is deliberately not a foreign key: it
-- can point at either dive_centers or liveaboards depending on
-- operator_type, and a reservation must still be recordable with a free-
-- text operator name for operators not yet in the catalog.

create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  destination_id uuid references destinations(id) on delete set null,
  destination_name text,
  operator_type text check (operator_type in ('dive_center', 'liveaboard')),
  operator_id uuid,
  operator_name text,
  start_date date not null,
  end_date date,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_reservations_user on reservations(user_id, start_date desc);

alter table reservations enable row level security;

drop policy if exists reservations_owner_all on reservations;
create policy reservations_owner_all on reservations
  for all using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid());

drop trigger if exists trg_reservations_updated_at on reservations;
create trigger trg_reservations_updated_at before update on reservations
  for each row execute function set_updated_at();
