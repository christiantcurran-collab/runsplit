import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Fallback route for auth callback when no explicit redirect is provided.
 * Performs smart routing based on user profile.
 */
export async function GET(request: Request) {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.log("Auth callback/complete - No user found, redirecting to login");
    return NextResponse.redirect(`${siteUrl}/login`);
  }

  // Check if the user has completed onboarding
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, experience_level, subscription_status")
    .eq("id", user.id)
    .single();

  const isOnboarded = profile?.experience_level || profile?.display_name;
  const isPro =
    profile?.subscription_status === "active" ||
    profile?.subscription_status === "trialing";

  let destination = "/plan";

  if (!isOnboarded) {
    // Brand new user — needs onboarding first
    destination = "/onboarding";
  } else if (!isPro) {
    // Returning user without subscription — send to checkout
    destination = "/start/checkout";
  } else {
    // Pro user — go to their plan dashboard
    destination = "/plan";
  }

  console.log("Auth callback/complete - Smart routing to:", destination);
  return NextResponse.redirect(`${siteUrl}${destination}`);
}



