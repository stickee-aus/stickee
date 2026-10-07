# Stickee V1 — Core Page Redesign

Companion to `STICKEE_V1_PRODUCT_BLUEPRINT.md`. Full first-principles specification for every page in scope, each field derived directly from the twelve-agent Council review (see `STICKEE_V1_EXECUTIVE_SUMMARY.md`) and re-verified against current source. Design document only — no code changed.

For each page: the single question it answers, the user's first 30 seconds, their likely goal, minimum information required, ideal information hierarchy, ideal interaction model, primary action, secondary actions, truthful empty state, mobile experience, evidence requirements, metadata requirements, what moves elsewhere, and what should never appear.

---

## Today

**The single question it answers:** What is happening?

**The user's first 30 seconds:** Lands here as the default landing page. Reads a one-sentence thesis, sees three destinations with real content previews (not empty promises), and either clicks into one or scrolls to a compact "what changed" strip.

**The user's likely goal:** Get oriented, then leave for the page with the specific answer they need — Today is a dispatcher, not a destination in itself.

**Minimum information required:** One real, dated "what changed" signal (sourced from the same real data Political Pulse draws on — see below); one live preview each for Issues, Government, Forecasts (not three empty "being prepared" sections, and not three destination cards *and* three separate preview sections, which is today's actual defect — see `SIMPLIFICATION_RECOMMENDATIONS.md`).

**Ideal information hierarchy:** Hero (one sentence, two CTAs) → three unified destination cards, each combining "why go here" copy with a live content preview or an honest one-line status in a single unit → a compact Political Pulse "what changed today" strip (new; currently absent entirely) → one closing personalisation CTA.

**Ideal interaction model:** Read-and-choose. No filters, no expand states. Every element serves exactly one decision: which of the three doors to open next.

**Primary action:** Choose a destination (Issues / Government / Forecasts).

**Secondary actions:** Personalise (electorate/issues), see the full Political Pulse timeline. Simulator and any "take action" shortcut are explicitly **not** primary or secondary actions here — see "what should never appear."

**Truthful empty state:** Where a section has no real content (e.g. Civic Indicator data, per `AGENTS.md`'s own known debt), show one muted line, not a full section with its own heading and empty-state card — a section devoted entirely to "we don't have this yet" is a cost to read for zero information.

**Mobile experience:** Hero and destination cards stack vertically; the Political Pulse strip collapses to 2–3 items with a "see all" link; personalisation CTA remains the final element, never buried above the fold competing with orientation content.

**Evidence requirements:** The "what changed" strip must be sourced from real `feed_posts`/agent-authored civic alerts with visible authorship disclosure (`source_agent_id` restored to the client — currently dropped, see `CONTENT_HIERARCHY.md`), never from mock decision data.

**Metadata requirements:** Each destination preview shows a real count (e.g. "12 active issues") computed from the same query the destination page itself uses — never a second, independently-maintained number.

**What should move elsewhere:** The national civic-score/pillar grid stays absent until `pillar_metrics` is real (already correctly removed in the current build — do not reintroduce it before the underlying data exists). "Explore scenarios" and "Take action" quick links move to contextual placement on the pages/objects they act on.

**What should never appear:** A second, independent representation of a destination already shown as a card (today's literal defect — see C1 pattern in `SIMPLIFICATION_RECOMMENDATIONS.md`); any civic-score number without a real source; any "coming soon" section with no path to becoming real.

---

## Issues

**The single question it answers:** Why is this happening?

**The user's first 30 seconds:** Arrives from Today, a search engine, or a shared link. Sees a filterable list of bills/issues, each row stating status and one plain-language support figure, and can either scan or search by topic.

**The user's likely goal:** Understand the background and current state of a specific issue, or browse what's active.

**Minimum information required per row (collapsed):** status badge, title, one-line summary, one real support/status figure — not the two to seven data points the current implementation renders (MP Yes%, market probability, trend arrow, participant count, sentiment bar, Yes/No/Abstain counts, all before any click).

**Ideal information hierarchy (list):** Hero count (stated once, not twice) → status filter tabs (All/Active/Passed/Rejected, already the correct pattern) → topic/keyword search (currently absent — a real gap, not a redesign nicety) → flat row list, expand-in-place for detail, never navigate away to see a summary.

**Ideal information hierarchy (detail):** Title/status/summary → "what's happening" (the actual editorial content) → who supports/opposes, attributed by named party, sourced → one real prediction affordance (not two competing mechanisms) → Take Action (real `bill_pressures`, not just an Email-MP mailto) → a real Timeline (once the underlying table exists — see `CONTENT_HIERARCHY.md`) → linked-out summaries for Government evidence and Forecasts, never embedded widgets.

**Ideal interaction model:** List: underline-tab filter over a flat, expand-in-place row list. Detail: single-column article, read top to bottom, exactly one inline decision point.

**Primary action (list):** Open an issue. **Primary action (detail):** Take real action (contact MP / add pressure) or follow the forecast link.

**Secondary actions:** Simulate this (a single small chip near the headline, never a strip); search/filter.

**Truthful empty state:** "No bills match this filter" (already correct); a topic search with no results states that plainly, no fabricated suggestions.

**Mobile experience:** Row's expand affordance (the chevron) must remain visible outside any `hidden sm:flex` wrapper — today it disappears on mobile while the row remains tap-expandable, an invisible-but-present control.

**Evidence requirements:** Every who-supports/who-opposes claim needs a real citation (`issues.source_url` exists, is currently unused for this exact claim type — Data & Evidence Steward P1). Every prediction affordance must state participant count and date, never imply "Australians agree" when the figure is a Stickee forecast-market probability, not a public-opinion measure (Editorial Advisor P1, live defect).

**Metadata requirements:** Status, source, last-updated date visible on every row and detail page — not buried below the fold.

**What should move elsewhere:** Full market order-book widget → a one-line forecast summary linking to Forecasts. Full 150-row MP vote grid → a one-line vote-total summary linking to Government/People.

**What should never appear:** Two separate Yes/No prediction mechanisms on one page (today's literal defect: an inline poll plus a market widget); a "Predict outcome" button with no handler; the mock `Decision` type's fabricated `isTrending`/`isControversial`/`likes`/`dislikes` fields, in any form.

---

## Government

**The single question it answers:** What has government actually done?

**The user's first 30 seconds:** Arrives via primary nav expecting the real record. Sees one real hero number, today's single most important parliamentary/executive item, and a clear internal split between executive action and legislative record.

**The user's likely goal:** Verify a specific claim about what government did, or check what Parliament is currently doing.

**Minimum information required:** One real hero stat (not four hardcoded literals — today's literal defect); a "today's one action" module (the existing `PriorityBillFocus` pattern, independently rated the strongest single-task pattern found in the whole review); the chamber/vote evidence layer; your MP's role.

**Ideal information hierarchy:** Hero (one real number, computed from the data rendered below it) → explicit split: "The Executive — decisions and announcements" vs. "The Parliament — bills, votes, committees" (Public Policy Advisor's required structure, not optional) → today's priority item → your rep → chamber visualisation (House/Senate, real) → collapsed civics explainer (already correctly collapsed by default — no change needed).

**Ideal interaction model:** Single-task hero at top, fixed evidence order below — no competing filterable bill list once Issues is the merged, canonical list (this page links to Issues, it does not re-list it). Chamber's House/Senate/Current-Live toggle remains the page's one filter control.

**Primary action:** Understand today's most important government activity (read the priority module).

**Secondary actions:** Find your rep, explore the chamber, take real action on a bill (linking to the same `bill_pressures` mechanism used on Issues, not a second implementation).

**Truthful empty state:** If no real government-decision content exists yet for a given level (federal/state/local), say so — never substitute the mock `Decision` array to avoid an empty section.

**Mobile experience:** The five current content blocks (priority focus, bill feed, your rep, chamber, education) should collapse to anchor-linked jump navigation once the bill feed is removed — four remaining blocks, each independently reachable without full-page scroll.

**Evidence requirements:** Every executive-action item needs a real minister/department attribution (currently not a normalized concept anywhere in the schema — Public Policy Advisor, real build gap, not a display gap) and a real source. Every legislative item inherits the Government Record System's already-verified TheyVoteForYou sync.

**Metadata requirements:** RBA/independent-statutory-body content, if surfaced here at all, must carry an explicit "independent of the elected government" tag — a well-known, non-contested civics point this platform should actively reinforce, not blur (Public Policy Advisor).

**What should move elsewhere:** The full, independently-filterable bill list → Issues (this page links out, does not duplicate). Any market-probability content → Forecasts, linked not embedded.

**What should never appear:** The current `/decisions` page's fabricated content in any form; a hardcoded, non-computed stat of any kind; a Bill-typed item filed under "government decision" without a note that it's still in the legislature, not yet an executive fact (Public Policy Advisor's Bill-vs-executive-action distinction).

---

## Forecasts

**The single question it answers:** What is likely to happen next?

**The user's first 30 seconds:** Arrives expecting the participation layer, not a trading terminal. Sees one real hero number (active forecast count), a featured forecast, and a filterable board — no wallet balance, no propose-market form, no election widget competing for the same header row.

**The user's likely goal:** See the crowd's current estimate on a specific question, understand why it's at that level, optionally stake a view.

**Minimum information required:** Question (plain language) → current probability (a plain numeral, not the largest/boldest thing on the card without a methodology line beneath it) → evidence/why-it's-at-this-level → resolution criteria stated in advance → history.

**Ideal information hierarchy:** Hero (one number, "N active forecasts") → featured forecast (one editorial-quality lead item) → underline-tab category/status filters → market grid → (new) per-forecast detail page (`/forecasts/[id]`, a genuine current gap — no such page exists today) carrying the dense content (evidence, resolution criteria, history, arguments) currently crammed onto list-grid cards.

**Ideal interaction model:** The same two-part grammar as Issues (featured item + underline-tab filtered grid) — a reader who has learned one has learned both. No toggles, no header actions beyond navigation.

**Primary action:** Understand the current estimate for a question you care about.

**Secondary actions:** Stake a view (sign-in gated, correctly so today); see the issue/evidence that motivates the forecast (currently a dead end — no forecast card links back to its originating issue at all, UX Journey Analyst finding).

**Truthful empty state:** "No verified forecasts are currently open" (already the correct pattern on Today; extend consistently here).

**Mobile experience:** Wallet/propose/sign-in controls currently vanish entirely on mobile inside a `hidden sm:flex` wrapper rather than reflowing — once relocated to Account (see below), this becomes moot for Forecasts itself; whatever remains on mobile must degrade to a menu, not silent removal.

**Evidence requirements:** Every probability figure carries its disclaimer ("virtual points, not financial advice") as a property of the number itself, wherever it's shown — not scoped to the Forecasts page alone, since this progression puts probabilities on Issue/Government/MP pages too (Legal Advisor). AI-generated bull/bear analysis must be visibly labelled as such and never fall back to generic template text presented as market-specific (Legal Advisor, "High" risk today).

**Metadata requirements:** Resolution source must be shown publicly on the resolved-market view, not only in `/admin/markets` — the evidence already exists at the database layer (`resolution_source`, admin-entered, required), it simply isn't surfaced to the reader today (Data & Evidence Steward P1, a presentation fix, not a new-data problem).

**What should move elsewhere:** Wallet balance and portfolio → Account. Leaderboard → Account or nowhere, on one real ranking query, never reinstated as a second hardcoded array. Live Election Pulse → contextual, rendered only when `useLiveElection().active` is true (the signal already exists in code, it's just not gated). Recent-rehearsals/simulator strip → a single small chip, not a strip.

**What should never appear:** The "+Propose" market-submission entry point in its current decorative form (never persists past `localStorage` — remove until it has a real backend, do not add a disclaimer to a feature that does nothing). Fake volume/24h-move figures (Legal, "High" risk) presented with the same visual authority as the real probability. Any leaderboard tombstone ("not available yet" placeholder) — either real, or absent, never a permanent promise.

---

## People

**The single question it answers:** Who represents Australians, and what have they done?

**The user's first 30 seconds:** Arrives expecting a directory, not a data-visualisation tool. Sees one real hero stat and, immediately below it, the MP directory itself — not a chamber map or an education card first.

**The user's likely goal:** Find their own MP, or check a specific MP's record.

**Minimum information required:** Total MP count with source/sync-date (already the best-executed header in the current app — the template to copy, not replace); a sort/filter/search directory; each row linking to a real profile.

**Ideal information hierarchy:** Hero (real count + source line) → an electorate "find your MP" tool (currently exists but lives on the wrong page — Parliament — with no link back to the profile it resolves; belongs here) → MP directory (sort/filter/rows/pagination, already well-built) → a static party-composition strip (not a full interactive chamber map — that belongs to Government) → community-nominated leaders, clearly, permanently, visually distinguished from elected MPs (not a one-time disclaimer).

**Ideal interaction model:** Directory: sort + filter chips over a flat row list, exactly as built today — keep it. Drop the second interaction model (chamber tab + live-results toggle + seat-map hover) entirely; a directory needs one interaction grammar.

**Primary action:** Find and open your MP's (or another MP's) profile.

**Secondary actions:** Filter by party, browse community-nominated leaders (if that section remains — see Owner Decisions).

**Truthful empty state:** MP voting-record sections currently, correctly, say "being verified against the real parliamentary record" rather than showing a fabricated score — keep this pattern, extend it to every instance still importing the retired fabricated-score data (`/impact`, `/issue/[id]`'s `MPVoteGrid` — both still live).

**Mobile experience:** No change needed to the directory itself (already responsive); removing the chamber-map block reduces mobile scroll length substantially.

**Evidence requirements:** Real vote history (`member_votes`, synced, currently unused on the MP profile) should be wired in as raw, dated, sourced votes — not a computed score, per the still-binding `docs/MP_SCORE_METHODOLOGY_REQUIREMENTS.md`.

**Metadata requirements:** Source + sync date on the directory header (already correct); same standard on every individual profile.

**What should move elsewhere:** Full interactive chamber visualisation → Government (People shows, at most, a static composition summary). The "How Parliament works" explainer → Government's already-correct collapsed education accordion; do not maintain two independent copies of the same civics content.

**What should never appear:** `HouseChamber.tsx`'s `generateScores()` output ("Approval"/"Trust" bars hashed from an MP's own id string) — a live, previously-unflagged fabricated-score system, in any form, anywhere this page touches. Fictional community-leader content presented without a persistent, visible "community-submitted, unverified" label.

---

## Political Pulse (redesign of `/feed`)

**The single question it answers:** What changed?

**The user's first 30 seconds:** Reaches this either via Today's compact strip or a direct link. Sees a dated, sourced, chronological list — no reaction counts, no "algorithmically boosted" badge, no share-for-points prompt.

**The user's likely goal:** Scan recent civic events and jump to the one that matters to them.

**Minimum information required per entry:** timestamp, source/actor-type tag (Executive / Legislature / Independent statutory body / Statistical agency / Stickee-forecast — mandatory per Public Policy Advisor, not optional styling), one-line description, a working link to the primary record.

**Ideal information hierarchy:** Chronological list, newest first, grouped by day. Each entry: actor-type badge → headline → source link → linked object (issue/forecast/person, where applicable).

**Ideal interaction model:** Scroll and filter by content type (real Parliament/Bills/Forecasts only for V1 — see scope below); no engagement actions of any kind at V1 (no reactions, no comments, no share-for-points).

**Primary action:** Open the linked primary record (an issue, a forecast, an MP).

**Secondary actions:** Filter by content type.

**Truthful empty state:** "No new civic events in this period" — never mock/seed content presented without a visible label.

**Mobile experience:** Same list, no dedicated design work required beyond standard responsive list behaviour.

**Evidence requirements — the binding constraint on this page's scope:** per the Data & Evidence Steward's review, only **Parliament, Bills (status/source only, not the unsourced who-supports/who-opposes text), Forecast openings, and Forecast resolutions (once `resolution_source` is surfaced publicly)** are evidence-supportable today. **Committees, ABS, RBA, Treasury, Speeches, and Source corrections have no real data pipeline and must not appear as live content types until each independently gets one** (six separate P0s, none may be waived for design reasons). Elections may appear only as live, in-the-moment state, never as historical/chronological entries, since no persisted election-event table exists.

**Metadata requirements:** Every entry must disclose whether it is agent-authored (currently, `source_agent_id` is captured but silently dropped before reaching the client — restoring this is a prerequisite, not a nice-to-have, per two independent Council findings).

**What should move elsewhere:** Any human commentary/reaction/follow mechanics → deferred entirely until genuine human participation volume exists and a moderation queue is built (System 12 currently has none).

**What should never appear:** The current implementation's "↑ BOOSTED" algorithmic badge; share-for-points bonuses; `scoreToGrade` letter-grade badges (a live regression of a pattern already removed elsewhere for lacking a real per-person methodology); any of the six unsourced content types listed above, under any framing.

---

## Issue detail

See **Issues** above for the full spec — Issue detail is that page's expanded state, specified together because the redesign collapses today's separate, overloaded `/issue/[id]` page into one consistent article pattern with the list, not a structurally different page.

**What should never appear (restated, since this is the single most overloaded page found in the entire review):** a full order-book market widget; a full 150-row MP vote grid with an unrelated "guess the vote" mini-game; two separate prediction mechanisms on one page; a Simulator strip above the fold (a single chip is the correct weight).

---

## Government Decision

**The single question it answers:** What was decided, by whom, and when?

**Status:** Not yet a real, evidence-complete object — see `STICKEE_V1_PRODUCT_BLUEPRINT.md` §7 and the Executive Summary's Owner Decision 2. This specification describes the target once the Issue/Bill/Decision schema merge lands; it must not be built against `mock-government-data.ts` even as an interim/placeholder, per the Data & Evidence Steward's explicit finding that doing so would repeat the "looks populated, isn't real" pattern already fixed elsewhere.

**Minimum information required:** decision title, real decision-maker (minister/department — a genuine build gap, not yet normalized anywhere), status (using a legislative-stage vocabulary for Bills and a distinct announce/action/implement vocabulary for executive acts — never the same "Passed/Rejected" label for both), real source, real timeline.

**Ideal information hierarchy:** Title/status → decision-maker (with institutional context: federal/state/local, executive/legislative) → what was decided and why → real timeline (once built) → linked evidence → linked forecast (if one exists) → real "take action" affordance.

**Ideal interaction model:** Single-column article, identical grammar to Issue detail — a Government Decision is a type/status of Issue, not a structurally separate page (per the already-approved consolidation direction).

**Primary action:** Understand what was decided.

**Secondary actions:** Take real action; see related forecast.

**Truthful empty state:** Where no real decision content exists for a topic, say so — never fabricate a plausible-sounding record.

**Evidence requirements:** A real, citable source is mandatory before publication — this is the Editorial Advisor's whole-page-unsourced-premise blocker, restated as a build requirement.

**Metadata requirements:** `Source / Published / Retrieved / Verified / Confidence / Methodology` per the Data & Evidence Steward's standard metadata (see `CONTENT_HIERARCHY.md`).

**What should never appear:** `DecisionMaker.approvalRating`/`trustScore` or any successor field carrying the same shape (a live P0 defect, independent of this redesign, that must be removed regardless of timing); fabricated `isTrending`/`isControversial`/`likes`/`dislikes` engagement fields.

---

## Forecast detail (`/forecasts/[id]`)

**The single question it answers:** What does the crowd expect for this specific question, and why?

**Status:** A genuine current gap — no per-market detail page exists anywhere in the app today; every forecast's entire on-platform presence is a card on the list plus a modal.

**The user's first 30 seconds:** Arrives from the Forecasts board or a link from an Issue page. Sees the question, the current probability, and immediately below it, why.

**Minimum information required:** question, current probability + a brief history (chart), the real evidence/news driving it (linked from the underlying issue, not duplicated), resolution criteria stated in advance, the stake action.

**Ideal information hierarchy:** Question (serif headline, the actual question a reader wonders about) → current estimate (plain numeral, methodology line beneath it) → resolution criteria → evidence/history → linked originating issue → stake action.

**Ideal interaction model:** Single-column article + one inline action (stake), identical grammar to Issue/Government-Decision detail.

**Primary action:** Understand the current estimate and why.

**Secondary actions:** Stake a view (sign-in gated); jump to the originating issue.

**Truthful empty state:** N/A — this page only exists for real, eligible markets.

**Evidence requirements:** Resolution criteria specified in advance, not retrofitted after the fact (Kalshi-derived pattern, Benchmarking Advisor, "Adapt," conditional on Public Policy sign-off for politically contested resolution edge cases).

**Metadata requirements:** `resolution_source` surfaced publicly once resolved (currently DB-only, invisible to readers — Data & Evidence Steward P1).

**What should never appear:** AI-generated bull/bear commentary without an explicit "AI-generated interpretation" label; fake volume/24h-move figures; any framing implying financial advice.

---

## MP profile (`/mp/[id]`, target `/people/[id]`)

**The single question it answers:** What has this specific MP done?

**The user's first 30 seconds:** Arrives via People's directory or a link from an issue/vote. Sees name, party, electorate, and — the page's actual job — real voting history, not a simulate-first layout.

**Minimum information required:** identity (name, party, electorate — already real and correct), real vote history (`member_votes`, real, currently unused here), honest placeholder where verification is still pending (already the correct pattern).

**Ideal information hierarchy:** Header (identity) → real voting record (raw, dated, sourced — not a computed score) → context (committee membership, if that object is ever built) → Simulate-this (de-emphasised, a chip beside the record, not the first thing below the header).

**Ideal interaction model:** Article + a filterable vote-history list.

**Primary action:** Read the MP's real record.

**Secondary actions:** Simulate this MP's stance on a live issue; contact this MP.

**Truthful empty state:** "Being verified against the real parliamentary record" — already correct wording, extend it to remain accurate until real data is wired in, then remove it in favour of the real list.

**Mobile experience:** No structural change required beyond de-emphasising the Simulate button's current top-of-page prominence.

**Evidence requirements:** Every vote entry traces to a real `division`/`member_votes` row — never the retired `PARTY_VOTE_MAP` (which still assigns every MP of a party an identical vote on mock issues) under any name.

**Metadata requirements:** Canonical ID must resolve to `members.id`/`tvfy_id`, not the current mock `MPIndex` scheme — a real identifier migration, not a cosmetic route rename (Historian, P1).

**What should never appear:** Any computed score/grade for this MP without satisfying `docs/MP_SCORE_METHODOLOGY_REQUIREMENTS.md` in full; the fabricated per-party voting-history list this page already, correctly, removed once.

---

## Parliament (Government's evidence sub-page)

**The single question it answers:** What is the real parliamentary record — who sits where, what's being voted on, how did they vote?

**The user's first 30 seconds:** Arrives from Government or a direct link. Sees the chamber, real and current, with no fabricated statistics competing for attention.

**Minimum information required:** chamber composition (House/Senate), current/live-election toggle, real MP vote data, today's priority bill.

**Ideal information hierarchy:** One real hero stat → today's priority action (`PriorityBillFocus`, keep unchanged — the strongest single-task pattern found across this whole review) → your rep → chamber visualisation → collapsed education.

**Ideal interaction model:** House/Senate + Current/Live toggle is the page's one filter; no independently-filterable bill list once Issues is canonical.

**Primary action:** Understand today's most important parliamentary activity.

**Secondary actions:** Find your rep and act (linked to the profile, not a dead end — `MPActionStrip` currently resolves an MP with zero link to that MP's own page, a real defect to fix).

**Truthful empty state:** N/A for the chamber itself (always real, live-or-current); a bill feed with nothing urgent states that plainly.

**Evidence requirements:** Every stat in the header must be computed from the data rendered below it, never a literal string.

**Metadata requirements:** "Source: TheyVoteForYou · [sync date]" (already correct where present — extend consistently).

**What should never appear:** The four hardcoded header stats in their current form, especially "74% Predict Acc." (internally contradicts Forecasts' own honest "not available yet" disclosure three clicks away — a live, self-defeating inconsistency); a full independently-filterable bill list duplicating Issues.

---

## Community (deferred — specification for later, not V1)

**The single question it would answer:** How can I contribute directly?

**Status:** Explicitly deferred past V1 launch. Documented here so the eventual build, if and when approved, doesn't restart from zero — not an invitation to build it now.

**Gates before any implementation:** a real lawyer's review of real-person nomination/scoring (currently the closest precedent, `leader_supports`/`NominationModal.tsx`, was disabled once already for a materially similar risk on fictional profiles); a built admin moderation queue (System 12 currently has none at all — direct database access is the only path today); an explicit `evidence`/`citations` schema (the actual foundational gap any real "submit evidence" feature depends on).

**If built:** a visible-status contribution lifecycle (submitted → under review → accepted/declined, with a stated reason) attached to existing objects (an Issue's evidence, a bill's pressure campaign, a People nomination) — never a standalone content feed, never an upvote/follower mechanic, never open public commenting on a live nomination.

**What should never appear, ever, in any version:** an open comment/reaction wall on real, named people; any "credibility score" computed from unverified crowd input with no disclosed methodology; any mechanic resembling a popularity contest for a real, identifiable individual.
