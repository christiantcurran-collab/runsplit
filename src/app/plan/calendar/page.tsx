"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase";
import type { TrainingPlanRow } from "@/types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WORKOUT_BADGES: Record<string, { bg: string; text: string; abbr: string }> = {
  easy: { bg: "bg-green-500", text: "text-white", abbr: "E" },
  long: { bg: "bg-blue-500", text: "text-white", abbr: "L" },
  tempo: { bg: "bg-orange-500", text: "text-white", abbr: "T" },
  interval: { bg: "bg-red-500", text: "text-white", abbr: "I" },
  race_pace: { bg: "bg-purple-500", text: "text-white", abbr: "RP" },
  recovery: { bg: "bg-gray-400", text: "text-white", abbr: "R" },
  cross_train: { bg: "bg-violet-500", text: "text-white", abbr: "X" },
  strength: { bg: "bg-amber-500", text: "text-white", abbr: "S" },
  rest: { bg: "bg-gray-200", text: "text-gray-500", abbr: "–" },
};

export default function CalendarPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [plan, setPlan] = useState<TrainingPlanRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

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

    // Auto-expand current week
    if (data) {
      const planStart = new Date(data.plan_start_date);
      const today = new Date();
      const diffDays = Math.floor((today.getTime() - planStart.getTime()) / (1000 * 60 * 60 * 24));
      const weekNum = Math.floor(diffDays / 7) + 1;
      setExpandedWeek(weekNum);
    }
  }

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

  const weeks = plan.plan_data.weeks || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-brand-black text-white py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/plan" className="text-gray-400 hover:text-white transition-colors">
              ← Dashboard
            </Link>
            <h1 className="font-heading font-bold text-xl sm:text-2xl">{plan.name} — Calendar</h1>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-6">
          {Object.entries(WORKOUT_BADGES).filter(([k]) => k !== "rest").map(([key, badge]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-5 h-5 rounded ${badge.bg} ${badge.text} flex items-center justify-center text-xs font-bold`}>
                {badge.abbr}
              </div>
              <span className="text-xs text-gray-500 capitalize">{key.replace("_", " ")}</span>
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="space-y-3">
          {weeks.map((week) => {
            const isExpanded = expandedWeek === week.weekNumber;
            const planStart = new Date(plan.plan_start_date);
            const weekStart = new Date(planStart);
            weekStart.setDate(weekStart.getDate() + (week.weekNumber - 1) * 7);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);

            return (
              <div key={week.weekNumber} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Week header - clickable */}
                <button
                  onClick={() => setExpandedWeek(isExpanded ? null : week.weekNumber)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      week.isRecoveryWeek ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-700"
                    }`}>
                      {week.weekNumber}
                    </div>
                    <div>
                      <span className="text-sm font-semibold">Week {week.weekNumber}: {week.phase}</span>
                      <span className="text-xs text-gray-400 ml-2">
                        {weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – {weekEnd.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    {week.isRecoveryWeek && (
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Recovery</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Mini workout dots */}
                    <div className="hidden sm:flex gap-1">
                      {week.days.map((day, i) => {
                        const type = day.workout?.type || "rest";
                        const badge = WORKOUT_BADGES[type] || WORKOUT_BADGES.rest;
                        return (
                          <div key={i} className={`w-5 h-5 rounded ${badge.bg} ${badge.text} flex items-center justify-center text-[10px] font-bold`} title={WEEKDAYS[i]}>
                            {badge.abbr}
                          </div>
                        );
                      })}
                    </div>
                    <span className="text-sm text-gray-500 font-mono">{week.targetKm}km</span>
                    <svg className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                      {week.days.map((day, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs font-bold text-gray-400 mb-2">{WEEKDAYS[idx]}</div>
                          {day.workout ? (
                            <>
                              <div className="flex items-center gap-1.5 mb-1">
                                <div className={`w-4 h-4 rounded text-[8px] font-bold flex items-center justify-center ${WORKOUT_BADGES[day.workout.type]?.bg || "bg-gray-300"} text-white`}>
                                  {WORKOUT_BADGES[day.workout.type]?.abbr || "?"}
                                </div>
                                <span className="text-sm font-semibold capitalize">{day.workout.type.replace("_", " ")}</span>
                              </div>
                              <div className="text-sm font-mono text-brand-orange font-bold">{day.workout.distanceKm}km</div>
                              <p className="text-xs text-gray-600 mt-1">{day.workout.description}</p>
                              {day.workout.notes && (
                                <p className="text-xs text-gray-400 mt-1 italic">{day.workout.notes}</p>
                              )}
                            </>
                          ) : (
                            <div className="text-sm text-gray-400">Rest Day</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}





