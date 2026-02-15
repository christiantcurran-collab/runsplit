import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — AI Training Plans from £4.99/mo",
  description:
    "Free running tools forever. Upgrade to RunSplit Pro for AI-powered personalised training plans, Strava integration, weekly email summaries, and race day strategy. From £4.99/month. Cancel anytime.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "RunSplit Pricing — AI Training Plans from £4.99/mo",
    description: "Free running tools forever. Upgrade to Pro for AI-powered plans, Strava sync, and coaching.",
    url: "/pricing",
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

