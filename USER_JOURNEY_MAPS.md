# Stickee V1 — User Journey Maps

Companion to `CORE_PAGE_REDESIGN.md`. Current-state journeys below are traced through the real route tree and components (not analytics — none exist), per the UX Journey and Bottleneck Analyst's Council review; proposed-state journeys are this blueprint's target. Click counts are literal step counts through real routes. Cognitive load, trust, and clarity are qualitative judgements (Low/Medium/High), not measured metrics — no instrumentation exists to measure them, and none is invented here.

---

## 1. Understanding today's events

**Current:** `/` → three consecutive sections ("Where to start" cards, National snapshot, Government activity) with the latter two rendering honest-but-empty "being prepared" states → no link anywhere on the page to `/feed`, the one system that actually holds dated, real content → `/feed` is reachable only via ⌘K (desktop-only) or `/profile`/`/u/[handle]`.
**Clicks to a real "what changed" answer:** Effectively unreachable from the front door — 0 clicks gets nothing; reaching `/feed` requires knowing the command palette exists.
**Cognitive load:** Medium — two empty sections in a row read as an unfinished product, not a bug, but still a cost.
**Trust:** Medium — no fabrication, but the page's implicit promise ("what's happening") goes unanswered.
**Clarity:** Low — a first-time visitor cannot tell that "what changed" lives on a different, unlinked page.

**Proposed:** `/` → a compact, real "What changed today" strip (2–3 items, sourced from real `feed_posts` civic alerts) with a "See Pulse →" link to the full Political Pulse page.
**Clicks:** 0 clicks to a real answer on the front page itself; 1 click to the full timeline.
**Cognitive load:** Low — one small, real module, not two empty ones.
**Trust:** High — real, dated, sourced content, with authorship disclosed.
**Clarity:** High — "what changed" is answered where the question is asked.

---

## 2. Understanding an issue (traced: housing affordability)

**Current:** `/issues` → no keyword search, only a status filter — finding "housing" means scanning every title by eye → `/issue/housing-affordability` renders ten stacked blocks (status chip, Simulate button, rehearsals strip, 3-stat grid, context, who-supports/opposes — uncited, an inline poll, Email-MP, a full market order-book, a full 150-row MP vote grid) with no progressive disclosure. Of the mission's stated Issue → Government → Evidence → Timeline → Forecast progression: Issue → People works (MP vote rows link to `/mp/[id]`); Issue → Forecasts is generic, not deep-linked (`?market=` query param is set but never read); Issue → Timeline doesn't exist (no timeline component renders here at all); Issue → Parliament/real-action doesn't exist (only a separate Email-MP mailto, not the real `bill_pressures` mechanism).
**Clicks:** 2 to reach the issue (list → detail); unbounded manual scanning to find it by topic; the progression the mission wants is traceable for 2 of 5 steps.
**Cognitive load:** High — ten content blocks, three visual dialects, before-the-fold market data duplicating a page that exists specifically for that.
**Trust:** Medium — real government-vote data sits beside a decorative order-book widget with non-functional buttons and an uncited "who supports/opposes" narrative.
**Clarity:** Low — a reader cannot tell, from the page's structure, which of its ten blocks is the actual answer to "why is this happening."

**Proposed:** `/issues` with topic search → `/issues/[slug]`: title/status/summary → what's happening/who supports-opposes (sourced) → one prediction affordance → real take-action → linked (not embedded) evidence and forecast summaries → a real Timeline once built.
**Clicks:** 2 (search-assisted, not scan-assisted) to reach the issue; all five progression steps traceable once the Timeline table and forecast-detail linking land.
**Cognitive load:** Low — one article, one decision point, two links out.
**Trust:** High — one real action, cited claims, no decorative widgets.
**Clarity:** High — the page reads top to bottom as one answer, not five competing tools.

---

## 3. Tracking government (traced: "what did Parliament vote on")

