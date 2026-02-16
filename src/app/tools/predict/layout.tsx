import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Race Time Predictor â€” Predict 5K, 10K, Half & Marathon Times",
  description: "Predict your race time for any distance from a recent result. Uses Riegel and Cameron formulas. Free race time prediction tool for 5K, 10K, half marathon and marathon.",
  alternates: { canonical: "/tools/predict" },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
