"use client";

import React, { useRef } from "react";

interface TimeInputProps {
  label: string;
  hours: number;
  minutes: number;
  seconds: number;
  onChange: (h: number, m: number, s: number) => void;
  showHours?: boolean;
  dark?: boolean;
}

export default function TimeInput({
  label,
  hours,
  minutes,
  seconds,
  onChange,
  showHours = true,
  dark = false,
}: TimeInputProps) {
  const minRef = useRef<HTMLInputElement>(null);
  const secRef = useRef<HTMLInputElement>(null);

  const inputClasses = dark
    ? "bg-bg-dark-input border border-bg-dark-border text-text-on-dark font-mono text-xl text-center rounded-lg focus:outline-none focus:border-brand focus:shadow-glow transition-all"
    : "bg-bg-subtle border border-transparent text-text-primary font-mono text-xl text-center rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all";

  const labelClasses = dark
    ? "block font-mono text-[10px] uppercase tracking-[2px] text-text-dark-muted mb-2.5"
    : "block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2";

  const colonClasses = dark
    ? "font-mono text-2xl text-text-dark-muted"
    : "font-mono text-2xl font-bold text-text-muted";

  const handleHourChange = (val: string) => {
    const n = Math.min(99, Math.max(0, parseInt(val) || 0));
    onChange(n, minutes, seconds);
    if (val.length >= 2 && minRef.current) minRef.current.focus();
  };

  const handleMinChange = (val: string) => {
    const n = Math.min(59, Math.max(0, parseInt(val) || 0));
    onChange(hours, n, seconds);
    if (val.length >= 2 && secRef.current) secRef.current.focus();
  };

  const handleSecChange = (val: string) => {
    const n = Math.min(59, Math.max(0, parseInt(val) || 0));
    onChange(hours, minutes, n);
  };

  return (
    <div>
      <label className={labelClasses}>{label}</label>
      <div className="flex items-center gap-1">
        {showHours && (
          <>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={99}
              value={hours}
              onChange={(e) => handleHourChange(e.target.value)}
              className={`w-14 h-12 ${inputClasses}`}
              placeholder="HH"
            />
            <span className={colonClasses}>:</span>
          </>
        )}
        <input
          ref={minRef}
          type="number"
          inputMode="numeric"
          min={0}
          max={59}
          value={minutes}
          onChange={(e) => handleMinChange(e.target.value)}
          className={`w-14 h-12 ${inputClasses}`}
          placeholder="MM"
        />
        <span className={colonClasses}>:</span>
        <input
          ref={secRef}
          type="number"
          inputMode="numeric"
          min={0}
          max={59}
          value={seconds}
          onChange={(e) => handleSecChange(e.target.value)}
          className={`w-14 h-12 ${inputClasses}`}
          placeholder="SS"
        />
      </div>
    </div>
  );
}
