"use client";

import { useState, useMemo } from "react";
import ToolShell from "@/components/ui/ToolShell";
import TimeInput from "@/components/ui/TimeInput";
import DistanceSelect from "@/components/ui/DistanceSelect";
import UnitToggle from "@/components/ui/UnitToggle";
import RaceTime from "@/components/ui/RaceTime";
import {
  DISTANCES, type DistanceKey, timeToSeconds,
  calculateTrainingPaces, formatTimeFromSeconds, convertPace, estimateVO2max,
} from "@/lib/running-math";

const ZONE_INFO = [
  { key: "easy" as const, name: "Easy / Recovery", color: "#22C55E", purpose: "Build aerobic base. Conversational pace.", sample: "30-60 min easy run" },
  { key: "marathon" as const, name: "Marathon Pace", color: "#3B82F6", purpose: "Goal marathon effort. Practise fuelling.", sample: "Marathon-pace long run segments" },
  { key: "threshold" as const, name: "Threshold / Tempo", color: "#EAB308", purpose: "Improve lactate threshold. Comfortably hard.", sample: "20-40 min tempo or 3×10 min" },
  { key: "interval" as const, name: "Interval / VO2max", color: "#F97316", purpose: "Improve VO2max. Hard 3-5 min repeats.", sample: "5×1000m with 400m jog" },
  { key: "repetition" as const, name: "Repetition / Speed", color: "#EF4444", purpose: "Running economy + speed. Short, fast.", sample: "8×200m with full recovery" },
];

export default function TrainingPacesTool() {
  const [distanceKey, setDistanceKey] = useState<string>("5k");
  const [customMeters, setCustomMeters] = useState(5000);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(22);
  const [seconds, setSeconds] = useState(30);
  const [unit, setUnit] = useState<"km" | "mile">("km");

  const distanceMeters = distanceKey === "custom" ? customMeters : DISTANCES[distanceKey as DistanceKey].meters;
  const totalSeconds = timeToSeconds({ hours, minutes, seconds });

  const results = useMemo(() => {
    if (totalSeconds <= 0 || distanceMeters <= 0) return null;
    const paces = calculateTrainingPaces(distanceMeters, totalSeconds);
    const vo2max = estimateVO2max(distanceMeters, totalSeconds);
    const formatted = ZONE_INFO.map((zone) => {
      const z = paces[zone.key];
      const minPace = unit === "mile" ? convertPace(z.min, "km", "mile") : z.min;
      const maxPace = unit === "mile" ? convertPace(z.max, "km", "mile") : z.max;
      return { ...zone, paceRange: `${formatTimeFromSeconds(minPace)} – ${formatTimeFromSeconds(maxPace)}`, min: minPace, max: maxPace };
    });
    return { paces: formatted, vo2max: vo2max.toFixed(1) };
  }, [totalSeconds, distanceMeters, unit]);

  const inputs = (
    <div className="space-y-5">
      <DistanceSelect label="Recent Race" value={distanceKey} onChange={(key, meters) => { setDistanceKey(key); if (key === "custom") setCustomMeters(meters); }} customMeters={customMeters} onCustomChange={setCustomMeters} dark />
      <TimeInput label="Your Time" hours={hours} minutes={minutes} seconds={seconds} onChange={(h, m, s) => { setHours(h); setMinutes(m); setSeconds(s); }} dark />
      <UnitToggle value={unit} onChange={setUnit} dark />
    </div>
  );

  return (
    <ToolShell title="Find My Training Paces" description="Calculate your training zones from a recent race. Easy, tempo, interval and rep paces based on Jack Daniels methodology." currentPath="/tools/training-paces" inputs={inputs}>
      {results ? (
        <>
          <div className="text-center mb-6">
            <RaceTime value={`${results.vo2max}`} size="xl" label="Estimated VO2max" sublabel="ml/kg/min" />
          </div>

          <div className="space-y-3">
            {results.paces.map((zone) => (
              <div key={zone.key} className="rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-stretch">
                  <div className="w-1.5 shrink-0" style={{ backgroundColor: zone.color }} />
                  <div className="flex-1 p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-heading font-semibold text-sm text-text-primary">{zone.name}</h3>
                    </div>
                    <div className="font-mono text-xl font-bold mb-2" style={{ color: zone.color }}>
                      {zone.paceRange}
                      <span className="text-sm font-normal text-text-muted ml-1">/{unit}</span>
                    </div>
                    <p className="text-xs text-text-secondary">{zone.purpose}</p>
                    <p className="text-xs text-text-muted mt-1">Example: {zone.sample}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-text-muted">
          <p className="text-lg">Enter a race result to find your zones</p>
        </div>
      )}
    </ToolShell>
  );
}
