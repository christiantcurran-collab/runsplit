import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") || "";
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

  if (code) {
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

    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      // Check if the user has completed onboarding (has a profile with display_name or experience_level)
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, experience_level, subscription_status")
        .eq("id", data.user.id)
        .single();

      // Determine where to send them
      let destination = redirect;

      if (!destination) {
        const isOnboarded = profile?.experience_level || profile?.display_name;
        const isPro =
          profile?.subscription_status === "active" ||
          profile?.subscription_status === "trialing";

        if (!isOnboarded) {
          // Brand new user — needs onboarding first
          destination = "/onboarding";
        } else if (!isPro) {
          // Returning user without subscription — send to pricing
          destination = "/pricing";
        } else {
          // Pro user — go to their plan dashboard
          destination = "/plan";
        }
      }

      return NextResponse.redirect(`${siteUrl}${destination}`);
    }
  }

  return NextResponse.redirect(`${siteUrl}/login?error=auth_failed`);
}
