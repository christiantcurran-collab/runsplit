import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Race Time Predictor — Predict Marathon, 5K, 10K Times",
  description: "Free race time predictor. Predict your finish time for any distance from a recent race result. Uses Riegel and Cameron formulas. Works for 5K to ultramarathon.",
  alternates: { canonical: "/calculators/race-predictor" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
