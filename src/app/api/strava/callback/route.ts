import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { exchangeStravaCode } from "@/lib/strava";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");

  // Always use the canonical app URL to avoid www/apex domain mismatches
  const appUrl = process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL !== "http://localhost:3000"
    ? process.env.NEXT_PUBLIC_APP_URL
    : request.nextUrl.origin;

  if (oauthError || !code) {
    console.error("Strava OAuth error param:", oauthError);
    return NextResponse.redirect(`${appUrl}/settings?strava=error`);
  }

  try {
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error("Strava callback: no authenticated user found");
      return NextResponse.redirect(`${appUrl}/login?redirect=/settings`);
    }

    // Use the SAME base URL for callback that was used in the auth-url generation
    const redirectUri = `${appUrl}/api/strava/callback`;
    console.log("Strava token exchange with redirectUri:", redirectUri);
    const tokenData = await exchangeStravaCode(code, redirectUri);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        strava_athlete_id: tokenData.athlete.id,
        strava_access_token: tokenData.access_token,
        strava_refresh_token: tokenData.refresh_token,
        strava_token_expires_at: tokenData.expires_at,
        strava_connected_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Failed to save Strava tokens:", updateError);
      return NextResponse.redirect(`${appUrl}/settings?strava=error`);
    }

    return NextResponse.redirect(`${appUrl}/settings?strava=connected`);
  } catch (err) {
    console.error("Strava OAuth error:", err);
    return NextResponse.redirect(`${appUrl}/settings?strava=error`);
  }
}



