import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerSupabase } from "@/lib/supabase-server";
import type { TrainingPlanRow, TrainingLogEntry, StravaActivity, TrainingWeek } from "@/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function fmtPace(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${s.toString().padStart(2, "0")}/km`;
}

function fmtDist(meters: number): string {
  return (meters / 1000).toFixed(1) + "km";
}

function weekSummary(week: TrainingWeek): string {
  const runs = week.days
    .filter((d) => d.workout && d.workout.type !== "rest" && d.workout.type !== "cross_train" && d.workout.type !== "strength")
    .map((d) => `${WEEKDAYS[d.dayOfWeek]}: ${d.workout!.type} ${d.workout!.distanceKm}km`);
  return `Week ${week.weekNumber} (${week.phase}, ${week.targetKm}km): ${runs.join(" | ") || "Rest"}`;
}

function buildSystemPrompt(
  plan: TrainingPlanRow | null,
  currentWeekNum: number,
  logs: TrainingLogEntry[],
  strava: StravaActivity[],
): string {
  const parts: string[] = [];

  parts.push(
    `You are an AI running coach for RunSplit. Be concise, specific, and encouraging. Always reference real numbers from the user's data. Keep replies under 200 words unless the user asks for detail.`
  );

  if (plan) {
    const raceDate = new Date(plan.goal_race_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    const raceDist = fmtDist(plan.goal_race_distance_meters);
    const currentWeek = plan.plan_data.weeks.find((w) => w.weekNumber === currentWeekNum) ?? plan.plan_data.weeks[0];
    const upcomingWeeks = plan.plan_data.weeks.filter((w) => w.weekNumber > currentWeekNum && w.weekNumber <= currentWeekNum + 2);

    parts.push(`\n=== TRAINING PLAN ===`);
    parts.push(`Name: ${plan.name} | Goal: ${raceDist} on ${raceDate} | Week ${currentWeekNum} of ${plan.plan_data.meta.totalWeeks}`);
    parts.push(`Current week target: ${currentWeek.targetKm}km | Phase: ${currentWeek.phase}${currentWeek.isRecoveryWeek ? " (Recovery)" : ""}`);
    parts.push(`\nCurrent week workouts:`);
    for (const day of currentWeek.days) {
      if (day.workout) {
        parts.push(`  ${WEEKDAYS[day.dayOfWeek]}: ${day.workout.type} ${day.workout.distanceKm}km — ${day.workout.description}`);
      } else {
        parts.push(`  ${WEEKDAYS[day.dayOfWeek]}: Rest`);
      }
    }
    if (upcomingWeeks.length > 0) {
      parts.push(`\nUpcoming weeks:`);
      upcomingWeeks.forEach((w) => parts.push(`  ${weekSummary(w)}`));
    }

    parts.push(
      `\nWhen modifying the plan use the update_training_plan tool. Only modify week ${currentWeekNum} or later. Preserve all workout fields (id, type, distanceKm, description, paces, durationMinutes, notes) exactly — only change dayOfWeek assignments.`
    );
  } else {
    parts.push(`\nThe user has no active training plan yet.`);
  }

  if (logs.length > 0) {
    parts.push(`\n=== RECENT RUNS (last 14 days) ===`);
    for (const log of logs.slice(0, 15)) {
      const dist = log.distance_meters ? fmtDist(log.distance_meters) : "?km";
      const pace =
        log.distance_meters && log.time_seconds
          ? fmtPace(log.time_seconds / (log.distance_meters / 1000))
          : null;
      const effort = log.perceived_effort ? ` RPE ${log.perceived_effort}/10` : "";
      const type = log.workout_type ?? "run";
      parts.push(`  ${log.date}: ${type} ${dist}${pace ? ` @ ${pace}` : ""}${effort}${log.notes ? ` — "${log.notes}"` : ""}`);
    }
  }

  if (strava.length > 0) {
    parts.push(`\n=== RECENT STRAVA ACTIVITIES ===`);
    for (const act of strava.slice(0, 10)) {
      const dist = act.distance_meters ? fmtDist(act.distance_meters) : "?km";
      const pace =
        act.distance_meters && act.moving_time_seconds
          ? fmtPace(act.moving_time_seconds / (act.distance_meters / 1000))
          : null;
      const hr = act.average_heartrate ? ` avg HR ${Math.round(act.average_heartrate)}bpm` : "";
      const date = act.start_date ? act.start_date.split("T")[0] : "?";
      parts.push(`  ${date}: ${act.name ?? "Run"} ${dist}${pace ? ` @ ${pace}` : ""}${hr}`);
    }
  }

  return parts.join("\n");
}

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json() as { messages: { role: "user" | "assistant"; content: string }[] };
    const messages = (body.messages ?? []).slice(-10); // keep last 10 turns

    // Fetch context in parallel
    const [planResult, profileResult] = await Promise.all([
      supabase.from("training_plans").select("*").eq("user_id", user.id).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("profiles").select("strava_athlete_id, experience_level, display_name").eq("id", user.id).maybeSingle(),
    ]);
    const plan = planResult.data as TrainingPlanRow | null;
    const profile = profileResult.data;

    // Fetch logs and strava in parallel
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const [logsResult, stravaResult] = await Promise.all([
      supabase.from("training_log").select("*").eq("user_id", user.id).gte("date", twoWeeksAgo).order("date", { ascending: false }).limit(20),
      profile?.strava_athlete_id
        ? supabase.from("strava_activities").select("*").eq("user_id", user.id).order("start_date", { ascending: false }).limit(10)
        : Promise.resolve({ data: [] }),
    ]);
    const logs = (logsResult.data ?? []) as TrainingLogEntry[];
    const strava = (stravaResult.data ?? []) as StravaActivity[];

    // Calculate current week number
    let currentWeekNum = 1;
    if (plan) {
      const planStart = new Date(plan.plan_start_date);
      const today = new Date();
      const diffDays = Math.floor((today.getTime() - planStart.getTime()) / (1000 * 60 * 60 * 24));
      currentWeekNum = Math.max(1, Math.floor(diffDays / 7) + 1);
    }

    const systemPrompt = buildSystemPrompt(plan, currentWeekNum, logs, strava);

    const tools: Anthropic.Tool[] = plan
      ? [
          {
            name: "update_training_plan",
            description:
              "Modify one week of the user's training plan by reassigning workouts to different days. Use this when the user asks to move, swap, or reschedule workouts.",
            input_schema: {
              type: "object" as const,
              properties: {
                weekNumber: { type: "integer", description: "The week number to modify (must be >= current week)" },
                days: {
                  type: "array",
                  description: "All 7 days for the week",
                  items: {
                    type: "object",
                    properties: {
                      dayOfWeek: { type: "integer", description: "0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun" },
                      workout: { description: "The workout object (same fields as original) or null for rest" },
                    },
                    required: ["dayOfWeek", "workout"],
                  },
                },
              },
              required: ["weekNumber", "days"],
            },
          },
        ]
      : [];

    // First Claude call
    const firstResponse = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
      ...(tools.length > 0 ? { tools } : {}),
    });

    let reply = "";
    let planUpdated = false;

    if (firstResponse.stop_reason === "tool_use") {
      // Handle tool call
      const toolUseBlock = firstResponse.content.find((b) => b.type === "tool_use") as Anthropic.ToolUseBlock | undefined;

      if (toolUseBlock && toolUseBlock.name === "update_training_plan" && plan) {
        const input = toolUseBlock.input as { weekNumber: number; days: { dayOfWeek: number; workout: unknown }[] };
        let toolResultContent = "Success";

        try {
          const targetWeekIdx = plan.plan_data.weeks.findIndex((w) => w.weekNumber === input.weekNumber);
          if (targetWeekIdx === -1) throw new Error(`Week ${input.weekNumber} not found`);

          const updatedWeeks = plan.plan_data.weeks.map((week, idx) => {
            if (idx !== targetWeekIdx) return week;
            return { ...week, days: input.days };
          });

          const { error } = await supabase
            .from("training_plans")
            .update({ plan_data: { ...plan.plan_data, weeks: updatedWeeks } })
            .eq("id", plan.id)
            .eq("user_id", user.id);

          if (error) throw new Error(error.message);
          planUpdated = true;
        } catch (err) {
          toolResultContent = `Error: ${err instanceof Error ? err.message : "Failed to update plan"}`;
        }

        // Second Claude call with tool result
        const secondResponse = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 512,
          system: systemPrompt,
          messages: [
            ...messages,
            { role: "assistant", content: firstResponse.content },
            {
              role: "user",
              content: [{ type: "tool_result", tool_use_id: toolUseBlock.id, content: toolResultContent }],
            },
          ],
          ...(tools.length > 0 ? { tools } : {}),
        });

        const textBlock = secondResponse.content.find((b) => b.type === "text") as Anthropic.TextBlock | undefined;
        reply = textBlock?.text ?? "Done! Your plan has been updated.";
      }
    } else {
      const textBlock = firstResponse.content.find((b) => b.type === "text") as Anthropic.TextBlock | undefined;
      reply = textBlock?.text ?? "";
    }

    return NextResponse.json({ reply, planUpdated });
  } catch (err) {
    console.error("Coach chat error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to get response" },
      { status: 500 }
    );
  }
}
