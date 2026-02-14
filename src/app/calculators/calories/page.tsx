"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "@/components/ui/CalculatorShell";
import ResultCard from "@/components/ui/ResultCard";
import { calculateCalories } from "@/lib/running-math";

export default function CaloriesCalculator() {
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");
  const [weight, setWeight] = useState(70);
  const [distanceUnit, setDistanceUnit] = useState<"km" | "miles">("km");
  const [distance, setDistance] = useState(10);
  const [paceMin, setPaceMin] = useState(5);
  const [paceSec, setPaceSec] = useState(30);

  const weightKg = weightUnit === "lbs" ? weight * 0.453592 : weight;
  const distanceKm = distanceUnit === "miles" ? distance * 1.60934 : distance;
  const paceMinPerKm = distanceUnit === "miles"
    ? (paceMin + paceSec / 60) / 1.60934
    : paceMin + paceSec / 60;

  const results = useMemo(() => {
    if (weightKg <= 0 || distanceKm <= 0 || paceMinPerKm <= 0) return null;
    const calories = calculateCalories(weightKg, distanceKm, paceMinPerKm);
    const durationMin = distanceKm * paceMinPerKm;
    const calPerKm = Math.round(calories / distanceKm);
    const calPerMile = Math.round(calories / (distanceKm / 1.60934));
    return {
      calories,
      duration: `${Math.floor(durationMin / 60)}h ${Math.round(durationMin % 60)}m`,
      calPerKm,
      calPerMile,
    };
  }, [weightKg, distanceKm, paceMinPerKm]);

  return (
    <CalculatorShell
      title="Calories Burned Calculator"
      description="Estimate calories burned while running based on your weight, distance, and pace."
      currentPath="/calculators/calories"
    >
      <div className="space-y-6 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Body Weight</label>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value) || 0)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
              />
              <select
                value={weightUnit}
                onChange={(e) => setWeightUnit(e.target.value as "kg" | "lbs")}
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white"
              >
                <option value="kg">kg</option>
                <option value="lbs">lbs</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Distance</label>
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                step={0.1}
                value={distance}
                onChange={(e) => setDistance(Number(e.target.value) || 0)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
              />
              <select
                value={distanceUnit}
                onChange={(e) => setDistanceUnit(e.target.value as "km" | "miles")}
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white"
              >
                <option value="km">km</option>
                <option value="miles">miles</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pace (per {distanceUnit === "km" ? "km" : "mile"})
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={30}
              value={paceMin}
              onChange={(e) => setPaceMin(Number(e.target.value) || 0)}
              className="w-20 text-center font-mono text-lg border border-gray-300 rounded-lg px-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
              placeholder="MM"
            />
            <span className="text-gray-400 font-mono text-xl font-bold">:</span>
            <input
              type="number"
              min={0}
              max={59}
              value={paceSec}
              onChange={(e) => setPaceSec(Number(e.target.value) || 0)}
              className="w-20 text-center font-mono text-lg border border-gray-300 rounded-lg px-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
              placeholder="SS"
            />
            <span className="text-sm text-gray-500 ml-2">per {distanceUnit === "km" ? "km" : "mile"}</span>
          </div>
        </div>
      </div>

      {results && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <ResultCard label="Calories Burned" value={`${results.calories}`} highlight large sublabel="kcal" />
          <ResultCard label="Duration" value={results.duration} />
          <ResultCard label="Cal / km" value={`${results.calPerKm}`} />
          <ResultCard label="Cal / mile" value={`${results.calPerMile}`} />
        </div>
      )}

      <div className="mt-10 border-t border-gray-100 pt-8">
        <h3 className="font-heading font-semibold text-lg mb-3">How Calorie Estimation Works</h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          This calculator uses MET (Metabolic Equivalent of Task) values from the Compendium of Physical Activities. Different paces have different MET values — faster running burns more calories per minute but also takes less time per unit of distance.
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">
          <strong>Note:</strong> Calorie estimates are approximations. Actual calorie burn depends on many factors including terrain, temperature, wind, running efficiency, and individual metabolism. Use these figures as a guide, not an exact measurement.
        </p>
      </div>
    </CalculatorShell>
  );
}


