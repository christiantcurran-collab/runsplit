"use client";

import { motion } from "framer-motion";

// Reference paces (seconds per km) for different levels
const PACE_LEVELS = [
  { label: "World Record", pacePerKm: 170, pos: 0 },    // ~2:50/km
  { label: "Elite", pacePerKm: 210, pos: 15 },           // ~3:30/km
  { label: "Sub-elite", pacePerKm: 250, pos: 30 },       // ~4:10/km
  { label: "Club", pacePerKm: 300, pos: 50 },            // ~5:00/km
  { label: "Recreational", pacePerKm: 370, pos: 70 },    // ~6:10/km
  { label: "Beginner", pacePerKm: 450, pos: 90 },        // ~7:30/km
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
  // Map pace to 0-100% position (faster = left, slower = right)
  const minPace = 160; // fastest (WR-ish)
  const maxPace = 500; // slowest shown
  const clamped = Math.max(minPace, Math.min(maxPace, pacePerKm));
  return ((clamped - minPace) / (maxPace - minPace)) * 100;
}

function formatPace(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

interface PaceBarProps {
  pacePerKm: number; // seconds per km
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
        <div className="h-3 rounded-full pace-gradient" />

        {/* Marker */}
        <motion.div
          className="absolute top-0"
          style={{ left: `${position}%` }}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          key={pacePerKm}
        >
          <div className="relative -translate-x-1/2">
            {/* Triangle */}
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-bg-dark mx-auto -mb-0.5" />
            {/* Dot on bar */}
            <div className="w-4 h-4 rounded-full bg-bg-dark border-2 border-white shadow-md mx-auto -mt-1" />
          </div>
        </motion.div>

        {/* Reference labels */}
        <div className="relative mt-2">
          {PACE_LEVELS.filter((_, i) => i % 2 === 0).map((level) => (
            <span
              key={level.label}
              className="absolute text-[10px] text-text-muted -translate-x-1/2 whitespace-nowrap"
              style={{ left: `${level.pos}%` }}
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

