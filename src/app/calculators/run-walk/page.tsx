"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "@/components/ui/CalculatorShell";
import DistanceSelect from "@/components/ui/DistanceSelect";
import ResultCard from "@/components/ui/ResultCard";
import {
  DISTANCES,
  type DistanceKey,
  calculateRunWalk,
  formatTimeFromSeconds,
} from "@/lib/running-math";

export default function RunWalkCalculator() {
  const [distanceKey, setDistanceKey] = useState<string>("5k");
  const [customMeters, setCustomMeters] = useState(5000);

  const [runPaceMin, setRunPaceMin] = useState(6);
  const [runPaceSec, setRunPaceSec] = useState(0);
  const [walkPaceMin, setWalkPaceMin] = useState(10);
  const [walkPaceSec, setWalkPaceSec] = useState(0);
  const [runInterval, setRunInterval] = useState(4);
  const [walkInterval, setWalkInterval] = useState(1);

  const distanceMeters = distanceKey === "custom" ? customMeters : DISTANCES[distanceKey as DistanceKey].meters;
  const runPaceSecsKm = (runPaceMin * 60) + runPaceSec;
  const walkPaceSecsKm = (walkPaceMin * 60) + walkPaceSec;

  const results = useMemo(() => {
    if (distanceMeters <= 0 || runPaceSecsKm <= 0 || walkPaceSecsKm <= 0 || runInterval <= 0 || walkInterval <= 0) return null;
    const result = calculateRunWalk(distanceMeters, runPaceSecsKm, walkPaceSecsKm, runInterval, walkInterval);
    return {
      totalTime: formatTimeFromSeconds(result.totalTimeSeconds),
      effectivePace: formatTimeFromSeconds(result.effectivePaceSecondsPerKm),
      intervals: result.intervals,
    };
  }, [distanceMeters, runPaceSecsKm, walkPaceSecsKm, runInterval, walkInterval]);

  return (
    <CalculatorShell
      title="Run/Walk Calculator"
      description="Calculate your total time using run/walk intervals. Perfect for Couch-to-5K and Galloway method runners."
      currentPath="/calculators/run-walk"
    >
      <div className="space-y-6 mb-8">
        <DistanceSelect
          label="Target Distance"
          value={distanceKey}
          onChange={(key, meters) => { setDistanceKey(key); if (key === "custom") setCustomMeters(meters); }}
          customMeters={customMeters}
          onCustomChange={setCustomMeters}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Run Pace (per km)</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={30}
                value={runPaceMin}
                onChange={(e) => setRunPaceMin(Number(e.target.value) || 0)}
                className="w-20 text-center font-mono text-lg border border-gray-300 rounded-lg px-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
              />
              <span className="text-gray-400 font-mono text-xl font-bold">:</span>
              <input
                type="number"
                min={0}
                max={59}
                value={runPaceSec}
                onChange={(e) => setRunPaceSec(Number(e.target.value) || 0)}
                className="w-20 text-center font-mono text-lg border border-gray-300 rounded-lg px-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
              />
              <span className="text-sm text-gray-500 ml-2">/km</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Walk Pace (per km)</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={30}
                value={walkPaceMin}
                onChange={(e) => setWalkPaceMin(Number(e.target.value) || 0)}
                className="w-20 text-center font-mono text-lg border border-gray-300 rounded-lg px-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
              />
              <span className="text-gray-400 font-mono text-xl font-bold">:</span>
              <input
                type="number"
                min={0}
                max={59}
                value={walkPaceSec}
                onChange={(e) => setWalkPaceSec(Number(e.target.value) || 0)}
                className="w-20 text-center font-mono text-lg border border-gray-300 rounded-lg px-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
              />
              <span className="text-sm text-gray-500 ml-2">/km</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Run Interval (minutes)</label>
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={runInterval}
              onChange={(e) => setRunInterval(Number(e.target.value) || 1)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Walk Interval (minutes)</label>
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={walkInterval}
              onChange={(e) => setWalkInterval(Number(e.target.value) || 1)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {results && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <ResultCard label="Estimated Total Time" value={results.totalTime} highlight large />
          <ResultCard label="Effective Pace" value={`${results.effectivePace}/km`} sublabel="Average pace including walks" />
          <ResultCard label="Run/Walk Cycles" value={`${results.intervals}`} sublabel={`${runInterval}min run / ${walkInterval}min walk`} />
        </div>
      )}

      <div className="mt-10 border-t border-gray-100 pt-8">
        <h3 className="font-heading font-semibold text-lg mb-3">The Run/Walk Method</h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          The run/walk method (popularised by Jeff Galloway) alternates running intervals with walking breaks. This reduces impact stress, delays fatigue, and often leads to faster overall times than continuous running for newer runners.
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">
          Common ratios include 4:1 (run 4 min, walk 1 min), 3:1, or even 1:1 for complete beginners. Many marathon runners successfully use run/walk strategies to complete their first marathon.
        </p>
      </div>
    </CalculatorShell>
  );
}








