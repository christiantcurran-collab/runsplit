"use client";

import { useState, useMemo } from "react";
import ToolShell from "@/components/ui/ToolShell";
import TimeInput from "@/components/ui/TimeInput";
import DistanceSelect from "@/components/ui/DistanceSelect";
import UnitToggle from "@/components/ui/UnitToggle";
import RaceTime from "@/components/ui/RaceTime";
import {
  DISTANCES, type DistanceKey, timeToSeconds,
  calculateEvenSplits, calculateNegativeSplits, calculatePace, formatTime,
} from "@/lib/running-math";

export default function SplitsTool() {
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
    if (strategy === "even") return calculateEvenSplits(distanceMeters, totalSeconds, splitDistance, unit);
    return calculateNegativeSplits(distanceMeters, totalSeconds, splitDistance, negativePct, unit);
  }, [totalSeconds, distanceMeters, splitDistance, unit, strategy, negativePct]);

  const halfIndex = Math.ceil(splits.length / 2);
  const pace = totalSeconds > 0 && distanceMeters > 0 ? formatTime(calculatePace(distanceMeters, totalSeconds, unit)) : "";

  const inputs = (
    <div className="space-y-5">
      <DistanceSelect label="Race Distance" value={distanceKey} onChange={(key, meters) => { setDistanceKey(key); if (key === "custom") setCustomMeters(meters); }} customMeters={customMeters} onCustomChange={setCustomMeters} dark />
      <TimeInput label="Target Time" hours={hours} minutes={minutes} seconds={seconds} onChange={(h, m, s) => { setHours(h); setMinutes(m); setSeconds(s); }} dark />
      <div>
        <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Strategy</label>
        <div className="flex gap-2">
          {(["even", "negative"] as const).map((s) => (
            <button key={s} type="button" onClick={() => setStrategy(s)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all ${strategy === s ? "bg-brand text-white" : "bg-white/[0.08] text-white/60 border border-white/[0.12]"}`}>
              {s === "even" ? "Even" : "Negative"}
            </button>
          ))}
        </div>
      </div>
      {strategy === "negative" && (
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Negative %</label>
          <input type="range" min={1} max={8} value={negativePct} onChange={(e) => setNegativePct(Number(e.target.value))} className="w-full accent-brand" />
          <span className="text-sm text-text-on-dark font-mono">{negativePct}%</span>
        </div>
      )}
      <UnitToggle value={unit} onChange={setUnit} dark />
    </div>
  );

  return (
    <ToolShell title="Race Split Planner" description="Plan your splits for any race distance. Even or negative split strategies." currentPath="/tools/splits" inputs={inputs}>
      {splits.length > 0 ? (
        <>
          <div className="text-center mb-6">
            <RaceTime value={`${pace}/${unit}`} size="lg" label="Target Pace" />
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
                  <tr key={split.number}
                    className={`border-b border-gray-50 transition-colors ${idx + 1 === halfIndex ? "bg-brand/5 border-brand/20" : "hover:bg-bg-subtle"}`}>
                    <td className="py-3 px-3 text-text-muted">{split.number}</td>
                    <td className="py-3 px-3 font-medium text-text-primary">{split.distance}</td>
                    <td className="py-3 px-3 font-mono text-text-secondary">{split.splitTime}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-text-primary">{split.cumulativeTime}</td>
                    <td className="py-3 px-3 font-mono text-text-secondary">{split.pace}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {halfIndex > 0 && <p className="text-xs text-brand mt-2">↑ Highlighted = halfway point</p>}
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-text-muted"><p className="text-lg">Enter a distance and time to plan splits</p></div>
      )}
    </ToolShell>
  );
}





