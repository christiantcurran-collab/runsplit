import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SAMPLE_PLANS, getSamplePlan } from "@/lib/sample-plans";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return SAMPLE_PLANS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const plan = getSamplePlan(params.slug);
  if (!plan) return { title: "Plan Not Found" };
  return {
    title: `${plan.title} — Free Training Plan`,
    description: `${plan.description} ${plan.weeks}-week plan, ${plan.daysPerWeek} days per week. Free to view, no signup required.`,
    alternates: { canonical: `/plans/${params.slug}` },
    openGraph: {
      title: `${plan.title} — Free Training Plan | RunSplit`,
      description: plan.description,
      url: `/plans/${params.slug}`,
    },
  };
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const LEVEL_COLORS = {
  Beginner: "bg-green-400/10 text-green-400",
  Intermediate: "bg-brand/10 text-brand-hover",
  Advanced: "bg-purple-400/10 text-purple-400",
};

export default function SamplePlanPage({ params }: Props) {
  const plan = getSamplePlan(params.slug);
  if (!plan) notFound();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-bg-dark text-text-on-dark py-10 sm:py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-text-dark-muted mb-4">
            <Link href="/plans" className="hover:text-white transition-colors">Plans</Link>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-text-dark-sec">{plan.title}</span>
          </nav>
          <div className="flex items-center gap-3 mb-4">
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${LEVEL_COLORS[plan.level]}`}>
              {plan.level}
            </span>
            <span className="text-sm text-text-dark-sec">{plan.distance} · {plan.weeks} weeks · {plan.daysPerWeek}×/week · Peak {plan.peakWeeklyKm}km/week</span>
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl tracking-tight mb-2">
            {plan.title}
          </h1>
          <p className="text-text-dark-sec text-lg max-w-2xl">{plan.subtitle}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* About */}
        <div className="bg-bg-card rounded-2xl border border-[#E4E4E8] p-6 sm:p-8 mb-8">
          <h2 className="font-heading font-bold text-lg text-text-primary mb-3">About this plan</h2>
          <p className="text-sm text-text-secondary leading-relaxed mb-4">{plan.description}</p>
          <p className="text-sm text-text-secondary"><strong className="text-text-primary">Who is it for?</strong> {plan.who}</p>
        </div>

        {/* Schedule */}
        <h2 className="font-heading font-bold text-xl text-text-primary mb-4">Week-by-Week Schedule</h2>
        <div className="space-y-4">
          {plan.schedule.map((week) => (
            <div key={week.week} className="bg-bg-card rounded-2xl border border-[#E4E4E8] overflow-hidden">
              <div className="px-6 py-4 bg-bg-subtle border-b border-[#E4E4E8] flex items-center justify-between">
                <div>
                  <span className="font-heading font-bold text-sm text-text-primary">Week {week.week}</span>
                  <span className="text-xs text-text-muted ml-2">— {week.phase}</span>
                </div>
                <span className="text-xs font-mono font-semibold text-text-secondary">{week.totalKm}km</span>
              </div>
              <div className="grid grid-cols-7 divide-x divide-[#E4E4E8]">
                {week.days.map((day, i) => (
                  <div key={i} className="p-3 min-h-[4.5rem]">
                    <div className="font-mono text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">{WEEKDAYS[i]}</div>
                    {day ? (
                      <div className={`text-xs leading-relaxed ${day.startsWith("🏁") ? "font-bold text-brand" : "text-text-secondary"}`}>
                        {day}
                      </div>
                    ) : (
                      <div className="text-xs text-text-muted italic">Rest</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 bg-bg-dark rounded-2xl p-8 text-center text-white border-t-[3px] border-brand">
          <h3 className="font-heading font-bold text-xl sm:text-2xl mb-3">
            Want this plan customised for you?
          </h3>
          <p className="text-text-dark-sec mb-6 max-w-md mx-auto">
            Our AI takes your current fitness, training days, pace, and goals to create a
            plan that&apos;s built specifically for you — not a generic template.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-brand hover:bg-brand-hover text-white font-heading font-bold px-8 py-3.5 rounded-[10px] transition-all hover:-translate-y-0.5"
          >
            Get a Custom Plan — £4.99/mo
          </Link>
        </div>

        {/* Other plans */}
        <div className="mt-12">
          <h3 className="font-heading font-semibold text-lg text-text-primary mb-4">Other Free Plans</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SAMPLE_PLANS.filter((p) => p.slug !== plan.slug).map((p) => (
              <Link
                key={p.slug}
                href={`/plans/${p.slug}`}
                className="group bg-bg-card rounded-xl border border-[#E4E4E8] p-4 hover:border-brand/40 hover:shadow-md transition-all"
              >
                <div className="font-heading font-semibold text-sm text-text-primary group-hover:text-brand transition-colors">{p.title}</div>
                <div className="text-xs text-text-muted mt-1">{p.weeks} weeks · {p.level}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}