**Current:** Primary nav "Government" → `/decisions` (100% mock `DECISIONS`, no MP vote data, a decorative poll that discards input) → the real record (`/parliament`) is reachable only via one small inline text sentence in the page's intro paragraph, not a nav item, button, or card.
**Clicks:** 1 click from nav lands on fabricated content; 2 clicks (and noticing a buried text link) reaches the real record.
**Cognitive load:** Low to read (the mock page is simple), but that's the problem — it's easy to read and easy to mistake for real.
**Trust:** Low — the nav item most likely to be clicked for this exact question answers it with fiction first.
**Clarity:** Low — nothing on `/decisions` itself discloses that it isn't the real record.

**Proposed:** Primary nav "Government" → real evidence-layer page: one computed hero stat → today's priority action → your rep (linked to their profile) → chamber → explicit executive/legislature split, sourced throughout.
**Clicks:** 1 click from nav to real content, always.
**Cognitive load:** Low — one hero number, fixed evidence order, no duplicate bill list competing with Issues.
**Trust:** High — nav destination matches nav label, every claim sourced.
**Clarity:** High.

---

## 4. Understanding an MP (traced: "who is my local MP, and what have they done")

**Current:** Two disconnected paths. Via People (`/leaders`): directory rows correctly link to `/mp/[id]` (a genuine, confirmed fix over the pre-truthfulness-batch state), but there's no electorate-based "find my MP" tool here at all — you must already know the name. Via Parliament: the one working "find by electorate" tool (`MPActionStrip`, `useElectorate`) resolves a real MP but renders **zero link** to that MP's own profile — you must leave, go to People, and re-find the same MP by name. The destination, `/mp/[id]`, honestly shows "voting analysis is being verified" for every MP (a correct empty state, but the page's core task — "what have they done" — is currently uncompletable for anyone).
**Clicks:** 3+ if starting from the one tool that actually knows your electorate (Parliament → resolve MP → leave → People → re-find by name → profile); 2 if you already know your MP's name (People → profile).
**Cognitive load:** Medium — the tool and the destination live on different top-level pages with no bridge.
**Trust:** High on the honesty of the empty state; Low on task completion — the loudest button on the destination page is "Simulate," not any real record.
**Clarity:** Low — a first-time visitor doesn't know the "find by electorate" tool exists on a different page than the one named "People."

**Proposed:** `/people` → electorate tool (moved here) → MP row/result → `/people/[id]`, directly linked from both entry points, showing a real voting record (raw, dated, sourced) as the page's lead content, Simulate demoted to a chip.
**Clicks:** 2, from either entry point, consistently.
**Cognitive load:** Low — one tool, one destination, no cross-page re-finding.
**Trust:** High, once real `member_votes` are wired in (a named, scoped dependency, not assumed complete).
**Clarity:** High.

---

## 5. Making a forecast (staking a view)

**Current:** `/predictions` → scan past a wallet balance, sign-in prompt, "+Propose," and a wallet-toggle sharing the header row with the page's own hero count → featured card or grid → Stake modal (sign-in gated, honest prompt when signed out). The mechanic itself (staking, once you're signed in) is real, verified infrastructure and works correctly — the friction is entirely in what surrounds it.
**Clicks:** 2–3 to reach a stake action (board → card → modal), through a header row carrying five other, non-staking concerns.
**Cognitive load:** Medium-High — five unrelated header controls before the actual market grid.
**Trust:** High for the mechanic itself (real wallet, honest labelling of virtual points); Medium for the surrounding page (fake volume/24h-move figures sit beside the real probability with equal visual weight).
**Clarity:** Medium — the page's actual job (see the crowd's estimate, optionally stake) is buried under wallet/portfolio/election/propose furniture.

**Proposed:** `/forecasts` → featured card or grid (header carries only the hero count) → `/forecasts/[id]` (new) → Stake action.
**Clicks:** 2–3, unchanged in count, but every intermediate screen is now board-relevant content only.
**Cognitive load:** Low — one number in the header, no unrelated controls.
**Trust:** High — fake volume/24h-move removed; disclaimer travels with the probability figure wherever it appears.
**Clarity:** High.

---

## 6. Understanding a forecast (why is it at this level)

