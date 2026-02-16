import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Running Coach | Get Your Personalised Plan | RunSplit",
  description:
    "Get a running plan built for your goal, your pace, and your life. AI coaching that adapts every week. From £4.99/mo.",
};

export default function StartLayout({ children }: { children: React.ReactNode }) {
  // No navbar or footer — clean landing page for paid traffic
  return <>{children}</>;
}

