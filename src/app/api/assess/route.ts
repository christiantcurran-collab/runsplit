import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  DISTANCES,
  estimateVO2max,
  calculateTrainingPaces,
  predictRaceTime,
  formatTimeFromSeconds,
} from "@/lib/running-math";

export const runtime = "edge"; // fast cold starts for paid traffic

const MODEL = "claude-3-5-haiku-20241022"; // fast + cheap for instant assessment

/**
 * POST /api/assess
 * Takes quiz data, runs calculations + AI, returns an instant assessment.
 * No auth required — this is the "AHA" moment before signup.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      goal,
      raceDistance,
      raceDate,
      targetTime, // seconds or null
      justFinish,
      experienceLevel,
      benchmarkType,
      benchmarkDistance, // km
      benchmarkTime, // seconds
      daysPerWeek,
      longRunDay,
      additionalContext,
      freeText,
    } = body;

    // ── Calculate fitness metrics from benchmark ──
    let vdot: number | null = null;
    let trainingPaces: Record<string, string> | null = null;
    let predictions: Record<string, number> | null = null;

    if (benchmarkType === "manual" && benchmarkDistance && benchmarkTime) {
      const distMeters = benchmarkDistance * 1000;
      vdot = Math.round(estimateVO2max(distMeters, benchmarkTime) * 10) / 10;

      const paces = calculateTrainingPaces(distMeters, benchmarkTime);
      trainingPaces = {
        easy: formatPaceRange(paces.easy.min, paces.easy.max),
        marathon: formatPaceRange(paces.marathon.min, paces.marathon.max),
        threshold: formatPaceRange(paces.threshold.min, paces.threshold.max),
        interval: formatPaceRange(paces.interval.min, paces.interval.max),
      };

      // Race predictions
      const predictionDistances = ["5k", "10k", "halfMarathon", "marathon"] as const;
      predictions = {};
      for (const key of predictionDistances) {
        const dist = DISTANCES[key];
        const predicted = predictRaceTime(distMeters, benchmarkTime, dist.meters);
        predictions[dist.shortName] = Math.round(predicted);
      }
    }

    // ── Weeks until race ──
    let weeksTilRace: number | null = null;
    if (raceDate) {
      const diff = new Date(raceDate).getTime() - Date.now();
      weeksTilRace = Math.max(1, Math.round(diff / (7 * 24 * 60 * 60 * 1000)));
    }

    // ── RunSplit Score (heuristic 0–100) ──
    const score = calculateScore({
      vdot,
      experienceLevel,
      daysPerWeek,
      benchmarkType,
    });

    const scoreLabel = getScoreLabel(score);

    // ── AI Coach Assessment (1–3 sentences) ──
    let assessment = "";
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      try {
        const anthropic = new Anthropic({ apiKey });
        const msg = await anthropic.messages.create({
          model: MODEL,
          max_tokens: 300,
          system: `You are an expert AI running coach writing a brief, personalised assessment after someone completes a quiz. Be warm, specific, and motivating. Mention their actual numbers if available. Keep it to 2–4 sentences. Don't say "based on your quiz". Address them directly.`,
          messages: [
            {
              role: "user",
              content: buildAssessmentPrompt({
                goal,
                raceDistance,
                raceDate,
                targetTime,
                justFinish,
                experienceLevel,
                vdot,
                trainingPaces,
                predictions,
                weeksTilRace,
                daysPerWeek,
                longRunDay,
                additionalContext,
                freeText,
              }),
            },
          ],
        });
        assessment =
          msg.content[0].type === "text"
            ? msg.content[0].text
            : "Your coach is ready to build your plan.";
      } catch (aiErr) {
        console.error("Assessment AI error:", aiErr);
        assessment = getFallbackAssessment(experienceLevel, raceDistance, vdot);
      }
    } else {
      assessment = getFallbackAssessment(experienceLevel, raceDistance, vdot);
    }

    return NextResponse.json({
      score,
      scoreLabel,
      vdot,
      predictions: predictions
        ? Object.fromEntries(
            Object.entries(predictions).map(([k, v]) => [k, v])
          )
        : null,
      trainingPaces,
      assessment,
      weeksTilRace,
    });
  } catch (err) {
    console.error("Assess API error:", err);
    return NextResponse.json(
      { error: "Failed to generate assessment" },
      { status: 500 }
    );
  }
}

/* ──────────── Helpers ──────────── */

