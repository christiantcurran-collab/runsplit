import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") || "";
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

  // Debug logging
  console.log("Auth callback - Full URL:", request.url);
  console.log("Auth callback - Code:", code ? "present" : "missing");
  console.log("Auth callback - Redirect param from URL:", redirect || "(empty)");
  console.log("Auth callback - Site URL:", siteUrl);

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
      // If no redirect in URL, return HTML that checks localStorage client-side
      if (!redirect) {
        console.log("Auth callback - No redirect in URL, returning HTML to check localStorage");
        return new NextResponse(
          `<!DOCTYPE html>
          <html>
          <head>
            <title>Redirecting...</title>
            <style>
              body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-center; min-height: 100vh; margin: 0; background: #0C0C0F; color: #fff; }
              .spinner { width: 48px; height: 48px; border: 4px solid #333; border-top-color: #FF6B35; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 16px; }
              @keyframes spin { to { transform: rotate(360deg); } }
            </style>
          </head>
          <body>
            <div style="text-align: center;">
              <div class="spinner"></div>
              <p>Completing sign in...</p>
            </div>
            <script>
              console.log('Auth callback HTML: Checking localStorage for redirect');
              const storedRedirect = localStorage.getItem('auth_redirect');
              console.log('Auth callback HTML: Stored redirect:', storedRedirect || '(none)');
              
              if (storedRedirect) {
                localStorage.removeItem('auth_redirect');
                console.log('Auth callback HTML: Redirecting to stored path:', storedRedirect);
                window.location.href = storedRedirect;
              } else {
                console.log('Auth callback HTML: No stored redirect, checking profile for smart routing');
                // Fallback to API route with profile check
                window.location.href = '/auth/callback/complete';
              }
            </script>
          </body>
          </html>`,
          {
            status: 200,
            headers: { 'Content-Type': 'text/html' },
          }
        );
      }

      // If we have a redirect in URL, use it directly
      console.log("Auth callback - Using redirect from URL:", redirect);
      console.log("Auth callback - Redirecting to:", `${siteUrl}${redirect}`);
      return NextResponse.redirect(`${siteUrl}${redirect}`);
    }
  }

  return NextResponse.redirect(`${siteUrl}/login?error=auth_failed`);
}



