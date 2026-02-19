"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { analytics } from "@/lib/analytics";

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-page flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { refreshProfile } = useAuth();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    const verify = async () => {
      try {
        // Poll up to 6 times with 2s delay (12s total max)
        for (let i = 0; i < 6; i++) {
          const res = await fetch("/api/verify-subscription", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionId }),
          });
          const data = await res.json();

          if (data.status === "active" || data.status === "trialing") {
            // Refresh profile so AuthProvider has latest subscription_status
            try { await refreshProfile(); } catch { /* non-critical */ }
            // Fire GA4 / Google Ads purchase conversion
            const plan = searchParams.get("plan") as "monthly" | "annual" | null;
            const valuePence = plan === "annual" ? 3588 : 499;
            analytics.subscriptionCompleted(plan ?? "monthly", valuePence);
            setStatus("success");
            // Small delay so user sees the success state
            setTimeout(() => { window.location.href = "/plan"; }, 1500);
            return;
          }

          if (i < 5) {
            await new Promise((r) => setTimeout(r, 2000));
          }
        }

        // After all retries, redirect anyway — SubscriptionGate will verify too
        setStatus("success");
        setTimeout(() => { window.location.href = "/plan"; }, 1500);
      } catch (err) {
        console.error("Subscription verification failed:", err);
        // Still redirect — don't leave user stuck
        setStatus("success");
        setTimeout(() => { window.location.href = "/plan"; }, 2000);
      }
    };

    verify();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-bg-page flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-6 h-[3px] bg-brand rounded-sm" />
          <span className="font-heading font-bold text-lg text-text-primary tracking-tight">
            RunSplit
          </span>
        </div>

        {status === "verifying" && (
          <>
            <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h1 className="font-heading font-bold text-2xl text-text-primary mb-2">
              Activating your Pro account...
            </h1>
            <p className="text-text-secondary text-sm">
              This should only take a moment.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-heading font-bold text-2xl text-text-primary mb-2">
              Welcome to RunSplit Pro!
            </h1>
            <p className="text-text-secondary text-sm">
              Redirecting to your dashboard...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="font-heading font-bold text-2xl text-text-primary mb-2">
              Almost there!
            </h1>
            <p className="text-text-secondary text-sm mb-4">
              Your payment was successful. Click below to go to your dashboard.
            </p>
            <button
              onClick={() => (window.location.href = "/plan")}
              className="bg-brand hover:bg-brand-hover text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
            >
              Go to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
