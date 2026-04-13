'use client'

import { useState, useTransition, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface PredictionCounts {
  yes: number
  no: number
}

interface PredictionWidgetProps {
  issueId: string
  initialCounts: PredictionCounts
}

function getStorageKey(issueId: string) {
  return `stickee:prediction:${issueId}`
}

export function PredictionWidget({ issueId, initialCounts }: PredictionWidgetProps) {
  const [counts, setCounts] = useState(initialCounts)
  const [userPrediction, setUserPrediction] = useState<'yes' | 'no' | null>(null)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  // Restore prediction from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(getStorageKey(issueId))
    if (stored === 'yes' || stored === 'no') {
      setUserPrediction(stored)
    }
  }, [issueId])

  const total = counts.yes + counts.no
  const yesPercent = total === 0 ? 50 : Math.round((counts.yes / total) * 100)
  const noPercent = 100 - yesPercent

  function handlePrediction(prediction: 'yes' | 'no') {
    if (userPrediction) return

    startTransition(async () => {
      // Optimistic update
      setCounts(prev => ({ ...prev, [prediction]: prev[prediction] + 1 }))
      setUserPrediction(prediction)
      toast(`Prediction locked in: ${prediction.toUpperCase()}`, 'success')

      // Persist to localStorage so the prediction survives page reloads
      localStorage.setItem(getStorageKey(issueId), prediction)

      // Write to Supabase
      try {
        const { createClient } = await import('@/lib/supabase')
        const supabase = createClient()

        // Use authenticated user_id if available, otherwise fall back to a
        // stable anonymous session_id stored in localStorage
        const { data: { user } } = await supabase.auth.getUser()

        let sessionId: string | undefined
        if (!user) {
          const key = 'stickee:session_id'
          let sid = localStorage.getItem(key)
          if (!sid) {
            sid = crypto.randomUUID()
            localStorage.setItem(key, sid)
          }
          sessionId = sid
        }

        await supabase.from('predictions').insert({
          issue_id: issueId,
          prediction,
          user_id: user?.id ?? null,
          session_id: sessionId ?? null,
        })
      } catch {
        // Supabase unavailable — prediction already saved to localStorage
      }
    })
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm p-5">
      <h3 className="font-semibold text-foreground mb-1">Will this pass?</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {userPrediction
          ? `You predicted: ${userPrediction.toUpperCase()}. ${total.toLocaleString()} people have weighed in.`
          : 'Make your prediction. You earn points when you get it right.'}
      </p>

      {/* Vote bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Yes {yesPercent}%</span>
          <span>No {noPercent}%</span>
        </div>
        <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/8">
          <div
            className="bg-green-500 transition-all duration-500"
            style={{ width: `${yesPercent}%` }}
          />
          <div
            className="bg-red-500 transition-all duration-500"
            style={{ width: `${noPercent}%` }}
          />
        </div>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          {total.toLocaleString()} predictions
        </p>
      </div>

      {/* Buttons */}
      {!userPrediction ? (
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/40"
            onClick={() => handlePrediction('yes')}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="mr-1.5 h-4 w-4" />}
            Yes, it will pass
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-red-500/25 text-red-400 hover:bg-red-500/10 hover:border-red-500/40"
            onClick={() => handlePrediction('no')}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsDown className="mr-1.5 h-4 w-4" />}
            No, it will fail
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-primary/25 bg-primary/8 px-4 py-3 text-center text-sm text-foreground/80">
          Prediction locked in. Check back after the vote to see if you were right!
        </div>
      )}
    </div>
  )
}