**Current:** No per-market detail page exists. A `MarketCard` on the board renders probability, 24h move, volume, a news timeline, and an AI bull/bear case all on one dense grid tile — doing a detail page's job on a list surface — and renders **no link back** to the issue that motivated the market at all.
**Clicks:** 0 (everything crammed onto the list card) but with no path to the fuller editorial context that exists on the issue page, and no way to isolate just this forecast's evidence from the rest of the grid.
**Cognitive load:** High — a single card carries the density this journey map's Issue-detail finding (§2) already flagged as excessive, just relocated to a grid tile instead of a full page.
**Trust:** Medium — AI-generated content shares visual weight with real probability/volume figures, distinguished only by a small icon.
**Clarity:** Low — "why is it at this level" has no dedicated place to be answered.

**Proposed:** Board card (question, probability only) → `/forecasts/[id]`: current estimate + methodology line → resolution criteria → evidence/history → link back to the originating issue.
**Clicks:** 1 (card → detail).
**Cognitive load:** Low — the dense content moves to a page built to carry it.
**Trust:** High — AI-generated content explicitly labelled, never a generic fallback presented as market-specific.
**Clarity:** High.

---

## 7. Following an issue (saving/watching a topic for later)

**Current:** **Does not exist.** Confirmed via the Domain Model: `user_follows` exists but is scoped to following *other users* (a social feature), not topics/issues/pillars. There is no "Saved Topic/Watchlist" object anywhere in the schema or UI. A user who wants to track a specific issue over time has no mechanism to do so beyond manually remembering to revisit its URL.
**Clicks:** Not applicable — the journey cannot be completed today.
**Cognitive load:** Not applicable.
**Trust:** Not applicable.
**Clarity:** Not applicable — this is a scope gap, not a friction problem.

**Proposed:** A "Follow this issue" action on Issue detail, writing to a real, new `saved_topics` table (or equivalent), surfaced back to the user as a filtered view — most naturally, as an input to the Today "what changed" strip (a followed issue's updates appear there first) and to the personalisation flow in Journey 8 below, once it's real. This is genuinely new scope, not a redesign of something broken — sequenced accordingly in `IMPLEMENTATION_BATCHES.md`, not assumed to ship with the V1 core pages.
**Clicks (once built):** 1 (a button on Issue detail) to follow; 0 additional clicks to see followed-issue updates once personalisation is real (they appear on Today).
**Cognitive load:** Low, by design — one button, one place updates surface.
**Trust:** High, contingent on Today's "what changed" strip already being real (Journey 1) — a followed-issue feature built on top of a fake feed would inherit that fakeness.
**Clarity:** High.

---

## 8. Submitting a civic proposal (Community — deferred)

**Current:** Two disconnected, both broken paths exist today that a user might reasonably mistake for this journey. (a) `/predictions`' "+Propose" market-submission modal writes only to `localStorage` with a "Pending Review" badge implying real moderation — nothing persists past the browser session. (b) The Community Leader nomination flow (`NominationModal.tsx`) is real (writes to `leader_supports`) but was deliberately disabled after `/leaders/[id]` was found rendering fictional profiles indistinguishably from real people — it is not currently reachable from the product at all.
**Clicks:** 1 click reaches a form that appears to work (market proposal) but silently discards the submission; the other real mechanism is unreachable.
**Cognitive load:** Low to submit, which is exactly the problem — no friction signals that nothing happens next.
**Trust:** Low — a "Pending Review" badge on content that is never reviewed by anyone is a direct instance of implying a real process that doesn't exist.
**Clarity:** Low — a user cannot tell their proposal went nowhere.

**Proposed — explicitly deferred, not V1:** Per `STICKEE_V1_PRODUCT_BLUEPRINT.md` §8, this journey is not redesigned for V1 launch. When it is picked back up (gated on a real lawyer's review and a built moderation queue), the target is a visible-status lifecycle: submit → under review → accepted/declined with a stated reason, attached to an existing object (an issue, a bill, a person) rather than a standalone form. Until then, the correct near-term fix — in scope for the V1 program, not deferred — is **removing** the decorative "+Propose" entry point per `SIMPLIFICATION_RECOMMENDATIONS.md`, so that this journey has an honest zero steps (no fake form) rather than one deceptive step.
**Clicks (interim, V1):** 0 — the entry point is removed, not redesigned.
**Cognitive load / Trust / Clarity (interim):** Improves from Low/Low/Low to Not applicable — a removed feature cannot mislead.
