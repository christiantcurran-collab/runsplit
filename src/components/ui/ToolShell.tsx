"use client";

import Link from "next/link";
import React from "react";

const allTools = [
  { href: "/tools/pace", label: "Pace & Speed", desc: "Distance + time = pace" },
  { href: "/tools/predict", label: "What Can I Run?", desc: "Predict any race time" },
  { href: "/tools/splits", label: "Race Split Planner", desc: "Plan your race splits" },
  { href: "/tools/training-paces", label: "Find My Training Paces", desc: "Your training zones" },
  { href: "/tools/convert", label: "Pace Converter", desc: "Convert pace & speed" },
  { href: "/tools/age-grade", label: "How Good Is My Time?", desc: "Age-graded performance" },
  { href: "/tools/vo2max", label: "Estimate My VO2max", desc: "Estimate your VO2max" },
  { href: "/tools/heart-rate", label: "My Heart Rate Zones", desc: "Heart rate training zones" },
  { href: "/tools/calories", label: "Calories Burned", desc: "Calories burned running" },
  { href: "/tools/treadmill", label: "Treadmill vs Outdoor", desc: "Treadmill ↔ outdoor pace" },
  { href: "/tools/negative-split", label: "Negative Split Strategy", desc: "Negative split planner" },
  { href: "/tools/run-walk", label: "Run/Walk Planner", desc: "Run/walk intervals" },
];

interface ToolShellProps {
  title: string;
  description: string;
  currentPath: string;
  inputs: React.ReactNode;
  children: React.ReactNode; // results
  explanation?: React.ReactNode;
  proCta?: string; // Dynamic CTA text, e.g. "Want a training plan for 3:32?"
}

export default function ToolShell({
  title,
  description,
  currentPath,
  inputs,
  children,
  explanation,
  proCta,
}: ToolShellProps) {
  const relatedTools = allTools.filter((t) => t.href !== currentPath).slice(0, 4);

  return (
    <div className="min-h-screen bg-bg-page">
      {/* Tool header */}
      <div className="bg-bg-dark text-text-on-dark py-8 sm:py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-4">
            <Link href="/tools" className="hover:text-white transition-colors">
              Tools
            </Link>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-zinc-300">{title}</span>
          </nav>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl tracking-tight mb-2">
            {title}
          </h1>
          <p className="text-zinc-400 text-base sm:text-lg max-w-2xl">{description}</p>
        </div>
      </div>

      {/* Main content: side-by-side on desktop, stacked on mobile */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input panel — dark */}
          <div className="lg:col-span-4">
            <div className="dark-panel bg-bg-dark rounded-2xl p-6 shadow-lg sticky top-20">
              {inputs}
            </div>
          </div>

          {/* Results panel — light */}
          <div className="lg:col-span-8">
            <div className="bg-bg-card rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Explanation (collapsible for SEO) */}
      {explanation && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="bg-bg-card rounded-2xl border border-gray-100 p-6 sm:p-8">
            {explanation}
          </div>
        </div>
      )}

      {/* Related tools */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <h2 className="font-heading font-semibold text-lg text-text-primary mb-4">
          Related Tools
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {relatedTools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group bg-bg-card rounded-xl border border-gray-100 p-4 hover:border-brand/40 hover:shadow-md transition-all"
            >
              <div className="font-heading font-semibold text-sm text-text-primary group-hover:text-brand transition-colors">
                {tool.label}
              </div>
              <div className="text-xs text-text-muted mt-1">{tool.desc}</div>
            </Link>
          ))}
        </div>

        {/* Pro CTA */}
        <div className="mt-8 bg-gradient-to-r from-bg-dark to-zinc-900 rounded-2xl p-6 sm:p-8 text-white">
          <h3 className="font-heading font-bold text-xl mb-2">
            {proCta || "Want a personalised training plan?"}
          </h3>
          <p className="text-zinc-400 text-sm mb-5 max-w-lg">
            Get an AI-powered training plan built around your fitness level, goals, and schedule. Connect Strava for even smarter recommendations.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-brand hover:bg-brand-hover text-white font-heading font-semibold text-sm px-6 py-3 rounded-xl transition-colors"
          >
            Start Free Trial — £4.99/mo
          </Link>
        </div>
      </div>
    </div>
  );
}

