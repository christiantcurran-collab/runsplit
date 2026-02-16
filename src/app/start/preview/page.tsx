"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";

interface PreviewWeek {
  weekNumber: number;
  phase: string;
  totalKm: number;
  days: { day: string; workout: string | null }[];
}

interface PlanPreview {
  totalWeeks: number;
  previewWeeks: PreviewWeek[];
}

export default function PreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg-dark flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PreviewContent />
    </Suspense>
  );
}

function PreviewContent() {
  const [preview, setPreview] = useState<PlanPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPreview();
  }, []);

  async function loadPreview() {
    setLoading(true);
    try {
      const quizRaw = localStorage.getItem("runsplit_quiz_data");
      const quizData = quizRaw ? JSON.parse(quizRaw) : {};

      const res = await fetch("/api/plan-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quizData),
      });

      if (!res.ok) throw new Error("Failed to load preview");
      const data = await res.json();
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load plan preview");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center text-text-on-dark">
        <div className="w-14 h-14 border-4 border-brand border-t-transparent rounded-full animate-spin mb-6" />
        <h2 className="font-heading font-bold text-xl mb-2">Building your plan preview...</h2>
        <p className="text-text-dark-sec text-sm">Your AI coach is working on it.</p>
      </div>
    );
  }

  if (error || !preview) {
    return (
      <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center text-text-on-dark px-4">
        <p className="text-red-400 mb-4">{error || "Something went wrong"}</p>
        <button
          onClick={loadPreview}
          className="bg-brand hover:bg-brand-hover text-white font-semibold px-6 py-2.5 rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  const FREE_WEEKS = 2; // Show 2 weeks free, blur the rest

  return (
    <div className="min-h-screen bg-bg-dark text-text-on-dark">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-bg-dark-border">
        <Link href="/start" className="inline-flex items-center gap-2">
          <div className="w-5 h-[2.5px] bg-brand rounded-sm" />
          <span className="font-heading font-bold text-sm text-text-on-dark">RunSplit</span>
        </Link>
        <span className="text-xs text-text-dark-muted font-mono">
          Plan Preview
        </span>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Plan header */}
        <div className="text-center mb-8">
          <p className="font-mono text-[10px] uppercase tracking-[3px] text-brand mb-3">
            Your AI Training Plan
          </p>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-white mb-2">
            {preview.totalWeeks}-Week Plan
          </h1>
          <p className="text-sm text-text-dark-sec">
            Preview of your first {FREE_WEEKS} weeks. Upgrade to Pro for the full plan.
          </p>
        </div>

        {/* Weeks */}
        <div className="space-y-4">
          {preview.previewWeeks.map((week, idx) => {
            const isBlurred = idx >= FREE_WEEKS;

            return (
              <div
                key={week.weekNumber}
                className={`bg-bg-dark-card border border-bg-dark-border rounded-xl overflow-hidden relative ${
                  isBlurred ? "select-none" : ""
                }`}
              >
                {/* Blur overlay */}
                {isBlurred && (
                  <div className="absolute inset-0 backdrop-blur-md bg-bg-dark/60 z-10 flex items-center justify-center">
                    <div className="text-center px-4">
                      <div className="text-2xl mb-2">🔒</div>
                      <p className="text-sm font-semibold text-white mb-1">
                        Week {week.weekNumber}+ locked
                      </p>
                      <p className="text-xs text-text-dark-muted">
                        Upgrade to Pro to unlock your full plan
                      </p>
                    </div>
                  </div>
                )}

                {/* Week header */}
                <div className="px-5 py-3 bg-bg-dark-input border-b border-bg-dark-border flex items-center justify-between">
                  <div>
                    <span className="font-heading font-bold text-sm text-white">
                      Week {week.weekNumber}
                    </span>
                    <span className="text-xs text-text-dark-muted ml-2">
                      — {week.phase}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-text-dark-sec">
                    {week.totalKm}km
                  </span>
                </div>

                {/* Days grid */}
                <div className="grid grid-cols-7 divide-x divide-bg-dark-border">
                  {week.days.map((d, di) => (
                    <div
                      key={di}
                      className={`p-2.5 text-center min-h-[72px] flex flex-col ${
                        d.workout ? "bg-transparent" : "bg-bg-dark/30"
                      }`}
                    >
                      <span className="font-mono text-[9px] uppercase tracking-[1px] text-text-dark-muted mb-1">
                        {d.day}
                      </span>
                      {d.workout ? (
                        <span className="text-[11px] text-text-dark-sec leading-tight mt-auto">
                          {d.workout}
                        </span>
                      ) : (
                        <span className="text-[10px] text-text-dark-muted mt-auto">
                          Rest
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Remaining weeks indicator */}
        {preview.totalWeeks > preview.previewWeeks.length && (
          <div className="mt-4 text-center text-sm text-text-dark-muted">
            + {preview.totalWeeks - preview.previewWeeks.length} more weeks in your full plan
          </div>
        )}

        {/* Pro CTA */}
        <div className="mt-8 bg-gradient-to-r from-brand/20 to-brand-hover/20 border border-brand/30 rounded-2xl p-8 text-center">
          <h2 className="font-heading font-bold text-xl text-white mb-2">
            Unlock your full {preview.totalWeeks}-week plan
          </h2>
          <p className="text-sm text-text-dark-sec mb-2 max-w-md mx-auto">
            Get every session, every pace, every week — plus AI coaching that adapts as you train.
          </p>

          <ul className="text-left max-w-xs mx-auto text-sm text-text-dark-sec space-y-2 my-5">
            {[
              "Full week-by-week plan with paces",
              "AI coaching that adapts every week",
              "Strava sync & activity tracking",
              "Weekly email summaries",
              "Race day strategy & taper plan",
            ].map((feat) => (
              <li key={feat} className="flex items-start gap-2">
                <span className="text-brand mt-0.5">✓</span>
                <span>{feat}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/start/checkout"
            className="inline-block w-full max-w-xs bg-brand hover:bg-brand-hover text-white font-heading text-sm font-bold py-3.5 rounded-lg transition-all"
          >
            Start Pro — £4.99/mo →
          </Link>
          <p className="text-[11px] text-text-dark-muted mt-3">
            7-day free trial · Cancel anytime
          </p>
        </div>

        {/* Free option */}
        <div className="mt-4 text-center">
          <Link
            href="/signup?from=preview&tier=free"
            className="text-sm text-text-dark-muted hover:text-brand transition-colors underline underline-offset-4"
          >
            Or continue with Free (limited tools only)
          </Link>
        </div>
      </div>
    </div>
  );
}

