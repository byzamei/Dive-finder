import type { Metadata } from "next";
import { DiscoverWizard } from "@/components/discover/DiscoverWizard";

export const metadata: Metadata = {
  title: "Search",
  description: "Tell us your dates, budget, level and the wildlife you want to see.",
};

export default function SearchPage() {
  return <DiscoverWizard />;
}
