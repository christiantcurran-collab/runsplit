"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { analytics } from "@/lib/analytics";

const proFeatures = [
  "AI-powered custom training plan builder",
  "Race day pacing strategy generator",
  "Training log with performance trends",
  "Strava integration & activity sync",
  "Weekly email training summaries",
  "Plan adjustments for missed sessions",
  "Export to Google / Apple / Outlook calendar",
  "PDF training plan download",
  "All 12 free running tools included",
  "Priority support",
];

export default function PricingPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("annual");
  const [loading, setLoading] = useState(false);

  const isPro = profile?.subscription_status === "active" || profile?.subscription_status === "trialing";

  useEffect(() => {
    analytics.pricingViewed();
  }, []);

  const handleSubscribe = async () => {
    if (!user) {
      router.push("/signup");
      return;
    }
    if (isPro) {
      router.push("/settings");
      return;
    }

    setLoading(true);
    analytics.checkoutStarted(billingPeriod);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: billingPeriod }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-page">
      {/* Hero */}
      <div className="bg-bg-dark text-text-on-dark py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl mb-4 tracking-tight">
            Train smarter. Race faster.
          </h1>
          <p className="text-text-dark-sec text-lg max-w-xl mx-auto">
            AI-powered training plans, Strava sync, race strategy, and more. Everything you need to hit your next PB.
          </p>
        </div>
      </div>

      {/* Pricing card */}
      <div className="max-w-lg mx-auto px-4 sm:px-6 -mt-10 pb-16">
        {/* Billing toggle */}
        <div className="flex items-center justify-center mb-8">
          <div className="bg-white rounded-full border border-gray-200 p-1 inline-flex">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                billingPeriod === "monthly"
                  ? "bg-brand text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                billingPeriod === "annual"
                  ? "bg-brand text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Annual
              <span className="ml-1.5 bg-success/20 text-success text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                -33%
              </span>
            </button>
          </div>
        </div>

        {/* Single Pro card */}
        <div className="bg-bg-card rounded-2xl border-2 border-brand p-8 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-brand text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              7-day free trial
            </span>
          </div>

          <h2 className="font-heading font-semibold text-lg text-text-primary mb-1">RunSplit Pro</h2>
          <p className="text-sm text-text-secondary mb-6">AI training plans, Strava sync & race strategy.</p>

          <div className="mb-2">
            <span className="font-heading font-extrabold text-5xl text-text-primary">
              {billingPeriod === "annual" ? "\u00A33.33" : "\u00A34.99"}
            </span>
            <span className="text-text-muted text-sm ml-1">/ month</span>
          </div>
          {billingPeriod === "annual" && (
            <div className="mb-6">
              <span className="text-sm text-text-secondary">
                Billed as <span className="font-semibold text-text-primary">&pound;39.99/year</span>
              </span>
              <span className="ml-2 bg-success/10 text-success text-xs font-bold px-2 py-0.5 rounded-full">
                SAVE 33%
              </span>
            </div>
          )}
          {billingPeriod === "monthly" && (
            <div className="mb-6">
              <span className="text-sm text-text-secondary">
                or{" "}
                <button onClick={() => setBillingPeriod("annual")} className="font-semibold text-brand hover:text-brand-hover">
                  &pound;39.99/year (save 33%)
                </button>
              </span>
            </div>
          )}

          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="block w-full text-center bg-brand hover:bg-brand-hover text-white font-semibold px-6 py-3.5 rounded-[10px] transition-colors mb-8 disabled:opacity-50"
          >
            {loading ? "Loading..." : isPro ? "Manage Subscription" : "Start Free Trial"}
          </button>

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

          <p className="text-center text-xs text-text-muted mt-6">
            Cancel anytime. No lock-in, no cancellation fees.
          </p>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="font-heading font-bold text-2xl text-center text-text-primary mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Is there a free trial?",
                a: "Yes! You get a 7-day free trial when you sign up. Cancel anytime during the trial and you won't be charged.",
              },
              {
                q: "What do I get with Pro?",
                a: "Pro unlocks AI-powered personalised training plans, Strava integration, weekly email summaries, race-day pacing strategies, a training log with trends, calendar exports, and plan adjustments when you miss sessions.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Absolutely. Cancel with one click from your settings or the Stripe billing portal. No lock-in, no cancellation fees.",
              },
              {
                q: "How does the AI training plan work?",
                a: "You tell us your goal race, current fitness, and availability. Our AI generates a personalised week-by-week plan with specific workouts and paces tailored to you \u2014 you can watch it build in real-time.",
              },
              {
                q: "Can I connect Strava?",
                a: "Yes! Connect your Strava account in Settings to sync your running activities. Your training data helps us provide better insights and track your progress.",
              },
              {
                q: "Are the free tools still available?",
                a: "Yes, all 12 running tools and 5 sample training plans are included with every Pro subscription and remain free to use even without an account.",
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
