import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Running Calories Calculator — Calories Burned Running",
  description: "Free running calories calculator. Estimate calories burned while running based on your weight, distance, and pace. Uses MET-based calculation from the Compendium of Physical Activities.",
  alternates: { canonical: "/calculators/calories" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}



