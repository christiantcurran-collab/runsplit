"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const TOOLS = [
  { href: "/tools/pace", title: "Pace & Speed", description: "Distance + time = pace. Instant results.", icon: "01" },
  { href: "/tools/predict", title: "What Can I Run?", description: "Predict any race time from a recent result.", icon: "02" },
  { href: "/tools/splits", title: "Race Split Planner", description: "Plan your splits. Even or negative.", icon: "03" },
  { href: "/tools/training-paces", title: "Find My Training Paces", description: "Easy, tempo, interval paces from a race.", icon: "04" },
  { href: "/tools/convert", title: "Pace Converter", description: "Convert between min/km, min/mi, km/h.", icon: "05" },
  { href: "/tools/age-grade", title: "How Good Is My Time?", description: "Age-graded performance rating.", icon: "06" },
  { href: "/tools/vo2max", title: "Estimate My VO2max", description: "VO2max and fitness level from any race.", icon: "07" },
  { href: "/tools/heart-rate", title: "My Heart Rate Zones", description: "5-zone training with Karvonen method.", icon: "08" },
  { href: "/tools/calories", title: "Calories Burned", description: "Estimate calories from distance and weight.", icon: "09" },
  { href: "/tools/treadmill", title: "Treadmill vs Outdoor", description: "Convert treadmill incline to road effort.", icon: "10" },
  { href: "/tools/negative-split", title: "Negative Split Strategy", description: "Start slower, finish stronger.", icon: "11" },
  { href: "/tools/run-walk", title: "Run/Walk Planner", description: "Run/walk intervals for any distance.", icon: "12" },
];

