import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Calories Burned Running Calculator â€” Free Estimate",
  description: "Estimate how many calories you burn running based on distance, body weight, and pace. Uses MET values from the Compendium of Physical Activities for accuracy.",
  alternates: { canonical: "/tools/calories" },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
