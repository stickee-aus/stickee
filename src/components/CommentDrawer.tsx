'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { X, Send, MessageCircle, CornerDownRight } from 'lucide-react'
import { useComments, type Comment } from '@/hooks/useComments'
import { scoreToGrade } from '@/lib/civic-utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function gradeStyle(score?: number) {
  if (!score) return { color: '#3a3a3e' }
  const g = scoreToGrade(score)
  if (g === 'A' || g === 'B') return { color: '#2ec266' }
  if (g === 'C') return { color: '#f5a623' }
  return { color: '#f04747' }
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

// ─── Single comment ────────────────────────────────────────────────────────────

function CommentItem({
  comment,
  onReply,
  depth = 0,
}: {
  comment: Comment
  onReply: (parentId: string, handle: string) => void
  depth?: number
}) {
  const gs = gradeStyle(comment.civicScore)

  return (
    <div className={`flex gap-3 ${depth > 0 ? 'pl-6 border-l border-border/40 ml-3' : ''}`}>
      {/* Avatar */}
      <div
        className="h-7 w-7 shrink-0 flex items-center justify-center font-mono text-[9px] font-medium"
        style={{ background: '#1e1e20', color: gs.color }}
      >
        {initials(comment.authorName)}
      </div>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-mono text-xs text-foreground">{comment.authorName}</span>
          {comment.civicScore && (
            <span className="font-mono text-[9px]" style={gs}>
              {scoreToGrade(comment.civicScore)} · {comment.civicScore}
            </span>
          )}
          <span className="font-mono text-[9px] text-muted-foreground">{comment.authorHandle}</span>
          <span className="font-mono text-[9px] text-muted-foreground">·</span>
          <span className="font-mono text-[9px] text-muted-foreground">{relativeTime(comment.createdAt)}</span>
        </div>

        {/* Body */}
        <p className="font-mono text-xs text-foreground leading-relaxed">{comment.body}</p>

        {/* Reply button */}
        {depth === 0 && (
          <button
            onClick={() => onReply(comment.id, comment.authorHandle)}
            className="mt-1.5 flex items-center gap-1 font-mono text-[9px] tracking-widest uppercase transition-colors hover:text-foreground"
            style={{ color: '#3a3a3e' }}
          >
            <CornerDownRight className="h-2.5 w-2.5" /> Reply
          </button>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} onReply={onReply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Compose box ──────────────────────────────────────────────────────────────

function ComposeBox({
  replyTo,
  onClearReply,
  onSubmit,
  submitting,
  authenticated,
}: {
  replyTo: { parentId: string; handle: string } | null
  onClearReply: () => void
  onSubmit: (body: string, parentId?: string) => Promise<boolean>
  submitting: boolean
  authenticated: boolean
}) {
  const [body, setBody] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-focus and prefill when replying
  useEffect(() => {
    if (replyTo && textareaRef.current) {
      setBody(`${replyTo.handle} `)
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(replyTo.handle.length + 1, replyTo.handle.length + 1)
    }
  }, [replyTo])

  async function handleSubmit() {
    if (!body.trim()) return
    const ok = await onSubmit(body, replyTo?.parentId)
    if (ok) setBody('')
  }

  const charCount = body.length
  const overLimit = charCount > 500

  if (!authenticated) {
    return (
      <div className="border-t border-border p-4" style={{ background: '#0a0a0b' }}>
        <Link
          href="/auth/sign-in"
          className="flex items-center justify-center border border-border px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-foreground transition-colors hover:bg-card/50"
        >
          Sign in to comment
        </Link>
      </div>
    )
  }

  return (
    <div className="border-t border-border p-4 space-y-2" style={{ background: '#0a0a0b' }}>
      {replyTo && (
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: '#f5a623' }}>
            Replying to {replyTo.handle}
          </span>
          <button onClick={onClearReply} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={body}
          onChange={e => setBody(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
          }}
          rows={2}
          placeholder="Add to the civic conversation…"
          className="flex-1 resize-none border border-border bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/20 transition-colors"
        />
        <button
          onClick={handleSubmit}
          disabled={!body.trim() || overLimit || submitting}
          className="h-9 w-9 flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          style={{ background: body.trim() && !overLimit ? '#e8e8e6' : '#1e1e20', color: body.trim() && !overLimit ? '#0a0a0b' : '#3a3a3e' }}
        >
          {submitting
            ? <span className="h-3 w-3 border border-current border-t-transparent rounded-full animate-spin" />
            : <Send className="h-3.5 w-3.5" />
          }
        </button>
      </div>

      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] text-muted-foreground">⌘↵ to post</span>
        <span className="font-mono text-[9px]" style={{ color: overLimit ? '#f04747' : '#3a3a3e' }}>
          {charCount}/500
        </span>
      </div>
    </div>
  )
}

// ─── CommentDrawer ────────────────────────────────────────────────────────────

interface CommentDrawerProps {
  postId: string
  postTitle?: string
  open: boolean
  onClose: () => void
}

export function CommentDrawer({ postId, postTitle, open, onClose }: CommentDrawerProps) {
  const { comments, totalCount, addComment, submitting, authenticated } = useComments(postId)
  const [replyTo, setReplyTo] = useState<{ parentId: string; handle: string } | null>(null)

  function handleReply(parentId: string, handle: string) {
    setReplyTo({ parentId, handle })
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div
        className="fixed bottom-0 inset-x-0 z-50 flex flex-col border-t border-border md:right-0 md:left-auto md:top-0 md:bottom-0 md:w-96 md:border-t-0 md:border-l"
        style={{ background: '#0a0a0b', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" style={{ color: '#5a5a5e' }} />
            <span className="font-mono text-xs text-foreground">
              {totalCount} comment{totalCount !== 1 ? 's' : ''}
            </span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {postTitle && (
          <div className="px-4 py-2 border-b border-border shrink-0">
            <p className="font-mono text-[10px] text-muted-foreground line-clamp-1">{postTitle}</p>
          </div>
        )}

        {/* Comment list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {comments.length === 0 ? (
            <div className="py-8 text-center">
              <MessageCircle className="h-8 w-8 mx-auto mb-3" style={{ color: '#2a2a2e' }} />
              <p className="font-mono text-xs text-muted-foreground">No comments yet.</p>
              <p className="font-mono text-[10px] mt-1" style={{ color: '#3a3a3e' }}>Be the first to add to the conversation.</p>
            </div>
          ) : (
            comments.map(comment => (
              <CommentItem key={comment.id} comment={comment} onReply={handleReply} />
            ))
          )}
        </div>

        {/* Compose */}
        <ComposeBox
          replyTo={replyTo}
          onClearReply={() => setReplyTo(null)}
          onSubmit={addComment}
          submitting={submitting}
          authenticated={authenticated}
        />
      </div>
    </>
  )
}
