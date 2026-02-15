import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Running Speed & Pace Converter — min/km to min/mile",
  description: "Free running pace converter. Instantly convert between min/km, min/mile, km/h, mph and m/s. Essential tool for runners switching between metric and imperial.",
  alternates: { canonical: "/calculators/speed-converter" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
