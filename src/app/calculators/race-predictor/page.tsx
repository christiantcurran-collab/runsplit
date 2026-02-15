"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "@/components/ui/CalculatorShell";
import TimeInput from "@/components/ui/TimeInput";
import DistanceSelect from "@/components/ui/DistanceSelect";
import UnitToggle from "@/components/ui/UnitToggle";
import ResultCard from "@/components/ui/ResultCard";
import {
  DISTANCES,
  type DistanceKey,
  timeToSeconds,
  predictRaceTime,
  predictRaceTimeCameron,
  calculatePace,
  formatTime,
  formatTimeFromSeconds,
} from "@/lib/running-math";

export default function RacePredictor() {
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
    const conservative = predictRaceTime(knownMeters, totalSeconds, targetMeters, 1.10);
    const aggressive = predictRaceTime(knownMeters, totalSeconds, targetMeters, 1.04);

    const allPredictions = Object.entries(DISTANCES).map(([, dist]) => ({
      name: dist.name,
      riegel: formatTimeFromSeconds(predictRaceTime(knownMeters, totalSeconds, dist.meters, fatigueFactor)),
      pace: formatTime(calculatePace(dist.meters, predictRaceTime(knownMeters, totalSeconds, dist.meters, fatigueFactor), unit)),
    }));

    return {
      riegel: formatTimeFromSeconds(riegel),
      cameron: formatTimeFromSeconds(cameron),
      conservative: formatTimeFromSeconds(conservative),
      aggressive: formatTimeFromSeconds(aggressive),
      riegelPace: formatTime(calculatePace(targetMeters, riegel, unit)),
      allPredictions,
    };
  }, [totalSeconds, knownMeters, targetMeters, fatigueFactor, unit]);

  return (
    <CalculatorShell
      title="Race Time Predictor"
      description="Predict your finish time for any race distance based on a recent result. Uses Riegel and Cameron formulas."
      currentPath="/calculators/race-predictor"
    >
      <div className="space-y-6 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <DistanceSelect
            label="Your Recent Race Distance"
            value={knownDistKey}
            onChange={(key, meters) => { setKnownDistKey(key); if (key === "custom") setKnownCustom(meters); }}
            customMeters={knownCustom}
            onCustomChange={setKnownCustom}
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
          <DistanceSelect
            label="Target Race Distance"
            value={targetDistKey}
            onChange={(key, meters) => { setTargetDistKey(key); if (key === "custom") setTargetCustom(meters); }}
            customMeters={targetCustom}
            onCustomChange={setTargetCustom}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value as "beginner" | "intermediate" | "advanced")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white"
            >
              <option value="beginner">Beginner (conservative)</option>
              <option value="intermediate">Intermediate (standard)</option>
              <option value="advanced">Advanced (aggressive)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading font-semibold text-lg text-gray-900">Predicted Times</h2>
        <UnitToggle value={unit} onChange={setUnit} />
      </div>

      {results && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <ResultCard label="Riegel Prediction" value={results.riegel} highlight sublabel={`Pace: ${results.riegelPace}/${unit}`} />
            <ResultCard label="Cameron Prediction" value={results.cameron} />
            <ResultCard label="Conservative" value={results.conservative} sublabel="Fatigue factor: 1.10" />
            <ResultCard label="Aggressive" value={results.aggressive} sublabel="Fatigue factor: 1.04" />
          </div>

          <h3 className="font-heading font-semibold text-lg text-gray-900 mb-4">All Distance Predictions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Distance</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Predicted Time</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Pace ({unit === "km" ? "min/km" : "min/mi"})</th>
                </tr>
              </thead>
              <tbody>
                {results.allPredictions.map((pred) => (
                  <tr key={pred.name} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-medium">{pred.name}</td>
                    <td className="py-2.5 px-3 time-display font-semibold">{pred.riegel}</td>
                    <td className="py-2.5 px-3 time-display text-gray-600">{pred.pace}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="mt-10 border-t border-gray-100 pt-8">
        <h3 className="font-heading font-semibold text-lg mb-3">How Race Prediction Works</h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          The <strong>Riegel formula</strong> (T2 = T1 × (D2/D1)^1.06) is the most widely used race prediction model. It accounts for the fact that you slow down proportionally as distance increases. The fatigue factor (exponent) can be adjusted: beginners typically slow more at longer distances.
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">
          The <strong>Cameron formula</strong> is an alternative that some runners find more accurate for very long distances. We show both so you can compare. Your actual result will depend on training, nutrition, weather, and race-day execution.
        </p>
      </div>
    </CalculatorShell>
  );
}



