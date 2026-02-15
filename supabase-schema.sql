-- ============================================
-- RunSplit Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  weight_kg NUMERIC,
  experience_level TEXT DEFAULT 'intermediate' CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  current_weekly_km NUMERIC,
  preferred_unit TEXT DEFAULT 'km' CHECK (preferred_unit IN ('km', 'mile')),
  max_hr INTEGER,
  resting_hr INTEGER,
  stripe_customer_id TEXT UNIQUE,
  subscription_status TEXT DEFAULT 'none' CHECK (subscription_status IN ('none', 'trialing', 'active', 'cancelled')),
  trial_ends_at TIMESTAMPTZ,
  -- Strava integration
  strava_athlete_id BIGINT UNIQUE,
  strava_access_token TEXT,
  strava_refresh_token TEXT,
  strava_token_expires_at BIGINT,
  strava_connected_at TIMESTAMPTZ,
  -- Email notifications
  email_weekly_summary BOOLEAN DEFAULT TRUE,
  email_notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================
-- RACE RESULTS
-- ============================================
CREATE TABLE IF NOT EXISTS race_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  distance_meters NUMERIC NOT NULL,
  distance_name TEXT,
  time_seconds NUMERIC NOT NULL,
  date DATE,
  notes TEXT,
  is_goal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_race_results_user ON race_results(user_id);

-- ============================================
-- TRAINING PLANS
-- ============================================
CREATE TABLE IF NOT EXISTS training_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal_race_distance_meters NUMERIC NOT NULL,
  goal_race_time_seconds NUMERIC,
  goal_race_date DATE NOT NULL,
  plan_start_date DATE NOT NULL,
  plan_weeks INTEGER NOT NULL,
  experience_level TEXT,
  weekly_days INTEGER,
  plan_data JSONB NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_training_plans_user ON training_plans(user_id);

-- ============================================
-- TRAINING LOG
-- ============================================
CREATE TABLE IF NOT EXISTS training_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES training_plans(id) ON DELETE SET NULL,
  planned_workout_id TEXT,
  date DATE NOT NULL,
  distance_meters NUMERIC,
  time_seconds NUMERIC,
  workout_type TEXT,
  notes TEXT,
  perceived_effort INTEGER CHECK (perceived_effort BETWEEN 1 AND 10),
  completed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_training_log_user ON training_log(user_id);
CREATE INDEX idx_training_log_plan ON training_log(plan_id);

-- ============================================
-- STRAVA ACTIVITIES
-- ============================================
CREATE TABLE IF NOT EXISTS strava_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strava_activity_id BIGINT UNIQUE NOT NULL,
  name TEXT,
  activity_type TEXT,
  distance_meters NUMERIC,
  moving_time_seconds INTEGER,
  elapsed_time_seconds INTEGER,
  total_elevation_gain NUMERIC,
  start_date TIMESTAMPTZ,
  average_speed NUMERIC,
  max_speed NUMERIC,
  average_heartrate NUMERIC,
  max_heartrate NUMERIC,
  suffer_score INTEGER,
  calories NUMERIC,
  map_polyline TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_strava_activities_user ON strava_activities(user_id);
CREATE INDEX idx_strava_activities_strava_id ON strava_activities(strava_activity_id);

-- ============================================
-- EMAIL LOG (track sent emails)
-- ============================================
CREATE TABLE IF NOT EXISTS email_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_email_log_user ON email_log(user_id);

-- ============================================
-- SUPPORT TICKETS (AI-powered support inbox)
-- ============================================
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  ai_response TEXT,
  status TEXT DEFAULT 'auto_replied' CHECK (status IN ('auto_replied', 'open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_support_tickets_email ON support_tickets(email);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Race Results
ALTER TABLE race_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own race results"
  ON race_results FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own race results"
  ON race_results FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own race results"
  ON race_results FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own race results"
  ON race_results FOR DELETE USING (auth.uid() = user_id);

-- Training Plans
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plans"
  ON training_plans FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plans"
  ON training_plans FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans"
  ON training_plans FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plans"
  ON training_plans FOR DELETE USING (auth.uid() = user_id);

-- Training Log
ALTER TABLE training_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own log entries"
  ON training_log FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own log entries"
  ON training_log FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own log entries"
  ON training_log FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own log entries"
  ON training_log FOR DELETE USING (auth.uid() = user_id);

-- Strava Activities
ALTER TABLE strava_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own strava activities"
  ON strava_activities FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own strava activities"
  ON strava_activities FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own strava activities"
  ON strava_activities FOR DELETE USING (auth.uid() = user_id);

-- Email Log
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email log"
  ON email_log FOR SELECT USING (auth.uid() = user_id);

