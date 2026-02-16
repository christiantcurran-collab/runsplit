import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Treadmill Pace Converter â€” Treadmill Speed to Outdoor Pace",
  description: "Free treadmill pace converter. Convert treadmill speed and incline to equivalent outdoor running pace. Reference table for common speeds at different gradients.",
  alternates: { canonical: "/calculators/treadmill" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}



