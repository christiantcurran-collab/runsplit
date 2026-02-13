import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Race Time Predictor | Predict Marathon, 5K, 10K Times | RunSplit",
  description: "Free race time predictor. Predict your finish time for any distance from a recent race result. Uses Riegel and Cameron formulas. Works for 5K to ultramarathon.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

