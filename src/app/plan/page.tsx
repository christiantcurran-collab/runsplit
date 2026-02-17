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

const RUNNING_WORKOUT_TYPES = new Set([
  "easy",
  "long",
  "tempo",
  "interval",
  "race_pace",
  "recovery",
]);

interface DailyForecast {
  code: number;
  tempMax: number;
  tempMin: number;
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function weatherLabel(code: number): string {
  if (code === 0) return "Clear";
  if ([1, 2, 3].includes(code)) return "Cloudy";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Storm";
  return "Weather";
}

function weatherEmoji(code: number): string {
  if (code === 0) return "\u2600\uFE0F";
  if ([1, 2, 3].includes(code)) return "\u26C5";
  if ([45, 48].includes(code)) return "\uD83C\uDF2B\uFE0F";
  if ([51, 53, 55, 56, 57].includes(code)) return "\uD83C\uDF26\uFE0F";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "\uD83C\uDF27\uFE0F";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "\u2744\uFE0F";
  if ([95, 96, 99].includes(code)) return "\u26C8\uFE0F";
  return "\uD83C\uDF24\uFE0F";
}

export default function PlanDashboard() {
  const { user, profile } = useAuth();
  const supabase = createClient();
  const [plan, setPlan] = useState<TrainingPlanRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedWorkouts, setCompletedWorkouts] = useState<Set<string>>(new Set());
  const [scheduleLockedDays, setScheduleLockedDays] = useState<number[]>([]);
  const [preferredLongRunDay, setPreferredLongRunDay] = useState<number>(6);
  const [tweakSaving, setTweakSaving] = useState(false);
  const [tweakMessage, setTweakMessage] = useState("");
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");
  const [weatherByDate, setWeatherByDate] = useState<Record<string, DailyForecast>>({});

