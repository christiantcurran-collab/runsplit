import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Treadmill to Outdoor Pace Converter â€” Speed & Incline",
  description: "Convert treadmill speed and incline to equivalent outdoor running pace. Understand your true effort level when running on a treadmill. Free converter tool.",
  alternates: { canonical: "/tools/treadmill" },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
