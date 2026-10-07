import { MapPin, ArrowRight, Calendar, ExternalLink } from 'lucide-react'
import type { PathwayToRealPoliticsContent } from '@/types/leaders'

interface PathwayToRealPoliticsProps {
  content: PathwayToRealPoliticsContent
  leaderName: string
}

export function PathwayToRealPolitics({ content, leaderName }: PathwayToRealPoliticsProps) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-5 space-y-6">

      {/* ── Get Involved Locally ─────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-4 w-0.5 rounded-full bg-primary/60" />
          <MapPin className="h-3.5 w-3.5 text-muted-foreground/60" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Get Involved Locally
          </h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {content.howToGetInvolvedLocally}
        </p>
      </div>

      {/* ── Next Steps to Run for Office ─────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-4 w-0.5 rounded-full bg-primary/60" />
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Next Steps to Run for Office
          </h2>
        </div>
        <ol className="space-y-2.5">
          {content.nextStepsToRun.map((step, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary mt-0.5">
                {i + 1}
              </span>
              <span className="text-sm text-muted-foreground leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* ── Upcoming Nomination Opportunities ───────────────────── */}
      {content.upcomingNominationOpportunities.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-4 w-0.5 rounded-full bg-primary/60" />
            <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Upcoming Nomination Opportunities
            </h2>
          </div>
          <div className="space-y-2.5">
            {content.upcomingNominationOpportunities.map((opp) => (
              <div
                key={opp.id}
                className="rounded-xl border border-border/50 bg-muted/30 p-3.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground/90 leading-snug">
                    {opp.title}
                  </p>
                  {opp.url && (
                    <a
                      href={opp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 flex items-center gap-1 text-[11px] text-primary/70 hover:text-primary transition-colors mt-0.5"
                    >
                      <ExternalLink className="h-3 w-3" />
                      More info
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 mb-1.5">
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-muted/60 text-muted-foreground ring-1 ring-border/40">
                    {opp.state}
                  </span>
                  <span className="text-[10px] text-muted-foreground/50">
                    Closes {new Date(opp.closingDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{opp.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Footer disclaimer ────────────────────────────────────── */}
      <p className="text-[11px] text-muted-foreground/40 border-t border-border/30 pt-3">
        Nomination opportunities are sourced from public party and electoral commission websites.
        Stickee is not affiliated with any political party. Information may change — verify directly
        with the relevant organisation. {leaderName} has not endorsed any specific party or candidacy pathway.
      </p>
    </div>
  )
}
