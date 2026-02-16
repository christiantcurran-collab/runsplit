"use client";

import { useState, useMemo } from "react";
import ToolShell from "@/components/ui/ToolShell";
import RaceTime from "@/components/ui/RaceTime";
import { calculateHRZones, estimateMaxHR } from "@/lib/running-math";

export default function HeartRateTool() {
  const [age, setAge] = useState(30);
  const [restingHR, setRestingHR] = useState(60);
  const [useEstimated, setUseEstimated] = useState(true);
  const [manualMaxHR, setManualMaxHR] = useState(190);

  const maxHR = useEstimated ? estimateMaxHR(age) : manualMaxHR;

  const zones = useMemo(() => {
    if (maxHR <= restingHR || maxHR <= 0) return null;
    return calculateHRZones(maxHR, restingHR);
  }, [maxHR, restingHR]);

  const zoneArray = zones ? [zones.zone1, zones.zone2, zones.zone3, zones.zone4, zones.zone5] : [];

  const inputs = (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Age</label>
        <input type="number" inputMode="numeric" min={10} max={100} value={age} onChange={(e) => setAge(Number(e.target.value) || 0)}
          className="w-full h-12 text-center font-mono text-xl bg-white/[0.08] border border-white/[0.12] text-white rounded-lg focus:outline-none focus:border-brand focus:shadow-glow transition-all" />
      </div>
      <div>
        <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Resting Heart Rate</label>
        <input type="number" inputMode="numeric" min={30} max={120} value={restingHR} onChange={(e) => setRestingHR(Number(e.target.value) || 0)}
          className="w-full h-12 text-center font-mono text-xl bg-white/[0.08] border border-white/[0.12] text-white rounded-lg focus:outline-none focus:border-brand focus:shadow-glow transition-all" />
        <p className="text-xs text-text-muted mt-1">bpm — measure when you first wake up</p>
      </div>
      <div>
        <label className="flex items-center gap-2 text-xs font-medium text-text-muted uppercase tracking-wider cursor-pointer">
          <input type="checkbox" checked={useEstimated} onChange={(e) => setUseEstimated(e.target.checked)} className="rounded" />
          Estimate Max HR from age
        </label>
        {!useEstimated && (
          <div className="mt-2">
            <input type="number" inputMode="numeric" min={100} max={230} value={manualMaxHR} onChange={(e) => setManualMaxHR(Number(e.target.value) || 190)}
              className="w-full h-12 text-center font-mono text-xl bg-white/[0.08] border border-white/[0.12] text-white rounded-lg focus:outline-none focus:border-brand focus:shadow-glow transition-all" />
          </div>
        )}
        <p className="text-xs text-text-muted mt-1">Estimated Max HR: {maxHR} bpm (Tanaka formula)</p>
      </div>
    </div>
  );

  return (
    <ToolShell title="My Heart Rate Zones" description="Calculate your 5 heart rate training zones using the Karvonen method (heart rate reserve)." currentPath="/tools/heart-rate" inputs={inputs}>
      {zones ? (
        <>
          <div className="text-center mb-6">
            <RaceTime value={`${maxHR} bpm`} size="lg" label="Max Heart Rate" />
          </div>
          <div className="space-y-3">
            {zoneArray.map((zone, i) => (
              <div key={zone.name} className="rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-stretch">
                  <div className="w-1.5 shrink-0" style={{ backgroundColor: zone.color }} />
                  <div className="flex-1 p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-heading font-semibold text-sm text-text-primary">Zone {i + 1}: {zone.name}</h3>
                    </div>
                    <div className="font-mono text-xl font-bold mb-1" style={{ color: zone.color }}>
                      {zone.min} – {zone.max} <span className="text-sm font-normal text-text-muted">bpm</span>
                    </div>
                    <p className="text-xs text-text-secondary">{zone.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-text-muted">
          <p className="text-lg">Enter your details to see your HR zones</p>
        </div>
      )}
    </ToolShell>
  );
}






