'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

type Prefs = {
  analytics: boolean
  personalisation: boolean
}

const STORAGE_KEY = 'stickee_cookie_prefs'

function loadPrefs(): Prefs | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Prefs) : null
  } catch {
    return null
  }
}

function savePrefs(prefs: Prefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [adjusting, setAdjusting] = useState(false)
  const [prefs, setPrefs] = useState<Prefs>({ analytics: true, personalisation: true })

  useEffect(() => {
    if (loadPrefs() === null) setVisible(true)
  }, [])

  function acceptAll() {
    savePrefs({ analytics: true, personalisation: true })
    setVisible(false)
  }

  function saveAndClose() {
    savePrefs(prefs)
    setVisible(false)
  }

  function toggle(key: keyof Prefs) {
    setPrefs(p => ({ ...p, [key]: !p[key] }))
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-[60] border-t border-border bg-background md:bottom-0"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      role="dialog"
      aria-label="Cookie preferences"
    >
      {adjusting ? (
        <div className="mx-auto max-w-5xl px-6 py-5 space-y-5">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted-foreground">
              Cookie preferences
            </p>
            <button
              onClick={() => setAdjusting(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close preferences"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {/* Essential — always on */}
            <div className="border border-border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-foreground">Essential</span>
                <span
                  className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 border"
                  style={{ borderColor: '#2ec266', color: '#2ec266' }}
                >
                  Always on
                </span>
              </div>
              <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
                Required for authentication, sessions, and core site functionality.
              </p>
            </div>

            {/* Analytics */}
            <button
              type="button"
              onClick={() => toggle('analytics')}
              className="border border-border p-4 space-y-2 text-left transition-colors hover:bg-card/40"
              style={{ boxShadow: prefs.analytics ? 'inset 0 0 0 1px #e8e8e6' : 'none' }}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-foreground">Analytics</span>
                <span
                  className="font-mono text-[9px] uppercase tracking-widest"
                  style={{ color: prefs.analytics ? '#e8e8e6' : '#5a5a5e' }}
                >
                  {prefs.analytics ? 'On' : 'Off'}
                </span>
              </div>
              <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
                Helps us understand how Stickee is used so we can improve it.
              </p>
            </button>

            {/* Personalisation */}
            <button
              type="button"
              onClick={() => toggle('personalisation')}
              className="border border-border p-4 space-y-2 text-left transition-colors hover:bg-card/40"
              style={{ boxShadow: prefs.personalisation ? 'inset 0 0 0 1px #e8e8e6' : 'none' }}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-foreground">Personalisation</span>
                <span
                  className="font-mono text-[9px] uppercase tracking-widest"
                  style={{ color: prefs.personalisation ? '#e8e8e6' : '#5a5a5e' }}
                >
                  {prefs.personalisation ? 'On' : 'Off'}
                </span>
              </div>
              <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
                Tailors your feed, issue rankings, and recommendations to you.
              </p>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={saveAndClose}
              className="h-9 px-5 font-mono text-[10px] uppercase tracking-widest transition-opacity"
              style={{ background: '#e8e8e6', color: '#0a0a0b' }}
            >
              Save preferences
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="h-9 px-5 font-mono text-[10px] uppercase tracking-widest border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              Accept all
            </button>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-5xl px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[10px] leading-relaxed text-muted-foreground max-w-xl">
            Stickee uses cookies for essential functionality, analytics, and personalisation.
            You can adjust which categories are active.
          </p>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setAdjusting(true)}
              className="h-9 px-4 font-mono text-[10px] uppercase tracking-widest border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              Adjust
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="h-9 px-4 font-mono text-[10px] uppercase tracking-widest transition-opacity"
              style={{ background: '#e8e8e6', color: '#0a0a0b' }}
            >
              Accept all
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
