import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Running Pace Calculator | Calculate Your Race Pace & Speed | RunSplit",
  description: "Free running pace calculator. Calculate your pace per km/mile, speed, and finish time for any distance. Instant results for 5K, 10K, half marathon, marathon and custom distances.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}


