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
  onClick?: () => void;
}

export default function ResultCard({
  label,
  value,
  sublabel,
  highlight = false,
  large = false,
  trend,
  delay = 0,
  onClick,
}: ResultCardProps) {
  return (
    <motion.div
      className={`rounded-xl p-5 transition-shadow hover:shadow-md ${
        highlight
          ? "bg-white border-2 border-brand shadow-glow"
          : "bg-white border border-[#E4E4E8] shadow-sm"
      } ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay }}
    >
      <div className="font-mono text-[10px] uppercase tracking-[2px] text-text-muted mb-2">
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
            className={`inline-flex items-center gap-0.5 font-mono text-[11px] font-medium ${
              trend === "down" ? "text-success" : "text-danger"
            }`}
          >
            {trend === "down" ? "↗ " : "↘ "}
            {trend === "down" ? "Improving" : "Slower"}
          </span>
        )}
      </div>
    </motion.div>
  );
}