export default function HomePage() {
  const [selectedDist, setSelectedDist] = useState<string>("marathon");
  const [targetH, setTargetH] = useState(3);
  const [targetM, setTargetM] = useState(30);
  const [targetS, setTargetS] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const distMeters = DISTANCES[selectedDist as DistanceKey]?.meters || 42195;
  const totalSec = timeToSeconds({ hours: targetH, minutes: targetM, seconds: targetS });

  const analysis = useMemo(() => {
    if (totalSec <= 0) return null;
    const paceKm = calculatePace(distMeters, totalSec, "km");
    const paceSecKm = calculatePaceSeconds(distMeters, totalSec, "km");
    const trainingPaces = calculateTrainingPaces(distMeters, totalSec);
    const distName = DISTANCES[selectedDist as DistanceKey]?.name || "Race";

    // Equivalent times
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
      {/* Hero — full viewport, dark */}
      <section className="bg-bg-dark text-text-on-dark min-h-[90vh] flex items-center relative overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-bg-dark via-bg-dark to-brand/5" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-[1.1] mb-6 tracking-tight">
              Know Your Numbers.
              <br />
              <span className="text-brand">Run Your Best.</span>
            </h1>
            <p className="text-zinc-400 text-lg sm:text-xl max-w-xl mx-auto leading-relaxed">
              AI-powered pacing, race predictions, and custom training plans for runners who take it seriously.
            </p>
          </div>

          {/* Smart Input */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/[0.04] backdrop-blur border border-white/[0.08] rounded-2xl p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                    I want to run a
                  </label>
                  <select
                    value={selectedDist}
                    onChange={(e) => setSelectedDist(e.target.value)}
                    className="w-full h-12 bg-white/[0.08] border border-white/[0.12] text-white font-heading font-semibold text-lg rounded-lg px-4 focus:outline-none focus:border-brand focus:shadow-glow transition-all appearance-none cursor-pointer"
                  >
                    {Object.entries(DISTANCES).map(([key, d]) => (
                      <option key={key} value={key} className="bg-bg-dark text-white">
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                    in
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0} max={99}
                      value={targetH}
                      onChange={(e) => setTargetH(Number(e.target.value) || 0)}
                      className="w-14 h-12 text-center font-mono text-xl bg-white/[0.08] border border-white/[0.12] text-white rounded-lg focus:outline-none focus:border-brand focus:shadow-glow transition-all"
                    />
                    <span className="font-mono text-2xl font-bold text-white/30">:</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0} max={59}
                      value={targetM}
                      onChange={(e) => setTargetM(Math.min(59, Number(e.target.value) || 0))}
                      className="w-14 h-12 text-center font-mono text-xl bg-white/[0.08] border border-white/[0.12] text-white rounded-lg focus:outline-none focus:border-brand focus:shadow-glow transition-all"
                    />
                    <span className="font-mono text-2xl font-bold text-white/30">:</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0} max={59}
                      value={targetS}
                      onChange={(e) => setTargetS(Math.min(59, Number(e.target.value) || 0))}
                      className="w-14 h-12 text-center font-mono text-xl bg-white/[0.08] border border-white/[0.12] text-white rounded-lg focus:outline-none focus:border-brand focus:shadow-glow transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowResults(true)}
                disabled={totalSec <= 0}
                className="w-full mt-6 bg-brand hover:bg-brand-hover text-white font-heading font-semibold py-3.5 rounded-xl text-base transition-all disabled:opacity-40 hover:shadow-glow"
              >
                Show me what I need →
              </button>
            </div>

            <p className="text-center text-sm text-zinc-600 mt-4">
              or{" "}
              <Link href="/signup" className="text-brand hover:text-brand-hover font-medium transition-colors">
                connect Strava to start from your actual data →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Analysis Results (appears after clicking button) */}
      <AnimatePresence>
        {showResults && analysis && (
          <motion.section
            className="bg-bg-page py-16 sm:py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10">
                <h2 className="font-heading font-bold text-2xl sm:text-3xl text-text-primary mb-2">
                  Your {analysis.distName} Breakdown
                </h2>
                <p className="text-text-secondary">
                  Here&apos;s what it takes to run {formatTimeFromSeconds(totalSec)}
                </p>
              </div>

              {/* Race pace hero */}
              <div className="bg-bg-card rounded-2xl border border-gray-100 shadow-sm p-8 mb-6">
                <div className="text-center mb-6">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Required Race Pace</span>
                  <div className="mt-2">
                    <RaceTime value={`${analysis.paceDisplay}/km`} size="xl" />
                  </div>
                </div>
                <PaceBar pacePerKm={analysis.paceSecKm} />
              </div>

              {/* Training paces + equivalents */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="bg-bg-card rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-4">
                    Your Training Paces
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">Easy</span>
                      <span className="font-mono font-semibold text-lg text-text-primary">{analysis.trainingPaces.easy}/km</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">Tempo</span>
                      <span className="font-mono font-semibold text-lg text-text-primary">{analysis.trainingPaces.tempo}/km</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">Interval</span>
                      <span className="font-mono font-semibold text-lg text-text-primary">{analysis.trainingPaces.interval}/km</span>
                    </div>
                  </div>
                </div>

                <div className="bg-bg-card rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-4">
                    Equivalent Race Times
                  </h3>
                  <div className="space-y-4">
                    {analysis.equivalents.map((eq) => (
                      <div key={eq.name} className="flex items-center justify-between">
                        <span className="text-sm text-text-secondary">{eq.name}</span>
                        <div className="text-right">
                          <span className="font-mono font-semibold text-lg text-text-primary">{eq.time}</span>
                          <span className="text-xs text-text-muted ml-2">{eq.pace}/km</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="bg-gradient-to-r from-brand to-brand-hover rounded-2xl p-8 text-center text-white">
                <h3 className="font-heading font-bold text-xl sm:text-2xl mb-3">
                  Get a personalised training plan for {formatTimeFromSeconds(totalSec)}
                </h3>
                <p className="text-white/80 mb-6 max-w-md mx-auto">
                  Our AI coach will build a plan around your fitness, schedule, and this goal.
                </p>
                <Link
                  href="/signup"
                  className="inline-block bg-white text-brand font-heading font-bold px-8 py-3.5 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Start Free Trial →
                </Link>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Section 2: Powered by your data */}
      <section className="bg-bg-page py-16 sm:py-20 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-text-primary mb-3">
              Powered by your data
            </h2>
            <p className="text-text-secondary text-lg">
              Connect your watch. Get intelligent insights.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Connect", desc: "Link Strava, Garmin, or enter a recent race result manually." },
              { step: "02", title: "AI Analyses", desc: "Your history, fitness trends, strengths, and limiters — analysed instantly." },
              { step: "03", title: "You Get", desc: "A training plan that actually fits your life and your goals." },
            ].map((item) => (
              <div key={item.step} className="bg-bg-card rounded-2xl border border-gray-100 p-6 shadow-sm">
                <span className="font-mono text-xs font-bold text-brand tracking-wider">{item.step}</span>
                <h3 className="font-heading font-bold text-lg text-text-primary mt-3 mb-2">{item.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Free tools grid */}
      <section className="bg-bg-dark text-text-on-dark py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-2xl sm:text-3xl mb-3">
              Free tools, no signup
            </h2>
            <p className="text-zinc-400 text-lg">
              12 running tools. Instant results. Unlimited use.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group bg-white/[0.04] border border-white/[0.08] rounded-xl p-5 hover:border-brand/50 hover:bg-white/[0.06] transition-all"
              >
                <span className="font-mono text-xs font-bold text-brand/60 tracking-wider">{tool.icon}</span>
                <h3 className="font-heading font-semibold text-white mt-2 mb-1 group-hover:text-brand transition-colors">
                  {tool.title}
                </h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{tool.description}</p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-brand mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open tool
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Pro CTA */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-brand/5 via-bg-page to-bg-page">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-text-primary mb-4">
            Your AI coach is ready.
          </h2>
          <p className="text-text-secondary text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            Connect your Strava. Tell us your goal. Get a plan built around your fitness, your schedule, and your life — not a generic PDF.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <Link
              href="/signup"
              className="bg-brand hover:bg-brand-hover text-white font-heading font-bold px-8 py-4 rounded-xl text-lg transition-colors shadow-glow"
            >
              Start Free Trial
            </Link>
          </div>
          <p className="text-sm text-text-muted">
            £4.99/month · Cancel anytime · 7-day free trial
          </p>
        </div>
      </section>

      {/* Section 5: Stats */}
      <section className="bg-bg-dark text-text-on-dark py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="font-mono font-bold text-3xl sm:text-4xl text-brand">12</div>
              <div className="text-xs text-zinc-500 mt-1 uppercase tracking-wider">Free Tools</div>
            </div>
            <div>
              <div className="font-mono font-bold text-3xl sm:text-4xl text-brand">0</div>
              <div className="text-xs text-zinc-500 mt-1 uppercase tracking-wider">Signup Required</div>
            </div>
            <div>
              <div className="font-mono font-bold text-3xl sm:text-4xl text-brand">AI</div>
              <div className="text-xs text-zinc-500 mt-1 uppercase tracking-wider">Powered Coach</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
