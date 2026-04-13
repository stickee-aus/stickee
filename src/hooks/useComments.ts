'use client'

import { useState, useEffect, useCallback } from 'react'

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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useComments(postId: string) {
  const [comments, setComments] = useState<Comment[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Load from localStorage (with seed fallback)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(postId))
      if (raw) {
        setComments(JSON.parse(raw) as Comment[])
      } else {
        // Use seed comments for demo posts
        const seeds = SEED_COMMENTS[postId] ?? []
        setComments(seeds)
      }
    } catch {
      setComments(SEED_COMMENTS[postId] ?? [])
    }
  }, [postId])

  function persist(next: Comment[]) {
    try { localStorage.setItem(storageKey(postId), JSON.stringify(next)) } catch { /* ignore */ }
    setComments(next)
  }

  const addComment = useCallback(async (body: string, parentId?: string): Promise<boolean> => {
    if (!body.trim()) return false
    setSubmitting(true)

    // In production: POST to Supabase
    // const supabase = createClient()
    // await supabase.from('comments').insert({ post_id: postId, body, parent_id: parentId, ... })

    await new Promise(r => setTimeout(r, 300)) // simulate network

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

  return { comments: threaded, totalCount: comments.length, addComment, submitting }
}
