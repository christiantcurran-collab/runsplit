import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | RunSplit Pro — AI Training Plans for Runners",
  description:
    "Free running tools forever. Upgrade to RunSplit Pro for AI-powered training plans, race day strategy, and more. £4.99/month.",
};

const freeFeatures = [
  "All 12 running tools",
  "5 sample training plans",
  "Unlimited use, no limits",
  "No signup required",
];

const proFeatures = [
  "Everything in Free",
  "AI-powered custom training plan builder",
  "Race day pacing strategy generator",
  "Training log with performance trends",
  "Plan adjustments for missed sessions",
  "Export to Google / Apple / Outlook calendar",
  "PDF training plan download",
  "Priority support",
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-bg-page">
      {/* Hero */}
      <div className="bg-bg-dark text-text-on-dark py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl mb-4 tracking-tight">
            Simple, honest pricing
          </h1>
          <p className="text-text-dark-sec text-lg max-w-xl mx-auto">
            All 12 tools and 5 sample plans are free forever. Upgrade to Pro for AI-powered training plans and race strategy.
          </p>
        </div>
      </div>

      {/* Pricing cards */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free tier */}
          <div className="bg-bg-card rounded-2xl border border-[#E4E4E8] p-8">
            <h2 className="font-heading font-semibold text-lg text-text-primary mb-1">Free</h2>
            <p className="text-sm text-text-secondary mb-6">Tools + sample plans, forever.</p>
            <div className="mb-6">
              <span className="font-heading font-extrabold text-5xl text-text-primary">£0</span>
              <span className="text-text-muted text-sm ml-1">/ forever</span>
            </div>
            <Link
              href="/tools"
              className="block text-center bg-bg-dark hover:bg-bg-dark-card text-white font-semibold px-6 py-3 rounded-[10px] transition-colors mb-2"
            >
              Open Tools
            </Link>
            <Link
              href="/plans"
              className="block text-center text-sm text-brand hover:text-brand-hover font-medium mb-8 mt-2 transition-colors"
            >
              Browse free plans →
            </Link>
            <ul className="space-y-3">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-text-secondary">
                  <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro tier */}
          <div className="bg-bg-card rounded-2xl border-2 border-brand p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-brand text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Most Popular
              </span>
            </div>
            <h2 className="font-heading font-semibold text-lg text-text-primary mb-1">Pro</h2>
            <p className="text-sm text-text-secondary mb-6">AI training plans & race strategy.</p>

            <div className="mb-2">
              <span className="font-heading font-extrabold text-5xl text-text-primary">£4.99</span>
              <span className="text-text-muted text-sm ml-1">/ month</span>
            </div>
            <div className="mb-6">
              <span className="text-sm text-text-secondary">
                or{" "}
                <span className="font-semibold text-text-primary">£39.99/year</span>
              </span>
              <span className="ml-2 bg-success/10 text-success text-xs font-bold px-2 py-0.5 rounded-full">
                SAVE 33%
              </span>
            </div>

            <Link
              href="/signup"
              className="block w-full text-center bg-brand hover:bg-brand-hover text-white font-semibold px-6 py-3 rounded-[10px] transition-colors mb-8"
            >
              Get Started
            </Link>

            <ul className="space-y-3">
              {proFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-text-secondary">
                  <svg className="w-5 h-5 text-brand flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="font-heading font-bold text-2xl text-center text-text-primary mb-10">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                q: "Are the tools and plans really free?",
                a: "Yes, completely free. All 12 tools and 5 sample training plans are free forever with no signup, no email gates, and no usage limits.",
              },
              {
                q: "What do I get with Pro?",
                a: "Pro unlocks AI-powered personalised training plans, race-day pacing strategies, a training log with trends, calendar exports, and plan adjustments when you miss sessions.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Absolutely. Cancel with one click from your settings. No lock-in, no cancellation fees. Your free tool and plan access continues forever.",
              },
              {
                q: "How does the AI training plan work?",
                a: "You tell us your goal race, current fitness, and availability. Our AI generates a personalised week-by-week plan with specific workouts and paces tailored to you.",
              },
            ].map((faq) => (
              <div key={faq.q} className="bg-bg-card rounded-xl border border-[#E4E4E8] p-6">
                <h3 className="font-heading font-semibold text-sm text-text-primary mb-2">{faq.q}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
