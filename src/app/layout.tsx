import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SITE_DESCRIPTION, siteBaseUrl } from "@/lib/route-metadata";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

/**
 * Head metadata (round 17, live-probed 2026-09-19; per-route structure
 * re-pinned round 18, same day).
 *
 * The layout carries the SHARED head: the plain viewport, the exact
 * description text, the bare Finara-logo icon link, and the
 * apple-mobile-web-* PWA metas. Per-route fields come from
 * buildRouteMetadata/buildRouteViewport in the page files — round 18
 * moved theme-color + viewport-fit=cover, the apple-touch-icon, and the
 * og:image dims/alt to the LOGIN route only (live-probed). The live's
 * manifest.json link 302s to nothing (a broken base44 template asset)
 * and is deliberately NOT replicated, as is its app-page icon
 * `type="image/svg+xml"` mislabel (the href is a PNG).
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteBaseUrl()),
  title: "Finara — Smart Finance Tracker",
  description: SITE_DESCRIPTION,
  icons: {
    icon: "/finara-logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: "Finara",
  },
  openGraph: {
    siteName: "Finara",
    type: "website",
    images: [{ url: "/finara-logo.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
