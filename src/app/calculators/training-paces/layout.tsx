import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Training Pace Calculator â€” Easy, Tempo & Interval Paces",
  description: "Free training pace calculator. Get your easy, marathon, tempo, interval and repetition training paces from a recent race result. Based on Jack Daniels methodology.",
  alternates: { canonical: "/calculators/training-paces" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}



