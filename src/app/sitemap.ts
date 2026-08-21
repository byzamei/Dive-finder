import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

// Strip a trailing slash — NEXT_PUBLIC_SITE_URL is easy to enter with one
// (e.g. copy-pasted straight from a browser address bar), and every route
// below is built as `${SITE_URL}${path}` with a leading slash already in
// path, so an untrimmed trailing slash would double up into "//".
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

const STATIC_ROUTES = ["", "/search", "/explore", "/gear", "/gear/mask-finder", "/map", "/sites", "/wildlife"];

// Plain anon-key client (no cookies, no session) — sitemap generation is
// anonymous and only ever reads what's already public under RLS, same as
// every client component that browses the catalog signed out.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  if (!isSupabaseConfigured) return staticRoutes;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const [{ data: destinations }, { data: sites }, { data: species }] = await Promise.all([
    supabase.from("destinations").select("slug, updated_at").eq("status", "published").eq("demo_data", false),
    supabase.from("dive_sites").select("slug, updated_at").eq("status", "published").eq("demo_data", false),
    supabase.from("marine_species").select("slug, updated_at"),
  ]);

  const destinationRoutes: MetadataRoute.Sitemap = (
    (destinations ?? []) as { slug: string; updated_at: string | null }[]
  ).map((d) => ({
    url: `${SITE_URL}/destinations/${d.slug}`,
    lastModified: d.updated_at ? new Date(d.updated_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const siteRoutes: MetadataRoute.Sitemap = ((sites ?? []) as { slug: string; updated_at: string | null }[]).map(
    (s) => ({
      url: `${SITE_URL}/sites/${s.slug}`,
      lastModified: s.updated_at ? new Date(s.updated_at) : undefined,
      changeFrequency: "monthly",
      priority: 0.6,
    })
  );

  const speciesRoutes: MetadataRoute.Sitemap = (
    (species ?? []) as { slug: string; updated_at: string | null }[]
  ).map((s) => ({
    url: `${SITE_URL}/wildlife/${s.slug}`,
    lastModified: s.updated_at ? new Date(s.updated_at) : undefined,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...destinationRoutes, ...siteRoutes, ...speciesRoutes];
}
