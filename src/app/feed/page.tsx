'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, Flame, Flag, MessageCircle, Mail, PenSquare, Lock, BadgeCheck } from 'lucide-react'
import { FEED_POSTS, type FeedPost, type FeedReaction } from '@/lib/mock-feed-data'
import { CIVIC_PILLARS } from '@/lib/mock-civic-data'
import { scoreToGrade } from '@/lib/civic-utils'
import { useToast } from '@/components/ui/toast'
import { ShareButton } from '@/components/ShareButton'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function fmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

function initials(name: string): string {
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

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  civic_alert:     { label: 'ALERT',    color: '#f04747' },
  decision_update: { label: 'BILL',     color: '#f5a623' },
  leader_update:   { label: 'LEADER',   color: '#2ec266' },
  user_post:       { label: 'CIVIC',    color: '#5a5a5e' },
}

// ─── Alert row ────────────────────────────────────────────────────────────────

function AlertRow({ post }: { post: FeedPost }) {
  const pillar   = post.linkedPillarId ? PILLAR_DISPLAY[post.linkedPillarId] : null
  const typeBadge = TYPE_BADGE[post.type] ?? { label: 'ALERT', color: '#f04747' }
  const totalFire = post.reactions.fire

  // Truncate content for compact display
  const preview = post.content.replace(/^[^\w]+ /, '').slice(0, 100) + (post.content.length > 100 ? '…' : '')

  return (
    <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 items-center py-3 border-b border-border hover:bg-card/30 transition-colors">
      {/* Status dot */}
      <div
        className="h-1.5 w-1.5 rounded-full shrink-0"
        style={{ background: typeBadge.color }}
      />

      {/* Type badge + content */}
      <div className="flex items-baseline gap-2 min-w-0">
        <span
          className="font-mono text-[9px] tracking-widest shrink-0"
          style={{ color: typeBadge.color }}
        >
          {typeBadge.label}
        </span>
        <span className="font-mono text-xs text-muted-foreground truncate">
          {preview}
        </span>
      </div>

      {/* Pillar tag */}
      {pillar ? (
        <span
          className="font-mono text-[9px] tracking-wider shrink-0 hidden sm:block"
          style={{ color: pillar.color }}
        >
          {pillar.label}
        </span>
      ) : (
        <span />
      )}

      {/* Time */}
      <span className="font-mono text-[10px] text-muted-foreground shrink-0">
        {relativeTime(post.postedAt)}
      </span>

      {/* Fire count */}
      <span className="font-mono text-[10px] text-muted-foreground shrink-0 hidden sm:block">
        🔥 {fmt(totalFire)}
      </span>
    </div>
  )
}

// ─── Community post card ───────────────────────────────────────────────────────

interface CommunityPostProps {
  post: FeedPost
  userReactions: Partial<Record<FeedReaction, boolean>>
  onReact: (postId: string, reaction: FeedReaction) => void
}

const REACTION_ICONS = { heart: Heart, fire: Flame, flag: Flag }
const REACTION_COLORS: Record<FeedReaction, string> = {
  heart: '#f04747',
  fire:  '#f5a623',
  flag:  '#5a5a5e',
}

