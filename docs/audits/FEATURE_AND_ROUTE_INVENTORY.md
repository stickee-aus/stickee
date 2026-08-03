# Stickee — Feature & Route Inventory

Read-only inventory. Status definitions: **Working** (real data, real logic, server-verified) · **Partial** (real backend exists but with a mock fallback, an unwired piece, or a fake supporting field) · **Demo** (hard-coded/mock data presented as if live) · **Broken** (code path errors or contradicts its own UI claim) · **Stub** (placeholder with no real logic).

## Pages / Features

| Path | Purpose | Auth | Admin | Primary files | Data source | Status | Production readiness | Major risks | Tests |
|---|---|---|---|---|---|---|---|---|---|
| `/` | Homepage: hero, pillar scores, decisions | No | No | `src/app/page.tsx` | `mock-civic-data.ts`, `mock-government-data.ts` | **Demo** | Not ready — entirely fabricated content on the front door | Sets user expectations with fake civic scores/decisions | None |
| `/issues`, `/issue/[id]` | Issue detail/list: votes, predictions, MP grid | No | No | `issues-db.ts`, `mock-data.ts`, `mock-market-data.ts` | Supabase-first, mock fallback | **Partial** | Not ready until fallback is removed or clearly labeled | User can't tell if an issue is real or filler; `whoSupports`/`whoOpposes` claims uncited (see Data & Content Audit) | None |
| `/decisions` | Filterable government-decisions feed | No | No | `src/app/decisions/page.tsx` | `mock-government-data.ts` | **Demo** | Not ready | Presents fictional decisions as government record | None |
| `/parliament` | Bills, chamber view, MP alignment | No | No | `lib/parliament-db.ts` | Supabase-first, mock fallback (has an "illustrative/demo" disclosure footer — the one page that self-discloses) | **Partial** | Closer to ready than peers due to disclosure, but still hybrid | Chamber view decorates real MPs with a mock `stickeeScore` hardcoded to 0 | None |
| `/mp/[id]`, `/leaders`, `/leaders/[id]` | MP/leader directory & profiles, Stickee Score | No | No | `mock-data.ts`, `mock-leaders-data.ts`, `mock-market-data.ts`, `mock-civic-data.ts` + live hooks (`useLiveParliamentMembers`, `useLiveElection`) | Mostly mock, some live hook overlay | **Broken** | **Not launch-safe** | UI claims Stickee Score reflects individual voting record; it's actually party-line over fictional issues (P0 — see Data & Content Audit) | None |
| `/predictions` | Bill prediction markets (System B UI) | No | No | `lib/predictions-db.ts`, `mock-market-data.ts` | Supabase-first, mock fallback | **Partial/Broken** | Not ready — no resolution path exists for the underlying wallet system | Users can stake on stale, already-past-date markets with no server check | None |
| `/leaderboard` | Prediction leaderboard + user rank | No | No | `LeaderboardGrid.tsx`, `mock-market-data.ts` | 100% mock array + hardcoded `MOCK_RANK = 14` | **Demo** | Not ready | Presented as a live ranking; pulls "your balance" from a disconnected localStorage-only wallet, not the real Supabase wallet | None |
| `/impact` | National civic scorecard | No | No | `src/app/impact/page.tsx` | `mock-civic-data.ts` | **Demo** | Not ready | Fabricated national indicators | None |
| `/campaigns` | Email-your-MP campaign trackers | No | No | `src/app/campaigns/page.tsx` | Hardcoded inline array | **Stub** | Not ready | No persistence, progress numbers are static | None |
| `/simulator` | Multi-agent forecasting sandbox | No | No | `simulator-engine.ts`, `mock-simulator-data.ts` | 100% mock, self-contained | **Demo (by design)** | Acceptable as an explicitly-labeled toy, not as a market input | None found tying it to the wallet — good isolation, but confirm the UI actually labels it as a sandbox | None |
| `/feed` | Social feed, reactions, comments, posting | No (gates actions) | No | `src/app/feed/page.tsx`, `/api/feed/ranked`, `lib/feed/ranker.ts` | Supabase real + `mock-feed-data.ts` seed | **Partial** | Not ready — bot-authored posts unlabeled | `source_agent_id` is fetched then dropped before reaching the UI, so agent-generated "civic alert" posts are indistinguishable from human posts | None |
| `/notifications` | Notification inbox | No | No | `useNotifications` hook | localStorage + hardcoded `DEMO_NOTIFICATIONS` | **Demo** | Not ready | Nothing here is real for any user | None |
| `/profile` | User civic profile, streaks, badges | Hardcoded `DEMO_USER.isLoggedIn = true` | No | `src/app/profile/page.tsx` | Hardcoded demo user + mock data | **Broken** | Not ready | Does not appear to reflect actual session state; logged-out view is dead code | None |
| `/u/[handle]` | Public user profile | No | No | `MOCK_PROFILES` (`useFollows.ts`), `mock-feed-data.ts` | 100% mock | **Demo** | Not ready | Any handle likely resolves to fabricated profile data | None |
| `/onboarding` | "How to use Stickee" guide | No | No | `src/app/onboarding/page.tsx` | Static content, no persistence | **Stub** | Fine for launch as static content, but distinct/disconnected from `/api/onboarding` which *does* persist — confusing duplication | None |
| `/government` | Legacy alias | No | No | `src/app/government/page.tsx` | Redirects to `/decisions` | **Stub** | Harmless, but dead/legacy route to clean up | None | None |
| `/donate`, `/donate/success`, `/donate/cancel` | Donation flow | Optional | No | `DonateAmountForm.tsx`, `/api/donations/checkout`, `/api/donations/webhook` | Stripe + Supabase (real) | **Working** | Ready, modulo standard PCI/Stripe-account production checklist | None significant found; amount is server-clamped, webhook HMAC-verified | None |
| `/auth/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/auth/callback` | Auth flows | N/A | No | Supabase Auth | Supabase (real) | **Working** | Ready | Standard Supabase auth risk surface only | None |
| `/admin`, `/admin/activity`, `/admin/agents(/[id])`, `/admin/analytics`, `/admin/users` | Admin console | Yes | Yes | `admin/layout.tsx`, `admin/_lib/guard.ts`, per-page files | Supabase (real) | **Working**, with a caveat | Mostly ready | Mutating actions are all individually admin-gated (good); several read-only pages rely solely on the parent layout's check rather than re-verifying themselves (defense-in-depth gap, no demonstrated bypass) | None |

