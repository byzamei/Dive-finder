-- DiveFinder — 0014: liveaboards need an outbound booking link, same as
-- dive_centers already has. Without it, a real liveaboard entry has no way
-- to send a diver to book it — see docs/operators.md.
alter table liveaboards add column if not exists website text;
