"use client";

import { useState, useMemo } from "react";
import ToolShell from "@/components/ui/ToolShell";
import ResultCard from "@/components/ui/ResultCard";

type InputUnit = "minKm" | "minMile" | "kmh" | "mph" | "ms";

function toMetersPerSecond(value: number, unit: InputUnit): number {
  switch (unit) {
    case "minKm": return 1000 / (value * 60);
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

function formatPace(decMin: number): string {
  const m = Math.floor(decMin);
  const s = Math.round((decMin - m) * 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

const unitLabels: Record<InputUnit, string> = {
  minKm: "min/km", minMile: "min/mile", kmh: "km/h", mph: "mph", ms: "m/s",
};

export default function ConvertTool() {
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

  const inputs = (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Value</label>
        <input
          type="number"
          inputMode="decimal"
          step={0.01}
          min={0}
          value={inputValue}
          onChange={(e) => setInputValue(Number(e.target.value) || 0)}
          className="w-full h-12 text-center font-mono text-xl bg-white/[0.08] border border-white/[0.12] text-white rounded-lg focus:outline-none focus:border-brand focus:shadow-glow transition-all"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Unit</label>
        <select
          value={inputUnit}
          onChange={(e) => setInputUnit(e.target.value as InputUnit)}
          className="w-full h-12 bg-white/[0.08] border border-white/[0.12] text-white text-sm rounded-lg px-3 focus:outline-none focus:border-brand focus:shadow-glow transition-all appearance-none cursor-pointer"
        >
          {Object.entries(unitLabels).map(([key, label]) => (
            <option key={key} value={key} className="bg-zinc-900 text-white">{label}</option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <ToolShell title="Pace Converter" description="Convert between min/km, min/mile, km/h, mph and m/s instantly." currentPath="/tools/convert" inputs={inputs}>
      {conversions ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <ResultCard label="min/km" value={formatPace(conversions.minKm)} highlight={inputUnit === "minKm"} />
          <ResultCard label="min/mile" value={formatPace(conversions.minMile)} highlight={inputUnit === "minMile"} delay={0.05} />
          <ResultCard label="km/h" value={conversions.kmh.toFixed(2)} highlight={inputUnit === "kmh"} delay={0.1} />
          <ResultCard label="mph" value={conversions.mph.toFixed(2)} highlight={inputUnit === "mph"} delay={0.15} />
          <ResultCard label="m/s" value={conversions.ms.toFixed(2)} highlight={inputUnit === "ms"} delay={0.2} />
        </div>
      ) : (
        <div className="text-center py-12 text-text-muted">
          <p className="text-lg">Enter a value to convert</p>
        </div>
      )}
    </ToolShell>
  );
}
