# Stickee — Civic Design System

Companion to `INFORMATION_ARCHITECTURE_AUDIT.md` (which covers content/route consolidation) — this document covers the orthogonal axis the IA audit didn't: **visual language** — typography, colour, spacing, cards, filters, metadata, motion. See `DESIGN_SYSTEM_MIGRATION_ROADMAP.md` for the phased plan to converge every page on it.

**Status (2026-08-05): Phase 0 approved, Phase 1 (tokens), Phase 2 (shared primitives), and Phase 3A (Home page) implemented.** See `DESIGN_SYSTEM_FOUNDATION_BATCH_REPORT.md` (Phases 1–2) and `DESIGN_SYSTEM_PHASE_3A_HOME_REPORT.md` (Phase 3A) for the full implementation reports. The rest of this document is the original audit + target spec; where the owner's Phase 0 decisions below diverge from a "recommend" in Parts 3–6 (accent colour, radius, "paper" framing), the Phase 0 decision is what shipped.

**Ground-truth correction (2026-08-05, Phase 3A):** the Executive Summary and §1.3 below describe the home page's `.simple-*` violations (shadow, gradient, pill radius, orange accent) as still live — they are **not**, as of Phase 3A. The home page no longer carries a page-scoped dialect at all; it's rebuilt on `PageShell`/`SectionHeader`/`ArticleCard`/`EmptyState`. It also no longer renders the fabricated National Civic Score or mock "recent decisions" the Product Direction/Truthfulness sections elsewhere in this repo flag as violations — both are now truthful empty states. `/impact` (§1.2) is unchanged and still fabricates the same score; that inconsistency between Home and `/impact` is now the more pressing open item (see the Phase 3A report's recommended next steps). Historical audit text below is left as-is for the record rather than rewritten in place.

## Phase 0 — approved creative direction (supersedes conflicting "recommend" language below)

Decided 2026-08-05, superseding Part 6's open questions:

- **Feel:** serious, academic, historically durable, futuristic, modern, highly structured, database-like but readable, calm, clean, consistent. Explicitly **not** retro/old-newspaper-reproduction, not Bloomberg Terminal, not government-bureaucracy, not crypto/gambling, not generic SaaS, not playful/gamified. Kalshi is a *design-quality* reference (hierarchy, density, polish) — not a visual-identity or trading-language reference.
- **Default theme:** light. Implemented — `ThemeProvider` now defaults to `"light"`; the old dark-trading-terminal default is gone. A real dark variant remains a future, separately-approved project (not built this batch).
- **Typography:** IBM Plex Serif for headings, IBM Plex Sans for body, IBM Plex Mono for metadata/dates/identifiers/tabular values only. Implemented via `next/font/google` in `layout.tsx`, bound to `--font-heading` in `globals.css`.
- **Accent:** one restrained cool civic accent — deep indigo `#2E3A8C` (`--civic-accent`), replacing the home page's orange `#d85f36`. Chosen as the specific value within the approved "deep indigo / muted blue / blue-black" direction; an implementation call, not re-litigated with the owner given the direction was already explicit.
- **Shape:** small modern corners, ~4–6px — implemented as `--radius: 0.375rem` (6px), superseding this document's Part 3.4 recommendation of 0–2px flat corners. No pill radii, no highly-rounded bubbly components.
- **Elevation:** borders and surface contrast first; shadows absent by default; a subtle elevation is permitted only for overlays (modal/popover/command palette) — implemented as `--shadow-overlay`, applied to `DialogContent` only.
- **Page identity:** one shared PageShell/PageHeader/SectionHeader/card/button/filter/empty-state/metadata vocabulary across every page — Phase 2 primitives below exist for exactly this; page-level adoption is Phase 3+.

## Executive summary

The app currently runs **four coexisting visual systems** on top of one route tree, verified by direct file audit (file:line citations throughout):

1. **System A — dark "Kalshi" trading system** (`globals.css:57-127`, `--background:#0a0a0b`, `--radius:0rem`). The default. Roughly 90% of pages (Decisions, Government, Parliament, Issues, Campaigns, People, Predictions, Leaderboard, Simulator, Impact, Profile, Notifications, Feed, Onboarding, Auth, Donate, Admin).
2. **System B — light "simple-\*" editorial system** (`globals.css:186-311`, `#faf9f4` background, `#17231c` text, `#d85f36` orange accent). Introduced in the most recent commit (`0a37481`), used only by the home page (`src/app/page.tsx`), `Navbar.tsx`, and `BottomNav.tsx`.
3. **System C — shadcn/Radix defaults leaking through unstyled** (`rounded-2xl`, `shadow-2xl`, `shadow-sm`). Shows up in `CommandPalette.tsx:210`, `issue/[id]/page.tsx`, `SupportModal.tsx`, `NominationModal.tsx` — none of these were themed to match either System A or B.
4. **System D — orphaned/abandoned code** with its own divergent styling: `src/components/FeedPost.tsx` (Tailwind named colours, not wired into the live `feed/page.tsx`) and `src/app/feed/page.tsx.bak`.

**The home page redesign — the app's newest, most deliberate work — itself fails 5 of the 6 constitution checks it should have satisfied**: it has box-shadows (`globals.css:218,245,272`), a radial gradient (`globals.css:205`), pill (`999px`) radii on every button/badge, an off-palette orange accent (`#d85f36`), and hover-lift transforms (`translateY`) — only "no gamification" passes. This means the design-system work is not "make every other page match the home page" — the home page needs correction too.

**Constitution compliance scorecard** (against `AGENTS.md` lines 94–148):

| Rule | Status | Evidence |
|---|---|---|
| Serif headlines | **0% compliant** | `grep -rn "font-serif" src` → zero hits, anywhere. Only `IBM_Plex_Sans` and `IBM_Plex_Mono` are loaded (`src/app/layout.tsx:2,15-23`) — no serif family exists in the app to use. |
| Monochrome only | **Violated pervasively** | 12+ distinct non-monochrome hex/named colours catalogued in circulation as *semantic* tokens: `#2ec266` green, `#f04747` red, `#f5a623` amber, `#3b82f6` blue, `#a855f7`/`#a78bfa` purple, `#7c8cff` blue-violet, `#f97316` orange, `#d85f36` orange (home accent), plus Tailwind named `emerald/amber/orange/red/blue/violet/zinc`, plus party colours `#E53935/#1565C0/#EC407A/#2E7D32` (`TwoHousesExplainer.tsx:111,119`). |
| Borders instead of shadows | **Violated widely** | Real drop-shadows: `MarketCard.tsx:275`, `FeaturedMarketCard.tsx:39`, `HouseChamber.tsx:224,352,583-609,688`, `SenateView.tsx:326,394,416`, `CommandPalette.tsx:210`, `.simple-score-card`/`.simple-issue-card:hover`/`.simple-forecast-card:hover` (`globals.css:218,245,272`), `SupportModal.tsx:415,424`, `NominationModal.tsx:342,355`. Additionally, `globals.css:148-164`'s own `.impact-*`/`.k-grade-*` classes fake a border using `box-shadow: inset 0 0 0 1px` — the banned property used to simulate the very thing it's banned in favour of. |
| No gradients | **Violated** | Live gradients: `PartyVotingGrid.tsx:179`, `.simple-hero` radial-gradient (`globals.css:205`), `RecommendationCard.tsx:21`, `BadgeDisplay.tsx:108-109` progress bar, `SimulateThisButton.tsx:31`. Legacy `.gradient-text`/`.hero-gradient`/`.glow-*` utilities are stubbed to no-ops (`globals.css:169-183`) but left in the codebase with a comment admitting they're "kept for compatibility" — the ban was applied to three CSS classes, not to the markup that actually paints gradients today. |
| No glassmorphism | **Borderline/violated** | `bg-card/80 backdrop-blur-sm` is a repeated pattern (`LeaderProfileDetail.tsx:135,141,148,154,176,192,199`, `issue/[id]/page.tsx:92,104,110,116,126`) — translucent, blurred panels are glassmorphism by definition. |
| No crypto/betting/gaming styling | **Most concentrated violation, on `/predictions`** | Cent-denominated pricing (`"{price}¢"`, `PredictionMarketGrid.tsx:224`), "Buy Yes at X¢ to bet on passage" tooltip copy, Shares/Payout/"Potential profit (%)" order-ticket math (`StakeModal.tsx:37-40,184-206`), ▲YES/▼NO glyphs, Won/Lost badges (`PortfolioPanel.tsx`), a literal scrolling stock ticker (`TickerBar.tsx:51-64`). The same green/red/amber "traffic-light everything" grammar leaks into `/simulator` (`OutcomeMatrix.tsx`) and `/impact` (`PillarCard.tsx`, `PillarGradeChip.tsx`). Separately, streak flames, badge locks/glow, daily-bonus claim banners, and "+N pts" referral chips appear on Profile, Notifications, Feed, Sign-in, Onboarding, and Share (`StreakBadge.tsx`, `StreakMilestone.tsx`, `BadgeDisplay.tsx`, `DailyBonusBanner.tsx`) — engagement-loop gamification, independently banned by the constitution's "another gaming platform" line. |
| Typography over colour, whitespace over decoration | **Violated** | Grade/impact/sentiment meaning is carried almost entirely by colour (traffic-light badges) rather than by label text or type weight, contrary to `AGENTS.md:126`'s explicit instruction. |

Full per-domain evidence is in Part 1. The rest of this document (Parts 2–6) defines the system every page should converge on, and the explicit ban list that follows directly from the audit.

---

## Part 1 — Current state, by domain (condensed from full audit)

### 1.1 Decisions / Government / Parliament / Issues / Campaigns
- `government/page.tsx` is a pure redirect to `/decisions` — no UI of its own.
- `DecisionCard.tsx`: dark card (`bg-card/80`, `rounded-2xl`), mixed border/shadow (`shadow-sm` at `:287`), inline pill Yes/No prediction buttons (`rounded-full`, `bg-emerald-500`/`bg-red-500`, `:233-248`).
- Parliament's chamber views (`HouseChamber.tsx`, `SenateView.tsx`) are the single heaviest shadow-users in the app (`shadow-xl`/`shadow-2xl` on containers and floating panels).
- `BillCampaignCard.tsx` implements a **3D coin-flip card** (`transform: rotateY(180deg)`, `:298,311`) — a game-app interaction pattern with no newspaper analogue.
- `issue/[id]/page.tsx` reads as a **third, distinct dialect** — generic shadcn `Badge`/`rounded-xl`/`backdrop-blur-sm` — different again from `IssuesPageClient.tsx`'s terse `font-mono` ledger rows (which use underline tabs, the one filter pattern in this domain that isn't a pill).
- `campaigns/page.tsx` is structurally the most constitution-compliant page found (flat borders, no radius, no shadow) but still uses `font-mono` exclusively (no serif) and emoji (🏛️📢🎯) as reward decoration.

