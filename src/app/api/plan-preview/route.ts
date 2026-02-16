import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  estimateVO2max,
  calculateTrainingPaces,
  formatTimeFromSeconds,
} from "@/lib/running-math";

export const runtime = "edge";

const MODEL = "claude-3-5-haiku-20241022";

/**
 * POST /api/plan-preview
 * Generates a 2-week mini plan preview from quiz data.
 * No auth required — this is the teaser before signup.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      goal,
      raceDistance,
      raceDate,
      targetTime,
      justFinish,
      experienceLevel,
      benchmarkType,
      benchmarkDistance,
      benchmarkTime,
      daysPerWeek = 3,
      excludedDays,
      longRunDay,
    } = body;

    // Calculate training paces if we have benchmark data
    let pacesInfo = "";
    if (benchmarkType === "manual" && benchmarkDistance && benchmarkTime) {
      const distM = benchmarkDistance * 1000;
      const paces = calculateTrainingPaces(distM, benchmarkTime);
      const vdot = estimateVO2max(distM, benchmarkTime);
      pacesInfo = `
Runner's VDOT: ${Math.round(vdot * 10) / 10}
Easy pace: ${formatPace(paces.easy.min)}–${formatPace(paces.easy.max)}/km
Threshold pace: ${formatPace(paces.threshold.min)}–${formatPace(paces.threshold.max)}/km
Interval pace: ${formatPace(paces.interval.min)}–${formatPace(paces.interval.max)}/km`;
    }

    const distanceName = mapDistanceName(raceDistance);
    const weeksAvailable = raceDate
      ? Math.max(4, Math.round((new Date(raceDate).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000)))
      : 12;

    const prompt = `Generate a 4-week training plan preview for a runner with these details:
- Goal: ${goal || "general fitness"}
- Distance: ${distanceName || "general running"}${raceDate ? `\n- Race date: ${raceDate} (${weeksAvailable} weeks away)` : ""}${targetTime ? `\n- Target time: ${formatTimeFromSeconds(targetTime)}` : ""}${justFinish ? "\n- Just wants to finish" : ""}
- Experience level: ${experienceLevel || "unknown"}
- Available days per week: ${daysPerWeek}${excludedDays?.length ? `\n- Can't run on: ${excludedDays.join(", ")}` : ""}${longRunDay ? `\n- Preferred long run day: ${longRunDay}` : ""}${pacesInfo ? `\n${pacesInfo}` : ""}

Return ONLY valid JSON with this structure:
{
  "totalWeeks": number (the full plan would be this many weeks),
  "previewWeeks": [
    {
      "weekNumber": number,
      "phase": string,
      "totalKm": number,
      "days": [
        { "day": "Mon"|"Tue"|"Wed"|"Thu"|"Fri"|"Sat"|"Sun", "workout": string|null }
      ]
    }
  ]
}

Rules:
- previewWeeks should contain exactly 4 weeks
- Each week must have exactly 7 days (Mon–Sun)
- null for rest days
- Workout strings should be concise (e.g. "5km easy", "6×800m @ 3:45/km", "Rest", "10km long run")
- Start at the runner's fitness level
- Make it look like a real, professional coaching plan
- totalWeeks should be realistic for the goal (e.g. 12–16 weeks for half marathon)`;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(getFallbackPlan(daysPerWeek, distanceName));
    }

    try {
      const anthropic = new Anthropic({ apiKey });
      const msg = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      });

      const text = msg.content[0].type === "text" ? msg.content[0].text : "";
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json(parsed);
      }
    } catch (aiErr) {
      console.error("Plan preview AI error:", aiErr);
    }

    // Fallback
    return NextResponse.json(getFallbackPlan(daysPerWeek, distanceName));
  } catch (err) {
    console.error("Plan preview API error:", err);
    return NextResponse.json(
      { error: "Failed to generate plan preview" },
      { status: 500 }
    );
  }
}

function formatPace(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function mapDistanceName(dist?: string): string {
  const map: Record<string, string> = {
    "5k": "5K",
    "10k": "10K",
    half_marathon: "Half Marathon",
    marathon: "Marathon",
    custom: "Ultra/Custom Distance",
  };
  return map[dist || ""] || "general running";
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getFallbackPlan(daysPerWeek: number, _distance: string) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const makeWeek = (num: number, totalKm: number, phase: string) => ({
    weekNumber: num,
    phase,
    totalKm,
    days: days.map((day, i) => {
      if (i === 6)
        return { day, workout: `${Math.round(totalKm * 0.35)}km long run` };
      if (i === 2 && daysPerWeek >= 3)
        return { day, workout: `${Math.round(totalKm * 0.2)}km tempo` };
      if (i === 0 && daysPerWeek >= 2)
        return { day, workout: `${Math.round(totalKm * 0.2)}km easy` };
      if (i === 4 && daysPerWeek >= 4)
        return { day, workout: `${Math.round(totalKm * 0.15)}km intervals` };
      return { day, workout: null };
    }),
  });

  return {
    totalWeeks: 12,
    previewWeeks: [
      makeWeek(1, 15, "Base Building"),
      makeWeek(2, 17, "Base Building"),
      makeWeek(3, 19, "Base Building"),
      makeWeek(4, 16, "Recovery"),
    ],
  };
}

