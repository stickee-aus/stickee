'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, MapPin, BadgeCheck, Users, UserCheck } from 'lucide-react'
import { MOCK_PROFILES } from '@/hooks/useFollows'
import { useFollows } from '@/hooks/useFollows'
import { FollowButton } from '@/components/FollowButton'
import { FEED_POSTS } from '@/lib/mock-feed-data'
import { scoreToGrade, gradeTextColor } from '@/lib/civic-utils'
import { CIVIC_PILLARS } from '@/lib/mock-civic-data'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

const PILLAR_DISPLAY: Record<string, { label: string; color: string }> = {
  'cost-of-living': { label: 'Cost of Living', color: '#f04747' },
  'housing':        { label: 'Housing',         color: '#f04747' },
  'crime-safety':   { label: 'Crime & Safety',  color: '#f5a623' },
  'jobs-economy':   { label: 'Economy',         color: '#f5a623' },
  'future':         { label: 'Future',          color: '#2ec266' },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PublicProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = use(params)
  const profile = MOCK_PROFILES[handle]
  const { followingCount: myFollowingCount } = useFollows()

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="font-mono text-sm" style={{ color: '#5a5a5e' }}>@{handle} not found</p>
        <Link href="/feed" className="font-mono text-xs tracking-widest uppercase border border-border px-4 py-2 hover:border-primary/50 transition-colors">
          Back to feed
        </Link>
      </div>
    )
  }

  const grade = scoreToGrade(profile.civicScore)
  const gradeColor = gradeTextColor(grade)

  // Posts authored by this user (match on authorHandle)
  const userHandle = `@${profile.handle}`
  const userPosts = FEED_POSTS.filter(p => p.authorHandle === userHandle && p.type === 'user_post')

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 space-y-6">

      {/* Back nav */}
      <Link
        href="/feed"
        className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase transition-colors"
        style={{ color: '#5a5a5e' }}
      >
        <ArrowLeft className="h-3 w-3" /> Feed
      </Link>

      {/* Profile card */}
      <div
        className="rounded-2xl border border-border/60 p-5 space-y-4"
        style={{ background: '#0d0d0f' }}
      >
        {/* Avatar + follow */}
        <div className="flex items-start gap-4">
          <div
            className="h-14 w-14 shrink-0 flex items-center justify-center font-mono text-lg font-bold rounded-full"
            style={{ background: '#1e1e20', color: '#2ec266' }}
          >
            {profile.displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground text-base">{profile.displayName}</span>
              <BadgeCheck className="h-4 w-4 shrink-0" style={{ color: '#2ec266' }} />
              <span className={`font-mono text-xs font-bold ${gradeColor}`}>
                {grade} · {profile.civicScore}
              </span>
            </div>
            <p className="font-mono text-xs mt-0.5" style={{ color: '#5a5a5e' }}>@{profile.handle}</p>
            {profile.electorate && (
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" style={{ color: '#5a5a5e' }} />
                <span className="font-mono text-[11px]" style={{ color: '#5a5a5e' }}>{profile.electorate}</span>
              </div>
            )}
          </div>

          <FollowButton userId={profile.userId} />
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-sm text-foreground/80 leading-relaxed">{profile.bio}</p>
        )}

        {/* Top issues */}
        {profile.topIssues && profile.topIssues.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {profile.topIssues.map(issueId => {
              const pillar = PILLAR_DISPLAY[issueId]
              return pillar ? (
                <span
                  key={issueId}
                  className="font-mono text-[10px] tracking-widest uppercase px-2 py-0.5 border"
                  style={{ color: pillar.color, borderColor: `${pillar.color}30` }}
                >
                  {pillar.label}
                </span>
              ) : null
            })}
          </div>
        )}

        {/* Stats row */}
        <div className="flex gap-6 pt-2 border-t border-border/30">
          <div className="text-center">
            <div className="font-mono text-sm font-bold text-foreground">{fmt(profile.followerCount)}</div>
            <div className="font-mono text-[10px] mt-0.5" style={{ color: '#5a5a5e' }}>Followers</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-sm font-bold text-foreground">{fmt(profile.followingCount)}</div>
            <div className="font-mono text-[10px] mt-0.5" style={{ color: '#5a5a5e' }}>Following</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-sm font-bold text-foreground">{userPosts.length}</div>
            <div className="font-mono text-[10px] mt-0.5" style={{ color: '#5a5a5e' }}>Posts</div>
          </div>
        </div>
      </div>

      {/* Posts section */}
      <div className="space-y-3">
        <h2 className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>
          Posts
        </h2>

        {userPosts.length === 0 ? (
          <div
            className="rounded-2xl border border-border/40 p-8 text-center"
            style={{ background: '#0d0d0f' }}
          >
            <p className="font-mono text-xs" style={{ color: '#5a5a5e' }}>No posts yet.</p>
          </div>
        ) : (
          userPosts.map(post => (
            <div
              key={post.id}
              className="rounded-2xl border border-border/50 p-4 space-y-2"
              style={{ background: '#0d0d0f' }}
            >
              <p className="text-sm text-foreground leading-relaxed">
                {post.content.split(/(@\w+|#\w+)/g).map((part, i) =>
                  part.match(/^[@#]/) ? (
                    <span key={i} className="font-medium" style={{ color: '#2ec266' }}>{part}</span>
                  ) : part
                )}
              </p>
              <div className="flex items-center gap-3 font-mono text-[10px]" style={{ color: '#3a3a3e' }}>
                <span>{relativeTime(post.postedAt)}</span>
                <span>·</span>
                <span>❤ {post.reactions.heart}</span>
                <span>🔥 {post.reactions.fire}</span>
                <span>💬 {post.commentCount}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Discover others */}
      <div className="space-y-3">
        <h2 className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>
          Other civic voices
        </h2>
        <div className="grid grid-cols-1 gap-2">
          {Object.values(MOCK_PROFILES)
            .filter(p => p.handle !== profile.handle)
            .map(p => {
              const g = scoreToGrade(p.civicScore)
              const gc = gradeTextColor(g)
              return (
                <Link
                  key={p.handle}
                  href={`/u/${p.handle}`}
                  className="flex items-center gap-3 rounded-xl border border-border/40 px-3 py-2.5 transition-colors hover:border-border/80"
                  style={{ background: '#0d0d0f' }}
                >
                  <div
                    className="h-8 w-8 shrink-0 flex items-center justify-center font-mono text-[10px] font-bold rounded-full"
                    style={{ background: '#1e1e20', color: '#2ec266' }}
                  >
                    {p.displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-foreground truncate">{p.displayName}</span>
                      <span className={`font-mono text-[10px] font-bold ${gc}`}>{g} · {p.civicScore}</span>
                    </div>
                    <p className="font-mono text-[10px] truncate" style={{ color: '#5a5a5e' }}>@{p.handle}</p>
                  </div>
                  <FollowButton userId={p.userId} size="sm" />
                </Link>
              )
            })}
        </div>
      </div>
    </div>
  )
}
