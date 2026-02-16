"use client";

import { useState, useMemo } from "react";
import ToolShell from "@/components/ui/ToolShell";
import DistanceSelect from "@/components/ui/DistanceSelect";
import ResultCard from "@/components/ui/ResultCard";
import RaceTime from "@/components/ui/RaceTime";
import {
  DISTANCES, type DistanceKey, calculateRunWalk,
  formatTimeFromSeconds, convertPace,
} from "@/lib/running-math";

export default function RunWalkTool() {
  const [distanceKey, setDistanceKey] = useState<string>("halfMarathon");
  const [customMeters, setCustomMeters] = useState(21097);
  const [runPaceMin, setRunPaceMin] = useState(6);
  const [runPaceSec, setRunPaceSec] = useState(0);
  const [walkPaceMin, setWalkPaceMin] = useState(9);
  const [walkPaceSec, setWalkPaceSec] = useState(0);
  const [runInterval, setRunInterval] = useState(4);
  const [walkInterval, setWalkInterval] = useState(1);

  const distanceMeters = distanceKey === "custom" ? customMeters : DISTANCES[distanceKey as DistanceKey].meters;
  const runPace = runPaceMin * 60 + runPaceSec;
  const walkPace = walkPaceMin * 60 + walkPaceSec;

  const results = useMemo(() => {
    if (distanceMeters <= 0 || runPace <= 0 || walkPace <= 0 || runInterval <= 0 || walkInterval <= 0) return null;
    const { totalTimeSeconds, effectivePaceSecondsPerKm, intervals } = calculateRunWalk(distanceMeters, runPace, walkPace, runInterval, walkInterval);
    return {
      totalTime: formatTimeFromSeconds(totalTimeSeconds),
      effectivePace: formatTimeFromSeconds(effectivePaceSecondsPerKm),
      effectivePaceMile: formatTimeFromSeconds(convertPace(effectivePaceSecondsPerKm, "km", "mile")),
      intervals,
    };
  }, [distanceMeters, runPace, walkPace, runInterval, walkInterval]);

  const inputs = (
    <div className="space-y-5">
      <DistanceSelect label="Race Distance" value={distanceKey} onChange={(key, meters) => { setDistanceKey(key); if (key === "custom") setCustomMeters(meters); }} customMeters={customMeters} onCustomChange={setCustomMeters} dark />

      <div>
        <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Run Pace (min/km)</label>
        <div className="flex items-center gap-1.5">
          <input type="number" inputMode="numeric" min={2} max={15} value={runPaceMin} onChange={(e) => setRunPaceMin(Number(e.target.value) || 0)}
            className="w-16 h-12 text-center font-mono text-xl bg-white/[0.08] border border-white/[0.12] text-white rounded-lg focus:outline-none focus:border-brand focus:shadow-glow transition-all" />
          <span className="font-mono text-2xl font-bold text-white/30">:</span>
          <input type="number" inputMode="numeric" min={0} max={59} value={runPaceSec} onChange={(e) => setRunPaceSec(Math.min(59, Number(e.target.value) || 0))}
            className="w-16 h-12 text-center font-mono text-xl bg-white/[0.08] border border-white/[0.12] text-white rounded-lg focus:outline-none focus:border-brand focus:shadow-glow transition-all" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Walk Pace (min/km)</label>
        <div className="flex items-center gap-1.5">
          <input type="number" inputMode="numeric" min={5} max={20} value={walkPaceMin} onChange={(e) => setWalkPaceMin(Number(e.target.value) || 0)}
            className="w-16 h-12 text-center font-mono text-xl bg-white/[0.08] border border-white/[0.12] text-white rounded-lg focus:outline-none focus:border-brand focus:shadow-glow transition-all" />
          <span className="font-mono text-2xl font-bold text-white/30">:</span>
          <input type="number" inputMode="numeric" min={0} max={59} value={walkPaceSec} onChange={(e) => setWalkPaceSec(Math.min(59, Number(e.target.value) || 0))}
            className="w-16 h-12 text-center font-mono text-xl bg-white/[0.08] border border-white/[0.12] text-white rounded-lg focus:outline-none focus:border-brand focus:shadow-glow transition-all" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Run (min)</label>
          <input type="number" inputMode="numeric" min={1} max={30} value={runInterval} onChange={(e) => setRunInterval(Number(e.target.value) || 1)}
            className="w-full h-12 text-center font-mono text-xl bg-white/[0.08] border border-white/[0.12] text-white rounded-lg focus:outline-none focus:border-brand focus:shadow-glow transition-all" />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Walk (min)</label>
          <input type="number" inputMode="numeric" min={0.5} max={10} step={0.5} value={walkInterval} onChange={(e) => setWalkInterval(Number(e.target.value) || 1)}
            className="w-full h-12 text-center font-mono text-xl bg-white/[0.08] border border-white/[0.12] text-white rounded-lg focus:outline-none focus:border-brand focus:shadow-glow transition-all" />
        </div>
      </div>
    </div>
  );

  return (
    <ToolShell title="Run/Walk Planner" description="Plan run/walk intervals for any distance. Calculate your finish time with the Galloway method." currentPath="/tools/run-walk" inputs={inputs}>
      {results ? (
        <>
          <div className="text-center mb-6">
            <RaceTime value={results.totalTime} size="xl" label="Estimated Finish Time" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <ResultCard label="Finish Time" value={results.totalTime} highlight large />
            <ResultCard label="Effective Pace" value={`${results.effectivePace}/km`} sublabel={`${results.effectivePaceMile}/mi`} delay={0.05} />
            <ResultCard label="Total Intervals" value={`${results.intervals}`} sublabel={`${runInterval}:${walkInterval} run:walk`} delay={0.1} />
          </div>

          <div className="mt-6 text-sm text-text-secondary">
            <h3 className="font-heading font-semibold text-text-primary mb-2">The Galloway Method</h3>
            <p className="leading-relaxed">Run/walk intervals are a proven method for completing longer distances. By taking planned walk breaks, you reduce fatigue and muscle damage while maintaining a strong overall pace. Many runners find they finish faster with run/walk than running continuously.</p>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-text-muted">
          <p className="text-lg">Enter your details to plan intervals</p>
        </div>
      )}
    </ToolShell>
  );
}





