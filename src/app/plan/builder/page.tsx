"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { DISTANCES, type DistanceKey } from "@/lib/running-math";
import type { PlanBuilderGoal, PlanBuilderFitness, PlanBuilderPreferences } from "@/types";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const PROGRESS_TIPS = [
  "Your plan will include personalised paces based on your recent race time.",
  "Each workout is designed with a specific purpose — no junk miles.",
  "Recovery weeks are built in every 3-4 weeks to prevent injury.",
  "The plan follows the 80/20 rule — 80% easy running, 20% quality work.",
  "Your long run will build progressively week over week.",
  "Taper weeks at the end ensure you're fresh on race day.",
];

export default function PlanBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justSubscribed = searchParams.get("subscribed") === "true";
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  // Streaming progress state
  const [progressPhase, setProgressPhase] = useState("");
  const [progressMessage, setProgressMessage] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [weeksBuilt, setWeeksBuilt] = useState(0);
  const [totalWeeks, setTotalWeeks] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const tipIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Step 1: Goal
  const [goal, setGoal] = useState<PlanBuilderGoal>({
    raceDistance: "marathon",
    goalType: "target_time",
    targetTimeSeconds: 14400,
    raceDate: "",
    raceName: "",
  });

  // Step 2: Fitness
  const [fitness, setFitness] = useState<PlanBuilderFitness>({
    recentRaceDistance: "5k",
    recentRaceTimeSeconds: 1500,
    currentWeeklyKm: profile?.current_weekly_km || 15,
    longestRecentRunKm: 5,
    trainingDaysPerWeek: 3,
    longRunDay: "sunday",
  });

  // Step 3: Preferences
  const [preferences, setPreferences] = useState<PlanBuilderPreferences>({
    includeCrossTraining: false,
    includeStrength: true,
    restDays: [],
    injuryConcerns: "",
  });

  // Target time helpers
  const [targetHours, setTargetHours] = useState(4);
  const [targetMinutes, setTargetMinutes] = useState(0);
  const [targetSeconds, setTargetSeconds] = useState(0);

  // Recent race time helpers
  const [recentHours, setRecentHours] = useState(0);
  const [recentMinutes, setRecentMinutes] = useState(25);
  const [recentSeconds, setRecentSeconds] = useState(0);

  // Rotate tips during generation
  useEffect(() => {
    if (generating) {
      tipIntervalRef.current = setInterval(() => {
        setTipIndex((prev) => (prev + 1) % PROGRESS_TIPS.length);
      }, 5000);
    } else {
      if (tipIntervalRef.current) clearInterval(tipIntervalRef.current);
    }
    return () => {
      if (tipIntervalRef.current) clearInterval(tipIntervalRef.current);
    };
  }, [generating]);

  const handleGenerate = async () => {
    if (!user) return;
    setGenerating(true);
    setError("");
    setProgressPhase("connecting");
    setProgressMessage("Starting your plan generation...");
    setProgressPercent(5);
    setWeeksBuilt(0);
    setTipIndex(0);

    const targetTimeSec = targetHours * 3600 + targetMinutes * 60 + targetSeconds;
    const recentTimeSec = recentHours * 3600 + recentMinutes * 60 + recentSeconds;

    const finalGoal = {
      ...goal,
      targetTimeSeconds: goal.goalType === "target_time" ? targetTimeSec : undefined,
    };
    const finalFitness = {
      ...fitness,
      recentRaceTimeSeconds: recentTimeSec,
    };

    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: finalGoal,
          fitness: finalFitness,
          preferences,
          userId: user.id,
        }),
      });

      if (!res.ok) {
        // If it's not SSE, treat as error
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const data = await res.json();
          throw new Error(data.error || "Failed to generate plan");
        }
        throw new Error("Failed to generate plan");
      }

      // Handle SSE stream
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response stream available");
      }

      let buffer = "";

      // Process a single SSE event — returns true if we should stop reading
      const processEvent = (eventType: string, eventData: string): boolean => {
        try {
          const data = JSON.parse(eventData);

          if (eventType === "progress") {
            setProgressPhase(data.phase);
            setProgressMessage(data.message);
            setProgressPercent(data.percent);
            if (data.weeksBuilt !== undefined) setWeeksBuilt(data.weeksBuilt);
            if (data.totalWeeks !== undefined) setTotalWeeks(data.totalWeeks);
          } else if (eventType === "complete") {
            router.push(`/plan?new=${data.planId}`);
            return true; // stop reading
          } else if (eventType === "error") {
            throw new Error(data.message);
          }
        } catch (parseErr) {
          if (parseErr instanceof Error && parseErr.message !== "Unexpected end of JSON input") {
            throw parseErr;
          }
        }
        return false;
      };

      let shouldStop = false;

      while (!shouldStop) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE events from buffer
        // Each SSE event is: "event: <type>\ndata: <json>\n\n"
        // We split on double-newline to find complete events
        let eventBoundary = buffer.indexOf("\n\n");
        while (eventBoundary !== -1) {
          const rawEvent = buffer.slice(0, eventBoundary);
          buffer = buffer.slice(eventBoundary + 2);

          let eventType = "";
          let eventData = "";

          for (const line of rawEvent.split("\n")) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              eventData = line.slice(6);
            }
          }

          if (eventType && eventData) {
            shouldStop = processEvent(eventType, eventData);
            if (shouldStop) return;
          }

          eventBoundary = buffer.indexOf("\n\n");
        }
      }

      // If stream ended without a "complete" event, try to process remaining buffer
      if (buffer.trim()) {
        let eventType = "";
        let eventData = "";
        for (const line of buffer.split("\n")) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            eventData = line.slice(6);
          }
        }
        if (eventType && eventData) {
          processEvent(eventType, eventData);
          return;
        }
      }

      // If we get here, stream ended without a complete event — redirect anyway
      // The plan was likely saved; just go to the dashboard
      console.warn("SSE stream ended without complete event — redirecting to plan dashboard");
      router.push("/plan");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate plan. Please try again.");
      setGenerating(false);
    }
  };

  const distanceName =
    goal.raceDistance === "custom"
      ? `${((goal.customDistanceMeters || 42195) / 1000).toFixed(1)}km`
      : DISTANCES[goal.raceDistance as DistanceKey]?.name || "Marathon";

  if (generating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          {/* Animated progress ring */}
          <div className="relative w-28 h-28 mx-auto mb-8">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#E5E7EB" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="52" fill="none"
                stroke="#3B82F6" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 52}`}
                strokeDashoffset={`${2 * Math.PI * 52 * (1 - progressPercent / 100)}`}
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-heading font-bold text-2xl text-brand-orange">
                {progressPercent}%
              </span>
            </div>
          </div>

          {/* Phase title */}
          <h2 className="font-heading font-bold text-2xl mb-2 text-text-primary">
            {progressPhase === "complete"
              ? "Plan Ready!"
              : `Building your ${distanceName} plan`}
          </h2>

          {/* Progress message */}
          <p className="text-text-secondary mb-4 transition-all duration-300">
            {progressMessage}
          </p>

          {/* Weeks counter */}
          {weeksBuilt > 0 && totalWeeks > 0 && (
            <div className="mb-6">
              <div className="flex justify-between text-xs text-text-muted mb-1.5">
                <span>Week {weeksBuilt}</span>
                <span>{totalWeeks} weeks total</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand to-brand-hover rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(weeksBuilt / totalWeeks) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Progress steps */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 text-left">
            <div className="space-y-3">
              {[
                { key: "analyzing", label: "Analysing fitness profile" },
                { key: "designing", label: "Designing plan structure" },
                { key: "building", label: "Building weekly workouts" },
                { key: "finalizing", label: "Finalising plan" },
                { key: "saving", label: "Saving to your account" },
              ].map((step) => {
                const phases = ["analyzing", "designing", "building", "finalizing", "saving", "complete"];
                const currentIdx = phases.indexOf(progressPhase);
                const stepIdx = phases.indexOf(step.key);
                const isComplete = currentIdx > stepIdx;
                const isCurrent = currentIdx === stepIdx;

                return (
                  <div key={step.key} className="flex items-center gap-3">
                    {isComplete ? (
                      <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center flex-shrink-0">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : isCurrent ? (
                      <div className="w-6 h-6 rounded-full border-2 border-brand flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-2 bg-brand rounded-full animate-pulse" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-200 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${isComplete ? "text-text-primary font-medium" : isCurrent ? "text-brand font-medium" : "text-text-muted"}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rotating tips */}
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700 transition-all duration-500">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span key={tipIndex} className="animate-fade-up">{PROGRESS_TIPS[tipIndex]}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Welcome banner after subscription */}
        {justSubscribed && (
          <div className="bg-brand/10 border border-brand/20 rounded-xl p-4 mb-6 text-center">
            <p className="text-brand font-semibold text-sm">
              Welcome to RunSplit Pro! 🎉 Let&apos;s build your personalised training plan.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-heading font-bold text-3xl mb-2">Build Your Training Plan</h1>
          <p className="text-gray-500">
            Answer 3 quick questions and our AI coach will create a plan just for you.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  s === step
                    ? "bg-brand-orange text-white"
                    : s < step
                    ? "bg-brand-green text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {s < step ? "\u2713" : s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 ${s < step ? "bg-brand-green" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-6">{error}</div>}

        {/* Step 1: Your Goal */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <h2 className="font-heading font-semibold text-xl mb-6">Step 1: Your Goal</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Race Distance</label>
                <select
                  value={goal.raceDistance}
                  onChange={(e) => setGoal({ ...goal, raceDistance: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange bg-white"
                >
                  {Object.entries(DISTANCES).map(([key, d]) => (
                    <option key={key} value={key}>{d.name}</option>
                  ))}
                  <option value="custom">Custom Distance</option>
                </select>
              </div>

              {goal.raceDistance === "custom" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custom Distance (meters)</label>
                  <input type="number" value={goal.customDistanceMeters || 10000} onChange={(e) => setGoal({ ...goal, customDistanceMeters: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goal Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "finish", label: "Just Finish", desc: "Complete the distance" },
                    { value: "target_time", label: "Target Time", desc: "Hit a specific time" },
                    { value: "pr", label: "Beat My PR", desc: "Set a personal best" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setGoal({ ...goal, goalType: opt.value as "finish" | "target_time" | "pr" })}
                      className={`p-3 rounded-xl border-2 text-left transition-colors ${
                        goal.goalType === opt.value
                          ? "border-brand-orange bg-brand-orange/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-sm font-semibold">{opt.label}</div>
                      <div className="text-xs text-gray-500">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {goal.goalType === "target_time" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Finish Time</label>
                  <div className="flex items-center gap-1">
                    <input type="number" min={0} max={99} value={targetHours} onChange={(e) => setTargetHours(Number(e.target.value))}
                      className="w-20 text-center font-mono text-lg border border-gray-300 rounded-lg px-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-orange" placeholder="HH" />
                    <span className="text-gray-400 font-mono text-xl font-bold">:</span>
                    <input type="number" min={0} max={59} value={targetMinutes} onChange={(e) => setTargetMinutes(Number(e.target.value))}
                      className="w-20 text-center font-mono text-lg border border-gray-300 rounded-lg px-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-orange" placeholder="MM" />
                    <span className="text-gray-400 font-mono text-xl font-bold">:</span>
                    <input type="number" min={0} max={59} value={targetSeconds} onChange={(e) => setTargetSeconds(Number(e.target.value))}
                      className="w-20 text-center font-mono text-lg border border-gray-300 rounded-lg px-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-orange" placeholder="SS" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Race Date</label>
                  <input type="date" value={goal.raceDate} onChange={(e) => setGoal({ ...goal, raceDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Race Name (optional)</label>
                  <input type="text" value={goal.raceName || ""} onChange={(e) => setGoal({ ...goal, raceName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange" placeholder="e.g. London Marathon" />
                </div>
              </div>
            </div>

            <button onClick={() => setStep(2)}
              disabled={!goal.raceDate}
              className="w-full mt-8 bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50">
              Next: Your Fitness &rarr;
            </button>
          </div>
        )}

        {/* Step 2: Your Fitness */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <h2 className="font-heading font-semibold text-xl mb-6">Step 2: Your Current Fitness</h2>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recent Race Distance</label>
                  <select value={fitness.recentRaceDistance} onChange={(e) => setFitness({ ...fitness, recentRaceDistance: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange bg-white">
                    {Object.entries(DISTANCES).map(([key, d]) => (
                      <option key={key} value={key}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Time</label>
                  <div className="flex items-center gap-1">
                    <input type="number" min={0} value={recentHours} onChange={(e) => setRecentHours(Number(e.target.value))}
                      className="w-14 text-center font-mono border border-gray-300 rounded-lg px-1 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange" />
                    <span className="text-gray-400 font-bold">:</span>
                    <input type="number" min={0} max={59} value={recentMinutes} onChange={(e) => setRecentMinutes(Number(e.target.value))}
                      className="w-14 text-center font-mono border border-gray-300 rounded-lg px-1 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange" />
                    <span className="text-gray-400 font-bold">:</span>
                    <input type="number" min={0} max={59} value={recentSeconds} onChange={(e) => setRecentSeconds(Number(e.target.value))}
                      className="w-14 text-center font-mono border border-gray-300 rounded-lg px-1 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Weekly km</label>
                  <input type="number" min={0} value={fitness.currentWeeklyKm} onChange={(e) => setFitness({ ...fitness, currentWeeklyKm: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longest Recent Run (km)</label>
                  <input type="number" min={0} value={fitness.longestRecentRunKm} onChange={(e) => setFitness({ ...fitness, longestRecentRunKm: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Running Days / Week</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                    <button key={d} type="button"
                      onClick={() => setFitness({ ...fitness, trainingDaysPerWeek: d })}
                      className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-semibold transition-colors ${
                        fitness.trainingDaysPerWeek === d ? "border-brand-orange bg-brand-orange/5 text-brand-orange" : "border-gray-200 text-gray-600"
                      }`}>
                      {d}
                    </button>
                  ))}
                </div>
                {fitness.trainingDaysPerWeek <= 2 && (
                  <p className="text-xs text-gray-500 mt-1.5">
                    With {fitness.trainingDaysPerWeek === 1 ? "1 day" : "2 days"}/week, your plan will focus on quality over quantity with longer individual runs.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Long Run Day</label>
                  <div className="flex gap-2">
                    {(["saturday", "sunday"] as const).map((d) => (
                      <button key={d} type="button"
                        onClick={() => setFitness({ ...fitness, longRunDay: d })}
                        className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-semibold transition-colors capitalize ${
                          fitness.longRunDay === d ? "border-brand-orange bg-brand-orange/5 text-brand-orange" : "border-gray-200 text-gray-600"
                        }`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep(1)} className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors">
                &larr; Back
              </button>
              <button onClick={() => setStep(3)} className="flex-1 bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold py-3 rounded-xl transition-colors">
                Next: Preferences &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preferences */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <h2 className="font-heading font-semibold text-xl mb-6">Step 3: Preferences</h2>

            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-700">Include cross-training?</div>
                  <div className="text-xs text-gray-500">Cycling, swimming, or other cardio on rest days</div>
                </div>
                <button type="button" onClick={() => setPreferences({ ...preferences, includeCrossTraining: !preferences.includeCrossTraining })}
                  className={`w-12 h-7 rounded-full transition-colors relative ${preferences.includeCrossTraining ? "bg-brand-orange" : "bg-gray-300"}`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${preferences.includeCrossTraining ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-700">Include strength work?</div>
                  <div className="text-xs text-gray-500">Core and strength exercises for injury prevention</div>
                </div>
                <button type="button" onClick={() => setPreferences({ ...preferences, includeStrength: !preferences.includeStrength })}
                  className={`w-12 h-7 rounded-full transition-colors relative ${preferences.includeStrength ? "bg-brand-orange" : "bg-gray-300"}`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${preferences.includeStrength ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Days you absolutely cannot run:</label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((day, i) => (
                    <button key={day} type="button"
                      onClick={() => {
                        const days = preferences.restDays.includes(i)
                          ? preferences.restDays.filter((d) => d !== i)
                          : [...preferences.restDays, i];
                        setPreferences({ ...preferences, restDays: days });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-colors ${
                        preferences.restDays.includes(i) ? "border-red-400 bg-red-50 text-red-600" : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}>
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Injury concerns (optional)</label>
                <textarea value={preferences.injuryConcerns || ""} onChange={(e) => setPreferences({ ...preferences, injuryConcerns: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange resize-none" rows={3}
                  placeholder="e.g. History of shin splints, tight IT band..." />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep(2)} className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors">
                &larr; Back
              </button>
              <button onClick={handleGenerate} className="flex-1 bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold py-3 rounded-xl transition-colors">
                Generate My Plan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
