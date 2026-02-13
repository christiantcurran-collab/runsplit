"use client";

import { motion } from "framer-motion";

interface ResultCardProps {
  label: string;
  value: string;
  sublabel?: string;
  highlight?: boolean;
  large?: boolean;
  trend?: "up" | "down" | "neutral";
  delay?: number;
}

export default function ResultCard({
  label,
  value,
  sublabel,
  highlight = false,
  large = false,
  trend,
  delay = 0,
}: ResultCardProps) {
  return (
    <motion.div
      className={`rounded-xl p-5 transition-shadow hover:shadow-md ${
        highlight
          ? "bg-white border-2 border-brand shadow-glow"
          : "bg-white border border-gray-100 shadow-sm"
      }`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay }}
    >
      <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
        {label}
      </div>
      <div
        className={`font-mono font-bold leading-none ${
          large ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl"
        } ${highlight ? "text-brand" : "text-text-primary"}`}
      >
        {value}
      </div>
      <div className="flex items-center gap-2 mt-2">
        {sublabel && (
          <span className="text-xs text-text-secondary">{sublabel}</span>
        )}
        {trend && trend !== "neutral" && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-medium ${
              trend === "down" ? "text-success" : "text-danger"
            }`}
          >
            {trend === "down" ? "▼" : "▲"}
          </span>
        )}
      </div>
    </motion.div>
  );
}
