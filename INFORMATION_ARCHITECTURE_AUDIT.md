# Stickee — Information Architecture Audit

Read-only. No code, navigation, or routes modified. Companion to `PAGE_AND_ROUTE_INVENTORY.md` (full per-route detail) — this document is the analysis and recommendation layer built on top of it.

## Executive summary

Stickee's constitution states the product should feel like "Australia's political newspaper… civic-intelligence platform… trusted forecasting platform" and explicitly *not* "another betting site… social network… SaaS dashboard." The current route tree contradicts that identity in practice, not because any one page is badly built, but because **the app currently behaves like four separate products sharing a navbar**: an editorial/civic-data product (Issues, Decisions, Parliament, Impact), a prediction-market product (Predictions, Leaderboard, wallet), a social-network product (Feed, Profile, `/u/[handle]`, follows/reactions/comments), and an advocacy product (Campaigns, `CampaignModal`). Each was built as a complete, self-contained mini-app with its own list page, its own filters, its own "email your MP"/"prediction"/"simulate" affordance, and — critically — its own data model. The result: **the same underlying concept (a bill, a politician, a civic score) can exist as three or four differently-shaped, non-cross-linked objects**, and a first-time user has no way to know that `/issues` and `/decisions` are not the same thing, that `/leaders` is mostly not about "leaders," or that clicking "Predict Outcome" on a decision card does nothing.

None of this is a data or security problem (those were covered in prior audits). It is a **product-surface-area problem**: too many top-level concepts, several of them thin or partially non-functional, competing for the same "what should I click first" moment. The fix is not new features — it's consolidation around one canonical detail page per real-world object (a bill/issue, a person, a market, a decision), and a navigation structure that reflects Stickee's actual editorial identity rather than the order features happened to be built in.

## Major confusion points (ranked)

