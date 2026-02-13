import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Heart Rate Zone Calculator | Running HR Zones | RunSplit",
  description: "Free heart rate zone calculator for runners. Calculate your 5 training zones using the Karvonen method. Includes age-based max HR estimation with the Tanaka formula.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