### 1.2 People / Predictions / Simulator / Impact
- `/leaders`, `/mp/[id]`: underline-tab filters (on-brand), but `EndorsementPanel.tsx` Endorse/Concern buttons are `rounded-full` pills with `shadow-sm` (`:140-158`).
- `/leaderboard`: honest, undramatic empty state (`LeaderboardGrid.tsx:14-15`) — a genuinely good current pattern worth preserving in the new system.
- `/predictions`: see the crypto/betting scorecard row above — highest-density violation surface in the app. `probColor()`/`changeColor()` (`MarketCard.tsx:25-35`) plus `CATEGORY_COLORS` (`:18-23`) run a five-colour semantic system on every card.
- `/simulator`: structurally clean (borders only, no shadow/radius variance) **except** `OutcomeMatrix.tsx:51-52`'s winner glow (`boxShadow`) and `RecommendationCard.tsx:20-24`'s literal `linear-gradient` background — and it reuses the market-resolution visual grammar ("Best decision for the country" badge, `:35-38`) for a policy-simulation result, which risks implying a simulated outcome has market-verified certainty.
- `/impact`: `PillarCard.tsx` and `PillarGradeChip.tsx` **duplicate the same grade→colour logic in two separate files** — a maintainability problem as well as a design one. `WeeklyReportCard.tsx` (streak, points, percentile rank, trophy emoji) is the clearest single gamification violation in the app.