function formatPaceRange(minSec: number, maxSec: number): string {
  return `${formatPace(minSec)}–${formatPace(maxSec)}`;
}

function formatPace(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function calculateScore({
  vdot,
  experienceLevel,
  daysPerWeek,
  benchmarkType,
}: {
  vdot: number | null;
  experienceLevel?: string;
  daysPerWeek?: number;
  benchmarkType?: string;
}): number {
  let score = 40; // Base

  // VDOT contribution (up to +35)
  if (vdot) {
    if (vdot >= 60) score += 35;
    else if (vdot >= 50) score += 28;
    else if (vdot >= 45) score += 22;
    else if (vdot >= 40) score += 18;
    else if (vdot >= 35) score += 14;
    else if (vdot >= 30) score += 10;
    else score += 6;
  }

  // Experience contribution (up to +15)
  const expMap: Record<string, number> = {
    new: 2,
    sometimes: 6,
    regular: 11,
    serious: 15,
  };
  score += expMap[experienceLevel || ""] || 5;

  // Days per week (up to +10)
  score += Math.min(10, (daysPerWeek || 3) * 2);

  // Bonus for providing benchmark data
  if (benchmarkType === "manual") score += 5;

  return Math.min(100, Math.max(10, score));
}

function getScoreLabel(score: number): string {
  if (score >= 85) return "Elite potential";
  if (score >= 70) return "Strong base — ready to push";
  if (score >= 55) return "Solid foundation — great to build on";
  if (score >= 40) return "Good starting point — room to grow";
  return "Early days — perfect time to start a plan";
}

function buildAssessmentPrompt(data: Record<string, unknown>): string {
  const parts: string[] = [];

  if (data.goal) parts.push(`Goal: ${data.goal}`);
  if (data.raceDistance) parts.push(`Race distance: ${data.raceDistance}`);
  if (data.raceDate) parts.push(`Race date: ${data.raceDate}`);
  if (data.weeksTilRace) parts.push(`Weeks until race: ${data.weeksTilRace}`);
  if (data.targetTime)
    parts.push(`Target time: ${formatTimeFromSeconds(data.targetTime as number)}`);
  if (data.justFinish) parts.push("Just wants to finish");
  if (data.experienceLevel) parts.push(`Experience: ${data.experienceLevel}`);
  if (data.vdot) parts.push(`VDOT: ${data.vdot}`);
  if (data.daysPerWeek) parts.push(`Available days/week: ${data.daysPerWeek}`);
  if (data.longRunDay) parts.push(`Preferred long run day: ${data.longRunDay}`);

  if (data.predictions) {
    parts.push(
      `Race predictions: ${Object.entries(data.predictions as Record<string, number>)
        .map(([k, v]) => `${k}: ${formatTimeFromSeconds(v)}`)
        .join(", ")}`
    );
  }

  if (data.trainingPaces) {
    parts.push(
      `Training paces: ${Object.entries(data.trainingPaces as Record<string, string>)
        .map(([z, p]) => `${z}: ${p}/km`)
        .join(", ")}`
    );
  }

  if (data.additionalContext)
    parts.push(
      `Additional context: ${(data.additionalContext as string[]).join(", ")}`
    );
  if (data.freeText) parts.push(`User note: ${data.freeText}`);

  return (
    "Write a brief personalised coach's assessment for this runner:\n\n" +
    parts.join("\n")
  );
}

function getFallbackAssessment(
  experienceLevel?: string,
  raceDistance?: string,
  vdot?: number | null
): string {
  if (vdot && vdot > 45) {
    return `With a VDOT of ${vdot}, you've built a strong aerobic base. Your AI plan will optimise your training paces and structure to help you reach your next breakthrough.`;
  }
  if (experienceLevel === "new" || experienceLevel === "sometimes") {
    return `Great starting point! A structured plan will make a massive difference to your running. Your AI coach will build sessions that match your current fitness and grow with you week by week.`;
  }
  return `Your coach is ready to build a personalised plan based on your fitness profile. Every session will have a purpose, and the plan adapts as you progress.`;
}

