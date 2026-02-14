"use client";

import { useState, useMemo } from "react";
import ToolShell from "@/components/ui/ToolShell";
import TimeInput from "@/components/ui/TimeInput";
import DistanceSelect from "@/components/ui/DistanceSelect";
import ResultCard from "@/components/ui/ResultCard";
import RaceTime from "@/components/ui/RaceTime";
import {
  DISTANCES, type DistanceKey, timeToSeconds, estimateVO2max,
} from "@/lib/running-math";

function fitnessLevel(vo2: number, gender: "male" | "female"): string {
  if (gender === "male") {
    if (vo2 >= 60) return "Superior";
    if (vo2 >= 52) return "Excellent";
    if (vo2 >= 44) return "Good";
    if (vo2 >= 36) return "Fair";
    return "Below Average";
  }
  if (vo2 >= 50) return "Superior";
  if (vo2 >= 44) return "Excellent";
  if (vo2 >= 36) return "Good";
  if (vo2 >= 30) return "Fair";
  return "Below Average";
}

export default function VO2maxTool() {
  const [distanceKey, setDistanceKey] = useState<string>("5k");
  const [customMeters, setCustomMeters] = useState(5000);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(22);
  const [seconds, setSeconds] = useState(30);
  const [gender, setGender] = useState<"male" | "female">("male");

  const distanceMeters = distanceKey === "custom" ? customMeters : DISTANCES[distanceKey as DistanceKey].meters;
  const totalSeconds = timeToSeconds({ hours, minutes, seconds });

  const results = useMemo(() => {
    if (totalSeconds <= 0 || distanceMeters <= 0) return null;
    const vo2max = estimateVO2max(distanceMeters, totalSeconds);
    if (!isFinite(vo2max) || vo2max <= 0) return null;
    return { vo2max: vo2max.toFixed(1), level: fitnessLevel(vo2max, gender) };
  }, [totalSeconds, distanceMeters, gender]);

  const inputs = (
    <div className="space-y-5">
      <DistanceSelect label="Race Distance" value={distanceKey} onChange={(key, meters) => { setDistanceKey(key); if (key === "custom") setCustomMeters(meters); }} customMeters={customMeters} onCustomChange={setCustomMeters} dark />
      <TimeInput label="Your Time" hours={hours} minutes={minutes} seconds={seconds} onChange={(h, m, s) => { setHours(h); setMinutes(m); setSeconds(s); }} dark />
      <div>
        <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Gender</label>
        <select value={gender} onChange={(e) => setGender(e.target.value as "male" | "female")}
          className="w-full h-12 bg-white/[0.08] border border-white/[0.12] text-white text-sm rounded-lg px-3 focus:outline-none focus:border-brand focus:shadow-glow transition-all appearance-none cursor-pointer">
          <option value="male" className="bg-zinc-900 text-white">Male</option>
          <option value="female" className="bg-zinc-900 text-white">Female</option>
        </select>
      </div>
    </div>
  );

  return (
    <ToolShell title="Estimate My VO2max" description="Estimate your VO2max from a recent race using the Jack Daniels formula. See your fitness classification." currentPath="/tools/vo2max" inputs={inputs}>
      {results ? (
        <>
          <div className="text-center mb-6">
            <RaceTime value={results.vo2max} size="xl" label="Estimated VO2max" sublabel="ml/kg/min" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ResultCard label="VO2max" value={`${results.vo2max} ml/kg/min`} highlight large />
            <ResultCard label="Fitness Level" value={results.level} sublabel={`For ${gender}s`} />
          </div>

          <div className="mt-6 text-sm text-text-secondary">
            <h3 className="font-heading font-semibold text-text-primary mb-2">What is VO2max?</h3>
            <p className="leading-relaxed">VO2max is the maximum rate of oxygen your body can use during exercise. It is widely considered the best indicator of cardiovascular fitness and aerobic endurance. Elite male runners typically have a VO2max above 70 ml/kg/min; elite women above 60.</p>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-text-muted">
          <p className="text-lg">Enter a race result to estimate your VO2max</p>
        </div>
      )}
    </ToolShell>
  );
}


