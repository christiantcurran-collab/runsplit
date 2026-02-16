"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "@/components/ui/CalculatorShell";
import TimeInput from "@/components/ui/TimeInput";
import DistanceSelect from "@/components/ui/DistanceSelect";
import UnitToggle from "@/components/ui/UnitToggle";
import {
  DISTANCES,
  type DistanceKey,
  timeToSeconds,
  calculateEvenSplits,
  calculateNegativeSplits,
} from "@/lib/running-math";

export default function SplitCalculator() {
  const [distanceKey, setDistanceKey] = useState<string>("marathon");
  const [customMeters, setCustomMeters] = useState(42195);
  const [hours, setHours] = useState(3);
  const [minutes, setMinutes] = useState(30);
  const [seconds, setSeconds] = useState(0);
  const [unit, setUnit] = useState<"km" | "mile">("km");
  const [strategy, setStrategy] = useState<"even" | "negative">("even");
  const [negativePct, setNegativePct] = useState(3);

  const distanceMeters = distanceKey === "custom" ? customMeters : DISTANCES[distanceKey as DistanceKey].meters;
  const totalSeconds = timeToSeconds({ hours, minutes, seconds });
  const splitDistance = unit === "km" ? 1000 : 1609.344;

  const splits = useMemo(() => {
    if (totalSeconds <= 0 || distanceMeters <= 0) return [];
    if (strategy === "even") {
      return calculateEvenSplits(distanceMeters, totalSeconds, splitDistance, unit);
    }
    return calculateNegativeSplits(distanceMeters, totalSeconds, splitDistance, negativePct, unit);
  }, [totalSeconds, distanceMeters, splitDistance, unit, strategy, negativePct]);

  const halfIndex = Math.ceil(splits.length / 2);

  return (
    <CalculatorShell
      title="Split Time Calculator"
      description="Plan your race splits with even or negative split strategies. Get a detailed pacing table for any distance."
      currentPath="/calculators/splits"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Strategy</label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as "even" | "negative")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white"
            >
              <option value="even">Even Splits</option>
              <option value="negative">Negative Splits</option>
            </select>
          </div>
          {strategy === "negative" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Negative Split %
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={negativePct}
                onChange={(e) => setNegativePct(Number(e.target.value) || 3)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
              />
            </div>
          )}
          <div className="flex items-end">
            <UnitToggle value={unit} onChange={setUnit} />
          </div>
        </div>
      </div>

      {splits.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 px-3 font-medium text-gray-600">#</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">Distance</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">Split Time</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">Cumulative</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">Pace</th>
              </tr>
            </thead>
            <tbody>
              {splits.map((split, idx) => (
                <tr
                  key={split.number}
                  className={`border-b border-gray-100 ${
                    idx + 1 === halfIndex
                      ? "bg-brand-orange/5 border-brand-orange/20"
                      : "hover:bg-gray-50"
                  }`}
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
          {halfIndex > 0 && (
            <p className="text-xs text-brand-orange mt-2">
              ↑ Highlighted row = halfway point
            </p>
          )}
        </div>
      )}

      <div className="mt-10 border-t border-gray-100 pt-8">
        <h3 className="font-heading font-semibold text-lg mb-3">About Split Strategies</h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          <strong>Even splits</strong> mean running every kilometre or mile at the same pace. This is the simplest strategy and often the most effective for beginners.
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">
          <strong>Negative splits</strong> mean running the second half of the race faster than the first. A 3% negative split means your second-half pace is 3% quicker. Most marathon world records have been run with negative or near-even splits.
        </p>
      </div>
    </CalculatorShell>
  );
}




