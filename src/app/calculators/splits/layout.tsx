import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Split Time Calculator â€” Race Splits & Pacing Strategy",
  description: "Free split time calculator for runners. Plan even or negative splits for any race distance. Get a detailed pacing table for 5K, 10K, half marathon, and marathon.",
  alternates: { canonical: "/calculators/splits" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}



