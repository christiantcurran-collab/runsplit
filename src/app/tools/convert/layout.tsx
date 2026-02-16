import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Running Pace Converter â€” min/km, min/mi, km/h, mph",
  description: "Instantly convert between running pace and speed units. min/km to min/mile, km/h to mph, and m/s. Essential tool for runners switching between metric and imperial.",
  alternates: { canonical: "/tools/convert" },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
