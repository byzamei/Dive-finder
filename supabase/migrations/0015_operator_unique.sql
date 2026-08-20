-- DiveFinder — 0015: uniqueness for operator upserts.
-- The weekly operator-refresh routine (see docs/operators.md) needs to
-- re-run its inserts safely without creating duplicate rows every week —
-- these constraints let it use `on conflict (destination_id, name) do
-- update` instead of blind inserts.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'dive_centers_destination_name_key') then
    alter table dive_centers add constraint dive_centers_destination_name_key unique (destination_id, name);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'liveaboards_destination_name_key') then
    alter table liveaboards add constraint liveaboards_destination_name_key unique (destination_id, name);
  end if;
end $$;
