"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

/**
 * Google Sign-In button that uses Supabase OAuth.
 * Shows a branded loading overlay on runsplit.co before redirecting,
 * so the user's last impression is the RunSplit page, not the Supabase URL.
 */

interface GoogleSignInButtonProps {
  text?: "signin_with" | "signup_with" | "continue_with";
  redirectUrl?: string; // Optional custom redirect URL (e.g. with ?redirect= param)
  onAuthStart?: () => void;
  onError?: (message: string) => void;
}

export default function GoogleSignInButton({
  text = "continue_with",
  redirectUrl,
  onAuthStart,
  onError,
}: GoogleSignInButtonProps) {
  const [redirecting, setRedirecting] = useState(false);
  const supabase = createClient();

  const label =
    text === "signup_with"
      ? "Sign up with Google"
      : text === "signin_with"
      ? "Sign in with Google"
      : "Continue with Google";

  const handleGoogleSignIn = async () => {
    setRedirecting(true);
    onAuthStart?.();

    try {
      const siteUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      
      // If we have a custom redirectUrl with a redirect param, store it in localStorage
      // This ensures it survives the OAuth flow
      if (redirectUrl && redirectUrl.includes('redirect=')) {
        const url = new URL(redirectUrl, siteUrl);
        const redirectParam = url.searchParams.get('redirect');
        if (redirectParam) {
          localStorage.setItem('auth_redirect', redirectParam);
          console.log('GoogleSignIn: Stored redirect in localStorage:', redirectParam);
        }
      }
      
      const callbackUrl = `/auth/callback`;
      console.log('GoogleSignIn: Starting OAuth with callback:', `${siteUrl}${callbackUrl}`);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${siteUrl}${callbackUrl}`,
        },
      });

      if (error) {
        setRedirecting(false);
        onError?.(error.message);
      }
      // If no error, the browser will navigate away to Google
    } catch (err) {
      setRedirecting(false);
      onError?.(err instanceof Error ? err.message : "Failed to connect to Google");
    }
  };

  // Full-screen branded overlay while redirecting
  if (redirecting) {
    return (
      <>
        {/* Overlay covers everything */}
        <div className="fixed inset-0 z-[9999] bg-bg-page flex flex-col items-center justify-center">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-6 h-[3px] bg-brand rounded-sm" />
            <span className="font-heading font-bold text-lg text-text-primary tracking-tight">
              RunSplit
            </span>
          </div>
          <div className="w-10 h-10 border-3 border-brand border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-text-secondary text-sm">Connecting to Google...</p>
        </div>
        {/* Keep the button rendered underneath so OAuth redirect continues */}
        <button disabled className="w-full flex items-center justify-center gap-3 border border-[#E4E4E8] rounded-xl px-4 py-3 text-sm font-medium text-text-primary opacity-50">
          <GoogleIcon />
          {label}
        </button>
      </>
    );
  }

  return (
    <button
      onClick={handleGoogleSignIn}
      className="w-full flex items-center justify-center gap-3 border border-[#E4E4E8] rounded-xl px-4 py-3 text-sm font-medium text-text-primary hover:bg-bg-subtle transition-colors"
    >
      <GoogleIcon />
      {label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}



