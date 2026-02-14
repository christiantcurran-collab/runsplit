"use client";

import { useState, useMemo } from "react";
import ToolShell from "@/components/ui/ToolShell";
import TimeInput from "@/components/ui/TimeInput";
import DistanceSelect from "@/components/ui/DistanceSelect";
import UnitToggle from "@/components/ui/UnitToggle";
import ResultCard from "@/components/ui/ResultCard";
import RaceTime from "@/components/ui/RaceTime";
import {
  DISTANCES, type DistanceKey, timeToSeconds,
  predictRaceTime, predictRaceTimeCameron, calculatePace, formatTime, formatTimeFromSeconds,
} from "@/lib/running-math";

export default function PredictTool() {
  const [knownDistKey, setKnownDistKey] = useState<string>("5k");
  const [knownCustom, setKnownCustom] = useState(5000);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(22);
  const [seconds, setSeconds] = useState(30);
  const [targetDistKey, setTargetDistKey] = useState<string>("marathon");
  const [targetCustom, setTargetCustom] = useState(42195);
  const [experience, setExperience] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [unit, setUnit] = useState<"km" | "mile">("km");

  const knownMeters = knownDistKey === "custom" ? knownCustom : DISTANCES[knownDistKey as DistanceKey].meters;
  const targetMeters = targetDistKey === "custom" ? targetCustom : DISTANCES[targetDistKey as DistanceKey].meters;
  const totalSeconds = timeToSeconds({ hours, minutes, seconds });
  const fatigueFactor = experience === "beginner" ? 1.10 : experience === "advanced" ? 1.04 : 1.06;

  const results = useMemo(() => {
    if (totalSeconds <= 0 || knownMeters <= 0 || targetMeters <= 0) return null;
    const riegel = predictRaceTime(knownMeters, totalSeconds, targetMeters, fatigueFactor);
    const cameron = predictRaceTimeCameron(knownMeters, totalSeconds, targetMeters);
    const allPredictions = Object.entries(DISTANCES).map(([, dist]) => ({
      name: dist.name,
      riegel: formatTimeFromSeconds(predictRaceTime(knownMeters, totalSeconds, dist.meters, fatigueFactor)),
      pace: formatTime(calculatePace(dist.meters, predictRaceTime(knownMeters, totalSeconds, dist.meters, fatigueFactor), unit)),
    }));
    return {
      riegel: formatTimeFromSeconds(riegel),
      cameron: formatTimeFromSeconds(cameron),
      conservative: formatTimeFromSeconds(predictRaceTime(knownMeters, totalSeconds, targetMeters, 1.10)),
      aggressive: formatTimeFromSeconds(predictRaceTime(knownMeters, totalSeconds, targetMeters, 1.04)),
      riegelPace: formatTime(calculatePace(targetMeters, riegel, unit)),
      allPredictions,
    };
  }, [totalSeconds, knownMeters, targetMeters, fatigueFactor, unit]);

  const targetName = DISTANCES[targetDistKey as DistanceKey]?.name || "Race";

  const inputs = (
    <div className="space-y-5">
      <DistanceSelect label="Your Recent Race" value={knownDistKey} onChange={(key, meters) => { setKnownDistKey(key); if (key === "custom") setKnownCustom(meters); }} customMeters={knownCustom} onCustomChange={setKnownCustom} dark />
      <TimeInput label="Your Time" hours={hours} minutes={minutes} seconds={seconds} onChange={(h, m, s) => { setHours(h); setMinutes(m); setSeconds(s); }} dark />
      <DistanceSelect label="Target Race" value={targetDistKey} onChange={(key, meters) => { setTargetDistKey(key); if (key === "custom") setTargetCustom(meters); }} customMeters={targetCustom} onCustomChange={setTargetCustom} dark />
      <div>
        <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Experience</label>
        <div className="flex gap-2">
          {(["beginner", "intermediate", "advanced"] as const).map((exp) => (
            <button key={exp} type="button" onClick={() => setExperience(exp)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${experience === exp ? "bg-brand text-white" : "bg-white/[0.08] text-white/60 border border-white/[0.12]"}`}>
              {exp}
            </button>
          ))}
        </div>
      </div>
      <UnitToggle value={unit} onChange={setUnit} dark />
    </div>
  );

  return (
    <ToolShell title="What Can I Run?" description="Predict your finish time for any race distance based on a recent result." currentPath="/tools/predict" inputs={inputs}
      proCta={results ? `Want a training plan for a ${results.riegel} ${targetName}?` : undefined}>
      {results ? (
        <>
          <div className="text-center mb-8">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Predicted {targetName}</span>
            <div className="mt-2"><RaceTime value={results.riegel} size="xl" /></div>
            <p className="text-sm text-text-secondary mt-2">Pace: {results.riegelPace}/{unit}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <ResultCard label="Riegel" value={results.riegel} highlight sublabel="Standard formula" />
            <ResultCard label="Cameron" value={results.cameron} sublabel="Alternative model" delay={0.05} />
            <ResultCard label="Conservative" value={results.conservative} sublabel="Beginner factor" delay={0.1} />
            <ResultCard label="Aggressive" value={results.aggressive} sublabel="Advanced factor" delay={0.15} />
          </div>

          <h3 className="font-heading font-semibold text-base text-text-primary mb-4">All Distance Predictions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200"><th className="text-left py-2 px-3 text-xs font-medium text-text-muted uppercase tracking-wider">Distance</th><th className="text-left py-2 px-3 text-xs font-medium text-text-muted uppercase tracking-wider">Time</th><th className="text-left py-2 px-3 text-xs font-medium text-text-muted uppercase tracking-wider">Pace</th></tr></thead>
              <tbody>
                {results.allPredictions.map((pred) => (
                  <tr key={pred.name} className="border-b border-gray-50 hover:bg-bg-subtle transition-colors">
                    <td className="py-3 px-3 font-medium text-text-primary">{pred.name}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-text-primary">{pred.riegel}</td>
                    <td className="py-3 px-3 font-mono text-text-secondary">{pred.pace}/{unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-text-muted"><p className="text-lg">Enter a recent race to see predictions</p></div>
      )}
    </ToolShell>
  );
}


