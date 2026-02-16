"use client";

import { useState, useMemo } from "react";
import ToolShell from "@/components/ui/ToolShell";
import TimeInput from "@/components/ui/TimeInput";
import DistanceSelect from "@/components/ui/DistanceSelect";
import UnitToggle from "@/components/ui/UnitToggle";
import ResultCard from "@/components/ui/ResultCard";
import RaceTime from "@/components/ui/RaceTime";
import PaceBar from "@/components/ui/PaceBar";
import {
  DISTANCES, type DistanceKey, timeToSeconds,
  calculatePace, calculatePaceSeconds, paceToSpeed,
  convertPace, formatTime, predictRaceTime, formatTimeFromSeconds, secondsToTime,
} from "@/lib/running-math";

export default function PaceTool() {
  const [distanceKey, setDistanceKey] = useState<string>("10k");
  const [customMeters, setCustomMeters] = useState(10000);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(50);
  const [seconds, setSeconds] = useState(0);
  const [unit, setUnit] = useState<"km" | "mile">("km");

  const distanceMeters = distanceKey === "custom" ? customMeters : DISTANCES[distanceKey as DistanceKey].meters;
  const totalSeconds = timeToSeconds({ hours, minutes, seconds });

  const results = useMemo(() => {
    if (totalSeconds <= 0 || distanceMeters <= 0) return null;
    const paceKm = calculatePace(distanceMeters, totalSeconds, "km");
    const paceMile = calculatePace(distanceMeters, totalSeconds, "mile");
    const paceSecsKm = calculatePaceSeconds(distanceMeters, totalSeconds, "km");
    const paceSecsMile = calculatePaceSeconds(distanceMeters, totalSeconds, "mile");
    const speedKmh = paceToSpeed(paceSecsKm);
    const speedMph = paceToSpeed(paceSecsMile);

    const predictions = Object.entries(DISTANCES).map(([, dist]) => ({
      name: dist.name,
      shortName: dist.shortName,
      time: formatTimeFromSeconds(predictRaceTime(distanceMeters, totalSeconds, dist.meters)),
      pace: formatTime(secondsToTime(convertPace(calculatePaceSeconds(dist.meters, predictRaceTime(distanceMeters, totalSeconds, dist.meters), "km"), "km", unit))),
    }));

    return { paceKm: formatTime(paceKm), paceMile: formatTime(paceMile), speedKmh: speedKmh.toFixed(1), speedMph: speedMph.toFixed(1), predictions, paceSecsKm };
  }, [totalSeconds, distanceMeters, unit]);

  const inputs = (
    <div className="space-y-5">
      <DistanceSelect label="Distance" value={distanceKey} onChange={(key, meters) => { setDistanceKey(key); if (key === "custom") setCustomMeters(meters); }} customMeters={customMeters} onCustomChange={setCustomMeters} dark />
      <TimeInput label="Finish Time" hours={hours} minutes={minutes} seconds={seconds} onChange={(h, m, s) => { setHours(h); setMinutes(m); setSeconds(s); }} dark />
      <UnitToggle value={unit} onChange={setUnit} dark />
    </div>
  );

  return (
    <ToolShell title="Pace & Speed" description="Calculate your running pace, speed, and finish time for any distance. Instant results." currentPath="/tools/pace" inputs={inputs} proCta={results ? `Want a training plan for ${results.paceKm}/km pace?` : undefined}>
      {results ? (
        <>
          {/* Hero result */}
          <div className="text-center mb-6">
            <RaceTime value={unit === "km" ? `${results.paceKm}/km` : `${results.paceMile}/mi`} size="xl" label="Your Pace" />
          </div>
          <PaceBar pacePerKm={results.paceSecsKm} unit={unit} className="mb-8" />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <ResultCard label="Pace (min/km)" value={results.paceKm} highlight={unit === "km"} />
            <ResultCard label="Pace (min/mi)" value={results.paceMile} highlight={unit === "mile"} delay={0.05} />
            <ResultCard label="Speed (km/h)" value={results.speedKmh} delay={0.1} />
            <ResultCard label="Speed (mph)" value={results.speedMph} delay={0.15} />
          </div>

          <h3 className="font-heading font-semibold text-base text-text-primary mb-4">Equivalent Race Times</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-xs font-medium text-text-muted uppercase tracking-wider">Distance</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-text-muted uppercase tracking-wider">Time</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-text-muted uppercase tracking-wider">Pace</th>
                </tr>
              </thead>
              <tbody>
                {results.predictions.map((pred) => (
                  <tr key={pred.name} className="border-b border-gray-50 hover:bg-bg-subtle transition-colors">
                    <td className="py-3 px-3 font-medium text-text-primary">{pred.name}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-text-primary">{pred.time}</td>
                    <td className="py-3 px-3 font-mono text-text-secondary">{pred.pace}/{unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-text-muted">
          <p className="text-lg">Enter a distance and time to see your pace</p>
        </div>
      )}
    </ToolShell>
  );
}





