"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase";
import type { TrainingPlanRow } from "@/types";
import { calculateSplits, formatTimeFromSeconds } from "@/lib/running-math";

type SplitStrategy = "even" | "negative" | "positive";

export default function RaceDayPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [plan, setPlan] = useState<TrainingPlanRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [strategy, setStrategy] = useState<SplitStrategy>("negative");

  useEffect(() => {
    if (!user) return;
    loadPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadPlan() {
    const { data } = await supabase
      .from("training_plans")
      .select("*")
      .eq("user_id", user!.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    setPlan(data);
    setLoading(false);
  }

  const splits = useMemo(() => {
    if (!plan?.goal_race_time_seconds) return [];
    const distKm = plan.goal_race_distance_meters / 1000;
    const numSplits = Math.ceil(distKm);
    // Positive gradient = slower start, faster finish (negative split)
    // Negative gradient = faster start, slower finish (positive split)
    return calculateSplits(plan.goal_race_time_seconds, distKm, numSplits, strategy === "negative" ? 2 : strategy === "positive" ? -2 : 0);
  }, [plan, strategy]);

  const daysUntilRace = useMemo(() => {
    if (!plan) return 0;
    const race = new Date(plan.goal_race_date);
    const today = new Date();
    return Math.max(0, Math.ceil((race.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  }, [plan]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-brand-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="font-heading font-bold text-2xl mb-3">No plan found</h2>
          <Link href="/plan/builder" className="text-brand-orange hover:text-brand-orange-hover font-semibold">
            Create a new plan →
          </Link>
        </div>
      </div>
    );
  }

  const distKm = plan.goal_race_distance_meters / 1000;
  const targetPacePerKm = plan.goal_race_time_seconds ? plan.goal_race_time_seconds / distKm : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-brand-black text-white py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/plan" className="text-gray-400 hover:text-white transition-colors">← Dashboard</Link>
            <h1 className="font-heading font-bold text-xl sm:text-2xl">Race Day Strategy</h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Countdown */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 text-center">
          <div className="text-6xl font-heading font-black text-brand-orange mb-1">{daysUntilRace}</div>
          <div className="text-gray-500 text-sm font-medium">days until race day</div>
          <div className="text-gray-400 text-xs mt-1">
            {new Date(plan.goal_race_date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>

        {/* Target overview */}
        {plan.goal_race_time_seconds && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="text-xs text-gray-500 mb-1">Target Time</div>
              <div className="font-mono text-xl font-bold">{formatTimeFromSeconds(plan.goal_race_time_seconds)}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="text-xs text-gray-500 mb-1">Target Pace</div>
              <div className="font-mono text-xl font-bold">{formatTimeFromSeconds(Math.round(targetPacePerKm))}/km</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="text-xs text-gray-500 mb-1">Distance</div>
              <div className="font-mono text-xl font-bold">{distKm}km</div>
            </div>
          </div>
        )}

        {/* Split Strategy */}
        {plan.goal_race_time_seconds && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="font-heading font-semibold text-lg mb-4">Split Strategy</h2>

            <div className="flex gap-2 mb-6">
              {([
                { key: "negative", label: "Negative Split", desc: "Start slow, finish fast (recommended)" },
                { key: "even", label: "Even Split", desc: "Steady pace throughout" },
                { key: "positive", label: "Positive Split", desc: "Start fast, slow down late" },
              ] as const).map((s) => (
                <button key={s.key} onClick={() => setStrategy(s.key)}
                  className={`flex-1 p-3 rounded-xl border-2 text-left transition-colors ${
                    strategy === s.key ? "border-brand-orange bg-brand-orange/5" : "border-gray-200 hover:border-gray-300"
                  }`}>
                  <div className="text-sm font-semibold">{s.label}</div>
                  <div className="text-xs text-gray-500">{s.desc}</div>
                </button>
              ))}
            </div>

            {/* Split table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                    <th className="pb-2 font-medium">km</th>
                    <th className="pb-2 font-medium">Split Time</th>
                    <th className="pb-2 font-medium">Pace / km</th>
                    <th className="pb-2 font-medium">Cumulative</th>
                  </tr>
                </thead>
                <tbody>
                  {splits.map((split, i) => {
                    const cumulative = splits.slice(0, i + 1).reduce((a, b) => a + b, 0);
                    return (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-2 font-mono font-bold">{i + 1}</td>
                        <td className="py-2 font-mono">{formatTimeFromSeconds(Math.round(split))}</td>
                        <td className="py-2 font-mono">{formatTimeFromSeconds(Math.round(split))}/km</td>
                        <td className="py-2 font-mono text-gray-500">{formatTimeFromSeconds(Math.round(cumulative))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Race Day Checklist */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-heading font-semibold text-lg mb-4">Race Day Checklist</h2>
          <div className="space-y-3">
            {[
              { category: "🌙 Night Before", items: ["Lay out race outfit, bib, shoes", "Charge watch / phone", "Plan breakfast and wake-up time", "Set 2 alarms"] },
              { category: "🌅 Morning Of", items: ["Eat 2-3 hours before start", "Light carbs + coffee (if you usually drink it)", "Apply anti-chafe / sunscreen", "Dynamic warm-up 15 min before start"] },
              { category: "🏃 During Race", items: [`Start at planned pace (${targetPacePerKm ? formatTimeFromSeconds(Math.round(targetPacePerKm)) + "/km" : "easy"})`, "Fuel every 30-45 min (gels/chews)", "Drink at every aid station (don't skip early ones)", "Stay relaxed — drop shoulders, unclench hands"] },
              { category: "🏁 After Race", items: ["Walk for 10-15 minutes", "Stretch gently", "Refuel within 30 minutes", "Celebrate! 🎉"] },
            ].map((section) => (
              <div key={section.category}>
                <div className="text-sm font-semibold mb-2">{section.category}</div>
                <div className="space-y-1 ml-4">
                  {section.items.map((item, i) => (
                    <label key={i} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input type="checkbox" className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange" />
                      {item}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}





