import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getStravaAuthUrl } from "@/lib/strava";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use canonical app URL to ensure redirect_uri matches across auth-url and callback
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL !== "http://localhost:3000"
      ? process.env.NEXT_PUBLIC_APP_URL
      : request.nextUrl.origin;

    const url = getStravaAuthUrl(user.id, appBaseUrl);
    console.log("Strava auth URL generated with base:", appBaseUrl);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Failed to build Strava auth URL:", err);
    return NextResponse.json(
      { error: "Failed to start Strava connection" },
      { status: 500 }
    );
  }
}
