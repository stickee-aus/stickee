'use client'

import { useState } from 'react'
import { Heart, Flame, Flag, MessageCircle, BadgeCheck, Shield, Mail } from 'lucide-react'
import Link from 'next/link'
import type { FeedPost as FeedPostType, FeedReaction } from '@/lib/mock-feed-data'
import { PillarGradeChip } from '@/components/PillarGradeChip'
import { ShareButton } from '@/components/ShareButton'
import { CommentDrawer } from '@/components/CommentDrawer'
import { FollowButton } from '@/components/FollowButton'
import { MOCK_PROFILES } from '@/hooks/useFollows'
import { CIVIC_PILLARS } from '@/lib/mock-civic-data'
import { gradeTextColor, scoreToGrade } from '@/lib/civic-utils'
import { useComments } from '@/hooks/useComments'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function avatarColor(civicScore?: number): string {
  if (!civicScore) return 'bg-muted text-muted-foreground'
  if (civicScore >= 75) return 'bg-emerald-500/20 text-emerald-400'
  if (civicScore >= 55) return 'bg-amber-400/20 text-amber-400'
  if (civicScore >= 35) return 'bg-orange-500/20 text-orange-400'
  return 'bg-red-500/20 text-red-400'
}

const PILLAR_BORDER: Record<string, string> = {
  green:  'border-l-emerald-500',
  yellow: 'border-l-amber-400',
  red:    'border-l-red-500',
}

// ─── FeedPost ─────────────────────────────────────────────────────────────────

interface FeedPostProps {
  post: FeedPostType
  onReact: (postId: string, reaction: FeedReaction) => void
  userReactions: Partial<Record<FeedReaction, boolean>>
}

const REACTION_ICONS = { heart: Heart, fire: Flame, flag: Flag }
const REACTION_LABELS = { heart: 'Heart', fire: 'Fire', flag: 'Flag' }
const REACTION_COLORS: Record<FeedReaction, string> = {
  heart: 'text-red-400',
  fire:  'text-orange-400',
  flag:  'text-blue-400',
}

export function FeedPost({ post, onReact, userReactions }: FeedPostProps) {
  const [commentsOpen, setCommentsOpen] = useState(false)
  const { totalCount } = useComments(post.id)

  const linkedPillar = post.linkedPillarId
    ? CIVIC_PILLARS.find(p => p.id === post.linkedPillarId)
    : null

  const isAlert = post.type === 'civic_alert' || post.type === 'decision_update'
  const borderColor = linkedPillar ? PILLAR_BORDER[linkedPillar.status] : 'border-l-primary'

  const grade = post.civicScore ? scoreToGrade(post.civicScore) : null
  const gradeColor = grade ? gradeTextColor(grade) : ''

  // Live comment count = seed + any user-added
  const displayCommentCount = Math.max(totalCount, post.commentCount)

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/feed?post=${post.id}`
    : `/feed?post=${post.id}`

  // Resolve profile for follow button
  const handleSlug = post.authorHandle.replace('@', '')
  const profile = !isAlert ? MOCK_PROFILES[handleSlug] : null

  return (
    <>
      <article
        className={[
          'rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm transition-all',
          isAlert ? `border-l-4 ${borderColor}` : '',
          post.isAlgorithmicBoost ? 'ring-1 ring-primary/20' : '',
        ].join(' ')}
      >
        <div className="p-4 space-y-3">

          {/* ── Header ── */}
          <div className="flex items-start gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              isAlert ? 'bg-primary/15 text-primary' : avatarColor(post.civicScore)
            }`}>
              {isAlert ? <Shield className="h-4 w-4" /> : initials(post.authorName)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                {profile ? (
                  <Link href={`/u/${handleSlug}`} className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                    {post.authorName}
                  </Link>
                ) : (
                  <span className="text-sm font-semibold text-foreground">{post.authorName}</span>
                )}

                {post.authorVerified && !isAlert && (
                  <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
                )}

                {post.isAlgorithmicBoost && !isAlert && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    <Shield className="h-2.5 w-2.5" /> Civic Voice
                  </span>
                )}

                {post.civicScore && grade && (
                  <span className={`text-[11px] font-bold ${gradeColor}`}>
                    {grade} · {post.civicScore}
                  </span>
                )}

                <span className="text-[11px] text-muted-foreground">{post.authorHandle}</span>
                <span className="text-[11px] text-muted-foreground">·</span>
                <span className="text-[11px] text-muted-foreground">{relativeTime(post.postedAt)}</span>
              </div>
            </div>

            {/* Follow button for non-system posts with a known profile */}
            {profile && (
              <FollowButton userId={profile.userId} size="sm" />
            )}
          </div>

          {/* ── Linked context chip ── */}
          {linkedPillar && (
            <Link href={`/issues`} onClick={e => e.stopPropagation()}>
              <PillarGradeChip pillar={linkedPillar} compact />
            </Link>
          )}

          {post.linkedDecisionId && !linkedPillar && (
            <div className="rounded-lg border border-border/50 bg-background/60 px-3 py-2">
              <p className="text-xs text-muted-foreground">Decision update</p>
            </div>
          )}

          {/* ── Content ── */}
          <p className="text-sm text-foreground leading-relaxed">
            {post.content.split(/(@\w+|#\w+)/g).map((part, i) =>
              part.match(/^[@#]/) ? (
                <span key={i} className="text-primary font-medium">{part}</span>
              ) : (
                part
              )
            )}
          </p>

          {/* ── Action bar ── */}
          <div className="flex items-center gap-1 pt-1 border-t border-border/30">
            {/* Reactions */}
            {(['heart', 'fire', 'flag'] as FeedReaction[]).map(reaction => {
              const Icon = REACTION_ICONS[reaction]
              const active = userReactions[reaction]
              return (
                <button
                  key={reaction}
                  onClick={() => onReact(post.id, reaction)}
                  aria-label={REACTION_LABELS[reaction]}
                  aria-pressed={active}
                  className={[
                    'flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all',
                    active
                      ? `${REACTION_COLORS[reaction]} bg-current/10`
                      : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5',
                  ].join(' ')}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="tabular-nums">
                    {post.reactions[reaction] + (active ? 1 : 0)}
                  </span>
                </button>
              )
            })}

            {/* Comments — opens drawer */}
            <button
              onClick={() => setCommentsOpen(true)}
              className="ml-1 flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="tabular-nums">{displayCommentCount}</span>
            </button>

            {/* Share */}
            <ShareButton
              title={`${post.authorName} on Stickee: "${post.content.slice(0, 80)}…"`}
              text={post.content}
              url={shareUrl}
              count={post.shareCount}
              bonusPoints={50}
            />

            {/* Contact MP link */}
            {(post.linkedDecisionId || post.linkedPillarId) && (
              <Link
                href="/issues"
                className="ml-auto flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <Mail className="h-3.5 w-3.5" /> Contact MP
              </Link>
            )}
          </div>
        </div>
      </article>

      {/* Comment drawer */}
      <CommentDrawer
        postId={post.id}
        postTitle={post.content.slice(0, 80)}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
      />
    </>
  )
}
