"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase";
import type { TrainingLogEntry } from "@/types";
import { formatTimeFromSeconds } from "@/lib/running-math";

export default function TrainingLogPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [logs, setLogs] = useState<TrainingLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

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
      .limit(100);
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

  // Stats
  const thisWeekLogs = logs.filter((l) => {
    const d = new Date(l.date);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    return d >= startOfWeek;
  });
  const weeklyKm = thisWeekLogs.reduce((a, l) => a + ((l.distance_meters || 0) / 1000), 0);
  const weeklyTime = thisWeekLogs.reduce((a, l) => a + (l.time_seconds || 0), 0);
  const totalRuns = logs.length;
  const totalKm = logs.reduce((a, l) => a + ((l.distance_meters || 0) / 1000), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-brand-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-brand-black text-white py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/plan" className="text-gray-400 hover:text-white transition-colors">← Dashboard</Link>
              <h1 className="font-heading font-bold text-xl sm:text-2xl">Training Log</h1>
            </div>
            <button onClick={() => setShowAdd(true)}
              className="bg-brand-orange hover:bg-brand-orange-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              + Log Run
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-xs text-gray-500 mb-1">This Week</div>
            <div className="font-mono text-xl font-bold">{weeklyKm.toFixed(1)}km</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-xs text-gray-500 mb-1">Weekly Time</div>
            <div className="font-mono text-xl font-bold">{formatTimeFromSeconds(Math.round(weeklyTime))}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-xs text-gray-500 mb-1">Total Runs</div>
            <div className="font-mono text-xl font-bold">{totalRuns}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-xs text-gray-500 mb-1">Total Distance</div>
            <div className="font-mono text-xl font-bold">{totalKm.toFixed(0)}km</div>
          </div>
        </div>

        {/* Add run modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4" onClick={() => setShowAdd(false)}>
            <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-heading font-semibold text-lg mb-4">Log a Run</h3>
              <form onSubmit={handleAddLog} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                    <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Distance (km)</label>
                    <input type="number" step="0.1" min={0} value={logDistKm} onChange={(e) => setLogDistKm(Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Time (H:M:S)</label>
                  <div className="flex items-center gap-1">
                    <input type="number" min={0} value={logHours} onChange={(e) => setLogHours(Number(e.target.value))}
                      className="w-16 text-center font-mono border border-gray-300 rounded-lg px-1 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange" />
                    <span className="text-gray-400 font-bold">:</span>
                    <input type="number" min={0} max={59} value={logMinutes} onChange={(e) => setLogMinutes(Number(e.target.value))}
                      className="w-16 text-center font-mono border border-gray-300 rounded-lg px-1 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange" />
                    <span className="text-gray-400 font-bold">:</span>
                    <input type="number" min={0} max={59} value={logSeconds} onChange={(e) => setLogSeconds(Number(e.target.value))}
                      className="w-16 text-center font-mono border border-gray-300 rounded-lg px-1 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                    <select value={logType} onChange={(e) => setLogType(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange bg-white">
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
                    <label className="block text-xs font-medium text-gray-500 mb-1">Effort (1-10)</label>
                    <input type="range" min={1} max={10} value={logEffort} onChange={(e) => setLogEffort(Number(e.target.value))}
                      className="w-full mt-2" />
                    <div className="text-center text-sm font-mono font-bold text-brand-orange">{logEffort}</div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Notes (optional)</label>
                  <textarea value={logNotes} onChange={(e) => setLogNotes(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange resize-none" rows={2}
                    placeholder="How did it feel?" />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowAdd(false)} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="flex-1 bg-brand-orange hover:bg-brand-orange-hover text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
                    {saving ? "Saving..." : "Save Run"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Log entries */}
        {logs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No runs logged yet. Click &quot;+ Log Run&quot; to get started!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[50px]">
                    <div className="text-xs text-gray-400">{new Date(log.date).toLocaleDateString("en-GB", { weekday: "short" })}</div>
                    <div className="text-sm font-bold">{new Date(log.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      {log.workout_type && (
                        <span className="text-xs font-medium capitalize bg-gray-100 px-2 py-0.5 rounded">{log.workout_type.replace("_", " ")}</span>
                      )}
                      {log.distance_meters && (
                        <span className="font-mono font-bold text-sm">{(log.distance_meters / 1000).toFixed(1)}km</span>
                      )}
                      {log.time_seconds && (
                        <span className="font-mono text-sm text-gray-500">{formatTimeFromSeconds(log.time_seconds)}</span>
                      )}
                      {log.distance_meters && log.time_seconds && (
                        <span className="font-mono text-xs text-brand-orange">
                          {formatTimeFromSeconds(Math.round(log.time_seconds / (log.distance_meters / 1000)))}/km
                        </span>
                      )}
                    </div>
                    {log.notes && <p className="text-xs text-gray-500 mt-0.5">{log.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {log.perceived_effort && (
                    <div className="text-xs text-gray-400">RPE {log.perceived_effort}</div>
                  )}
                  <button onClick={() => handleDelete(log.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}








