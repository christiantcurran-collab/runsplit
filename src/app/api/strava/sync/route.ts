import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { fetchStravaActivities, getValidStravaToken } from "@/lib/strava";

export async function POST() {
  try {
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "strava_access_token, strava_refresh_token, strava_token_expires_at, strava_athlete_id"
      )
      .eq("id", user.id)
      .single();

    if (!profile?.strava_access_token || !profile?.strava_refresh_token) {
      return NextResponse.json({ error: "Strava not connected" }, { status: 400 });
    }

    const accessToken = await getValidStravaToken(
      profile.strava_access_token,
      profile.strava_refresh_token,
      profile.strava_token_expires_at || 0,
      async (newTokens) => {
        await supabase
          .from("profiles")
          .update({
            strava_access_token: newTokens.access_token,
            strava_refresh_token: newTokens.refresh_token,
            strava_token_expires_at: newTokens.expires_at,
          })
          .eq("id", user.id);
      }
    );

    const ninetyDaysAgo = Math.floor(
      (Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000
    );

    let allActivities: Awaited<ReturnType<typeof fetchStravaActivities>> = [];
    let page = 1;

    while (page <= 5) {
      const activities = await fetchStravaActivities(accessToken, {
        after: ninetyDaysAgo,
        page,
        per_page: 50,
      });

      if (activities.length === 0) break;
      allActivities = [...allActivities, ...activities];
      if (activities.length < 50) break;
      page++;
    }

    const runningActivities = allActivities.filter(
      (a) =>
        a.type === "Run" ||
        a.type === "TrailRun" ||
        a.type === "VirtualRun" ||
        a.sport_type === "Run" ||
        a.sport_type === "TrailRun"
    );

    let synced = 0;
    for (const activity of runningActivities) {
      const { error: upsertError } = await supabase
        .from("strava_activities")
        .upsert(
          {
            user_id: user.id,
            strava_activity_id: activity.id,
            name: activity.name,
            activity_type: activity.type,
            distance_meters: activity.distance,
            moving_time_seconds: activity.moving_time,
            elapsed_time_seconds: activity.elapsed_time,
            total_elevation_gain: activity.total_elevation_gain,
            start_date: activity.start_date,
            average_speed: activity.average_speed,
            max_speed: activity.max_speed,
            average_heartrate: activity.average_heartrate || null,
            max_heartrate: activity.max_heartrate || null,
            suffer_score: activity.suffer_score || null,
            calories: activity.calories || null,
            map_polyline: activity.map?.summary_polyline || null,
            synced_at: new Date().toISOString(),
          },
          { onConflict: "strava_activity_id" }
        );

      if (!upsertError) synced++;
    }

    return NextResponse.json({
      synced,
      total: runningActivities.length,
      message: `Synced ${synced} running activities from Strava`,
    });
  } catch (err) {
    console.error("Strava sync error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to sync Strava activities",
      },
      { status: 500 }
    );
  }
}



