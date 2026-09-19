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
 * Head metadata (round 17, live-probed 2026-09-19).
 *
 * The live app's <head> carries theme-color #000000,
 * viewport-fit=cover, its exact description text, the Finara logo as the
 * favicon/apple-touch-icon, the apple-mobile-web-* PWA metas, and
 * per-route og:title/og:url (provided by buildRouteMetadata in the page
 * files). The live's manifest.json link 302s to nothing (a broken base44
 * template asset) and is deliberately NOT replicated.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteBaseUrl()),
  title: "Finara — Smart Finance Tracker",
  description: SITE_DESCRIPTION,
  keywords: ["finance", "budget", "expenses", "income", "investments", "savings goals", "AI finance coach"],
  icons: {
    icon: "/finara-logo.png",
    apple: "/finara-logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: "Finara",
  },
  openGraph: {
    siteName: "Finara",
    type: "website",
    images: [{ url: "/finara-logo.png", width: 480, height: 480 }],
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
