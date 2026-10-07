# Stickee V1 — Simplification Recommendations

Companion to `CORE_PAGE_REDESIGN.md`. Radical-simplification ledger for every page in scope, organised by the seven categories the redesign mission specified: unnecessary complexity, duplicate information, fake information, duplicated actions, duplicated systems, overloaded pages, and information that belongs elsewhere. Every entry cites the file/component it was verified against — this document does not restate opinion, it restates the twelve-agent Council review's evidence (`STICKEE_V1_EXECUTIVE_SUMMARY.md`) in ledger form.

---

## Today

| Category | Finding | Evidence |
|---|---|---|
| Duplicate information | Three destinations (Issues/Government/Forecasts) rendered twice — once as destination cards, once as separate content-preview sections below | `src/app/page.tsx:21-40, 116-187` |
| Overloaded page | Two consecutive empty "being prepared" sections read as unfinished, not honest | `src/app/page.tsx:116-145` |
| Information that belongs elsewhere | Simulator/Campaigns quick-links, prominently placed right after the hero, re-promoting features already demoted from primary nav for lacking independent identity | `src/app/page.tsx:42-45` |
| Information that belongs elsewhere | "What changed today" content (Political Pulse) is entirely absent from the one page whose job is exactly that | `src/app/page.tsx` (no `/feed` reference anywhere) |

**Net simplification:** 7 sections → 4. See `LOW_FIDELITY_WIREFRAMES.md`.

---

## Issues (list + detail)

| Category | Finding | Evidence |
|---|---|---|
| Duplicate information | Active/passed counts stated three times on the list header (hero line, duplicate stat tiles, filter-tab counts) | `IssuesPageClient.tsx:196-220` |
| Unnecessary complexity | Collapsed row renders 7 data points before any click (status, title, summary, MP Yes%, market probability + trend, participant count, sentiment bar, Yes/No/Abstain row) | `IssuesPageClient.tsx:59-109` |
| Duplicated systems | Market probability shown on the list row duplicates Forecasts' entire job | `IssuesPageClient.tsx:69-83` |
| Duplicated actions | Two separate Yes/No prediction mechanisms on one detail page (inline poll + market order-book) | `issue/[id]/page.tsx:124,135` |
| Fake information | "✓ You're with the majority — X% of Australians agree" misattributes a forecast-market figure as national public opinion | `DecisionCard.tsx:147-151` (embedded pattern also present on Issues-adjacent surfaces) |
| Overloaded page | Issue detail stacks 10 distinct content/interaction blocks with no progressive disclosure | `issue/[id]/page.tsx` (full page) |
| Information that belongs elsewhere | Full market order-book and full 150-row MP vote grid embedded rather than linked | `issue/[id]/page.tsx:135-136` |
| Duplicated systems | MP vote grid re-implements Government/People's evidence layer independently | `MPVoteGrid.tsx` |

**Net simplification:** collapsed row 7 data points → 2; detail page 10 blocks → 6, with 2 of those becoming one-line links instead of embedded widgets.

---

## Government + Parliament + Government Decision

| Category | Finding | Evidence |
|---|---|---|
| Fake information | Four header stat tiles are hardcoded literals, not computed — including "74% Predict Acc.," which contradicts Forecasts' own honest "not available yet" disclosure | `parliament/page.tsx:38-53` |
| Duplicated systems | Bill list duplicated between Issues and Parliament using different components | `IssuesPageClient.tsx` vs. Parliament's bill-feed components |
| Overloaded page | Five structurally different modules stacked on one scroll (priority focus, bill feed, your rep, chamber, education) | `ParliamentExperienceClient.tsx:183-289` |
| Fake information | `Decision`/`DecisionMaker` content is 100% mock, styled and worded as fact, with no source field in the type itself | `src/types/government.ts`, `mock-government-data.ts` |
| Fake information | `DecisionMaker.approvalRating`/`trustScore` — fabricated approval/trust numbers on real, named ministers | `mock-government-data.ts`, `src/types/government.ts:39-48` |
| Fake information | `HouseChamber.tsx`'s `generateScores()` — a second, independent, previously-unflagged fabricated MP score (id-string hash), live on both People and Parliament | `HouseChamber.tsx:15-39,257-261` |
| Duplicated actions | Decorative Yes/No poll on Decision cards discards input, doesn't persist | `DecisionCard.tsx` inline poll |
| Information that belongs elsewhere | Full independently-filterable bill list → should link to Issues, not re-list it | `ParliamentExperienceClient.tsx:202-256` |

