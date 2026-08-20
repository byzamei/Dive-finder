-- DiveFinder — 0016: dive_centers needs a description field (liveaboards
-- already has itinerary_notes; dive_centers had nothing, which would have
-- thrown away real, sourced operator descriptions found during research —
-- see docs/operators.md). Also makes data_sources.name unique so the
-- weekly operator-refresh routine can upsert sources idempotently.
alter table dive_centers add column if not exists notes text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'data_sources_name_key') then
    alter table data_sources add constraint data_sources_name_key unique (name);
  end if;
end $$;
