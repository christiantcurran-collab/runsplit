import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { deauthorizeStrava } from "@/lib/strava";

export async function POST() {
  try {
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get current access token
    const { data: profile } = await supabase
      .from("profiles")
      .select("strava_access_token")
      .eq("id", user.id)
      .single();

    // Revoke Strava access if we have a token
    if (profile?.strava_access_token) {
      try {
        await deauthorizeStrava(profile.strava_access_token);
      } catch {
        // Continue even if deauth fails — we'll clear our tokens anyway
      }
    }

    // Clear Strava data from profile
    await supabase
      .from("profiles")
      .update({
        strava_athlete_id: null,
        strava_access_token: null,
        strava_refresh_token: null,
        strava_token_expires_at: null,
        strava_connected_at: null,
      })
      .eq("id", user.id);

    // Delete synced activities
    await supabase
      .from("strava_activities")
      .delete()
      .eq("user_id", user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Strava disconnect error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to disconnect Strava" },
      { status: 500 }
    );
  }
}



