import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Heart Rate Zone Calculator — 5-Zone Karvonen Method",
  description: "Free heart rate zone calculator. Calculate your 5 training zones using the Karvonen method. Enter resting and max heart rate for personalised zones.",
  alternates: { canonical: "/calculators/heart-rate-zones" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}



