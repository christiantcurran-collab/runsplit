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
}

export default function DistanceSelect({
  label,
  value,
  onChange,
  showCustom = true,
  customMeters = 10000,
  onCustomChange,
}: DistanceSelectProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
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
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white"
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
            min={0}
            step={100}
            value={customMeters}
            onChange={(e) => onCustomChange?.(Number(e.target.value) || 0)}
            className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
          />
          <span className="text-sm text-gray-500">meters</span>
        </div>
      )}
    </div>
  );
}

