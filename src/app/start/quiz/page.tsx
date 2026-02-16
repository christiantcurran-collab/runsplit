"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export interface QuizData {
  goal?: "race" | "faster" | "consistent" | "comeback" | "fitness";
  raceDistance?: string;
  raceDate?: string;
  targetTime?: number | null; // seconds
  justFinish?: boolean;
  experienceLevel?: "new" | "sometimes" | "regular" | "serious";
  benchmarkType?: "manual" | "none";
  benchmarkDistance?: number; // km
  benchmarkTime?: number; // seconds
  daysPerWeek?: number;
  excludedDays?: string[];
  longRunDay?: string;
  additionalContext?: string[];
  freeText?: string;
}

const STEP_ANIM = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.25 },
};

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg-dark flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <QuizContent />
    </Suspense>
  );
}

function QuizContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialGoal = searchParams.get("goal") || "";

  const [step, setStep] = useState(0);
  const [data, setData] = useState<QuizData>(() => {
    const goalMap: Record<string, QuizData["goal"]> = {
      "5k": "race",
      "10k": "race",
      half: "race",
      marathon: "race",
      ultra: "race",
      fitness: "fitness",
    };
    const distMap: Record<string, string> = {
      "5k": "5k",
      "10k": "10k",
      half: "half_marathon",
      marathon: "marathon",
      ultra: "custom",
    };
    return {
      goal: goalMap[initialGoal] || undefined,
      raceDistance: distMap[initialGoal] || undefined,
    };
  });

  // Assessment state
  const [assessing, setAssessing] = useState(false);
  const [assessment, setAssessment] = useState<{
    score: number;
    scoreLabel: string;
    predictions: Record<string, number> | null;
    trainingPaces: Record<string, string> | null;
    assessment: string;
    weeksTilRace: number | null;
    vdot: number | null;
  } | null>(null);
  const [assessError, setAssessError] = useState("");

  const update = useCallback((u: Partial<QuizData>) => {
    setData((prev) => ({ ...prev, ...u }));
  }, []);

  const next = useCallback(() => setStep((s) => s + 1), []);
  const back = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);

  // Build dynamic step list
  const steps = buildSteps(data);
  const totalSteps = steps.length;
  const currentStep = steps[step];

  // When reaching assessment step, fire API call
  useEffect(() => {
    if (currentStep === "assessment" && !assessment && !assessing) {
      runAssessment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  async function runAssessment() {
    setAssessing(true);
    setAssessError("");
    try {
      const res = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Assessment failed");
      const result = await res.json();
      setAssessment(result);
    } catch (err) {
      setAssessError(
        err instanceof Error ? err.message : "Failed to generate assessment"
      );
    } finally {
      setAssessing(false);
    }
  }

  // Save quiz data to localStorage for post-signup retrieval
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("runsplit_quiz_data", JSON.stringify(data));
    }
  }, [data]);

  return (
    <div className="min-h-screen bg-bg-dark text-text-on-dark flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4">
        <Link href="/start" className="inline-flex items-center gap-2">
          <div className="w-5 h-[2.5px] bg-brand rounded-sm" />
          <span className="font-heading font-bold text-sm text-text-on-dark">RunSplit</span>
        </Link>
        <span className="text-xs text-text-dark-muted font-mono">
          {step + 1} / {totalSteps}
        </span>
      </header>

      {/* Progress bar */}
      <div className="px-5 mb-6">
        <div className="w-full bg-bg-dark-border rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand to-brand-hover rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {currentStep === "goal" && (
              <motion.div key="goal" {...STEP_ANIM}>
                <GoalStep data={data} update={update} onNext={next} />
              </motion.div>
            )}
            {currentStep === "race_details" && (
              <motion.div key="race" {...STEP_ANIM}>
                <RaceDetailsStep data={data} update={update} onNext={next} onBack={back} />
              </motion.div>
            )}
            {currentStep === "fitness" && (
              <motion.div key="fitness" {...STEP_ANIM}>
                <FitnessStep data={data} update={update} onNext={next} onBack={back} />
              </motion.div>
            )}
            {currentStep === "benchmark" && (
              <motion.div key="bench" {...STEP_ANIM}>
                <BenchmarkStep data={data} update={update} onNext={next} onBack={back} />
              </motion.div>
            )}
            {currentStep === "availability" && (
              <motion.div key="avail" {...STEP_ANIM}>
                <AvailabilityStep data={data} update={update} onNext={next} onBack={back} />
              </motion.div>
            )}
            {currentStep === "context" && (
              <motion.div key="ctx" {...STEP_ANIM}>
                <ContextStep data={data} update={update} onNext={next} onBack={back} />
              </motion.div>
            )}
            {currentStep === "assessment" && (
              <motion.div key="assess" {...STEP_ANIM}>
                <AssessmentView
                  loading={assessing}
                  error={assessError}
                  assessment={assessment}
                  data={data}
                  onRetry={runAssessment}
                  onViewPreview={() => router.push("/start/preview")}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function buildSteps(data: QuizData): string[] {
  const steps = ["goal"];
  if (data.goal === "race" || data.goal === "faster") steps.push("race_details");
  steps.push("fitness", "benchmark", "availability", "context", "assessment");
  return steps;
}

/* ──────────── INDIVIDUAL STEPS ──────────── */

interface StepProps {
  data: QuizData;
  update: (u: Partial<QuizData>) => void;
  onNext: () => void;
  onBack?: () => void;
}

function GoalStep({ data, update, onNext }: StepProps) {
  const goals: { value: QuizData["goal"]; icon: string; label: string }[] = [
    { value: "race", icon: "🏁", label: "Train for a race" },
    { value: "faster", icon: "⚡", label: "Get faster" },
    { value: "consistent", icon: "🏃", label: "Run more consistently" },
    { value: "comeback", icon: "🔄", label: "Come back from a break" },
    { value: "fitness", icon: "💪", label: "General fitness" },
  ];

  return (
    <div>
      <h2 className="font-heading font-bold text-2xl mb-2">What&apos;s your running goal?</h2>
      <p className="text-text-dark-sec text-sm mb-6">This helps your AI coach build the right plan.</p>
      <div className="space-y-2.5">
        {goals.map((g) => (
          <button
            key={g.value}
            onClick={() => {
              update({ goal: g.value });
              setTimeout(onNext, 200);
            }}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
              data.goal === g.value
                ? "border-brand bg-brand/10"
                : "border-bg-dark-border hover:border-brand/40"
            }`}
          >
            <span className="text-xl">{g.icon}</span>
            <span className="font-semibold text-sm">{g.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function RaceDetailsStep({ data, update, onNext, onBack }: StepProps) {
  const distances = [
    { value: "5k", label: "5K" },
    { value: "10k", label: "10K" },
    { value: "half_marathon", label: "Half Marathon" },
    { value: "marathon", label: "Marathon" },
    { value: "custom", label: "Ultra / Other" },
  ];

  const [targetH, setTargetH] = useState(0);
  const [targetM, setTargetM] = useState(0);
  const [targetS, setTargetS] = useState(0);

  const handleNext = () => {
    const secs = targetH * 3600 + targetM * 60 + targetS;
    update({ targetTime: secs > 0 ? secs : null });
    onNext();
  };

  return (
    <div>
      <h2 className="font-heading font-bold text-2xl mb-2">Tell us about your race</h2>
      <p className="text-text-dark-sec text-sm mb-6">Or the distance you want to get faster at.</p>

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-text-dark-muted mb-2 uppercase tracking-wide">
            Distance
          </label>
          <div className="flex flex-wrap gap-2">
            {distances.map((d) => (
              <button
                key={d.value}
                onClick={() => update({ raceDistance: d.value })}
                className={`px-4 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all ${
                  data.raceDistance === d.value
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-bg-dark-border text-text-dark-sec hover:border-brand/40"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {data.goal === "race" && (
          <div>
            <label className="block text-xs font-medium text-text-dark-muted mb-2 uppercase tracking-wide">
              When is it?
            </label>
            <input
              type="date"
              value={data.raceDate || ""}
              onChange={(e) => update({ raceDate: e.target.value })}
              className="w-full bg-bg-dark-input border border-bg-dark-border text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-text-dark-muted mb-2 uppercase tracking-wide">
            Target time (optional)
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={99}
              value={targetH}
              onChange={(e) => setTargetH(Number(e.target.value) || 0)}
              className="w-16 text-center font-mono text-lg bg-bg-dark-input border border-bg-dark-border text-white rounded-lg px-2 py-2 focus:outline-none focus:border-brand"
              placeholder="H"
            />
            <span className="text-text-dark-muted font-mono text-lg">:</span>
            <input
              type="number"
              min={0}
              max={59}
              value={targetM}
              onChange={(e) => setTargetM(Math.min(59, Number(e.target.value) || 0))}
              className="w-16 text-center font-mono text-lg bg-bg-dark-input border border-bg-dark-border text-white rounded-lg px-2 py-2 focus:outline-none focus:border-brand"
              placeholder="M"
            />
            <span className="text-text-dark-muted font-mono text-lg">:</span>
            <input
              type="number"
              min={0}
              max={59}
              value={targetS}
              onChange={(e) => setTargetS(Math.min(59, Number(e.target.value) || 0))}
              className="w-16 text-center font-mono text-lg bg-bg-dark-input border border-bg-dark-border text-white rounded-lg px-2 py-2 focus:outline-none focus:border-brand"
              placeholder="S"
            />
          </div>
          <button
            onClick={() => {
              update({ justFinish: true, targetTime: null });
            }}
            className={`mt-2 text-xs font-medium transition-colors ${
              data.justFinish ? "text-brand" : "text-text-dark-muted hover:text-brand"
            }`}
          >
            I just want to finish ✓
          </button>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        {onBack && (
          <button onClick={onBack} className="flex-1 border border-bg-dark-border text-text-dark-sec font-semibold py-3 rounded-xl hover:bg-bg-dark-card transition-colors">
            ← Back
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!data.raceDistance}
          className="flex-1 bg-brand hover:bg-brand-hover text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

function FitnessStep({ data, update, onNext, onBack }: StepProps) {
  const levels: { value: QuizData["experienceLevel"]; icon: string; label: string; desc: string }[] = [
    { value: "new", icon: "🌱", label: "New to running", desc: "0–3 months" },
    { value: "sometimes", icon: "🚶", label: "I run sometimes", desc: "1–2 times a week" },
    { value: "regular", icon: "🏃", label: "I run regularly", desc: "3–4 times a week" },
    { value: "serious", icon: "🔥", label: "I train seriously", desc: "5+ times a week" },
  ];

  return (
    <div>
      <h2 className="font-heading font-bold text-2xl mb-2">Where are you at right now?</h2>
      <p className="text-text-dark-sec text-sm mb-6">Be honest — this helps us set the right paces.</p>
      <div className="space-y-2.5">
        {levels.map((l) => (
          <button
            key={l.value}
            onClick={() => {
              update({ experienceLevel: l.value });
              setTimeout(onNext, 200);
            }}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
              data.experienceLevel === l.value
                ? "border-brand bg-brand/10"
                : "border-bg-dark-border hover:border-brand/40"
            }`}
          >
            <span className="text-xl">{l.icon}</span>
            <div>
              <span className="font-semibold text-sm block">{l.label}</span>
              <span className="text-xs text-text-dark-muted">{l.desc}</span>
            </div>
          </button>
        ))}
      </div>
      {onBack && (
        <button onClick={onBack} className="mt-4 text-sm text-text-dark-muted hover:text-brand transition-colors">
          ← Back
        </button>
      )}
    </div>
  );
}

function BenchmarkStep({ update, onNext, onBack }: StepProps) {
  const [dist, setDist] = useState(5);
  const [h, setH] = useState(0);
  const [m, setM] = useState(25);
  const [s, setS] = useState(0);
  const [mode, setMode] = useState<"manual" | "none">("manual");

  const handleNext = () => {
    if (mode === "manual") {
      const secs = h * 3600 + m * 60 + s;
      update({ benchmarkType: "manual", benchmarkDistance: dist, benchmarkTime: secs });
    } else {
      update({ benchmarkType: "none", benchmarkDistance: undefined, benchmarkTime: undefined });
    }
    onNext();
  };

  return (
    <div>
      <h2 className="font-heading font-bold text-2xl mb-2">Share a recent run</h2>
      <p className="text-text-dark-sec text-sm mb-6">This lets our AI understand your current fitness.</p>

      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setMode("manual")}
          className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all ${
            mode === "manual" ? "border-brand bg-brand/10 text-brand" : "border-bg-dark-border text-text-dark-sec"
          }`}
        >
          Enter manually
        </button>
        <button
          onClick={() => setMode("none")}
          className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all ${
            mode === "none" ? "border-brand bg-brand/10 text-brand" : "border-bg-dark-border text-text-dark-sec"
          }`}
        >
          Skip this
        </button>
      </div>

      {mode === "manual" && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-dark-muted mb-2 uppercase tracking-wide">
              Distance (km)
            </label>
            <div className="flex gap-2">
              {[5, 10, 21.1].map((d) => (
                <button
                  key={d}
                  onClick={() => setDist(d)}
                  className={`px-4 py-2 rounded-lg border-2 text-sm font-semibold ${
                    dist === d ? "border-brand text-brand" : "border-bg-dark-border text-text-dark-sec"
                  }`}
                >
                  {d === 21.1 ? "Half" : `${d}K`}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-dark-muted mb-2 uppercase tracking-wide">
              Time
            </label>
            <div className="flex items-center gap-1">
              <input type="number" min={0} value={h} onChange={(e) => setH(Number(e.target.value) || 0)}
                className="w-16 text-center font-mono text-lg bg-bg-dark-input border border-bg-dark-border text-white rounded-lg px-2 py-2 focus:outline-none focus:border-brand" />
              <span className="text-text-dark-muted font-mono text-lg">:</span>
              <input type="number" min={0} max={59} value={m} onChange={(e) => setM(Math.min(59, Number(e.target.value) || 0))}
                className="w-16 text-center font-mono text-lg bg-bg-dark-input border border-bg-dark-border text-white rounded-lg px-2 py-2 focus:outline-none focus:border-brand" />
              <span className="text-text-dark-muted font-mono text-lg">:</span>
              <input type="number" min={0} max={59} value={s} onChange={(e) => setS(Math.min(59, Number(e.target.value) || 0))}
                className="w-16 text-center font-mono text-lg bg-bg-dark-input border border-bg-dark-border text-white rounded-lg px-2 py-2 focus:outline-none focus:border-brand" />
            </div>
          </div>
        </div>
      )}

      {mode === "none" && (
        <p className="text-sm text-text-dark-sec bg-bg-dark-card border border-bg-dark-border rounded-lg p-4">
          That&apos;s fine — we&apos;ll estimate from your experience level and build a plan from there.
        </p>
      )}

      <div className="flex gap-3 mt-8">
        {onBack && (
          <button onClick={onBack} className="flex-1 border border-bg-dark-border text-text-dark-sec font-semibold py-3 rounded-xl hover:bg-bg-dark-card transition-colors">
            ← Back
          </button>
        )}
        <button onClick={handleNext} className="flex-1 bg-brand hover:bg-brand-hover text-white font-semibold py-3 rounded-xl transition-colors">
          Next →
        </button>
      </div>
    </div>
  );
}

function AvailabilityStep({ data, update, onNext, onBack }: StepProps) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const [daysPerWeek, setDays] = useState(data.daysPerWeek || 3);
  const [excluded, setExcluded] = useState<string[]>(data.excludedDays || []);
  const [longRunDay, setLongRunDay] = useState(data.longRunDay || "Sunday");

  const handleNext = () => {
    update({ daysPerWeek, excludedDays: excluded, longRunDay });
    onNext();
  };

  const toggleExcluded = (day: string) => {
    setExcluded((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  return (
    <div>
      <h2 className="font-heading font-bold text-2xl mb-2">How many days can you run?</h2>
      <p className="text-text-dark-sec text-sm mb-6">We&apos;ll build your plan around your schedule.</p>

      <div className="space-y-5">
        <div>
          <div className="flex gap-2">
            {[2, 3, 4, 5, 6].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`flex-1 py-3 rounded-lg border-2 text-sm font-bold transition-all ${
                  daysPerWeek === d
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-bg-dark-border text-text-dark-sec"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-dark-muted mb-2 uppercase tracking-wide">
            Days that don&apos;t work (tap to exclude)
          </label>
          <div className="flex flex-wrap gap-2">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => toggleExcluded(day)}
                className={`px-3 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                  excluded.includes(day)
                    ? "border-red-400 bg-red-500/10 text-red-400"
                    : "border-bg-dark-border text-text-dark-sec hover:border-brand/40"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-dark-muted mb-2 uppercase tracking-wide">
            Long run preference
          </label>
          <div className="flex gap-2">
            {["Saturday", "Sunday", "Either"].map((d) => (
              <button
                key={d}
                onClick={() => setLongRunDay(d)}
                className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all ${
                  longRunDay === d
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-bg-dark-border text-text-dark-sec"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        {onBack && (
          <button onClick={onBack} className="flex-1 border border-bg-dark-border text-text-dark-sec font-semibold py-3 rounded-xl hover:bg-bg-dark-card transition-colors">
            ← Back
          </button>
        )}
        <button onClick={handleNext} className="flex-1 bg-brand hover:bg-brand-hover text-white font-semibold py-3 rounded-xl transition-colors">
          Next →
        </button>
      </div>
    </div>
  );
}

function ContextStep({ data, update, onNext, onBack }: StepProps) {
  const [contexts, setContexts] = useState<string[]>(data.additionalContext || []);
  const [freeText, setFreeText] = useState(data.freeText || "");

  const toggleCtx = (c: string) => {
    setContexts((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const handleNext = () => {
    update({ additionalContext: contexts, freeText: freeText.trim() || undefined });
    onNext();
  };

  const contextOptions = [
    "Previous injuries",
    "Coming back after time off",
    "I also do other sports",
    "Busy schedule",
  ];

  return (
    <div>
      <h2 className="font-heading font-bold text-2xl mb-2">Anything your coach should know?</h2>
      <p className="text-text-dark-sec text-sm mb-6">Optional, but helps us personalise your plan.</p>

      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {contextOptions.map((c) => (
            <button
              key={c}
              onClick={() => toggleCtx(c)}
              className={`px-3.5 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                contexts.includes(c)
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-bg-dark-border text-text-dark-sec hover:border-brand/40"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-xs font-medium text-text-dark-muted mb-2 uppercase tracking-wide">
            Anything else? (optional)
          </label>
          <textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            rows={3}
            className="w-full bg-bg-dark-input border border-bg-dark-border text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand resize-none placeholder:text-text-dark-muted"
            placeholder='E.g. "Bad knees, prefer mornings, training for London Marathon"'
          />
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        {onBack && (
          <button onClick={onBack} className="flex-1 border border-bg-dark-border text-text-dark-sec font-semibold py-3 rounded-xl hover:bg-bg-dark-card transition-colors">
            ← Back
          </button>
        )}
        <button onClick={handleNext} className="flex-1 bg-brand hover:bg-brand-hover text-white font-semibold py-3 rounded-xl transition-colors">
          See My Assessment →
        </button>
      </div>
    </div>
  );
}

/* ──────────── ASSESSMENT VIEW ──────────── */

function AssessmentView({
  loading,
  error,
  assessment,
  data,
  onRetry,
  onViewPreview,
}: {
  loading: boolean;
  error: string;
  assessment: {
    score: number;
    scoreLabel: string;
    predictions: Record<string, number> | null;
    trainingPaces: Record<string, string> | null;
    assessment: string;
    weeksTilRace: number | null;
    vdot: number | null;
  } | null;
  data: QuizData;
  onRetry: () => void;
  onViewPreview: () => void;
}) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <h2 className="font-heading font-bold text-xl mb-2">Your coach is analysing your data...</h2>
        <p className="text-text-dark-sec text-sm">This takes a few seconds.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={onRetry} className="bg-brand hover:bg-brand-hover text-white font-semibold px-6 py-2.5 rounded-lg transition-colors">
          Try Again
        </button>
      </div>
    );
  }

  if (!assessment) return null;

  return (
    <div>
      {/* Score card */}
      <div className="bg-bg-dark-card border border-bg-dark-border rounded-2xl p-6 text-center mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand to-brand-hover" />
        <p className="font-mono text-[10px] uppercase tracking-[2px] text-text-dark-muted mb-3">
          Your RunSplit Score
        </p>
        <div className="text-5xl font-heading font-extrabold text-white mb-1">
          {assessment.score}<span className="text-2xl text-text-dark-muted">/100</span>
        </div>
        {/* Score bar */}
        <div className="w-full bg-bg-dark-border rounded-full h-2.5 my-3">
          <div
            className="h-full bg-gradient-to-r from-brand to-brand-hover rounded-full transition-all duration-1000"
            style={{ width: `${assessment.score}%` }}
          />
        </div>
        <p className="text-sm text-brand font-medium">{assessment.scoreLabel}</p>
      </div>

      {/* Training paces */}
      {assessment.trainingPaces && (
        <div className="grid grid-cols-3 gap-2 mb-6">
          {Object.entries(assessment.trainingPaces).map(([zone, pace]) => (
            <div key={zone} className="bg-bg-dark-card border border-bg-dark-border rounded-lg p-3 text-center">
              <p className="font-mono text-[9px] uppercase tracking-[1.5px] text-text-dark-muted mb-1 capitalize">{zone}</p>
              <p className="font-mono text-lg font-bold text-white">{pace}</p>
              <p className="text-[10px] text-text-dark-muted">/km</p>
            </div>
          ))}
        </div>
      )}

      {/* AI assessment text */}
      <div className="bg-bg-dark-card border border-bg-dark-border rounded-xl p-5 mb-6">
        <p className="font-mono text-[10px] uppercase tracking-[2px] text-text-dark-muted mb-3">
          Coach&apos;s Assessment
        </p>
        <div className="text-sm text-text-dark-sec leading-relaxed whitespace-pre-line">
          {assessment.assessment}
        </div>
      </div>

      {/* Weeks info */}
      {assessment.weeksTilRace && data.raceDistance && (
        <div className="bg-bg-dark-card border border-bg-dark-border rounded-lg p-4 mb-6 text-center">
          <p className="text-sm text-text-dark-sec">
            <span className="text-white font-bold">{assessment.weeksTilRace} weeks</span> until your race.
            {assessment.weeksTilRace <= 6
              ? " Your plan will be aggressive — let's make every session count."
              : " Plenty of time to build fitness safely."}
          </p>
        </div>
      )}

      {/* CTA */}
      <div className="bg-gradient-to-r from-brand/20 to-brand-hover/20 border border-brand/30 rounded-xl p-6 text-center">
        <h3 className="font-heading font-bold text-lg text-white mb-2">
          Your plan preview is ready
        </h3>
        <p className="text-sm text-text-dark-sec mb-5">
          See the first 2 weeks of your personalised plan — free, no signup needed.
        </p>
        <button
          onClick={onViewPreview}
          className="w-full bg-brand hover:bg-brand-hover text-white font-heading text-sm font-bold py-3.5 rounded-lg transition-all"
        >
          See My Plan Preview →
        </button>
        <p className="text-[11px] text-text-dark-muted mt-3">
          Free preview · No signup required · Full plan with Pro
        </p>
      </div>
    </div>
  );
}

