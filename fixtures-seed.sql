-- WC2026 Group Stage Fixtures — all 72 matches, rounds 1‑3
-- Run this in your Supabase SQL Editor.
-- ON CONFLICT DO NOTHING means it's safe to re-run.

INSERT INTO fixtures (round, home_team, away_team) VALUES

-- ── ROUND 1 (Matchday 1) ──────────────────────────────────────────────────
-- Group A
(1, 'Mexico',           'South Africa'),
(1, 'South Korea',      'Czechia'),
-- Group B
(1, 'Canada',           'Bosnia & Herzegovina'),
(1, 'Qatar',            'Switzerland'),
-- Group C
(1, 'Brazil',           'Morocco'),
(1, 'Haiti',            'Scotland'),
-- Group D
(1, 'USA',              'Paraguay'),
(1, 'Australia',        'Türkiye'),
-- Group E
(1, 'Germany',          'Curaçao'),
(1, 'Ivory Coast',      'Ecuador'),
-- Group F
(1, 'Netherlands',      'Japan'),
(1, 'Sweden',           'Tunisia'),
-- Group G
(1, 'Belgium',          'Egypt'),
(1, 'Iran',             'New Zealand'),
-- Group H
(1, 'Spain',            'Cape Verde'),
(1, 'Saudi Arabia',     'Uruguay'),
-- Group I
(1, 'France',           'Senegal'),
(1, 'Iraq',             'Norway'),
-- Group J
(1, 'Argentina',        'Algeria'),
(1, 'Austria',          'Jordan'),
-- Group K
(1, 'Portugal',         'DR Congo'),
(1, 'Uzbekistan',       'Colombia'),
-- Group L
(1, 'England',          'Croatia'),
(1, 'Ghana',            'Panama'),

-- ── ROUND 2 (Matchday 2) ──────────────────────────────────────────────────
-- Group A
(2, 'Czechia',          'South Africa'),
(2, 'Mexico',           'South Korea'),
-- Group B
(2, 'Switzerland',      'Bosnia & Herzegovina'),
(2, 'Canada',           'Qatar'),
-- Group C
(2, 'Scotland',         'Morocco'),
(2, 'Brazil',           'Haiti'),
-- Group D
(2, 'USA',              'Australia'),
(2, 'Türkiye',          'Paraguay'),
-- Group E
(2, 'Germany',          'Ivory Coast'),
(2, 'Ecuador',          'Curaçao'),
-- Group F
(2, 'Tunisia',          'Japan'),
(2, 'Netherlands',      'Sweden'),
-- Group G
(2, 'Belgium',          'Iran'),
(2, 'New Zealand',      'Egypt'),
-- Group H
(2, 'Spain',            'Saudi Arabia'),
(2, 'Uruguay',          'Cape Verde'),
-- Group I
(2, 'France',           'Iraq'),
(2, 'Norway',           'Senegal'),
-- Group J
(2, 'Argentina',        'Austria'),
(2, 'Jordan',           'Algeria'),
-- Group K
(2, 'Portugal',         'Uzbekistan'),
(2, 'Colombia',         'DR Congo'),
-- Group L
(2, 'England',          'Ghana'),
(2, 'Panama',           'Croatia'),

-- ── ROUND 3 (Matchday 3) ──────────────────────────────────────────────────
-- Group A
(3, 'South Africa',     'South Korea'),
(3, 'Czechia',          'Mexico'),
-- Group B
(3, 'Switzerland',      'Canada'),
(3, 'Bosnia & Herzegovina', 'Qatar'),
-- Group C
(3, 'Scotland',         'Brazil'),
(3, 'Morocco',          'Haiti'),
-- Group D
(3, 'Türkiye',          'USA'),
(3, 'Paraguay',         'Australia'),
-- Group E
(3, 'Curaçao',          'Ivory Coast'),
(3, 'Ecuador',          'Germany'),
-- Group F
(3, 'Tunisia',          'Netherlands'),
(3, 'Japan',            'Sweden'),
-- Group G
(3, 'New Zealand',      'Belgium'),
(3, 'Egypt',            'Iran'),
-- Group H
(3, 'Cape Verde',       'Saudi Arabia'),
(3, 'Uruguay',          'Spain'),
-- Group I
(3, 'Norway',           'France'),
(3, 'Senegal',          'Iraq'),
-- Group J
(3, 'Algeria',          'Austria'),
(3, 'Jordan',           'Argentina'),
-- Group K
(3, 'Colombia',         'Portugal'),
(3, 'DR Congo',         'Uzbekistan'),
-- Group L
(3, 'Panama',           'England'),
(3, 'Croatia',          'Ghana')

ON CONFLICT DO NOTHING;
