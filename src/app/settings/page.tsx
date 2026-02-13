"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase";

export default function SettingsPage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState(30);
  const [gender, setGender] = useState("male");
  const [experienceLevel, setExperienceLevel] = useState("intermediate");
  const [weeklyKm, setWeeklyKm] = useState(30);
  const [preferredUnit, setPreferredUnit] = useState("km");
  const [maxHr, setMaxHr] = useState(0);
  const [restingHr, setRestingHr] = useState(0);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [billingLoading, setBillingLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setAge(profile.age || 30);
      setGender(profile.gender || "male");
      setExperienceLevel(profile.experience_level || "intermediate");
      setWeeklyKm(profile.current_weekly_km || 30);
      setPreferredUnit(profile.preferred_unit || "km");
      setMaxHr(profile.max_hr || 0);
      setRestingHr(profile.resting_hr || 0);
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError("");
    setSaved(false);

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      display_name: displayName || null,
      age,
      gender,
      experience_level: experienceLevel,
      current_weekly_km: weeklyKm,
      preferred_unit: preferredUnit,
      max_hr: maxHr || null,
      resting_hr: restingHr || null,
    });

    if (error) {
      setError(error.message);
    } else {
      setSaved(true);
      await refreshProfile();
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const handleManageBilling = async () => {
    setBillingLoading(true);
    try {
      const res = await fetch("/api/create-portal-session", { method: "POST" });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setError("Failed to open billing portal");
    }
    setBillingLoading(false);
  };

  const handleSubscribe = async () => {
    setBillingLoading(true);
    try {
      const res = await fetch("/api/create-checkout-session", { method: "POST" });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setError("Failed to start checkout");
    }
    setBillingLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure? This will permanently delete your account and all data.")) return;
    await supabase.from("training_log").delete().eq("user_id", user!.id);
    await supabase.from("training_plans").delete().eq("user_id", user!.id);
    await supabase.from("race_results").delete().eq("user_id", user!.id);
    await supabase.from("profiles").delete().eq("id", user!.id);
    await signOut();
    router.push("/");
  };

  const subStatus = profile?.subscription_status || "none";
  const isPro = subStatus === "active" || subStatus === "trialing";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto">
        <h1 className="font-heading font-bold text-3xl mb-8">Settings</h1>

        {/* Subscription Status */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="font-heading font-semibold text-lg mb-4">Subscription</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className={`inline-block text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full ${
                isPro ? "bg-brand-green/10 text-brand-green" : "bg-gray-100 text-gray-500"
              }`}>
                {subStatus === "active" ? "Pro — Active" : subStatus === "trialing" ? "Pro — Trial" : "Free"}
              </div>
              {profile?.trial_ends_at && subStatus === "trialing" && (
                <p className="text-xs text-gray-500 mt-1">
                  Trial ends {new Date(profile.trial_ends_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              )}
            </div>
            {isPro ? (
              <button onClick={handleManageBilling} disabled={billingLoading}
                className="text-sm font-medium text-brand-orange hover:text-brand-orange-hover disabled:opacity-50">
                {billingLoading ? "Loading..." : "Manage Billing →"}
              </button>
            ) : (
              <button onClick={handleSubscribe} disabled={billingLoading}
                className="bg-brand-orange hover:bg-brand-orange-hover text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors disabled:opacity-50">
                {billingLoading ? "Loading..." : "Upgrade to Pro"}
              </button>
            )}
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="font-heading font-semibold text-lg mb-4">Profile</h2>

          {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4">{error}</div>}
          {saved && <div className="bg-green-50 text-green-600 text-sm rounded-lg p-3 mb-4">Saved successfully!</div>}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input type="number" min={10} max={100} value={age} onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange bg-white">
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange bg-white">
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weekly km</label>
                <input type="number" min={0} value={weeklyKm} onChange={(e) => setWeeklyKm(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Heart Rate (optional)</label>
                <input type="number" min={0} max={250} value={maxHr} onChange={(e) => setMaxHr(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resting Heart Rate (optional)</label>
                <input type="number" min={0} max={120} value={restingHr} onChange={(e) => setRestingHr(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Unit</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" value="km" checked={preferredUnit === "km"} onChange={(e) => setPreferredUnit(e.target.value)} /> Kilometres
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" value="mile" checked={preferredUnit === "mile"} onChange={(e) => setPreferredUnit(e.target.value)} /> Miles
                </label>
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full mt-6 bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>

        {/* Danger zone */}
        <div className="bg-white rounded-2xl border border-red-200 p-6">
          <h2 className="font-heading font-semibold text-lg mb-2 text-red-600">Danger Zone</h2>
          <p className="text-sm text-gray-500 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
          <button onClick={handleDeleteAccount}
            className="border border-red-300 text-red-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-50 transition-colors">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

