import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServiceSupabase } from "@/lib/supabase-server";
import { DISTANCES, type DistanceKey, estimateVO2max, calculateTrainingPaces, formatTimeFromSeconds } from "@/lib/running-math";
import type { PlanBuilderGoal, PlanBuilderFitness, PlanBuilderPreferences } from "@/types";

const SYSTEM_PROMPT = `You are an expert running coach creating personalised training plans. You follow evidence-based coaching principles from Jack Daniels, Pete Pfitzinger, Hal Higdon, and Brad Hudson.

Core principles:
- 80/20 rule: ~80% of running should be easy pace, ~20% quality workouts
- Progressive overload: increase weekly volume by no more than 10% per week
- Recovery weeks: every 3-4 weeks, reduce volume by 20-30%
- Taper: reduce volume 2-3 weeks before race (longer taper for marathon)
- Specificity: workouts should become more race-specific as the plan progresses
- Long run: should not exceed 30-35% of weekly volume
- Quality sessions: maximum 2-3 per week (tempo, intervals, race pace)

Training phases:
1. Base building (early weeks): easy miles, building volume
2. Strength/endurance (mid weeks): tempo runs, hill repeats
3. Race-specific (later weeks): intervals at goal pace, race pace long runs
4. Taper (final 2-3 weeks): reduced volume, maintained intensity

You must return ONLY valid JSON (no markdown, no code fences, no explanation) with this exact structure:

{
  "meta": {
    "totalWeeks": number,
    "peakWeeklyKm": number,
    "phases": [{ "name": string, "weeks": [startWeek, endWeek] }]
  },
  "weeks": [
    {
      "weekNumber": number,
      "phase": string,
      "targetKm": number,
      "isRecoveryWeek": boolean,
      "days": [
        {
          "dayOfWeek": number (0=Mon, 6=Sun),
          "workout": {
            "id": string (unique like "w1d1"),
            "type": "easy" | "long" | "tempo" | "interval" | "race_pace" | "recovery" | "rest" | "cross_train" | "strength",
            "distanceKm": number,
            "description": string (brief workout description),
            "paces": { "easy": { "min": seconds_per_km, "max": seconds_per_km }, ... },
            "durationMinutes": number,
            "notes": string (coaching tips)
          } or null for rest days
        }
      ] (exactly 7 days, Mon-Sun)
    }
  ]
}

Important:
- All paces must be in seconds per kilometre
- Each week must have exactly 7 days (dayOfWeek 0-6)
- Rest days have workout: null
- Ensure the plan ends with proper taper
- Make descriptions specific and actionable`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { goal, fitness, preferences, userId } = body as {
      goal: PlanBuilderGoal;
      fitness: PlanBuilderFitness;
      preferences: PlanBuilderPreferences;
      userId: string;
    };

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "AI service not configured. Please add ANTHROPIC_API_KEY." }, { status: 500 });
    }

    // Calculate derived data for context
    const raceDistMeters = goal.raceDistance === "custom"
      ? (goal.customDistanceMeters || 42195)
      : DISTANCES[goal.raceDistance as DistanceKey]?.meters || 42195;
    const raceDistName = goal.raceDistance === "custom"
      ? `${(raceDistMeters / 1000).toFixed(1)}km`
      : DISTANCES[goal.raceDistance as DistanceKey]?.name || "Marathon";

    const recentDistMeters = DISTANCES[fitness.recentRaceDistance as DistanceKey]?.meters || 5000;
    const vo2max = estimateVO2max(recentDistMeters, fitness.recentRaceTimeSeconds);
    const trainingPaces = calculateTrainingPaces(recentDistMeters, fitness.recentRaceTimeSeconds);

    // Calculate weeks until race
    const raceDate = new Date(goal.raceDate);
    const today = new Date();
    const weeksUntilRace = Math.max(4, Math.floor((raceDate.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000)));
    const planWeeks = Math.min(weeksUntilRace, 24); // Cap at 24 weeks

    const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    const userPrompt = `Create a ${planWeeks}-week training plan for a runner with the following details:

GOAL:
- Race: ${raceDistName}
- Goal type: ${goal.goalType === "finish" ? "Just finish" : goal.goalType === "target_time" ? `Target time: ${formatTimeFromSeconds(goal.targetTimeSeconds || 0)}` : "Beat personal record"}
- Race date: ${goal.raceDate}
${goal.raceName ? `- Race name: ${goal.raceName}` : ""}

CURRENT FITNESS:
- Recent race: ${DISTANCES[fitness.recentRaceDistance as DistanceKey]?.name || fitness.recentRaceDistance} in ${formatTimeFromSeconds(fitness.recentRaceTimeSeconds)}
- Estimated VO2max: ${vo2max.toFixed(1)} ml/kg/min
- Current weekly volume: ${fitness.currentWeeklyKm}km
- Longest recent run: ${fitness.longestRecentRunKm}km
- Training days per week: ${fitness.trainingDaysPerWeek}
- Long run day: ${fitness.longRunDay}

TRAINING PACES (seconds per km):
- Easy: ${trainingPaces.easy.min}-${trainingPaces.easy.max} sec/km (${formatTimeFromSeconds(trainingPaces.easy.min)}-${formatTimeFromSeconds(trainingPaces.easy.max)}/km)
- Marathon: ${trainingPaces.marathon.min}-${trainingPaces.marathon.max} sec/km
- Threshold: ${trainingPaces.threshold.min}-${trainingPaces.threshold.max} sec/km
- Interval: ${trainingPaces.interval.min}-${trainingPaces.interval.max} sec/km
- Repetition: ${trainingPaces.repetition.min}-${trainingPaces.repetition.max} sec/km

PREFERENCES:
- Cross-training: ${preferences.includeCrossTraining ? "Yes" : "No"}
- Strength work: ${preferences.includeStrength ? "Yes" : "No"}
- Cannot run on: ${preferences.restDays.length > 0 ? preferences.restDays.map((d) => WEEKDAYS[d]).join(", ") : "No restrictions"}
${preferences.injuryConcerns ? `- Injury concerns: ${preferences.injuryConcerns}` : ""}

Generate the complete ${planWeeks}-week plan as JSON. Ensure rest days match the runner's restrictions. Start from current fitness and build progressively.`;

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    // Extract the JSON from the response
    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    let planData;
    try {
      // Try parsing directly
      planData = JSON.parse(responseText);
    } catch {
      // Try extracting JSON from markdown code fences
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        planData = JSON.parse(jsonMatch[1].trim());
      } else {
        // Try finding first { to last }
        const firstBrace = responseText.indexOf("{");
        const lastBrace = responseText.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1) {
          planData = JSON.parse(responseText.slice(firstBrace, lastBrace + 1));
        } else {
          throw new Error("Could not parse AI response as JSON");
        }
      }
    }

    // Save plan to database
    const supabase = createServiceSupabase();

    const planName = goal.raceName
      ? `${raceDistName} Plan — ${goal.raceName}`
      : `${raceDistName} Training Plan`;

    const planStartDate = new Date();
    planStartDate.setDate(planStartDate.getDate() + (1 - planStartDate.getDay() + 7) % 7); // Next Monday

    const { data: plan, error: dbError } = await supabase
      .from("training_plans")
      .insert({
        user_id: userId,
        name: planName,
        goal_race_distance_meters: raceDistMeters,
        goal_race_time_seconds: goal.targetTimeSeconds || null,
        goal_race_date: goal.raceDate,
        plan_start_date: planStartDate.toISOString().split("T")[0],
        plan_weeks: planWeeks,
        experience_level: "intermediate",
        weekly_days: fitness.trainingDaysPerWeek,
        plan_data: planData,
        status: "active",
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB error:", dbError);
      return NextResponse.json({ error: "Failed to save plan" }, { status: 500 });
    }

    return NextResponse.json({ planId: plan.id, plan: planData });
  } catch (err: unknown) {
    console.error("Plan generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate plan" },
      { status: 500 }
    );
  }
}

