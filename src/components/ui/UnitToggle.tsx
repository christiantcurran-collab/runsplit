"use client";

import React from "react";

interface UnitToggleProps {
  value: "km" | "mile";
  onChange: (unit: "km" | "mile") => void;
  dark?: boolean;
}

export default function UnitToggle({ value, onChange, dark = false }: UnitToggleProps) {
  return (
    <div
      className={`inline-flex rounded-lg p-0.5 ${
        dark ? "bg-white/[0.08]" : "bg-bg-subtle"
      }`}
    >
      <button
        onClick={() => onChange("km")}
        className={`px-3.5 py-1.5 rounded-md text-sm font-semibold transition-all ${
          value === "km"
            ? "bg-brand text-white shadow-sm"
            : dark
            ? "text-white/60 hover:text-white"
            : "text-text-secondary hover:text-text-primary"
        }`}
      >
        km
      </button>
      <button
        onClick={() => onChange("mile")}
        className={`px-3.5 py-1.5 rounded-md text-sm font-semibold transition-all ${
          value === "mile"
            ? "bg-brand text-white shadow-sm"
            : dark
            ? "text-white/60 hover:text-white"
            : "text-text-secondary hover:text-text-primary"
        }`}
      >
        mile
      </button>
    </div>
  );
}
