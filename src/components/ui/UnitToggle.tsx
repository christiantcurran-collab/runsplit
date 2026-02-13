"use client";

import React from "react";

interface UnitToggleProps {
  value: "km" | "mile";
  onChange: (unit: "km" | "mile") => void;
  dark?: boolean;
}

export default function UnitToggle({ value, onChange, dark = false }: UnitToggleProps) {
  return (
    <div className="flex gap-1.5">
      <button
        onClick={() => onChange("km")}
        className={`px-3.5 py-[7px] rounded-md text-[13px] font-semibold transition-all ${
          value === "km"
            ? "bg-brand text-white"
            : dark
            ? "bg-transparent text-text-dark-sec border border-bg-dark-border"
            : "bg-bg-subtle text-text-secondary"
        }`}
      >
        per km
      </button>
      <button
        onClick={() => onChange("mile")}
        className={`px-3.5 py-[7px] rounded-md text-[13px] font-semibold transition-all ${
          value === "mile"
            ? "bg-brand text-white"
            : dark
            ? "bg-transparent text-text-dark-sec border border-bg-dark-border"
            : "bg-bg-subtle text-text-secondary"
        }`}
      >
        per mile
      </button>
    </div>
  );
}
