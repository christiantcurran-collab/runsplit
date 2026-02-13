"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading, signOut } = useAuth();

  return (
    <header className="bg-bg-dark text-text-on-dark sticky top-0 z-50 border-b border-white/[0.06]">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center font-heading font-extrabold text-sm text-white group-hover:scale-105 transition-transform">
              R
            </div>
            <span className="font-heading font-bold text-xl tracking-tight">
              Run<span className="text-brand">Split</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/tools"
              className="px-3 py-2 text-sm font-medium text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all"
            >
              Tools
            </Link>
            <Link
              href="/pricing"
              className="px-3 py-2 text-sm font-medium text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all"
            >
              Pricing
            </Link>

            {!loading && (
              <>
                {user ? (
                  <>
                    <Link
                      href="/coach"
                      className="px-3 py-2 text-sm font-medium text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all flex items-center gap-1.5"
                    >
                      Coach
                      <span className="text-[10px] font-bold bg-brand/20 text-brand px-1.5 py-0.5 rounded">PRO</span>
                    </Link>
                    <div className="w-px h-5 bg-white/10 mx-2" />
                    <Link
                      href="/settings"
                      className="px-3 py-2 text-sm font-medium text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all"
                    >
                      Settings
                    </Link>
                    <button
                      onClick={signOut}
                      className="px-3 py-2 text-sm font-medium text-zinc-500 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-px h-5 bg-white/10 mx-2" />
                    <Link
                      href="/login"
                      className="px-3 py-2 text-sm font-medium text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all"
                    >
                      Log In
                    </Link>
                    <Link
                      href="/signup"
                      className="ml-1 bg-brand hover:bg-brand-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      Pro
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-zinc-400 hover:text-white p-2 -mr-2"
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
          <div className="md:hidden pb-4 border-t border-white/[0.06]">
            <div className="flex flex-col gap-1 pt-3">
              <Link href="/tools" className="px-3 py-2.5 text-sm font-medium text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06]" onClick={() => setMobileOpen(false)}>
                Tools
              </Link>
              <Link href="/pricing" className="px-3 py-2.5 text-sm font-medium text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06]" onClick={() => setMobileOpen(false)}>
                Pricing
              </Link>
              {!loading && user ? (
                <>
                  <Link href="/coach" className="px-3 py-2.5 text-sm font-medium text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06]" onClick={() => setMobileOpen(false)}>
                    Coach <span className="text-[10px] font-bold bg-brand/20 text-brand px-1.5 py-0.5 rounded ml-1">PRO</span>
                  </Link>
                  <Link href="/settings" className="px-3 py-2.5 text-sm font-medium text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06]" onClick={() => setMobileOpen(false)}>
                    Settings
                  </Link>
                  <button onClick={() => { signOut(); setMobileOpen(false); }} className="px-3 py-2.5 text-sm font-medium text-zinc-500 hover:text-white rounded-lg hover:bg-white/[0.06] text-left">
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <div className="border-t border-white/[0.06] my-1" />
                  <Link href="/login" className="px-3 py-2.5 text-sm font-medium text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06]" onClick={() => setMobileOpen(false)}>
                    Log In
                  </Link>
                  <Link href="/signup" className="mx-3 mt-1 bg-brand hover:bg-brand-hover text-white text-sm font-semibold px-4 py-2.5 rounded-lg text-center" onClick={() => setMobileOpen(false)}>
                    Start Free Trial
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
