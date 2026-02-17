"use client";

import { useState, useMemo } from "react";
import ToolShell from "@/components/ui/ToolShell";
import ResultCard from "@/components/ui/ResultCard";
import RaceTime from "@/components/ui/RaceTime";
import {
  DISTANCES, type DistanceKey, calculateCalories,
} from "@/lib/running-math";

export default function CaloriesTool() {
  const [distanceKey, setDistanceKey] = useState<string>("5k");
  const [customKm, setCustomKm] = useState(5);
  const [weight, setWeight] = useState(70);
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");
  const [paceMin, setPaceMin] = useState(5);
  const [paceSec, setPaceSec] = useState(30);

  const distanceKm = distanceKey === "custom" ? customKm : DISTANCES[distanceKey as DistanceKey].meters / 1000;
  const weightKg = weightUnit === "lbs" ? weight * 0.453592 : weight;
  const paceMinPerKm = paceMin + paceSec / 60;

  const results = useMemo(() => {
    if (distanceKm <= 0 || weightKg <= 0 || paceMinPerKm <= 0) return null;
    const calories = calculateCalories(weightKg, distanceKm, paceMinPerKm);
    const durationMin = distanceKm * paceMinPerKm;
    const calPerKm = Math.round(calories / distanceKm);
    const calPerMin = Math.round(calories / durationMin);
    return { calories, durationMin: Math.round(durationMin), calPerKm, calPerMin };
  }, [distanceKm, weightKg, paceMinPerKm]);

  const distanceOptions = Object.entries(DISTANCES).map(([key, d]) => ({ key, label: d.name, km: d.meters / 1000 }));

  const inputs = (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Distance</label>
        <select value={distanceKey} onChange={(e) => setDistanceKey(e.target.value)}
          className="w-full h-12 bg-white/[0.08] border border-white/[0.12] text-white text-sm rounded-lg px-3 focus:outline-none focus:border-brand focus:shadow-glow transition-all appearance-none cursor-pointer">
          {distanceOptions.map((d) => (<option key={d.key} value={d.key} className="bg-zinc-900 text-white">{d.label}</option>))}
          <option value="custom" className="bg-zinc-900 text-white">Custom</option>
        </select>
        {distanceKey === "custom" && (
          <div className="mt-2 flex items-center gap-2">
            <input type="number" inputMode="decimal" min={0.1} step={0.1} value={customKm} onChange={(e) => setCustomKm(Number(e.target.value) || 0)}
              className="w-24 h-10 text-center font-mono text-sm bg-white/[0.08] border border-white/[0.12] text-white rounded-lg focus:outline-none focus:border-brand transition-all" />
            <span className="text-xs text-text-muted">km</span>
          </div>
        )}
      </div>
      <div>
        <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Body Weight</label>
        <div className="flex items-center gap-2">
          <input type="number" inputMode="numeric" min={20} max={300} value={weight} onChange={(e) => setWeight(Number(e.target.value) || 0)}
            className="flex-1 h-12 text-center font-mono text-xl bg-white/[0.08] border border-white/[0.12] text-white rounded-lg focus:outline-none focus:border-brand focus:shadow-glow transition-all" />
          <select value={weightUnit} onChange={(e) => setWeightUnit(e.target.value as "kg" | "lbs")}
            className="h-12 bg-white/[0.08] border border-white/[0.12] text-white text-sm rounded-lg px-3 focus:outline-none focus:border-brand transition-all appearance-none cursor-pointer">
            <option value="kg" className="bg-zinc-900">kg</option>
            <option value="lbs" className="bg-zinc-900">lbs</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Pace (min/km)</label>
        <div className="flex items-center gap-1.5">
          <input type="number" inputMode="numeric" min={2} max={15} value={paceMin} onChange={(e) => setPaceMin(Number(e.target.value) || 0)}
            className="w-16 h-12 text-center font-mono text-xl bg-white/[0.08] border border-white/[0.12] text-white rounded-lg focus:outline-none focus:border-brand focus:shadow-glow transition-all" />
          <span className="font-mono text-2xl font-bold text-white/30">:</span>
          <input type="number" inputMode="numeric" min={0} max={59} value={paceSec} onChange={(e) => setPaceSec(Math.min(59, Number(e.target.value) || 0))}
            className="w-16 h-12 text-center font-mono text-xl bg-white/[0.08] border border-white/[0.12] text-white rounded-lg focus:outline-none focus:border-brand focus:shadow-glow transition-all" />
        </div>
      </div>
    </div>
  );

  return (
    <ToolShell title="Calories Burned" description="Estimate calories burned running based on distance, weight, and pace. MET-based calculation." currentPath="/tools/calories" inputs={inputs}>
      {results ? (
        <>
          <div className="text-center mb-6">
            <RaceTime value={`${results.calories}`} size="xl" label="Calories Burned" sublabel="kcal" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <ResultCard label="Total Calories" value={`${results.calories} kcal`} highlight large />
            <ResultCard label="Duration" value={`${results.durationMin} min`} delay={0.05} />
            <ResultCard label="Cal/km" value={`${results.calPerKm}`} delay={0.1} />
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-text-muted">
          <p className="text-lg">Enter your details to estimate calories</p>
        </div>
      )}
    </ToolShell>
  );
}