### 1.3 Home / Account / Feed / Chrome
- Home page (`page.tsx` + `.simple-*`): see executive summary — fails shadow, gradient, pill-radius, monochrome, and hover-lift checks.
- `Navbar.tsx` now renders `.simple-nav` (light), but its nested `AuthButton.tsx` still emits dark-system classes that resolve to dark-token grey/red inside the warm-white bar (`Navbar.tsx:5,78`, unread badge hardcoded `#f04747` at `:71`) — the chrome itself is visibly split mid-component.
- `CommandPalette.tsx:210` is a dark, `shadow-2xl`, shadcn-styled modal that opens **over** the light navbar — three systems visible on screen at once.
- `profile/page.tsx`, `notifications/page.tsx`, `feed/page.tsx`, `sign-in/page.tsx` and siblings: dark system throughout, large `font-mono` hero numerals (`clamp(40px,8vw,56px)` pattern repeated near-identically across Decisions/Issues/Leaders/Notifications/Feed — one of the few *consistent* patterns found, worth keeping as a canonical "stat header" component rather than five independent implementations).
- `FeedPost.tsx` is dead code with its own colour system, not imported anywhere live — should be deleted, not migrated.
- Admin (`admin/layout.tsx`, `admin/page.tsx`): same dark system as the rest of the app, applied to metric-dashboard idioms (`ArrowUpRight`/`ArrowDownRight` deltas). Internal-only; lowest migration priority (see roadmap), but should still land on the same token system so it isn't a fifth dialect.

