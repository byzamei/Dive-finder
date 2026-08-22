"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { FeedEntry } from "@/lib/services/socialFeedService";
import { giveKudos, removeKudos, getKudosSummary } from "@/lib/services/kudosService";
import { listComments, addComment, type DiveCommentWithAuthor } from "@/lib/services/commentService";
import { listPhotosForEntry, getSignedPhotoUrls } from "@/lib/services/divePhotoService";
import type { DiveLogPhoto } from "@/lib/types/domain";
import { StarRating } from "@/components/reviews/StarRating";
import { Button } from "@/components/ui/Button";

function formatDiveDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function DivePostCard({ entry, viewerId }: { entry: FeedEntry; viewerId: string | null }) {
  const [photos, setPhotos] = useState<DiveLogPhoto[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Map<string, string>>(new Map());
  const [kudosCount, setKudosCount] = useState(0);
  const [gaveKudos, setGaveKudos] = useState(false);
  const [kudosPending, setKudosPending] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<DiveCommentWithAuthor[] | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    listPhotosForEntry(supabase, entry.id).then(async (p) => {
      setPhotos(p);
      setPhotoUrls(await getSignedPhotoUrls(supabase, p));
    });
    getKudosSummary(supabase, [entry.id], viewerId).then((summary) => {
      const mine = summary.get(entry.id);
      setKudosCount(mine?.count ?? 0);
      setGaveKudos(mine?.viewerGaveKudos ?? false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.id]);

  async function toggleKudos() {
    if (!viewerId || kudosPending) return;
    setKudosPending(true);
    setActionError(null);
    const supabase = createClient();
    try {
      if (gaveKudos) {
        await removeKudos(supabase, entry.id, viewerId);
        setGaveKudos(false);
        setKudosCount((c) => Math.max(0, c - 1));
      } else {
        await giveKudos(supabase, entry.id, viewerId);
        setGaveKudos(true);
        setKudosCount((c) => c + 1);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Couldn't send kudos");
    } finally {
      setKudosPending(false);
    }
  }

  async function openComments() {
    setCommentsOpen(true);
    if (comments !== null) return;
    const supabase = createClient();
    setComments(await listComments(supabase, entry.id));
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!viewerId || !commentDraft.trim() || commentSubmitting) return;
    setCommentSubmitting(true);
    setActionError(null);
    const supabase = createClient();
    try {
      await addComment(supabase, entry.id, viewerId, commentDraft.trim());
      setCommentDraft("");
      setComments(await listComments(supabase, entry.id));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Couldn't post that comment");
    } finally {
      setCommentSubmitting(false);
    }
  }

  const place = entry.site_name_resolved ?? entry.destination_name;

  return (
    <div className="rounded-xl2 border border-abyss-100 bg-white p-4 shadow-card sm:p-5">
      <div className="flex items-center gap-3">
        <Link href={`/divers/${entry.author_id}`} className="focus-ring shrink-0">
          {entry.author_avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={entry.author_avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ocean-50 font-display text-ocean-700">
              {(entry.author_display_name ?? "?").charAt(0).toUpperCase()}
            </div>
          )}
        </Link>
        <div className="min-w-0">
          <Link href={`/divers/${entry.author_id}`} className="focus-ring truncate font-medium text-abyss-900 hover:underline">
            {entry.author_display_name ?? "A diver"}
          </Link>
          <p className="text-xs text-abyss-400">{formatDiveDate(entry.dive_date)}</p>
        </div>
        {entry.rating != null && (
          <div className="ml-auto shrink-0">
            <StarRating value={entry.rating} />
          </div>
        )}
      </div>

      <div className="mt-3">
        {place && <p className="font-display text-lg text-abyss-900">{place}</p>}
        {entry.notes && <p className="mt-1 text-sm text-abyss-700">{entry.notes}</p>}
      </div>

      {photos.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {photos.map((p) =>
            photoUrls.get(p.id) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={p.id} src={photoUrls.get(p.id)} alt="" className="h-32 w-full rounded-lg object-cover" />
            ) : null
          )}
        </div>
      )}

      <div className="mt-4 flex items-center gap-4 border-t border-abyss-100 pt-3 text-sm">
        <button
          type="button"
          onClick={toggleKudos}
          disabled={!viewerId || kudosPending}
          className={`focus-ring flex items-center gap-1.5 font-medium disabled:opacity-50 ${gaveKudos ? "text-coral-600" : "text-abyss-500"}`}
        >
          <KudosIcon filled={gaveKudos} className="h-4 w-4" />
          {kudosCount > 0 ? kudosCount : "Kudos"}
        </button>
        <button type="button" onClick={openComments} className="focus-ring font-medium text-abyss-500">
          {comments ? `${comments.length} comment${comments.length === 1 ? "" : "s"}` : "Comments"}
        </button>
        {actionError && <span className="text-coral-600">{actionError}</span>}
      </div>

      {commentsOpen && (
        <div className="mt-3 space-y-2.5 border-t border-abyss-100 pt-3">
          {comments === null && <p className="text-sm text-abyss-400">Loading…</p>}
          {comments?.map((c) => (
            <div key={c.id} className="text-sm">
              <span className="font-medium text-abyss-900">{c.author_display_name ?? "A diver"}</span>{" "}
              <span className="text-abyss-700">{c.body}</span>
            </div>
          ))}
          {viewerId && (
            <form onSubmit={submitComment} className="flex gap-2">
              <input
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                placeholder="Add a comment…"
                className="focus-ring flex-1 rounded-lg border border-abyss-200 px-3 py-1.5 text-sm"
              />
              <Button type="submit" size="sm" disabled={commentSubmitting || !commentDraft.trim()}>
                Post
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function KudosIcon({ filled, ...props }: { filled: boolean } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.75} {...props}>
      <path d="M7 21V10M2 12v9a1 1 0 001 1h3V10H3a1 1 0 00-1 1V10zM7 10l4.5-7a2 2 0 013 1.5V9h4.5a2 2 0 011.95 2.45l-1.8 8A2 2 0 0117.24 21H7" />
    </svg>
  );
}
