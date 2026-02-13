"use client";

import { motion } from "framer-motion";

const PACE_LEVELS = [
  { label: "WR", pacePerKm: 170, pos: 0 },
  { label: "Elite", pacePerKm: 210, pos: 15 },
  { label: "Sub-elite", pacePerKm: 250, pos: 30 },
  { label: "Club", pacePerKm: 300, pos: 50 },
  { label: "Recreational", pacePerKm: 370, pos: 70 },
];

function getDescription(pacePerKm: number): string {
  if (pacePerKm < 200) return "World class pace";
  if (pacePerKm < 240) return "Elite runner — top 1%";
  if (pacePerKm < 280) return "Sub-elite — highly competitive";
  if (pacePerKm < 320) return "Strong club runner — top 15%";
  if (pacePerKm < 360) return "Solid recreational runner";
  if (pacePerKm < 420) return "Committed recreational runner";
  if (pacePerKm < 480) return "Building fitness — great progress";
  return "Getting started — every run counts";
}

function paceToPosition(pacePerKm: number): number {
  const minPace = 160;
  const maxPace = 500;
  const clamped = Math.max(minPace, Math.min(maxPace, pacePerKm));
  return ((clamped - minPace) / (maxPace - minPace)) * 100;
}

function formatPace(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

interface PaceBarProps {
  pacePerKm: number;
  unit?: "km" | "mile";
  className?: string;
}

export default function PaceBar({ pacePerKm, unit = "km", className = "" }: PaceBarProps) {
  const displayPace = unit === "mile" ? pacePerKm * 1.60934 : pacePerKm;
  const position = paceToPosition(pacePerKm);
  const description = getDescription(pacePerKm);

  return (
    <div className={`w-full ${className}`}>
      {/* Bar */}
      <div className="relative mb-6">
        <div className="h-2 rounded-full pace-gradient" />

        {/* Marker */}
        <motion.div
          className="absolute top-1/2"
          style={{ left: `${position}%` }}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          key={pacePerKm}
        >
          <div className="w-[18px] h-[18px] -translate-x-1/2 -translate-y-1/2 bg-white border-[3px] border-brand rounded-full shadow-[0_2px_8px_rgba(59,130,246,0.3)]" />
        </motion.div>

        {/* Reference labels */}
        <div className="flex justify-between mt-2.5">
          {PACE_LEVELS.map((level) => (
            <span
              key={level.label}
              className="text-[10px] font-mono text-text-muted"
            >
              {level.label}
            </span>
          ))}
        </div>
      </div>

      {/* Value + description */}
      <div className="flex items-baseline gap-3">
        <span className="font-mono font-bold text-xl text-text-primary">
          {formatPace(displayPace)}/{unit}
        </span>
        <span className="text-sm text-text-secondary">
          {description}
        </span>
      </div>
    </div>
  );
}