---

## Part 2 — Design principles

These operationalise `AGENTS.md`'s design philosophy into rules a component can actually be checked against.

1. **Paper, not screen.** The default surface is warm white, read in daylight, not a dark trading terminal read at night. If a dark theme is offered at all (see Part 6, owner decision), it must use the same monochrome vocabulary, not a different one.
2. **Type carries meaning; colour is the exception, not the system.** Status, grade, and category are communicated first through label text and weight ("PASSED", "IN DEBATE" — small caps, bold) and only secondarily reinforced with a single, restrained ink tint. No card should be legible-by-colour-alone.
3. **Borders are structure. Shadows do not exist.** Every card, panel, and modal is bounded by a 1px hairline border. No `box-shadow` of any kind — not for elevation, not for a fake inset border, not for a hover glow.
4. **One semantic palette, three states.** Wherever a traffic-light judgement is genuinely needed (a vote outcome, a resolution result), it is expressed with exactly three restrained inks — not the five-to-eight hues currently in circulation — and always paired with a text label, never colour alone.
5. **Every card is an article, not a widget.** A card reads top-to-bottom like a clipping: kicker/category → headline → dek/summary → byline-style metadata. It does not read like a dashboard tile (big number, sparkline, coloured pill, buy button).
6. **No number implies more confidence than the evidence behind it.** Probabilities, scores, and grades never appear without either a source/methodology line nearby or an explicit "demo" label — a design rule that directly enforces `AGENTS.md`'s truthfulness section.
7. **Motion is calm.** Colour and opacity transitions only. No lift-on-hover, no scale, no spring easing, no scrolling tickers, no confetti/toast celebrations for routine actions.
8. **One shape language.** Flat corners (0–4px) throughout. No pill (`999px`) badges, buttons, or filter chips anywhere in the product-facing app.

---

## Part 3 — Foundation tokens

**Implemented 2026-08-05 in `src/app/globals.css`** with the Phase 0 accent/radius decisions above overriding this Part's original recommendations (masthead red/forest green accent, 0–2px radius). Token names differ slightly from the table below (`--paper`, `--ink`, `--civic-accent`, `--status-positive/negative/pending` map onto the same shadcn `--background`/`--foreground`/`--accent`/`--destructive` variables every existing component already reads, so the whole app repaints without component-level changes). See `DESIGN_SYSTEM_FOUNDATION_BATCH_REPORT.md` for the exact before/after token sheet.

### 3.1 Colour

A single palette, used identically whether the page happens to be "light mode" or the optional dark variant (Part 6 decision pending):

