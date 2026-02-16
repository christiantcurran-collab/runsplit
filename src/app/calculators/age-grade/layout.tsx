import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Age-Graded Running Calculator â€” Performance Rating",
  description: "Free age-graded running calculator. See your performance percentage based on WMA/World Athletics standards. Compare your time fairly across ages and genders.",
  alternates: { canonical: "/calculators/age-grade" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}



