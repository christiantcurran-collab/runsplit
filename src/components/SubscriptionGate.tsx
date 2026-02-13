"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

interface SubscriptionGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function SubscriptionGate({ children, fallback }: SubscriptionGateProps) {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-brand-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isPro =
    profile?.subscription_status === "active" ||
    profile?.subscription_status === "trialing";

  if (!isPro) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-4">
        <div className="w-20 h-20 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="font-heading font-bold text-2xl mb-3">This is a Pro feature</h2>
        <p className="text-gray-500 mb-6">
          Upgrade to RunSplit Pro to access AI-powered training plans, race day strategies, and your full training log.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/pricing"
            className="bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            View Pricing
          </Link>
          <Link
            href="/calculators"
            className="border border-gray-300 text-gray-700 font-semibold px-8 py-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Free Calculators
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

