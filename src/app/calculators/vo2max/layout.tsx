import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VO2max Calculator â€” Estimate VO2max from Race Time",
  description: "Free VO2max estimator for runners. Calculate your VO2max from any race result using the Daniels & Gilbert formula. Compare against age and gender norms.",
  alternates: { canonical: "/calculators/vo2max" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}



