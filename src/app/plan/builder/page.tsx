"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { DISTANCES, type DistanceKey } from "@/lib/running-math";
import type { PlanBuilderGoal, PlanBuilderFitness, PlanBuilderPreferences } from "@/types";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function PlanBuilderPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Goal
  const [goal, setGoal] = useState<PlanBuilderGoal>({
    raceDistance: "marathon",
    goalType: "target_time",
    targetTimeSeconds: 14400, // 4 hours
    raceDate: "",
    raceName: "",
  });

  // Step 2: Fitness
  const [fitness, setFitness] = useState<PlanBuilderFitness>({
    recentRaceDistance: "5k",
    recentRaceTimeSeconds: 1500, // 25:00
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

  const handleGenerate = async () => {
    if (!user) return;
    setGenerating(true);
    setError("");

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
        const data = await res.json();
        throw new Error(data.error || "Failed to generate plan");
      }

      const { planId } = await res.json();
      router.push(`/plan?new=${planId}`);
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
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h2 className="font-heading font-bold text-2xl mb-2">Building your training plan...</h2>
          <p className="text-gray-500 max-w-md">
            Our AI coach is creating a personalised {distanceName} plan based on your fitness, goals, and preferences. This takes 15-30 seconds.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-heading font-bold text-3xl mb-2">Build Your Training Plan</h1>
          <p className="text-gray-500">
            Our AI coach will create a personalised plan just for you.
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
                {s < step ? "✓" : s}
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
              Next: Your Fitness →
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
                ← Back
              </button>
              <button onClick={() => setStep(3)} className="flex-1 bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold py-3 rounded-xl transition-colors">
                Next: Preferences →
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
                ← Back
              </button>
              <button onClick={handleGenerate} className="flex-1 bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold py-3 rounded-xl transition-colors">
                Generate My Plan ✨
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

