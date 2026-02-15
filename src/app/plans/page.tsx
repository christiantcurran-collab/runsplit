import Link from "next/link";
import type { Metadata } from "next";
import { SAMPLE_PLANS } from "@/lib/sample-plans";

export const metadata: Metadata = {
  title: "Free Training Plans — 5K, 10K, Half Marathon & Marathon",
  description:
    "Browse 5 free training plans for Couch to 5K, beginner 10K, intermediate half marathon, intermediate marathon, and sub-25 5K. Want a plan customised to you? Upgrade to RunSplit Pro.",
  alternates: { canonical: "/plans" },
  openGraph: {
    title: "Free Running Training Plans — RunSplit",
    description: "Free training plans for 5K, 10K, half marathon and marathon. From beginner to advanced.",
    url: "/plans",
  },
};

const LEVEL_COLORS = {
  Beginner: "bg-green-400/10 text-green-400",
  Intermediate: "bg-brand/10 text-brand-hover",
  Advanced: "bg-purple-400/10 text-purple-400",
};

export default function PlansPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-bg-dark text-text-on-dark py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl tracking-tight mb-4">
            Free Training Plans
          </h1>
          <p className="text-text-dark-sec text-lg max-w-xl mx-auto">
            Browse our sample plans to get started. Want something built around your
            fitness, schedule, and goals?{" "}
            <Link href="/pricing" className="text-brand hover:text-brand-hover font-medium transition-colors">
              Upgrade to Pro
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Plans grid */}
      <section className="bg-bg-page py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SAMPLE_PLANS.map((plan) => (
              <Link
                key={plan.slug}
                href={`/plans/${plan.slug}`}
                className="group bg-bg-card rounded-2xl border border-[#E4E4E8] p-6 hover:border-brand/40 hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${LEVEL_COLORS[plan.level]}`}>
                    {plan.level}
                  </span>
                  <span className="text-[11px] text-text-muted">{plan.weeks} weeks · {plan.daysPerWeek}×/week</span>
                </div>
                <h2 className="font-heading font-bold text-lg text-text-primary group-hover:text-brand transition-colors mb-1">
                  {plan.title}
                </h2>
                <p className="text-sm text-text-secondary mb-3">{plan.subtitle}</p>
                <p className="text-xs text-text-muted leading-relaxed line-clamp-2">{plan.description}</p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-brand mt-4 group-hover:gap-2 transition-all">
                  View plan
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>

          {/* Pro CTA */}
          <div className="mt-12 bg-bg-dark rounded-2xl p-8 sm:p-10 text-white text-center border-t-[3px] border-brand">
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl mb-3">
              Need a plan built for <em>you</em>?
            </h2>
            <p className="text-text-dark-sec max-w-lg mx-auto mb-6">
              These sample plans are a great starting point — but they&apos;re not personalised. With RunSplit Pro, our AI builds a plan around your current fitness, available training days, race goal, and schedule.
            </p>
            <Link
              href="/signup"
              className="inline-block bg-brand hover:bg-brand-hover text-white font-heading font-bold px-8 py-3.5 rounded-[10px] transition-all hover:-translate-y-0.5"
            >
              Get a Custom Plan — £4.99/mo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
