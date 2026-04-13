'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PublicProfile {
  userId: string
  handle: string
  displayName: string
  civicScore: number
  electorate?: string
  topIssues?: string[]
  bio?: string
  followerCount: number
  followingCount: number
}

const STORAGE_KEY = 'stickee:follows'

// ─── Seeded public profiles ───────────────────────────────────────────────────

export const MOCK_PROFILES: Record<string, PublicProfile> = {
  'drpriyasharma': {
    userId: 'priya-sharma',
    handle: 'drpriyasharma',
    displayName: 'Dr Priya Sharma',
    civicScore: 71,
    electorate: 'Melbourne',
    topIssues: ['jobs-economy', 'future'],
    bio: 'Economist & civic tech advocate. Using data to hold power accountable.',
    followerCount: 4821,
    followingCount: 203,
  },
  'mel_k_melb': {
    userId: 'mel-k',
    handle: 'mel_k_melb',
    displayName: 'Mel K',
    civicScore: 54,
    electorate: 'Richmond',
    topIssues: ['housing', 'cost-of-living'],
    bio: 'Renter. Mum. Tired of politicians who\'ve never had to worry about rent.',
    followerCount: 1203,
    followingCount: 87,
  },
  'jackfromperth': {
    userId: 'jack-t',
    handle: 'jackfromperth',
    displayName: 'Jack T',
    civicScore: 61,
    electorate: 'Curtin',
    topIssues: ['housing', 'jobs-economy'],
    bio: 'Holding my MP accountable, one email at a time.',
    followerCount: 892,
    followingCount: 156,
  },
  'samuelr_aus': {
    userId: 'sam-r',
    handle: 'samuelr_aus',
    displayName: 'Sam R',
    civicScore: 72,
    electorate: 'Sydney',
    topIssues: ['future', 'cost-of-living'],
    bio: 'Urban planner. Housing policy nerd. Long-time Stickee contributor.',
    followerCount: 2104,
    followingCount: 312,
  },
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFollows() {
  const [following, setFollowing] = useState<Set<string>>(new Set())
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setFollowing(new Set(JSON.parse(raw) as string[]))
    } catch { /* ignore */ }
    setHydrated(true)
  }, [])

  const follow = useCallback((userId: string) => {
    setFollowing(prev => {
      const next = new Set(prev)
      next.add(userId)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...next])) } catch { /* ignore */ }
      return next
    })
  }, [])

  const unfollow = useCallback((userId: string) => {
    setFollowing(prev => {
      const next = new Set(prev)
      next.delete(userId)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...next])) } catch { /* ignore */ }
      return next
    })
  }, [])

  const toggle = useCallback((userId: string) => {
    setFollowing(prev => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...next])) } catch { /* ignore */ }
      return next
    })
  }, [])

  const isFollowing = useCallback((userId: string) => following.has(userId), [following])

  return { following, followingCount: following.size, follow, unfollow, toggle, isFollowing, hydrated }
}
