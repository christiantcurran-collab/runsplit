import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Age-Graded Running Calculator | Compare Performance by Age | RunSplit",
  description: "Free age-graded running calculator. Compare your race performance across ages and genders using World Masters Athletics factors. See your age-graded percentage and level.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

