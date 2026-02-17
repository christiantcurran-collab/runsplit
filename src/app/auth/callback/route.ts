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
    
    // Priority: state parameter > URL param > cookies
    const finalRedirect = redirectFromState || redirect || (redirectFromCookie ? decodeURIComponent(redirectFromCookie) : "");
    
    // ALWAYS return HTML so we can log client-side (debug mode)
    const exchangeSuccess = !error && !!data?.user;
    const userId = data?.user?.id || "(none)";
    const userEmail = data?.user?.email || "(none)";
    
    console.log("Auth callback - Exchange result:", exchangeSuccess ? "SUCCESS" : "FAILED");
    console.log("Auth callback - Error:", error?.message || "(none)");
    console.log("Auth callback - Final redirect:", finalRedirect || "(none)");
    
    // Return HTML that logs diagnostics then redirects
    return new NextResponse(
      `<!DOCTYPE html>
      <html><head><title>Redirecting...</title>
      <style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0C0C0F;color:#fff;}.spinner{width:48px;height:48px;border:4px solid #333;border-top-color:#FF6B35;border-radius:50%;animation:spin .8s linear infinite;margin-bottom:16px;}@keyframes spin{to{transform:rotate(360deg);}}</style>
      </head><body><div style="text-align:center;"><div class="spinner"></div><p>Completing sign in...</p></div>
      <script>
        var diagnostics = {
          location: 'auth/callback/route.ts:client-html',
          message: 'Auth callback reached - client side',
          data: {
            currentUrl: window.location.href,
            hostname: window.location.hostname,
            fullSearch: window.location.search,
            exchangeSuccess: ${exchangeSuccess},
            userId: '${userId}',
            userEmail: '${userEmail}',
            exchangeError: '${error?.message || ""}',
            finalRedirect: '${finalRedirect}',
            redirectFromState: '${redirectFromState}',
            redirectFromUrl: '${redirect}',
            redirectFromCookie: '${redirectFromCookie || ""}',
            siteUrl: '${siteUrl}',
            allSearchParams: Object.fromEntries(new URLSearchParams(window.location.search))
          },
          timestamp: Date.now(),
          hypothesisId: 'C_D'
        };
        
        console.log('AUTH CALLBACK DIAGNOSTICS:', diagnostics);
        
        fetch('http://127.0.0.1:7242/ingest/9faee808-c16a-47b6-8374-5d2905920ea6',{
          method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify(diagnostics)
        }).catch(function(){});
        
        var dest = '${finalRedirect}' || '/auth/callback/complete';
        
        if (!${exchangeSuccess}) {
          dest = '/login?error=auth_failed';
        }
        
        console.log('AUTH CALLBACK: Redirecting to:', dest);
        
        setTimeout(function() { window.location.href = dest; }, 200);
      </script></body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  }
  
  // No code parameter at all - log and redirect
  console.log("Auth callback - NO CODE in URL, redirecting to login");
  
  return new NextResponse(
    `<!DOCTYPE html>
    <html><head><title>Redirecting...</title></head><body>
    <script>
      fetch('http://127.0.0.1:7242/ingest/9faee808-c16a-47b6-8374-5d2905920ea6',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({location:'auth/callback:no-code',message:'No code in callback URL',data:{url:window.location.href,search:window.location.search,hostname:window.location.hostname},timestamp:Date.now(),hypothesisId:'D'})
      }).catch(function(){});
      window.location.href = '/login?error=auth_failed';
    </script></body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  );
}



