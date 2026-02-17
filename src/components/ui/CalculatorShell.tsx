"use client";

import Link from "next/link";
import React from "react";

const allCalculators = [
  { href: "/calculators/pace", label: "Pace Calculator", desc: "Distance + Time = Pace" },
  { href: "/calculators/race-predictor", label: "Race Predictor", desc: "Predict any race time" },
  { href: "/calculators/splits", label: "Split Calculator", desc: "Plan your race splits" },
  { href: "/calculators/training-paces", label: "Training Paces", desc: "Your training zones" },
  { href: "/calculators/speed-converter", label: "Speed Converter", desc: "Convert pace & speed" },
  { href: "/calculators/age-grade", label: "Age Grade", desc: "Age-graded performance" },
  { href: "/calculators/vo2max", label: "VO2max Estimator", desc: "Estimate your VO2max" },
  { href: "/calculators/heart-rate-zones", label: "HR Zones", desc: "Heart rate training zones" },
  { href: "/calculators/calories", label: "Calories", desc: "Calories burned running" },
  { href: "/calculators/treadmill", label: "Treadmill", desc: "Treadmill ↔ outdoor pace" },
  { href: "/calculators/negative-split", label: "Negative Split", desc: "Negative split planner" },
  { href: "/calculators/run-walk", label: "Run/Walk", desc: "Run/walk intervals" },
];

interface CalculatorShellProps {
  title: string;
  description: string;
  currentPath: string;
  children: React.ReactNode;
}

export default function CalculatorShell({
  title,
  description,
  currentPath,
  children,
}: CalculatorShellProps) {
  const relatedCalculators = allCalculators.filter((c) => c.href !== currentPath).slice(0, 6);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero header */}
      <div className="bg-brand-black text-white py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/calculators" className="hover:text-white transition-colors">
              Calculators
            </Link>
            <span>/</span>
            <span className="text-gray-200">{title}</span>
          </nav>
          <h1 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl mb-3">
            {title}
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">{description}</p>
        </div>
      </div>

      {/* Calculator content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
          {children}
        </div>
      </div>

      {/* Related calculators */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="font-heading font-semibold text-xl mb-6 text-gray-800">
          Related Calculators
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {relatedCalculators.map((calc) => (
            <Link
              key={calc.href}
              href={calc.href}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:border-brand-orange hover:shadow-md transition-all group"
            >
              <div className="font-heading font-semibold text-sm text-gray-900 group-hover:text-brand-orange transition-colors">
                {calc.label}
              </div>
              <div className="text-xs text-gray-500 mt-1">{calc.desc}</div>
            </Link>
          ))}
        </div>

        {/* Pro CTA */}
        <div className="mt-10 bg-gradient-to-r from-brand-black to-gray-900 rounded-2xl p-6 sm:p-8 text-white">
          <h3 className="font-heading font-bold text-xl mb-2">
            Want a personalised training plan?
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            Get an AI-powered training plan built around your fitness level, goals, and schedule.
            Plus race-day pacing strategy and more.
          </p>
          <Link
            href="/pricing"
            className="inline-block bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold text-sm px-6 py-3 rounded-lg transition-colors"
          >
            Get RunSplit Pro — £4.99/mo
          </Link>
        </div>
      </div>
    </div>
  );
}








