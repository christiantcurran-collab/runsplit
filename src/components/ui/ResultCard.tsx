"use client";

import React from "react";

interface ResultCardProps {
  label: string;
  value: string;
  sublabel?: string;
  highlight?: boolean;
  large?: boolean;
}

export default function ResultCard({
  label,
  value,
  sublabel,
  highlight = false,
  large = false,
}: ResultCardProps) {
  return (
    <div
      className={`rounded-xl p-4 ${
        highlight
          ? "bg-brand-orange/10 border-2 border-brand-orange"
          : "bg-gray-50 border border-gray-200"
      }`}
    >
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </div>
      <div
        className={`time-display font-bold ${
          large ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl"
        } ${highlight ? "text-brand-orange" : "text-brand-black"}`}
      >
        {value}
      </div>
      {sublabel && (
        <div className="text-xs text-gray-400 mt-1">{sublabel}</div>
      )}
    </div>
  );
}

