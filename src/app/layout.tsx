import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Finara — Smart Finance Tracker",
  description:
    "Real-time overview of your financial health: income, expenses, budgets, investments, goals and AI-powered insights.",
  keywords: ["finance", "budget", "expenses", "income", "investments", "savings goals", "AI finance coach"],
  icons: {
    icon: "/finara-icon.svg",
  },
  openGraph: {
    title: "Finara — Smart Finance Tracker",
    description: "Track income, expenses, budgets, investments and goals with AI-powered insights.",
    siteName: "Finara",
    type: "website",
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
