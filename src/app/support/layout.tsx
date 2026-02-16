import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Get help with RunSplit. Browse FAQs or send a message to our AI-powered support team for instant answers.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || "https://runsplit.co"}/support`,
  },
};

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


