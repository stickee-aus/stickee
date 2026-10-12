'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { isSupabaseConfigured } from '@/lib/supabase-config'

interface PredictionCounts {
  yes: number
  no: number
}

interface PredictionWidgetProps {
  issueId: string
  initialCounts: PredictionCounts
}

const configured = isSupabaseConfigured

function getStorageKey(issueId: string) {
  return `stickee:prediction:${issueId}`
}

export function PredictionWidget({ issueId, initialCounts }: PredictionWidgetProps) {
  const [counts, setCounts] = useState(initialCounts)
  const [userPrediction, setUserPrediction] = useState<'yes' | 'no' | null>(null)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const identityRef = useRef<{ userId: string | null; sessionId: string | null }>({ userId: null, sessionId: null })
  const skipOwnRealtimeRef = useRef(false)

  useEffect(() => {
    setCounts(initialCounts)
  }, [initialCounts, issueId])

  useEffect(() => {
    const stored = localStorage.getItem(getStorageKey(issueId))
    if (stored === 'yes' || stored === 'no') {
      setUserPrediction(stored)
    }
  }, [issueId])

  useEffect(() => {
    if (!configured) return

    let cancelled = false
    let channelCleanup: (() => void) | undefined

    async function subscribe() {
      const { createClient } = await import('@/lib/supabase')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const key = 'stickee:session_id'
      let sessionId = localStorage.getItem(key)
      if (!sessionId) {
        sessionId = crypto.randomUUID()
        localStorage.setItem(key, sessionId)
      }

      if (cancelled) return

      identityRef.current = {
        userId: user?.id ?? null,
        sessionId,
      }

      const channel = supabase
        .channel(`predictions:${issueId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'predictions',
            filter: `issue_id=eq.${issueId}`,
          },
          payload => {
            const row = payload.new as {
              prediction?: 'yes' | 'no'
              user_id?: string | null
              session_id?: string | null
            }

            const isOwnPrediction =
              (row.user_id && row.user_id === identityRef.current.userId) ||
              (row.session_id && row.session_id === identityRef.current.sessionId)

            if (skipOwnRealtimeRef.current && isOwnPrediction) {
              skipOwnRealtimeRef.current = false
              return
            }

            if (row.prediction === 'yes' || row.prediction === 'no') {
              const prediction = row.prediction
              setCounts(prev => ({ ...prev, [prediction]: prev[prediction] + 1 }))
            }
          }
        )
        .subscribe()

      channelCleanup = () => {
        supabase.removeChannel(channel)
      }
    }

    subscribe()

    return () => {
      cancelled = true
      channelCleanup?.()
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
      localStorage.setItem(getStorageKey(issueId), prediction)

      try {
        const { createClient } = await import('@/lib/supabase')
        const supabase = createClient()
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

        identityRef.current = {
          userId: user?.id ?? null,
          sessionId: sessionId ?? identityRef.current.sessionId,
        }
        skipOwnRealtimeRef.current = true

        await supabase.from('predictions').insert({
          issue_id: issueId,
          prediction,
          user_id: user?.id ?? null,
          session_id: sessionId ?? null,
        })
      } catch {
        skipOwnRealtimeRef.current = false
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
