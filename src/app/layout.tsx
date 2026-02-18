import type { Metadata } from "next";
import Script from "next/script";
import { Sora, DM_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { AuthProvider } from "@/components/AuthProvider";

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://runsplit.co";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "RunSplit — AI Running Coach & Free Training Tools",
    template: "%s | RunSplit",
  },
  description:
    "Free running pace calculator, race time predictor, training plan generator and 12 more tools. Upgrade to Pro for AI-powered personalised coaching, Strava sync, and custom plans.",
  keywords: [
    "running pace calculator",
    "AI running coach",
    "race time predictor",
    "training plan generator",
    "running split calculator",
    "VO2max calculator",
    "Strava training plan",
    "running training plan",
    "marathon training plan",
    "half marathon plan",
    "5K training",
    "10K training",
    "negative split calculator",
    "heart rate zone calculator",
    "calories burned running",
    "treadmill pace converter",
    "free running tools",
  ],
  authors: [{ name: "RunSplit" }],
  creator: "RunSplit",
  publisher: "RunSplit",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "RunSplit — AI Running Coach & Free Training Tools",
    description:
      "Free running pace calculator, race predictor, and 12 more tools. Upgrade for AI-powered personalised training plans and Strava integration.",
    url: siteUrl,
    siteName: "RunSplit",
    locale: "en_GB",
    type: "website",
    images: [
      {
        url: "/images/runner-male.webp",
        width: 800,
        height: 1000,
        alt: "Runner training in the city — RunSplit AI Running Coach",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RunSplit — AI Running Coach & Free Training Tools",
    description:
      "Free running pace calculator, race predictor, and 12 more tools. Upgrade for AI-powered personalised training plans.",
    images: ["/images/runner-male.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your Google Search Console verification ID here
    // google: "your-google-verification-id",
  },
};

// JSON-LD structured data for the site
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "RunSplit",
  url: siteUrl,
  description:
    "AI-powered running coach with free pace calculators, race time predictors, training plan generators and 12 more tools for runners.",
  applicationCategory: "SportsApplication",
  operatingSystem: "Web",
  offers: [
    {
      "@type": "Offer",
      name: "Free",
      price: "0",
      priceCurrency: "GBP",
      description: "12 free running tools and 5 sample training plans",
    },
    {
      "@type": "Offer",
      name: "Pro Monthly",
      price: "4.99",
      priceCurrency: "GBP",
      description: "AI training plans, Strava sync, weekly summaries, race strategy — monthly billing",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "4.99",
        priceCurrency: "GBP",
        billingDuration: "P1M",
      },
    },
    {
      "@type": "Offer",
      name: "Pro Annual",
      price: "35.88",
      priceCurrency: "GBP",
      description: "AI training plans, Strava sync, weekly summaries, race strategy — annual billing (£2.99/mo)",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "35.88",
        priceCurrency: "GBP",
        billingDuration: "P1Y",
      },
    },
  ],
  creator: {
    "@type": "Organization",
    name: "RunSplit",
    url: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-02YQ2NRL09";

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="canonical" href={siteUrl} />
      </head>
      <body className={`min-h-screen flex flex-col antialiased font-body ${sora.variable} ${dmSans.variable} ${ibmPlexMono.variable}`}>
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>

        {/* Google Analytics */}
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', {
                  page_title: document.title,
                  send_page_view: true,
                });
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}

