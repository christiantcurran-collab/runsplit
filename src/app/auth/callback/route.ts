import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") || "";
  const state = searchParams.get("state") || "";
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

  // Debug logging
  console.log("Auth callback - Full URL:", request.url);
  console.log("Auth callback - Code:", code ? "present" : "missing");
  console.log("Auth callback - Redirect param from URL:", redirect || "(empty)");
  console.log("Auth callback - State param:", state || "(empty)");
  console.log("Auth callback - Site URL:", siteUrl);

  if (code) {
    const cookieStore = cookies();
    
    // Try to read redirect from OAuth state parameter (most reliable)
    let redirectFromState = "";
    if (state) {
      try {
        const stateData = JSON.parse(state);
        redirectFromState = stateData.redirect || "";
        console.log("Auth callback - Parsed state data:", stateData);
      } catch (e) {
        console.log("Auth callback - Failed to parse state:", e);
      }
    }
    
    // Fallback to cookies if state is not available
    const redirectFromCookie = cookieStore.get('auth_redirect')?.value || 
                               cookieStore.get('auth_redirect_local')?.value;
    
    console.log("Auth callback - Checking redirect sources:");
    console.log("  → From state parameter:", redirectFromState || "(none)");
    console.log("  → From cookies:", redirectFromCookie || "(none)");
    
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
      // Clear the redirect cookies
      cookieStore.delete('auth_redirect');
      cookieStore.delete('auth_redirect_local');
      
      // Priority: state parameter > URL param > cookies
      const finalRedirect = redirectFromState || redirect || (redirectFromCookie ? decodeURIComponent(redirectFromCookie) : "");
      
      console.log("Auth callback - Final redirect decision:", finalRedirect || "(none - will use client-side fallback)");
      
      // If we have a redirect from state or cookies, use it directly
      if (finalRedirect && !redirect) {
        console.log("Auth callback - Using redirect from state/cookie:", finalRedirect);
        return NextResponse.redirect(`${siteUrl}${finalRedirect}`);
      }
      
      // If no redirect at all, return HTML that checks client-side storage as last resort
      if (!finalRedirect) {
        console.log("Auth callback - No redirect in URL, returning HTML to check cookie/localStorage");
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
              console.log('🟢 AUTH CALLBACK: Starting redirect check');
              console.log('  → Current URL:', window.location.href);
              console.log('  → Current domain:', window.location.hostname);
              
              // Helper to get cookie value
              function getCookie(name) {
                const value = document.cookie.match('(^|;)\\\\s*' + name + '\\\\s*=\\\\s*([^;]+)');
                return value ? decodeURIComponent(value.pop()) : '';
              }
              
              // Check all possible storage locations
              const cookieRedirect = getCookie('auth_redirect');
              const cookieLocalRedirect = getCookie('auth_redirect_local');
              const localStorageRedirect = localStorage.getItem('auth_redirect');
              
              console.log('🟢 AUTH CALLBACK: Checking all storage:');
              console.log('  → Cookie (domain .runsplit.co):', cookieRedirect || '(none)');
              console.log('  → Cookie (local domain):', cookieLocalRedirect || '(none)');
              console.log('  → localStorage:', localStorageRedirect || '(none)');
              console.log('  → All cookies:', document.cookie || '(none)');
              
              // Use any available redirect
              let storedRedirect = cookieRedirect || cookieLocalRedirect || localStorageRedirect;
              
              if (storedRedirect) {
                // Clear all storage
                document.cookie = 'auth_redirect=; path=/; domain=.runsplit.co; max-age=0';
                document.cookie = 'auth_redirect_local=; path=/; max-age=0';
                localStorage.removeItem('auth_redirect');
                
                console.log('🟢 AUTH CALLBACK: ✅ Found redirect, navigating to:', storedRedirect);
                console.log('  → Full URL will be:', window.location.origin + storedRedirect);
                
                window.location.href = storedRedirect;
              } else {
                console.log('🟢 AUTH CALLBACK: ❌ No redirect found, using smart routing');
                console.log('  → Redirecting to /auth/callback/complete for profile check');
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



