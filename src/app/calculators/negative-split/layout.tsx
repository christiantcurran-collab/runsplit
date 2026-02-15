import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Negative Split Calculator — Race Pacing Strategy",
  description: "Free negative split calculator. Plan a negative split race strategy with detailed split tables. Run the second half faster for a strong finish.",
  alternates: { canonical: "/calculators/negative-split" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
