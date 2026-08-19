import type { Metadata } from "next";
import { MaskFinderFlow } from "@/components/gear/MaskFinderFlow";

export const metadata: Metadata = {
  title: "Mask Finder",
  description: "Find a dive mask shape that suits your face — an on-device face scan, no photos ever leave your device.",
};

export default function MaskFinderPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <MaskFinderFlow />
    </main>
  );
}
