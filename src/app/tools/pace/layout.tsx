import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Running Pace & Speed Calculator — Free & Instant",
  description: "Calculate your running pace, speed, finish time and equivalent race times for any distance. Enter any two values to get the third. Free, instant, no signup required.",
  alternates: { canonical: "/tools/pace" },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
