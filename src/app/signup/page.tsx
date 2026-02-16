"use client";

import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-page flex items-center justify-center"><div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" /></div>}>
      <SignupContent />
    </Suspense>
  );
}

function SignupContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "";

  const supabase = createClient();
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Pass redirect in the callback URL
    const callbackUrl = redirect
      ? `${siteUrl}/auth/callback?redirect=${encodeURIComponent(redirect)}`
      : `${siteUrl}/auth/callback`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: callbackUrl },
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-bg-page flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-bg-card rounded-2xl border border-[#E4E4E8] p-8 text-center">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-heading font-bold text-2xl text-text-primary mb-2">Check your email</h1>
          <p className="text-text-secondary text-sm">
            We sent a confirmation link to <strong>{email}</strong>. Click the link to activate your account.
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
          <h1 className="font-heading font-bold text-3xl text-text-primary mb-2">Create your account</h1>
          <p className="text-text-secondary">Get started with RunSplit Pro — &pound;4.99/month</p>
        </div>

        <div className="bg-bg-card rounded-2xl border border-[#E4E4E8] p-8">
          {/* Google — native GIS button (stays on runsplit.co) */}
          <div className="mb-4">
            <GoogleSignInButton
              text="signup_with"
              redirectUrl={redirect ? `/auth/callback?redirect=${encodeURIComponent(redirect)}` : undefined}
              onAuthStart={() => setLoading(true)}
              onError={(msg) => { setError(msg); setLoading(false); }}
            />
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E4E4E8]" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-bg-card px-3 text-text-muted">or sign up with email</span></div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4">{error}</div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
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
                placeholder="Choose a strong password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-hover text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-text-secondary mt-6">
          Already have an account?{" "}
          <Link href={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`} className="text-brand hover:text-brand-hover font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
