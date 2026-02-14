"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase";
import { Suspense } from "react";

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" /></div>}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState(30);
  const [gender, setGender] = useState("male");
  const [experienceLevel, setExperienceLevel] = useState("intermediate");
  const [weeklyKm, setWeeklyKm] = useState(30);
  const [preferredUnit, setPreferredUnit] = useState("km");
  const [maxHr, setMaxHr] = useState(0);
  const [restingHr, setRestingHr] = useState(0);

  // Email preferences
  const [emailWeeklySummary, setEmailWeeklySummary] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [billingLoading, setBillingLoading] = useState(false);

  // Strava state
  const [stravaLoading, setStravaLoading] = useState(false);
  const [stravaSyncing, setStravaSyncing] = useState(false);
  const [stravaSyncResult, setStravaSyncResult] = useState("");
  const [stravaMessage, setStravaMessage] = useState("");

  // Check for Strava callback params
  useEffect(() => {
    const stravaStatus = searchParams.get("strava");
    if (stravaStatus === "connected") {
      setStravaMessage("Strava connected successfully! You can now sync your activities.");
      refreshProfile();
    } else if (stravaStatus === "error") {
      setStravaMessage("Failed to connect Strava. Please try again.");
    }
  }, [searchParams, refreshProfile]);

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
      setEmailWeeklySummary(profile.email_weekly_summary ?? true);
      setEmailNotifications(profile.email_notifications_enabled ?? true);
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
      email_weekly_summary: emailWeeklySummary,
      email_notifications_enabled: emailNotifications,
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

  const handleConnectStrava = () => {
    setStravaLoading(true);
    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/strava/callback`;
    const scope = "read,activity:read_all,profile:read_all";
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&approval_prompt=auto&scope=${scope}`;
    window.location.href = authUrl;
  };

  const handleDisconnectStrava = async () => {
    if (!confirm("Disconnect Strava? This will remove all synced activities.")) return;
    setStravaLoading(true);
    try {
      const res = await fetch("/api/strava/disconnect", { method: "POST" });
      if (res.ok) {
        setStravaMessage("Strava disconnected successfully.");
        await refreshProfile();
      } else {
        setStravaMessage("Failed to disconnect Strava.");
      }
    } catch {
      setStravaMessage("Failed to disconnect Strava.");
    }
    setStravaLoading(false);
  };

  const handleSyncStrava = async () => {
    setStravaSyncing(true);
    setStravaSyncResult("");
    try {
      const res = await fetch("/api/strava/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setStravaSyncResult(`Synced ${data.synced} running activities from the last 90 days.`);
      } else {
        setStravaSyncResult(data.error || "Sync failed");
      }
    } catch {
      setStravaSyncResult("Failed to sync activities. Please try again.");
    }
    setStravaSyncing(false);
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure? This will permanently delete your account and all data.")) return;
    await supabase.from("strava_activities").delete().eq("user_id", user!.id);
    await supabase.from("training_log").delete().eq("user_id", user!.id);
    await supabase.from("training_plans").delete().eq("user_id", user!.id);
    await supabase.from("race_results").delete().eq("user_id", user!.id);
    await supabase.from("profiles").delete().eq("id", user!.id);
    await signOut();
    router.push("/");
  };

  const subStatus = profile?.subscription_status || "none";
  const isPro = subStatus === "active" || subStatus === "trialing";
  const isStravaConnected = !!profile?.strava_athlete_id;

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
                {subStatus === "active" ? "Pro \u2014 Active" : subStatus === "trialing" ? "Pro \u2014 Trial" : "Free"}
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
                {billingLoading ? "Loading..." : "Manage Billing \u2192"}
              </button>
            ) : (
              <button onClick={handleSubscribe} disabled={billingLoading}
                className="bg-brand-orange hover:bg-brand-orange-hover text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors disabled:opacity-50">
                {billingLoading ? "Loading..." : "Upgrade to Pro"}
              </button>
            )}
          </div>
        </div>

        {/* Strava Integration */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066l-2.084 4.116z" fill="#FC4C02"/>
              <path d="M10.233 13.828L7.188 7.5h-3.72l6.765 13.327 3.065-6.999h-3.065z" fill="#FC4C02"/>
            </svg>
            <h2 className="font-heading font-semibold text-lg">Strava</h2>
          </div>

          {stravaMessage && (
            <div className={`text-sm rounded-lg p-3 mb-4 ${
              stravaMessage.includes("success") || stravaMessage.includes("connected")
                ? "bg-green-50 text-green-600"
                : "bg-red-50 text-red-600"
            }`}>
              {stravaMessage}
            </div>
          )}

          {isStravaConnected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-green-400 rounded-full" />
                  <span className="text-sm text-gray-700 font-medium">Connected</span>
                  {profile?.strava_connected_at && (
                    <span className="text-xs text-gray-400">
                      since {new Date(profile.strava_connected_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleDisconnectStrava}
                  disabled={stravaLoading}
                  className="text-xs text-red-500 hover:text-red-600 font-medium disabled:opacity-50"
                >
                  Disconnect
                </button>
              </div>

              <button
                onClick={handleSyncStrava}
                disabled={stravaSyncing}
                className="w-full flex items-center justify-center gap-2 bg-[#FC4C02] hover:bg-[#e04400] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {stravaSyncing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Syncing activities...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Sync Activities (Last 90 Days)
                  </>
                )}
              </button>

              {stravaSyncResult && (
                <p className="text-sm text-gray-600 text-center">{stravaSyncResult}</p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-4">
                Connect your Strava account to sync running activities and get better training insights.
              </p>
              <button
                onClick={handleConnectStrava}
                disabled={stravaLoading}
                className="w-full flex items-center justify-center gap-2 bg-[#FC4C02] hover:bg-[#e04400] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {stravaLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066l-2.084 4.116z"/>
                      <path d="M10.233 13.828L7.188 7.5h-3.72l6.765 13.327 3.065-6.999h-3.065z"/>
                    </svg>
                    Connect with Strava
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Email Notifications */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="font-heading font-semibold text-lg mb-4">Email Notifications</h2>

          {!isPro && (
            <div className="bg-blue-50 text-blue-700 text-sm rounded-lg p-3 mb-4">
              Weekly training summaries are a Pro feature.{" "}
              <button onClick={handleSubscribe} className="font-semibold underline">Upgrade to Pro</button>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700">Weekly Training Summary</div>
                <div className="text-xs text-gray-500">Get a weekly email with your training progress, upcoming workouts, and tips</div>
              </div>
              <button
                type="button"
                onClick={() => setEmailWeeklySummary(!emailWeeklySummary)}
                disabled={!isPro}
                className={`w-12 h-7 rounded-full transition-colors relative ${
                  emailWeeklySummary && isPro ? "bg-brand-orange" : "bg-gray-300"
                } ${!isPro ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${
                  emailWeeklySummary && isPro ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700">General Notifications</div>
                <div className="text-xs text-gray-500">Account updates and important announcements</div>
              </div>
              <button
                type="button"
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={`w-12 h-7 rounded-full transition-colors relative ${
                  emailNotifications ? "bg-brand-orange" : "bg-gray-300"
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${
                  emailNotifications ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
            </div>
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