**Net simplification:** Government/Parliament combined content 6 blocks → 4 once the bill list is cut; two live fabricated-score systems removed entirely, independent of any other redesign work.

---

## Forecasts + Forecast detail

| Category | Finding | Evidence |
|---|---|---|
| Overloaded page | Header row carries the hero count plus five unrelated controls (wallet balance, open positions, sign-in, +Propose, wallet toggle) | `PredictionsPageClient.tsx:219-286` |
| Duplicated systems | Wallet balance sourced from two independent implementations (`useWallet` localStorage vs. `usePredictionWallet` real) | `src/hooks/useWallet.ts`, `usePredictionWallet.ts` |
| Duplicated systems | Leaderboard duplicated as a hardcoded array across `/leaderboard` and an embedded section in Forecasts | `LeaderboardGrid.tsx`, `PredictionsPageClient.tsx:408-419` |
| Fake information | "+Propose" market-submission modal never persists past `localStorage`; carries a "Pending Review" badge implying real moderation | `ProposeMarketModal.tsx` (no `fetch` call anywhere in file) |
| Fake information | AI bull/bear case falls back to generic template text when no real analysis exists, with no visual distinction from populated cards | `MarketCard.tsx:191-212` |
| Fake information | Fake 24h-move/volume figures shown with the same visual authority as the real probability | `FeaturedMarketCard.tsx:110-127` |
| Information that belongs elsewhere | Live Election Pulse permanently mounted regardless of whether an election is active | `PredictionsPageClient.tsx:288` |
| Duplicated systems | Simulator strip re-appears here, as it does on Issue detail — a contextual tool given permanent board real estate | `RecentRehearsalsStrip`, `:290-292` |
| Overloaded page | No per-market detail page exists — dense evidence/history/AI content crammed onto list-grid cards instead | Confirmed absent: no `/forecasts/[id]` route |
| Information that belongs elsewhere | Forecast cards render no link back to the issue that motivated the market | `MarketCard.tsx` (full read, no such link) |

**Net simplification:** 9 header/board elements → 4 (hero, featured card, filters, grid); wallet/leaderboard/election/propose/simulator-strip all relocate or are removed.

---

## People + MP profile

| Category | Finding | Evidence |
|---|---|---|
| Duplicated systems | Full interactive chamber visualisation duplicated between People and Government/Parliament | `src/app/leaders/page.tsx:308-321` reuses `HouseChamber`/`SenateView` |
| Duplicated information | "How Parliament works" civic-education content built independently, twice, on People and on Government/Parliament | `leaders/page.tsx:216-241` vs. Parliament's `EducationAccordion` |
| Overloaded page | Chamber block and education card both precede the MP directory — the page's actual job is reached only after two unrelated blocks | `leaders/page.tsx` structure |
| Unnecessary complexity | Simulate-this button placed as the first interactive element on an MP profile, ahead of any evidentiary content | `mp/[id]/page.tsx:71-80` |
| Fake information (carryover, not yet fixed) | `POLITICIAN_SCORECARDS`/`PARTY_VOTE_MAP` — the exact defect already removed from `/mp/[id]` — remain live via `/impact` and `MPVoteGrid` | `mock-civic-data.ts`, `mock-data.ts` (still imported by both) |
| Duplicated actions | Electorate "find my MP" tool lives on Parliament, not People, with no link from its result to the MP's own profile | `MPActionStrip.tsx` (no `Link`/`href` to `/mp/[id]` found in file) |

**Net simplification:** People's pre-directory content 2 blocks (chamber + education) → 1 (a static composition strip); directory promoted to immediately below the hero.

---

## Political Pulse (redesign of `/feed`)

