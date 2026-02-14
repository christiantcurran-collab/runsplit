import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Run/Walk Calculator | Run Walk Interval Timer | RunSplit",
  description: "Free run/walk calculator. Calculate your total time using run/walk intervals. Perfect for Couch-to-5K, Galloway method, and beginner runners.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}


