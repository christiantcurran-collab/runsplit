"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

interface AppleSignInButtonProps {
  text?: "signin_with" | "signup_with" | "continue_with";
  redirectUrl?: string;
  onAuthStart?: () => void;
  onError?: (message: string) => void;
}

export default function AppleSignInButton({
  text = "continue_with",
  redirectUrl,
  onAuthStart,
  onError,
}: AppleSignInButtonProps) {
  const [redirecting, setRedirecting] = useState(false);
  const supabase = createClient();

  const label =
    text === "signup_with"
      ? "Sign up with Apple"
      : text === "signin_with"
      ? "Sign in with Apple"
      : "Continue with Apple";

  const handleAppleSignIn = async () => {
    setRedirecting(true);
    onAuthStart?.();

    try {
      const siteUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

      // Extract the redirect destination from the redirectUrl prop
      let redirectDest = "";
      if (redirectUrl) {
        if (redirectUrl.includes("redirect=")) {
          const url = new URL(redirectUrl, siteUrl);
          redirectDest = url.searchParams.get("redirect") || "";
        }
      }

      // Build callback URL with redirect parameter baked in
      const callbackUrl = redirectDest
        ? `${siteUrl}/auth/callback?redirect=${encodeURIComponent(redirectDest)}`
        : `${siteUrl}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: callbackUrl,
        },
      });

      if (error) {
        setRedirecting(false);
        onError?.(error.message);
      }
    } catch (err) {
      setRedirecting(false);
      onError?.(err instanceof Error ? err.message : "Failed to connect to Apple");
    }
  };

  if (redirecting) {
    return (
      <>
        <div className="fixed inset-0 z-[9999] bg-bg-page flex flex-col items-center justify-center">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-6 h-[3px] bg-brand rounded-sm" />
            <span className="font-heading font-bold text-lg text-text-primary tracking-tight">
              RunSplit
            </span>
          </div>
          <div className="w-10 h-10 border-3 border-brand border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-text-secondary text-sm">Connecting to Apple...</p>
        </div>
        <button disabled className="w-full flex items-center justify-center gap-3 bg-black text-white rounded-xl px-4 py-3 text-sm font-medium opacity-50">
          <AppleIcon />
          {label}
        </button>
      </>
    );
  }

  return (
    <button
      onClick={handleAppleSignIn}
      className="w-full flex items-center justify-center gap-3 bg-black hover:bg-gray-900 text-white rounded-xl px-4 py-3 text-sm font-medium transition-colors"
    >
      <AppleIcon />
      {label}
    </button>
  );
}

function AppleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

