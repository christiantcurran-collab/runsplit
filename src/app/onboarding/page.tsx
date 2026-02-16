"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { DISTANCES, type DistanceKey } from "@/lib/running-math";
import Link from "next/link";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading, refreshProfile } = useAuth();
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

    if (!user) {
      setError("You need to be signed in to continue. Please log in or sign up first.");
      return;
    }

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

    // Smart routing: re-fetch profile to check subscription status
    const { data: freshProfile } = await supabase
      .from("profiles")
      .select("subscription_status")
      .eq("id", user.id)
      .single();

    const isPro =
      freshProfile?.subscription_status === "active" ||
      freshProfile?.subscription_status === "trialing";

    if (isPro) {
      // Already subscribed â€” go straight to plan builder
      router.push("/plan/builder?subscribed=true");
    } else {
      // Not yet subscribed â€” show pricing
      router.push("/pricing");
    }
  };

  // Show loading spinner while auth is initialising
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If not logged in, show a clear message
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="font-heading font-bold text-2xl text-text-primary mb-3">
            Sign in to get started
          </h1>
          <p className="text-text-secondary text-sm mb-8">
            Create an account or sign in to set up your running profile and start training.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="bg-brand hover:bg-brand-hover text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Create Account
            </Link>
            <Link
              href="/login?redirect=/onboarding"
              className="border border-gray-300 hover:border-gray-400 text-text-primary font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Log In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Progress stepper */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[
            { step: 1, label: "Your profile" },
            { step: 2, label: "Choose plan" },
            { step: 3, label: "Start training" },
          ].map((s, i) => (
            <div key={s.step} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 ${s.step === 1 ? "text-brand" : "text-gray-400"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  s.step === 1 ? "bg-brand text-white border-brand" : "border-gray-300 text-gray-400"
                }`}>
                  {s.step}
                </div>
                <span className="text-xs font-medium hidden sm:inline">{s.label}</span>
              </div>
              {i < 2 && <div className="w-8 sm:w-12 h-[2px] bg-gray-200 mx-1" />}
            </div>
          ))}
        </div>

        <div className="text-center mb-8">
          <h1 className="font-heading font-bold text-3xl mb-2">Tell us about yourself</h1>
          <p className="text-gray-500">This helps us personalise your training plans.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

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
            {saving ? "Saving..." : "Continue â†’"}
          </button>
        </form>
      </div>
    </div>
  );
}



