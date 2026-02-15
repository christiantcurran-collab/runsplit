import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Age-Graded Running Calculator — How Good Is My Time?",
  description: "See how good your running time really is with age-graded performance percentage based on WMA/World Athletics standards. Compare your time fairly across ages and genders.",
  alternates: { canonical: "/tools/age-grade" },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