| Token | Light value | Dark value (optional variant) | Use |
|---|---|---|---|
| `--paper` | `#FAF9F4` (warm white) | `#0F0F0E` | Page background |
| `--paper-raised` | `#FFFFFF` | `#171716` | Card/panel background |
| `--ink` | `#17231C`-equivalent neutral, e.g. `#1A1A18` | `#EDEDE9` | Primary text, headlines |
| `--ink-muted` | `#5C5C57` | `#9C9C96` | Secondary text, metadata, captions |
| `--ink-faint` | `#8A8A84` | `#6C6C66` | Timestamps, disabled state |
| `--line` | `#D9D9D2` | `#2A2A28` | Hairline borders, dividers |
| `--line-strong` | `#B8B8AF` | `#3E3E3A` | Emphasis borders (active tab underline, table header rule) |
| `--accent` | one restrained ink, e.g. deep masthead red `#7A1F1F` or forest `#1F3B2C` — **not** `#d85f36` | same, or omitted entirely in dark | The single sanctioned non-neutral colour. Used only for: the masthead mark, an active-state underline, and a "breaking/urgent" indicator. Never for data/status. |
| `--status-positive` | `#1F5E3C` (deep, desaturated green) | `#4FA37A` | Passed / Yes / on-track — text colour only, never background fill |
| `--status-negative` | `#7A2020` (deep, desaturated red) | `#C4726F` | Failed / No / off-track — text colour only |
| `--status-pending` | `#5C5C57` (same as `--ink-muted`) | `#9C9C96` | In-progress / undecided — deliberately *not* amber; pending is "more text," not "a third bright colour" |

This collapses the current 12+ hue system to **one accent + three deliberately desaturated status inks**, satisfies "warm white/grey/charcoal/black," and removes amber, blue, purple, and orange from circulation entirely except as the single `--accent`.

### 3.2 Typography

- **Headlines:** a serif family, loaded via `next/font/google` alongside the existing Plex faces — recommend **IBM Plex Serif**, since Plex Sans and Plex Mono are already loaded (`layout.tsx:2`) and Plex Serif shares their metrics and licensing, so this is a zero-new-dependency, zero-brand-risk addition. Bind it to `--font-heading` in `globals.css:12`, which **already exists as a token** but is currently aliased to `var(--font-sans)` — this is a one-line fix once the font is loaded.
- **Body:** IBM Plex Sans (already loaded) — no change needed.
- **Metadata/mono accents (dates, byline labels, tabular numbers):** IBM Plex Mono (already loaded) — this is the one place the current app's mono-heavy styling is directionally correct and should be kept, narrowed to true metadata use rather than headlines.
- **Type scale** (replacing the current mix of `clamp()` one-offs, arbitrary `text-[9px]`, and inconsistent `text-2xl`/`text-3xl` usage):

| Role | Size / weight | Notes |
|---|---|---|
| Masthead / page hero number | `clamp(40px, 6vw, 64px)`, serif, weight 600 | Canonicalises the `clamp(36–56px)` pattern already repeated near-identically across 5+ pages — make it one component, not five inline styles. |
| H1 (page title) | 32px / serif / 600 | |
| H2 (section) | 22px / serif / 600 | |
| H3 (card headline) | 17px / serif / 600 | Replaces `.decision-title`'s current sans `font-bold` (`globals.css:143`). |
| Body | 15px / sans / 400, 1.6 line-height | |
| Byline / metadata | 12px / mono / 500, uppercase, tracking 0.04em | Canonicalises the existing `font-mono text-[9-11px] tracking-widest uppercase` pattern already used everywhere — just standardised to one size instead of 9/10/11px variants. |
| Micro-label (kicker, category tag) | 11px / mono / 600, uppercase | |

### 3.3 Spacing & grid

- **Container:** `max-w-5xl` is already the dominant pattern (31 files) — keep it as the canonical content width; standardise the few outliers (`max-w-6xl` on Predictions) unless a page genuinely needs the wider grid for a data table.
- **Spacing scale:** 4px base unit, used in the existing Tailwind steps already present (`p-3`/`p-4`/`p-5`/`p-6`, `gap-4`/`gap-6`, `py-10` section rhythm) — no new scale needed, just consistent application instead of the current per-component drift.
- **Vertical rhythm:** every page section separated by a hairline `border-b` + fixed padding (`py-10` header pattern already used on Decisions/Parliament/Leaders/Impact) — extend this to every page rather than the current subset.

