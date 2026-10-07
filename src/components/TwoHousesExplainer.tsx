'use client'

import { Scale, Shield, Users, Building2, Gavel, Vote, FileCheck } from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const LOWER_HOUSE_FACTS = [
  { icon: Users,     title: 'Represents the People',  body: '150 MPs elected from electorates of roughly equal population. One MP per electorate ensures every vote counts the same.' },
  { icon: Gavel,     title: 'Forms Government',        body: 'The party or coalition with a majority (76+ seats) forms government. The PM must hold the confidence of the House.' },
  { icon: FileCheck, title: 'Initiates Most Laws',     body: 'Budget bills and most legislation start here. The House debates, amends, and passes bills before they move to the Senate.' },
  { icon: Vote,      title: 'Preferential Voting',     body: 'Voters rank candidates. If your first choice is eliminated, your vote flows to your next preference — no vote is wasted.' },
]

const UPPER_HOUSE_FACTS = [
  { icon: Shield,    title: 'House of Review',         body: '76 senators — 12 per state regardless of population, 2 from each territory — review and scrutinise bills from the House.' },
  { icon: Scale,     title: 'Check on Government Power', body: 'The Senate can block, amend, or delay legislation, acting as a brake on majority government overreach.' },
  { icon: Building2, title: 'Represents States Equally', body: 'Small states like Tasmania have the same number of senators as NSW or Victoria, protecting regional interests.' },
  { icon: Vote,      title: 'Proportional Voting',     body: 'Senators are elected by proportional representation, making it easier for minor parties and independents to win seats.' },
]

