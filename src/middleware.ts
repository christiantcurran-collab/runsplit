import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase-middleware";

export async function middleware(request: NextRequest) {
  // Only run auth middleware if Supabase is configured
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return await updateSession(request);
  }
}

export const config = {
  matcher: ["/plan/:path*", "/onboarding/:path*", "/settings/:path*"],
};

