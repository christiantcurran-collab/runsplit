"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading, signOut } = useAuth();

  return (
    <header className="bg-brand-black text-white sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-brand-orange rounded-lg flex items-center justify-center font-heading font-black text-sm group-hover:scale-105 transition-transform">
              R
            </div>
            <span className="font-heading font-bold text-xl tracking-tight">
              Run<span className="text-brand-orange">Split</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/calculators"
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Calculators
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Pricing
            </Link>

            {!loading && (
              <>
                {user ? (
                  <>
                    <Link
                      href="/plan"
                      className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                    >
                      My Plan
                    </Link>
                    <div className="flex items-center gap-3">
                      <Link
                        href="/settings"
                        className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                      >
                        Settings
                      </Link>
                      <button
                        onClick={signOut}
                        className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                    >
                      Log In
                    </Link>
                    <Link
                      href="/signup"
                      className="bg-brand-orange hover:bg-brand-orange-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
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
            className="md:hidden text-gray-300 hover:text-white"
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
          <div className="md:hidden pb-4 border-t border-gray-800">
            <div className="flex flex-col gap-3 pt-4">
              <Link href="/calculators" className="text-sm font-medium text-gray-300 hover:text-white" onClick={() => setMobileOpen(false)}>
                Calculators
              </Link>
              <Link href="/pricing" className="text-sm font-medium text-gray-300 hover:text-white" onClick={() => setMobileOpen(false)}>
                Pricing
              </Link>
              {!loading && user ? (
                <>
                  <Link href="/plan" className="text-sm font-medium text-gray-300 hover:text-white" onClick={() => setMobileOpen(false)}>
                    My Plan
                  </Link>
                  <Link href="/settings" className="text-sm font-medium text-gray-300 hover:text-white" onClick={() => setMobileOpen(false)}>
                    Settings
                  </Link>
                  <button onClick={() => { signOut(); setMobileOpen(false); }} className="text-sm font-medium text-gray-400 hover:text-white text-left">
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white" onClick={() => setMobileOpen(false)}>
                    Log In
                  </Link>
                  <Link href="/signup" className="bg-brand-orange hover:bg-brand-orange-hover text-white text-sm font-semibold px-4 py-2 rounded-lg text-center" onClick={() => setMobileOpen(false)}>
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
