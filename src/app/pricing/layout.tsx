import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | RunSplit Pro — AI Training Plans for Runners",
  description:
    "Free running tools forever. Upgrade to RunSplit Pro for AI-powered training plans, Strava integration, weekly summaries, and more. £4.99/month.",
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

