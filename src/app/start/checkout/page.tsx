"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

export default function StartCheckoutPage() {
  const { user, loading } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("annual");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [showPromo, setShowPromo] = useState(false);

  async function initiateCheckout() {
    setCheckoutLoading(true);
    setError("");
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: billingPeriod, promoCode: promoCode.trim() || undefined }),
      });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to start checkout");
        setCheckoutLoading(false);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError("Failed to start checkout. Please try again.");
      setCheckoutLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center text-text-on-dark">
        <div className="w-14 h-14 border-4 border-brand border-t-transparent rounded-full animate-spin mb-6" />
        <h2 className="font-heading font-bold text-xl mb-2">Loading...</h2>
      </div>
    );
  }

  if (checkoutLoading) {
    return (
      <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center text-text-on-dark">
        <div className="w-14 h-14 border-4 border-brand border-t-transparent rounded-full animate-spin mb-6" />
        <h2 className="font-heading font-bold text-xl mb-2">Redirecting to checkout...</h2>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center text-text-on-dark px-4">
        <div className="max-w-md w-full text-center">
          <h1 className="font-heading font-bold text-2xl mb-3">
            Sign up to unlock your plan
          </h1>
          <p className="text-text-dark-sec mb-6">
            Create your free account to continue to checkout.
          </p>
          <Link
            href="/signup?redirect=/start/checkout"
            className="inline-block bg-brand hover:bg-brand-hover text-white font-heading text-sm font-bold px-8 py-3.5 rounded-lg transition-all"
          >
            Sign Up \u2192
          </Link>
          <p className="text-[11px] text-text-dark-muted mt-3">
            Already have an account?{" "}
            <Link href="/login?redirect=/start/checkout" className="text-brand hover:text-brand-hover underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // User is logged in — show billing toggle + checkout
  return (
    <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center text-text-on-dark px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="font-heading font-bold text-2xl mb-2">
          Ready to unlock your full plan?
        </h1>
        <p className="text-text-dark-sec mb-8 text-sm">
          Start your 3-day free trial. Cancel anytime.
        </p>

        {/* Billing toggle */}
        <div className="flex items-center justify-center mb-6">
          <div className="bg-white/10 rounded-full p-1 inline-flex">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                billingPeriod === "monthly"
                  ? "bg-brand text-white"
                  : "text-text-dark-sec hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                billingPeriod === "annual"
                  ? "bg-brand text-white"
                  : "text-text-dark-sec hover:text-white"
              }`}
            >
              Annual
              <span className="ml-1.5 bg-success/20 text-success text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                -40%
              </span>
            </button>
          </div>
        </div>

        {/* Price display */}
        <div className="mb-6">
          <span className="font-heading font-extrabold text-4xl text-white">
            {billingPeriod === "annual" ? "\u00A32.99" : "\u00A34.99"}
          </span>
          <span className="text-text-dark-sec text-sm ml-1">/ month</span>
          {billingPeriod === "annual" && (
            <p className="text-text-dark-sec text-xs mt-1">
              Billed as &pound;35.88/year
              <span className="ml-1.5 text-success font-semibold">save 40%</span>
            </p>
          )}
          {billingPeriod === "monthly" && (
            <p className="text-text-dark-sec text-xs mt-1">
              or{" "}
              <button onClick={() => setBillingPeriod("annual")} className="text-brand hover:text-brand-hover font-semibold">
                &pound;35.88/year (save 40%)
              </button>
            </p>
          )}
        </div>

        {/* Promo code */}
        <div className="mb-5">
          {!showPromo ? (
            <button
              type="button"
              onClick={() => setShowPromo(true)}
              className="text-xs text-text-dark-sec hover:text-white underline underline-offset-2 transition-colors"
            >
              Have a promo code?
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="PROMO CODE"
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand"
              />
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <button
          onClick={initiateCheckout}
          disabled={checkoutLoading}
          className="w-full bg-brand hover:bg-brand-hover text-white font-heading text-sm font-bold py-3.5 rounded-lg transition-all disabled:opacity-50"
        >
          Start Free Trial \u2192
        </button>

        <p className="text-[11px] text-text-dark-muted mt-3">
          3-day free trial \u00B7 Cancel anytime \u00B7 No lock-in
        </p>
      </div>
    </div>
  );
}
