import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Race Split Planner — Even & Negative Split Calculator",
  description: "Plan your race splits with even or negative split strategies. Get a detailed split table for 5K, 10K, half marathon and marathon. Free split calculator.",
  alternates: { canonical: "/tools/splits" },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
