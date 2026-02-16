"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, loading, signOut } = useAuth();

  const isPro =
    profile?.subscription_status === "active" ||
    profile?.subscription_status === "trialing";

  // Get display name or email initial for avatar
  const displayName = profile?.display_name || user?.email?.split("@")[0] || "";
  const avatarInitial = (displayName[0] || "R").toUpperCase();

  return (
    <header className="sticky top-0 z-50 bg-[rgba(12,12,15,0.95)] backdrop-blur-[20px]">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-6 h-[3px] bg-brand rounded-sm" />
            <span className="font-heading font-bold text-lg text-text-on-dark tracking-tight">
              RunSplit
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-7">
            <Link
              href="/tools"
              className="text-[13px] font-medium text-text-dark-sec hover:text-white transition-colors"
            >
              Tools
            </Link>
            <Link
              href="/plans"
              className="text-[13px] font-medium text-text-dark-sec hover:text-white transition-colors"
            >
              Plans
            </Link>

            {!loading && (
              <>
                {user ? (
                  <>
                    {isPro && (
                      <Link
                        href="/plan"
                        className="text-[13px] font-medium text-brand hover:text-brand-hover transition-colors"
                      >
                        My Plan
                      </Link>
                    )}
                    {!isPro && (
                      <Link
                        href="/pricing"
                        className="text-[13px] font-medium text-brand hover:text-brand-hover transition-colors"
                      >
                        Upgrade to Pro
                      </Link>
                    )}
                    <Link
                      href="/settings"
                      className="text-[13px] font-medium text-text-dark-sec hover:text-white transition-colors"
                    >
                      Settings
                    </Link>

                    {/* User avatar + sign out */}
                    <div className="flex items-center gap-3 ml-1 pl-3 border-l border-bg-dark-border">
                      <Link href="/settings" className="flex items-center gap-2 group">
                        <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold">
                          {avatarInitial}
                        </div>
                        <span className="text-[13px] font-medium text-text-dark-sec group-hover:text-white transition-colors max-w-[120px] truncate">
                          {displayName}
                        </span>
                      </Link>
                      <button
                        onClick={signOut}
                        className="text-[12px] font-medium text-text-dark-muted hover:text-white transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <Link
                      href="/pricing"
                      className="text-[13px] font-medium text-text-dark-sec hover:text-white transition-colors"
                    >
                      Pricing
                    </Link>
                    <Link
                      href="/login"
                      className="text-[13px] font-medium text-text-dark-sec hover:text-white transition-colors"
                    >
                      Log In
                    </Link>
                    <Link
                      href="/signup"
                      className="bg-brand text-white text-[13px] font-semibold px-4 py-[7px] rounded-md hover:bg-brand-hover transition-colors"
                    >
                      Get Pro
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-text-dark-sec hover:text-white p-2 -mr-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-bg-dark-border">
            <div className="flex flex-col gap-1 pt-3">
              <Link href="/tools" className="px-3 py-2.5 text-sm font-medium text-text-dark-sec hover:text-white" onClick={() => setMobileOpen(false)}>
                Tools
              </Link>
              <Link href="/plans" className="px-3 py-2.5 text-sm font-medium text-text-dark-sec hover:text-white" onClick={() => setMobileOpen(false)}>
                Plans
              </Link>
              {!loading && user ? (
                <>
                  {/* User info banner */}
                  <div className="mx-3 my-2 px-3 py-2.5 bg-bg-dark-card rounded-lg flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {avatarInitial}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate">{displayName}</div>
                      <div className="text-xs text-text-dark-muted truncate">{user.email}</div>
                    </div>
                    {isPro && (
                      <span className="ml-auto text-[10px] font-bold bg-brand/20 text-brand px-2 py-0.5 rounded-full flex-shrink-0">
                        PRO
                      </span>
                    )}
                  </div>

                  {isPro ? (
                    <Link href="/plan" className="px-3 py-2.5 text-sm font-semibold text-brand hover:text-brand-hover" onClick={() => setMobileOpen(false)}>
                      My Plan
                    </Link>
                  ) : (
                    <Link href="/pricing" className="px-3 py-2.5 text-sm font-semibold text-brand hover:text-brand-hover" onClick={() => setMobileOpen(false)}>
                      Upgrade to Pro
                    </Link>
                  )}
                  <Link href="/settings" className="px-3 py-2.5 text-sm font-medium text-text-dark-sec hover:text-white" onClick={() => setMobileOpen(false)}>
                    Settings
                  </Link>
                  <button onClick={() => { signOut(); setMobileOpen(false); }} className="px-3 py-2.5 text-sm font-medium text-text-dark-muted hover:text-white text-left">
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/pricing" className="px-3 py-2.5 text-sm font-medium text-text-dark-sec hover:text-white" onClick={() => setMobileOpen(false)}>
                    Pricing
                  </Link>
                  <div className="border-t border-bg-dark-border my-1" />
                  <Link href="/login" className="px-3 py-2.5 text-sm font-medium text-text-dark-sec hover:text-white" onClick={() => setMobileOpen(false)}>
                    Log In
                  </Link>
                  <Link href="/signup" className="mx-3 mt-1 bg-brand hover:bg-brand-hover text-white text-sm font-semibold px-4 py-2.5 rounded-md text-center" onClick={() => setMobileOpen(false)}>
                    Get Pro
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}



