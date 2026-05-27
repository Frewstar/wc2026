-- Tournament sync migration — run in Supabase SQL Editor after knockout migration

-- Fixture metadata for API sync & bracket slots
ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS api_fixture_id INT UNIQUE;
ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS match_slot INT;
ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS kickoff TIMESTAMPTZ;

-- Knockout winner when match went to penalties (fulltime draw)
ALTER TABLE results ADD COLUMN IF NOT EXISTS winner_team TEXT;

-- Unique bracket slot per knockout round (allows TBD placeholders)
CREATE UNIQUE INDEX IF NOT EXISTS fixtures_round_match_slot_idx
  ON fixtures (round, match_slot)
  WHERE match_slot IS NOT NULL;

-- Auto-advance winners when results saved manually
ALTER TABLE settings ADD COLUMN IF NOT EXISTS auto_advance_bracket BOOLEAN DEFAULT TRUE;

-- Round deadlines: JSON map of roundNum -> ISO kickoff time, e.g. {"1":"2026-06-11T18:00:00Z"}
ALTER TABLE settings ADD COLUMN IF NOT EXISTS round_deadlines TEXT DEFAULT '{}';

-- WhatsApp group link shown on home page to non-paid visitors
ALTER TABLE settings ADD COLUMN IF NOT EXISTS whatsapp_group_url TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS whatsapp_invite_text TEXT DEFAULT 'Want to join? Ask in the WhatsApp group to get added and make payment.';

-- Tiebreaker: golden goal (total tournament goals prediction)
ALTER TABLE entries ADD COLUMN IF NOT EXISTS golden_goal INT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS actual_golden_goal INT;

-- Payment tracking: admin marks each entry as paid before R1 deadline
ALTER TABLE entries ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT FALSE;
