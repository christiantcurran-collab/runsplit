"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "@/components/ui/CalculatorShell";
import ResultCard from "@/components/ui/ResultCard";
import { treadmillToOutdoorPace, speedToPace } from "@/lib/running-math";

function formatPaceFromSec(secs: number): string {
  if (secs <= 0 || !isFinite(secs)) return "--:--";
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function TreadmillCalculator() {
  const [speedUnit, setSpeedUnit] = useState<"kmh" | "mph">("kmh");
  const [speed, setSpeed] = useState(10);
  const [incline, setIncline] = useState(1);

  const results = useMemo(() => {
    if (speed <= 0) return null;

    const speedKmh = speedUnit === "mph" ? speed * 1.60934 : speed;
    const treadmillPaceKm = speedToPace(speedKmh); // sec/km
    const outdoorPaceKm = treadmillToOutdoorPace(treadmillPaceKm, incline);
    const outdoorPaceMile = outdoorPaceKm * 1.609344;

    return {
      treadmillPaceKm: formatPaceFromSec(treadmillPaceKm),
      treadmillPaceMile: formatPaceFromSec(treadmillPaceKm * 1.609344),
      outdoorPaceKm: formatPaceFromSec(outdoorPaceKm),
      outdoorPaceMile: formatPaceFromSec(outdoorPaceMile),
      speedKmh: speedKmh.toFixed(1),
      speedMph: (speedKmh / 1.60934).toFixed(1),
    };
  }, [speed, speedUnit, incline]);

  // Reference table
  const refSpeeds = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

  return (
    <CalculatorShell
      title="Treadmill Pace Converter"
      description="Convert treadmill speed and incline to equivalent outdoor running pace. See what your treadmill workout really means."
      currentPath="/calculators/treadmill"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Treadmill Speed</label>
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value) || 0)}
              className="flex-1 font-mono text-lg border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
            />
            <select
              value={speedUnit}
              onChange={(e) => setSpeedUnit(e.target.value as "kmh" | "mph")}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white"
            >
              <option value="kmh">km/h</option>
              <option value="mph">mph</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Incline (%)</label>
          <input
            type="number"
            min={0}
            max={15}
            step={0.5}
            value={incline}
            onChange={(e) => setIncline(Number(e.target.value) || 0)}
            className="w-full font-mono text-lg border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
          />
        </div>
      </div>

      {results && (
        <>
          <h2 className="font-heading font-semibold text-lg text-gray-900 mb-4">Equivalent Outdoor Pace</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <ResultCard label="Treadmill (min/km)" value={results.treadmillPaceKm} />
            <ResultCard label="Treadmill (min/mi)" value={results.treadmillPaceMile} />
            <ResultCard label="Outdoor (min/km)" value={results.outdoorPaceKm} highlight />
            <ResultCard label="Outdoor (min/mi)" value={results.outdoorPaceMile} highlight />
          </div>
        </>
      )}

      {/* Reference table */}
      <h3 className="font-heading font-semibold text-lg text-gray-900 mb-4">Quick Reference</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 px-2 font-medium text-gray-600">Speed (km/h)</th>
              <th className="text-left py-2 px-2 font-medium text-gray-600">Pace (min/km)</th>
              <th className="text-left py-2 px-2 font-medium text-gray-600">@ 0%</th>
              <th className="text-left py-2 px-2 font-medium text-gray-600">@ 1%</th>
              <th className="text-left py-2 px-2 font-medium text-gray-600">@ 2%</th>
            </tr>
          </thead>
          <tbody>
            {refSpeeds.map((spd) => {
              const pace = speedToPace(spd);
              return (
                <tr key={spd} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-2 font-medium">{spd}</td>
                  <td className="py-2 px-2 time-display">{formatPaceFromSec(pace)}</td>
                  <td className="py-2 px-2 time-display">{formatPaceFromSec(treadmillToOutdoorPace(pace, 0))}</td>
                  <td className="py-2 px-2 time-display">{formatPaceFromSec(treadmillToOutdoorPace(pace, 1))}</td>
                  <td className="py-2 px-2 time-display">{formatPaceFromSec(treadmillToOutdoorPace(pace, 2))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-10 border-t border-gray-100 pt-8">
        <h3 className="font-heading font-semibold text-lg mb-3">Treadmill vs Outdoor Running</h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          Treadmill running at 0% incline is slightly easier than outdoor running due to the absence of wind resistance and the belt assisting with leg turnover. A <strong>1% incline</strong> is commonly recommended to simulate flat outdoor conditions.
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">
          Each additional percent of incline adds roughly 4-5 seconds per km of effort equivalent, based on the Jones &amp; Doust (1996) research on energy cost of treadmill running at various gradients.
        </p>
      </div>
    </CalculatorShell>
  );
}

