"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { removeFavorite } from "@/lib/services/favoriteService";
import { createSavedList, deleteSavedList, moveFavoriteToList } from "@/lib/services/savedListsService";
import type { SavedList } from "@/lib/types/domain";
import { Card, CardBody } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { DemoDataBadge } from "@/components/badges/DataBadges";

export interface SavedItem {
  favoriteId: string;
  entityType: "destination" | "site";
  entityId: string;
  listId: string | null;
  name: string;
  slug: string;
  demoData: boolean;
}

export function SavedListsBoard({
  userId,
  initialItems,
  initialLists,
}: {
  userId: string;
  initialItems: SavedItem[];
  initialLists: SavedList[];
}) {
  const [items, setItems] = useState(initialItems);
  const [lists, setLists] = useState(initialLists);
  const [activeTab, setActiveTab] = useState<"all" | "unsorted" | string>("all");
  const [newListName, setNewListName] = useState("");
  const [creating, setCreating] = useState(false);

  const visibleItems = useMemo(() => {
    if (activeTab === "all") return items;
    if (activeTab === "unsorted") return items.filter((i) => !i.listId);
    return items.filter((i) => i.listId === activeTab);
  }, [items, activeTab]);

  async function handleCreateList(e: React.FormEvent) {
    e.preventDefault();
    const name = newListName.trim();
    if (!name) return;
    setCreating(true);
    const supabase = createClient();
    try {
      const list = await createSavedList(supabase, userId, name);
      setLists((ls) => [...ls, list]);
      setNewListName("");
      setActiveTab(list.id);
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteList(listId: string) {
    const supabase = createClient();
    await deleteSavedList(supabase, listId);
    setLists((ls) => ls.filter((l) => l.id !== listId));
    setItems((its) => its.map((i) => (i.listId === listId ? { ...i, listId: null } : i)));
    if (activeTab === listId) setActiveTab("all");
  }

  async function handleMove(favoriteId: string, listId: string | null) {
    setItems((its) => its.map((i) => (i.favoriteId === favoriteId ? { ...i, listId } : i)));
    const supabase = createClient();
    await moveFavoriteToList(supabase, favoriteId, listId);
  }

  async function handleRemove(item: SavedItem) {
    setItems((its) => its.filter((i) => i.favoriteId !== item.favoriteId));
    const supabase = createClient();
    await removeFavorite(supabase, userId, item.entityType, item.entityId);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`focus-ring rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
            activeTab === "all" ? "bg-ocean-600 text-white" : "bg-abyss-100 text-abyss-700 hover:bg-abyss-200"
          }`}
        >
          All ({items.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("unsorted")}
          className={`focus-ring rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
            activeTab === "unsorted" ? "bg-ocean-600 text-white" : "bg-abyss-100 text-abyss-700 hover:bg-abyss-200"
          }`}
        >
          Unsorted ({items.filter((i) => !i.listId).length})
        </button>
        {lists.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => setActiveTab(l.id)}
            className={`focus-ring rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              activeTab === l.id ? "bg-ocean-600 text-white" : "bg-abyss-100 text-abyss-700 hover:bg-abyss-200"
            }`}
          >
            {l.name} ({items.filter((i) => i.listId === l.id).length})
          </button>
        ))}
      </div>

      <form onSubmit={handleCreateList} className="mt-4 flex gap-2">
        <input
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          placeholder="New list name (e.g. Bucket list)"
          className="focus-ring w-full max-w-xs rounded-lg border border-abyss-200 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={creating || !newListName.trim()}
          className="focus-ring shrink-0 rounded-lg border border-abyss-200 px-3 py-2 text-sm font-medium text-abyss-700 hover:bg-abyss-50 disabled:opacity-50"
        >
          + New list
        </button>
      </form>

      {activeTab !== "all" && activeTab !== "unsorted" && (
        <button
          type="button"
          onClick={() => handleDeleteList(activeTab)}
          className="focus-ring mt-2 text-xs text-coral-600 underline"
        >
          Delete this list (items stay in Unsorted)
        </button>
      )}

      {visibleItems.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Nothing here yet"
            description="Save destinations or sites from your search results, then organize them into lists."
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {visibleItems.map((item) => (
            <Card key={item.favoriteId}>
              <CardBody>
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={item.entityType === "destination" ? `/destinations/${item.slug}` : `/sites/${item.slug}`}
                    className="focus-ring flex items-center gap-2"
                  >
                    <p className="font-display text-lg text-abyss-900 hover:underline">{item.name}</p>
                    {item.demoData && <DemoDataBadge />}
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleRemove(item)}
                    aria-label={`Remove ${item.name}`}
                    className="focus-ring shrink-0 text-abyss-300 hover:text-coral-600"
                  >
                    ✕
                  </button>
                </div>
                <p className="mt-1 text-xs uppercase tracking-wide text-abyss-400">{item.entityType}</p>
                <div className="mt-3">
                  <Select
                    value={item.listId ?? ""}
                    onChange={(e) => handleMove(item.favoriteId, e.target.value || null)}
                    className="py-1.5 text-xs"
                  >
                    <option value="">Unsorted</option>
                    {lists.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