### 3.4 Border, radius, elevation

- **Radius:** `0px` default (cards, panels, inputs), `2px` maximum for small inline elements (badges, buttons) — never `999px`/pill, never `rounded-2xl`/`3xl`. This matches the dark system's existing `--radius: 0rem` token (`globals.css:82`) — System A already got this right at the token level; the violations are all in components that ignored the token and hardcoded `rounded-xl`/`rounded-2xl`/`rounded-full` directly.
- **Elevation:** none. `box-shadow` is removed from the palette entirely — including the `inset 0 0 0 1px` fake-border pattern currently in `.impact-*`/`.k-grade-*` (`globals.css:148-164`), which should become a real `border` declaration instead.
- **Dividers over containers:** prefer a `border-b` row divider (as `IssuesPageClient.tsx` already does) over a bordered card-in-a-card wherever a list is being rendered — this is closer to a printed index/register than nested widget panels.

### 3.5 Motion

- Transitions limited to `color`, `background-color`, `border-color`, `opacity` — 150–200ms, ease-out.
- No `transform`, no `translateY`, no `scale`, no spring physics, no scrolling marquee/ticker, no toast/confetti celebration for routine actions (claiming a bonus, posting a comment). A milestone (e.g. an account anniversary) may get a single, quiet, dismissable text banner — not an animated badge unlock.

---

## Part 4 — Component patterns

**Card (the canonical "article" pattern).** Flat `--paper-raised` background, single 1px `--line` border, no radius beyond 2px, internal padding 20–24px. Content order: micro-label/category (mono, uppercase) → serif headline → 1–2 line sans dek → byline metadata row → optional action row, visually de-emphasised (smaller, muted) relative to the content above it — directly implementing the Product Pattern Library's already-recommended "progressive disclosure" fix for `DecisionCard`'s five-things-at-once problem.

**Status/classification tag.** Text label first, colour second: `PASSED` in `--status-positive` text on transparent/`--paper` background with a `--line` border — never a filled colour pill. Replaces every current `.impact-*`/`.k-grade-*`/`gradeStyle()` implementation (there are at least three independent copies of grade→colour logic today: `PillarCard.tsx`, `PillarGradeChip.tsx`, `globals.css` — this should become one shared component).