## API Routes

| Route | Purpose | Auth | Data source | Status | Risks |
|---|---|---|---|---|---|
| `/api/agents/[id]` (POST/GET) | Trigger a background agent | Secret header/bearer | Supabase | Working | GET without secret is a no-op liveness probe only — fine |
| `/api/sync/members`, `/api/sync/divisions` | Sync real parliament data | Secret header/bearer | TheyVoteForYou → Supabase | Working | Rate/quota exhaustion on TVFY not verified |
| `/api/election/live` | Live AEC results | None | AEC scrape | Working | Scrape-target HTML changes could silently break parsing — no alerting |
| `/api/electorate-lookup` | Lat/lng → electorate | None | Hardcoded state bounding boxes + mock MP map | **Broken/Demo** | Not a real geographic lookup ("hash-based, not truly geographic" per code); anything downstream that personalizes by electorate is unreliable |
| `/api/bills/[billId]/pressure` | Record support/oppose stance | Optional (session id for anon) | Supabase | Partial | Anonymous submissions trust a client-supplied `sessionId` as the upsert key — low-impact griefing vector, no PII/points at risk |
| `/api/bills/pressure-summary` | Aggregate stance counts | None | Supabase | Working | — |
| `/api/donations/checkout`, `/webhook` | Stripe payment flow | Webhook: signature; checkout: optional user | Stripe + Supabase | Working | — |
| `/api/feed/post`, `/api/feed/react` | Post/react to feed | Yes (401 if anon) | Supabase | Working | — |
| `/api/feed/ranked` | Ranked feed | None | Supabase + mock fallback | Partial | Drops `source_agent_id` before returning to client — see Data & Content Audit |
| `/api/leaders/[id]/support` | Endorse a nominated leader | Yes (401 if anon) | Mock identity data + Supabase insert | Partial | Endorsement is against a mock leader record |
| `/api/onboarding` | Persist onboarding choices | Soft (no-ops if anon) | Supabase | Working | — |
| `/api/parliament/members` | MP roster | None | Supabase → TVFY → mock fallback chain | Partial | Silent fallback to mock data on upstream failure, no user-visible indicator |
| `/api/auth/sign-in-otp`, `/api/auth/status` | Auth utilities | None / self | Supabase | Working | — |

## Referenced-but-missing endpoints

`src/components/EndorsementPanel.tsx:8` and `src/components/NominationModal.tsx:3` contain TODOs for rate limiting on `/api/endorsements` and `/api/nominations` — **neither endpoint exists in the codebase**. These components either call a different/older route, are dead UI, or are calling nothing (needs a direct check before contractor work is scoped against them — do not assume they're just "missing rate limiting," they may be non-functional entirely).

## Cross-cutting items required by the audit brief

- **Wallet/prediction points**: see `MARKET_ENGINE_AUDIT.md` — staking works and is atomic; there is no settlement/payout path at all.
- **Market creation / proposal**: `ProposeMarketModal.tsx` has full client-side state (`pending|approved|rejected`) but **never persists to any table** — a market "proposal" is entirely theatrical today.
- **Market closing / resolution**: no admin UI or code path found for closing/resolving System B (`issue_markets`/`wallet_positions`) markets at all.
- **User management**: real, under `/admin/users` — ban/unban/promote/demote/delete, all individually gated server actions, self-demotion/self-deletion blocked.

## Testing status (applies to every row above)

There is no test suite in the repository at all (no `*.test.*`, `*.spec.*`, or test runner config). Every "Tests" cell above is empty because there is nothing to cite — this is a blanket gap, not a per-feature one. See `TEST_AND_VERIFICATION_REPORT.md`.
