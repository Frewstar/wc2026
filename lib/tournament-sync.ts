import { supabaseAdmin } from './supabase'
import { fetchAllFixtures, assignMatchSlots, type ApiFixtureParsed } from './api-football'
import {
  computeWinnerAdvances,
  buildR32FixturesFromStandings,
  PLACEHOLDER,
  type AdvanceUpdate,
} from './bracket'
import { parseDeadlines, mergeDeadlines } from './round-deadlines'
import type { Fixture, Result } from './scoring'

export type SyncReport = {
  fixturesUpserted: number
  resultsSynced: number
  advancesApplied: number
  apiFixturesFound: number
  deadlinesUpdated: number
}

async function extractAndStoreDeadlines(apiFixtures: ApiFixtureParsed[]): Promise<number> {
  const incoming: Record<string, string> = {}
  for (const f of apiFixtures) {
    if (!f.kickoff) continue
    const key = String(f.round)
    if (!incoming[key] || f.kickoff < incoming[key]) {
      incoming[key] = f.kickoff
    }
  }
  if (Object.keys(incoming).length === 0) return 0

  const { data: current } = await supabaseAdmin
    .from('settings')
    .select('round_deadlines')
    .eq('id', 1)
    .single()

  const existing = parseDeadlines(current?.round_deadlines)
  const merged = mergeDeadlines(existing, incoming)

  await supabaseAdmin
    .from('settings')
    .update({ round_deadlines: JSON.stringify(merged) })
    .eq('id', 1)

  return Object.keys(incoming).length
}

async function upsertFixtureFromApi(
  fix: ApiFixtureParsed,
  matchSlot: number | null
): Promise<boolean> {
  const row = {
    round: fix.round,
    home_team: fix.homeTeam,
    away_team: fix.awayTeam,
    api_fixture_id: fix.apiFixtureId,
    match_slot: matchSlot,
    source: 'api' as const,
    kickoff: fix.kickoff || null,
  }

  const { data: existing } = await supabaseAdmin
    .from('fixtures')
    .select('id')
    .eq('api_fixture_id', fix.apiFixtureId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabaseAdmin.from('fixtures').update(row).eq('id', existing.id)
    return !error
  }

  if (matchSlot != null && fix.round >= 4) {
    const { data: bySlot } = await supabaseAdmin
      .from('fixtures')
      .select('id, source')
      .eq('round', fix.round)
      .eq('match_slot', matchSlot)
      .maybeSingle()

    if (bySlot && bySlot.source === 'manual') {
      // Don't overwrite manual fixtures — update only if teams are TBD
      const { data: full } = await supabaseAdmin.from('fixtures').select('*').eq('id', bySlot.id).single()
      if (full && (full.home_team === PLACEHOLDER || full.away_team === PLACEHOLDER)) {
        await supabaseAdmin.from('fixtures').update(row).eq('id', bySlot.id)
        return true
      }
      return false
    }

    if (bySlot) {
      const { error } = await supabaseAdmin.from('fixtures').update(row).eq('id', bySlot.id)
      return !error
    }
  }

  // Group stage: match by round + teams
  const { data: byTeams } = await supabaseAdmin
    .from('fixtures')
    .select('id')
    .eq('round', fix.round)
    .eq('home_team', fix.homeTeam)
    .eq('away_team', fix.awayTeam)
    .maybeSingle()

  if (byTeams) {
    const { error } = await supabaseAdmin
      .from('fixtures')
      .update({ api_fixture_id: fix.apiFixtureId, match_slot: matchSlot, source: 'api' })
      .eq('id', byTeams.id)
    return !error
  }

  const { error } = await supabaseAdmin.from('fixtures').insert(row)
  return !error
}

async function upsertResultFromApi(fix: ApiFixtureParsed): Promise<boolean> {
  if (!fix.isFinished) return false

  const { error } = await supabaseAdmin.from('results').upsert(
    {
      round: fix.round,
      home_team: fix.homeTeam,
      away_team: fix.awayTeam,
      home_goals: fix.homeGoals,
      away_goals: fix.awayGoals,
      winner_team: fix.winnerTeam,
    },
    { onConflict: 'round,home_team,away_team' }
  )
  return !error
}

async function applyAdvances(updates: AdvanceUpdate[]): Promise<number> {
  let applied = 0

  for (const u of updates) {
    const { data: existing } = await supabaseAdmin
      .from('fixtures')
      .select('*')
      .eq('round', u.round)
      .eq('match_slot', u.match_slot)
      .maybeSingle()

    if (existing) {
      const patch: Record<string, string> = { source: 'computed' }
      if (u.home_team) patch.home_team = u.home_team
      if (u.away_team) patch.away_team = u.away_team
      const { error } = await supabaseAdmin.from('fixtures').update(patch).eq('id', existing.id)
      if (!error) applied++
    } else {
      const { error } = await supabaseAdmin.from('fixtures').insert({
        round: u.round,
        match_slot: u.match_slot,
        home_team: u.home_team ?? PLACEHOLDER,
        away_team: u.away_team ?? PLACEHOLDER,
        source: 'computed',
      })
      if (!error) applied++
    }
  }

  return applied
}

export async function syncFromApi(apiKey: string, advanceWinners = true): Promise<SyncReport> {
  const apiFixtures = await fetchAllFixtures(apiKey)
  const slotMaps = assignMatchSlots(apiFixtures)

  let fixturesUpserted = 0
  let resultsSynced = 0

  for (const fix of apiFixtures) {
    const slot = slotMaps.get(fix.round)?.get(fix.apiFixtureId) ?? null
    if (await upsertFixtureFromApi(fix, slot)) fixturesUpserted++
    if (await upsertResultFromApi(fix)) resultsSynced++
  }

  let advancesApplied = 0
  if (advanceWinners) {
    advancesApplied = await runAdvanceWinners()
  }

  const deadlinesUpdated = await extractAndStoreDeadlines(apiFixtures)

  return {
    fixturesUpserted,
    resultsSynced,
    advancesApplied,
    apiFixturesFound: apiFixtures.length,
    deadlinesUpdated,
  }
}

export async function runAdvanceWinners(): Promise<number> {
  const { data: fixtures } = await supabaseAdmin.from('fixtures').select('*')
  const { data: results } = await supabaseAdmin.from('results').select('*')
  if (!fixtures || !results) return 0

  const updates = computeWinnerAdvances(fixtures as Fixture[], results as Result[])
  return applyAdvances(updates)
}

export async function buildKnockoutFromStandings(): Promise<{
  fixturesCreated: number
  pendingThirdSlots: number[]
}> {
  const { data: results } = await supabaseAdmin.from('results').select('*')
  const { fixtures, pendingThirdSlots } = buildR32FixturesFromStandings((results ?? []) as Result[])

  let fixturesCreated = 0
  for (const f of fixtures) {
    const { data: existing } = await supabaseAdmin
      .from('fixtures')
      .select('id, source')
      .eq('round', f.round)
      .eq('match_slot', f.match_slot)
      .maybeSingle()

    if (existing?.source === 'api') continue

    if (existing) {
      await supabaseAdmin.from('fixtures').update({
        home_team: f.home_team,
        away_team: f.away_team,
        source: 'computed',
      }).eq('id', existing.id)
    } else {
      await supabaseAdmin.from('fixtures').insert({ ...f, source: 'computed' })
    }
    fixturesCreated++
  }

  return { fixturesCreated, pendingThirdSlots }
}
