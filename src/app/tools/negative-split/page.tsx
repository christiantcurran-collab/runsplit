"use client";

import { useState, useMemo } from "react";
import ToolShell from "@/components/ui/ToolShell";
import TimeInput from "@/components/ui/TimeInput";
import DistanceSelect from "@/components/ui/DistanceSelect";
import UnitToggle from "@/components/ui/UnitToggle";
import RaceTime from "@/components/ui/RaceTime";
import {
  DISTANCES, type DistanceKey, timeToSeconds,
  calculateNegativeSplits,
} from "@/lib/running-math";

export default function NegativeSplitTool() {
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
    if (totalSeconds <= 0 || distanceMeters <= 0 || negativePct <= 0) return [];
    return calculateNegativeSplits(distanceMeters, totalSeconds, splitDistance, negativePct, unit);
  }, [totalSeconds, distanceMeters, splitDistance, negativePct, unit]);

  const halfIndex = Math.ceil(splits.length / 2);

  const inputs = (
    <div className="space-y-5">
      <DistanceSelect label="Race Distance" value={distanceKey} onChange={(key, meters) => { setDistanceKey(key); if (key === "custom") setCustomMeters(meters); }} customMeters={customMeters} onCustomChange={setCustomMeters} dark />
      <TimeInput label="Target Time" hours={hours} minutes={minutes} seconds={seconds} onChange={(h, m, s) => { setHours(h); setMinutes(m); setSeconds(s); }} dark />
      <div>
        <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Negative Split %</label>
        <input type="number" inputMode="decimal" min={1} max={10} step={0.5} value={negativePct} onChange={(e) => setNegativePct(Number(e.target.value) || 3)}
          className="w-full h-12 text-center font-mono text-xl bg-white/[0.08] border border-white/[0.12] text-white rounded-lg focus:outline-none focus:border-brand focus:shadow-glow transition-all" />
        <p className="text-xs text-text-muted mt-1">Second half {negativePct}% faster than first half</p>
      </div>
      <UnitToggle value={unit} onChange={setUnit} dark />
    </div>
  );

  return (
    <ToolShell title="Negative Split Strategy" description="Plan a negative split race strategy. Start controlled, finish strong." currentPath="/tools/negative-split" inputs={inputs}>
      {splits.length > 0 ? (
        <>
          <div className="text-center mb-6">
            <RaceTime value={`${negativePct}% negative`} size="lg" label="Strategy" sublabel="Second half faster" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-xs font-medium text-text-muted uppercase tracking-wider">#</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-text-muted uppercase tracking-wider">Distance</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-text-muted uppercase tracking-wider">Split</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-text-muted uppercase tracking-wider">Cumulative</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-text-muted uppercase tracking-wider">Pace</th>
                </tr>
              </thead>
              <tbody>
                {splits.map((split, idx) => (
                  <tr key={split.number} className={`border-b border-gray-50 ${idx + 1 === halfIndex ? "bg-brand/5" : "hover:bg-bg-subtle"} transition-colors`}>
                    <td className="py-2.5 px-3 text-text-muted">{split.number}</td>
                    <td className="py-2.5 px-3 font-medium text-text-primary">{split.distance}</td>
                    <td className="py-2.5 px-3 font-mono text-text-primary">{split.splitTime}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-text-primary">{split.cumulativeTime}</td>
                    <td className="py-2.5 px-3 font-mono text-text-secondary">{split.pace}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {halfIndex > 0 && <p className="text-xs text-brand mt-2">↑ Highlighted row = halfway point</p>}
        </>
      ) : (
        <div className="text-center py-12 text-text-muted">
          <p className="text-lg">Enter your race details to see splits</p>
        </div>
      )}
    </ToolShell>
  );
}



