'use client'

import { useTheme } from './ThemeProvider'
import { IconMoon, IconSun } from './icons'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-surface border border-theme text-ink-muted hover:text-ink hover:bg-surface-hover transition-all duration-200 active:scale-95"
    >
      {theme === 'dark' ? <IconSun className="w-4 h-4" /> : <IconMoon className="w-4 h-4" />}
    </button>
  )
}
