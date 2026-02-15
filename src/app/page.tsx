"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { analytics } from "@/lib/analytics";
import {
  DISTANCES,
  type DistanceKey,
  timeToSeconds,
  calculatePace,
  calculatePaceSeconds,
  calculateTrainingPaces,
  formatTime,
  formatTimeFromSeconds,
  predictRaceTime,
  secondsToTime,
} from "@/lib/running-math";
import RaceTime from "@/components/ui/RaceTime";
import PaceBar from "@/components/ui/PaceBar";
import { SAMPLE_PLANS } from "@/lib/sample-plans";

const TOOLS = [
  { href: "/tools/pace", title: "Pace & Speed", description: "Distance + time = pace.", icon: "01" },
  { href: "/tools/predict", title: "What Can I Run?", description: "Predict any race time.", icon: "02" },
  { href: "/tools/splits", title: "Race Split Planner", description: "Even or negative splits.", icon: "03" },
  { href: "/tools/training-paces", title: "Training Paces", description: "5-zone training paces.", icon: "04" },
  { href: "/tools/convert", title: "Pace Converter", description: "km ↔ mile ↔ km/h.", icon: "05" },
  { href: "/tools/age-grade", title: "Performance Grade", description: "Age-graded rating.", icon: "06" },
  { href: "/tools/vo2max", title: "VO2max Estimator", description: "Fitness from race data.", icon: "07" },
  { href: "/tools/heart-rate", title: "Heart Rate Zones", description: "Karvonen 5-zone.", icon: "08" },
];

const LEVEL_COLORS: Record<string, string> = {
  Beginner: "bg-green-400/10 text-green-400",
  Intermediate: "bg-brand/10 text-brand-hover",
  Advanced: "bg-purple-400/10 text-purple-400",
};