**Filter.** Underline tabs only (`border-b-2`, active state = `--line-strong` underline + `--ink` text, inactive = `--ink-muted` text) — never a pill/segmented control with a sliding shadowed thumb (`ChamberToggle.tsx`'s current pattern is explicitly out). `IssuesPageClient.tsx`'s existing underline tabs are the correct reference implementation already in the codebase.

**Metadata line.** One consistent byline format across the whole app: `SOURCE · DATE · RETRIEVED` in mono/uppercase/muted — directly supporting the constitution's citation requirements and the Product Pattern Library's "citation-first claim presentation" pattern (already logged as `Under review`).

**Data/forecast display.** A probability or score is never the largest, boldest element on a card without a methodology/source line directly beneath it (see Principle 6). No ¢-denominated pricing, no "shares," no "payout," no buy/sell button labels, no ticker. A forecast card reads: question (serif headline) → current view (percentage, plain numeral, not oversized) → "N participants · resolves [date] · [demo/live] · methodology" (mono metadata line) → evidence links. This directly implements the Product Pattern Library's already-logged "Question-centric forecast page" and "Transparent resolution criteria" patterns.

**Buttons.** Two variants only: filled (`--ink` background, `--paper` text) for the primary action, outlined (1px `--line` border, transparent background) for everything else. Flat corners, no shadow, no hover-lift — background/opacity shift only.

**Navigation chrome.** One system for `Navbar`, `BottomNav`, and `CommandPalette` — currently three (light `.simple-nav`, dark `AuthButton`, dark shadcn `CommandPalette`) rendering simultaneously. The palette/modal must be re-themed onto the same paper/ink tokens as the nav bar it opens from.

**Icons.** Keep `lucide-react` (already the sole icon library — a genuine consistency win worth preserving), but drop emoji-as-UI (🏛️📢🎯🔥🏆🎉) entirely — these currently appear on Campaigns, Streak components, Sign-in referral copy, and WeeklyReportCard, and read as consumer-app decoration rather than editorial iconography.

---

## Part 5 — Explicit ban list

Derived directly from audit findings — each of these has at least one confirmed live instance today:

- `box-shadow` in any form, including the `inset 0 0 0 1px` fake-border pattern.
- `border-radius` beyond 2px on any card, panel, button, or badge; `rounded-full` on anything except a genuine avatar photo.
- `linear-gradient`/`radial-gradient` backgrounds, including "neutered" utility classes still present in `globals.css:169-183`.
- `translateY`/`scale`/spring-eased hover transforms.
- `backdrop-blur` / translucent (`/80`, `/60`) panel backgrounds.
- Cent-denominated pricing, "shares," "payout," "profit," "buy/sell," ticker-style scrolling data.
- Streak flames, badge unlock/glow effects, daily-claim banners, point-bonus chips, percentile-rank leaderboarding language, celebratory toasts, and emoji-as-status-icon.
- Any hue outside the Part 3.1 palette (amber, orange, blue, purple, and all Tailwind named colours currently in use) as a semantic or decorative colour.
- 3D/flip-card transforms (`BillCampaignCard.tsx`'s current coin-flip).

---

## Part 6 — Open owner decisions

**Resolved 2026-08-05** — decisions 1–3 below were settled by the Phase 0 approval at the top of this document (light default, deep indigo `#2E3A8C` accent, IBM Plex Serif). Decisions 4–5 remain open and are unaffected by the Phase 1/2 batch (neither touches `/predictions` copy or route consolidation). Original text preserved below for the record:

1. **Default theme: light (paper) vs. the current dark default.** The constitution's language ("warm white," "printable," "newspaper") describes a light theme; the app currently defaults to dark everywhere except the new home page. Recommend flipping the default to light, with dark offered only as an optional, equally-monochrome variant (tokens for both are specified in Part 3.1) — but this is the single biggest visual identity change in this document and should be an explicit decision, not an inferred one.
2. **The `--accent` colour itself.** Part 3.1 proposes one restrained non-neutral ink (masthead red or forest green) replacing the home page's `#d85f36` orange. An alternative is zero accent colour at all — pure monochrome, with the masthead mark carried by typography alone. Recommend deciding this before Phase 1 token work, since it's referenced by the navbar mark, active-tab state, and "urgent" indicators.
3. **Serif font choice.** IBM Plex Serif is recommended (Part 3.2) for zero added dependency/licensing risk, but this is a genuine brand decision worth a deliberate look at a couple of alternatives (e.g. a text-heavy option like Source Serif 4) before committing.
4. **Betting-grammar rewrite on `/predictions`.** Removing "shares/payout/profit/¢" language is a copy change to a live financial-equivalent feature, not just a style change — per `AGENTS.md`'s Council governance, this should go through Product Strategist + Legal Advisor review (the same gate `PAGE_REFACTOR_ROADMAP.md`'s Batch 5 already flags for this surface) before wording ships, even though the visual-token part of the change is comparatively low-risk.
5. **Relationship to the pending IA/route consolidation.** This design system is orthogonal to `PAGE_REFACTOR_ROADMAP.md`'s route-merge work (Issues/Decisions merging, People consolidation, etc.) — they can proceed in parallel. Recommend applying the new token/component layer to pages *as they're touched* by either track, rather than doing a full second pass later; see `DESIGN_SYSTEM_MIGRATION_ROADMAP.md` for exact sequencing.

Per `docs/STICKEE_COUNCIL.md`'s review-level guidance, a change of this scope (every page's visual language) is a **Level 3 — major architectural decision**, warranting a full Council review (or at minimum UX Researcher + Product Strategist + Software Architect + Editorial Advisor, matching the "Homepage"/"Navigation" release gates) before Phase 1 of the migration begins.
