"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

/**
 * This page handles the checkout flow after quiz completion.
 * If user is logged in → sends to Stripe immediately
 * If not logged in → shows signup prompt
 */
export default function StartCheckoutPage() {
  const { user, loading } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");

  // Don't auto-trigger checkout on mount - wait for user to click
  // This prevents issues with stale sessions or corrupted customer IDs

  async function initiateCheckout() {
    setCheckoutLoading(true);
    setError("");
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "monthly" }),
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
        <p className="text-text-dark-sec text-sm">This will just take a moment.</p>
      </div>
    );
  }

  if (checkoutLoading) {
    return (
      <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center text-text-on-dark">
        <div className="w-14 h-14 border-4 border-brand border-t-transparent rounded-full animate-spin mb-6" />
        <h2 className="font-heading font-bold text-xl mb-2">Redirecting to checkout...</h2>
        <p className="text-text-dark-sec text-sm">This will just take a moment.</p>
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
            Sign Up →
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

  // User is logged in - show checkout button
  return (
    <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center text-text-on-dark px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="font-heading font-bold text-2xl mb-3">
          Ready to unlock your full plan?
        </h1>
        <p className="text-text-dark-sec mb-6">
          Start your Pro subscription for £4.99/mo. Cancel anytime.
        </p>
        
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
          Continue to Checkout →
        </button>
        
        <p className="text-[11px] text-text-dark-muted mt-3">
          7-day free trial · Cancel anytime
        </p>
      </div>
    </div>
  );
}

