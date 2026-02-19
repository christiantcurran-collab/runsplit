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
      // Always attempt welcome email — dedup is handled server-side via email_log table
      // (the 60-second isNewUser check was too strict: email/password users verify hours later)
      fetch(`${siteUrl}/api/email/welcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: data.user.id }),
      }).catch((err) => console.error("Welcome email trigger failed:", err));

      if (redirect) {
        return NextResponse.redirect(`${siteUrl}${redirect}`);
      }
      return NextResponse.redirect(`${siteUrl}/auth/callback/complete`);
    }
  }

  return NextResponse.redirect(`${siteUrl}/login?error=auth_failed`);
}
