"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "@/components/ui/CalculatorShell";
import ResultCard from "@/components/ui/ResultCard";

type InputUnit = "minKm" | "minMile" | "kmh" | "mph" | "ms";

function toMetersPerSecond(value: number, unit: InputUnit): number {
  switch (unit) {
    case "minKm": return 1000 / (value * 60); // pace min/km → m/s
    case "minMile": return 1609.344 / (value * 60);
    case "kmh": return value / 3.6;
    case "mph": return value * 0.44704;
    case "ms": return value;
  }
}

function fromMetersPerSecond(ms: number, unit: InputUnit): number {
  switch (unit) {
    case "minKm": return 1000 / ms / 60;
    case "minMile": return 1609.344 / ms / 60;
    case "kmh": return ms * 3.6;
    case "mph": return ms / 0.44704;
    case "ms": return ms;
  }
}

function formatPace(decimalMinutes: number): string {
  const mins = Math.floor(decimalMinutes);
  const secs = Math.round((decimalMinutes - mins) * 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

const unitLabels: Record<InputUnit, string> = {
  minKm: "min/km",
  minMile: "min/mile",
  kmh: "km/h",
  mph: "mph",
  ms: "m/s",
};

export default function SpeedConverter() {
  const [inputValue, setInputValue] = useState(5);
  const [inputUnit, setInputUnit] = useState<InputUnit>("minKm");

  const conversions = useMemo(() => {
    if (inputValue <= 0) return null;
    const ms = toMetersPerSecond(inputValue, inputUnit);
    if (!isFinite(ms) || ms <= 0) return null;

    return {
      minKm: fromMetersPerSecond(ms, "minKm"),
      minMile: fromMetersPerSecond(ms, "minMile"),
      kmh: fromMetersPerSecond(ms, "kmh"),
      mph: fromMetersPerSecond(ms, "mph"),
      ms: fromMetersPerSecond(ms, "ms"),
    };
  }, [inputValue, inputUnit]);

  return (
    <CalculatorShell
      title="Speed / Pace Converter"
      description="Instantly convert between min/km, min/mile, km/h, mph and m/s. Type a value and see all conversions."
      currentPath="/calculators/speed-converter"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
          <input
            type="number"
            step={0.01}
            min={0}
            value={inputValue}
            onChange={(e) => setInputValue(Number(e.target.value) || 0)}
            className="w-full font-mono text-lg border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
          <select
            value={inputUnit}
            onChange={(e) => setInputUnit(e.target.value as InputUnit)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white"
          >
            {Object.entries(unitLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {conversions && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <ResultCard
            label="min/km"
            value={formatPace(conversions.minKm)}
            highlight={inputUnit === "minKm"}
          />
          <ResultCard
            label="min/mile"
            value={formatPace(conversions.minMile)}
            highlight={inputUnit === "minMile"}
          />
          <ResultCard
            label="km/h"
            value={conversions.kmh.toFixed(2)}
            highlight={inputUnit === "kmh"}
          />
          <ResultCard
            label="mph"
            value={conversions.mph.toFixed(2)}
            highlight={inputUnit === "mph"}
          />
          <ResultCard
            label="m/s"
            value={conversions.ms.toFixed(2)}
            highlight={inputUnit === "ms"}
          />
        </div>
      )}

      <div className="mt-10 border-t border-gray-100 pt-8">
        <h3 className="font-heading font-semibold text-lg mb-3">Pace vs Speed</h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          <strong>Pace</strong> (min/km or min/mile) tells you how long each unit of distance takes. <strong>Speed</strong> (km/h or mph) tells you how much distance you cover per hour. Runners typically use pace; treadmills typically display speed.
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">
          Quick reference: 5:00/km = 8:03/mile = 12.0 km/h = 7.46 mph
        </p>
      </div>
    </CalculatorShell>
  );
}