export default function HomePage() {
  const [selectedDist, setSelectedDist] = useState<string>("marathon");
  const [targetH, setTargetH] = useState(3);
  const [targetM, setTargetM] = useState(30);
  const [targetS, setTargetS] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleShowResults = useCallback(() => {
    setShowResults(true);
    analytics.heroCalculatorUsed(selectedDist);
    // Scroll to results after a brief delay for the animation to start
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, [selectedDist]);

  const distMeters = DISTANCES[selectedDist as DistanceKey]?.meters || 42195;
  const totalSec = timeToSeconds({ hours: targetH, minutes: targetM, seconds: targetS });

  const analysis = useMemo(() => {
    if (totalSec <= 0) return null;
    const paceKm = calculatePace(distMeters, totalSec, "km");
    const paceSecKm = calculatePaceSeconds(distMeters, totalSec, "km");
    const trainingPaces = calculateTrainingPaces(distMeters, totalSec);
    const distName = DISTANCES[selectedDist as DistanceKey]?.name || "Race";

    const equivalents = Object.entries(DISTANCES)
      .filter(([key]) => key !== selectedDist)
      .slice(0, 4)
      .map(([, d]) => ({
        name: d.shortName,
        time: formatTimeFromSeconds(predictRaceTime(distMeters, totalSec, d.meters)),
        pace: formatTime(secondsToTime(calculatePaceSeconds(d.meters, predictRaceTime(distMeters, totalSec, d.meters), "km"))),
      }));

    return {
      paceDisplay: formatTime(paceKm),
      paceSecKm,
      distName,
      trainingPaces: {
        easy: `${formatTime(secondsToTime(trainingPaces.easy.min))}-${formatTime(secondsToTime(trainingPaces.easy.max))}`,
        tempo: `${formatTime(secondsToTime(trainingPaces.threshold.min))}-${formatTime(secondsToTime(trainingPaces.threshold.max))}`,
        interval: `${formatTime(secondsToTime(trainingPaces.interval.min))}-${formatTime(secondsToTime(trainingPaces.interval.max))}`,
      },
      equivalents,
    };
  }, [totalSec, distMeters, selectedDist]);

  return (
    <div className="min-h-screen">
      {/* ─── HERO — full dark ─── */}
      <section className="bg-bg-dark text-text-on-dark min-h-[100vh] flex flex-col items-center justify-center text-center relative overflow-hidden">
        {/* Gradient underlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bg-dark pointer-events-none" />

        <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-28 w-full max-w-[540px] mx-auto">
          {/* Eyebrow */}
          <motion.p
            className="font-mono text-[11px] tracking-[4px] uppercase text-brand mb-7"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            AI Running Intelligence
          </motion.p>

          {/* Headline */}
          <motion.h1
            className="font-heading font-extrabold text-[clamp(38px,5.5vw,64px)] leading-[1.08] mb-5 tracking-tight"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            From data
            <br />
            to{" "}
            <span className="bg-gradient-to-r from-brand to-brand-hover bg-clip-text text-transparent">
              finish line.
            </span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            className="text-base text-text-dark-sec max-w-[460px] mx-auto leading-[1.7] mb-12"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            Connect your watch. Set your goal. Get AI-powered pacing, plans, and coaching — built on your actual running data.
          </motion.p>

          {/* Smart Input */}
          <motion.div
            className="bg-bg-dark-card border border-bg-dark-border rounded-2xl px-7 py-7 w-full"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <div className="flex items-center justify-center gap-2.5 flex-wrap text-[15px] text-text-dark-sec">
              <span>I want to run a</span>
              <select
                value={selectedDist}
                onChange={(e) => setSelectedDist(e.target.value)}
                className="bg-bg-dark-input border border-bg-dark-border text-text-on-dark font-body text-sm px-3 py-2 rounded-md appearance-none cursor-pointer focus:outline-none focus:border-brand focus:shadow-glow"
              >
                {Object.entries(DISTANCES).map(([key, d]) => (
                  <option key={key} value={key} className="bg-bg-dark text-white">
                    {d.name}
                  </option>
                ))}
              </select>
              <span>in</span>
              <div className="flex items-center gap-[3px]">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={99}
                  value={targetH}
                  onChange={(e) => setTargetH(Number(e.target.value) || 0)}
                  className="w-[46px] text-center font-mono text-lg font-semibold bg-bg-dark-input border border-bg-dark-border text-text-on-dark rounded-md px-1 py-2 focus:outline-none focus:border-brand focus:shadow-glow"
                />
                <span className="font-mono text-lg text-text-dark-muted">:</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={59}
                  value={targetM}
                  onChange={(e) => setTargetM(Math.min(59, Number(e.target.value) || 0))}
                  className="w-[46px] text-center font-mono text-lg font-semibold bg-bg-dark-input border border-bg-dark-border text-text-on-dark rounded-md px-1 py-2 focus:outline-none focus:border-brand focus:shadow-glow"
                />
                <span className="font-mono text-lg text-text-dark-muted">:</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={59}
                  value={targetS}
                  onChange={(e) => setTargetS(Math.min(59, Number(e.target.value) || 0))}
                  className="w-[46px] text-center font-mono text-lg font-semibold bg-bg-dark-input border border-bg-dark-border text-text-on-dark rounded-md px-1 py-2 focus:outline-none focus:border-brand focus:shadow-glow"
                />
              </div>
            </div>

            <button
              onClick={handleShowResults}
              disabled={totalSec <= 0}
              className="w-full mt-5 bg-brand hover:bg-brand-hover text-white font-heading text-sm font-bold py-[13px] rounded-lg transition-all disabled:opacity-40"
            >
              Show me what I need →
            </button>
          </motion.div>

          <motion.p
            className="text-[13px] text-text-dark-muted mt-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
          >
            or{" "}
            <Link href="/signup" className="text-brand hover:text-brand-hover transition-colors">
              connect Strava to start from your real data →
            </Link>
          </motion.p>
        </div>
      </section>

      {/* ─── RESULTS (light contrast) ─── */}
      <div ref={resultsRef} />
      <AnimatePresence>
        {showResults && analysis && (
          <motion.section
            className="bg-bg-page py-16 sm:py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="max-w-[920px] mx-auto px-4 sm:px-6 lg:px-10">
              {/* Section label */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                <span className="font-heading text-[13px] font-semibold uppercase tracking-[1.5px] text-text-secondary">
                  Live Analysis — {analysis.distName} at {formatTimeFromSeconds(totalSec)}
                </span>
              </div>

              {/* Hero result card */}
              <div className="bg-bg-card border border-[#E4E4E8] rounded-2xl p-10 text-center relative overflow-hidden mb-5">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand to-brand-hover" />
                <div className="font-mono text-[10px] uppercase tracking-[2.5px] text-text-muted mb-3">
                  Required Race Pace
                </div>
                <RaceTime value={`${analysis.paceDisplay}/km`} size="hero" />
                <p className="mt-4 text-[15px] text-text-secondary">
                  You&apos;re in the{" "}
                  <span className="inline-block bg-brand-dim text-brand px-2.5 py-[3px] rounded-md font-semibold text-[13px]">
                    {analysis.paceSecKm < 240
                      ? "Elite"
                      : analysis.paceSecKm < 300
                      ? "Sub-elite"
                      : analysis.paceSecKm < 360
                      ? "Club Runner"
                      : "Recreational"}
                  </span>{" "}
                  range.
                </p>
              </div>

              {/* Metrics strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <div className="bg-bg-card border border-[#E4E4E8] rounded-xl p-5">
                  <div className="font-mono text-[10px] uppercase tracking-[2px] text-text-muted mb-2">Easy Pace</div>
                  <div className="font-mono text-[28px] font-bold text-text-primary">{analysis.trainingPaces.easy.split("-")[0]}</div>
                  <div className="text-xs text-text-secondary mt-0.5">/km</div>
                </div>
                <div className="bg-bg-card border border-[#E4E4E8] rounded-xl p-5">
                  <div className="font-mono text-[10px] uppercase tracking-[2px] text-text-muted mb-2">Tempo</div>
                  <div className="font-mono text-[28px] font-bold text-text-primary">{analysis.trainingPaces.tempo.split("-")[0]}</div>
                  <div className="text-xs text-text-secondary mt-0.5">/km</div>
                </div>
                <div className="bg-bg-card border border-[#E4E4E8] rounded-xl p-5">
                  <div className="font-mono text-[10px] uppercase tracking-[2px] text-text-muted mb-2">Interval</div>
                  <div className="font-mono text-[28px] font-bold text-text-primary">{analysis.trainingPaces.interval.split("-")[0]}</div>
                  <div className="text-xs text-text-secondary mt-0.5">/km</div>
                </div>
                {analysis.equivalents[0] && (
                  <div className="bg-bg-card border border-[#E4E4E8] rounded-xl p-5">
                    <div className="font-mono text-[10px] uppercase tracking-[2px] text-text-muted mb-2">{analysis.equivalents[0].name}</div>
                    <div className="font-mono text-[28px] font-bold text-text-primary">{analysis.equivalents[0].time}</div>
                    <div className="text-xs text-text-secondary mt-0.5 font-mono">{analysis.equivalents[0].pace}/km</div>
                  </div>
                )}
              </div>

              {/* Pace bar */}
              <div className="bg-bg-card border border-[#E4E4E8] rounded-xl p-6">
                <div className="font-mono text-[10px] uppercase tracking-[2px] text-text-muted mb-4">
                  Performance Spectrum
                </div>
                <PaceBar pacePerKm={analysis.paceSecKm} />
              </div>

              {/* Equivalents */}
              <div className="bg-bg-card border border-[#E4E4E8] rounded-xl p-6 mt-5">
                <div className="font-mono text-[10px] uppercase tracking-[2px] text-text-muted mb-4">
                  Equivalent Race Times
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {analysis.equivalents.map((eq) => (
                    <div key={eq.name} className="bg-bg-page rounded-lg p-3.5">
                      <div className="font-mono text-[9px] uppercase tracking-[1.5px] text-text-muted mb-1.5">{eq.name}</div>
                      <div className="font-mono text-xl font-bold text-text-primary">{eq.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ─── SAMPLE PLANS ─── */}
      <section className="bg-bg-page py-16 sm:py-20 border-t border-[#E4E4E8]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-text-primary mb-3">
              Free training plans
            </h2>
            <p className="text-text-secondary text-base sm:text-lg max-w-lg mx-auto">
              Browse sample plans for every level — then upgrade to Pro for a plan built around <em>your</em> data.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SAMPLE_PLANS.slice(0, 3).map((plan) => (
              <Link
                key={plan.slug}
                href={`/plans/${plan.slug}`}
                className="group bg-bg-card border border-[#E4E4E8] rounded-xl p-6 hover:border-brand/40 hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${LEVEL_COLORS[plan.level] || ""}`}>
                    {plan.level}
                  </span>
                  <span className="text-[11px] text-text-muted">{plan.weeks}w · {plan.daysPerWeek}×/wk</span>
                </div>
                <h3 className="font-heading font-bold text-base text-text-primary group-hover:text-brand transition-colors mb-1">
                  {plan.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">{plan.subtitle}</p>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/plans" className="text-sm font-medium text-brand hover:text-brand-hover transition-colors">
              View all {SAMPLE_PLANS.length} free plans →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="bg-bg-page py-16 sm:py-20 border-t border-[#E4E4E8]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            {/* Image */}
            <div className="relative rounded-2xl overflow-hidden aspect-[4/5] lg:aspect-[3/4] order-2 lg:order-1">
              <Image
                src="/images/runner-male.webp"
                alt="Runner training in the city at golden hour"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>

            {/* Content */}
            <div className="order-1 lg:order-2">
              <p className="font-mono text-[11px] tracking-[3px] uppercase text-brand mb-4">How it works</p>
              <h2 className="font-heading font-bold text-2xl sm:text-3xl text-text-primary mb-3">
                Powered by your data
              </h2>
              <p className="text-text-secondary text-base mb-8 leading-relaxed">
                Connect your watch. Get intelligent insights. Train smarter.
              </p>
              <div className="space-y-5">
                {[
                  { step: "01", title: "Connect", desc: "Link Strava, Garmin, or enter a recent race result manually." },
                  { step: "02", title: "AI Analyses", desc: "Your history, fitness trends, strengths, and limiters — analysed instantly." },
                  { step: "03", title: "You Get", desc: "A training plan that actually fits your life and your goals." },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4 items-start">
                    <span className="flex-shrink-0 w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center font-mono text-xs font-bold text-brand">
                      {item.step}
                    </span>
                    <div>
                      <h3 className="font-heading font-bold text-base text-text-primary mb-1">{item.title}</h3>
                      <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FREE TOOLS — dark ─── */}
      <section className="bg-bg-dark text-text-on-dark py-16 sm:py-20">
        <div className="max-w-[920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading font-extrabold text-[28px] mb-2">
              Free Tools. No Signup.
            </h2>
            <p className="text-text-dark-sec text-[15px]">
              12 tools. Instant results. Unlimited.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group bg-bg-dark-card border border-bg-dark-border rounded-[10px] p-[18px] hover:border-brand hover:-translate-y-0.5 transition-all"
              >
                <div className="font-mono text-[10px] text-text-dark-muted mb-2.5">{tool.icon}</div>
                <div className="font-heading text-sm font-bold text-text-on-dark mb-1">{tool.title}</div>
                <div className="text-xs text-text-dark-sec">{tool.description}</div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/tools" className="text-sm font-medium text-brand hover:text-brand-hover transition-colors">
              View all 12 tools →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── PRO CTA ─── */}
      <section className="relative bg-bg-dark text-text-on-dark py-20 sm:py-28 overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="/images/runner-female.webp"
            alt="Runner training at sunset in golden light"
            fill
            className="object-cover object-center"
            sizes="100vw"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="font-mono text-[11px] tracking-[3px] uppercase text-brand mb-5">RunSplit Pro</p>
          <h2 className="font-heading font-extrabold text-[32px] sm:text-[40px] text-white mb-4 leading-tight">
            Your AI coach is ready.
          </h2>
          <p className="text-gray-300 text-base max-w-[460px] mx-auto leading-[1.7] mb-8">
            Connect Strava. Set your goal. Get a plan built for your fitness, your schedule, your life.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-brand hover:bg-brand-hover text-white font-heading text-[15px] font-bold px-9 py-3.5 rounded-[10px] transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand/25"
          >
            Get started — £4.99/month
          </Link>
          <p className="text-[13px] text-gray-400 mt-4">
            Cancel anytime. No free trial — just results.
          </p>
        </div>
      </section>
    </div>
  );
}
