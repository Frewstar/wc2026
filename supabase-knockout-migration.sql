-- Knockout rounds migration — run in Supabase SQL Editor after initial schema

-- Entry columns for rounds 4–8
ALTER TABLE entries ADD COLUMN IF NOT EXISTS round4_team TEXT;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS round4_my_goals INT DEFAULT 0;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS round4_opp_goals INT DEFAULT 0;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS round5_team TEXT;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS round5_my_goals INT DEFAULT 0;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS round5_opp_goals INT DEFAULT 0;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS round6_team TEXT;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS round6_my_goals INT DEFAULT 0;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS round6_opp_goals INT DEFAULT 0;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS round7_team TEXT;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS round7_my_goals INT DEFAULT 0;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS round7_opp_goals INT DEFAULT 0;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS round8_team TEXT;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS round8_my_goals INT DEFAULT 0;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS round8_opp_goals INT DEFAULT 0;

-- Settings: knockout entry window + reveal flags
ALTER TABLE settings ADD COLUMN IF NOT EXISTS knockout_entries_open BOOLEAN DEFAULT FALSE;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS show_picks_r4 BOOLEAN DEFAULT FALSE;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS show_picks_r5 BOOLEAN DEFAULT FALSE;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS show_picks_r6 BOOLEAN DEFAULT FALSE;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS show_picks_r7 BOOLEAN DEFAULT FALSE;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS show_picks_r8 BOOLEAN DEFAULT FALSE;

-- Expand fixture/result rounds to 1–8
ALTER TABLE fixtures DROP CONSTRAINT IF EXISTS fixtures_round_check;
ALTER TABLE fixtures ADD CONSTRAINT fixtures_round_check CHECK (round >= 1 AND round <= 8);

ALTER TABLE results DROP CONSTRAINT IF EXISTS results_round_check;
ALTER TABLE results ADD CONSTRAINT results_round_check CHECK (round >= 1 AND round <= 8);
