"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface RaceTimeProps {
  value: string; // "3:32:15" or "4:45/km"
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  animate?: boolean;
  trend?: "up" | "down" | "neutral";
  label?: string;
  sublabel?: string;
}

const SIZE_MAP = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
  xl: "text-5xl sm:text-6xl",
  hero: "text-6xl sm:text-7xl",
};

function AnimatedDigit({ digit, size }: { digit: string; size: string }) {
  const isNumber = /\d/.test(digit);
  const num = isNumber ? parseInt(digit) : 0;
  const spring = useSpring(0, { stiffness: 120, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v).toString());
  const [displayVal, setDisplayVal] = useState(digit);

  useEffect(() => {
    if (isNumber) {
      spring.set(num);
      const unsub = display.on("change", (v) => setDisplayVal(v));
      return () => unsub();
    } else {
      setDisplayVal(digit);
    }
  }, [digit, num, isNumber, spring, display]);

  if (!isNumber) {
    return (
      <span className={`${size} font-mono text-text-muted opacity-60`}>
        {digit}
      </span>
    );
  }

  return (
    <span className={`${size} font-mono inline-block min-w-[0.65em] text-center`}>
      {displayVal}
    </span>
  );
}

export default function RaceTime({
  value,
  size = "md",
  animate = true,
  trend,
  label,
  sublabel,
}: RaceTimeProps) {
  const sizeClass = SIZE_MAP[size];
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="flex flex-col">
      {label && (
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
          {label}
        </span>
      )}
      <motion.div
        className={`font-mono font-bold ${sizeClass} tracking-tight text-text-primary leading-none`}
        initial={animate ? { opacity: 0, y: 8 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        key={value}
      >
        {animate
          ? value.split("").map((char, i) => (
              <AnimatedDigit key={`${i}-${char}`} digit={char} size={sizeClass} />
            ))
          : value}
      </motion.div>
      <div className="flex items-center gap-2 mt-1">
        {sublabel && (
          <span className="text-sm text-text-secondary">{sublabel}</span>
        )}
        {trend && trend !== "neutral" && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-medium ${
              trend === "down" ? "text-success" : "text-danger"
            }`}
          >
            {trend === "down" ? (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            )}
          </span>
        )}
      </div>
    </div>
  );
}