| Category | Finding | Evidence |
|---|---|---|
| Fake information | Reaction counts seeded from a mock array before the real ranked fetch resolves | `src/app/feed/page.tsx` (`FEED_POSTS` fallback, confirmed live) |
| Fake information | "↑ BOOSTED" badge implies a real significance signal; is an engagement-heuristic label | `src/app/feed/page.tsx:225-227,607-609` |
| Duplicated actions | `scoreToGrade` letter-grade badges reintroduce a scoring pattern already removed elsewhere for lacking a real methodology | `src/app/feed/page.tsx:10,196` |
| Information that belongs elsewhere | Share-for-points bonus (`bonusPoints=50`) is an engagement-loop mechanic, independent of the civic-alert content it's attached to | `src/app/feed/page.tsx:265-270` |
| Unnecessary complexity | Full social mechanics (reactions/comments/compose) layered over content that's mostly automated civic alerts, not human commentary | Architecture doc System 8; page structure |
| Fake information | Authorship (`source_agent_id`) is captured on write but dropped before reaching the client — bot-authored alerts are indistinguishable from human posts | Confirmed via architecture doc + `rowToFeedPost` |
| Information that belongs elsewhere | Six of twelve proposed content types (Committees/ABS/RBA/Treasury/Speeches/Source corrections) have no real pipeline — see `CONTENT_HIERARCHY.md` §3 | Data & Evidence Steward findings |

**Net simplification:** all engagement mechanics removed; content scope cut to the three evidence-supportable types for V1 (Parliament, Bills, Forecast events).

---

## Cross-cutting duplicate systems

Findings that span more than one page — fixing these once, centrally, prevents the same defect reappearing under a different page name in the redesign.

| Duplicated concept | Real instance (keep) | Fake/duplicate instance (remove) | Pages affected |
|---|---|---|---|
| Points wallet | `usePredictionWallet` (Supabase) | `useWallet` (localStorage) | Forecasts, Profile/Account, Daily Bonus Banner |
| Leaderboard | (does not yet exist as one real query — must be built) | Hardcoded array, duplicated across two call sites | Forecasts, `/leaderboard` |
| Bill/issue list | `issues` table via Issues | `mock-government-data.ts`'s `Decision` type; Parliament's independent bill-feed components | Issues, Government, Parliament |
| MP/politician score | None — not currently satisfiable, see `docs/MP_SCORE_METHODOLOGY_REQUIREMENTS.md` | `POLITICIAN_SCORECARDS`, `PARTY_VOTE_MAP`, `HouseChamber.tsx`'s `generateScores()`, `DecisionMaker.approvalRating`/`trustScore` — four independent live instances of the same defect | People, MP profile, Government, Parliament, `/impact`, Issue detail |
| Civic action / "take action" | `bill_pressures` via `CampaignModal` (once its `mailto:` gap is fixed) | `/campaigns`' standalone fake join/propose mechanic; `EmailMPButton`'s separate, parallel mailto flow | Issues, Government, Parliament |
| Electorate | (does not yet exist as one real service — hash-based lookup is not real geography) | Two independent, unsynced storage keys (`useElectorate` vs. `OnboardingModal`) | Parliament, onboarding, personalisation |
| Onboarding/personalisation | `OnboardingModal`'s real, persisting flow | The static `/onboarding` page (zero data collection) that both homepage CTAs currently link to instead | Today, onboarding |
| Person identifier scheme | `members.id`/`tvfy_id` (real, synced) | `MPIndex`'s mock id scheme (`mp-labor-2`); Community Leader's separate local id scheme; `/u/[handle]`'s unrelated citizen-profile scheme | People, MP profile, Government |
| Civic-education content | One collapsed accordion | Independently duplicated on People and Government/Parliament | People, Government |
| Market-proposal / civic-proposal submission | (does not yet exist as a real, persisted pipeline) | `ProposeMarketModal` (localStorage only, decorative) | Forecasts — and the precedent this must not repeat if Community is ever built |

**The pattern across all ten rows:** in every case, the real infrastructure already exists (or, where it doesn't, is named as a genuine build gap rather than assumed) — the defect is always a second, disconnected, often fabricated stand-in coexisting with it, not a missing feature. Simplification here means deletion of the stand-in, not new construction, in eight of the ten rows above.
