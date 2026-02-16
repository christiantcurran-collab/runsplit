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
  calculateAgeGrade,
  formatTimeFromSeconds,
} from "@/lib/running-math";

export default function AgeGradeCalculator() {
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
    const result = calculateAgeGrade(totalSeconds, distanceMeters, age, gender);
    return {
      percentage: result.percentage.toFixed(1),
      ageGradedTime: formatTimeFromSeconds(result.ageGradedTime),
      level: result.level,
    };
  }, [totalSeconds, distanceMeters, age, gender]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case "World Class": return "text-purple-600";
      case "National": return "text-blue-600";
      case "Regional": return "text-brand-orange";
      case "Local": return "text-green-600";
      default: return "text-gray-600";
    }
  };

  return (
    <CalculatorShell
      title="Age-Graded Calculator"
      description="Compare your running performance across ages and genders. See your age-graded percentage and performance level."
      currentPath="/calculators/age-grade"
    >
      <div className="space-y-6 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <DistanceSelect
            label="Distance"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
            <input
              type="number"
              min={10}
              max={100}
              value={age}
              onChange={(e) => setAge(Number(e.target.value) || 35)}
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
        <>
          <h2 className="font-heading font-semibold text-lg text-gray-900 mb-4">Your Age-Graded Performance</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <ResultCard label="Age-Graded %" value={`${results.percentage}%`} highlight large />
            <ResultCard label="Age-Graded Time" value={results.ageGradedTime} sublabel="Equivalent open-age time" />
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 flex flex-col justify-center">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Performance Level</div>
              <div className={`font-heading font-bold text-xl ${getLevelColor(results.level)}`}>
                {results.level}
              </div>
            </div>
          </div>

          {/* Level scale */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Performance Scale</h3>
            <div className="space-y-2 text-sm">
              {[
                { level: "World Class", range: "90%+", color: "bg-purple-500" },
                { level: "National", range: "80-90%", color: "bg-blue-500" },
                { level: "Regional", range: "70-80%", color: "bg-orange-500" },
                { level: "Local", range: "60-70%", color: "bg-green-500" },
                { level: "Recreational", range: "< 60%", color: "bg-gray-400" },
              ].map((item) => (
                <div key={item.level} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="font-medium w-28">{item.level}</span>
                  <span className="text-gray-500">{item.range}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="mt-10 border-t border-gray-100 pt-8">
        <h3 className="font-heading font-semibold text-lg mb-3">What is Age Grading?</h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          Age grading adjusts your race time to account for your age, allowing fair comparison between runners of different ages. A 70% age-graded performance from a 50-year-old is equivalent to a 70% from a 25-year-old. The system uses World Masters Athletics (WMA) factors based on peak performance data.
        </p>
      </div>
    </CalculatorShell>
  );
}






