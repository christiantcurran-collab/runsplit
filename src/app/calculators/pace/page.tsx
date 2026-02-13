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
  calculatePace,
  calculatePaceSeconds,
  paceToSpeed,
  convertPace,
  formatTime,
  predictRaceTime,
  formatTimeFromSeconds,
  secondsToTime,
} from "@/lib/running-math";

export default function PaceCalculator() {
  const [distanceKey, setDistanceKey] = useState<string>("10k");
  const [customMeters, setCustomMeters] = useState(10000);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(50);
  const [seconds, setSeconds] = useState(0);
  const [unit, setUnit] = useState<"km" | "mile">("km");

  const distanceMeters =
    distanceKey === "custom"
      ? customMeters
      : DISTANCES[distanceKey as DistanceKey].meters;

  const totalSeconds = timeToSeconds({ hours, minutes, seconds });

  const results = useMemo(() => {
    if (totalSeconds <= 0 || distanceMeters <= 0) return null;

    const paceKm = calculatePace(distanceMeters, totalSeconds, "km");
    const paceMile = calculatePace(distanceMeters, totalSeconds, "mile");
    const paceSecsKm = calculatePaceSeconds(distanceMeters, totalSeconds, "km");
    const paceSecsMile = calculatePaceSeconds(distanceMeters, totalSeconds, "mile");
    const speedKmh = paceToSpeed(paceSecsKm);
    const speedMph = paceToSpeed(paceSecsMile);

    // Race predictions from this performance
    const predictions = Object.entries(DISTANCES).map(([, dist]) => ({
      name: dist.name,
      shortName: dist.shortName,
      time: formatTimeFromSeconds(
        predictRaceTime(distanceMeters, totalSeconds, dist.meters)
      ),
      pace: formatTime(
        secondsToTime(
          convertPace(
            calculatePaceSeconds(
              dist.meters,
              predictRaceTime(distanceMeters, totalSeconds, dist.meters),
              "km"
            ),
            "km",
            unit
          )
        )
      ),
    }));

    return {
      paceKm: formatTime(paceKm),
      paceMile: formatTime(paceMile),
      speedKmh: speedKmh.toFixed(1),
      speedMph: speedMph.toFixed(1),
      predictions,
    };
  }, [totalSeconds, distanceMeters, unit]);

  return (
    <CalculatorShell
      title="Pace Calculator"
      description="Calculate your running pace, speed, and finish time for any distance. Instant results — no button needed."
      currentPath="/calculators/pace"
    >
      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <DistanceSelect
          label="Distance"
          value={distanceKey}
          onChange={(key, meters) => {
            setDistanceKey(key);
            if (key === "custom") setCustomMeters(meters);
          }}
          customMeters={customMeters}
          onCustomChange={setCustomMeters}
        />
        <TimeInput
          label="Finish Time"
          hours={hours}
          minutes={minutes}
          seconds={seconds}
          onChange={(h, m, s) => {
            setHours(h);
            setMinutes(m);
            setSeconds(s);
          }}
        />
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading font-semibold text-lg text-gray-900">Your Pace</h2>
        <UnitToggle value={unit} onChange={setUnit} />
      </div>

      {/* Results */}
      {results && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <ResultCard label="Pace (min/km)" value={results.paceKm} highlight={unit === "km"} />
            <ResultCard label="Pace (min/mi)" value={results.paceMile} highlight={unit === "mile"} />
            <ResultCard label="Speed (km/h)" value={`${results.speedKmh}`} />
            <ResultCard label="Speed (mph)" value={`${results.speedMph}`} />
          </div>

          {/* Race predictions table */}
          <h3 className="font-heading font-semibold text-lg text-gray-900 mb-4">
            Equivalent Race Times
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Predicted finish times at other distances based on your performance (Riegel formula).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Distance</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Predicted Time</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">
                    Pace ({unit === "km" ? "min/km" : "min/mi"})
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.predictions.map((pred) => (
                  <tr key={pred.name} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-medium">{pred.name}</td>
                    <td className="py-2.5 px-3 time-display font-semibold">{pred.time}</td>
                    <td className="py-2.5 px-3 time-display text-gray-600">{pred.pace}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Explanation */}
      <div className="mt-10 border-t border-gray-100 pt-8">
        <h3 className="font-heading font-semibold text-lg mb-3">How to use the Pace Calculator</h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          Select a race distance (or enter a custom distance) and your finish time. The calculator instantly shows your pace in both min/km and min/mile, plus your speed in km/h and mph. It also predicts equivalent race times at other standard distances using the Riegel formula — the industry standard for race time prediction.
        </p>
        <h4 className="font-heading font-semibold text-sm mb-2">What is running pace?</h4>
        <p className="text-sm text-gray-600 leading-relaxed">
          Running pace is the time it takes to cover one unit of distance (one kilometre or one mile). For example, a pace of 5:00/km means you run each kilometre in 5 minutes. Pace is the most common way runners measure and communicate their speed.
        </p>
      </div>
    </CalculatorShell>
  );
}

