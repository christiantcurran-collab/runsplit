import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Run/Walk Calculator â€” Galloway Method Interval Planner",
  description: "Plan run/walk intervals for any distance. Calculate your total finish time using the Galloway method. Perfect for Couch to 5K and beginner runners. Free tool.",
  alternates: { canonical: "/tools/run-walk" },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
