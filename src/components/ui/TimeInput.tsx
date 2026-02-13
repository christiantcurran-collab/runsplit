"use client";

import React from "react";

interface TimeInputProps {
  label: string;
  hours: number;
  minutes: number;
  seconds: number;
  onChange: (h: number, m: number, s: number) => void;
  showHours?: boolean;
}

export default function TimeInput({
  label,
  hours,
  minutes,
  seconds,
  onChange,
  showHours = true,
}: TimeInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex items-center gap-1">
        {showHours && (
          <>
            <input
              type="number"
              min={0}
              max={99}
              value={hours}
              onChange={(e) => onChange(Number(e.target.value) || 0, minutes, seconds)}
              className="w-16 sm:w-20 text-center font-mono text-lg border border-gray-300 rounded-lg px-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
              placeholder="HH"
            />
            <span className="text-gray-400 font-mono text-xl font-bold">:</span>
          </>
        )}
        <input
          type="number"
          min={0}
          max={59}
          value={minutes}
          onChange={(e) => onChange(hours, Number(e.target.value) || 0, seconds)}
          className="w-16 sm:w-20 text-center font-mono text-lg border border-gray-300 rounded-lg px-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
          placeholder="MM"
        />
        <span className="text-gray-400 font-mono text-xl font-bold">:</span>
        <input
          type="number"
          min={0}
          max={59}
          value={seconds}
          onChange={(e) => onChange(hours, minutes, Number(e.target.value) || 0)}
          className="w-16 sm:w-20 text-center font-mono text-lg border border-gray-300 rounded-lg px-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
          placeholder="SS"
        />
      </div>
    </div>
  );
}

