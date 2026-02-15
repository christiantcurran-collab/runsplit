"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { DISTANCES, type DistanceKey } from "@/lib/running-math";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState(30);
  const [gender, setGender] = useState("male");
  const [experienceLevel, setExperienceLevel] = useState("intermediate");
  const [weeklyKm, setWeeklyKm] = useState(30);
  const [preferredUnit, setPreferredUnit] = useState("km");

  // Recent race
  const [raceDistance, setRaceDistance] = useState("5k");
  const [raceHours, setRaceHours] = useState(0);
  const [raceMinutes, setRaceMinutes] = useState(25);
  const [raceSeconds, setRaceSeconds] = useState(0);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError("");

    // Upsert profile
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      display_name: displayName || null,
      age,
      gender,
      experience_level: experienceLevel,
      current_weekly_km: weeklyKm,
      preferred_unit: preferredUnit,
    });

    if (profileError) {
      setError(profileError.message);
      setSaving(false);
      return;
    }

    // Save race result
    const raceTimeSeconds = raceHours * 3600 + raceMinutes * 60 + raceSeconds;
    if (raceTimeSeconds > 0) {
      const distMeters = DISTANCES[raceDistance as DistanceKey]?.meters || 5000;
      await supabase.from("race_results").insert({
        user_id: user.id,
        distance_meters: distMeters,
        distance_name: DISTANCES[raceDistance as DistanceKey]?.name || raceDistance,
        time_seconds: raceTimeSeconds,
        is_goal: false,
      });
    }

    await refreshProfile();
    // Send to pricing so they can subscribe before accessing the plan builder
    router.push("/pricing");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-heading font-bold text-3xl mb-2">Tell us about yourself</h1>
          <p className="text-gray-500">This helps us personalise your training plans.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-8 space-y-6">
          {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name (optional)</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent" placeholder="Your name" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input type="number" min={10} max={100} value={age} onChange={(e) => setAge(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
              <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weekly {preferredUnit === "km" ? "km" : "miles"}</label>
              <input type="number" min={0} value={weeklyKm} onChange={(e) => setWeeklyKm(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Unit</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" value="km" checked={preferredUnit === "km"} onChange={(e) => setPreferredUnit(e.target.value)} className="text-brand-orange" /> Kilometres
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" value="mile" checked={preferredUnit === "mile"} onChange={(e) => setPreferredUnit(e.target.value)} className="text-brand-orange" /> Miles
              </label>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="font-heading font-semibold text-sm mb-4">Recent Race Result (optional)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Distance</label>
                <select value={raceDistance} onChange={(e) => setRaceDistance(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white">
                  {Object.entries(DISTANCES).map(([key, d]) => (
                    <option key={key} value={key}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Time (H:M:S)</label>
                <div className="flex items-center gap-1">
                  <input type="number" min={0} max={99} value={raceHours} onChange={(e) => setRaceHours(Number(e.target.value))}
                    className="w-14 text-center font-mono border border-gray-300 rounded-lg px-1 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange" />
                  <span className="text-gray-400 font-bold">:</span>
                  <input type="number" min={0} max={59} value={raceMinutes} onChange={(e) => setRaceMinutes(Number(e.target.value))}
                    className="w-14 text-center font-mono border border-gray-300 rounded-lg px-1 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange" />
                  <span className="text-gray-400 font-bold">:</span>
                  <input type="number" min={0} max={59} value={raceSeconds} onChange={(e) => setRaceSeconds(Number(e.target.value))}
                    className="w-14 text-center font-mono border border-gray-300 rounded-lg px-1 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange" />
                </div>
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full bg-brand hover:bg-brand-hover text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50">
            {saving ? "Saving..." : "Continue →"}
          </button>
        </form>
      </div>
    </div>
  );
}



