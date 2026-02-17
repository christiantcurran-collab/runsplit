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
    const success = !error && !!data?.user;
    const dest = success ? (redirect || '/auth/callback/complete') : '/login?error=auth_failed';
    const fullDest = redirect ? `${siteUrl}${redirect}` : `${siteUrl}${dest}`;

    // Return HTML to log client-side before redirecting
    return new NextResponse(
      `<!DOCTYPE html><html><head><title>Redirecting...</title>
      <style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0C0C0F;color:#fff}.s{width:48px;height:48px;border:4px solid #333;border-top-color:#FF6B35;border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}</style>
      </head><body><div style="text-align:center"><div class="s"></div><p>Completing sign in...</p></div>
      <script>
      fetch('http://127.0.0.1:7242/ingest/9faee808-c16a-47b6-8374-5d2905920ea6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts',message:'Callback reached',data:{fullUrl:window.location.href,search:window.location.search,hostname:window.location.hostname,codePresent:${!!code},exchangeSuccess:${success},exchangeError:'${error?.message||""}',redirectParam:'${redirect}',siteUrl:'${siteUrl}',destination:'${dest}',fullDest:'${fullDest}'},timestamp:Date.now(),hypothesisId:'A_B_D_E'})}).catch(function(){});
      setTimeout(function(){window.location.href='${fullDest}'},300);
      </script></body></html>`,
      {status:200,headers:{'Content-Type':'text/html'}}
    );
  }

  // No code - return HTML to log then redirect
  return new NextResponse(
    `<!DOCTYPE html><html><head><title>Redirecting...</title></head><body>
    <script>
    fetch('http://127.0.0.1:7242/ingest/9faee808-c16a-47b6-8374-5d2905920ea6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:no-code',message:'No code in callback',data:{fullUrl:window.location.href,search:window.location.search,hostname:window.location.hostname},timestamp:Date.now(),hypothesisId:'A_D'})}).catch(function(){});
    setTimeout(function(){window.location.href='${siteUrl}/login?error=auth_failed'},300);
    </script></body></html>`,
    {status:200,headers:{'Content-Type':'text/html'}}
  );
}
