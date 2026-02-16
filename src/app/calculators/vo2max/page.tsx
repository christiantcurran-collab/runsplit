"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "@/components/ui/CalculatorShell";
import TimeInput from "@/components/ui/TimeInput";
import DistanceSelect from "@/components/ui/DistanceSelect";
import ResultCard from "@/components/ui/ResultCard";
import {
  DISTANCES,
  type DistanceKey,
  timeToSeconds,
  estimateVO2max,
} from "@/lib/running-math";

function getFitnessLevel(vo2max: number, age: number, gender: "male" | "female"): string {
  // Simplified classification based on age/gender norms
  const threshold = gender === "male"
    ? { superior: 55, excellent: 48, good: 42, fair: 36 }
    : { superior: 48, excellent: 42, good: 36, fair: 30 };

  // Adjust slightly for age
  const ageAdjust = age > 30 ? (age - 30) * 0.2 : 0;
  const adj = {
    superior: threshold.superior - ageAdjust,
    excellent: threshold.excellent - ageAdjust,
    good: threshold.good - ageAdjust,
    fair: threshold.fair - ageAdjust,
  };

  if (vo2max >= adj.superior) return "Superior";
  if (vo2max >= adj.excellent) return "Excellent";
  if (vo2max >= adj.good) return "Good";
  if (vo2max >= adj.fair) return "Fair";
  return "Below Average";
}

function getLevelColor(level: string) {
  switch (level) {
    case "Superior": return "text-purple-600";
    case "Excellent": return "text-blue-600";
    case "Good": return "text-green-600";
    case "Fair": return "text-yellow-600";
    default: return "text-gray-600";
  }
}

export default function VO2maxCalculator() {
  const [distanceKey, setDistanceKey] = useState<string>("5k");
  const [customMeters, setCustomMeters] = useState(5000);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(22);
  const [seconds, setSeconds] = useState(30);
  const [age, setAge] = useState(30);
  const [gender, setGender] = useState<"male" | "female">("male");

  const distanceMeters = distanceKey === "custom" ? customMeters : DISTANCES[distanceKey as DistanceKey].meters;
  const totalSeconds = timeToSeconds({ hours, minutes, seconds });

  const results = useMemo(() => {
    if (totalSeconds <= 0 || distanceMeters <= 0) return null;
    const vo2max = estimateVO2max(distanceMeters, totalSeconds);
    const level = getFitnessLevel(vo2max, age, gender);
    return { vo2max: vo2max.toFixed(1), level };
  }, [totalSeconds, distanceMeters, age, gender]);

  return (
    <CalculatorShell
      title="VO2max Estimator"
      description="Estimate your VO2max from a race result. Compare against age and gender norms."
      currentPath="/calculators/vo2max"
    >
      <div className="space-y-6 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <DistanceSelect
            label="Race Distance"
            value={distanceKey}
            onChange={(key, meters) => { setDistanceKey(key); if (key === "custom") setCustomMeters(meters); }}
            customMeters={customMeters}
            onCustomChange={setCustomMeters}
          />
          <TimeInput
            label="Your Time"
            hours={hours}
            minutes={minutes}
            seconds={seconds}
            onChange={(h, m, s) => { setHours(h); setMinutes(m); setSeconds(s); }}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Age (optional)</label>
            <input
              type="number"
              min={10}
              max={100}
              value={age}
              onChange={(e) => setAge(Number(e.target.value) || 30)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as "male" | "female")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>
      </div>

      {results && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          <ResultCard label="Estimated VO2max" value={`${results.vo2max} ml/kg/min`} highlight large />
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 flex flex-col justify-center">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Fitness Classification</div>
            <div className={`font-heading font-bold text-2xl ${getLevelColor(results.level)}`}>{results.level}</div>
            <div className="text-xs text-gray-400 mt-1">Based on age {age}, {gender}</div>
          </div>
        </div>
      )}

      {/* Reference table */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-8">
        <h3 className="text-sm font-medium text-gray-700 mb-3">VO2max Classification (ml/kg/min)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 font-medium">Level</th>
                <th className="text-left py-2 px-2 font-medium">Male</th>
                <th className="text-left py-2 px-2 font-medium">Female</th>
              </tr>
            </thead>
            <tbody className="text-gray-600">
              <tr className="border-b border-gray-100"><td className="py-1.5 px-2 font-medium text-purple-600">Superior</td><td className="py-1.5 px-2">55+</td><td className="py-1.5 px-2">48+</td></tr>
              <tr className="border-b border-gray-100"><td className="py-1.5 px-2 font-medium text-blue-600">Excellent</td><td className="py-1.5 px-2">48-55</td><td className="py-1.5 px-2">42-48</td></tr>
              <tr className="border-b border-gray-100"><td className="py-1.5 px-2 font-medium text-green-600">Good</td><td className="py-1.5 px-2">42-48</td><td className="py-1.5 px-2">36-42</td></tr>
              <tr className="border-b border-gray-100"><td className="py-1.5 px-2 font-medium text-yellow-600">Fair</td><td className="py-1.5 px-2">36-42</td><td className="py-1.5 px-2">30-36</td></tr>
              <tr><td className="py-1.5 px-2 font-medium text-gray-500">Below Average</td><td className="py-1.5 px-2">&lt; 36</td><td className="py-1.5 px-2">&lt; 30</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-2">Values shown for ages 20-39. Thresholds decrease with age.</p>
      </div>

      <div className="mt-10 border-t border-gray-100 pt-8">
        <h3 className="font-heading font-semibold text-lg mb-3">What is VO2max?</h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          VO2max is the maximum rate of oxygen consumption during intense exercise, measured in millilitres per kilogram per minute (ml/kg/min). It&apos;s the gold standard measure of aerobic fitness. Higher VO2max = greater endurance capacity.
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">
          This estimate uses the Daniels &amp; Gilbert formula, which derives VO2max from your race performance. Lab testing provides the most accurate measurement, but race-derived estimates are remarkably close for trained runners.
        </p>
      </div>
    </CalculatorShell>
  );
}




