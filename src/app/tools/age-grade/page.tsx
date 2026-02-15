"use client";

import { useState, useMemo } from "react";
import ToolShell from "@/components/ui/ToolShell";
import TimeInput from "@/components/ui/TimeInput";
import DistanceSelect from "@/components/ui/DistanceSelect";
import ResultCard from "@/components/ui/ResultCard";
import RaceTime from "@/components/ui/RaceTime";
import {
  DISTANCES, type DistanceKey, timeToSeconds,
  calculateAgeGrade, formatTimeFromSeconds,
} from "@/lib/running-math";

export default function AgeGradeTool() {
  const [distanceKey, setDistanceKey] = useState<string>("5k");
  const [customMeters, setCustomMeters] = useState(5000);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(22);
  const [seconds, setSeconds] = useState(30);
  const [age, setAge] = useState(35);
  const [gender, setGender] = useState<"male" | "female">("male");

  const distanceMeters = distanceKey === "custom" ? customMeters : DISTANCES[distanceKey as DistanceKey].meters;
  const totalSeconds = timeToSeconds({ hours, minutes, seconds });

  const results = useMemo(() => {
    if (totalSeconds <= 0 || distanceMeters <= 0 || age <= 0) return null;
    const { percentage, ageGradedTime, level } = calculateAgeGrade(totalSeconds, distanceMeters, age, gender);
    return { percentage: percentage.toFixed(1), ageGradedTime: formatTimeFromSeconds(ageGradedTime), level };
  }, [totalSeconds, distanceMeters, age, gender]);

  const inputs = (
    <div className="space-y-5">
      <DistanceSelect label="Race Distance" value={distanceKey} onChange={(key, meters) => { setDistanceKey(key); if (key === "custom") setCustomMeters(meters); }} customMeters={customMeters} onCustomChange={setCustomMeters} dark />
      <TimeInput label="Your Time" hours={hours} minutes={minutes} seconds={seconds} onChange={(h, m, s) => { setHours(h); setMinutes(m); setSeconds(s); }} dark />
      <div>
        <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Age</label>
        <input type="number" inputMode="numeric" min={5} max={100} value={age} onChange={(e) => setAge(Number(e.target.value) || 0)}
          className="w-full h-12 text-center font-mono text-xl bg-white/[0.08] border border-white/[0.12] text-white rounded-lg focus:outline-none focus:border-brand focus:shadow-glow transition-all" />
      </div>
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
    <ToolShell title="How Good Is My Time?" description="Age-graded performance rating. See how your time compares to the best in your age group." currentPath="/tools/age-grade" inputs={inputs}>
      {results ? (
        <>
          <div className="text-center mb-6">
            <RaceTime value={`${results.percentage}%`} size="xl" label="Age Grade" sublabel={results.level} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ResultCard label="Age-Graded Time" value={results.ageGradedTime} sublabel="Open-age equivalent" />
            <ResultCard label="Performance Level" value={results.level} highlight sublabel={`${results.percentage}% age grade`} />
          </div>

          <div className="mt-6 text-sm text-text-secondary space-y-1">
            <p><strong>90%+</strong> — World class</p>
            <p><strong>80-89%</strong> — National level</p>
            <p><strong>70-79%</strong> — Regional level</p>
            <p><strong>60-69%</strong> — Local club level</p>
            <p><strong>&lt;60%</strong> — Recreational</p>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-text-muted">
          <p className="text-lg">Enter your details to see your age grade</p>
        </div>
      )}
    </ToolShell>
  );
}



