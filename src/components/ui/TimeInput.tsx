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
  const hourRef = useRef<HTMLInputElement>(null);
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
    // Allow empty string
    if (val === "") {
      onChange(0, minutes, seconds);
      return;
    }
    const n = Math.min(99, Math.max(0, parseInt(val) || 0));
    onChange(n, minutes, seconds);
    // Auto-advance to minutes if 2 digits entered
    if (val.length >= 2 && minRef.current) {
      minRef.current.focus();
      minRef.current.select();
    }
  };

  const handleMinChange = (val: string) => {
    if (val === "") {
      onChange(hours, 0, seconds);
      return;
    }
    const n = Math.min(59, Math.max(0, parseInt(val) || 0));
    onChange(hours, n, seconds);
    // Auto-advance to seconds if 2 digits entered
    if (val.length >= 2 && secRef.current) {
      secRef.current.focus();
      secRef.current.select();
    }
  };

  const handleSecChange = (val: string) => {
    if (val === "") {
      onChange(hours, minutes, 0);
      return;
    }
    const n = Math.min(59, Math.max(0, parseInt(val) || 0));
    onChange(hours, minutes, n);
  };

  // Format value for display - show placeholder if 0, otherwise show number without leading zero
  const formatValue = (value: number) => {
    return value === 0 ? "" : String(value);
  };

  return (
    <div>
      <label className={labelClasses}>{label}</label>
      <div className="flex items-center gap-1">
        {showHours && (
          <>
            <input
              ref={hourRef}
              type="text"
              inputMode="numeric"
              value={formatValue(hours)}
              onChange={(e) => handleHourChange(e.target.value.replace(/\D/g, ""))}
              onFocus={(e) => e.target.select()}
              className={`w-14 h-12 ${inputClasses}`}
              placeholder="h"
              maxLength={2}
            />
            <span className={colonClasses}>:</span>
          </>
        )}
        <input
          ref={minRef}
          type="text"
          inputMode="numeric"
          value={formatValue(minutes)}
          onChange={(e) => handleMinChange(e.target.value.replace(/\D/g, ""))}
          onFocus={(e) => e.target.select()}
          className={`w-14 h-12 ${inputClasses}`}
          placeholder="m"
          maxLength={2}
        />
        <span className={colonClasses}>:</span>
        <input
          ref={secRef}
          type="text"
          inputMode="numeric"
          value={formatValue(seconds)}
          onChange={(e) => handleSecChange(e.target.value.replace(/\D/g, ""))}
          onFocus={(e) => e.target.select()}
          className={`w-14 h-12 ${inputClasses}`}
          placeholder="s"
          maxLength={2}
        />
      </div>
    </div>
  );
}
