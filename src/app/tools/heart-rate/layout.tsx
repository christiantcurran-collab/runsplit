import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Heart Rate Zone Calculator â€” 5-Zone Training Zones",
  description: "Calculate your 5 heart rate training zones using the Karvonen method. Enter your resting and max heart rate to get personalised zones. Free calculator.",
  alternates: { canonical: "/tools/heart-rate" },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
