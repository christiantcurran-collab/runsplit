import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Training Pace Calculator — Easy, Tempo & Interval Paces",
  description: "Calculate your easy, marathon, tempo, threshold, interval and repetition training paces from a recent race result. Based on Jack Daniels VDOT methodology. Free tool.",
  alternates: { canonical: "/tools/training-paces" },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
