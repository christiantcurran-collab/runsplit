import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "RunSplit — Running Pace Calculator & Training Tools",
  description:
    "Free running calculators for pace, race predictions, splits, VO2max, training zones and more. Modern tools built for runners.",
  keywords: [
    "running pace calculator",
    "race time predictor",
    "running split calculator",
    "training pace calculator",
    "VO2max calculator",
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://runsplit.co"),
  openGraph: {
    title: "RunSplit — Running Pace Calculator & Training Tools",
    description:
      "Free running calculators for pace, race predictions, splits, VO2max, training zones and more.",
    url: "https://runsplit.co",
    siteName: "RunSplit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RunSplit — Running Pace Calculator & Training Tools",
    description:
      "Free running calculators for pace, race predictions, splits, VO2max, training zones and more.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
