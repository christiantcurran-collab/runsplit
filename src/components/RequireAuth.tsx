"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Only redirect if loading is done and there's genuinely no user
    if (!loading && !user && !hasRedirected.current) {
      hasRedirected.current = true;
      const currentPath = window.location.pathname;
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-page flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-text-muted">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Already redirecting via useEffect above
    return (
      <div className="min-h-screen bg-bg-page flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-text-muted">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