const HOW_A_BILL_PASSES = [
  { label: 'Introduced',    side: 'lower', desc: 'A minister or MP introduces the bill in the House of Representatives.' },
  { label: 'House debate',  side: 'lower', desc: 'MPs debate and vote on the bill. If passed, it moves to the Senate.' },
  { label: 'Senate review', side: 'upper', desc: 'Senators scrutinise the bill, propose amendments, and vote.' },
  { label: 'Royal Assent',  side: 'both',  desc: 'If both chambers agree, the Governor-General signs the bill into law.' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function FactCard({ icon: Icon, title, body, accent }: { icon: React.ElementType; title: string; body: string; accent: string }) {
  return (
    <div className="flex gap-3">
      <div
        className="w-7 h-7 flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: `${accent}15` }}
      >
        <Icon size={13} style={{ color: accent }} />
      </div>
      <div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-foreground mb-0.5">{title}</p>
        <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">{body}</p>
      </div>
    </div>
  )
}

function BillFlowStep({ step, index, isLast }: { step: (typeof HOW_A_BILL_PASSES)[number]; index: number; isLast: boolean }) {
  const sideColor = step.side === 'lower' ? '#2ec266' : step.side === 'upper' ? '#f04747' : '#5a9ef5'
  const sideLabel = step.side === 'lower' ? 'House' : step.side === 'upper' ? 'Senate' : 'Both'

  return (
    <div className="flex gap-3 items-start">
      {/* Step number + connector */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className="w-6 h-6 flex items-center justify-center font-mono text-[10px] font-medium border z-10 relative"
          style={{ borderColor: sideColor, color: sideColor, background: '#0a0a0b' }}
        >
          {index + 1}
        </div>
        {!isLast && <div className="w-px flex-1 min-h-[28px] mt-1" style={{ backgroundColor: `${sideColor}30` }} />}
      </div>
      {/* Content */}
      <div className="pb-5">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-foreground">{step.label}</p>
          <span
            className="font-mono text-[9px] uppercase tracking-widest border px-1.5 py-0.5"
            style={{ borderColor: `${sideColor}30`, color: sideColor }}
          >
            {sideLabel}
          </span>
        </div>
        <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">{step.desc}</p>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TwoHousesExplainer() {
  return (
    <div className="overflow-hidden">
      {/* Toggle header (rendered by EducationAccordion in ParliamentExperienceClient) */}
      {/* The outer button is in EducationAccordion — this component just renders the inner content */}
      {/* Split layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-border">
        {/* Lower House */}
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-2 w-2" style={{ background: '#2ec266' }} />
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-foreground">Lower House</h3>
            <span className="font-mono text-[10px] text-muted-foreground">House of Representatives</span>
          </div>

          {/* Visual representation */}
          <div className="border p-4" style={{ borderColor: '#0e3020' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px]" style={{ color: '#2ec266' }}>150 Members</span>
              <span className="font-mono text-[9px] text-muted-foreground">1 per electorate</span>
            </div>
            <div className="flex flex-wrap gap-1 justify-center py-2">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="w-2.5 h-2.5"
                  style={{ backgroundColor: i < 19 ? '#E53935' : i < 20 ? '#2E7D32' : i < 23 ? '#EC407A' : '#1565C0', opacity: 0.9 }}
                />
              ))}
              <span className="w-full text-center font-mono text-[9px] text-muted-foreground/50 mt-1">
                (scaled · 30 of 150 seats shown)
              </span>
            </div>
            <div className="flex gap-3 justify-center flex-wrap mt-1">
              {[['#E53935','Labor 94'],['#1565C0','Coalition 42'],['#EC407A','Ind. 10'],['#2E7D32','Greens 1']].map(([c,l]) => (
                <span key={l} className="flex items-center gap-1 font-mono text-[9px] text-muted-foreground">
                  <span className="w-2 h-2 shrink-0" style={{ backgroundColor: c as string }} />
                  {l}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {LOWER_HOUSE_FACTS.map(f => (
              <FactCard key={f.title} icon={f.icon} title={f.title} body={f.body} accent="#2ec266" />
            ))}
          </div>
        </div>

        {/* Senate */}
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-2 w-2" style={{ background: '#f04747' }} />
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-foreground">Upper House</h3>
            <span className="font-mono text-[10px] text-muted-foreground">The Senate</span>
          </div>

          {/* Visual representation */}
          <div className="border p-4" style={{ borderColor: '#3a1414' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px]" style={{ color: '#f04747' }}>76 Senators</span>
              <span className="font-mono text-[9px] text-muted-foreground">12 per state · 2 territory</span>
            </div>
            <div className="grid grid-cols-6 gap-1.5 py-2 px-4">
              {['NSW','VIC','QLD','WA','SA','TAS'].map(state => (
                <div key={state} className="flex flex-col items-center gap-0.5">
                  <div className="w-8 h-8 border flex items-center justify-center" style={{ borderColor: '#3a1414', background: '#1e0a0a' }}>
                    <span className="font-mono text-[9px]" style={{ color: '#f04747' }}>{state}</span>
                  </div>
                  <span className="font-mono text-[8px] text-muted-foreground/50">12</span>
                </div>
              ))}
            </div>
            <p className="text-center font-mono text-[9px] text-muted-foreground/50 mt-1">
              Equal representation regardless of population
            </p>
          </div>

          <div className="space-y-3">
            {UPPER_HOUSE_FACTS.map(f => (
              <FactCard key={f.title} icon={f.icon} title={f.title} body={f.body} accent="#f04747" />
            ))}
          </div>
        </div>
      </div>

      {/* How a bill becomes law */}
      <div className="border-t border-border p-5">
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-foreground mb-4">How a Bill Becomes Law</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-0 sm:gap-x-4">
          {HOW_A_BILL_PASSES.map((step, i) => (
            <BillFlowStep key={step.label} step={step} index={i} isLast={i === HOW_A_BILL_PASSES.length - 1} />
          ))}
        </div>
      </div>

      {/* Key difference callout */}
      <div className="border-t border-border p-5">
        <div className="border-l-2 border-border pl-4 py-1">
          <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
            <span className="text-foreground">The key difference: </span>
            The House decides <em>who governs</em> and <em>what laws get passed first</em>.
            The Senate acts as a <em>democratic safeguard</em> — it can reject or force changes to legislation
            that doesn’t have broad support across states and communities. This tension is by design.
          </p>
        </div>
      </div>
    </div>
  )
}
