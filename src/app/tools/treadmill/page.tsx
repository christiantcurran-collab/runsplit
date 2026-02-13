"use client";

import { useState, useMemo } from "react";
import ToolShell from "@/components/ui/ToolShell";
import ResultCard from "@/components/ui/ResultCard";
import RaceTime from "@/components/ui/RaceTime";
import UnitToggle from "@/components/ui/UnitToggle";
import {
  treadmillToOutdoorPace, speedToPace, formatTimeFromSeconds, convertPace, paceToSpeed,
} from "@/lib/running-math";

export default function TreadmillTool() {
  const [speed, setSpeed] = useState(10);
  const [incline, setIncline] = useState(1);
  const [unit, setUnit] = useState<"km" | "mile">("km");

  const results = useMemo(() => {
    if (speed <= 0) return null;
    const treadmillPaceKm = speedToPace(speed); // seconds per km
    if (treadmillPaceKm <= 0 || !isFinite(treadmillPaceKm)) return null;

    const outdoorPaceKm = treadmillToOutdoorPace(treadmillPaceKm, incline);
    const treadmillDisplay = unit === "mile" ? convertPace(treadmillPaceKm, "km", "mile") : treadmillPaceKm;
    const outdoorDisplay = unit === "mile" ? convertPace(outdoorPaceKm, "km", "mile") : outdoorPaceKm;
    const outdoorSpeedKmh = paceToSpeed(outdoorPaceKm);

    return {
      treadmillPace: formatTimeFromSeconds(treadmillDisplay),
      outdoorPace: formatTimeFromSeconds(outdoorDisplay),
      outdoorSpeed: outdoorSpeedKmh.toFixed(1),
      treadmillPaceSec: treadmillDisplay,
      outdoorPaceSec: outdoorDisplay,
    };
  }, [speed, incline, unit]);

  const inputs = (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Treadmill Speed (km/h)</label>
        <input type="number" inputMode="decimal" min={1} max={25} step={0.1} value={speed} onChange={(e) => setSpeed(Number(e.target.value) || 0)}
          className="w-full h-12 text-center font-mono text-xl bg-white/[0.08] border border-white/[0.12] text-white rounded-lg focus:outline-none focus:border-brand focus:shadow-glow transition-all" />
      </div>
      <div>
        <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Incline (%)</label>
        <input type="number" inputMode="decimal" min={0} max={15} step={0.5} value={incline} onChange={(e) => setIncline(Number(e.target.value) || 0)}
          className="w-full h-12 text-center font-mono text-xl bg-white/[0.08] border border-white/[0.12] text-white rounded-lg focus:outline-none focus:border-brand focus:shadow-glow transition-all" />
        <p className="text-xs text-text-muted mt-1">1% incline ≈ outdoor air resistance</p>
      </div>
      <UnitToggle value={unit} onChange={setUnit} dark />
    </div>
  );

  return (
    <ToolShell title="Treadmill vs Outdoor" description="Convert treadmill speed and incline to equivalent outdoor running pace. Find your true effort." currentPath="/tools/treadmill" inputs={inputs}>
      {results ? (
        <>
          <div className="text-center mb-6">
            <RaceTime value={`${results.outdoorPace}/${unit}`} size="xl" label="Outdoor Equivalent Pace" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <ResultCard label={`Treadmill Pace`} value={`${results.treadmillPace}/${unit}`} />
            <ResultCard label={`Outdoor Pace`} value={`${results.outdoorPace}/${unit}`} highlight delay={0.05} />
            <ResultCard label="Outdoor Speed" value={`${results.outdoorSpeed} km/h`} delay={0.1} />
          </div>

          <div className="mt-6 text-sm text-text-secondary">
            <h3 className="font-heading font-semibold text-text-primary mb-2">How does treadmill convert to outdoor?</h3>
            <p className="leading-relaxed">Running on a treadmill at 0% incline is generally easier than outdoor running because there is no air resistance and the belt pulls your feet backwards. Setting the treadmill to 1% incline roughly compensates for this. Higher inclines make the treadmill effort harder than the equivalent flat outdoor pace.</p>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-text-muted">
          <p className="text-lg">Enter treadmill settings to see outdoor pace</p>
        </div>
      )}
    </ToolShell>
  );
}

