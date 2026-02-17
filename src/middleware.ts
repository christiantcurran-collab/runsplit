import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Only run if Supabase is configured
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next();
  }

  // Safety net: if an OAuth code arrives at the wrong path (e.g. homepage),
  // redirect it to /auth/callback so the code gets properly exchanged.
  const code = request.nextUrl.searchParams.get("code");
  if (code && request.nextUrl.pathname !== "/auth/callback") {
    const callbackUrl = request.nextUrl.clone();
    // Preserve all query params (including ?redirect=) but change the path
    callbackUrl.pathname = "/auth/callback";
    return NextResponse.redirect(callbackUrl);
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // Use getSession() instead of getUser().
  // getSession() only contacts the Supabase server if the token needs refreshing.
  // getUser() contacts it EVERY time and can clear the session if that call fails,
  // which causes the "login works then immediately logged out" bug.
  //
  // Wrapped in try/catch to prevent ANY failure from affecting the response.
  try {
    await supabase.auth.getSession();
  } catch {
    // Swallow errors — don't let a failed session refresh break the page load.
    // The client-side AuthProvider will handle auth state.
  }

  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files, images, and api
    "/((?!_next/static|_next/image|favicon.ico|api|images).*)",
  ],
};
