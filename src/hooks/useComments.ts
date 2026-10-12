'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { isSupabaseConfigured } from '@/lib/supabase-config'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Comment {
  id: string
  postId: string
  userId?: string
  authorName: string
  authorHandle: string
  civicScore?: number
  body: string
  parentId?: string
  createdAt: string
  replies?: Comment[]
}

interface CommentRow {
  id: string
  post_id: string
  user_id: string | null
  author_name: string
  author_handle: string | null
  body: string
  parent_id: string | null
  created_at: string
}

interface ProfileRow {
  handle: string | null
  display_name: string | null
  civic_score: number | null
}

const configured = isSupabaseConfigured

// ─── Storage key ──────────────────────────────────────────────────────────────

function storageKey(postId: string) {
  return `stickee:comments:${postId}`
}

// ─── Seed comments for demo ───────────────────────────────────────────────────

const SEED_COMMENTS: Record<string, Comment[]> = {
  'alert-housing-drop': [
    {
      id: 'c1', postId: 'alert-housing-drop', authorName: 'Mel K', authorHandle: '@mel_k_melb',
      civicScore: 54, body: 'This is devastating. My landlord just served a $300/week increase notice. When does it stop?',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'c2', postId: 'alert-housing-drop', authorName: 'Jack T', authorHandle: '@jackfromperth',
      civicScore: 61, body: 'I emailed my MP about this last week. Got a form response. Sending another one today.',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'c3', postId: 'alert-housing-drop', authorName: 'Sam R', authorHandle: '@samuelr_aus',
      civicScore: 72, body: 'The vacancy rate stat is the one politicians need to see. 0.8% is structurally broken.',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ],
  'user-rent-story': [
    {
      id: 'c4', postId: 'user-rent-story', authorName: 'Chris V', authorHandle: '@chrisv_syd',
      civicScore: 48, body: 'Same happened to me. The rental market is completely broken. Good on you for taking action.',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 'c5', postId: 'user-rent-story', authorName: 'Priya S', authorHandle: '@drpriyasharma',
      civicScore: 71, body: 'This is exactly why collective action matters. One email can be ignored. 50,000 cannot.',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ],
}

function makeId(): string {
  return `comment-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function mapComment(row: CommentRow): Comment {
  return {
    id: row.id,
    postId: row.post_id,
    userId: row.user_id ?? undefined,
    authorName: row.author_name,
    authorHandle: row.author_handle ? `@${row.author_handle.replace(/^@/, '')}` : '@stickee',
    body: row.body,
    parentId: row.parent_id ?? undefined,
    createdAt: row.created_at,
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useComments(postId: string) {
  const [comments, setComments] = useState<Comment[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false

    if (!configured) {
      try {
        const raw = localStorage.getItem(storageKey(postId))
        setComments(raw ? JSON.parse(raw) as Comment[] : SEED_COMMENTS[postId] ?? [])
      } catch {
        setComments(SEED_COMMENTS[postId] ?? [])
      }
      setHydrated(true)
      return
    }

    const supabase = createClient()

    async function loadComments() {
      const [{ data: { user } }, commentsResult] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from('comments')
          .select('id, post_id, user_id, author_name, author_handle, body, parent_id, created_at')
          .eq('post_id', postId)
          .order('created_at', { ascending: false })
          .returns<CommentRow[]>(),
      ])

      if (cancelled) return

      setAuthenticated(!!user)
      setComments(commentsResult.data?.map(mapComment) ?? SEED_COMMENTS[postId] ?? [])
      setHydrated(true)
    }

    void loadComments()

    const authSubscription = supabase.auth.onAuthStateChange((_, session) => {
      setAuthenticated(!!session?.user)
    })

    const channel = supabase
      .channel(`comments:${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`,
        },
        () => { void loadComments() }
      )
      .subscribe()

    return () => {
      cancelled = true
      authSubscription.data.subscription.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [postId])

  const addComment = useCallback(async (body: string, parentId?: string): Promise<boolean> => {
    if (!body.trim()) return false
    setSubmitting(true)

    if (configured) {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setSubmitting(false)
        return false
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('handle, display_name, civic_score')
        .eq('user_id', user.id)
        .maybeSingle<ProfileRow>()

      const authorHandle = profile?.handle ?? user.email?.split('@')[0] ?? 'user'
      const { error } = await supabase.from('comments').insert({
        post_id: postId,
        user_id: user.id,
        author_name: profile?.display_name ?? authorHandle,
        author_handle: authorHandle,
        body: body.trim().slice(0, 500),
        parent_id: parentId ?? null,
      })

      setSubmitting(false)
      return !error
    }

    const newComment: Comment = {
      id: makeId(),
      postId,
      authorName: 'You',
      authorHandle: '@demouser',
      civicScore: 62,
      body: body.trim(),
      parentId,
      createdAt: new Date().toISOString(),
    }

    setComments(prev => {
      const next = [newComment, ...prev]
      try { localStorage.setItem(storageKey(postId), JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })

    setSubmitting(false)
    return true
  }, [postId])

  // Organise into threads
  const topLevel = comments.filter(c => !c.parentId)
  const replies  = comments.filter(c => !!c.parentId)

  const threaded: Comment[] = topLevel.map(c => ({
    ...c,
    replies: replies.filter(r => r.parentId === c.id),
  }))

  return { comments: threaded, totalCount: comments.length, addComment, submitting, authenticated, hydrated }
}
