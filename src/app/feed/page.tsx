'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  Heart, Flame, Flag, MessageCircle,
  Mail, PenSquare, Lock, BadgeCheck, Send, X, ChevronDown,
} from 'lucide-react'
import { FEED_POSTS, type FeedPost, type FeedReaction } from '@/lib/mock-feed-data'
import { scoreToGrade } from '@/lib/civic-utils'
import { useToast } from '@/components/ui/toast'
import { ShareButton } from '@/components/ShareButton'
import { useAuthStatus } from '@/hooks/useAuthStatus'
import { useComments } from '@/hooks/useComments'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function fmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

function initials(name: string | undefined | null): string {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function gradeStyle(g: string) {
  if (g === 'A' || g === 'B') return { color: '#2ec266', borderColor: '#0e3020', background: '#041008' }
  if (g === 'C')              return { color: '#f5a623', borderColor: '#3a2e10', background: '#1e1800' }
  return                             { color: '#f04747', borderColor: '#3a1414', background: '#1e0a0a' }
}

const PILLAR_DISPLAY: Record<string, { label: string; color: string }> = {
  'cost-of-living': { label: 'CoL',     color: '#f04747' },
  'housing':        { label: 'Housing', color: '#f04747' },
  'crime-safety':   { label: 'C&S',     color: '#f5a623' },
  'jobs-economy':   { label: 'Economy', color: '#f5a623' },
  'future':         { label: 'Future',  color: '#2ec266' },
}

const PILLAR_OPTIONS = [
  { id: 'cost-of-living', label: 'Cost of Living' },
  { id: 'housing',        label: 'Housing' },
  { id: 'crime-safety',   label: 'Crime & Safety' },
  { id: 'jobs-economy',   label: 'Jobs & Economy' },
  { id: 'future',         label: 'Future' },
]

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  civic_alert:     { label: 'ALERT',    color: '#f04747' },
  decision_update: { label: 'BILL',     color: '#f5a623' },
  leader_update:   { label: 'LEADER',   color: '#2ec266' },
  user_post:       { label: 'CIVIC',    color: '#5a5a5e' },
}

type PostReactions = { heart: boolean; fire: boolean; flag: boolean }
type ReactionCounts = { heart: number; fire: number; flag: number }

// ─── Alert row ────────────────────────────────────────────────────────────────

function AlertRow({ post }: { post: FeedPost }) {
  const pillar    = post.linkedPillarId ? PILLAR_DISPLAY[post.linkedPillarId] : null
  const typeBadge = TYPE_BADGE[post.type] ?? { label: 'ALERT', color: '#f04747' }
  const preview   = post.content.replace(/^[^\w]+ /, '').slice(0, 100) + (post.content.length > 100 ? '…' : '')

  return (
    <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 items-center py-3 border-b border-border hover:bg-card/30 transition-colors">
      <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: typeBadge.color }} />
      <div className="flex items-baseline gap-2 min-w-0">
        <span className="font-mono text-[9px] tracking-widest shrink-0" style={{ color: typeBadge.color }}>{typeBadge.label}</span>
        <span className="font-mono text-xs text-muted-foreground truncate">{preview}</span>
      </div>
      {pillar ? (
        <span className="font-mono text-[9px] tracking-wider shrink-0 hidden sm:block" style={{ color: pillar.color }}>{pillar.label}</span>
      ) : <span />}
      <span className="font-mono text-[10px] text-muted-foreground shrink-0">{relativeTime(post.postedAt)}</span>
      <span className="font-mono text-[10px] text-muted-foreground shrink-0 hidden sm:block">🔥 {fmt(post.reactions.fire)}</span>
    </div>
  )
}

// ─── Comment panel ────────────────────────────────────────────────────────────