1. **Two "campaign" systems that don't know about each other.** `/campaigns` is a static page with a fake local-only "join" button; the *real*, API-connected campaign action sheet (`CampaignModal`, posts to `/api/bills/[billId]/pressure`) is only reachable from `/parliament`. A user who joins a campaign on `/campaigns` has done nothing; a user who never visits `/parliament` will never find the real one.
2. **`/issues` and `/decisions` are the same UX pattern over two disconnected data models**, and `/government` is a bare redirect to `/decisions` that exists as a third name for the same idea. Decisions have no detail page and most of their card's buttons are decorative.
3. **Four unrelated "person" systems** (`/mp/[id]` for real MPs, `/leaders/[id]` for community-nominated leaders, `/u/[handle]` for citizen "civic voices," and a disconnected 5-politician mock block embedded only inside `/leaders`) — with zero code paths connecting any of them, and `/leaders`' own MP table not even linking to `/mp/[id]`.
4. **`/predictions` (titled "Markets") is five products in one page**: a market board, a personal wallet/portfolio dashboard, a leaderboard (duplicating `/leaderboard`'s exact data), a live-election tracker (with no other home), and a fake proposal-submission form.
5. **Two wallet systems and two "leaderboard" surfaces with no shared source of truth** — `usePredictionWallet` (real, Supabase) vs `useWallet` (`localStorage`); the same user can see two different point balances depending which page they're on.
6. **Navigation itself is internally inconsistent** — three separate nav registries (desktop Navbar, mobile BottomNav, ⌘K Command Palette) use different labels for the same destinations, and the Command Palette's own "Decisions" entry points at `/government`, not `/decisions`. See Navigation audit below.
7. **The home page links to content that doesn't resolve.** The pillar grid links use a different id namespace than `/issue/[id]` expects (mock-fallback state); "recent decisions" all link to the same generic `/decisions` URL since decisions have no detail page.
8. **Two unrelated onboarding experiences** (a global first-visit modal with a real Supabase write, and a static informational `/onboarding` page) connected by exactly one link.
9. **A hardcoded `isLoggedIn: true` on `/profile`** means every visitor, signed in or not, sees a fake "logged in" personal dashboard — a genuine trust problem on a platform whose constitution demands never presenting demo content as real.
10. **No legal pages exist** (no privacy policy, terms, or about page) despite a fully-built, globally-mounted cookie-consent banner that links to none of them.

## Overlapping products (structural map)

| Concept | Systems currently implementing it | Canonical today? |
|---|---|---|
| "A bill/issue government is deciding on" | `/issues` (Supabase+mock), `/decisions` (100% mock), `/parliament`'s bill feed (Supabase+mock, different components) | No — three separate lists, three shapes |
| "A person in politics" | `/mp/[id]` (real MPs), `/leaders`'s MP table (same real MPs, no links out), `/leaders`'s "featured politicians" block (same 5 real MPs again, third id scheme), `/leaders/[id]` (fictional nominated leaders), `/u/[handle]` (fictional citizens) | No — five representations, zero cross-links |
| "Will X happen — crowd forecast" | `/predictions` market board, `/issue/[id]`'s embedded prediction-market widget, `/issue/[id]`'s separate pass/fail poll, `/decisions`' inline (non-functional) poll, `/parliament`'s per-bill MP-vote "predict" toggle | No — five differently-wired prediction affordances |
| "Take civic action" | `/campaigns` (fake), `CampaignModal` (real, `/parliament`-only), Email-MP flows (on `/issues`, `/issue/[id]`, `/parliament`, each its own modal instance) | No — real and fake action systems coexist unlabeled |
| "How is Australia doing" (civic score) | `/` (home summary), `/impact` (deep dive), `/profile`'s Score tab | Partially — `/` and `/impact` are a deliberate pair; `/profile`'s is a third, disconnected mock copy |
| "My points/rank" | `usePredictionWallet` (real, `/predictions` only), `useWallet` (`localStorage`, `/leaderboard`/`/profile`/`DailyBonusBanner`) | No — two unsynced systems |
| "What's new" | `/feed`, home page's "recent decisions," `/notifications` | No — three separate, non-cross-linked activity streams |

## Navigation audit

### Current state (as implemented, read from source)

**Desktop `Navbar`** (`src/components/Navbar.tsx`): logo → `/`, then **Issues · Decisions · People · Simulator**; right side: Support (`/donate`), notifications bell, auth button.

**Mobile `BottomNav`** (`src/components/BottomNav.tsx`): **Home · Issues · Decisions · People · "Test"** — note the last item links to `/simulator` but is labeled "Test," not "Simulator," diverging from the desktop nav's own label for the identical destination.

**⌘K Command Palette** (`src/components/CommandPalette.tsx`): a *fourth* navigation surface, with its own independent list: Dashboard (`/`), Feed (`/feed`), Parliament (`/parliament`), **"Decisions" → `/government`** (not `/decisions`), "Issues & Bills" (`/issues`), Campaigns (`/campaigns`), Predictions (`/predictions`), Leaderboard (`/leaderboard`), Notifications, My Profile — plus every bill, every MP, every campaign, and every civic-voice profile as searchable entries.

**Admin sidebar** (`src/app/admin/layout.tsx`): Overview · Users · Activity · Agents · Markets · Analytics — internally consistent, not part of this audit's confusion findings.

**No footer navigation exists** in the root layout.

### Findings

- **Inconsistent labels for the same destination:** "Simulator" (desktop) vs "Test" (mobile) for `/simulator`; "Decisions" (Command Palette, but pointed at `/government`) vs "Decisions" (Navbar, correctly pointed at `/decisions`) — two different destinations sharing one label in two different nav surfaces.
- **Duplicate destinations, different names:** `/government` and `/decisions` are the same page (a redirect) but are labeled as if they were different things in the Command Palette vs. Navbar.
- **Routes absent from primary nav entirely, reachable only via the Command Palette, a card link, or a direct URL:** Parliament, Predictions, Campaigns, Feed, Leaderboard, Impact, Donate. Of these, **Parliament and Predictions are two of the most functionally complete surfaces in the app** and are not reachable from either the desktop or mobile primary navigation at all — only via ⌘K or a link buried inside another page.
- **Routes too prominent relative to their maturity:** Simulator holds a full primary-nav slot (desktop and mobile) despite having no independent identity of its own — every real entry point into it is "simulate *this specific thing*" from another page.
- **Orphaned/hard-to-discover routes:** `/impact` (no nav entry anywhere, including the Command Palette — only reachable via a link on `/` or direct URL), `/leaderboard` (Command Palette only), `/u/[handle]` (feed post authors or Command Palette only), `/onboarding` (one link from inside the first-visit modal, plus its 3 in-page cards).
- **Links that send users into an unexpectedly different product:** "Predict Outcome" on `/decisions` cards does nothing (dead code); the pillar-grid links on `/` can fail to resolve; `/leaders`' MP rows look clickable but only scroll to a chamber visualisation instead of navigating.

### Recommended navigation options

**Option A — Editorial-first**

| Nav item | Destination | What moves under it |
|---|---|---|
| Today | `/` | Home briefing, recent alerts summary |
| Issues | `/issues` | Issues + Decisions (merged), Parliament's bill feed |
| Government | `/government/*` | Parliament chamber/MP votes, People (MPs) |
| Forecasts | `/forecasts` | Predictions/Markets, Leaderboard (once real) |
| About | `/about` | Mission, methodology, legal (net-new content required) |

- *Strengths:* Matches the constitution's "newspaper" framing most directly; five clear, editorially-named sections; forces Simulator/Campaigns/Feed to justify their place as sub-sections rather than top-level competitors.
- *Weaknesses:* "Government" as a nav label risks reading as literally "the government's own site" rather than "Stickee's coverage of government"; People isn't visible as its own top-level concept, which undersells a real, working feature (MP profiles); requires writing genuinely new About/methodology content that doesn't exist today.

**Option B — Civic intelligence**

| Nav item | Destination | What moves under it |
|---|---|---|
| Overview | `/` | Home briefing |
| Issues | `/issues` | Issues + Decisions (merged) |
| Decisions | *(folds into Issues — see below)* | — |
| Parliament | `/government/parliament` | Chamber, bill votes, campaign actions |
| People | `/people` | MPs + community leaders (clearly split within the page) |

- *Strengths:* Closest to the current desktop Navbar (low relabeling cost), keeps Parliament and People visible as their own destinations (both are genuinely strong, underexposed surfaces today), avoids inventing a new top-level "Government" umbrella term.
- *Weaknesses:* The brief's own example keeps "Decisions" as a separate top-level item from "Issues," but this audit's findings say they should merge (same UX pattern, disconnected data, no detail page for decisions) — so a literal Option B has one redundant slot; five items doesn't leave room for Forecasts, which is one of the app's most real, functional features, at the top level at all.

**Option C — Hybrid (recommended)**

| Nav item | Destination | What moves under it |
|---|---|---|
| Today | `/` | Home briefing (fixes broken links, labels mock data) |
| Issues | `/issues` | Issues + Decisions (merged), links out to Parliament for evidence |
| Government | `/government/*` | Parliament (chamber, votes, real campaign actions), People (MPs + community leaders) |
| Forecasts | `/forecasts` | Predictions/Markets (slimmed — wallet/leaderboard move to Account), Simulator (contextual, not top-level) |
| Support | `/donate` (or `/about` if legal content is prioritized first) | Donations; secondary link to About/legal once written |

- *Strengths:* Fixes the two most damaging redundancies (Issues/Decisions, Parliament's bill list) without inventing unfamiliar terminology; keeps every currently-real, currently-functional surface (Parliament, People, Forecasts) visible in primary nav for the first time; caps at 5 items as required; "Government" reads as "Stickee's Government section" in context next to "Issues"/"Forecasts," avoiding Option A's ambiguity.
- *Weaknesses:* Still requires the Issues/Decisions merge and the People/MP-linking fixes to be true before the nav label makes sense — this is a navigation *plan*, not something to ship before the underlying consolidation (see `PAGE_REFACTOR_ROADMAP.md`).
- **Recommendation: Option C.** It requires the least invented terminology, preserves the most real functionality at top-level visibility, and directly resolves the highest-ranked confusion points found in this audit. Do not implement it yet — see roadmap.

## Domain-by-domain findings

For each domain: what belongs, what doesn't, who else duplicates it, should it stay top-level, one-sentence purpose.

**1. Home / Today** — Belongs: national snapshot, 2–3 clear next actions. Doesn't belong: a fully separate "recent decisions" data pull if Decisions merges into Issues (should pull from the same unified source). Duplicated by: `/impact` (deliberately, acceptable). Top-level: yes, always. Purpose: *"Tell a first-time visitor what changed and where to go next, in one screen."*

**2. Issues** — Belongs: bills, broad issues, and decisions (merged into one list with a type filter), each with one canonical detail page. Doesn't belong: an embedded live trading widget or a full MP-vote table (link out instead). Duplicated by: `/decisions`, `/parliament`'s bill feed. Top-level: yes. Purpose: *"What is government considering or has decided, and what does it mean?"*

**3. Decisions** — As a *concept* (proposed/in-debate/passed/implemented outcomes), belongs inside Issues as a status/type, not a separate product. Doesn't belong: its own disconnected data model and route. Duplicated by: `/issues`. Top-level: no, should not remain one. Purpose (as a merged concept): *"What was actually decided, and when."*

**4. Parliament** — Belongs: chamber composition, real MP votes, the real bill-pressure campaign system. Doesn't belong: its own separate bill *list* UI competing with Issues (link to Issues instead). Duplicated by: `/issues` (bill list). Top-level: yes, as the "evidence" section. Purpose: *"Show the parliamentary record behind the issues Stickee covers."*

**5. People** — Belongs: real MP profiles (with real vote data finally wired in) and community-nominated leaders, clearly separated within one section. Doesn't belong: a disconnected mock "featured politicians" block, ordinary-citizen social profiles. Duplicated by: `/mp/[id]`, `/leaders`, `/leaders/[id]` all partially overlapping today. Top-level: yes. Purpose: *"Who represents you, and who else is stepping up."*

**6. Elections** — Belongs: live AEC tracking (currently a widget with no home) as its own moment-in-time surface during an active election, otherwise dormant/hidden. Doesn't belong: being permanently embedded on the Markets/Forecasts page regardless of relevance. Duplicated by: nothing else. Top-level: no — contextual/seasonal, not a permanent nav slot. Purpose: *"Show real-time results when an election is actually happening."*

**7. Markets / Predictions (→ Forecasts)** — Belongs: the market board, featured market, staking. Doesn't belong: wallet/portfolio management (Account), leaderboard (Account/Forecasts tab, not duplicated data), proposal submission (needs a real backend or removal), election pulse (own contextual surface). Duplicated by: `/leaderboard` (leaderboard), nothing (no per-market detail page exists to duplicate — a gap, not an overlap). Top-level: yes, slimmed. Purpose: *"What does the crowd expect to happen, and how confident are they?"*

**8. Simulator** — Belongs: as a contextual "what-if" action on any issue/decision/person/market page. Doesn't belong: a standalone top-level nav slot with no object of its own. Duplicated by: nothing (single engine, many entry points — this is good design, just miscategorized as top-level). Top-level: no. Purpose: *"Let me test a different choice and see the modeled consequence."*

**9. Campaigns / Civic action** — Belongs: the real, API-connected bill-pressure action system (currently trapped inside `/parliament`). Doesn't belong: a second, fake, disconnected "campaigns" list. Duplicated by: `CampaignModal`. Top-level: no — an action embedded from Issues/Parliament, not a separate destination, unless/until it has its own real, independent campaigns backend. Purpose: *"Turn my opinion on an issue into a real, counted action."*

**10. Feed / Community** — Belongs: a ranked stream of real civic alerts (bill status changes, vote outcomes, MP score changes) — the agent-generated content is legitimate and valuable. Doesn't belong at this stage: heavy social-network UI (follows, reaction counts, "Community" framing) built around a content base that's mostly not human yet. Duplicated by: home page's "recent decisions" and `/notifications` are separate, unlinked activity streams covering overlapping ground. Top-level: debatable — see Feed/Community questions below. Purpose: *"Show me what just happened, sourced and dated."*

**11. Personalisation / Profile (→ Account)** — Belongs: real auth-gated preferences, real notification settings, real (if any) civic activity. Doesn't belong: a hardcoded fake "logged in" state, five tabs of mostly-mock content. Duplicated by: nothing structurally, but its wallet/streak/badge systems duplicate `/leaderboard`'s. Top-level: not primary nav, but always reachable (auth button). Purpose: *"My real settings and my real activity — nothing invented."*

**12. Notifications** — Belongs: real, per-user alerts. Doesn't belong: a hardcoded demo array that silently replaces the true empty state. Duplicated by: nothing structurally (icon-only nav entry, appropriate). Top-level: icon in the header, not a full nav slot — current placement is fine. Purpose: *"What do I personally need to know or act on."*

**13. Support / Donations** — Belongs: the real Stripe flow and its three pages. Doesn't belong: nothing found — this domain is clean. Duplicated by: nothing. Top-level: secondary (a header link, as today, is proportionate). Purpose: *"Help keep Stickee running."*

**14. Administration** — Belongs: everything currently there; internal-only. Not part of the public IA problem. Top-level: N/A (gated). Purpose: *"Operate Stickee safely."*

**15. Authentication and legal pages** — Auth pages are structurally sound and belong exactly where they are. Legal pages **do not exist** and are an owner-review gap, not an IA recommendation this audit can resolve (requires real policy content, not a route move).

## Answers to the specific product questions

**Issues.** `/issues` is a hybrid — it lists both narrow "bills" (Supabase `issues`/`issue_markets`, MP-vote-trackable) and would-be "broad issues" conceptually, but in practice every item in the current mock/DB data is a bill-shaped object; there is no genuinely distinct "broad issue" content type in the code today. Recommendation: don't invent a second content type that doesn't exist yet — instead, absorb `/decisions`' "decision" concept (proposed/in-debate/passed/implemented, spanning federal/state/local, not always bill-shaped) into the same unified list as a second content type/filter, since decisions are exactly the "broader than a single bill" content Issues currently lacks. An issue page should contain: context, real evidence (vote record via link, not embed), one real prediction affordance (not two), and a real action (email MP). The prediction-market widget and the MP-vote grid should become links to dedicated pages, not embedded tools — yes, the issue page should be one editorial page, not a multi-tab mini-application.

**Decisions.** In the current code, "decision," "bill," "policy," and "announcement" are not actually distinct types — `/decisions`' `Decision` object and `/issues`' `Issue` object are structurally almost the same shape (title, summary, status, level/impact) built by two different people at two different times, not two deliberately different concepts. "Implementation" as a distinct stage exists only as one value in Decision's status timeline (`Implemented`), not a separate object. Yes, these are being mixed together in the sense that the same real-world thing ("Housing Australia Future Fund," e.g.) could plausibly appear as both an Issue and a Decision with different ids and no link between them. Decisions should get individual detail pages once merged into Issues — right now they have none. Public agreement voting (the inline Yes/No poll on decision cards) should be **removed or merged** with the one real, Supabase-backed poll pattern already proven on `/issue/[id]` — not run as a third, non-functional variant. "Predict Outcome" should link to a real market on the merged Issues/Forecasts pages rather than faking market behavior inline (today it does neither reliably — the button has no handler at all).

**Parliament.** Parliament is standalone-strong evidence, not a competing product — its chamber data, real MP votes, and real campaign-action API are exactly the kind of primary-source material a "civic intelligence platform" should be built on. Chamber views, bill status, divisions, and MP votes should live under one Parliament section (mostly true today, except the bill *list* duplicates Issues). Parliament information that belongs on issue/decision/person pages only as *linked* related context: individual MP vote records (link from an issue to "how MPs voted," don't re-render the whole grid), bill-pressure counts (show a summary number on the issue, link to the full campaign action on Parliament).

**People.** "People," "Leaders," and "MPs" should use one consistent name and one consistent entry point (`/people`), with elected representatives and community-nominated/aspiring leaders kept as two clearly labeled groups *within* that one section — not blended (today they're accidentally blended on `/leaders`, where the page name and its dominant content — an MP table — don't match, and the actual "leaders" concept is a small section at the bottom). They should remain conceptually separate products under one roof, the way a newspaper's "Politicians" and "Ones to Watch" sections would be separate features on one People page, not two different apps.

**Markets / Predictions.** Recommend **"Forecasts."** It describes the same crowd-probability mechanic without betting connotations ("markets," "stake," "odds") that the constitution explicitly wants to avoid, while remaining more concrete than the vaguer "Predictions" (which reads as a single guess, not an aggregated crowd signal). Wallet, leaderboard, proposal form, and election pulse should **not** remain on the same page — wallet/portfolio belongs in Account (it's "my money," not "the market"), leaderboard belongs in Account or nowhere until real, proposal-submission needs a real backend or removal, and election pulse needs its own contextual home. A market detail page should contain: the specific question, current probability + history, the real evidence/news driving it (linked from the underlying issue), and the stake action — nothing else; today no such page exists at all. Market cards should appear inside issues/decisions only as a small linked summary ("62% likely — see the forecast"), never as the full embedded trading widget currently on `/issue/[id]`. Demo-only markets, when no live market exists for a topic, should say "No verified forecast available yet" rather than render a permanently-non-tradeable "demo" card indistinguishable at a glance from a real one.

**Simulator.** Not important enough for top-level navigation on its own — it has no independent object (nothing exists that is "a simulation" by itself; every run is *about* something else). It solves a real problem (letting a user test "what if a different choice were made" and see a modeled, clearly-labeled-as-illustrative consequence) and should appear as "Explore scenarios" contextually within issue/decision/person/market pages, exactly as its existing `SimulateThisButton`/query-param bridge already supports — that infrastructure doesn't need to change, only the standalone nav slot and dedicated landing page emphasis need to go.

**Feed / Community.** Today it is closer to a later community feature wearing an "important civic intelligence" costume: most content is agent-generated (which is legitimate and useful) but presented with full social-network mechanics (reactions, comments, follows, "Community" labeling) that imply a level of human participation the current data doesn't support. It should remain public to view (the ranking algorithm and alert content are genuinely useful even to a first-time, non-account visitor) but the social layer (reacting, commenting, following) is correctly already auth-gated — the fix is presentational, not access-control: lead with "civic alert stream," de-emphasize social mechanics until genuine human participation exists.

**Campaigns.** Not currently a core product — it's a disconnected, non-functional standalone page shadowing a real action system that already lives inside Parliament/Issues. Recommend folding the *real* campaign mechanic into a "Take action" pattern reachable from Issues/Parliament/Decisions (email MP, join the pressure count, share), and removing or clearly relabeling the standalone `/campaigns` page's fake join/propose mechanics until they're wired to something real.

**Home page.** Single primary purpose: *tell a returning-or-first-time visitor what changed and what to do next*, i.e., yes, a "Today" briefing. Sections that should appear: a real (or honestly-labeled-as-illustrative) national snapshot, 2–3 top issues/decisions with working links, one clear "personalise this" CTA. Claims/scores needing removal or explicit labeling until verified: the entire `mock-civic-data.ts`-sourced national score and pillar grid (currently presented as if live). Primary calls to action: **(1)** explore an issue, **(2)** personalise (sign up / set electorate) — two, not three or four; the current "Test an idea" and "Take action" quick-action cards dilute the two that actually matter for a first-time visitor.

## User journeys

For each: current path, current problems, proposed path, click count before/after, what can be removed/consolidated.

**1. "What changed in Australian politics today?"**
- Current: `/` → scan pillar grid (may 404 via id mismatch) and "recent decisions" (all link to generic `/decisions`) → `/decisions` → scroll/filter a 19-item mock list with mostly non-functional cards. **3 clicks, dead-ends possible.**
- Proposed: `/` (fixed links, real or honestly-labeled snapshot) → `/issues?type=decision&sort=recent` → real item detail. **2 clicks, no dead-ends.**
- Consolidate: `/decisions`, `/government` both fold into `/issues`.

**2. "Why is housing under pressure?"**
- Current: `/` pillar card ("Housing") → likely 404 (id mismatch) *or* `/issues` → find a housing-tagged issue manually (no search/filter by topic keyword found) → `/issue/[id]` → wade through poll/market/MP-grid to find the actual explanatory text. **3–4 clicks, one likely broken.**
- Proposed: `/` (fixed link) → `/issues/[slug]` editorial page, context text above the fold, links to evidence/forecast below. **2 clicks, working.**
- Consolidate: no new page needed, fixes the existing one.

**3. "What did Parliament vote on?"**
- Current: no nav entry for `/parliament` at all on desktop/mobile — reachable only via ⌘K or a direct URL. Once there: bill feed, filter, expand. **1 click if you know the URL/palette, effectively 0-discoverability otherwise.**
- Proposed: `/government/parliament`, visible in primary nav. **1 click, discoverable.**
- Consolidate: none — this fixes discoverability, not duplication.

**4. "What has my local MP done?"**
- Current: `/leaders` (nav label "People") → scroll past chamber/mock scorecards → MP table → **click does nothing** (no navigation) → user must instead find the MP via ⌘K search, or via a seat click on `/parliament`'s map, or via a vote-row link from `/issue/[id]`. **Effectively broken from the most obvious entry point; 2–3 clicks via a workaround the user has to discover.**
- Proposed: `/people` → MP row → `/people/[id]` (real vote data finally wired in). **2 clicks, direct.**
- Consolidate: `/leaders`' MP table and `/mp/[id]` merge into one linked flow.

**5. "What decisions affect me?"**
- Current: no personalisation-filtered view exists anywhere; `/decisions` is one global unfiltered list; onboarding collects electorate/issue prefs (via the modal) but nothing on `/decisions` or `/issues` reads them back. **Effectively impossible today without manual scanning.**
- Proposed: `/issues?mine=true` (or an Account "My brief" view) reading the already-collected `user_profiles.top_issues`/electorate. **1–2 clicks, once built** (this is a genuine feature gap, not just an IA fix — flag as a Batch 5+ owner decision, not something the redirect/merge work alone solves).
- Consolidate: none — net-new, but should reuse data already collected by onboarding rather than inventing a new preference store.

**6. "What is likely to happen next?"**
- Current: `/predictions` (no primary-nav entry) → scroll past wallet/leaderboard/election-pulse to reach the actual market board. **1 click if found, but buried among 4 unrelated widgets once there.**
- Proposed: `/forecasts`, visible in primary nav, slimmed to just the board + featured market. **1 click, no unrelated content.**
- Consolidate: wallet/leaderboard/election-pulse move out (see Markets findings).

**7. "How can I take action?"**
- Current: `/campaigns` (fake join) **or** an Email-MP modal on `/issues`/`/issue/[id]`/`/parliament` (three separate modal instances) **or** the real `CampaignModal` (only inside `/parliament`). A user has no way to know which of these four is the one that does something real. **1 click to *a* action surface, but a coin-flip whether it's the real one.**
- Proposed: one "Take action" pattern (email MP + real bill-pressure join), surfaced consistently from Issues/Parliament/Decisions detail pages. **1 click, always real.**
- Consolidate: `/campaigns`' fake mechanic merges into (or is replaced by) the real `CampaignModal` system.

**8. "How do I create an account and personalise Stickee?"**
- Current: sign-up (`/auth/sign-up`, real, works) → either the first-visit modal (if it happened to trigger) or nothing — `/onboarding` the static page never actually collects anything. Post-signup redirect goes to `/`, `/admin` (if admin), or a caller-specified `next` — **never automatically to onboarding** except one specific Google-button default. **1–3 clicks, inconsistent, easy to skip personalisation entirely.**
- Proposed: sign-up → consistently routed into the real onboarding modal/flow (electorate + issues, already has a working Supabase write) → `/account/brief`. **2 clicks, consistent.**
- Consolidate: `/onboarding` (static page) folds into the modal flow or becomes `/account/brief`'s content.

## Recommended product hierarchy

1. **Today** (`/`) — the briefing, always the front door.
2. **Issues** (`/issues`) — the single canonical list of what government is considering/deciding, absorbing Decisions.
3. **Government** (`/government/*`) — Parliament (evidence) + People (who), the "how we know" layer behind Issues.
4. **Forecasts** (`/forecasts`) — the crowd-probability product, slimmed to its core.
5. **Account** (`/account`) — everything personal: profile, wallet, notifications, brief/preferences.

Feed, Campaigns, Simulator, and Elections are real, worth keeping, and become *contextual* features reachable from the five destinations above rather than competing top-level products — this is the single biggest structural change this audit recommends, and it is elaborated with exact routes in `PROPOSED_ROUTE_TREE.md` and sequenced with risk/dependency detail in `PAGE_REFACTOR_ROADMAP.md`.
