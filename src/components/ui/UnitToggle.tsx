"use client";

import React from "react";

interface UnitToggleProps {
  value: "km" | "mile";
  onChange: (unit: "km" | "mile") => void;
}

export default function UnitToggle({ value, onChange }: UnitToggleProps) {
  return (
    <div className="inline-flex rounded-lg bg-gray-100 p-1">
      <button
        onClick={() => onChange("km")}
        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
          value === "km"
            ? "bg-brand-orange text-white shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        km
      </button>
      <button
        onClick={() => onChange("mile")}
        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
          value === "mile"
            ? "bg-brand-orange text-white shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        mile
      </button>
    </div>
  );
}

