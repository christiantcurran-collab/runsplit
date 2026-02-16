import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { exchangeStravaCode } from "@/lib/strava";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/settings?strava=error`);
  }

  try {
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${appUrl}/login?redirect=/settings`);
    }

    // Exchange code for tokens
    const tokenData = await exchangeStravaCode(code);

    // Save Strava tokens to profile
    await supabase
      .from("profiles")
      .update({
        strava_athlete_id: tokenData.athlete.id,
        strava_access_token: tokenData.access_token,
        strava_refresh_token: tokenData.refresh_token,
        strava_token_expires_at: tokenData.expires_at,
        strava_connected_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    return NextResponse.redirect(`${appUrl}/settings?strava=connected`);
  } catch (err) {
    console.error("Strava OAuth error:", err);
    return NextResponse.redirect(`${appUrl}/settings?strava=error`);
  }
}



