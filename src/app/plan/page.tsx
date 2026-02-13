"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase";
import type { TrainingPlanRow, Workout } from "@/types";
import { formatTimeFromSeconds } from "@/lib/running-math";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WORKOUT_COLORS: Record<string, string> = {
  easy: "bg-green-100 text-green-700 border-green-200",
  long: "bg-blue-100 text-blue-700 border-blue-200",
  tempo: "bg-orange-100 text-orange-700 border-orange-200",
  interval: "bg-red-100 text-red-700 border-red-200",
  race_pace: "bg-purple-100 text-purple-700 border-purple-200",
  recovery: "bg-gray-100 text-gray-600 border-gray-200",
  rest: "bg-white text-gray-400 border-gray-100",
  cross_train: "bg-violet-100 text-violet-700 border-violet-200",
  strength: "bg-amber-100 text-amber-700 border-amber-200",
};

export default function PlanDashboard() {
  const { user } = useAuth();
  const supabase = createClient();
  const [plan, setPlan] = useState<TrainingPlanRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedWorkouts, setCompletedWorkouts] = useState<Set<string>>(new Set());

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

    // Load completed workouts
    if (data) {
      const { data: logs } = await supabase
        .from("training_log")
        .select("planned_workout_id")
        .eq("plan_id", data.id)
        .eq("completed", true);
      if (logs) {
        setCompletedWorkouts(new Set(logs.map((l) => l.planned_workout_id).filter(Boolean)));
      }
    }
  }

  // Determine current week
  const currentWeek = useMemo(() => {
    if (!plan) return null;
    const planStart = new Date(plan.plan_start_date);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - planStart.getTime()) / (1000 * 60 * 60 * 24));
    const weekNum = Math.floor(diffDays / 7) + 1;
    return plan.plan_data.weeks.find((w) => w.weekNumber === weekNum) || plan.plan_data.weeks[0];
  }, [plan]);

  const toggleWorkoutComplete = async (workout: Workout) => {
    if (!plan || !user) return;
    const isCompleted = completedWorkouts.has(workout.id);

    if (isCompleted) {
      await supabase.from("training_log").delete().eq("planned_workout_id", workout.id).eq("plan_id", plan.id);
      setCompletedWorkouts((prev) => { const s = new Set(prev); s.delete(workout.id); return s; });
    } else {
      await supabase.from("training_log").insert({
        user_id: user.id,
        plan_id: plan.id,
        planned_workout_id: workout.id,
        date: new Date().toISOString().split("T")[0],
        distance_meters: workout.distanceKm * 1000,
        time_seconds: workout.durationMinutes * 60,
        workout_type: workout.type,
        completed: true,
      });
      setCompletedWorkouts((prev) => { const s = new Set(Array.from(prev)); s.add(workout.id); return s; });
    }
  };

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
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="font-heading font-bold text-2xl mb-3">No training plan yet</h2>
          <p className="text-gray-500 mb-6">
            Build a personalised training plan with our AI coach. It takes 60 seconds to set up.
          </p>
          <Link href="/plan/builder" className="inline-block bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold px-8 py-3 rounded-xl transition-colors">
            Build My Plan
          </Link>
        </div>
      </div>
    );
  }

  const totalWeeks = plan.plan_data.meta?.totalWeeks || plan.plan_weeks;
  const currentWeekNum = currentWeek?.weekNumber || 1;
  const progressPct = Math.round((currentWeekNum / totalWeeks) * 100);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-brand-black text-white py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl">{plan.name}</h1>
            <div className="flex gap-2">
              <Link href="/plan/calendar" className="text-sm text-gray-400 hover:text-white transition-colors">Calendar</Link>
              <span className="text-gray-600">|</span>
              <Link href="/plan/race-day" className="text-sm text-gray-400 hover:text-white transition-colors">Race Day</Link>
              <span className="text-gray-600">|</span>
              <Link href="/plan/log" className="text-sm text-gray-400 hover:text-white transition-colors">Training Log</Link>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <span>Race: {new Date(plan.goal_race_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
            {plan.goal_race_time_seconds && (
              <span>Target: {formatTimeFromSeconds(plan.goal_race_time_seconds)}</span>
            )}
            <span>Week {currentWeekNum} of {totalWeeks}</span>
          </div>
          {/* Progress bar */}
          <div className="mt-4 bg-gray-800 rounded-full h-2">
            <div className="bg-brand-orange rounded-full h-2 transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Week */}
        {currentWeek && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-semibold text-xl">
                Week {currentWeek.weekNumber}: {currentWeek.phase}
                {currentWeek.isRecoveryWeek && <span className="ml-2 text-sm text-brand-green font-normal">(Recovery Week)</span>}
              </h2>
              <span className="text-sm text-gray-500">{currentWeek.targetKm}km target</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
              {currentWeek.days.map((day, idx) => {
                const isCompleted = day.workout ? completedWorkouts.has(day.workout.id) : false;
                const isToday = idx === (new Date().getDay() + 6) % 7; // Adjust for Mon=0

                return (
                  <div
                    key={idx}
                    className={`rounded-xl border-2 p-4 transition-all ${
                      isToday ? "border-brand-orange shadow-md" : "border-gray-200"
                    } ${isCompleted ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-bold uppercase ${isToday ? "text-brand-orange" : "text-gray-400"}`}>
                        {WEEKDAYS[idx]}
                      </span>
                      {day.workout && (
                        <button
                          onClick={() => toggleWorkoutComplete(day.workout!)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isCompleted ? "bg-brand-green border-brand-green text-white" : "border-gray-300 hover:border-brand-green"
                          }`}
                        >
                          {isCompleted && (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>

                    {day.workout ? (
                      <>
                        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border mb-2 capitalize ${WORKOUT_COLORS[day.workout.type] || WORKOUT_COLORS.easy}`}>
                          {day.workout.type.replace("_", " ")}
                        </span>
                        <div className="text-sm font-semibold mb-1">{day.workout.distanceKm}km</div>
                        <p className="text-xs text-gray-500 line-clamp-2">{day.workout.description}</p>
                        {day.workout.notes && (
                          <p className="text-xs text-gray-400 mt-1 italic line-clamp-1">{day.workout.notes}</p>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-gray-400 font-medium">Rest Day</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link href="/plan/calendar" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-brand-orange transition-colors text-center">
            <div className="text-2xl mb-1">📅</div>
            <div className="text-sm font-semibold">Full Calendar</div>
          </Link>
          <Link href="/plan/race-day" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-brand-orange transition-colors text-center">
            <div className="text-2xl mb-1">🏁</div>
            <div className="text-sm font-semibold">Race Day Plan</div>
          </Link>
          <Link href="/plan/log" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-brand-orange transition-colors text-center">
            <div className="text-2xl mb-1">📊</div>
            <div className="text-sm font-semibold">Training Log</div>
          </Link>
          <Link href="/plan/builder" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-brand-orange transition-colors text-center">
            <div className="text-2xl mb-1">✨</div>
            <div className="text-sm font-semibold">New Plan</div>
          </Link>
        </div>
      </div>
    </div>
  );
}

