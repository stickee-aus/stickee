# Stickee V1 — Low-Fidelity Wireframes

Companion to `CORE_PAGE_REDESIGN.md`. Structural wireframes only — no colour, type, or component-level design (that layer is already fixed by `CIVIC_DESIGN_SYSTEM.md`). Box width is not proportional to final layout; it communicates presence, order, and relative weight only. `═` marks the page's one primary hero/action element; `─` marks a standard block; `┈` marks a linked-out summary (not embedded content); `░` marks a collapsed/de-emphasised element.

---

## Today

```
┌──────────────────────────────────────────────────┐
│ ══ HERO ═══════════════════════════════════════  │  "Know what's changing. Know what to do."
│    [Explore the issues]  [Personalise my brief]   │   2 CTAs, nothing else competes here
├──────────────────────────────────────────────────┤
│ ─ ISSUES ──────┐ ─ GOVERNMENT ─┐ ─ FORECASTS ──┐  │  ONE card per destination —
│  why it matters │ what's decided│ what's next   │  │  copy + live preview fused,
│  "12 active"    │ "preparing"   │ "2 live"      │  │  not shown twice on the page
├──────────────────────────────────────────────────┤
│ ┈ WHAT CHANGED TODAY (Political Pulse strip) ───  │  NEW — currently absent entirely
│   • Bill X passed the House · 2h ago              │
│   • Forecast opened: will Y pass? · 5h ago        │
│                                    [See Pulse →]   │
├──────────────────────────────────────────────────┤
│ ── MAKE IT YOURS ──────────────────────────────   │  one closing CTA
│    [Build my brief]                                │
└──────────────────────────────────────────────────┘
```
**Mobile:** hero + 3 cards stack vertically; Pulse strip collapses to 2 items + "See all."

---

## Issues (list)

