import { redirect } from "next/navigation";

// Renamed to /search — this stub exists only so old links/bookmarks still land somewhere.
export default function DiscoverRedirect() {
  redirect("/search");
}
