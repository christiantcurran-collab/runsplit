"use client";

import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-page flex items-center justify-center"><div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" /></div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/plan";

  const supabase = createClient();
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          setError("Your email hasn't been confirmed yet. Check your inbox or use the magic link option below.");
        } else {
          setError(error.message);
        }
        setLoading(false);
        return;
      }

      if (data?.session) {
        // Smart routing: check profile to decide where to send user
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("display_name, experience_level, subscription_status")
          .eq("id", data.session.user.id)
          .maybeSingle();

        // If profile lookup is temporarily unavailable, continue to app and let gates resolve.
        if (profileError) {
          window.location.href = redirect;
          return;
        }

        const isOnboarded = profile?.experience_level || profile?.display_name;
        const isPro = profile?.subscription_status === "active" || profile?.subscription_status === "trialing";

        if (!isOnboarded) {
          window.location.href = "/onboarding";
        } else if (!isPro) {
          window.location.href = "/pricing";
        } else {
          window.location.href = redirect;
        }
      } else {
        setError("Login succeeded but no session was returned. Try clearing your browser cache and cookies, then try again.");
        setLoading(false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed. Please try again.");
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) return;
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${siteUrl}/auth/callback?redirect=${redirect}` },
    });

    if (error) {
      setError(error.message);
    } else {
      setMagicLinkSent(true);
    }
    setLoading(false);
  };

  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-bg-page flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-bg-card rounded-2xl border border-[#E4E4E8] p-8 text-center">
          <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="font-heading font-bold text-2xl text-text-primary mb-2">Check your email</h1>
          <p className="text-text-secondary text-sm">
            We sent a magic link to <strong>{email}</strong>. Click the link to sign in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-page flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-6 h-[3px] bg-brand rounded-sm" />
            <span className="font-heading font-bold text-lg text-text-primary tracking-tight">
              RunSplit
            </span>
          </Link>
          <h1 className="font-heading font-bold text-3xl text-text-primary mb-2">Welcome back</h1>
          <p className="text-text-secondary">Log in to your RunSplit account</p>
        </div>

        <div className="bg-bg-card rounded-2xl border border-[#E4E4E8] p-8">
          {/* Google — native GIS button (stays on runsplit.co) */}
          <div className="mb-4">
            <GoogleSignInButton
              text="continue_with"
              redirectUrl={redirect !== "/plan" ? `/auth/callback?redirect=${encodeURIComponent(redirect)}` : undefined}
              onAuthStart={() => setLoading(true)}
              onError={(msg) => { setError(msg); setLoading(false); }}
            />
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E4E4E8]" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-bg-card px-3 text-text-muted">or sign in with email</span></div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4">{error}</div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-[#E4E4E8] rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-[#E4E4E8] rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                placeholder="Your password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-hover text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <button
            onClick={handleMagicLink}
            disabled={!email || loading}
            className="w-full mt-3 text-sm text-brand hover:text-brand-hover font-medium disabled:opacity-50"
          >
            Send me a magic link instead
          </button>
        </div>

        <p className="text-center text-sm text-text-secondary mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-brand hover:text-brand-hover font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}



