"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase";
import type { TrainingLogEntry } from "@/types";
import {
  formatTimeFromSeconds,
  estimateVO2max,
  predictRaceTime,
  calculateTrainingPaces,
  calculatePaceSeconds,
  DISTANCES,
} from "@/lib/running-math";

// ── Helper: format pace seconds to M:SS string ──
function formatPace(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "--";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function TrainingLogPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [logs, setLogs] = useState<TrainingLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [activeTab, setActiveTab] = useState<"analytics" | "log">("analytics");

  // New log form state
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [logDistKm, setLogDistKm] = useState(5);
  const [logHours, setLogHours] = useState(0);
  const [logMinutes, setLogMinutes] = useState(30);
  const [logSeconds, setLogSeconds] = useState(0);
  const [logType, setLogType] = useState("easy");
  const [logNotes, setLogNotes] = useState("");
  const [logEffort, setLogEffort] = useState(5);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadLogs() {
    const { data } = await supabase
      .from("training_log")
      .select("*")
      .eq("user_id", user!.id)
      .order("date", { ascending: false })
      .limit(200);
    setLogs(data || []);
    setLoading(false);
  }

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const timeSec = logHours * 3600 + logMinutes * 60 + logSeconds;

    await supabase.from("training_log").insert({
      user_id: user.id,
      date: logDate,
      distance_meters: logDistKm * 1000,
      time_seconds: timeSec > 0 ? timeSec : null,
      workout_type: logType,
      notes: logNotes || null,
      perceived_effort: logEffort,
      completed: true,
    });

    setShowAdd(false);
    setSaving(false);
    loadLogs();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("training_log").delete().eq("id", id);
    setLogs((prev) => prev.filter((l) => l.id !== id));
  };

  // ── Computed analytics ──
  const analytics = useMemo(() => {
    if (logs.length === 0) return null;

    const now = new Date();

    // Runs with both distance and time (needed for pace/VDOT calculations)
    const timedRuns = logs.filter(
      (l) => l.distance_meters && l.distance_meters > 0 && l.time_seconds && l.time_seconds > 0
    );

    // --- Summary stats ---
    const totalRuns = logs.length;
    const totalDistanceM = logs.reduce((a, l) => a + (l.distance_meters || 0), 0);
    const totalTimeSec = logs.reduce((a, l) => a + (l.time_seconds || 0), 0);
    const avgDistanceKm = totalDistanceM / totalRuns / 1000;
    const longestRunM = Math.max(...logs.map((l) => l.distance_meters || 0));
    const avgPaceSecPerKm =
      timedRuns.length > 0
        ? timedRuns.reduce((a, l) => a + l.time_seconds! / (l.distance_meters! / 1000), 0) / timedRuns.length
        : 0;
    const avgEffort =
      logs.filter((l) => l.perceived_effort).length > 0
        ? logs.reduce((a, l) => a + (l.perceived_effort || 0), 0) /
          logs.filter((l) => l.perceived_effort).length
        : 0;

    // --- This week / last 4 weeks ---
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    const thisWeekLogs = logs.filter((l) => new Date(l.date) >= startOfWeek);
    const weeklyKm = thisWeekLogs.reduce((a, l) => a + (l.distance_meters || 0) / 1000, 0);
    const weeklyRuns = thisWeekLogs.length;

    // Last 4 weeks breakdown for mini chart
    const weeklyData: { label: string; km: number; runs: number }[] = [];
    for (let w = 0; w < 8; w++) {
      const weekEnd = new Date(startOfWeek);
      weekEnd.setDate(weekEnd.getDate() - w * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 7);
      const weekLogs = logs.filter((l) => {
        const d = new Date(l.date);
        return d >= weekStart && d < weekEnd;
      });
      const km = weekLogs.reduce((a, l) => a + (l.distance_meters || 0) / 1000, 0);
      weeklyData.push({
        label: weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        km: Math.round(km * 10) / 10,
        runs: weekLogs.length,
      });
    }
    weeklyData.reverse(); // oldest first

    // --- VDOT & race predictions from best recent run ---
    // Find the run with the best (highest) VDOT from the last 90 days
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const recentTimedRuns = timedRuns.filter((l) => new Date(l.date) >= ninetyDaysAgo);

    let bestVdot = 0;
    let bestRun: TrainingLogEntry | null = null;

    for (const run of recentTimedRuns.length > 0 ? recentTimedRuns : timedRuns.slice(0, 20)) {
      const vdot = estimateVO2max(run.distance_meters!, run.time_seconds!);
      if (vdot > bestVdot && vdot < 85) {
        // cap at 85 to filter out obviously wrong data
        bestVdot = vdot;
        bestRun = run;
      }
    }

    let racePredictions: { name: string; distance: string; time: string; pace: string }[] = [];
    let trainingPaces: {
      easy: string;
      marathon: string;
      threshold: string;
      interval: string;
    } | null = null;

    if (bestRun && bestVdot > 0) {
      const predictionKeys = ["5k", "10k", "halfMarathon", "marathon"] as const;
      racePredictions = predictionKeys.map((key) => {
        const dist = DISTANCES[key];
        const predicted = predictRaceTime(
          bestRun!.distance_meters!,
          bestRun!.time_seconds!,
          dist.meters
        );
        const paceSecPerKm = calculatePaceSeconds(dist.meters, predicted, "km");
        return {
          name: dist.name,
          distance: dist.shortName,
          time: formatTimeFromSeconds(Math.round(predicted)),
          pace: formatPace(paceSecPerKm) + "/km",
        };
      });

      const paces = calculateTrainingPaces(bestRun.distance_meters!, bestRun.time_seconds!);
      trainingPaces = {
        easy: `${formatPace(paces.easy.min)} - ${formatPace(paces.easy.max)}`,
        marathon: `${formatPace(paces.marathon.min)} - ${formatPace(paces.marathon.max)}`,
        threshold: `${formatPace(paces.threshold.min)} - ${formatPace(paces.threshold.max)}`,
        interval: `${formatPace(paces.interval.min)} - ${formatPace(paces.interval.max)}`,
      };
    }

    // --- Personal bests (fastest pace per approximate standard distance) ---
    const pbDistances = [
      { key: "5k", label: "5K", minM: 4500, maxM: 5500 },
      { key: "10k", label: "10K", minM: 9500, maxM: 10500 },
      { key: "hm", label: "Half Marathon", minM: 20500, maxM: 21500 },
      { key: "mar", label: "Marathon", minM: 41500, maxM: 43000 },
    ];
    const personalBests: { label: string; time: string; pace: string; date: string }[] = [];
    for (const pb of pbDistances) {
      const matching = timedRuns.filter(
        (l) => l.distance_meters! >= pb.minM && l.distance_meters! <= pb.maxM
      );
      if (matching.length > 0) {
        const fastest = matching.reduce((best, l) =>
          l.time_seconds! < best.time_seconds! ? l : best
        );
        personalBests.push({
          label: pb.label,
          time: formatTimeFromSeconds(fastest.time_seconds!),
          pace: formatPace(fastest.time_seconds! / (fastest.distance_meters! / 1000)) + "/km",
          date: new Date(fastest.date).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
        });
      }
    }

    return {
      totalRuns,
      totalDistanceKm: totalDistanceM / 1000,
      totalTimeSec,
      avgDistanceKm,
      longestRunKm: longestRunM / 1000,
      avgPaceSecPerKm,
      avgEffort,
      weeklyKm,
      weeklyRuns,
      weeklyData,
      bestVdot: Math.round(bestVdot * 10) / 10,
      bestRun,
      racePredictions,
      trainingPaces,
      personalBests,
    };
  }, [logs]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-brand-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-brand-black text-white py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/plan" className="text-gray-400 hover:text-white transition-colors">
                ← Dashboard
              </Link>
              <h1 className="font-heading font-bold text-xl sm:text-2xl">
                Training Log & Analytics
              </h1>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="bg-brand-orange hover:bg-brand-orange-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              + Log Run
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "analytics"
                  ? "bg-white/15 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab("log")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "log"
                  ? "bg-white/15 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Run Log ({logs.length})
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ════════════════════════════════════════ */}
        {/* ANALYTICS TAB                           */}
        {/* ════════════════════════════════════════ */}
        {activeTab === "analytics" && (
          <>
            {!analytics ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <div className="text-4xl mb-3">📊</div>
                <h3 className="font-heading font-bold text-lg mb-1">No data yet</h3>
                <p className="text-gray-500 text-sm mb-4">
                  Log your first run to see analytics and race predictions.
                </p>
                <button
                  onClick={() => setShowAdd(true)}
                  className="bg-brand-orange hover:bg-brand-orange-hover text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
                >
                  + Log Run
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* ── Summary cards ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard label="This Week" value={`${analytics.weeklyKm.toFixed(1)}km`} sub={`${analytics.weeklyRuns} runs`} />
                  <StatCard label="Total Distance" value={`${analytics.totalDistanceKm.toFixed(0)}km`} sub={`${analytics.totalRuns} runs`} />
                  <StatCard label="Avg Pace" value={analytics.avgPaceSecPerKm > 0 ? formatPace(analytics.avgPaceSecPerKm) + "/km" : "--"} sub="across all runs" />
                  <StatCard label="Longest Run" value={`${analytics.longestRunKm.toFixed(1)}km`} sub={analytics.avgEffort > 0 ? `Avg effort: ${analytics.avgEffort.toFixed(1)}/10` : ""} />
                </div>

                {/* ── Weekly volume chart ── */}
                {analytics.weeklyData.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <h3 className="font-heading font-semibold text-sm mb-4 text-gray-700">
                      Weekly Volume (last 8 weeks)
                    </h3>
                    <div className="flex items-end gap-2 h-32">
                      {analytics.weeklyData.map((w, i) => {
                        const maxKm = Math.max(...analytics.weeklyData.map((d) => d.km), 1);
                        const height = (w.km / maxKm) * 100;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-[10px] font-mono text-gray-500">
                              {w.km > 0 ? `${w.km}` : ""}
                            </span>
                            <div
                              className="w-full bg-brand-orange/80 rounded-t-md transition-all min-h-[2px]"
                              style={{ height: `${Math.max(height, 2)}%` }}
                            />
                            <span className="text-[9px] text-gray-400 truncate w-full text-center">
                              {w.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── VDOT & Race Predictions ── */}
                {analytics.bestVdot > 0 && analytics.bestRun && (
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <h3 className="font-heading font-semibold text-sm text-gray-700">
                          Estimated Fitness & Race Projections
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">Based on best recent run</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5">
                      {/* VDOT badge */}
                      <div className="flex items-center gap-6 mb-6">
                        <div className="text-center">
                          <div className="w-20 h-20 rounded-full bg-brand-orange/10 border-2 border-brand-orange flex items-center justify-center">
                            <span className="font-heading font-extrabold text-2xl text-brand-orange">
                              {analytics.bestVdot}
                            </span>
                          </div>
                          <span className="text-[10px] font-semibold text-gray-500 mt-1.5 block uppercase tracking-wide">
                            VDOT
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p className="mb-1">
                            Calculated from your{" "}
                            <span className="font-semibold text-gray-800">
                              {(analytics.bestRun.distance_meters! / 1000).toFixed(1)}km
                            </span>{" "}
                            run in{" "}
                            <span className="font-semibold text-gray-800">
                              {formatTimeFromSeconds(analytics.bestRun.time_seconds!)}
                            </span>
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(analytics.bestRun.date).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Race predictions table */}
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        Projected Race Times
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        {analytics.racePredictions.map((pred) => (
                          <div
                            key={pred.distance}
                            className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100"
                          >
                            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                              {pred.name}
                            </div>
                            <div className="font-mono font-bold text-lg text-gray-800">
                              {pred.time}
                            </div>
                            <div className="text-[11px] font-mono text-brand-orange mt-0.5">
                              {pred.pace}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Training paces */}
                      {analytics.trainingPaces && (
                        <>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            Recommended Training Paces
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                              { label: "Easy", value: analytics.trainingPaces.easy, color: "bg-green-50 border-green-200 text-green-700" },
                              { label: "Marathon", value: analytics.trainingPaces.marathon, color: "bg-blue-50 border-blue-200 text-blue-700" },
                              { label: "Threshold", value: analytics.trainingPaces.threshold, color: "bg-yellow-50 border-yellow-200 text-yellow-700" },
                              { label: "Interval", value: analytics.trainingPaces.interval, color: "bg-red-50 border-red-200 text-red-700" },
                            ].map((zone) => (
                              <div
                                key={zone.label}
                                className={`rounded-xl p-3 text-center border ${zone.color}`}
                              >
                                <div className="text-[10px] font-semibold uppercase tracking-wide opacity-70 mb-1">
                                  {zone.label}
                                </div>
                                <div className="font-mono font-bold text-sm">{zone.value}</div>
                                <div className="text-[10px] opacity-60">/km</div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Personal Bests ── */}
                {analytics.personalBests.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <h3 className="font-heading font-semibold text-sm text-gray-700 mb-4">
                      Personal Bests
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {analytics.personalBests.map((pb) => (
                        <div key={pb.label} className="bg-amber-50 rounded-xl p-3 text-center border border-amber-200">
                          <div className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide mb-1">
                            {pb.label}
                          </div>
                          <div className="font-mono font-bold text-lg text-gray-800">{pb.time}</div>
                          <div className="text-[11px] font-mono text-amber-600 mt-0.5">{pb.pace}</div>
                          <div className="text-[10px] text-gray-400 mt-1">{pb.date}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Run type breakdown ── */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="font-heading font-semibold text-sm text-gray-700 mb-4">
                    Run Type Breakdown
                  </h3>
                  <div className="space-y-2">
                    {(() => {
                      const types: Record<string, { count: number; km: number }> = {};
                      logs.forEach((l) => {
                        const t = l.workout_type || "other";
                        if (!types[t]) types[t] = { count: 0, km: 0 };
                        types[t].count++;
                        types[t].km += (l.distance_meters || 0) / 1000;
                      });
                      const sorted = Object.entries(types).sort((a, b) => b[1].count - a[1].count);
                      const maxCount = Math.max(...sorted.map(([, v]) => v.count), 1);

                      return sorted.map(([type, data]) => (
                        <div key={type} className="flex items-center gap-3">
                          <span className="text-xs font-medium capitalize text-gray-600 w-24 truncate">
                            {type.replace("_", " ")}
                          </span>
                          <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                            <div
                              className="bg-brand-orange/70 h-full rounded-full transition-all"
                              style={{ width: `${(data.count / maxCount) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-gray-500 w-20 text-right">
                            {data.count} runs · {data.km.toFixed(0)}km
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ════════════════════════════════════════ */}
        {/* LOG TAB                                 */}
        {/* ════════════════════════════════════════ */}
        {activeTab === "log" && (
          <>
            {logs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <p className="text-gray-500">
                  No runs logged yet. Click &quot;+ Log Run&quot; to get started!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[50px]">
                        <div className="text-xs text-gray-400">
                          {new Date(log.date).toLocaleDateString("en-GB", { weekday: "short" })}
                        </div>
                        <div className="text-sm font-bold">
                          {new Date(log.date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          {log.workout_type && (
                            <span className="text-xs font-medium capitalize bg-gray-100 px-2 py-0.5 rounded">
                              {log.workout_type.replace("_", " ")}
                            </span>
                          )}
                          {log.distance_meters && (
                            <span className="font-mono font-bold text-sm">
                              {(log.distance_meters / 1000).toFixed(1)}km
                            </span>
                          )}
                          {log.time_seconds && (
                            <span className="font-mono text-sm text-gray-500">
                              {formatTimeFromSeconds(log.time_seconds)}
                            </span>
                          )}
                          {log.distance_meters && log.time_seconds && (
                            <span className="font-mono text-xs text-brand-orange">
                              {formatTimeFromSeconds(
                                Math.round(log.time_seconds / (log.distance_meters / 1000))
                              )}
                              /km
                            </span>
                          )}
                        </div>
                        {log.notes && (
                          <p className="text-xs text-gray-500 mt-0.5">{log.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {log.perceived_effort && (
                        <div className="text-xs text-gray-400">RPE {log.perceived_effort}</div>
                      )}
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Add run modal ── */}
        {showAdd && (
          <div
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
            onClick={() => setShowAdd(false)}
          >
            <div
              className="bg-white rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-heading font-semibold text-lg mb-4">Log a Run</h3>
              <form onSubmit={handleAddLog} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                    <input
                      type="date"
                      value={logDate}
                      onChange={(e) => setLogDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Distance (km)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      value={logDistKm}
                      onChange={(e) => setLogDistKm(Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Time (H:M:S)
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      value={logHours}
                      onChange={(e) => setLogHours(Number(e.target.value))}
                      className="w-16 text-center font-mono border border-gray-300 rounded-lg px-1 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                    <span className="text-gray-400 font-bold">:</span>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={logMinutes}
                      onChange={(e) => setLogMinutes(Number(e.target.value))}
                      className="w-16 text-center font-mono border border-gray-300 rounded-lg px-1 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                    <span className="text-gray-400 font-bold">:</span>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={logSeconds}
                      onChange={(e) => setLogSeconds(Number(e.target.value))}
                      className="w-16 text-center font-mono border border-gray-300 rounded-lg px-1 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                    <select
                      value={logType}
                      onChange={(e) => setLogType(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange bg-white"
                    >
                      <option value="easy">Easy</option>
                      <option value="long">Long Run</option>
                      <option value="tempo">Tempo</option>
                      <option value="interval">Interval</option>
                      <option value="race_pace">Race Pace</option>
                      <option value="recovery">Recovery</option>
                      <option value="cross_train">Cross Training</option>
                      <option value="strength">Strength</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Effort (1-10)
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={logEffort}
                      onChange={(e) => setLogEffort(Number(e.target.value))}
                      className="w-full mt-2"
                    />
                    <div className="text-center text-sm font-mono font-bold text-brand-orange">
                      {logEffort}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    value={logNotes}
                    onChange={(e) => setLogNotes(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange resize-none"
                    rows={2}
                    placeholder="How did it feel?"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-brand-orange hover:bg-brand-orange-hover text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Run"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Small reusable stat card ──
function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
        {label}
      </div>
      <div className="font-mono text-xl font-bold text-gray-800">{value}</div>
      {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}