```
┌──────────────────────────────────────────────────┐
│ ══ 12 bills tracked ═══════════════════════════   │  ONE hero number, stated once
│    4 active · 6 passed · 2 rejected                │
├──────────────────────────────────────────────────┤
│ [All] [Active] [Passed] [Rejected]   [🔍 search]  │  underline tabs + NEW topic search
├──────────────────────────────────────────────────┤
│ ─ ● ACTIVE  Housing Affordability Crisis ───────  │  status · title · summary ·
│   "62% of MPs voted yes"                     ▾    │  ONE plain support figure · expand
├──────────────────────────────────────────────────┤
│ ─ ● PASSED  Aged Care Reform Bill ──────────────  │
│   "71% of MPs voted yes"                     ▾    │
└──────────────────────────────────────────────────┘
```
**Mobile:** expand chevron stays visible outside any responsive hide-block (today's bug).

## Issue detail (expanded row / `/issues/[slug]`)

```
┌──────────────────────────────────────────────────┐
│ ══ Housing Affordability Crisis ═══════════════   │  title · status · [Simulate ▸] chip
├──────────────────────────────────────────────────┤
│ ── What's happening ───────────────────────────   │
│ ── Who supports (named, sourced) ──────────────   │
│ ── Who opposes (named, sourced)  ──────────────   │
├──────────────────────────────────────────────────┤
│ ── ONE prediction affordance ──────────────────   │  not two competing mechanisms
├──────────────────────────────────────────────────┤
│ ── Take action — real bill_pressures ──────────   │  the primary action
├──────────────────────────────────────────────────┤
│ ░ Timeline (once real table exists) ────────────  │
│ ┈ "58% likely — see the full forecast →"          │  LINK, not embedded order book
│ ┈ "MPs: 62% yes — see the full record →"          │  LINK, not embedded 150-row grid
└──────────────────────────────────────────────────┘
```

---

## Government

```
┌──────────────────────────────────────────────────┐
│ ══ [1 real, computed hero stat] ═══════════════   │  not 4 hardcoded literals
├──────────────────────────────────────────────────┤
│ ── THE EXECUTIVE — decisions & announcements ──   │  explicit institutional split
│   ─ Government Decision card                      │  (Public Policy requirement)
│   ─ Government Decision card                       │
├──────────────────────────────────────────────────┤
│ ── THE PARLIAMENT — bills, votes, committees ──   │
│   ┈ "See all bills tracked →" (links to Issues)   │  no duplicate bill list here
│   ── Today's priority action ──────────────────   │  PriorityBillFocus, unchanged
│   ── Your Rep ──────────────────────────────────  │  → links to /people/[id]
│   ── Chamber (House/Senate/Live) ───────────────  │
├──────────────────────────────────────────────────┤
│ ░ Learn how Parliament works (collapsed) ──────   │  already correct, keep
└──────────────────────────────────────────────────┘
```
**Mobile:** anchor-jump nav between the four remaining blocks once the bill list is removed.

## Government Decision detail

```
┌──────────────────────────────────────────────────┐
│ ══ [Decision title] ═══════════════════════════   │  status · real decision-maker
├──────────────────────────────────────────────────┤
│ ── What was decided, and why ──────────────────   │
│ ── Institutional context (federal/state/local,     │
│    executive vs legislative) ──────────────────   │
├──────────────────────────────────────────────────┤
│ ░ Timeline (once real) ─────────────────────────  │
│ ┈ Linked evidence · ┈ Linked forecast              │
├──────────────────────────────────────────────────┤
│ ── Take real action ────────────────────────────  │
└──────────────────────────────────────────────────┘
   NOT BUILDABLE on mock-government-data.ts — real
   issues-table object required first (see blueprint §7)
```

## Parliament

```
┌──────────────────────────────────────────────────┐
│ ══ [1 real hero stat] ═════════════════════════   │  computed, not literal
├──────────────────────────────────────────────────┤
│ ── Today's priority bill ──────────────────────   │  keep unchanged, strongest pattern
│ ── Your Rep ────────────────────────────────────  │  → MUST link to /people/[mp.id]
│ ── Chamber (House/Senate + Current/Live) ──────   │  real, unique evidence
├──────────────────────────────────────────────────┤
│ ░ Learn how Parliament works (collapsed) ──────   │
└──────────────────────────────────────────────────┘
```

---

## Forecasts

```
┌──────────────────────────────────────────────────┐
│ ══ [N] active forecasts ═══════════════════════   │  ONE number — no wallet in this row
├──────────────────────────────────────────────────┤
│ ── Featured forecast ──────────────────────────   │  one editorial-quality lead card
├──────────────────────────────────────────────────┤
│ [All][Bills][Elections][MP Votes][Civic]           │  underline tabs, keep
├──────────────────────────────────────────────────┤
│ ─card─ ─card─ ─card─ ─card─ ─card─ ─card─          │  grid, no wallet/leaderboard/
│                                                     │  election-pulse/propose here
└──────────────────────────────────────────────────┘
```
Relocated out of this page entirely: wallet + portfolio → Account · leaderboard → Account
(one real query) or hidden · Live Election Pulse → contextual (only when active) ·
"+Propose" → removed until real · Simulator strip → one small chip, not a strip.

## Forecast detail (`/forecasts/[id]` — currently does not exist)

```
┌──────────────────────────────────────────────────┐
│ ══ [The question, as a headline] ══════════════   │
├──────────────────────────────────────────────────┤
│ ── Current estimate ────────────────────────────  │  plain numeral + methodology line
│ ── Resolution criteria (stated in advance) ────   │
│ ── Evidence / history (chart) ──────────────────   │
│ ┈ "From this issue →" (links back — currently no  │
│    forecast card links to its originating issue)   │
├──────────────────────────────────────────────────┤
│ ── Stake this view (sign-in gated) ────────────   │  the one inline action
└──────────────────────────────────────────────────┘
```

---

## People

```
┌──────────────────────────────────────────────────┐
│ ══ [N] House of Reps tracked ═══════════════════   │  already the best header — keep
│    Source: TheyVoteForYou · [sync date]            │
├──────────────────────────────────────────────────┤
│ ── Find your MP (electorate lookup) ───────────   │  moved here from Parliament
├──────────────────────────────────────────────────┤
│ [Sort: Party/Name] [Party filter chips]            │
│ ─ MP row → /people/[id] ────────────────────────  │  the page's actual centre
│ ─ MP row → /people/[id] ────────────────────────  │
│ ─ MP row → /people/[id] ────────────────────────  │
├──────────────────────────────────────────────────┤
│ ░ Party composition strip (static, not a map) ──  │  chamber map lives on Government
├──────────────────────────────────────────────────┤
│ ── Community-nominated leaders (clearly labeled,  │
│    permanently distinguished from elected MPs) ──  │
└──────────────────────────────────────────────────┘
```

## MP profile

```
┌──────────────────────────────────────────────────┐
│ ══ [Name] · [Party] · [Electorate] ═════════════   │
├──────────────────────────────────────────────────┤
│ ── Real voting record (raw, dated, sourced) ───   │  the page's actual job —
│    or "being verified" honest placeholder ─────   │  NOT a computed score
├──────────────────────────────────────────────────┤
│ ░ Simulate this MP's stance (chip, de-emphasised) │  moved below the record
└──────────────────────────────────────────────────┘
```

---

## Political Pulse

```
┌──────────────────────────────────────────────────┐
│ ══ Political Pulse — what changed ═════════════   │
├──────────────────────────────────────────────────┤
│ [Parliament] [Bills] [Forecasts]                    │  V1 filters — evidence-supportable
│                                                      │  content types ONLY
├──────────────────────────────────────────────────┤
│ ─ [EXECUTIVE] 2h ago · Bill X passed the House ──  │  actor-type tag · timestamp ·
│   Source: TheyVoteForYou → ─────────────────────   │  headline · working source link
│ ─ [FORECAST] 5h ago · Forecast opened: will Y      │
│   pass? → ───────────────────────────────────────  │
└──────────────────────────────────────────────────┘
No reactions. No "boosted" badge. No share-for-points. No Committees / ABS / RBA /
Treasury / Speeches / Source-corrections entries until each has a real pipeline.
```

---

## Community — deferred

No wireframe produced. Per `STICKEE_V1_PRODUCT_BLUEPRINT.md` §8, this feature is explicitly out of V1 scope pending a real lawyer's review and a built moderation queue — designing its screens now would imply a build decision this Council review does not make. If and when approved, its interaction model is specified in `CORE_PAGE_REDESIGN.md`'s Community section (a visible-status submit → review → accepted/declined lifecycle attached to existing objects) and should be wireframed at that time, not before.
