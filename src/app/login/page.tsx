"use client";

import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, experience_level, subscription_status")
          .eq("id", data.session.user.id)
          .single();

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

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${siteUrl}/auth/callback` },
    });
  };

  const handleAppleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: `${siteUrl}/auth/callback` },
    });
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
          {/* Social logins */}
          <div className="space-y-3 mb-6">
            {/* Google */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 border border-[#E4E4E8] rounded-xl px-4 py-3 text-sm font-medium text-text-primary hover:bg-bg-subtle transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </button>

            {/* Apple */}
            <button
              onClick={handleAppleLogin}
              className="w-full flex items-center justify-center gap-3 border border-[#E4E4E8] rounded-xl px-4 py-3 text-sm font-medium text-text-primary hover:bg-bg-subtle transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Continue with Apple
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E4E4E8]" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-bg-card px-3 text-text-muted">or</span></div>
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
