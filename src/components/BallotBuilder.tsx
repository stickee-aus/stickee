'use client'

import { useState, useCallback } from 'react'
import { X, Plus, GripVertical } from 'lucide-react'
import { createBallot, type BallotItemInput } from '@/app/ballots/actions'
import { useToast } from '@/components/ui/toast'
import { LinkButton } from '@/components/LinkButton'

interface IssueOption {
  id: string
  title: string
}

interface DraftItem extends BallotItemInput {
  key: string
}

const WEIGHT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export function BallotBuilder({ issues, authenticated }: { issues: IssueOption[]; authenticated: boolean }) {
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [items, setItems] = useState<DraftItem[]>([
    { key: crypto.randomUUID(), issueId: '', positionText: '', weight: 5 },
  ])
  const [submitting, setSubmitting] = useState(false)

  const addItem = useCallback(() => {
    if (items.length >= 10) return
    setItems(prev => [...prev, { key: crypto.randomUUID(), issueId: '', positionText: '', weight: 5 }])
  }, [items.length])

  const removeItem = useCallback((key: string) => {
    setItems(prev => prev.filter(i => i.key !== key))
  }, [])

  const updateItem = useCallback((key: string, patch: Partial<BallotItemInput>) => {
    setItems(prev => prev.map(i => (i.key === key ? { ...i, ...patch } : i)))
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!authenticated) {
      toast('Sign in to build a ballot.', 'error')
      return
    }
    setSubmitting(true)
    try {
      const result = await createBallot({
        title,
        isPublic,
        items: items.map(({ issueId, positionText, weight }) => ({ issueId, positionText, weight })),
      })
      if (result.error) {
        toast(result.error, 'error')
      } else {
        toast(
          result.seededMarketId
            ? 'Ballot created — a market was seeded from your top pick.'
            : 'Ballot created.',
          'success'
        )
        setTitle('')
        setItems([{ key: crypto.randomUUID(), issueId: '', positionText: '', weight: 5 }])
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Failed to create ballot', 'error')
    } finally {
      setSubmitting(false)
    }
  }, [authenticated, title, isPublic, items, toast])

  return (
    <div className="space-y-6">
      <div>
        <label className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">Ballot title</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={120}
          placeholder="e.g. My housing and cost-of-living priorities"
          className="mt-1.5 w-full rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-sm text-foreground outline-none focus:border-foreground/30"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="ballot-public"
          type="checkbox"
          checked={isPublic}
          onChange={e => setIsPublic(e.target.checked)}
          className="h-4 w-4 accent-foreground"
        />
        <label htmlFor="ballot-public" className="text-sm text-muted-foreground">
          Public — others can see this ballot on your profile
        </label>
      </div>

      <div className="space-y-3">
        <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
          Ranked priorities — top item seeds a market automatically
        </p>
        {items.map((item, index) => (
          <div
            key={item.key}
            className="rounded-lg border border-border bg-card p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <GripVertical size={14} />
                <span className="font-mono text-[10px] tracking-widest uppercase">Rank {index + 1}</span>
              </div>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(item.key)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground"
                  aria-label="Remove item"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <select
              value={item.issueId}
              onChange={e => updateItem(item.key, { issueId: e.target.value })}
              className="w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground outline-none"
            >
              <option value="">Select an issue…</option>
              {issues.map(issue => (
                <option key={issue.id} value={issue.id}>{issue.title}</option>
              ))}
            </select>

            <textarea
              value={item.positionText}
              onChange={e => updateItem(item.key, { positionText: e.target.value })}
              maxLength={280}
              rows={2}
              placeholder="Your position on this issue…"
              className="w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground outline-none resize-none"
            />

            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">Weight</span>
              <div className="flex gap-1">
                {WEIGHT_OPTIONS.map(w => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => updateItem(item.key, { weight: w })}
                    className="h-7 w-7 rounded font-mono text-[10px] transition-colors"
                    style={{
                      background: item.weight === w ? '#1e1e20' : 'transparent',
                      color: item.weight === w ? '#e8e8e6' : '#5a5a5e',
                      border: `1px solid ${item.weight === w ? '#2a2a2e' : '#1e1e20'}`,
                    }}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={addItem}
          disabled={items.length >= 10}
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 font-mono text-[10px] tracking-widest uppercase text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
        >
          <Plus size={12} /> Add item
        </button>
        <button
          type="button"
          onClick={() => { void handleSubmit() }
          disabled={submitting || !authenticated}
          className="rounded-md bg-foreground px-5 py-2.5 font-mono text-[11px] tracking-widest uppercase text-background transition-opacity disabled:opacity-40"
        >
          {submitting ? 'Creating…' : 'Create ballot'}
        </button>
        {!authenticated && (
          <LinkButton href="/auth/sign-in" variant="outline" size="sm">Sign in to participate</LinkButton>
        )}
      </div>
    </div>
  )
}
