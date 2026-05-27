import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { API_HOST, WC_LEAGUE_ID, WC_SEASON } from '@/lib/api-football'

const CACHE_KEY = 'wc2026_scores'
const CACHE_TTL_MS = 15 * 60 * 1000  // 15 minutes

/**
 * GET /api/cached-scores
 *
 * Returns live/upcoming/finished WC2026 fixture data from API-Football,
 * cached in the Supabase api_cache table for 15 minutes.
 *
 * Cache hit  → return stored data (no API call)
 * Cache miss → fetch from API-Football, store result, return fresh data
 */
export async function GET() {
  // ── 1. Check cache ────────────────────────────────────────────────────────
  const { data: cached } = await supabaseAdmin
    .from('api_cache')
    .select('data, fetched_at')
    .eq('key', CACHE_KEY)
    .maybeSingle()

  if (cached?.fetched_at) {
    const age = Date.now() - new Date(cached.fetched_at).getTime()
    if (age < CACHE_TTL_MS) {
      return NextResponse.json({
        source: 'cache',
        fetched_at: cached.fetched_at,
        data: cached.data,
      })
    }
  }

  // ── 2. Fetch from API-Football ────────────────────────────────────────────
  const apiKey = process.env.API_SPORTS_KEY
  if (!apiKey) {
    // Return stale cache rather than nothing if key is missing
    if (cached?.data) {
      return NextResponse.json({
        source: 'cache_stale',
        fetched_at: cached.fetched_at,
        data: cached.data,
      })
    }
    return NextResponse.json({ error: 'API_SPORTS_KEY not configured' }, { status: 503 })
  }

  let freshData: unknown
  try {
    const res = await fetch(
      `${API_HOST}/fixtures?league=${WC_LEAGUE_ID}&season=${WC_SEASON}&status=LIVE,FT,NS`,
      {
        headers: { 'x-apisports-key': apiKey },
        cache: 'no-store',
      }
    )
    if (!res.ok) {
      throw new Error(`API-Football responded ${res.status}`)
    }
    freshData = await res.json()
  } catch (err) {
    // On fetch failure, return stale cache rather than an error
    if (cached?.data) {
      return NextResponse.json({
        source: 'cache_stale',
        fetched_at: cached.fetched_at,
        data: cached.data,
        warning: err instanceof Error ? err.message : 'API fetch failed',
      })
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch scores' },
      { status: 502 }
    )
  }

  // ── 3. Store in cache ─────────────────────────────────────────────────────
  const now = new Date().toISOString()
  await supabaseAdmin
    .from('api_cache')
    .upsert({ key: CACHE_KEY, data: freshData, fetched_at: now }, { onConflict: 'key' })

  return NextResponse.json({
    source: 'api',
    fetched_at: now,
    data: freshData,
  })
}
