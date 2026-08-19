import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TopNav } from "@/components/nav/TopNav";
import { BottomNav } from "@/components/nav/BottomNav";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "DiveFinder — Where should you dive next?",
    template: "%s · DiveFinder",
  },
  description:
    "DiveFinder is an independent, explainable dive destination recommendation engine — not a booking marketplace.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DiveFinder",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0e1725",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TopNav />
        <div className="pb-20 md:pb-0" style={{ paddingBottom: "calc(5rem + var(--safe-area-bottom))" }}>
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
        <BottomNav />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
