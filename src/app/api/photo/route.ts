import { NextResponse } from "next/server";
import { searchDestinationPhoto } from "@/lib/services/photoService";

// Thin proxy so client components (SearchInspiration) can request a photo
// without the Pexels API key ever reaching the browser.
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q");
  if (!query) return NextResponse.json({ photo: null });

  const photo = await searchDestinationPhoto(query);
  return NextResponse.json({ photo });
}
