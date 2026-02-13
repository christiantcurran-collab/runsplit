"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "@/components/ui/CalculatorShell";
import ResultCard from "@/components/ui/ResultCard";
import {
  calculateHRZones,
  estimateMaxHR,
  type HRZone,
} from "@/lib/running-math";

export default function HeartRateZonesCalculator() {
  const [knowMaxHR, setKnowMaxHR] = useState(true);
  const [maxHR, setMaxHR] = useState(185);
  const [age, setAge] = useState(30);
  const [restingHR, setRestingHR] = useState(60);

  const effectiveMaxHR = knowMaxHR ? maxHR : estimateMaxHR(age);

  const zones = useMemo(() => {
    if (effectiveMaxHR <= 0 || restingHR <= 0 || restingHR >= effectiveMaxHR) return null;
    return calculateHRZones(effectiveMaxHR, restingHR);
  }, [effectiveMaxHR, restingHR]);

  const zoneArray: { key: string; zone: HRZone; pct: string }[] = zones
    ? [
        { key: "1", zone: zones.zone1, pct: "50-60%" },
        { key: "2", zone: zones.zone2, pct: "60-70%" },
        { key: "3", zone: zones.zone3, pct: "70-80%" },
        { key: "4", zone: zones.zone4, pct: "80-90%" },
        { key: "5", zone: zones.zone5, pct: "90-100%" },
      ]
    : [];

  return (
    <CalculatorShell
      title="Heart Rate Zone Calculator"
      description="Calculate your 5 heart rate training zones using the Karvonen method (heart rate reserve)."
      currentPath="/calculators/heart-rate-zones"
    >
      <div className="space-y-6 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Heart Rate</label>
            <div className="flex items-center gap-3 mb-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={knowMaxHR}
                  onChange={() => setKnowMaxHR(true)}
                  className="text-brand-orange focus:ring-brand-orange"
                />
                I know my max HR
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={!knowMaxHR}
                  onChange={() => setKnowMaxHR(false)}
                  className="text-brand-orange focus:ring-brand-orange"
                />
                Estimate from age
              </label>
            </div>
            {knowMaxHR ? (
              <input
                type="number"
                min={100}
                max={230}
                value={maxHR}
                onChange={(e) => setMaxHR(Number(e.target.value) || 185)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                placeholder="e.g. 185"
              />
            ) : (
              <div>
                <input
                  type="number"
                  min={10}
                  max={100}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value) || 30)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  placeholder="Your age"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Estimated max HR (Tanaka): <span className="font-mono font-semibold">{effectiveMaxHR} bpm</span>
                </p>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Resting Heart Rate</label>
            <input
              type="number"
              min={30}
              max={120}
              value={restingHR}
              onChange={(e) => setRestingHR(Number(e.target.value) || 60)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
              placeholder="e.g. 60"
            />
            <p className="text-xs text-gray-500 mt-1">Measure first thing in the morning for accuracy</p>
          </div>
        </div>
      </div>

      {zones && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            <ResultCard label="Max HR" value={`${effectiveMaxHR} bpm`} />
            <ResultCard label="Resting HR" value={`${restingHR} bpm`} />
            <ResultCard label="HR Reserve" value={`${effectiveMaxHR - restingHR} bpm`} highlight />
          </div>

          <h2 className="font-heading font-semibold text-lg text-gray-900 mb-4">Your Heart Rate Zones</h2>
          <div className="space-y-3">
            {zoneArray.map(({ key, zone, pct }) => (
              <div key={key} className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-stretch">
                  <div className="w-2" style={{ backgroundColor: zone.color }} />
                  <div className="flex-1 p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-heading font-semibold text-sm">
                        Zone {key}: {zone.name}
                      </h3>
                      <span className="text-xs text-gray-500">{pct} HRR</span>
                    </div>
                    <div className="time-display text-xl font-bold mb-1" style={{ color: zone.color }}>
                      {zone.min} — {zone.max} <span className="text-sm font-normal text-gray-400">bpm</span>
                    </div>
                    <p className="text-xs text-gray-500">{zone.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-10 border-t border-gray-100 pt-8">
        <h3 className="font-heading font-semibold text-lg mb-3">About Heart Rate Training</h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          The <strong>Karvonen method</strong> uses heart rate reserve (HRR = max HR − resting HR) to calculate zones. This is more accurate than simple % of max HR because it accounts for your individual fitness level via resting heart rate.
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">
          If you don&apos;t know your max HR, the Tanaka formula (208 − 0.7 × age) is the most widely validated estimate. A true max HR test is more accurate but requires maximal effort.
        </p>
      </div>
    </CalculatorShell>
  );
}

