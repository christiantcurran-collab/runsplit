// ============================================
// DATABASE TYPES
// ============================================

export interface Profile {
  id: string;
  display_name: string | null;
  age: number | null;
  gender: string | null;
  weight_kg: number | null;
  experience_level: "beginner" | "intermediate" | "advanced";
  current_weekly_km: number | null;
  preferred_unit: "km" | "mile";
  max_hr: number | null;
  resting_hr: number | null;
  stripe_customer_id: string | null;
  subscription_status: "none" | "trialing" | "active" | "cancelled";
  trial_ends_at: string | null;
  // Strava
  strava_athlete_id: number | null;
  strava_access_token: string | null;
  strava_refresh_token: string | null;
  strava_token_expires_at: number | null;
  strava_connected_at: string | null;
  // Email preferences
  email_weekly_summary: boolean;
  email_notifications_enabled: boolean;
  created_at: string;
}

export interface StravaActivity {
  id: string;
  user_id: string;
  strava_activity_id: number;
  name: string | null;
  activity_type: string | null;
  distance_meters: number | null;
  moving_time_seconds: number | null;
  elapsed_time_seconds: number | null;
  total_elevation_gain: number | null;
  start_date: string | null;
  average_speed: number | null;
  max_speed: number | null;
  average_heartrate: number | null;
  max_heartrate: number | null;
  suffer_score: number | null;
  calories: number | null;
  map_polyline: string | null;
  synced_at: string;
}

export interface RaceResult {
  id: string;
  user_id: string;
  distance_meters: number;
  distance_name: string | null;
  time_seconds: number;
  date: string | null;
  notes: string | null;
  is_goal: boolean;
  created_at: string;
}

export interface TrainingPlanRow {
  id: string;
  user_id: string;
  name: string;
  goal_race_distance_meters: number;
  goal_race_time_seconds: number | null;
  goal_race_date: string;
  plan_start_date: string;
  plan_weeks: number;
  experience_level: string;
  weekly_days: number;
  plan_data: TrainingPlan;
  status: "active" | "completed" | "abandoned";
  created_at: string;
  updated_at: string;
}

export interface TrainingLogEntry {
  id: string;
  user_id: string;
  plan_id: string | null;
  planned_workout_id: string | null;
  date: string;
  distance_meters: number | null;
  time_seconds: number | null;
  workout_type: string | null;
  notes: string | null;
  perceived_effort: number | null;
  completed: boolean;
  created_at: string;
}

// ============================================
// TRAINING PLAN STRUCTURE
// ============================================

export interface TrainingPlan {
  meta: {
    totalWeeks: number;
    peakWeeklyKm: number;
    phases: { name: string; weeks: [number, number] }[];
  };
  weeks: TrainingWeek[];
}

export interface TrainingWeek {
  weekNumber: number;
  phase: string;
  targetKm: number;
  isRecoveryWeek: boolean;
  days: TrainingDay[];
}

export interface TrainingDay {
  dayOfWeek: number; // 0=Mon, 6=Sun
  workout: Workout | null; // null = rest day
}

export interface Workout {
  id: string;
  type: "easy" | "long" | "tempo" | "interval" | "race_pace" | "recovery" | "rest" | "cross_train" | "strength";
  distanceKm: number;
  description: string;
  paces: Record<string, { min: number; max: number }>;
  durationMinutes: number;
  notes: string;
}

// ============================================
// PLAN BUILDER WIZARD TYPES
// ============================================

export interface PlanBuilderGoal {
  raceDistance: string;
  customDistanceMeters?: number;
  goalType: "finish" | "target_time" | "pr";
  targetTimeSeconds?: number;
  currentPrSeconds?: number;
  raceDate: string;
  raceName?: string;
}

export interface PlanBuilderFitness {
  recentRaceDistance: string;
  recentRaceTimeSeconds: number;
  recentRaceDate?: string;
  currentWeeklyKm: number;
  longestRecentRunKm: number;
  trainingDaysPerWeek: number;
  longRunDay: "saturday" | "sunday";
}

export interface PlanBuilderPreferences {
  includeCrossTraining: boolean;
  includeStrength: boolean;
  restDays: number[]; // day indices that cannot run
  injuryConcerns?: string;
}

export interface PlanBuilderData {
  goal: PlanBuilderGoal;
  fitness: PlanBuilderFitness;
  preferences: PlanBuilderPreferences;
}