  useEffect(() => {
    if (!user) {
      // If auth is still loading, don't do anything yet
      // Once user appears (or auth resolves), this effect re-runs
      return;
    }
    loadPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Safety: if user never loads after 10s, stop the spinner
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) setLoading(false);
    }, 10000);
    return () => clearTimeout(timeout);
  }, [loading]);

  async function loadPlan() {
    try {
      const { data } = await supabase
        .from("training_plans")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      setPlan(data);

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
    } catch (err) {
      console.error("Failed to load plan:", err);
      setPlan(null);
    } finally {
      setLoading(false);
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

  useEffect(() => {
    if (!currentWeek) return;
    const locked = currentWeek.days.filter((d) => !d.workout).map((d) => d.dayOfWeek);
    const longRunDay = currentWeek.days.find((d) => d.workout?.type === "long")?.dayOfWeek ?? 6;
    setScheduleLockedDays(locked);
    setPreferredLongRunDay(longRunDay === 5 ? 5 : 6);
  }, [currentWeek]);

  useEffect(() => {
    const savedCoords = localStorage.getItem("runsplit_weather_coords");
    if (!savedCoords) return;
    try {
      const coords = JSON.parse(savedCoords) as { lat: number; lon: number };
      void fetchWeather(coords.lat, coords.lon);
    } catch {
      // ignore malformed cached coords
    }
  }, []);

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

  const fetchWeather = async (lat: number, lon: number) => {
    setWeatherLoading(true);
    setWeatherError("");
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=16`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok || !data?.daily?.time) {
        throw new Error("Weather forecast unavailable");
      }

      const mapped: Record<string, DailyForecast> = {};
      for (let i = 0; i < data.daily.time.length; i += 1) {
        const date = data.daily.time[i];
        mapped[date] = {
          code: data.daily.weathercode[i],
          tempMax: Math.round(data.daily.temperature_2m_max[i]),
          tempMin: Math.round(data.daily.temperature_2m_min[i]),
        };
      }
      setWeatherByDate(mapped);
      localStorage.setItem("runsplit_weather_coords", JSON.stringify({ lat, lon }));
    } catch (err) {
      setWeatherError(err instanceof Error ? err.message : "Failed to load weather");
    } finally {
      setWeatherLoading(false);
    }
  };

  const requestWeather = () => {
    if (!navigator.geolocation) {
      setWeatherError("Geolocation is not supported in your browser.");
      return;
    }

    setWeatherError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void fetchWeather(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setWeatherError("Unable to get location. Please allow location access.");
      }
    );
  };

  const applyScheduleTweaks = async () => {
    if (!plan || !user) return;
    if (scheduleLockedDays.length >= 7) {
      setTweakMessage("You cannot block all 7 days.");
      return;
    }

    setTweakSaving(true);
    setTweakMessage("");
    try {
      const blocked = new Set(scheduleLockedDays);
      const updatedWeeks = plan.plan_data.weeks.map((week) => {
        const runningWithOriginalDay = week.days
          .filter((day) => day.workout && RUNNING_WORKOUT_TYPES.has(day.workout.type))
          .map((day) => ({ dayOfWeek: day.dayOfWeek, workout: day.workout as Workout }))
          .sort((a, b) => a.dayOfWeek - b.dayOfWeek);

        const supportByDay = new Map(
          week.days
            .filter(
              (day) =>
                day.workout &&
                !RUNNING_WORKOUT_TYPES.has(day.workout.type) &&
                day.workout.type !== "rest"
            )
            .map((day) => [day.dayOfWeek, day.workout])
        );

        const runningAssignments = new Map<number, Workout>();
        const availableDays = [0, 1, 2, 3, 4, 5, 6].filter((d) => !blocked.has(d));

        const longRunIdx = runningWithOriginalDay.findIndex((w) => w.workout.type === "long");
        if (longRunIdx >= 0 && availableDays.includes(preferredLongRunDay)) {
          runningAssignments.set(preferredLongRunDay, runningWithOriginalDay[longRunIdx].workout);
          runningWithOriginalDay.splice(longRunIdx, 1);
        }

        const remainingDays = availableDays.filter((d) => !runningAssignments.has(d));
        runningWithOriginalDay.forEach((entry, idx) => {
          const targetDay =
            remainingDays[idx] ?? remainingDays[remainingDays.length - 1] ?? entry.dayOfWeek;
          runningAssignments.set(targetDay, entry.workout);
        });

        const nextDays = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
          if (runningAssignments.has(dayOfWeek)) {
            return { dayOfWeek, workout: runningAssignments.get(dayOfWeek) ?? null };
          }
          return { dayOfWeek, workout: supportByDay.get(dayOfWeek) ?? null };
        });

        return {
          ...week,
          days: nextDays,
        };
      });

      const nextPlanData = {
        ...plan.plan_data,
        weeks: updatedWeeks,
      };

      const { error } = await supabase
        .from("training_plans")
        .update({ plan_data: nextPlanData })
        .eq("id", plan.id)
        .eq("user_id", user.id);

      if (error) {
        setTweakMessage(error.message);
      } else {
        setPlan({ ...plan, plan_data: nextPlanData });
        setTweakMessage("Plan updated. Your running days have been adjusted.");
      }
    } catch (err) {
      setTweakMessage(err instanceof Error ? err.message : "Failed to update plan");
    } finally {
      setTweakSaving(false);
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
  const currentWeekStartDate = plan
    ? (() => {
        const start = new Date(plan.plan_start_date);
        start.setDate(start.getDate() + (currentWeekNum - 1) * 7);
        return start;
      })()
    : null;

  const stravaConnected = !!profile?.strava_athlete_id;

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-heading font-semibold text-lg mb-2">Interact with this plan</h3>
            <p className="text-sm text-gray-500 mb-4">
              Tweak schedule days without rebuilding from scratch.
            </p>

            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Long run day
              </p>
              <div className="flex gap-2">
                {[5, 6].map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setPreferredLongRunDay(day)}
                    className={`px-3 py-1.5 rounded-lg text-sm border-2 transition-colors ${
                      preferredLongRunDay === day
                        ? "border-brand-orange bg-brand-orange/10 text-brand-orange"
                        : "border-gray-200 text-gray-600"
                    }`}
                  >
                    {WEEKDAYS[day]}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Days you cannot run
              </p>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day, idx) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() =>
                      setScheduleLockedDays((prev) =>
                        prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx]
                      )
                    }
                    className={`px-3 py-1.5 rounded-lg text-sm border-2 transition-colors ${
                      scheduleLockedDays.includes(idx)
                        ? "border-red-300 bg-red-50 text-red-600"
                        : "border-gray-200 text-gray-600"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={applyScheduleTweaks}
              disabled={tweakSaving}
              className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60"
            >
              {tweakSaving ? "Updating..." : "Apply schedule tweaks"}
            </button>
            {tweakMessage && <p className="text-xs text-gray-600 mt-2">{tweakMessage}</p>}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-heading font-semibold text-lg mb-2">Strava (recommended)</h3>
            <p className="text-sm text-gray-500 mb-4">
              Most runners use Strava. Connect it to auto-sync runs and keep your plan accurate.
            </p>
            <div className="flex items-center gap-2 mb-4">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  stravaConnected ? "bg-green-500" : "bg-gray-300"
                }`}
              />
              <span className="text-sm text-gray-700">
                {stravaConnected ? "Strava connected" : "Not connected yet"}
              </span>
            </div>
            <Link
              href="/settings"
              className="inline-flex items-center justify-center w-full bg-[#FC4C02] hover:bg-[#e04400] text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              {stravaConnected ? "Manage Strava Sync" : "Connect Strava"}
            </Link>
          </div>
        </div>

        {/* Current Week */}
        {currentWeek && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-semibold text-xl">
                Week {currentWeek.weekNumber}: {currentWeek.phase}
                {currentWeek.isRecoveryWeek && <span className="ml-2 text-sm text-brand-green font-normal">(Recovery Week)</span>}
              </h2>
              <div className="text-right">
                <span className="block text-sm text-gray-500">{currentWeek.targetKm}km target</span>
                {weatherLoading ? (
                  <span className="block text-xs text-gray-400">Loading weather...</span>
                ) : weatherByDate && Object.keys(weatherByDate).length > 0 ? (
                  <span className="block text-xs text-gray-400">Weather included</span>
                ) : (
                  <button
                    type="button"
                    onClick={requestWeather}
                    className="text-xs text-brand-orange hover:text-brand-orange-hover font-medium"
                  >
                    Add local weather forecast
                  </button>
                )}
              </div>
            </div>
            {weatherError && <p className="text-xs text-red-500 mb-3">{weatherError}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
              {currentWeek.days.map((day, idx) => {
                const isCompleted = day.workout ? completedWorkouts.has(day.workout.id) : false;
                const isToday = idx === (new Date().getDay() + 6) % 7; // Adjust for Mon=0
                const dayDate = currentWeekStartDate ? new Date(currentWeekStartDate) : null;
                if (dayDate) dayDate.setDate(dayDate.getDate() + idx);
                const forecast =
                  dayDate && weatherByDate[formatDateKey(dayDate)]
                    ? weatherByDate[formatDateKey(dayDate)]
                    : null;

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
                    {forecast && (
                      <div className="text-[11px] text-gray-500 mb-2">
                        {weatherEmoji(forecast.code)} {forecast.tempMax}°/{forecast.tempMin}°{" "}
                        <span className="text-gray-400">({weatherLabel(forecast.code)})</span>
                      </div>
                    )}

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
            <div className="text-sm font-semibold">Log & Analytics</div>
          </Link>
          <Link href="/settings" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-brand-orange transition-colors text-center">
            <div className="text-2xl mb-1">🔗</div>
            <div className="text-sm font-semibold">Connect Strava</div>
          </Link>
        </div>
      </div>
    </div>
  );
}




