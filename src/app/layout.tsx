import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "RunSplit — AI Running Coach & Training Tools",
  description:
    "AI-powered pacing, race predictions, and custom training plans for runners. Free tools, Strava integration, and personalised coaching.",
  keywords: [
    "running pace calculator",
    "AI running coach",
    "race time predictor",
    "training plan generator",
    "running split calculator",
    "VO2max calculator",
    "Strava training plan",
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://runsplit.co"),
  openGraph: {
    title: "RunSplit — AI Running Coach & Training Tools",
    description:
      "AI-powered pacing, race predictions, and custom training plans for runners who take it seriously.",
    url: "https://runsplit.co",
    siteName: "RunSplit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RunSplit — AI Running Coach & Training Tools",
    description:
      "AI-powered pacing, race predictions, and custom training plans for runners who take it seriously.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased font-body">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
