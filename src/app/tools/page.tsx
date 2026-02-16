import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "12 Free Running Tools — Pace, Splits, VO2max & More",
  description:
    "12 free running tools: pace calculator, race time predictor, split planner, training paces, VO2max estimator, heart rate zones, calories burned, treadmill converter and more. No signup required.",
  alternates: { canonical: "/tools" },
  openGraph: {
    title: "12 Free Running Tools — RunSplit",
    description: "Pace calculator, race predictor, split planner, VO2max, heart rate zones and more. Free, instant, no signup.",
    url: "/tools",
  },
};

const tools = [
  { href: "/tools/pace", title: "Pace & Speed", desc: "Distance + time = pace. Instant results for any distance.", icon: "01" },
  { href: "/tools/predict", title: "What Can I Run?", desc: "Predict your race time from a recent result. Riegel & Cameron.", icon: "02" },
  { href: "/tools/splits", title: "Race Split Planner", desc: "Plan your race splits. Even or negative split strategies.", icon: "03" },
  { href: "/tools/training-paces", title: "Find My Training Paces", desc: "Easy, tempo, interval and rep paces from your race.", icon: "04" },
  { href: "/tools/convert", title: "Pace Converter", desc: "Convert between min/km, min/mi, km/h, mph instantly.", icon: "05" },
  { href: "/tools/age-grade", title: "How Good Is My Time?", desc: "Age-graded performance rating using WMA factors.", icon: "06" },
  { href: "/tools/vo2max", title: "Estimate My VO2max", desc: "VO2max and fitness classification from any race.", icon: "07" },
  { href: "/tools/heart-rate", title: "My Heart Rate Zones", desc: "5-zone heart rate training with Karvonen method.", icon: "08" },
  { href: "/tools/calories", title: "Calories Burned", desc: "Estimate calories from distance, weight and pace.", icon: "09" },
  { href: "/tools/treadmill", title: "Treadmill vs Outdoor", desc: "Convert treadmill speed/incline to outdoor effort.", icon: "10" },
  { href: "/tools/negative-split", title: "Negative Split Strategy", desc: "Start slower, finish stronger. Plan your half splits.", icon: "11" },
  { href: "/tools/run-walk", title: "Run/Walk Planner", desc: "Plan run/walk intervals for any distance and goal.", icon: "12" },
];

export default function ToolsPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-bg-dark text-text-on-dark py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl tracking-tight mb-4">
            Free Running Tools
          </h1>
          <p className="text-text-dark-sec text-lg max-w-xl mx-auto">
            12 tools. Instant results. No signup. No limits. Built for runners who want real answers.
          </p>
        </div>
      </section>

      {/* Tools grid */}
      <section className="bg-bg-page py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group bg-bg-card rounded-xl border border-[#E4E4E8] p-6 hover:border-brand/40 hover:shadow-lg transition-all"
              >
                <span className="font-mono text-xs font-bold text-brand/50 tracking-wider">{tool.icon}</span>
                <h2 className="font-heading font-bold text-lg text-text-primary mt-2 mb-1 group-hover:text-brand transition-colors">
                  {tool.title}
                </h2>
                <p className="text-sm text-text-secondary leading-relaxed">{tool.desc}</p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-brand mt-4 group-hover:gap-2 transition-all">
                  Open tool
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}




