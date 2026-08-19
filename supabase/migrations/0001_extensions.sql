-- DiveFinder — 0001: extensions
-- pgcrypto: gen_random_uuid() for primary keys.
-- postgis: geography columns + spatial queries (nearest destination, map bounding boxes).
-- On self-hosted Postgres without PostGIS available, comment out the postgis line and
-- the `geom geography(Point,4326)` columns below still create fine as long as the
-- postgis type is not referenced — see docs/data-model.md for the non-PostGIS fallback
-- (latitude/longitude numeric columns are always present and are enough to run the app).
create extension if not exists pgcrypto;
create extension if not exists postgis;
