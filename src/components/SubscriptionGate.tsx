"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

interface SubscriptionGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function SubscriptionGate({ children, fallback }: SubscriptionGateProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-text-muted">Loading your account...</p>
      </div>
    );
  }

  const isPro =
    profile?.subscription_status === "active" ||
    profile?.subscription_status === "trialing";

  if (!isPro) {
    if (fallback) return <>{fallback}</>;

    const displayName = profile?.display_name || user?.email?.split("@")[0] || "";

    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center py-16">
          {/* Greeting */}
          {displayName && (
            <p className="text-sm text-text-secondary mb-2">
              Hey {displayName} 👋
            </p>
          )}

          <div className="w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>

          <h2 className="font-heading font-bold text-2xl sm:text-3xl mb-3">
            You&apos;re one step away
          </h2>
          <p className="text-text-secondary mb-8 max-w-md mx-auto leading-relaxed">
            Subscribe to RunSplit Pro to unlock AI-powered training plans, race day strategy, Strava sync, and weekly coaching summaries.
          </p>

          {/* Pricing highlight */}
          <div className="bg-bg-card border border-[#E4E4E8] rounded-xl p-5 mb-6 max-w-sm mx-auto">
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="font-heading font-extrabold text-3xl text-text-primary">&pound;4.99</span>
              <span className="text-text-muted text-sm">/month</span>
            </div>
            <ul className="text-sm text-text-secondary space-y-1.5 text-left">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-brand flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                AI custom training plans
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-brand flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Race day pacing strategy
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-brand flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Strava sync &amp; training log
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-brand flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Weekly email summaries
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/pricing"
              className="bg-brand hover:bg-brand-hover text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              Subscribe to Pro
            </Link>
            <Link
              href="/tools"
              className="border border-gray-300 text-gray-700 font-semibold px-8 py-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Free Tools
            </Link>
          </div>
          <p className="text-xs text-text-muted mt-4">Cancel anytime. No lock-in.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
