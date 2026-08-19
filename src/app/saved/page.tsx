import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { listFavorites } from "@/lib/services/favoriteService";
import { listSavedLists } from "@/lib/services/savedListsService";
import { SavedListsBoard, type SavedItem } from "@/components/profile/SavedListsBoard";
import type { Destination, DiveSite } from "@/lib/types/domain";

export default async function SavedPage() {
  await requireUser();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [favorites, lists] = await Promise.all([
    listFavorites(supabase, user!.id),
    listSavedLists(supabase, user!.id),
  ]);

  const destinationIds = favorites.filter((f) => f.entity_type === "destination").map((f) => f.entity_id);
  const siteIds = favorites.filter((f) => f.entity_type === "site").map((f) => f.entity_id);

  const [{ data: destinations }, { data: sites }] = await Promise.all([
    destinationIds.length
      ? supabase.from("destinations").select("*").in("id", destinationIds)
      : Promise.resolve({ data: [] as Destination[] }),
    siteIds.length
      ? supabase.from("dive_sites").select("*").in("id", siteIds)
      : Promise.resolve({ data: [] as DiveSite[] }),
  ]);

  const destinationById = new Map((destinations ?? []).map((d) => [d.id, d as Destination]));
  const siteById = new Map((sites ?? []).map((s) => [s.id, s as DiveSite]));

  const items: SavedItem[] = favorites
    .map((f) => {
      const entity = f.entity_type === "destination" ? destinationById.get(f.entity_id) : siteById.get(f.entity_id);
      if (!entity) return null;
      return {
        favoriteId: f.id,
        entityType: f.entity_type,
        entityId: f.entity_id,
        listId: f.list_id,
        name: entity.name,
        slug: entity.slug,
        demoData: entity.demo_data,
      };
    })
    .filter((i): i is SavedItem => i !== null);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-display text-3xl text-abyss-900">Saved</h1>
      <p className="mt-2 text-abyss-500">Organize your saved destinations and sites into lists.</p>

      <div className="mt-8">
        <SavedListsBoard userId={user!.id} initialItems={items} initialLists={lists} />
      </div>
    </main>
  );
}
