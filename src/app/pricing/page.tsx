import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | RunSplit Pro — AI Training Plans for Runners",
  description:
    "Free running calculators forever. Upgrade to RunSplit Pro for AI-powered training plans, race day strategy, and more. £4.99/month.",
};

const freeFeatures = [
  "Pace Calculator",
  "Race Time Predictor",
  "Split Time Calculator",
  "Training Paces Calculator",
  "Speed / Pace Converter",
  "Age-Graded Calculator",
  "VO2max Estimator",
  "Heart Rate Zone Calculator",
  "Calories Burned Calculator",
  "Treadmill Pace Converter",
  "Negative Split Planner",
  "Run/Walk Calculator",
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-brand-black text-white py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl mb-4">
            Simple, honest pricing
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            All 12 calculators are free forever. Upgrade to Pro for AI-powered training plans and race strategy.
          </p>
        </div>
      </div>

      {/* Pricing cards */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free tier */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <h2 className="font-heading font-semibold text-lg text-gray-900 mb-1">Free</h2>
            <p className="text-sm text-gray-500 mb-6">All calculators, forever.</p>
            <div className="mb-6">
              <span className="font-heading font-black text-5xl text-gray-900">£0</span>
              <span className="text-gray-400 text-sm ml-1">/ forever</span>
            </div>
            <Link
              href="/calculators"
              className="block text-center bg-gray-900 hover:bg-gray-800 text-white font-semibold px-6 py-3 rounded-xl transition-colors mb-8"
            >
              Open Calculators
            </Link>
            <ul className="space-y-3">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-brand-green flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro tier */}
          <div className="bg-white rounded-2xl border-2 border-brand-orange p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-brand-orange text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Most Popular
              </span>
            </div>
            <h2 className="font-heading font-semibold text-lg text-gray-900 mb-1">Pro</h2>
            <p className="text-sm text-gray-500 mb-6">AI training plans & race strategy.</p>

            {/* Monthly */}
            <div className="mb-2">
              <span className="font-heading font-black text-5xl text-gray-900">£4.99</span>
              <span className="text-gray-400 text-sm ml-1">/ month</span>
            </div>
            <div className="mb-6">
              <span className="text-sm text-gray-500">
                or{" "}
                <span className="font-semibold text-gray-700">£39.99/year</span>
              </span>
              <span className="ml-2 bg-brand-green/10 text-brand-green text-xs font-bold px-2 py-0.5 rounded-full">
                SAVE 33%
              </span>
            </div>

            <Link
              href="/signup"
              className="block w-full text-center bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold px-6 py-3 rounded-xl transition-colors mb-2"
            >
              Start 7-Day Free Trial
            </Link>
            <p className="text-xs text-gray-400 text-center mb-8">No credit card required to try</p>

            <ul className="space-y-3">
              {proFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-brand-orange flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <h2 className="font-heading font-bold text-2xl text-center text-gray-900 mb-10">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                q: "Are the calculators really free?",
                a: "Yes, completely free. All 12 calculators are free forever with no signup, no email gates, and no usage limits. We believe free tools build trust.",
              },
              {
                q: "What do I get with Pro?",
                a: "Pro unlocks AI-powered personalised training plans, race-day pacing strategies, a training log with trends, calendar exports, and plan adjustments when you miss sessions.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Absolutely. Cancel with one click from your settings. No lock-in, no cancellation fees. Your free calculator access continues forever.",
              },
              {
                q: "How does the AI training plan work?",
                a: "You tell us your goal race, current fitness, and availability. Our AI (powered by advanced language models and running science) generates a personalised week-by-week plan with specific workouts and paces.",
              },
            ].map((faq) => (
              <div key={faq.q} className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-heading font-semibold text-sm text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

