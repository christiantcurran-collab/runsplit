"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

/**
 * Google Sign-In button that uses Google Identity Services (GIS) directly.
 * The user never sees the Supabase URL — auth happens via popup/one-tap
 * on runsplit.co, and the ID token is passed to Supabase server-side.
 */

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (
            element: HTMLElement,
            options: Record<string, unknown>
          ) => void;
          prompt: (callback?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  text?: "signin_with" | "signup_with" | "continue_with";
  onAuthStart?: () => void;
  onAuthComplete?: (user: { id: string; email?: string }) => void;
  onError?: (message: string) => void;
  /** If true, skip automatic redirect and let parent handle it */
  skipRedirect?: boolean;
}

export default function GoogleSignInButton({
  text = "continue_with",
  onAuthStart,
  onAuthComplete,
  onError,
  skipRedirect = false,
}: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();
  const router = useRouter();
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      onAuthStart?.();
      setError("");

      try {
        const { data, error: authError } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: response.credential,
        });

        if (authError) {
          const msg = authError.message || "Google sign-in failed";
          setError(msg);
          onError?.(msg);
          return;
        }

        if (data.user) {
          onAuthComplete?.({ id: data.user.id, email: data.user.email });

          if (!skipRedirect) {
            // Check profile to determine redirect destination
            const { data: profile } = await supabase
              .from("profiles")
              .select("display_name, experience_level, subscription_status")
              .eq("id", data.user.id)
              .single();

            const isOnboarded = profile?.experience_level || profile?.display_name;
            const isPro =
              profile?.subscription_status === "active" ||
              profile?.subscription_status === "trialing";

            if (!isOnboarded) {
              router.push("/onboarding");
            } else if (!isPro) {
              router.push("/pricing");
            } else {
              router.push("/plan");
            }
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Sign-in failed";
        setError(msg);
        onError?.(msg);
      }
    },
    [supabase, router, onAuthStart, onAuthComplete, onError, skipRedirect]
  );

  useEffect(() => {
    if (!clientId) return;

    // Load the Google Identity Services script
    const existingScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    );

    const initializeGoogle = () => {
      if (!window.google || !buttonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        shape: "rectangular",
        text,
        width: buttonRef.current.offsetWidth || 360,
        logo_alignment: "center",
      });

      setLoaded(true);
    };

    if (existingScript && window.google) {
      initializeGoogle();
    } else if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      document.head.appendChild(script);
    } else {
      // Script exists but not loaded yet
      existingScript.addEventListener("load", initializeGoogle);
    }
  }, [clientId, text, handleCredentialResponse]);

  if (!clientId) {
    // Fallback to old Supabase OAuth if Google Client ID not configured
    const handleFallback = async () => {
      const siteUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${siteUrl}/auth/callback` },
      });
    };

    return (
      <button
        onClick={handleFallback}
        className="w-full flex items-center justify-center gap-3 border border-[#E4E4E8] rounded-xl px-4 py-3 text-sm font-medium text-text-primary hover:bg-bg-subtle transition-colors"
      >
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
        Continue with Google
      </button>
    );
  }

  return (
    <div className="w-full">
      {error && (
        <div className="bg-red-50 text-red-600 text-xs rounded-lg p-2 mb-2">
          {error}
        </div>
      )}
      <div
        ref={buttonRef}
        className={`w-full flex items-center justify-center ${
          !loaded ? "min-h-[44px] bg-gray-50 border border-[#E4E4E8] rounded-xl animate-pulse" : ""
        }`}
      />
    </div>
  );
}