function CommentPanel({ postId, signedIn }: { postId: string; signedIn: boolean }) {
  const { comments, totalCount, addComment, submitting, hydrated } = useComments(postId)
  const [text, setText] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    const ok = await addComment(text)
    if (ok) setText('')
  }

  return (
    <div className="border-t border-border mt-3 pt-3" style={{ background: 'rgba(255,255,255,0.015)' }}>
      {!hydrated ? (
        <p className="font-mono text-[10px] text-muted-foreground py-2">Loading…</p>
      ) : comments.length === 0 ? (
        <p className="font-mono text-[10px] text-muted-foreground py-2">
          No comments yet. {signedIn ? 'Be the first.' : 'Sign in to comment.'}
        </p>
      ) : (
        <div className="space-y-3 mb-3 max-h-48 overflow-y-auto pr-1">
          {comments.slice(0, 10).map(c => (
            <div key={c.id} className="flex gap-2">
              <div className="h-5 w-5 flex items-center justify-center font-mono text-[8px] shrink-0 mt-0.5" style={{ background: '#1e1e20', color: '#5a5a5e' }}>
                {initials(c.authorName)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap mb-0.5">
                  <span className="font-mono text-[10px] font-medium text-foreground">{c.authorName}</span>
                  <span className="font-mono text-[9px] text-muted-foreground">{c.authorHandle}</span>
                  <span className="font-mono text-[9px] text-muted-foreground">· {relativeTime(c.createdAt)}</span>
                </div>
                <p className="font-mono text-[11px] text-foreground/80 leading-relaxed">{c.body}</p>
                {c.replies && c.replies.length > 0 && (
                  <div className="mt-2 ml-3 space-y-2 border-l border-border pl-3">
                    {c.replies.map(r => (
                      <div key={r.id}>
                        <div className="flex items-baseline gap-2 flex-wrap mb-0.5">
                          <span className="font-mono text-[9px] font-medium text-foreground">{r.authorName}</span>
                          <span className="font-mono text-[9px] text-muted-foreground">· {relativeTime(r.createdAt)}</span>
                        </div>
                        <p className="font-mono text-[11px] text-foreground/80">{r.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {totalCount > 10 && (
            <p className="font-mono text-[9px] text-muted-foreground text-center py-1">{totalCount - 10} more comments</p>
          )}
        </div>
      )}
      {signedIn ? (
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Add a comment…"
            maxLength={500}
            rows={2}
            className="flex-1 font-mono text-xs bg-transparent border border-border p-2 resize-none focus:outline-none focus:border-foreground/30 text-foreground placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            className="flex items-center gap-1 font-mono text-[9px] tracking-widest uppercase px-2 py-1.5 border transition-colors disabled:opacity-30"
            style={{ color: '#2ec266', borderColor: '#0e3020', background: '#041008' }}
          >
            <Send className="h-2.5 w-2.5" />
          </button>
        </form>
      ) : (
        <Link href="/auth/sign-in?next=/feed" className="font-mono text-[10px] tracking-wider uppercase transition-colors hover:opacity-70" style={{ color: '#5a5a5e' }}>
          Sign in to comment →
        </Link>
      )}
    </div>
  )
}

// ─── Community post card ──────────────────────────────────────────────────────

interface CommunityPostProps {
  post: FeedPost
  reactions: PostReactions
  counts: ReactionCounts
  onReact: (postId: string, reaction: FeedReaction) => void
  signedIn: boolean
}

const REACTION_ICONS = { heart: Heart, fire: Flame, flag: Flag }
const REACTION_COLORS: Record<FeedReaction, string> = {
  heart: '#f04747',
  fire:  '#f5a623',
  flag:  '#5a5a5e',
}

function CommunityPost({ post, reactions, counts, onReact, signedIn }: CommunityPostProps) {
  const [showComments, setShowComments] = useState(false)
  const isLeader = post.type === 'leader_update'
  const grade    = post.civicScore ? scoreToGrade(post.civicScore) : null
  const gs       = grade ? gradeStyle(grade) : null
  const pillar   = post.linkedPillarId ? PILLAR_DISPLAY[post.linkedPillarId] : null

  return (
    <article className="border-b border-border py-4 hover:bg-card/20 transition-colors">
      <div className="flex items-start gap-3 mb-3">
        <div className="h-8 w-8 flex items-center justify-center font-mono text-[10px] font-medium shrink-0 relative" style={{ background: '#1e1e20', color: isLeader ? '#2ec266' : '#5a5a5e' }}>
          {initials(post.authorName)}
          {isLeader && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full" style={{ background: '#2ec266' }} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-foreground font-medium">{post.authorName}</span>
            {post.authorVerified && <BadgeCheck className="h-3 w-3 shrink-0" style={{ color: '#2ec266' }} />}
            {gs && grade && (
              <span className="font-mono text-[9px] tracking-wider px-1.5 py-0.5 border" style={gs}>{grade} · {post.civicScore}</span>
            )}
            <span className="font-mono text-[10px] text-muted-foreground">{post.authorHandle}</span>
            <span className="font-mono text-[10px] text-muted-foreground">·</span>
            <span className="font-mono text-[10px] text-muted-foreground">{relativeTime(post.postedAt)}</span>
            {pillar && (
              <>
                <span className="font-mono text-[10px] text-muted-foreground">·</span>
                <span className="font-mono text-[9px] tracking-wider" style={{ color: pillar.color }}>{pillar.label}</span>
              </>
            )}
          </div>
        </div>
        {post.isAlgorithmicBoost && (
          <span className="font-mono text-[9px] tracking-widest shrink-0" style={{ color: '#2ec266' }}>↑ BOOSTED</span>
        )}
      </div>

      <p className="font-mono text-xs text-foreground leading-relaxed mb-3">
        {post.content.split(/(@\w+|#\w+)/g).map((part, i) =>
          part.match(/^[@#]/) ? <span key={i} style={{ color: '#f5a623' }}>{part}</span> : part
        )}
      </p>

      <div className="flex items-center gap-3">
        {(['heart', 'fire', 'flag'] as FeedReaction[]).map(reaction => {
          const Icon   = REACTION_ICONS[reaction]
          const active = reactions[reaction]
          const count  = counts[reaction]
          return (
            <button
              key={reaction}
              onClick={() => onReact(post.id, reaction)}
              title={signedIn ? undefined : 'Sign in to react'}
              className="flex items-center gap-1 font-mono text-[10px] transition-colors"
              style={{ color: active ? REACTION_COLORS[reaction] : '#3a3a3e' }}
            >
              <Icon className="h-3 w-3" />
              {fmt(count)}
            </button>
          )
        })}

        <button
          onClick={() => setShowComments(v => !v)}
          className="flex items-center gap-1 font-mono text-[10px] transition-colors"
          style={{ color: showComments ? '#e8e8e6' : '#3a3a3e' }}
        >
          <MessageCircle className="h-3 w-3" />
          {fmt(post.commentCount)}
          <ChevronDown className="h-2.5 w-2.5 transition-transform" style={{ transform: showComments ? 'rotate(180deg)' : 'none' }} />
        </button>

        <ShareButton
          title={`${post.authorName} on Stickee: "${post.content.slice(0, 80)}…"`}
          text={post.content}
          count={post.shareCount}
          bonusPoints={50}
        />

        {(post.linkedDecisionId || post.linkedPillarId) && (
          <Link href="/issues" className="ml-auto flex items-center gap-1 font-mono text-[10px] tracking-wider transition-colors hover:opacity-70" style={{ color: '#5a5a5e' }}>
            <Mail className="h-3 w-3" /> CONTACT MP
          </Link>
        )}
      </div>

      {showComments && <CommentPanel postId={post.id} signedIn={signedIn} />}
    </article>
  )
}

// ─── Compose bar ──────────────────────────────────────────────────────────────

interface ComposeBarProps {
  signedIn: boolean
  onPost: (post: FeedPost) => void
}

function ComposeBar({ signedIn, onPost }: ComposeBarProps) {
  const { toast } = useToast()
  const [open, setOpen]         = useState(false)
  const [content, setContent]   = useState('')
  const [pillarId, setPillarId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const remaining = 500 - content.length

  function handleOpen() {
    if (!signedIn) { window.location.href = '/auth/sign-in?next=/feed'; return }
    setOpen(true)
    setTimeout(() => textRef.current?.focus(), 50)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/feed/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), pillarId: pillarId || undefined }),
        credentials: 'same-origin',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast(err.error ?? 'Could not post. Please try again.', 'error')
        return
      }
      const { post } = await res.json()
      toast('Posted to the civic feed!', 'success')
      setContent(''); setPillarId(''); setOpen(false)
      if (post) onPost(post as FeedPost)
    } catch {
      toast('Network error. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (open) {
    return (
      <form onSubmit={handleSubmit} className="border border-border p-4" style={{ background: '#080809' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">New post</span>
          <button type="button" onClick={() => { setOpen(false); setContent('') }} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <textarea
          ref={textRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="What's happening in your electorate?"
          maxLength={500}
          rows={3}
          className="w-full font-mono text-xs bg-transparent border border-border p-3 resize-none focus:outline-none focus:border-foreground/30 text-foreground placeholder:text-muted-foreground mb-3"
        />
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={pillarId}
            onChange={e => setPillarId(e.target.value)}
            className="font-mono text-[10px] tracking-wider bg-transparent border border-border px-2 py-1 text-muted-foreground focus:outline-none"
          >
            <option value="">No pillar</option>
            {PILLAR_OPTIONS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <span className="font-mono text-[10px] ml-auto" style={{ color: remaining < 50 ? '#f04747' : '#5a5a5e' }}>{remaining}</span>
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 border transition-colors disabled:opacity-30"
            style={{ color: '#2ec266', borderColor: '#0e3020', background: '#041008' }}
          >
            <PenSquare className="h-2.5 w-2.5" />
            {submitting ? 'Posting…' : 'Post'}
          </button>
        </div>
      </form>
    )
  }

  return (
    <button onClick={handleOpen} className="w-full flex items-center gap-3 border border-border px-4 py-3 text-left hover:bg-card/30 transition-colors">
      <div className="h-7 w-7 flex items-center justify-center shrink-0" style={{ background: '#1e1e20', color: '#5a5a5e' }}>
        <PenSquare className="h-3.5 w-3.5" />
      </div>
      <span className="font-mono text-xs text-muted-foreground flex-1">What&apos;s happening in your electorate?</span>
      <div className="flex items-center gap-1 font-mono text-[9px] tracking-widest border px-2 py-1 shrink-0" style={{ color: signedIn ? '#2ec266' : '#5a5a5e', borderColor: signedIn ? '#0e3020' : '#1e1e20', background: signedIn ? '#041008' : 'transparent' }}>
        {signedIn ? <><PenSquare className="h-2.5 w-2.5" /> POST</> : <><Lock className="h-2.5 w-2.5" /> SIGN IN</>}
      </div>
    </button>
  )
}

// ─── Feed page ────────────────────────────────────────────────────────────────

type FilterId = 'all' | 'community' | 'leaders' | 'my-electorate'

function loadUserPrefs(): { electorate: string; topIssues: string[] } {
  if (typeof window === 'undefined') return { electorate: '', topIssues: [] }
  try {
    const raw = localStorage.getItem('stickee:user-prefs')
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { electorate: '', topIssues: [] }
}

export default function FeedPage() {
  const { toast } = useToast()
  const auth = useAuthStatus()
  const signedIn = auth.authenticated

  const [filter, setFilter] = useState<FilterId>('all')
  const [userPrefs]         = useState(() => loadUserPrefs())
  const [posts, setPosts]   = useState<FeedPost[]>(FEED_POSTS)
  const [rankSource, setRankSource] = useState<'mock' | 'ranked' | 'mock-fallback'>('mock')
  const [userReactions, setUserReactions] = useState<Record<string, PostReactions>>({})
  const [reactionCounts, setReactionCounts] = useState<Record<string, ReactionCounts>>({})

  // Load ranked feed
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const qs = new URLSearchParams()
        if (userPrefs.electorate) qs.set('electorate', userPrefs.electorate)
        if (userPrefs.topIssues.length) qs.set('issues', userPrefs.topIssues.join(','))
        const res = await fetch(`/api/feed/ranked?${qs.toString()}`, { cache: 'no-store', credentials: 'same-origin' })
        if (!res.ok || cancelled) return
        const data = await res.json() as { posts: FeedPost[]; source: 'ranked' | 'mock-fallback' }
        if (!data.posts?.length || cancelled) return
        setPosts(data.posts)
        setRankSource(data.source)
        const initialCounts: Record<string, ReactionCounts> = {}
        for (const p of data.posts) {
          initialCounts[p.id] = { heart: p.reactions.heart, fire: p.reactions.fire, flag: p.reactions.flag }
        }
        setReactionCounts(initialCounts)
      } catch { /* keep mock fallback */ }
    }
    void load()
    return () => { cancelled = true }
  }, [userPrefs.electorate, userPrefs.topIssues])

  // Load user's existing reactions
  useEffect(() => {
    if (!signedIn || posts.length === 0) return
    const ids = posts.map(p => p.id).slice(0, 60).join(',')
    fetch(`/api/feed/react?postIds=${ids}`, { credentials: 'same-origin' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.reactions) setUserReactions(data.reactions) })
      .catch(() => null)
  }, [signedIn, posts])

  // React handler (optimistic)
  const handleReact = useCallback(async (postId: string, reaction: FeedReaction) => {
    if (!signedIn) { toast('Sign in to react to posts.', 'info'); return }

    const wasActive = (userReactions[postId] ?? {})[reaction as keyof PostReactions] ?? false

    setUserReactions(prev => {
      const cur = prev[postId] ?? { heart: false, fire: false, flag: false }
      return { ...prev, [postId]: { ...cur, [reaction]: !cur[reaction as keyof PostReactions] } }
    })
    setReactionCounts(prev => {
      const cur = prev[postId] ?? { heart: 0, fire: 0, flag: 0 }
      return { ...prev, [postId]: { ...cur, [reaction]: Math.max(0, cur[reaction as keyof ReactionCounts] + (wasActive ? -1 : 1)) } }
    })

    try {
      const res = await fetch('/api/feed/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ postId, reaction }),
      })
      if (!res.ok) {
        // Revert
        setUserReactions(prev => {
          const cur = prev[postId] ?? { heart: false, fire: false, flag: false }
          return { ...prev, [postId]: { ...cur, [reaction]: wasActive } }
        })
        return
      }
      const data = await res.json()
      if (data.activeReactions) setUserReactions(prev => ({ ...prev, [postId]: data.activeReactions }))
      if (data.counts) setReactionCounts(prev => ({ ...prev, [postId]: data.counts }))
    } catch {
      setUserReactions(prev => {
        const cur = prev[postId] ?? { heart: false, fire: false, flag: false }
        return { ...prev, [postId]: { ...cur, [reaction]: wasActive } }
      })
    }
  }, [signedIn, userReactions, toast])

  function handleNewPost(post: FeedPost) {
    setPosts(prev => [post, ...prev])
    setReactionCounts(prev => ({ ...prev, [post.id]: { heart: 0, fire: 0, flag: 0 } }))
    setUserReactions(prev => ({ ...prev, [post.id]: { heart: false, fire: false, flag: false } }))
  }

  const alerts = posts
    .filter(p => p.type === 'civic_alert' || p.type === 'decision_update')
    .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())

  const community = posts
    .filter(p => {
      if (p.type !== 'user_post' && p.type !== 'leader_update') return false
      if (filter === 'community')     return p.type === 'user_post'
      if (filter === 'leaders')       return p.type === 'leader_update'
      if (filter === 'my-electorate') return userPrefs.topIssues.length === 0 || userPrefs.topIssues.some(id => p.linkedPillarId === id)
      return true
    })
    .sort((a, b) => {
      if (rankSource === 'ranked' && filter !== 'my-electorate') return 0
      if (filter === 'my-electorate' && userPrefs.topIssues.length > 0) {
        const aR = userPrefs.topIssues.includes(a.linkedPillarId ?? '')
        const bR = userPrefs.topIssues.includes(b.linkedPillarId ?? '')
        if (aR !== bR) return aR ? -1 : 1
      }
      if (a.isAlgorithmicBoost !== b.isAlgorithmicBoost) return a.isAlgorithmicBoost ? -1 : 1
      return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
    })

  const totalPosts     = posts.length
  const totalAlerts    = alerts.length
  const totalCommunity = posts.filter(p => p.type === 'user_post' || p.type === 'leader_update').length

  return (
    <div className="mx-auto max-w-5xl px-6">
      <div className="flex items-end justify-between gap-6 py-10 border-b border-border">
        <div>
          <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">Australia · Civic Feed</p>
          <div className="flex items-baseline gap-3">
            <span className="font-mono font-normal leading-none text-foreground" style={{ fontSize: 'clamp(40px, 8vw, 56px)', letterSpacing: '-0.02em' }}>{totalPosts}</span>
            <span className="font-mono text-xl text-muted-foreground/40">posts</span>
          </div>
          <p className="font-mono text-xs text-muted-foreground mt-2" style={{ letterSpacing: '0.03em' }}>
            {totalAlerts} system alerts · {totalCommunity} community posts
            {rankSource === 'ranked' && <span style={{ color: '#2ec266' }}> · ranked</span>}
            {rankSource === 'mock-fallback' && <span style={{ color: '#f5a623' }}> · seed data</span>}
          </p>
        </div>
        <div className="hidden sm:flex items-end gap-6 pb-1">
          <div className="text-right">
            <p className="font-mono text-xl font-normal mb-1" style={{ color: '#f04747' }}>{totalAlerts}</p>
            <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>Alerts</p>
          </div>
          <div className="w-px h-8 bg-border mb-1" />
          <div className="text-right">
            <p className="font-mono text-xl font-normal mb-1" style={{ color: '#2ec266' }}>{posts.filter(p => p.type === 'leader_update').length}</p>
            <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>Leaders</p>
          </div>
          <div className="w-px h-8 bg-border mb-1" />
          <div className="text-right">
            <p className="font-mono text-xl font-normal mb-1 text-foreground">{posts.filter(p => p.type === 'user_post').length}</p>
            <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>Citizens</p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between py-4 border-b border-border">
          <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">System Alerts · Latest</span>
          <span className="font-mono text-[10px] text-muted-foreground">{totalAlerts} active</span>
        </div>
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 items-center py-2 border-b border-border">
          <span className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground w-1.5" />
          <span className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">Update</span>
          <span className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground hidden sm:block">Pillar</span>
          <span className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">Time</span>
          <span className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground hidden sm:block">Heat</span>
        </div>
        {alerts.map(post => <AlertRow key={post.id} post={post} />)}
      </div>

      <div className="mt-8">
        <ComposeBar signedIn={signedIn} onPost={handleNewPost} />
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between py-4 border-b border-border">
          <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">Community · {community.length} posts</span>
          <div className="flex items-center gap-5">
            {([
              { id: 'all' as FilterId,           label: 'All' },
              { id: 'leaders' as FilterId,       label: 'Leaders' },
              { id: 'community' as FilterId,     label: 'Citizens' },
              { id: 'my-electorate' as FilterId, label: userPrefs.electorate ? `${userPrefs.electorate.split(' ')[0]}` : 'My Issues' },
            ]).map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)} className="font-mono text-[10px] tracking-wider uppercase transition-colors relative pb-3" style={{ color: filter === f.id ? '#e8e8e6' : '#5a5a5e' }}>
                {f.label}
                {filter === f.id && <span className="absolute bottom-0 left-0 right-0 h-px" style={{ background: '#e8e8e6' }} />}
              </button>
            ))}
          </div>
        </div>
        {community.length === 0 ? (
          <div className="py-12 text-center font-mono text-xs text-muted-foreground">No posts in this category</div>
        ) : (
          community.map(post => (
            <CommunityPost
              key={post.id}
              post={post}
              reactions={userReactions[post.id] ?? { heart: false, fire: false, flag: false }}
              counts={reactionCounts[post.id] ?? { heart: post.reactions.heart, fire: post.reactions.fire, flag: post.reactions.flag }}
              onReact={handleReact}
              signedIn={signedIn}
            />
          ))
        )}
      </div>

      <p className="font-mono text-[10px] text-muted-foreground text-center py-8">
        High-impact posts are algorithmically boosted · Last updated {new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
    </div>
  )
}
