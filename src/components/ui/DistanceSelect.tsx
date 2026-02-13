"use client";

import React from "react";
import { DISTANCES, type DistanceKey } from "@/lib/running-math";

interface DistanceSelectProps {
  label: string;
  value: string;
  onChange: (key: string, meters: number) => void;
  showCustom?: boolean;
  customMeters?: number;
  onCustomChange?: (meters: number) => void;
  dark?: boolean;
  compact?: boolean;
}

const QUICK_DISTANCES: { key: string; label: string }[] = [
  { key: "5k", label: "5K" },
  { key: "10k", label: "10K" },
  { key: "half_marathon", label: "Half" },
  { key: "marathon", label: "Marathon" },
];

export default function DistanceSelect({
  label,
  value,
  onChange,
  showCustom = true,
  customMeters = 10000,
  onCustomChange,
  dark = false,
  compact = false,
}: DistanceSelectProps) {
  const labelClasses = dark
    ? "block font-mono text-[10px] uppercase tracking-[2px] text-text-dark-muted mb-2.5"
    : "block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2";

  if (compact) {
    return (
      <div>
        <label className={labelClasses}>{label}</label>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_DISTANCES.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => onChange(d.key, DISTANCES[d.key as DistanceKey].meters)}
              className={`px-3.5 py-[7px] rounded-md text-[13px] font-semibold transition-all ${
                value === d.key
                  ? "bg-brand text-white"
                  : dark
                  ? "bg-transparent text-text-dark-sec border border-bg-dark-border hover:border-text-dark-sec"
                  : "bg-bg-subtle text-text-secondary border border-transparent hover:border-gray-300"
              }`}
            >
              {d.label}
            </button>
          ))}
          {showCustom && (
            <button
              type="button"
              onClick={() => onChange("custom", customMeters)}
              className={`px-3.5 py-[7px] rounded-md text-[13px] font-semibold transition-all ${
                value === "custom"
                  ? "bg-brand text-white"
                  : dark
                  ? "bg-transparent text-text-dark-sec border border-bg-dark-border hover:border-text-dark-sec"
                  : "bg-bg-subtle text-text-secondary border border-transparent hover:border-gray-300"
              }`}
            >
              Custom
            </button>
          )}
        </div>
        {value === "custom" && showCustom && (
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={100}
              value={customMeters}
              onChange={(e) => {
                const m = Number(e.target.value) || 0;
                onCustomChange?.(m);
                onChange("custom", m);
              }}
              className={`w-28 h-10 text-center font-mono text-sm rounded-lg ${
                dark
                  ? "bg-bg-dark-input border border-bg-dark-border text-text-on-dark focus:border-brand focus:shadow-glow"
                  : "bg-bg-subtle border border-transparent text-text-primary focus:ring-2 focus:ring-brand/30"
              } focus:outline-none transition-all`}
            />
            <span className={dark ? "text-xs text-text-dark-muted" : "text-xs text-text-secondary"}>
              meters
            </span>
          </div>
        )}
      </div>
    );
  }

  const selectClasses = dark
    ? "w-full h-12 bg-bg-dark-input border border-bg-dark-border text-text-on-dark font-body text-sm rounded-lg px-3 focus:outline-none focus:border-brand focus:shadow-glow transition-all appearance-none cursor-pointer"
    : "w-full h-12 bg-bg-subtle border border-transparent text-text-primary font-body text-sm rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all appearance-none cursor-pointer";

  return (
    <div>
      <label className={labelClasses}>{label}</label>
      <select
        value={value}
        onChange={(e) => {
          const key = e.target.value;
          if (key === "custom") {
            onChange(key, customMeters);
          } else {
            onChange(key, DISTANCES[key as DistanceKey].meters);
          }
        }}
        className={selectClasses}
      >
        {Object.entries(DISTANCES).map(([key, dist]) => (
          <option key={key} value={key}>
            {dist.name}
          </option>
        ))}
        {showCustom && <option value="custom">Custom Distance</option>}
      </select>

      {value === "custom" && showCustom && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={100}
            value={customMeters}
            onChange={(e) => {
              const m = Number(e.target.value) || 0;
              onCustomChange?.(m);
              onChange("custom", m);
            }}
            className={`w-28 h-10 text-center font-mono text-sm rounded-lg ${
              dark
                ? "bg-bg-dark-input border border-bg-dark-border text-text-on-dark focus:border-brand focus:shadow-glow"
                : "bg-bg-subtle border border-transparent text-text-primary focus:ring-2 focus:ring-brand/30"
            } focus:outline-none transition-all`}
          />
          <span className={dark ? "text-xs text-text-dark-muted" : "text-xs text-text-secondary"}>
            meters
          </span>
        </div>
      )}
    </div>
  );
}
