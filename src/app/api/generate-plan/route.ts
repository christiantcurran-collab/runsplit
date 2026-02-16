import Anthropic from "@anthropic-ai/sdk";
import { createServiceSupabase } from "@/lib/supabase-server";
import { DISTANCES, type DistanceKey, estimateVO2max, calculateTrainingPaces, formatTimeFromSeconds } from "@/lib/running-math";
import type { PlanBuilderGoal, PlanBuilderFitness, PlanBuilderPreferences } from "@/types";

const SYSTEM_PROMPT = `You are an expert running coach creating personalised training plans. You follow evidence-based coaching principles from Jack Daniels, Pete Pfitzinger, Hal Higdon, and Brad Hudson.

CRITICAL PLANNING RULES:

1. START FROM THE RUNNER'S ACTUAL FITNESS:
   - The plan MUST start at or near the runner's current weekly volume. If they run 10km/week, Week 1 should be ~10-12km total.
   - Never start the plan at a volume more than 15% above current weekly km.
   - The longest run in Week 1 should be similar to their longest recent run.

2. PROGRESSIVE BUILD:
   - Increase weekly volume by at most 10% per week.
   - Every 3-4 weeks, include a recovery week (reduce volume 20-30%).
   - The plan must be REALISTIC â€” not everyone can peak at 80km/week. Scale peak volume to the runner's days/week and starting fitness.

3. RESPECT THE RUNNER'S SCHEDULE:
   - If the runner can only run 1-2 days per week, design around that. DO NOT add extra running days.
   - For 1 day/week: One progressively longer run each week (walk/run if needed at first). Consider adding optional cross-training.
   - For 2 days/week: One long run + one shorter quality run. The long run is the backbone.
   - For 3 days/week: Long run + tempo or intervals + easy run.
   - For 4+ days/week: Traditional training structure with easy, long, tempo, intervals.
   - Non-running days should have workout: null (rest day) or cross_train/strength if the user requested it.

4. LONG RUN PROGRESSION:
   - The long run is the most important workout for half marathon and marathon preparation.
   - Build the long run gradually: add ~1-2km per week to the long run.
   - For a half marathon goal: peak long run should reach 18-21km (2-3 weeks before race).
   - For a marathon goal: peak long run should reach 30-35km (3 weeks before race).
   - For 5k/10k goals: peak long run can be 1.5-2x race distance.

5. REALISTIC PLAN LENGTH:
   - If the runner's current fitness is far below race demands, the plan needs MORE weeks (minimum 12 for half marathon, 16-20 for marathon from low base).
   - If the race date doesn't allow enough build-up, acknowledge this and be conservative.
   - Better to have a safe, gradual plan than an aggressive one that risks injury.

6. EACH RUN SHOULD HAVE PURPOSE:
   - Don't fill the schedule with lots of very short "junk" runs (e.g. 2km easy runs are pointless for most runners).
   - Minimum meaningful run distance is ~3-4km for beginners, ~5km for intermediate runners.
   - Quality over quantity: fewer, longer runs beat many very short runs.

7. TAPER:
   - Final 1-2 weeks before race: reduce volume by 40-50%.
   - Maintain some intensity but much less volume.
   - The last long run should be 10-14 days before race day.

8. 80/20 RULE: ~80% of running should be easy pace, ~20% quality workouts (tempo, intervals, race pace).

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
            "description": string (brief but specific workout description),
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
- Make descriptions specific and actionable
- NEVER add more running days than the runner requested`;

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid request body. JSON is required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { goal, fitness, preferences, userId } = body as {
      goal: PlanBuilderGoal;
      fitness: PlanBuilderFitness;
      preferences: PlanBuilderPreferences;
      userId: string;
    };

    if (!userId || !goal || !fitness || !preferences) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: userId, goal, fitness, preferences." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured. Please add ANTHROPIC_API_KEY." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Server-side subscription check â€” only Pro users can generate plans
    const supabaseCheck = createServiceSupabase();
    const { data: userProfile } = await supabaseCheck
      .from("profiles")
      .select("subscription_status")
      .eq("id", userId)
      .single();

    const isPro = userProfile?.subscription_status === "active" || userProfile?.subscription_status === "trialing";
    if (!isPro) {
      return new Response(
        JSON.stringify({ error: "Pro subscription required to generate training plans." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
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

    // For low-base runners targeting long races, recommend minimum plan lengths
    const raceDistKm = raceDistMeters / 1000;
    let minRecommendedWeeks = 8;
    if (raceDistKm >= 42) minRecommendedWeeks = 16;
    else if (raceDistKm >= 21) minRecommendedWeeks = 12;
    else if (raceDistKm >= 10) minRecommendedWeeks = 8;

    if (fitness.currentWeeklyKm < raceDistKm * 0.5) {
      minRecommendedWeeks = Math.max(minRecommendedWeeks, raceDistKm >= 42 ? 20 : raceDistKm >= 21 ? 14 : 10);
    }

    const planWeeks = Math.min(weeksUntilRace, 24);
    const isCompressed = planWeeks < minRecommendedWeeks;

    const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    let scheduleGuidance = "";
    if (fitness.trainingDaysPerWeek === 1) {
      scheduleGuidance = `CRITICAL: This runner can ONLY run 1 day per week. Design one progressively longer run each week on ${fitness.longRunDay}. All other days must be rest or cross-training/strength (only if requested). The single weekly run IS the long run. Build it gradually from ${fitness.longestRecentRunKm}km toward race distance.`;
    } else if (fitness.trainingDaysPerWeek === 2) {
      scheduleGuidance = `CRITICAL: This runner can ONLY run 2 days per week. Design one long run on ${fitness.longRunDay} and one shorter quality run on a weekday. All other 5 days must be rest or cross-training/strength (only if requested). The long run is the backbone of this plan. DO NOT add any extra running days.`;
    } else if (fitness.trainingDaysPerWeek === 3) {
      scheduleGuidance = `This runner runs 3 days per week. Design: one long run on ${fitness.longRunDay}, one quality session (tempo or intervals), and one easy run. 4 rest/cross-training days.`;
    } else {
      scheduleGuidance = `This runner runs ${fitness.trainingDaysPerWeek} days per week with long run on ${fitness.longRunDay}. Use a mix of easy runs, long runs, tempo, and intervals. ${7 - fitness.trainingDaysPerWeek} rest/cross-training days.`;
    }

    const userPrompt = `Create a ${planWeeks}-week training plan for a runner with the following details:

GOAL:
- Race: ${raceDistName} (${raceDistKm.toFixed(1)}km)
- Goal type: ${goal.goalType === "finish" ? "Just finish â€” priority is completing the distance safely" : goal.goalType === "target_time" ? `Target time: ${formatTimeFromSeconds(goal.targetTimeSeconds || 0)}` : "Beat personal record"}
- Race date: ${goal.raceDate}
${goal.raceName ? `- Race name: ${goal.raceName}` : ""}

CURRENT FITNESS (THIS IS CRITICAL â€” START THE PLAN HERE):
- Current weekly volume: ${fitness.currentWeeklyKm}km per week â€” Week 1 must start at approximately this volume
- Longest recent run: ${fitness.longestRecentRunKm}km â€” the first long run should be near this distance
- Recent race: ${DISTANCES[fitness.recentRaceDistance as DistanceKey]?.name || fitness.recentRaceDistance} in ${formatTimeFromSeconds(fitness.recentRaceTimeSeconds)}
- Estimated VO2max: ${vo2max.toFixed(1)} ml/kg/min

SCHEDULE:
- Running days per week: ${fitness.trainingDaysPerWeek} (STRICT â€” never exceed this number of running days)
${scheduleGuidance}

TRAINING PACES (seconds per km):
- Easy: ${trainingPaces.easy.min}-${trainingPaces.easy.max} sec/km (${formatTimeFromSeconds(trainingPaces.easy.min)}-${formatTimeFromSeconds(trainingPaces.easy.max)}/km)
- Marathon: ${trainingPaces.marathon.min}-${trainingPaces.marathon.max} sec/km
- Threshold: ${trainingPaces.threshold.min}-${trainingPaces.threshold.max} sec/km
- Interval: ${trainingPaces.interval.min}-${trainingPaces.interval.max} sec/km
- Repetition: ${trainingPaces.repetition.min}-${trainingPaces.repetition.max} sec/km

PREFERENCES:
- Cross-training: ${preferences.includeCrossTraining ? "Yes, include cross-training sessions on non-running days" : "No cross-training â€” use rest days"}
- Strength work: ${preferences.includeStrength ? "Yes, include strength sessions" : "No strength sessions"}
- Cannot run on: ${preferences.restDays.length > 0 ? preferences.restDays.map((d) => WEEKDAYS[d]).join(", ") : "No restrictions"}
${preferences.injuryConcerns ? `- Injury concerns: ${preferences.injuryConcerns}` : ""}

${isCompressed ? `WARNING: This runner ideally needs ${minRecommendedWeeks}+ weeks but only has ${planWeeks} weeks. Be conservative â€” don't build too aggressively. Prioritise safety. The runner may need walk/run intervals early on.` : ""}

CONSTRAINTS:
- Week 1 total km MUST be approximately ${fitness.currentWeeklyKm}km (the runner's current weekly volume)
- Increase total weekly km by no more than 10% per week
- Include a recovery week (reduce ~20-30%) every 3-4 weeks
- The long run should build by 1-2km per week maximum
- For half marathon: peak long run of 18-21km before taper
- For marathon: peak long run of 30-35km before taper
- No individual run shorter than 3km (pointless for training)
- Taper: final 1-2 weeks reduce volume 40-50%
- Each week MUST have exactly ${fitness.trainingDaysPerWeek} running days and ${7 - fitness.trainingDaysPerWeek} non-running days

Generate the complete ${planWeeks}-week plan as JSON. VERIFY that each week has exactly ${fitness.trainingDaysPerWeek} running workouts before returning.`;

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // Use streaming for live updates
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        try {
          // Phase 1: Analyzing
          sendEvent("progress", {
            phase: "analyzing",
            message: "Analysing your fitness profile and goals...",
            percent: 10,
          });

          // Phase 2: Start streaming from Claude
          sendEvent("progress", {
            phase: "designing",
            message: `Designing your ${planWeeks}-week ${raceDistName} plan...`,
            percent: 20,
          });

          let fullText = "";
          let lastProgressPercent = 20;

          const messageStream = anthropic.messages.stream({
            model: "claude-sonnet-4-20250514",
            max_tokens: 32000,
            system: SYSTEM_PROMPT,
            messages: [{ role: "user", content: userPrompt }],
          });

          // Track weeks being generated
          let weeksDetected = 0;

          messageStream.on("text", (text) => {
            fullText += text;

            // Count weeks generated so far for progress updates
            const weekMatches = fullText.match(/"weekNumber"\s*:\s*(\d+)/g);
            const newWeeksDetected = weekMatches?.length || 0;

            if (newWeeksDetected > weeksDetected) {
              weeksDetected = newWeeksDetected;
              const progressPercent = Math.min(85, 25 + Math.floor((weeksDetected / planWeeks) * 60));

              if (progressPercent > lastProgressPercent) {
                lastProgressPercent = progressPercent;

                let phaseMsg = `Building week ${weeksDetected} of ${planWeeks}...`;
                if (weeksDetected <= 2) {
                  phaseMsg = `Setting up your base phase â€” Week ${weeksDetected}...`;
                } else if (weeksDetected >= planWeeks - 2) {
                  phaseMsg = `Creating your taper and race week...`;
                } else if (weeksDetected >= Math.floor(planWeeks * 0.6)) {
                  phaseMsg = `Building peak training â€” Week ${weeksDetected}...`;
                } else {
                  phaseMsg = `Designing progressive build â€” Week ${weeksDetected}...`;
                }

                sendEvent("progress", {
                  phase: "building",
                  message: phaseMsg,
                  percent: progressPercent,
                  weeksBuilt: weeksDetected,
                  totalWeeks: planWeeks,
                });
              }
            }
          });

          // Wait for the stream to complete
          const finalMessage = await messageStream.finalMessage();
          const responseText = finalMessage.content[0].type === "text" ? finalMessage.content[0].text : fullText;

          sendEvent("progress", {
            phase: "finalizing",
            message: "Finalising your personalised plan...",
            percent: 90,
          });

          // Parse the JSON
          let planData;
          try {
            planData = JSON.parse(responseText);
          } catch {
            const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
              planData = JSON.parse(jsonMatch[1].trim());
            } else {
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
          sendEvent("progress", {
            phase: "saving",
            message: "Saving your plan...",
            percent: 95,
          });

          const supabase = createServiceSupabase();

          const planName = goal.raceName
            ? `${raceDistName} Plan â€” ${goal.raceName}`
            : `${raceDistName} Training Plan`;

          const planStartDate = new Date();
          planStartDate.setDate(planStartDate.getDate() + (1 - planStartDate.getDay() + 7) % 7);

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
            sendEvent("error", { message: "Failed to save plan" });
            controller.close();
            return;
          }

          // Complete!
          sendEvent("progress", {
            phase: "complete",
            message: "Your plan is ready!",
            percent: 100,
          });

          sendEvent("complete", {
            planId: plan.id,
            planWeeks,
            raceDistance: raceDistName,
          });

          controller.close();
        } catch (err) {
          console.error("Plan generation stream error:", err);
          sendEvent("error", {
            message: err instanceof Error ? err.message : "Failed to generate plan",
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err: unknown) {
    console.error("Plan generation error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Failed to generate plan" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}



