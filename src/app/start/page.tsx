"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";

const GOAL_OPTIONS = [
  { value: "5k", label: "5K" },
  { value: "10k", label: "10K" },
  { value: "half", label: "Half Marathon" },
  { value: "marathon", label: "Marathon" },
  { value: "ultra", label: "Ultra" },
  { value: "fitness", label: "Just get fitter" },
];

const HEADLINES: Record<string, { h1: string; sub: string }> = {
  race: {
    h1: "Your race plan, built on\nyour actual fitness.",
    sub: "AI coaching that analyses your data and builds a personalised plan. Adapts every week.",
  },
  frustrated: {
    h1: "A plan that actually\nknows how fast you are.",
    sub: "Stop guessing. Connect your data. Get coached by AI that understands your running.",
  },
  beginner: {
    h1: "From your first run\nto your first race.",
    sub: "Your AI coach is ready. Start with a plan that grows with you.",
  },
  strava: {
    h1: "Your Strava data.\nOur AI brain. Your fastest race.",
    sub: "Connect Strava. Get a personalised plan built on your actual running history.",
  },
  default: {
    h1: "Get a running plan built\nfor your goal, your pace,\nand your life.",
    sub: "AI coaching that adapts every week. From £4.99/mo.",
  },
};

export default function StartPage() {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  // Read UTM params for variant matching (client-side only)
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const variant = params?.get("goal") || "default";
  const headline = HEADLINES[variant] || HEADLINES.default;

  return (
    <div className="min-h-screen bg-bg-dark text-text-on-dark">
      {/* Minimal header — logo only */}
      <header className="absolute top-0 left-0 right-0 z-10 px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="w-6 h-[3px] bg-brand rounded-sm" />
          <span className="font-heading font-bold text-lg text-text-on-dark tracking-tight">
            RunSplit
          </span>
        </Link>
      </header>

      {/* HERO */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center relative overflow-hidden px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-brand/5 via-transparent to-bg-dark pointer-events-none" />

        <div className="relative z-10 w-full max-w-[560px] mx-auto">
          <motion.p
            className="font-mono text-[11px] tracking-[4px] uppercase text-brand mb-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            AI Running Coach
          </motion.p>

          <motion.h1
            className="font-heading font-extrabold text-[clamp(28px,5vw,48px)] leading-[1.12] mb-5 whitespace-pre-line"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            {headline.h1}
          </motion.h1>

          <motion.p
            className="text-text-dark-sec text-base max-w-[440px] mx-auto leading-[1.7] mb-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            {headline.sub}
          </motion.p>

          {/* Goal selector */}
          <motion.div
            className="bg-bg-dark-card border border-bg-dark-border rounded-2xl p-6 w-full"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <p className="text-sm text-text-dark-sec mb-4">What are you training for?</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {GOAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedGoal(opt.value)}
                  className={`px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                    selectedGoal === opt.value
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-bg-dark-border text-text-dark-sec hover:border-brand/40 hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <Link
              href={`/start/quiz${selectedGoal ? `?goal=${selectedGoal}` : ""}`}
              className={`block w-full mt-5 text-center font-heading text-sm font-bold py-[14px] rounded-lg transition-all ${
                selectedGoal
                  ? "bg-brand hover:bg-brand-hover text-white"
                  : "bg-brand/40 text-white/60 cursor-default pointer-events-none"
              }`}
            >
              Get My Plan →
            </Link>
          </motion.div>

          <motion.p
            className="text-[13px] text-text-dark-muted mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            Free assessment · No card required to start
          </motion.p>
        </div>
      </section>

      {/* SOCIAL PROOF BAR */}
      <section className="border-t border-bg-dark-border py-6">
        <div className="max-w-3xl mx-auto px-4 flex flex-wrap items-center justify-center gap-6 text-sm text-text-dark-sec">
          <span className="flex items-center gap-1.5">
            <span className="text-yellow-400">★★★★★</span>
            AI-powered plans
          </span>
          <span className="hidden sm:inline text-bg-dark-border">·</span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#FC4C02">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066l-2.084 4.116z" />
              <path d="M10.233 13.828L7.188 7.5h-3.72l6.765 13.327 3.065-6.999h-3.065z" />
            </svg>
            Strava connected
          </span>
          <span className="hidden sm:inline text-bg-dark-border">·</span>
          <span>Cancel anytime · £4.99/mo</span>
        </div>
      </section>

      {/* 3 VALUE PROPS */}
      <section className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[
            {
              icon: "🎯",
              title: "Plans that adapt",
              desc: "Missed a session? Life got busy? Your plan automatically adjusts.",
            },
            {
              icon: "🧠",
              title: "AI that knows your data",
              desc: "Your pace, your history, your fitness level — analysed and understood.",
            },
            {
              icon: "📊",
              title: "Race strategy for YOUR day",
              desc: "Pacing, splits, and taper built specifically for your goal.",
            },
          ].map((prop) => (
            <div key={prop.title}>
              <div className="text-3xl mb-3">{prop.icon}</div>
              <h3 className="font-heading font-bold text-base text-white mb-1.5">{prop.title}</h3>
              <p className="text-sm text-text-dark-sec leading-relaxed">{prop.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BEFORE / AFTER */}
      <section className="py-16 sm:py-20 border-t border-bg-dark-border">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="font-heading font-bold text-2xl text-center text-white mb-10">
            Training plans shouldn&apos;t be guesswork
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-bg-dark-card border border-bg-dark-border rounded-xl p-6">
              <p className="font-mono text-[10px] uppercase tracking-[2px] text-red-400 mb-4">
                Without RunSplit
              </p>
              <ul className="space-y-3 text-sm text-text-dark-sec">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✕</span>
                  Generic plans from a Google search
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✕</span>
                  No adaptation when life changes
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✕</span>
                  Guessing your training paces
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✕</span>
                  Hoping for the best on race day
                </li>
              </ul>
            </div>

            <div className="bg-bg-dark-card border border-brand/30 rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand to-brand-hover" />
              <p className="font-mono text-[10px] uppercase tracking-[2px] text-brand mb-4">
                With RunSplit
              </p>
              <ul className="space-y-3 text-sm text-text-dark-sec">
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-0.5">✓</span>
                  Plan built on <span className="text-white font-medium">your actual pace</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-0.5">✓</span>
                  Adapts every week with AI coaching
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-0.5">✓</span>
                  Precise paces from your race data
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-0.5">✓</span>
                  Race day strategy for <span className="text-white font-medium">your</span> goal
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 sm:py-20 border-t border-bg-dark-border">
        <div className="max-w-3xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                quote:
                  "I knocked 12 minutes off my half marathon PB following the RunSplit plan. The paces were spot on.",
                name: "James K.",
                detail: "Half marathon — 1:42:31",
              },
              {
                quote:
                  "As a beginner, I was nervous about marathon training. RunSplit gave me a plan I could actually follow.",
                name: "Sarah M.",
                detail: "First marathon — 4:18:06",
              },
            ].map((t) => (
              <div key={t.name} className="bg-bg-dark-card border border-bg-dark-border rounded-xl p-6">
                <div className="text-yellow-400 text-sm mb-3">★★★★★</div>
                <p className="text-sm text-text-dark-sec leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-text-dark-muted">{t.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 sm:py-28 border-t border-bg-dark-border text-center">
        <div className="max-w-lg mx-auto px-4">
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-white mb-4">
            Ready to train smarter?
          </h2>
          <p className="text-text-dark-sec mb-8">
            Answer a few questions, see your personalised assessment, and get your AI-powered plan.
          </p>
          <Link
            href={`/start/quiz${selectedGoal ? `?goal=${selectedGoal}` : ""}`}
            className="inline-block bg-brand hover:bg-brand-hover text-white font-heading text-[15px] font-bold px-10 py-4 rounded-lg transition-all hover:-translate-y-0.5"
          >
            Get Your Plan →
          </Link>
          <p className="text-[13px] text-text-dark-muted mt-4">
            Free assessment · No card required · Cancel anytime
          </p>
        </div>
      </section>
    </div>
  );
}


