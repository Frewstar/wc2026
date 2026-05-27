'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { TEAMS, type Entry, type Fixture, type Result, type Settings, calcPoints } from '@/lib/scoring'
import { getTeamGroup } from '@/lib/wc-groups'
import { formatUKKickoff } from '@/lib/uk-time'
import { parseDeadlines } from '@/lib/round-deadlines'
import { toUKInputValue, fromUKInputValue } from '@/lib/uk-time'
import { ROUNDS, pickField } from '@/lib/rounds'
import { PageHeader, SegmentedControl } from '@/components/ui'

type Tab = 'access' | 'players' | 'entries' | 'fixtures' | 'results' | 'settings' | 'help'
type Player = { id: string; name: string }
type Participant = {
  id: string
  name: string
  email: string
  token: string
  status: 'pending' | 'paid'
  created_at: string
  paid_at: string | null
  link_sent_at: string | null
}

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false)
  const [passInput, setPassInput] = useState('')
  const [passError, setPassError] = useState('')
  const [settings, setSettings] = useState<Settings | null>(null)
  const [tab, setTab] = useState<Tab>('players')
  const [entries, setEntries] = useState<Entry[]>([])
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [results, setResults] = useState<Result[]>([])
  const [players, setPlayers] = useState<Player[]>([])

  const [participants, setParticipants] = useState<Participant[]>([])
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [reminderRound, setReminderRound] = useState(1)
  const [reminding, setReminding] = useState(false)

  const [playerInput, setPlayerInput] = useState('')
  const [fxRound, setFxRound] = useState(1)
  const [fxHome, setFxHome] = useState('')
  const [fxAway, setFxAway] = useState('')
  const [resEdits, setResEdits] = useState<Record<string, number>>({})
  const [resRound, setResRound] = useState(1)
  const [syncing, setSyncing] = useState(false)
  const [advancing, setAdvancing] = useState(false)
  const [building, setBuilding] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [autoSync, setAutoSync] = useState(false)
  const [lastSynced, setLastSynced] = useState<string | null>(null)
  const autoSyncRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [toast, setToast] = useState('')
  const [winnerEdits, setWinnerEdits] = useState<Record<string, string>>({})

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const runSync = async (silent = false) => {
    if (!silent) setSyncing(true)
    try {
      const res = await fetch('/api/sync-results')
      const data = await res.json()
      await loadAll()
      setLastSynced(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      if (!silent && !data.error) {
        showToast(`Synced ${data.resultsSynced ?? 0} results, ${data.fixturesUpserted ?? 0} fixtures`)
      }
    } finally {
      if (!silent) setSyncing(false)
    }
  }

  useEffect(() => {
    if (autoSync) {
      runSync(true)
      autoSyncRef.current = setInterval(() => runSync(true), 60_000)
    } else {
      if (autoSyncRef.current) clearInterval(autoSyncRef.current)
    }
    return () => { if (autoSyncRef.current) clearInterval(autoSyncRef.current) }
  }, [autoSync]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadAll = async () => {
    const [e, f, r, s, p, pt] = await Promise.all([
      fetch('/api/entries').then(x => x.json()),
      fetch('/api/fixtures').then(x => x.json()),
      fetch('/api/results').then(x => x.json()),
      fetch('/api/settings').then(x => x.json()),
      fetch('/api/players').then(x => x.json()),
      fetch('/api/participants').then(x => x.json()),
    ])
    setEntries(e.entries || [])
    setFixtures(f.fixtures || [])
    setResults(r.results || [])
    setSettings(s.settings)
    setPlayers(p.players || [])
    setParticipants(pt.participants || [])
  }

  const handleLogin = async () => {
    const s = await fetch('/api/settings').then(r => r.json())
    if (passInput === s.settings?.admin_pass) {
      setSettings(s.settings)
      setUnlocked(true)
      loadAll()
    } else {
      setPassError('Incorrect password')
    }
  }

  const updateSettings = async (patch: Partial<Settings>) => {
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    await loadAll()
    showToast('Saved')
  }

  const confirmPayment = async (id: string) => {
    setConfirmingId(id)
    try {
      const res = await fetch('/api/participants/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error || 'Error confirming payment'); return }
      await loadAll()
      showToast('Payment confirmed — link sent ✓')
    } finally {
      setConfirmingId(null)
    }
  }

  const resendEmail = async (participant: Participant) => {
    setResendingId(participant.id)
    try {
      const res = await fetch('/api/participants/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: participant.id }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error || 'Error resending'); return }
      await loadAll()
      showToast('Email resent ✓')
    } finally {
      setResendingId(null)
    }
  }

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/pick/${token}`
    navigator.clipboard.writeText(url)
      .then(() => showToast('Link copied!'))
      .catch(() => showToast(url))
  }

  const sendReminder = async () => {
    setReminding(true)
    try {
      const res = await fetch('/api/participants/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round: reminderRound }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error || 'Error sending reminders'); return }
      showToast(data.message || `Sent ${data.sent} reminder${data.sent !== 1 ? 's' : ''}, skipped ${data.skipped} already picked`)
    } finally {
      setReminding(false)
    }
  }

  const addPlayer = async () => {
    const trimmed = playerInput.trim()
    if (!trimmed) { showToast('Enter a name'); return }
    const res = await fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    })
    if (!res.ok) { const d = await res.json(); showToast(d.error || 'Error'); return }
    setPlayerInput('')
    await loadAll()
    showToast('Player added')
  }

  const deletePlayer = async (id: string) => {
    await fetch(`/api/players?id=${id}`, { method: 'DELETE' })
    await loadAll()
    showToast('Player removed')
  }

  const addFixture = async () => {
    if (!fxHome || !fxAway) { showToast('Select both teams'); return }
    if (fxHome === fxAway) { showToast('Teams must be different'); return }
    await fetch('/api/fixtures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ round: fxRound, home_team: fxHome, away_team: fxAway }),
    })
    setFxHome(''); setFxAway('')
    await loadAll()
    showToast('Fixture added')
  }

  const deleteFixture = async (id: string) => {
    await fetch(`/api/fixtures?id=${id}`, { method: 'DELETE' })
    await loadAll()
    showToast('Fixture removed')
  }

  const saveResult = async (fix: Fixture) => {
    const existing = results.find(r => r.round === fix.round && r.home_team === fix.home_team)
    const hKey = `${fix.round}-${fix.home_team}-h`
    const aKey = `${fix.round}-${fix.home_team}-a`
    const wKey = `${fix.round}-${fix.home_team}-w`
    const hG = resEdits[hKey] ?? existing?.home_goals ?? 0
    const aG = resEdits[aKey] ?? existing?.away_goals ?? 0
    const winner = winnerEdits[wKey] ?? existing?.winner_team ?? null
    await fetch('/api/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        round: fix.round,
        home_team: fix.home_team,
        away_team: fix.away_team,
        home_goals: hG,
        away_goals: aG,
        winner_team: winner,
      }),
    })
    await loadAll()
    showToast('Result saved')
  }

  const syncResults = () => runSync(false)

  const advanceBracket = async () => {
    setAdvancing(true)
    const res = await fetch('/api/advance-bracket', { method: 'POST' })
    const data = await res.json()
    await loadAll()
    setAdvancing(false)
    showToast(data.error ? data.error : `Advanced ${data.applied ?? 0} teams to next round`)
  }

  const seedGroupFixtures = async () => {
    setSeeding(true)
    const res = await fetch('/api/seed-fixtures', { method: 'POST' })
    const data = await res.json()
    await loadAll()
    setSeeding(false)
    if (data.errors?.length) {
      showToast(`Seeded ${data.inserted} fixtures, ${data.errors.length} errors`)
    } else {
      showToast(`Seeded ${data.inserted} fixtures (${data.skipped} already existed)`)
    }
  }

  const buildKnockout = async () => {
    setBuilding(true)
    const res = await fetch('/api/build-knockout', { method: 'POST' })
    const data = await res.json()
    await loadAll()
    setBuilding(false)
    if (data.error) {
      showToast(data.error)
      return
    }
    const pending = (data.pendingThirdSlots ?? []).length
    showToast(
      `Built ${data.fixturesCreated ?? 0} Last 32 fixtures${pending ? ` (${pending} need 3rd-place sync)` : ''}`
    )
  }

  const deleteEntry = async (id: string) => {
    if (!confirm('Delete this entry?')) return
    await fetch(`/api/entries?id=${id}`, { method: 'DELETE' })
    await loadAll()
    showToast('Entry deleted')
  }

  const setJoker = async (entryId: string, jokerRound: number | null) => {
    const res = await fetch('/api/admin/set-joker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entry_id: entryId, joker_round: jokerRound }),
    })
    const data = await res.json()
    if (!res.ok) { showToast(data.error || 'Error setting joker'); return }
    await loadAll()
    showToast(jokerRound ? `🃏 Joker set to Round ${jokerRound}` : 'Joker removed')
  }

  const downloadCSV = (csv: string, filename: string) => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    a.download = filename
    a.click()
  }

  const exportLeaderboard = () => {
    // Sort by total descending
    const ranked = [...entries]
      .map(e => ({ e, ...calcPoints(e, results) }))
      .sort((a, b) => b.total - a.total)
      .map((item, i) => ({ ...item, rank: i + 1 }))

    const headers = [
      'Rank', 'Name', 'Paid', 'Golden Goal Pred', 'Total Pts',
      ...ROUNDS.flatMap(r => [`${r.short} Team`, `${r.short} Pred`, `${r.short} Pts`]),
      'Entered',
    ]
    const rows = ranked.map(({ e, total, rounds, rank }) => [
      rank,
      e.name,
      e.paid ? 'Yes' : 'No',
      e.golden_goal ?? '',
      total,
      ...ROUNDS.flatMap(r => {
        const team = e[pickField(r.num, 'team') as keyof Entry] as string | null
        const my = e[pickField(r.num, 'my_goals') as keyof Entry] as number
        const opp = e[pickField(r.num, 'opp_goals') as keyof Entry] as number
        return [team || '', `${my}-${opp}`, rounds[r.num].pts]
      }),
      new Date(e.created_at).toLocaleDateString('en-GB'),
    ])

    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    downloadCSV(csv, `wc2026-leaderboard-${new Date().toISOString().slice(0, 10)}.csv`)
    showToast('Leaderboard exported')
  }

  const exportFixtures = () => {
    const ROUND_LABELS: Record<number, string> = {
      1: 'Group MD1', 2: 'Group MD2', 3: 'Group MD3',
      4: 'Last 32', 5: 'Last 16', 6: 'Quarter-final', 7: 'Semi-final', 8: 'Final',
    }

    const sorted = [...fixtures].sort((a, b) => {
      if (Number(a.round) !== Number(b.round)) return Number(a.round) - Number(b.round)
      if (a.kickoff && b.kickoff) return a.kickoff.localeCompare(b.kickoff)
      return 0
    })

    const headers = ['Round', 'Group', 'Date & Time (UK)', 'Home Team', 'Home Goals', 'Away Goals', 'Away Team', 'Winner (pens)']
    const rows = sorted.map(f => {
      const res = results.find(r => Number(r.round) === Number(f.round) && r.home_team === f.home_team && r.away_team === f.away_team)
      const group = getTeamGroup(f.home_team) ?? getTeamGroup(f.away_team) ?? ''
      return [
        ROUND_LABELS[Number(f.round)] ?? `Round ${f.round}`,
        group ? `Group ${group}` : '',
        f.kickoff ? formatUKKickoff(f.kickoff) : '',
        f.home_team,
        res != null ? res.home_goals : '',
        res != null ? res.away_goals : '',
        f.away_team,
        res?.winner_team ?? '',
      ]
    })

    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    downloadCSV(csv, `wc2026-fixtures-${new Date().toISOString().slice(0, 10)}.csv`)
    showToast('Fixtures exported')
  }

  const exportCSV = exportLeaderboard

  const roundFixtures = fixtures.filter(f => Number(f.round) === fxRound)
  const usedInRound = roundFixtures.flatMap(f => [f.home_team, f.away_team])
  const availableTeams = TEAMS.filter(t => !usedInRound.includes(t))
  const resFixtures = fixtures.filter(f => Number(f.round) === resRound)

  const TABS: { key: Tab; label: string }[] = [
    { key: 'access', label: 'Access' },
    { key: 'players', label: 'Players' },
    { key: 'entries', label: 'Entries' },
    { key: 'fixtures', label: 'Fixtures' },
    { key: 'results', label: 'Results' },
    { key: 'settings', label: 'Settings' },
    { key: 'help', label: '❓ Help' },
  ]

  if (!unlocked) return (
    <div className="space-y-5">
      <PageHeader title="Admin Login" />
      <div className="glass-card p-6">
        <input
          type="password"
          placeholder="Password"
          value={passInput}
          onChange={e => setPassInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          className="input-field mb-3"
        />
        {passError && <p className="text-red-400 text-sm mb-3">{passError}</p>}
        <button onClick={handleLogin} className="btn-primary">Login</button>
        <p className="text-xs text-ink-faint mt-4 text-center">Default password: worldcup26</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      {toast && (
        <div className="alert-success font-medium">{toast}</div>
      )}

      <PageHeader
        title="Admin"
        actions={
          <button onClick={() => setUnlocked(false)} className="text-xs text-ink-faint hover:text-ink transition-colors">
            Logout
          </button>
        }
      />

      <div className="segmented-control overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`${tab === t.key ? 'segmented-btn-active' : 'segmented-btn-inactive'} whitespace-nowrap px-2`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'access' && (() => {
        const paid = entries.filter(e => e.paid)
        const unpaid = entries.filter(e => !e.paid)

        const togglePaid = async (entry: Entry) => {
          await fetch('/api/entries', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: entry.id, paid: !entry.paid }),
          })
          await loadAll()
          showToast(`${entry.name} marked as ${!entry.paid ? 'paid' : 'unpaid'}`)
        }

        const markAllPaid = async () => {
          if (!confirm(`Mark all ${unpaid.length} unpaid entries as paid?`)) return
          await Promise.all(unpaid.map(e =>
            fetch('/api/entries', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: e.id, paid: true }),
            })
          ))
          await loadAll()
          showToast(`All ${unpaid.length} entries marked as paid`)
        }

        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="glass-card p-4">
                <p className="text-2xl font-display font-bold text-ink">{entries.length}</p>
                <p className="text-xs text-ink-muted mt-1">Total entries</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-2xl font-display font-bold text-pitch-light">{paid.length}</p>
                <p className="text-xs text-ink-muted mt-1">Paid — in comp</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-2xl font-display font-bold text-amber-400">{unpaid.length}</p>
                <p className="text-xs text-ink-muted mt-1">Unpaid — excluded</p>
              </div>
            </div>

            {unpaid.length > 0 && (
              <div className="glass-card p-4 border border-amber-500/20">
                <div className="flex items-center justify-between mb-3">
                  <p className="section-label text-amber-400">Awaiting payment ({unpaid.length})</p>
                  <button onClick={markAllPaid} className="text-xs text-pitch-light hover:text-pitch transition-colors font-medium">
                    Mark all paid
                  </button>
                </div>
                <p className="text-xs text-ink-faint mb-3">These entries will be excluded from the competition when R1 kicks off unless you mark them as paid.</p>
                <div className="divide-y divide-theme">
                  {unpaid.map(e => (
                    <div key={e.id} className="flex items-center justify-between py-3">
                      <div>
                        <span className="text-sm font-medium">{e.name}</span>
                        <p className="text-[10px] text-ink-faint mt-0.5">
                          Entered {new Date(e.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => deleteEntry(e.id)}
                          className="text-red-400/60 text-xs hover:text-red-400 transition-colors"
                        >
                          Remove
                        </button>
                        <button
                          onClick={() => togglePaid(e)}
                          className="bg-pitch-gradient text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:brightness-110 transition"
                        >
                          Mark paid
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {paid.length > 0 && (
              <div className="glass-card p-4">
                <p className="section-label mb-3 text-pitch-light">Paid — in competition ({paid.length})</p>
                <div className="divide-y divide-theme">
                  {paid.map(e => {
                    const pts = calcPoints(e, results).total
                    return (
                      <div key={e.id} className="flex items-center justify-between py-3">
                        <div>
                          <span className="text-sm font-medium">{e.name}</span>
                          <p className="text-[10px] text-ink-faint mt-0.5">{pts} pts</p>
                        </div>
                        <button
                          onClick={() => togglePaid(e)}
                          className="text-xs text-ink-faint hover:text-amber-400 transition-colors border border-theme rounded-lg px-3 py-1.5"
                        >
                          Unmark paid
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {entries.length === 0 && (
              <p className="text-sm text-ink-muted text-center py-8">No entries yet</p>
            )}
          </div>
        )
      })()}

      {tab === 'players' && (() => {
        const pending = participants.filter(p => p.status === 'pending')
        const paid = participants.filter(p => p.status === 'paid')
        const entryNames = new Set(entries.map(e => e.name.toLowerCase()))
        const appUrl = typeof window !== 'undefined' ? window.location.origin : ''

        return (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="glass-card p-4">
                <p className="text-2xl font-display font-bold text-ink">{participants.length}</p>
                <p className="text-xs text-ink-muted mt-1">Registered</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-2xl font-display font-bold text-amber-400">{pending.length}</p>
                <p className="text-xs text-ink-muted mt-1">Pending</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-2xl font-display font-bold text-pitch-light">{paid.length}</p>
                <p className="text-xs text-ink-muted mt-1">Paid</p>
              </div>
            </div>

            {/* Pending */}
            {pending.length > 0 && (
              <div className="glass-card p-4 border border-amber-500/20">
                <p className="section-label text-amber-400 mb-3">Awaiting payment ({pending.length})</p>
                <div className="divide-y divide-theme">
                  {pending.map(p => (
                    <div key={p.id} className="py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-ink truncate">{p.name}</p>
                          <p className="text-xs text-ink-faint truncate">{p.email}</p>
                          <p className="text-[10px] text-ink-faint mt-0.5">
                            Registered {new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              if (confirm(`Delete ${p.name}?`)) {
                                fetch(`/api/participants?id=${p.id}`, { method: 'DELETE' }).then(() => loadAll())
                              }
                            }}
                            className="text-red-400/60 text-xs hover:text-red-400 transition-colors"
                          >
                            Remove
                          </button>
                          <button
                            onClick={() => confirmPayment(p.id)}
                            disabled={confirmingId === p.id}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50 whitespace-nowrap"
                          >
                            {confirmingId === p.id ? 'Sending…' : '✅ Confirm Payment'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Paid */}
            {paid.length > 0 && (
              <div className="glass-card p-4">
                <p className="section-label text-pitch-light mb-3">Paid — in competition ({paid.length})</p>
                <div className="divide-y divide-theme">
                  {paid.map(p => {
                    const hasPicked = entryNames.has(p.name.toLowerCase())
                    return (
                      <div key={p.id} className="py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-ink">{p.name}</p>
                              <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">✓ Paid</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${hasPicked ? 'bg-pitch-muted text-pitch-light border-pitch/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
                                {hasPicked ? '✓ Picked' : '⏳ Pending picks'}
                              </span>
                            </div>
                            <p className="text-xs text-ink-faint truncate mt-0.5">{p.email}</p>
                            {p.link_sent_at && (
                              <p className="text-[10px] text-ink-faint mt-0.5">
                                Link sent {new Date(p.link_sent_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                            <button
                              onClick={() => copyLink(p.token)}
                              className="btn-secondary text-[11px] px-2.5 py-1"
                            >
                              📋 Copy link
                            </button>
                            <button
                              onClick={() => resendEmail(p)}
                              disabled={resendingId === p.id}
                              className="btn-secondary text-[11px] px-2.5 py-1 disabled:opacity-50"
                            >
                              {resendingId === p.id ? 'Sending…' : '📧 Resend'}
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Remove ${p.name}?`)) {
                                  fetch(`/api/participants?id=${p.id}`, { method: 'DELETE' }).then(() => loadAll())
                                }
                              }}
                              className="text-red-400/60 text-xs hover:text-red-400 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-[10px] text-ink-faint break-all">{appUrl}/pick/{p.token}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {participants.length === 0 && (
              <div className="glass-card p-8 text-center">
                <p className="text-sm text-ink-muted">No registrations yet</p>
                <p className="text-xs text-ink-faint mt-1">Share the link so people can register</p>
              </div>
            )}
          </div>
        )
      })()}

      {tab === 'entries' && (
        <div className="space-y-3">
          <div className="glass-card p-4 space-y-3">
            <p className="text-sm font-semibold">Export to spreadsheet</p>
            <p className="text-xs text-ink-faint leading-relaxed">Download CSV files — open in Excel or Google Sheets as a backup. Can be used to update scores manually if the app is unavailable.</p>
            <div className="flex gap-2">
              <button onClick={exportLeaderboard} className="btn-secondary text-xs px-3 py-2 flex-1">
                Leaderboard (entries + scores)
              </button>
              <button onClick={exportFixtures} className="btn-secondary text-xs px-3 py-2 flex-1">
                Fixtures + results
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-muted">{entries.length} entries</span>
          </div>
          {entries.length === 0 ? (
            <p className="text-ink-muted text-sm text-center py-8">No entries yet</p>
          ) : (
            <div className="glass-card divide-y divide-white/[0.04]">
              {entries.map(e => {
                const { total } = calcPoints(e, results)
                const jokerRoundDef = ROUNDS.find(r => r.num === e.joker_round)
                return (
                  <div key={e.id} className="px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm">{e.name}</div>
                        <div className="text-xs text-ink-faint truncate max-w-[180px]">
                          {ROUNDS.map(r => e[pickField(r.num, 'team') as keyof Entry] || '—').join(' · ')}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-display font-bold text-gold">{total}</span>
                        <button onClick={() => deleteEntry(e.id)} className="text-red-400/70 text-xs hover:text-red-400 transition-colors">Remove</button>
                      </div>
                    </div>
                    {/* Joker status — player-managed, admin can remove if needed */}
                    <div className="flex items-center gap-2 pt-1.5 border-t border-white/[0.04]">
                      <span className="text-[11px] text-ink-faint shrink-0">🃏 Joker:</span>
                      {e.joker_used ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-amber-400">
                            Played — {jokerRoundDef ? jokerRoundDef.label : `R${e.joker_round}`}
                          </span>
                          <button
                            onClick={() => setJoker(e.id, null)}
                            className="text-[11px] text-red-400/60 hover:text-red-400 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-ink-faint italic">Not used — player chooses</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'fixtures' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-ink-muted">{fixtures.length} fixtures in database</span>
            <span className="text-xs text-ink-faint">
              R1: {fixtures.filter(f => Number(f.round) === 1).length} ·
              R2: {fixtures.filter(f => Number(f.round) === 2).length} ·
              R3: {fixtures.filter(f => Number(f.round) === 3).length}
            </span>
          </div>

          {/* Primary action — seed all group games first */}
          <div className="glass-card p-4">
            <p className="text-sm font-semibold mb-1">Group stage fixtures</p>
            <p className="text-xs text-ink-faint mb-3 leading-relaxed">
              Load all 72 group stage games (Rounds 1–3) with kickoff times. Run once before the tournament starts. Already-existing fixtures are skipped.
            </p>
            <button
              onClick={seedGroupFixtures}
              disabled={seeding}
              className="btn-primary text-sm py-2.5 w-full disabled:opacity-50"
            >
              {seeding ? 'Loading fixtures…' : `Seed all 72 group fixtures`}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={syncResults}
              disabled={syncing}
              className="btn-secondary text-xs px-3 py-2 disabled:opacity-50"
            >
              {syncing ? 'Syncing…' : 'Sync + update from API'}
            </button>
            <button
              onClick={buildKnockout}
              disabled={building}
              className="btn-secondary text-xs px-3 py-2 disabled:opacity-50"
            >
              {building ? 'Building…' : 'Build Last 32 from groups'}
            </button>
            <button
              onClick={advanceBracket}
              disabled={advancing}
              className="btn-secondary text-xs px-3 py-2 disabled:opacity-50"
            >
              {advancing ? 'Advancing…' : 'Advance winners'}
            </button>
          </div>
          <p className="text-xs text-ink-faint leading-relaxed">
            API sync updates kickoff times, results, and advances knockout winners automatically.
          </p>
          <SegmentedControl
            options={ROUNDS.map(r => ({ value: r.num, label: r.short }))}
            value={fxRound}
            onChange={setFxRound}
          />
          <div className="glass-card p-4 space-y-3">
            <p className="section-label">Add fixture — {ROUNDS.find(r => r.num === fxRound)?.label}</p>
            <div className="grid grid-cols-2 gap-2">
              <select value={fxHome} onChange={e => setFxHome(e.target.value)} className="input-field-sm">
                <option value="">Home team</option>
                {availableTeams.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={fxAway} onChange={e => setFxAway(e.target.value)} className="input-field-sm">
                <option value="">Away team</option>
                {availableTeams.filter(t => t !== fxHome).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <button onClick={addFixture} className="btn-primary text-sm py-2.5">
              Add Fixture
            </button>
          </div>
          <div className="glass-card divide-y divide-white/[0.04]">
            {roundFixtures.length === 0 ? (
              <p className="text-ink-muted text-sm text-center py-8">No fixtures for {ROUNDS.find(r => r.num === fxRound)?.label}</p>
            ) : roundFixtures.map(f => (
              <div key={f.id} className="flex items-center justify-between px-4 py-3 gap-2">
                <span className="text-sm min-w-0 truncate">
                  {f.home_team} <span className="text-ink-faint">vs</span> {f.away_team}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {f.source && f.source !== 'manual' && (
                    <span className="text-[10px] text-ink-faint uppercase">{f.source}</span>
                  )}
                  <button onClick={() => deleteFixture(f.id)} className="text-red-400/70 text-xs hover:text-red-400 transition-colors">Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'results' && (
        <div className="space-y-3">
          <div className="glass-card p-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Auto-sync scores</p>
              <p className="text-xs text-ink-faint mt-0.5">
                {autoSync
                  ? `Syncing every 60s${lastSynced ? ` · last: ${lastSynced}` : ''}`
                  : 'Polls API every 60s while this page is open'}
              </p>
            </div>
            <button
              onClick={() => setAutoSync(v => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 transition-colors ${autoSync ? 'bg-pitch border-pitch' : 'bg-white/10 border-white/20'}`}
            >
              <span className={`inline-block h-4 w-4 mt-px rounded-full bg-white shadow transition-transform ${autoSync ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              onClick={syncResults}
              disabled={syncing}
              className="btn-secondary text-xs px-3 py-2 disabled:opacity-50"
            >
              {syncing ? 'Syncing…' : 'Sync now'}
            </button>
            <button
              onClick={advanceBracket}
              disabled={advancing}
              className="btn-secondary text-xs px-3 py-2 disabled:opacity-50"
            >
              {advancing ? 'Advancing…' : 'Advance winners'}
            </button>
          </div>
          <SegmentedControl
            options={ROUNDS.map(r => ({ value: r.num, label: r.short }))}
            value={resRound}
            onChange={setResRound}
          />
          {resFixtures.length === 0 ? (
            <p className="text-ink-muted text-sm text-center py-8">Add fixtures first</p>
          ) : resFixtures.map(f => {
            const existing = results.find(r => r.round === f.round && r.home_team === f.home_team)
            const hKey = `${f.round}-${f.home_team}-h`
            const aKey = `${f.round}-${f.home_team}-a`
            const wKey = `${f.round}-${f.home_team}-w`
            const isKnockout = f.round >= 4
            return (
              <div key={f.id} className="glass-card p-4">
                <p className="font-semibold text-sm mb-3">{f.home_team} vs {f.away_team}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <input type="number" min="0" max="20"
                    defaultValue={existing?.home_goals ?? 0}
                    onChange={e => setResEdits(p => ({ ...p, [hKey]: parseInt(e.target.value) || 0 }))}
                    className="w-16 input-field-sm text-center text-lg font-bold"
                  />
                  <span className="text-ink-faint text-lg">–</span>
                  <input type="number" min="0" max="20"
                    defaultValue={existing?.away_goals ?? 0}
                    onChange={e => setResEdits(p => ({ ...p, [aKey]: parseInt(e.target.value) || 0 }))}
                    className="w-16 input-field-sm text-center text-lg font-bold"
                  />
                  {isKnockout && (
                    <select
                      defaultValue={existing?.winner_team ?? ''}
                      onChange={e => setWinnerEdits(p => ({ ...p, [wKey]: e.target.value }))}
                      className="input-field-sm text-xs flex-1 min-w-[120px]"
                    >
                      <option value="">Winner (if pens)</option>
                      <option value={f.home_team}>{f.home_team}</option>
                      <option value={f.away_team}>{f.away_team}</option>
                    </select>
                  )}
                  <button onClick={() => saveResult(f)}
                    className="ml-auto bg-pitch-gradient text-white rounded-xl px-4 py-2 text-sm font-semibold hover:brightness-110 transition">
                    Save
                  </button>
                </div>
                {existing && (
                  <p className="text-xs text-emerald-400 mt-2">
                    Saved: {existing.home_goals}–{existing.away_goals}
                    {existing.winner_team ? ` · Winner: ${existing.winner_team}` : ''}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {tab === 'settings' && settings && (
        <div className="space-y-3">
          <div className="glass-card p-4">
            <p className="text-sm font-semibold mb-3">Group stage entries</p>
            <div className="flex gap-2">
              <button onClick={() => updateSettings({ entries_open: true })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition border ${settings.entries_open ? 'bg-pitch-gradient text-white border-pitch' : 'border-white/[0.08] text-ink-muted hover:bg-white/[0.03]'}`}>
                Open
              </button>
              <button onClick={() => updateSettings({ entries_open: false })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition border ${!settings.entries_open ? 'bg-red-500/80 text-white border-red-500' : 'border-white/[0.08] text-ink-muted hover:bg-white/[0.03]'}`}>
                Closed
              </button>
            </div>
          </div>

          <div className="glass-card p-4">
            <p className="text-sm font-semibold mb-3">Knockout entries</p>
            <p className="text-xs text-ink-faint mb-3">Open when group stage is done — everyone picks Last 32 through Final</p>
            <div className="flex gap-2">
              <button onClick={() => updateSettings({ knockout_entries_open: true })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition border ${settings.knockout_entries_open ? 'bg-pitch-gradient text-white border-pitch' : 'border-white/[0.08] text-ink-muted hover:bg-white/[0.03]'}`}>
                Open
              </button>
              <button onClick={() => updateSettings({ knockout_entries_open: false })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition border ${!settings.knockout_entries_open ? 'bg-red-500/80 text-white border-red-500' : 'border-white/[0.08] text-ink-muted hover:bg-white/[0.03]'}`}>
                Closed
              </button>
            </div>
          </div>

          <div className="glass-card p-4">
            <p className="text-sm font-semibold mb-3">Auto-advance bracket</p>
            <p className="text-xs text-ink-faint mb-3">When knockout results are saved, winners move to the next round automatically</p>
            <div className="flex gap-2">
              <button onClick={() => updateSettings({ auto_advance_bracket: true })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition border ${settings.auto_advance_bracket !== false ? 'bg-pitch-gradient text-white border-pitch' : 'border-white/[0.08] text-ink-muted hover:bg-white/[0.03]'}`}>
                On
              </button>
              <button onClick={() => updateSettings({ auto_advance_bracket: false })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition border ${settings.auto_advance_bracket === false ? 'bg-white/10 text-ink border-white/10' : 'border-white/[0.08] text-ink-muted hover:bg-white/[0.03]'}`}>
                Off
              </button>
            </div>
          </div>

          <div className="glass-card p-4">
            <p className="text-sm font-semibold mb-1">Reveal picks</p>
            <p className="text-xs text-ink-faint mb-3">Reveal ~1 hour before each round&apos;s kick-off</p>
            {ROUNDS.map(r => {
              const field = `show_picks_r${r.num}` as keyof Settings
              const val = settings[field] as boolean
              return (
              <div key={field} className="flex items-center justify-between py-2.5 border-t border-white/[0.04]">
                <span className="text-sm">{r.label}</span>
                <div className="flex gap-2">
                  <button onClick={() => updateSettings({ [field]: true })}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition ${val ? 'bg-pitch-gradient text-white border-pitch' : 'border-white/[0.08] text-ink-muted hover:bg-white/[0.03]'}`}>
                    Reveal
                  </button>
                  <button onClick={() => updateSettings({ [field]: false })}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition ${!val ? 'bg-white/10 text-ink border-white/10' : 'border-white/[0.08] text-ink-faint hover:bg-white/[0.03]'}`}>
                    Hide
                  </button>
                </div>
              </div>
            )})}
          </div>

          <div className="glass-card p-4">
            <p className="text-sm font-semibold mb-1">Pick deadlines</p>
            <p className="text-xs text-ink-faint mb-3">Auto-set from API sync (earliest kick-off per round). All times in UK time (BST/GMT).</p>
            <div className="space-y-2">
              {ROUNDS.map(r => {
                const deadlines = parseDeadlines(settings.round_deadlines)
                const val = deadlines[String(r.num)] ?? ''
                const isLocked = val ? new Date(val).getTime() <= Date.now() : false
                return (
                  <div key={r.num} className="flex items-center gap-2">
                    <span className={`text-xs w-6 font-display font-bold shrink-0 ${isLocked ? 'text-red-400' : 'text-pitch-light'}`}>
                      {r.short}
                    </span>
                    <input
                      type="datetime-local"
                      defaultValue={toUKInputValue(val)}
                      onBlur={e => {
                        const iso = e.target.value ? fromUKInputValue(e.target.value) : ''
                        const updated = { ...parseDeadlines(settings.round_deadlines), [String(r.num)]: iso }
                        if (!iso) delete updated[String(r.num)]
                        updateSettings({ round_deadlines: JSON.stringify(updated) })
                      }}
                      className="input-field-sm flex-1 text-xs"
                    />
                    {isLocked && <span className="text-[10px] text-red-400 shrink-0">locked</span>}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="glass-card p-4">
            <p className="text-sm font-semibold mb-1">Golden Goal — actual total</p>
            <p className="text-xs text-ink-faint mb-3">
              Enter the total goals scored in the whole tournament once it&apos;s finished. This resolves tiebreakers automatically.
            </p>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min={0}
                placeholder="e.g. 172"
                defaultValue={settings.actual_golden_goal ?? ''}
                id="actual-gg"
                className="input-field-sm w-32"
              />
              <button onClick={() => {
                const val = (document.getElementById('actual-gg') as HTMLInputElement)?.value
                updateSettings({ actual_golden_goal: val ? parseInt(val) : null })
              }} className="btn-secondary text-sm py-2">Save</button>
              {settings.actual_golden_goal != null && (
                <span className="text-xs text-pitch-light font-medium">{settings.actual_golden_goal} goals set</span>
              )}
            </div>
          </div>

          <div className="glass-card p-4">
            <p className="text-sm font-semibold mb-1">WhatsApp group link</p>
            <p className="text-xs text-ink-faint mb-3">Shown on the home page when someone tries to enter but isn&apos;t on the paid list.</p>
            <input
              type="url"
              placeholder="https://chat.whatsapp.com/..."
              defaultValue={settings.whatsapp_group_url ?? ''}
              id="wa-url"
              className="input-field-sm mb-2"
            />
            <p className="text-xs text-ink-faint mb-2 mt-3">Invite message shown to non-paid visitors</p>
            <textarea
              defaultValue={settings.whatsapp_invite_text ?? 'Want to join? Ask in the WhatsApp group to get added and make payment.'}
              id="wa-text"
              rows={2}
              className="input-field-sm mb-2 resize-none w-full text-xs"
            />
            <button onClick={() => {
              const url = (document.getElementById('wa-url') as HTMLInputElement)?.value?.trim()
              const text = (document.getElementById('wa-text') as HTMLTextAreaElement)?.value?.trim()
              updateSettings({ whatsapp_group_url: url || null, whatsapp_invite_text: text || null })
            }} className="btn-secondary text-sm py-2.5">
              Save
            </button>
          </div>

          {/* Current round control */}
          <div className="glass-card p-4">
            <p className="text-sm font-semibold mb-1">Current round</p>
            <p className="text-xs text-ink-faint mb-3">
              Set which round is currently open for picks. Participants see the pick form for this round on their personal dashboard.
            </p>
            <div className="flex gap-2 items-center mb-3">
              <select
                value={settings.current_round ?? ''}
                onChange={e => {
                  const val = e.target.value
                  updateSettings({ current_round: val ? parseInt(val) : null })
                }}
                className="input-field-sm flex-1"
              >
                <option value="">— No round open —</option>
                {ROUNDS.map(r => (
                  <option key={r.num} value={r.num}>{r.label}</option>
                ))}
              </select>
              <button
                onClick={() => updateSettings({ current_round: null })}
                className="btn-secondary text-xs px-3 py-2 text-red-400 hover:text-red-300"
              >
                Close
              </button>
            </div>
            {/* Round status grid */}
            <div className="space-y-1">
              {(() => {
                const deadlines = parseDeadlines(settings.round_deadlines)
                return ROUNDS.map(r => {
                  const isCurrent = settings.current_round === r.num
                  const isLocked = deadlines[String(r.num)]
                    ? new Date(deadlines[String(r.num)]).getTime() <= Date.now()
                    : false
                  return (
                    <div
                      key={r.num}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs ${
                        isCurrent ? 'bg-pitch-muted border border-pitch/20' : 'bg-white/[0.02]'
                      }`}
                    >
                      <span className={`font-medium ${isCurrent ? 'text-pitch-light' : 'text-ink-muted'}`}>
                        {r.label}
                      </span>
                      <span className={
                        isCurrent ? 'text-emerald-400 font-semibold' :
                        isLocked ? 'text-red-400/70' :
                        'text-ink-faint'
                      }>
                        {isCurrent ? '● Open' : isLocked ? '🔒 Locked' : '—'}
                      </span>
                    </div>
                  )
                })
              })()}
            </div>
          </div>

          <div className="glass-card p-4">
            <p className="text-sm font-semibold mb-1">Send round reminder</p>
            <p className="text-xs text-ink-faint mb-3">
              Email all paid participants who haven&apos;t picked for the selected round yet.
            </p>
            <div className="flex gap-2 items-center">
              <select
                value={reminderRound}
                onChange={e => setReminderRound(Number(e.target.value))}
                className="input-field-sm flex-1"
              >
                {ROUNDS.map(r => (
                  <option key={r.num} value={r.num}>{r.label}</option>
                ))}
              </select>
              <button
                onClick={sendReminder}
                disabled={reminding}
                className="bg-pitch-gradient text-white text-sm font-semibold px-4 py-2 rounded-xl hover:brightness-110 transition disabled:opacity-50 whitespace-nowrap"
              >
                {reminding ? 'Sending…' : '📧 Send Reminder'}
              </button>
            </div>
          </div>

          <div className="glass-card p-4">
            <p className="text-sm font-semibold mb-3">Change admin password</p>
            <input type="text" placeholder="New password"
              defaultValue={settings.admin_pass}
              id="new-pass"
              className="input-field-sm mb-2"
            />
            <button onClick={() => {
              const np = (document.getElementById('new-pass') as HTMLInputElement)?.value?.trim()
              if (np) updateSettings({ admin_pass: np })
            }}
              className="btn-secondary text-sm py-2.5">
              Update Password
            </button>
          </div>
        </div>
      )}

      {tab === 'help' && (
        <div className="space-y-4">

          {/* Quick summary */}
          <div className="glass-card p-5 border border-pitch/20">
            <p className="text-sm font-semibold text-ink mb-1">👋 Hi Jim!</p>
            <p className="text-xs text-ink-muted leading-relaxed">
              This guide covers everything you need to run each round. Most of your work happens in the <strong className="text-ink">Results</strong> tab (entering scores) and <strong className="text-ink">Settings</strong> tab (opening rounds). Everything else is self-explanatory but it&apos;s all covered below.
            </p>
          </div>

          {/* Before the tournament */}
          <div className="glass-card p-5">
            <p className="text-sm font-semibold text-pitch-light mb-3">🚀 Before the tournament starts (one-off)</p>
            <div className="space-y-3">
              {[
                { n: '1', title: 'Seed the fixtures', body: 'Go to the Fixtures tab → click "Seed all 72 group fixtures". This loads all group stage matches with kick-off times automatically. Only needs doing once.' },
                { n: '2', title: 'Check deadlines are set', body: 'Go to Settings → Pick deadlines. These should auto-fill after seeding. They control when each round locks — picks are blocked after the deadline.' },
                { n: '3', title: 'Open Round 1', body: 'Go to Settings → Current round → select "Group Matchday 1" → save. This opens the pick form for all participants.' },
                { n: '4', title: 'Confirm participants are paid', body: 'Go to Players tab. Anyone in the Awaiting Payment section needs to be confirmed before the tournament starts or they\'ll be excluded from the leaderboard.' },
              ].map(step => (
                <div key={step.n} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-pitch-muted text-pitch-light text-xs font-bold flex items-center justify-center">{step.n}</span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{step.title}</p>
                    <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Each round */}
          <div className="glass-card p-5">
            <p className="text-sm font-semibold text-ink mb-3">🔁 Every round — what to do</p>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-pitch-light uppercase tracking-wide mb-2">A few days before kick-off</p>
                <div className="space-y-2 pl-3 border-l-2 border-pitch/20">
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Go to <strong className="text-ink">Settings → Current round</strong> and select the upcoming round. This opens the pick form so participants can start making their picks.
                  </p>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Send a reminder email from <strong className="text-ink">Settings → Send round reminder</strong> if you want to nudge anyone who hasn&apos;t picked yet.
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-2">~1 hour before kick-off</p>
                <div className="space-y-2 pl-3 border-l-2 border-amber-500/20">
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Go to <strong className="text-ink">Settings → Reveal picks</strong> and click <strong className="text-ink">Reveal</strong> for that round. This shows everyone&apos;s picks on the leaderboard. Do this just before kick-off so nobody copies each other.
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-2">After the matches finish</p>
                <div className="space-y-2 pl-3 border-l-2 border-emerald-500/20">
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Go to the <strong className="text-ink">Results tab</strong>, select the round, and enter the final score for each match. Hit <strong className="text-ink">Save</strong> after each one. Points update on the leaderboard instantly.
                  </p>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Or hit <strong className="text-ink">Sync now</strong> — this pulls scores from the football API automatically if the matches are finished.
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">Knockout rounds only (Round 4–8)</p>
                <div className="space-y-2 pl-3 border-l-2 border-white/10">
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Go to the <strong className="text-ink">Entries tab</strong>. Each player has a 🃏 Joker row — use the dropdown to assign which round their joker is played on. The player gets an email automatically. Each player can only have one joker.
                  </p>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    For knockout matches that go to penalties, enter the score at 90 minutes in the score fields, then select the winning team in the <strong className="text-ink">Winner (if pens)</strong> dropdown.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tab guide */}
          <div className="glass-card p-5">
            <p className="text-sm font-semibold text-ink mb-3">📖 What each tab does</p>
            <div className="space-y-3">
              {[
                { tab: 'Players', icon: '👥', desc: 'See who has registered and who has paid. Click "Confirm Payment" to approve someone and send them their personal picks link by email.' },
                { tab: 'Entries', icon: '📝', desc: 'View all picks across every round. Assign or remove jokers for knockout rounds. Export to CSV spreadsheet as a backup.' },
                { tab: 'Fixtures', icon: '📅', desc: 'The list of matches for each round. Seed all 72 group games with one button. Knockout fixtures get added automatically as teams progress.' },
                { tab: 'Results', icon: '⚽', desc: 'Enter final scores after each round. Use "Sync now" to pull scores from the API automatically. Points update on the leaderboard the moment you save.' },
                { tab: 'Settings', icon: '⚙️', desc: 'Open/close rounds, set pick deadlines, reveal picks before kick-off, send reminder emails, set the Golden Goal total at the end, and manage the admin password.' },
                { tab: 'Access', icon: '🔐', desc: 'Manually mark entries as paid or unpaid. Useful if someone paid outside the normal flow.' },
              ].map(item => (
                <div key={item.tab} className="flex gap-3">
                  <span className="text-base shrink-0 mt-0.5">{item.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{item.tab}</p>
                    <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="glass-card p-5">
            <p className="text-sm font-semibold text-ink mb-3">❓ Quick answers</p>
            <div className="space-y-3">
              {[
                { q: 'Someone hasn\'t picked — what do I do?', a: 'Go to Settings → Send round reminder. It automatically emails everyone who hasn\'t picked for that round. You can also copy their personal link from the Players tab and send it manually.' },
                { q: 'The deadline passed but someone wants to change their pick', a: 'You can\'t override this — picks are locked at the deadline. This is intentional to keep the competition fair.' },
                { q: 'A match went to penalties — how do I enter it?', a: 'In the Results tab, enter the score at 90 minutes (e.g. 1–1), then select the winning team in the "Winner (if pens)" dropdown that appears for knockout rounds.' },
                { q: 'How do I assign a joker to someone?', a: 'Go to Entries tab. Find the player and use the "🃏 Joker" dropdown to pick which knockout round they\'re playing it on. They\'ll get an email straight away.' },
                { q: 'Someone wants to know their picks link', a: 'Go to Players tab → find them in the Paid section → click 📋 Copy link. You can paste it to them directly. Or click 📧 Resend to email it to them again.' },
                { q: 'How does the Golden Goal work?', a: 'Each player predicted the total goals in the whole tournament before Round 1. It\'s only used as a tiebreaker at the very end if two players finish level on points. Enter the actual total in Settings → Golden Goal once the Final is done.' },
                { q: 'The leaderboard isn\'t updating', a: 'It auto-refreshes every 25 seconds. If scores seem wrong, go to Results tab and hit "Sync now" to pull the latest data from the football API.' },
              ].map(item => (
                <div key={item.q} className="border-t border-theme pt-3 first:border-t-0 first:pt-0">
                  <p className="text-xs font-semibold text-ink mb-1">{item.q}</p>
                  <p className="text-xs text-ink-muted leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
