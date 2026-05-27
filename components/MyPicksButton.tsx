'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export const MY_PICKS_TOKEN_KEY = 'my_picks_token'

export function MyPicksButton() {
  const [token, setToken] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    try {
      setToken(localStorage.getItem(MY_PICKS_TOKEN_KEY))
    } catch {}
  }, [pathname])

  // Don't show on the pick page itself
  if (!token || pathname.startsWith('/pick/')) return null

  return (
    <Link
      href={`/pick/${token}`}
      className="inline-flex items-center gap-1.5 text-xs font-semibold bg-pitch-muted text-pitch-light rounded-lg px-3 py-1.5 hover:bg-pitch/25 transition-colors"
    >
      ← My Picks
    </Link>
  )
}
