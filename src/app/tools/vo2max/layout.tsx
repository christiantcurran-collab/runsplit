import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "VO2max Estimator — Calculate VO2max from Race Time",
  description: "Estimate your VO2max from any race result using the Jack Daniels & Gilbert formula. See your fitness classification and how you compare. Free VO2max calculator.",
  alternates: { canonical: "/tools/vo2max" },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
