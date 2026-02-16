import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Pages that require auth session refresh
const AUTH_PATHS = new Set([
  "/plan",
  "/settings",
  "/onboarding",
  "/pricing",
]);

function needsAuthRefresh(pathname: string): boolean {
  // Only refresh session on auth-sensitive pages, not on static/public pages
  if (AUTH_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/plan/")) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  // Only run if Supabase is configured
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Skip auth refresh for public pages (/, /tools/*, /calculators/*, /plans/*, /start/*)
  // This eliminates the Supabase roundtrip for most page loads
  if (!needsAuthRefresh(pathname) && pathname !== "/login" && pathname !== "/signup") {
    return NextResponse.next();
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

  // Refresh the session (important for keeping cookies alive)
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files, images, and api
    "/((?!_next/static|_next/image|favicon.ico|api|images).*)",
  ],
};