function CommunityPost({ post, userReactions, onReact }: CommunityPostProps) {
  const isLeader = post.type === 'leader_update'
  const grade    = post.civicScore ? scoreToGrade(post.civicScore) : null
  const gs       = grade ? gradeStyle(grade) : null
  const pillar   = post.linkedPillarId ? PILLAR_DISPLAY[post.linkedPillarId] : null

  return (
    <article className="border-b border-border py-4 hover:bg-card/20 transition-colors">
      {/* ── Header row ── */}
      <div className="flex items-start gap-3 mb-3">
        {/* Initials avatar */}
        <div
          className="h-8 w-8 flex items-center justify-center font-mono text-[10px] font-medium shrink-0 relative"
          style={{ background: '#1e1e20', color: isLeader ? '#2ec266' : '#5a5a5e' }}
        >
          {initials(post.authorName)}
          {isLeader && (
            <span
              className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full"
              style={{ background: '#2ec266' }}
            />
          )}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-foreground font-medium">{post.authorName}</span>
            {post.authorVerified && (
              <BadgeCheck className="h-3 w-3 shrink-0" style={{ color: '#2ec266' }} />
            )}
            {gs && grade && (
              <span
                className="font-mono text-[9px] tracking-wider px-1.5 py-0.5 border"
                style={gs}
              >
                {grade} · {post.civicScore}
              </span>
            )}
            <span className="font-mono text-[10px] text-muted-foreground">{post.authorHandle}</span>
            <span className="font-mono text-[10px] text-muted-foreground">·</span>
            <span className="font-mono text-[10px] text-muted-foreground">{relativeTime(post.postedAt)}</span>

            {/* Pillar tag */}
            {pillar && (
              <>
                <span className="font-mono text-[10px] text-muted-foreground">·</span>
                <span
                  className="font-mono text-[9px] tracking-wider"
                  style={{ color: pillar.color }}
                >
                  {pillar.label}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Boost indicator */}
        {post.isAlgorithmicBoost && (
          <span
            className="font-mono text-[9px] tracking-widest shrink-0"
            style={{ color: '#2ec266' }}
          >
            ↑ BOOSTED
          </span>
        )}
      </div>

      {/* ── Content ── */}
      <p className="font-mono text-xs text-foreground leading-relaxed mb-3">
        {post.content.split(/(@\w+|#\w+)/g).map((part, i) =>
          part.match(/^[@#]/) ? (
            <span key={i} style={{ color: '#f5a623' }}>{part}</span>
          ) : (
            part
          )
        )}
      </p>

      {/* ── Action bar ── */}
      <div className="flex items-center gap-3">
        {(['heart', 'fire', 'flag'] as FeedReaction[]).map(reaction => {
          const Icon   = REACTION_ICONS[reaction]
          const active = userReactions[reaction]
          const count  = post.reactions[reaction] + (active ? 1 : 0)
          return (
            <button
              key={reaction}
              onClick={() => onReact(post.id, reaction)}
              className="flex items-center gap-1 font-mono text-[10px] transition-colors"
              style={{ color: active ? REACTION_COLORS[reaction] : '#3a3a3e' }}
            >
              <Icon className="h-3 w-3" />
              {fmt(count)}
            </button>
          )
        })}

        <span className="flex items-center gap-1 font-mono text-[10px]" style={{ color: '#3a3a3e' }}>
          <MessageCircle className="h-3 w-3" /> {fmt(post.commentCount)}
        </span>

        <ShareButton
          title={`${post.authorName} on Stickee: "${post.content.slice(0, 80)}…"`}
          text={post.content}
          count={post.shareCount}
          bonusPoints={50}
        />

        {(post.linkedDecisionId || post.linkedPillarId) && (
          <Link
            href="/issues"
            className="ml-auto flex items-center gap-1 font-mono text-[10px] tracking-wider transition-colors hover:opacity-70"
            style={{ color: '#5a5a5e' }}
          >
            <Mail className="h-3 w-3" /> CONTACT MP
          </Link>
        )}
      </div>
    </article>
  )
}

// ─── Compose bar ──────────────────────────────────────────────────────────────

function ComposeBar() {
  const { toast } = useToast()
  return (
    <button
      onClick={() => toast("Sign in to post to the civic feed", "info")}
      className="w-full flex items-center gap-3 border border-border px-4 py-3 text-left hover:bg-card/30 transition-colors"
    >
      <div
        className="h-7 w-7 flex items-center justify-center shrink-0"
        style={{ background: '#1e1e20', color: '#5a5a5e' }}
      >
        <PenSquare className="h-3.5 w-3.5" />
      </div>
      <span className="font-mono text-xs text-muted-foreground flex-1">
        What&apos;s happening in your electorate?
      </span>
      <div
        className="flex items-center gap-1 font-mono text-[9px] tracking-widest border px-2 py-1 shrink-0"
        style={{ color: '#5a5a5e', borderColor: '#1e1e20' }}
      >
        <Lock className="h-2.5 w-2.5" /> SIGN IN
      </div>
    </button>
  )
}

// ─── Feed page ────────────────────────────────────────────────────────────────

type FilterId = 'all' | 'community' | 'leaders' | 'my-electorate'

// ─── Personalisation helpers ─────────────────────────────────────────────────

function loadUserPrefs(): { electorate: string; topIssues: string[] } {
  if (typeof window === 'undefined') return { electorate: '', topIssues: [] }
  try {
    const raw = localStorage.getItem('stickee:user-prefs')
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { electorate: '', topIssues: [] }
}

export default function FeedPage() {
  const [filter, setFilter]           = useState<FilterId>('all')
  const [userReactions, setUserReactions] = useState<Record<string, Partial<Record<FeedReaction, boolean>>>>({})
  const [userPrefs] = useState(() => loadUserPrefs())

  function handleReact(postId: string, reaction: FeedReaction) {
    setUserReactions(prev => {
      const existing = prev[postId] ?? {}
      return { ...prev, [postId]: { ...existing, [reaction]: !existing[reaction] } }
    })
  }

  const alerts    = FEED_POSTS.filter(p => p.type === 'civic_alert' || p.type === 'decision_update')
    .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())

  const community = FEED_POSTS
    .filter(p => {
      if (p.type !== 'user_post' && p.type !== 'leader_update') return false
      if (filter === 'community')   return p.type === 'user_post'
      if (filter === 'leaders')     return p.type === 'leader_update'
      if (filter === 'my-electorate') {
        // Show posts related to user's top issues
        return userPrefs.topIssues.length === 0 ||
          userPrefs.topIssues.some(id => p.linkedPillarId === id)
      }
      return true
    })
    .sort((a, b) => {
      // Boost posts matching user's top issues when personalised
      if (filter === 'my-electorate' && userPrefs.topIssues.length > 0) {
        const aRelevant = userPrefs.topIssues.includes(a.linkedPillarId ?? '')
        const bRelevant = userPrefs.topIssues.includes(b.linkedPillarId ?? '')
        if (aRelevant !== bRelevant) return aRelevant ? -1 : 1
      }
      if (a.isAlgorithmicBoost !== b.isAlgorithmicBoost) return a.isAlgorithmicBoost ? -1 : 1
      return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
    })

  const totalPosts     = FEED_POSTS.length
  const totalAlerts    = alerts.length
  const totalCommunity = FEED_POSTS.filter(p => p.type === 'user_post' || p.type === 'leader_update').length

  return (
    <div className="mx-auto max-w-2xl px-6">

      {/* ── Page header ── */}
      <div className="flex items-end justify-between gap-6 py-10 border-b border-border">
        <div>
          <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
            Australia · Civic Feed
          </p>
          <div className="flex items-baseline gap-3">
            <span
              className="font-mono font-normal leading-none text-foreground"
              style={{ fontSize: 'clamp(40px, 8vw, 56px)', letterSpacing: '-0.02em' }}
            >
              {totalPosts}
            </span>
            <span className="font-mono text-xl text-muted-foreground/40">posts</span>
          </div>
          <p className="font-mono text-xs text-muted-foreground mt-2" style={{ letterSpacing: '0.03em' }}>
            {totalAlerts} system alerts · {totalCommunity} community posts
          </p>
        </div>

        <div className="hidden sm:flex items-end gap-6 pb-1">
          <div className="text-right">
            <p className="font-mono text-xl font-normal mb-1" style={{ color: '#f04747' }}>{totalAlerts}</p>
            <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>Alerts</p>
          </div>
          <div className="w-px h-8 bg-border mb-1" />
          <div className="text-right">
            <p className="font-mono text-xl font-normal mb-1" style={{ color: '#2ec266' }}>
              {FEED_POSTS.filter(p => p.type === 'leader_update').length}
            </p>
            <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>Leaders</p>
          </div>
          <div className="w-px h-8 bg-border mb-1" />
          <div className="text-right">
            <p className="font-mono text-xl font-normal mb-1 text-foreground">
              {FEED_POSTS.filter(p => p.type === 'user_post').length}
            </p>
            <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>Citizens</p>
          </div>
        </div>
      </div>

      {/* ── System alerts strip ── */}
      <div className="mt-8">
        <div className="flex items-center justify-between py-4 border-b border-border">
          <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
            System Alerts · Latest
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {totalAlerts} active
          </span>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 items-center py-2 border-b border-border">
          <span className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground w-1.5" />
          <span className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">Update</span>
          <span className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground hidden sm:block">Pillar</span>
          <span className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">Time</span>
          <span className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground hidden sm:block">Heat</span>
        </div>

        {alerts.map(post => (
          <AlertRow key={post.id} post={post} />
        ))}
      </div>

      {/* ── Compose bar ── */}
      <div className="mt-8">
        <ComposeBar />
      </div>

      {/* ── Community feed ── */}
      <div className="mt-8">
        <div className="flex items-center justify-between py-4 border-b border-border">
          <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
            Community · {community.length} posts
          </span>

          {/* Filter tabs */}
          <div className="flex items-center gap-5">
            {([
              { id: 'all' as FilterId,            label: 'All' },
              { id: 'leaders' as FilterId,        label: 'Leaders' },
              { id: 'community' as FilterId,      label: 'Citizens' },
              { id: 'my-electorate' as FilterId,  label: userPrefs.electorate ? `${userPrefs.electorate.split(' ')[0]}` : 'My Issues' },
            ]).map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className="font-mono text-[10px] tracking-wider uppercase transition-colors relative pb-3"
                style={{ color: filter === f.id ? '#e8e8e6' : '#5a5a5e' }}
              >
                {f.label}
                {filter === f.id && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-px"
                    style={{ background: '#e8e8e6' }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {community.length === 0 ? (
          <div className="py-12 text-center font-mono text-xs text-muted-foreground">
            No posts in this category
          </div>
        ) : (
          community.map(post => (
            <CommunityPost
              key={post.id}
              post={post}
              userReactions={userReactions[post.id] ?? {}}
              onReact={handleReact}
            />
          ))
        )}
      </div>

      {/* Footer note */}
      <p className="font-mono text-[10px] text-muted-foreground text-center py-8">
        High-impact posts are algorithmically boosted · Last updated {new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>

    </div>
  )
}
