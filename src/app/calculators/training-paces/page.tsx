"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "@/components/ui/CalculatorShell";
import TimeInput from "@/components/ui/TimeInput";
import DistanceSelect from "@/components/ui/DistanceSelect";
import UnitToggle from "@/components/ui/UnitToggle";
import {
  DISTANCES,
  type DistanceKey,
  timeToSeconds,
  calculateTrainingPaces,
  formatTimeFromSeconds,
  convertPace,
  estimateVO2max,
} from "@/lib/running-math";

const ZONE_INFO = [
  { key: "easy" as const, name: "Easy / Recovery", color: "#22C55E", hrZone: "Zone 1-2", purpose: "Build aerobic base, promote recovery. Should feel conversational.", sample: "30-60 min easy run" },
  { key: "marathon" as const, name: "Marathon Pace", color: "#3B82F6", hrZone: "Zone 2-3", purpose: "Goal marathon effort, practise fuelling and sustained pace.", sample: "Marathon-pace long run segments" },
  { key: "threshold" as const, name: "Threshold / Tempo", color: "#EAB308", hrZone: "Zone 3-4", purpose: "Improve lactate threshold. Comfortably hard — you can speak in short phrases.", sample: "20-40 min tempo run or 3×10 min at threshold" },
  { key: "interval" as const, name: "Interval / VO2max", color: "#F97316", hrZone: "Zone 4-5", purpose: "Improve maximal oxygen uptake. Hard effort for 3-5 min repeats.", sample: "5×1000m with 400m jog recovery" },
  { key: "repetition" as const, name: "Repetition / Speed", color: "#EF4444", hrZone: "Zone 5", purpose: "Improve running economy and speed. Short, fast reps.", sample: "8×200m fast with full recovery" },
];

export default function TrainingPacesCalculator() {
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
      return {
        ...zone,
        paceRange: `${formatTimeFromSeconds(minPace)} - ${formatTimeFromSeconds(maxPace)}`,
        min: minPace,
        max: maxPace,
      };
    });

    return { paces: formatted, vo2max: vo2max.toFixed(1) };
  }, [totalSeconds, distanceMeters, unit]);

  return (
    <CalculatorShell
      title="Training Paces Calculator"
      description="Calculate your training zones from a recent race result. Get easy, tempo, interval and repetition paces."
      currentPath="/calculators/training-paces"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <DistanceSelect
          label="Recent Race Distance"
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

      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading font-semibold text-lg text-gray-900">
          Your Training Zones
          {results && <span className="ml-3 text-sm font-normal text-gray-500">Est. VO2max: {results.vo2max}</span>}
        </h2>
        <UnitToggle value={unit} onChange={setUnit} />
      </div>

      {results && (
        <div className="space-y-3">
          {results.paces.map((zone) => (
            <div
              key={zone.key}
              className="rounded-xl border border-gray-200 overflow-hidden"
            >
              <div className="flex items-stretch">
                <div className="w-2" style={{ backgroundColor: zone.color }} />
                <div className="flex-1 p-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-heading font-semibold text-sm">{zone.name}</h3>
                    <span className="text-xs text-gray-500">{zone.hrZone}</span>
                  </div>
                  <div className="time-display text-xl font-bold mb-2" style={{ color: zone.color }}>
                    {zone.paceRange}
                    <span className="text-sm font-normal text-gray-400 ml-1">/{unit}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{zone.purpose}</p>
                  <p className="text-xs text-gray-400">Example: {zone.sample}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 border-t border-gray-100 pt-8">
        <h3 className="font-heading font-semibold text-lg mb-3">About Training Zones</h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          Training paces are derived from your VO2max estimate (based on your race result). The 80/20 rule suggests ~80% of your running should be at easy pace, with ~20% in the harder zones. This approach builds your aerobic engine while limiting injury risk.
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">
          These zones are based on the methodology from Jack Daniels&apos; Running Formula, one of the most respected coaching frameworks. Your exact paces may vary — use them as guidelines and adjust by feel.
        </p>
      </div>
    </CalculatorShell>
  );
}





