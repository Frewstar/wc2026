-- WC2026 Predictor - Run this in Supabase SQL Editor

-- Entries: one row per person
CREATE TABLE IF NOT EXISTS entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  round1_team TEXT,
  round1_my_goals INT DEFAULT 0,
  round1_opp_goals INT DEFAULT 0,
  round2_team TEXT,
  round2_my_goals INT DEFAULT 0,
  round2_opp_goals INT DEFAULT 0,
  round3_team TEXT,
  round3_my_goals INT DEFAULT 0,
  round3_opp_goals INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fixtures: admin sets who plays who each round
CREATE TABLE IF NOT EXISTS fixtures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  round INT NOT NULL CHECK (round IN (1,2,3)),
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  UNIQUE(round, home_team),
  UNIQUE(round, away_team)
);

-- Results: admin enters actual scores after each round
CREATE TABLE IF NOT EXISTS results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  round INT NOT NULL CHECK (round IN (1,2,3)),
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_goals INT NOT NULL DEFAULT 0,
  away_goals INT NOT NULL DEFAULT 0,
  UNIQUE(round, home_team, away_team)
);

-- Settings: single row, controls the whole competition
CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY DEFAULT 1,
  admin_pass TEXT DEFAULT 'worldcup26',
  entries_open BOOLEAN DEFAULT TRUE,
  show_picks_r1 BOOLEAN DEFAULT FALSE,
  show_picks_r2 BOOLEAN DEFAULT FALSE,
  show_picks_r3 BOOLEAN DEFAULT FALSE
);

-- Seed default settings row
INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Players: participant whitelist (used for "still to pick" tracking)
CREATE TABLE IF NOT EXISTS players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Disable RLS (no user auth needed, API key controls access)
ALTER TABLE entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE fixtures DISABLE ROW LEVEL SECURITY;
ALTER TABLE results DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