// ============================================

export interface Profile {
  id: string;
  display_name: string | null;
  age: number | null;
  gender: string | null;
  weight_kg: number | null;
  experience_level: "beginner" | "intermediate" | "advanced";
  current_weekly_km: number | null;
  preferred_unit: "km" | "mile";
  max_hr: number | null;
  resting_hr: number | null;
  stripe_customer_id: string | null;
  subscription_status: "none" | "trialing" | "active" | "cancelled";
  trial_ends_at: string | null;
  // Strava
  strava_athlete_id: number | null;
  strava_access_token: string | null;
  strava_refresh_token: string | null;
  strava_token_expires_at: number | null;
  strava_connected_at: string | null;
  // Email preferences
  email_weekly_summary: boolean;
  email_notifications_enabled: boolean;
  created_at: string;
}

export interface StravaActivity {
  id: string;
  user_id: string;
  strava_activity_id: number;
  name: string | null;
  activity_type: string | null;
  distance_meters: number | null;
  moving_time_seconds: number | null;
  elapsed_time_seconds: number | null;
  total_elevation_gain: number | null;
  start_date: string | null;
  average_speed: number | null;
  max_speed: number | null;
  average_heartrate: number | null;
  max_heartrate: number | null;
  suffer_score: number | null;
  calories: number | null;
  map_polyline: string | null;
  synced_at: string;
}

export interface RaceResult {
  id: string;
  user_id: string;
  distance_meters: number;
  distance_name: string | null;
  time_seconds: number;
  date: string | null;
  notes: string | null;
  is_goal: boolean;
  created_at: string;
}

export interface TrainingPlanRow {
  id: string;
  user_id: string;
  name: string;
  goal_race_distance_meters: number;
  goal_race_time_seconds: number | null;
  goal_race_date: string;
  plan_start_date: string;
  plan_weeks: number;
  experience_level: string;
  weekly_days: number;
  plan_data: TrainingPlan;
  status: "active" | "completed" | "abandoned";
  created_at: string;
  updated_at: string;
}

export interface TrainingLogEntry {
  id: string;
  user_id: string;
  plan_id: string | null;
  planned_workout_id: string | null;
  date: string;
  distance_meters: number | null;
  time_seconds: number | null;
  workout_type: string | null;
  notes: string | null;
  perceived_effort: number | null;
  completed: boolean;
  created_at: string;
}

// ============================================
// TRAINING PLAN STRUCTURE
// ============================================

export interface TrainingPlan {
  meta: {
    totalWeeks: number;
    peakWeeklyKm: number;
    phases: { name: string; weeks: [number, number] }[];
  };
  weeks: TrainingWeek[];
}

export interface TrainingWeek {
  weekNumber: number;
  phase: string;
  targetKm: number;
  isRecoveryWeek: boolean;
  days: TrainingDay[];
}

export interface TrainingDay {
  dayOfWeek: number; // 0=Mon, 6=Sun
  workout: Workout | null; // null = rest day
}

export interface Workout {
  id: string;
  type: "easy" | "long" | "tempo" | "interval" | "race_pace" | "recovery" | "rest" | "cross_train" | "strength";
  distanceKm: number;
  description: string;
  paces: Record<string, { min: number; max: number }>;
  durationMinutes: number;
  notes: string;
}

// ============================================
// PLAN BUILDER WIZARD TYPES
// ============================================

export interface PlanBuilderGoal {
  raceDistance: string;
  customDistanceMeters?: number;
  goalType: "finish" | "target_time" | "pr";
  targetTimeSeconds?: number;
  currentPrSeconds?: number;
  raceDate: string;
  raceName?: string;
}

export interface PlanBuilderFitness {
  recentRaceDistance: string;
  recentRaceTimeSeconds: number;
  recentRaceDate?: string;
  currentWeeklyKm: number;
  longestRecentRunKm: number;
  trainingDaysPerWeek: number;
  longRunDay: "saturday" | "sunday";
}

export interface PlanBuilderPreferences {
  includeCrossTraining: boolean;
  includeStrength: boolean;
  restDays: number[]; // day indices that cannot run
  injuryConcerns?: string;
}

export interface PlanBuilderData {
  goal: PlanBuilderGoal;
  fitness: PlanBuilderFitness;
  preferences: PlanBuilderPreferences;
}


