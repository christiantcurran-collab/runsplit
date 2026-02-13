"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "@/components/ui/CalculatorShell";
import TimeInput from "@/components/ui/TimeInput";
import DistanceSelect from "@/components/ui/DistanceSelect";
import UnitToggle from "@/components/ui/UnitToggle";
import ResultCard from "@/components/ui/ResultCard";
import {
  DISTANCES,
  type DistanceKey,
  timeToSeconds,
  calculateNegativeSplits,
  formatTimeFromSeconds,
} from "@/lib/running-math";

export default function NegativeSplitCalculator() {
  const [distanceKey, setDistanceKey] = useState<string>("marathon");
  const [customMeters, setCustomMeters] = useState(42195);
  const [hours, setHours] = useState(3);
  const [minutes, setMinutes] = useState(30);
  const [seconds, setSeconds] = useState(0);
  const [negativePct, setNegativePct] = useState(3);
  const [unit, setUnit] = useState<"km" | "mile">("km");

  const distanceMeters = distanceKey === "custom" ? customMeters : DISTANCES[distanceKey as DistanceKey].meters;
  const totalSeconds = timeToSeconds({ hours, minutes, seconds });
  const splitDistance = unit === "km" ? 1000 : 1609.344;

  const splits = useMemo(() => {
    if (totalSeconds <= 0 || distanceMeters <= 0) return [];
    return calculateNegativeSplits(distanceMeters, totalSeconds, splitDistance, negativePct, unit);
  }, [totalSeconds, distanceMeters, splitDistance, negativePct, unit]);

  const halfIndex = Math.ceil(splits.length / 2);
  const firstHalfSplits = splits.slice(0, halfIndex);

  // Sum first and second half times
  const firstHalfTime = firstHalfSplits.length > 0 ? firstHalfSplits[firstHalfSplits.length - 1]?.cumulativeTime : "--";
  const secondHalfTime = useMemo(() => {
    if (splits.length === 0) return "--";
    const lastFirstHalf = firstHalfSplits[firstHalfSplits.length - 1];
    if (!lastFirstHalf) return "--";
    return formatTimeFromSeconds(totalSeconds - parseCumulativeTime(lastFirstHalf.cumulativeTime));
  }, [splits, totalSeconds, firstHalfSplits]);

  return (
    <CalculatorShell
      title="Negative Split Planner"
      description="Plan a negative split race strategy. Run the second half faster than the first for a strong finish."
      currentPath="/calculators/negative-split"
    >
      <div className="space-y-6 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <DistanceSelect
            label="Race Distance"
            value={distanceKey}
            onChange={(key, meters) => { setDistanceKey(key); if (key === "custom") setCustomMeters(meters); }}
            customMeters={customMeters}
            onCustomChange={setCustomMeters}
          />
          <TimeInput
            label="Target Time"
            hours={hours}
            minutes={minutes}
            seconds={seconds}
            onChange={(h, m, s) => { setHours(h); setMinutes(m); setSeconds(s); }}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Negative Split (%)
            </label>
            <input
              type="range"
              min={1}
              max={8}
              step={0.5}
              value={negativePct}
              onChange={(e) => setNegativePct(Number(e.target.value))}
              className="w-full accent-brand-orange"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1%</span>
              <span className="font-semibold text-brand-orange">{negativePct}%</span>
              <span>8%</span>
            </div>
          </div>
          <div className="flex items-end">
            <UnitToggle value={unit} onChange={setUnit} />
          </div>
        </div>
      </div>

      {splits.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <ResultCard label="First Half" value={firstHalfTime ?? "--"} sublabel="Slower half" />
            <ResultCard label="Second Half" value={secondHalfTime ?? "--"} sublabel={`${negativePct}% faster`} highlight />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-600">#</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Distance</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Split</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Cumulative</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Pace</th>
                </tr>
              </thead>
              <tbody>
                {splits.map((split, idx) => (
                  <tr
                    key={split.number}
                    className={`border-b border-gray-100 ${
                      idx + 1 === halfIndex ? "bg-brand-orange/5 border-brand-orange/20" : "hover:bg-gray-50"
                    } ${idx >= halfIndex ? "bg-green-50/30" : ""}`}
                  >
                    <td className="py-2.5 px-3 text-gray-400">{split.number}</td>
                    <td className="py-2.5 px-3 font-medium">{split.distance}</td>
                    <td className="py-2.5 px-3 time-display">{split.splitTime}</td>
                    <td className="py-2.5 px-3 time-display font-semibold">{split.cumulativeTime}</td>
                    <td className="py-2.5 px-3 time-display text-gray-600">{split.pace}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="mt-10 border-t border-gray-100 pt-8">
        <h3 className="font-heading font-semibold text-lg mb-3">Why Run Negative Splits?</h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          A negative split means running the second half of a race faster than the first. This is considered the optimal race strategy because it prevents early fatigue from going out too fast and allows you to finish strong when others are fading.
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">
          A 2-3% negative split is typical for elite marathoners. The world record marathon has often been run with near-even or slightly negative splits. For most runners, aiming for 2-5% faster in the second half is a good target.
        </p>
      </div>
    </CalculatorShell>
  );
}

// Helper to parse "H:MM:SS" or "MM:SS" back to seconds
function parseCumulativeTime(timeStr: string): number {
  const parts = timeStr.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

