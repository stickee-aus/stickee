# Stickee workflow QA report

Date: 8 October 2026  
Environment: local Next.js 16.2.1 development server plus disposable Supabase CLI stack on `127.0.0.1` (`54321` API, `54322` PostgreSQL); migrations 001–027 applied from zero; no Stripe credentials loaded into the app; Phase 4 continuation below verifies remaining local workflows  
Source inventory: `docs/qa/workflow-source-inventory.json` (33 pages, 95 interactive files, 241 direct controls)

## Evidence rules

- **Browser** means the route and interaction were observed in the local browser.
- **Source** means the implementation was inspected but the consequential or unavailable backend boundary was not exercised.
- **Hypothesis** is never counted as passing evidence.
- An empty or unavailable state can pass as a truthful UI while its authenticated or real-data workflow remains blocked.

## Workflow matrix

| Route / workflow | User goal and primary controls | Prerequisite | Expected result / failure behaviour | Status | Evidence |
|---|---|---|---|---|---|
| `/` overview | Understand Stickee; links to Issues, Government, Forecasts, onboarding, scenarios and action | None | Clear destinations; truthful empty national/decision/forecast summaries | PASS | Browser: desktop/mobile, keyboard order, visible focus, navigation |
| `/issues` discovery | Filter All/Active/Passed/Rejected; open an issue | None | Filter changes list; demo records visibly classified | PASS | Browser: filter, open detail, Back, refresh, desktop/mobile |
| `/issue/[id]` detail | Read an issue; follow related destinations | Valid issue id | Demo banner precedes illustrative claims; unknown id must not imply verified data | PASS (demo path) / BLOCKED (real data) | Browser: `housing-affordability`; source classification. Supabase unavailable |
| `/parliament` | Understand activity, representative and chamber; expand education | Verified parliamentary source for live data | Truthful unavailable states; education accordion expands | PASS (unavailable path) / BLOCKED (live path) | Browser: desktop/mobile, accordion; no mock bill/count/tally |
| `/government` | Reach canonical Government surface | None | Redirects to `/parliament` | PASS | Browser redirect observed |
| `/leaders` | Search representatives; switch House/Senate; open profile | None for labelled reference data | Search and tabs update; data classification remains visible | PASS (demo/reference path) / BLOCKED (live sync) | Browser: search, Senate tab, desktop/mobile |
| `/mp/[id]` | Read representative record | Known member id | Static reference is explicitly unverified | PASS (reference path) / BLOCKED (live data) | Browser: `/mp/mp-ca-1` |
| `/leaders/[id]` | Read community-nominated leader | Verified and consenting person | Honest unavailable state when absent | PASS | Browser: unavailable route |
| `/predictions` | Browse/filter forecasts; read methodology | Verified open forecast; account for participation | Honest zero state; education expands; no fake markets | PASS (empty path and wallet/stake access path) / BLOCKED (real forecast participation) | Browser: filters/accordion/responsive. Local HTTP/PostgREST: wallet initialisation, permitted stake, and over-balance rejection passed using disposable data |
| `/leaderboard` | View real predictor rankings | Resolved real predictions | Honest unavailable state rather than fake users | PASS (empty path) / BLOCKED (real rankings) | Browser: desktop/mobile |
| `/feed` | Review chronological civic events; filter categories | Verified feed rows | Immediate honest empty state when backend unavailable | PASS (empty path) / BLOCKED (live feed) | Browser after short-circuit fix; source request path |
| `/notifications` | Review activity; mark/clear; follow empty-state next step | Populated local/account notifications | Heading present; truthful empty explanation links to Issues | PASS | Browser: authenticated welcome notification and unread count. Local HTTP/PostgREST: owner mark-read allowed; client insert and content rewrite denied |
| `/campaigns` | Find a meaningful civic action | Verified recipient, stage and confirmation method | No invented counts/deadlines/outcomes; link to Issues | PASS (unavailable path) | Browser desktop/mobile after removal of examples |
| `/impact` | Understand national civic indicators | Current sources and scoring methodology | No placeholder score; explicit evidence requirements | PASS (unavailable path) | Browser desktop/mobile screenshot after removal of mock score |
| `/simulator` | Compare policy scenarios | Inspectable model, assumptions and evidence | Synthetic recommendations withheld until methodology exists | PASS (unavailable path) | Browser desktop/mobile after removal of mock recommendations |
| `/profile` | Review verified account activity | Authenticated account and verified records | Local-only streaks, points, badges and mock grades are not represented as account data | PASS (local authenticated fixture) / BLOCKED (provider-backed real records) | Browser: ordinary authenticated profile and refresh persistence. Local HTTP/PostgREST: owner profile edit allowed; `civic_score` forgery denied |
| `/u/[handle]` | View a public community profile | Verified public profile | Demo identities, scores, followers and posts are withheld | PASS (unavailable path) | Browser `/u/demo-user` |
| `/onboarding` | Learn the basic Stickee loop | None | Links to electorate/Issues/Forecasts without claiming unavailable points mechanics | PASS | Browser desktop/mobile; source copy review |
| `/decisions` | Review executive decisions | Verified executive-decision source | Honest unavailable state | PASS (unavailable path) / BLOCKED (real data) | Browser desktop/mobile |
| `/auth/sign-in` | Magic link, password or Google sign-in | Working Supabase test environment | Invalid email blocked; pending buttons prevent repeat submit; authenticated state persists | PASS (local password and Mailpit magic link) / BLOCKED (Google completion) | Phase 4: cookie-backed PKCE magic link completes to `/profile`; Google reaches the local disabled-provider error without contacting Google. Ordinary/admin mobile navigation, refresh, Back and sign-out pass |
| `/auth/sign-up` | Complete four-step account creation | Working Supabase test environment | Invalid step cannot advance; Back preserves entered name; final creation creates an ordinary account only | PASS (local Auth API, validation and complete browser signup) | Browser: step validation/cancel recovery. Local Auth HTTP: disposable ordinary and admin-candidate accounts created; only explicit database fixture received admin membership. Phase 4: all four signup steps completed in Chromium; resulting account authenticated and was not an administrator |
| `/auth/forgot-password` | Request reset email | Working Supabase test environment | Required/email validation; recovery message reaches isolated mailbox | PASS (local delivery) | Local Auth HTTP plus Mailpit: recovery request accepted and message delivered to disposable `.invalid` address |
| `/auth/reset-password` | Set matching new password | Valid recovery session | Reject mismatch; change password through recovered session | PASS (real local Auth + Mailpit) | Phase 4: browser recovery link → callback → reset form → update; mismatch rejected; old password returns 400 and new password authenticates the same disposable account |
| `/donate` | Select cadence/amount and start checkout | Configured test payment environment and migration 027 | Zero custom amount disables CTA; selected amount/cadence update; browser retry key plus Stripe idempotency prevent duplicate sessions | BLOCKED (provider) | Browser: amount/cadence/invalid state only. Unit/source: persistent attempt id and idempotency header. No checkout initiated |
| `/donate/cancel` | Recover after cancellation | None | Clearly confirms no payment | PASS | Browser desktop/mobile |
| `/donate/success` | Understand donation result | Genuine provider redirect in test flow | Server retrieves Checkout Session; only `payment_status=paid` receives success copy; absent/unpaid/unverifiable sessions do not claim a donation | PASS (unverified-session path) / BLOCKED (provider-paid path) | Browser: direct URL displayed “Payment not verified”. Unit/source: Stripe retrieval and environment checks. No payment performed |
| `/admin` | View operations dashboard | Authenticated authorised admin | Anonymous/ordinary users denied; fixture admin receives dashboard | PASS (local) | Browser: anonymous and ordinary denial, admin dashboard, refresh persistence and sign-out revocation |
| `/admin/activity` | Review activity | Admin | Same protected boundary | PASS (local) | Browser: authenticated fixture admin route and heading; independent server guard verified |
| `/admin/agents` | Review agents | Admin | Same protected boundary | PASS (local) | Browser: authenticated fixture admin route and heading; independent server guard verified |
| `/admin/agents/[id]` | Review and run one agent | Admin and valid agent | Persist toggle and manual run; deny ordinary/anonymous access | PASS (local real records) | Phase 4: seeded `moderation-triage` detail, toggle, manual zero-report run, PostgreSQL run status and refresh persistence; original agent restored and new run deleted |
| `/admin/analytics` | Review analytics | Admin | Same protected boundary | PASS (local) | Browser: fixture data, header admin state, refresh and Back persistence |
| `/admin/markets` | Review forecast administration | Admin | Same protected boundary | PASS (local) | Browser: authenticated fixture admin route and heading |
| `/admin/users` | Review users | Admin | Same protected boundary | PASS (local) | Browser: authenticated fixture admin route and heading |

## Cross-cutting control families

| Control family | Goal / handler or destination | Success feedback | Failure / recovery | Status |
|---|---|---|---|---|
| Primary and mobile navigation links | Move among Today, Issues, Government, Forecasts and People | Route title/H1 changes; active destination visible | Browser Back returns to prior route | PASS — browser desktop/mobile; Phase 4 additionally covers authenticated ordinary/admin mobile sessions |
| Shared buttons and link-buttons | Trigger local state or navigate | Consistent editorial styling | Global `:focus-visible` outline now applies to shared buttons | PASS — keyboard browser evidence |
| Tabs and filters | Change a local list/view | Selected state/list changes | Empty results retain context | PASS — Issues, Forecasts, People, Feed tested where data permits |
| Search | Narrow representative directory | One matching result for “Sharkie” | Empty-result implementation present; real dataset remains labelled | PASS — browser |
| Accordions | Reveal explanatory material | `aria-expanded` changes false→true | Repeat click collapses by same handler | PASS — Parliament and Forecasts browser evidence |
| Forms | Auth, donation and account setup | Native/local validation and pending/disabled states | Local signup, recovery and magic-link completion verified | PASS (local auth); BLOCKED (Stripe provider) |
| Dialogs/modals | Stake, campaign, nomination, comments and support actions | Implementations inventoried in source | Not reachable in truthful empty preview or consequential action prohibited | NOT TESTED interactively; source inventoried |
| Icon-only controls | Notifications, password visibility, close/dismiss and dev-only controls | Accessible names present where browser-exposed | Source inventory flags dynamic/icon-only labels for follow-up | PASS for exposed header notification; NOT TESTED exhaustively for unreachable dialogs |

## Confirmed findings, prioritised

1. **Critical trust — fixed:** fabricated civic score, indicators and trends were public on `/impact`.
2. **Critical trust — fixed:** mock scenario engine issued synthetic “best for the country” recommendations without inspectable methodology.
3. **Critical trust — fixed:** public community profiles exposed fake identities, scores, followers and reactions.
4. **High trust — fixed:** Campaigns mixed a demo disclaimer with invented participation counts, deadlines and promised civic outcomes.
5. **High usability — fixed:** Political Pulse waited on an unavailable backend and appeared blank.
6. **High accessibility — fixed:** shared CTA buttons suppressed the global keyboard focus outline.
7. **High clarity — fixed:** Notifications lacked an H1 and directed users toward unavailable predictions, MP email and streak mechanics.
8. **High performance — fixed:** anonymous admin routes waited on unavailable auth instead of rendering their protected state immediately.
9. **High trust — fixed:** Profile and sign-in copy promised local-only grades, streaks, badges, bonus points and one-tap civic actions.
10. **Critical payment security — fixed in code, migration prepared:** webhook signatures now enforce a five-minute timestamp tolerance, accept rotated signatures safely, reject test/live mismatches, claim events atomically, retry failed/stale claims, and acknowledge completed duplicates without reprocessing.
11. **Critical payment integrity — fixed in code, migration prepared:** checkout requests carry a stable browser attempt UUID to both a unique donation record and Stripe's idempotency header; an unrecorded attempt fails closed before Stripe is called.
12. **Critical payment truthfulness — fixed:** the success route retrieves the Checkout Session server-side and never renders success unless Stripe reports `payment_status=paid` in the matching test/live environment.
13. **High authorisation — fixed in code:** every admin page now independently checks administrator status before constructing a service-role client; authorization checks no longer mutate `app_admins`; the service-role factory is marked server-only.
14. **Critical database permissions — applied locally in Phase 3, not hosted:** authenticated clients lose donation insertion, notification insertion/content mutation, and `civic_score` mutation; privileged RPCs lose default PUBLIC execute.
15. **High scoring integrity — fixed in code, migration prepared:** civic-score awards move from a read/modify/write plus feed-post heuristic to an atomic per-issue/user award ledger.
16. **High reliability — fixed and verified:** wallet and notification Realtime hooks could race during hydration/React remounts and attempt to mutate an already-subscribed channel. Loads are now generation-safe and notification topics are instance-scoped with explicit replacement/removal.
17. **High authentication clarity — fixed and verified:** the header could display “Sign in” while the server-rendered admin layout had a valid session. It now renders from the server-verified `/api/auth/status` result; refresh and sign-out transitions passed in the browser.
18. **Fresh-install migration ordering — fixed and verified:** migrations 021 and 023 assumed issue/member rows introduced or synchronised later. The slice now defers safe links/enrichment to migrations 025/026, allowing migrations 001–027 to apply from an empty local database.
19. **Unresolved provider boundary:** Stripe sandbox checkout/provider-confirmed payment still requires fresh test credentials. CLI is installed and forwarding is prepared. Google OAuth requires a test client; local Mailpit magic-link and recovery completion now pass.
20. **Authentication — fixed in Phase 4:** recovery bypassed PKCE exchange, magic links used an incompatible implicit-flow client, callback redirects changed loopback hosts, and persistent headers could remain signed out after Server Action login. Existing auth paths now use the shared cookie-backed client, recovery callback, same-host redirect, and navigation-triggered status refresh. Verified against real local Auth and Chromium.

## Security remediation verification

| Boundary | Status | Evidence |
|---|---|---|
| Webhook timestamp replay protection | PASS (unit) / BLOCKED (Stripe CLI) | Valid/current, stale, future, malformed, wrong and rotated-signature cases passed locally |
| Persistent event deduplication and retry | PASS (local database) / BLOCKED (Stripe CLI) | Migration 027 applied; first claim, completed duplicate denial, failed-event retry and stale-processing recovery passed against PostgreSQL |
| Duplicate checkout prevention | PASS (static/unit) / BLOCKED (Stripe API) | Attempt UUID, unique index and Stripe idempotency header verified in code; no Session created |
| Provider-confirmed success page | PASS (negative browser path) / BLOCKED (paid path) | Direct `/donate/success` shows “Payment not verified”; no sandbox payment performed |
| Anonymous administrator denial | PASS | Browser `/admin` shows “Sign in required”; all privileged page reads have independent source guards |
| Ordinary/admin separation | PASS (local) | Disposable ordinary/admin accounts exercised through Auth, PostgREST and browser; ordinary `/admin` denied and explicit `app_admins` member admitted |
| Donation/notification/profile grants | PASS (local database) | SQL suite plus ordinary-user HTTP checks: paid donation forgery, notification insert/content mutation and civic-score mutation denied; permitted owner operations passed |
| Civic-score award idempotency | PASS (local database) | Service-only atomic award succeeded once and returned false on duplicate; browser/client mutation remained denied |

## Tests executed for security remediation (historical Phase 3; not repeated wholesale)

- `npx vitest run` — 28 files, 629 tests passed.
- `npx tsc --noEmit` — passed.
- `npm run lint` — passed with zero warnings.
- `npm run secret-scan` — passed; no suspicious patterns found.
- `git diff --check` — passed.
- `NEXT_PUBLIC_SUPABASE_DISABLED=true npm run build` — passed after permitting only the configured Google Font downloads; 46 pages generated.
- Fresh local migration replay: `npx supabase db reset --local --yes` applied migrations 001–027 and seed from zero.
- `supabase/tests/002`–`006` via local PostgreSQL — all passed, including actual RLS/RPC/PostgREST-role behaviour.
- `node scripts/qa-local-integration.mjs` — 11/11 Auth/PostgREST checks passed; disposable fixtures removed by the script.
- Browser: ordinary/admin password sign-in, session persistence, `/profile`, populated `/notifications`, ordinary/anonymous admin denial, all reachable admin list routes, Back/refresh, header state and sign-out revocation passed.
- `git diff --check` — passed during security remediation; rerun is listed in the final handoff if still clean.

## Screenshots

- Desktop, 1440×900: corrected `/impact` unavailable state captured in the browser audit.
- Mobile, 390×844: corrected `/parliament` unavailable state and fixed bottom navigation captured in the browser audit.

## Phase 4 continuation — 8 October 2026

### Scope and evidence

Reused the existing local Supabase stack and migrations 001–027. No reset or migration was performed in this continuation. Replaced the existing local port-3000 process with a Next.js process explicitly using loopback Supabase credentials and blank external-service credentials. Saved environment files and pre-existing uncommitted work were preserved.

| Outstanding check | Result | Evidence and scope |
|---|---|---|
| Password reset completion | PASS | Real GoTrue recovery email captured by Mailpit, browser callback, mismatched-password rejection, successful update, old-password rejection and new-password acceptance for the same disposable user |
| Magic link completion | PASS, local service | Real GoTrue/Mailpit → browser PKCE callback → authenticated `/profile`. This is not external SMTP delivery evidence |
| Google OAuth | PASS at configured boundary; provider completion BLOCKED | Clicking Google reached loopback Auth’s “provider is not enabled” error. No Google account or external provider session used |
| Ordinary mobile navigation | PASS | Chromium 390×844; all five primary links, active state, loaded heading, no horizontal overflow on primary pages, notifications, refresh, Back and sign-out |
| Administrator mobile navigation | PASS | Same five primary routes plus admin entry and sign-out; verified authenticated header and persisted session |
| Valid administrator-agent records | PASS | Real seeded `moderation-triage` record; enabled toggle persisted, manual run recorded `ok`, `manual`, zero processed rows and a finished timestamp. Detail survived refresh. Ordinary/anonymous users had no run control. Pre-existing agent restored exactly; only the new run removed |
| Four-step signup completion | PASS | All four form steps completed; persisted profile belongs to an authenticated ordinary user; fixture removed |
| Synthetic webhook delivery → database | PASS, simulated events / real database | Six new handler-integration tests cover stale replay, forged signature, live/test mismatch, paid transition, concurrent completed-event deduplication, failed-event retry after missing-row repair, expiry, async failure and unpaid→async-success transitions. Actual handler and PostgREST/RPC used; Stripe did not send these events |
| Stripe CLI | PASS | Installed with existing npm tooling, `npx --yes @stripe/cli --version` → **1.53.1**; project dependency files unchanged by this continuation |
| Stripe forwarding setup | PREPARED; authentication required | `scripts/qa-stripe-local.mjs check` passes; start mode accepts only explicit `sk_test_` credentials, uses loopback Supabase, captures the webhook secret without printing it, and forwards the four handled Checkout event types to port 3001. Live-key-shaped input rejection tested |

Browser fixtures used `.invalid` addresses; browser requests to external hosts were blocked. First-visit onboarding was marked complete only in disposable browser storage; the cookie banner was dismissed, and the development-only Next.js indicator hidden for mobile clicks. No real civic messages, reports or external agent polls were triggered. Account fixtures were deleted and the agent catalogue/run history restored. Final independent read-only queries found zero remaining Phase 4 profiles, simulated donation records or simulated webhook events. Mailpit retains local test messages; their accounts have been deleted.

### Targeted changes

- `src/app/auth/forgot-password/actions.ts`: send recovery through the existing code-exchange callback.
- `src/app/auth/sign-in/actions.ts`: use the shared cookie-backed PKCE client for magic links.
- `src/app/auth/callback/route.ts`: preserve the browser host with a relative redirect, so loopback cookies remain usable.
- `src/hooks/useAuthStatus.ts`: refresh server-verified header state after navigation, including Server Action login.
- Added `scripts/qa-phase4-browser.mjs`, `scripts/qa-stripe-local.mjs`, two focused test files, and `docs/qa/phase-4/` evidence. No new product features or migrations.

### Checks actually executed in this continuation

- `node scripts/qa-phase4-browser.mjs` and focused subsets: seven workflow outcomes above plus fixture cleanup. Initial failures exposed the auth defects; reruns were limited to affected workflows, harness corrections and an incomplete screenshot.
- `npx vitest run src/lib/__tests__/email-auth-workflows.test.ts`: **4/4 passed** (mocked action/callback regression tests; local browser tests supply real Auth evidence).
- `STICKEE_LOCAL_WEBHOOK_QA=1 npx vitest run src/lib/__tests__/webhook-local.integration.test.ts`: **6/6 passed**, real loopback database with synthetic signed events and fixture cleanup. Default test runs skip these unless explicitly opted in.
- `npx tsc --noEmit`: passed.
- Targeted ESLint for the changed auth files, added scripts and tests: passed with zero warnings.
- Stripe launcher preflight and live-key-shaped input refusal: passed without contacting Stripe.
- `npm run secret-scan` and `git diff --check`: passed after the changes. Final TypeScript and targeted ESLint also passed. No full-suite/build rerun was needed; prior Phase 3 results are retained above.

The initial sandboxed webhook run could not connect to loopback (EPERM); the approved local-network run exposed invalid test-event IDs. Correcting fixture IDs to the database’s required Stripe shape produced the passing run. These harness failures are not counted as product failures or passing evidence.

Screenshots: [recovery completion](phase-4/password-reset.png), [ordinary mobile](phase-4/mobile-ordinary.png), [administrator mobile](phase-4/mobile-admin.png), [valid agent detail](phase-4/agent-detail.png). Browser result JSON files record executed subsets; `additional-browser-evidence.json` preserves the OAuth and agent subcheck results from earlier process output. The agent screenshot predates the final header fix and is evidence of the detail/run records only.

### Provider matrix still required

| Stripe scenario | Current evidence | Provider-backed result |
|---|---|---|
| Checkout creation, one-time and monthly | Historical source/unit contracts; launcher ready | BLOCKED — fresh test credentials |
| Same-attempt checkout idempotency | Historical unique-index and idempotency-header checks | BLOCKED — no actual Checkout Session created |
| Successful card payment and verified success page | Synthetic handler marks matching local donation paid; historical negative success-page browser test | BLOCKED — no Stripe payment or paid redirect |
| Card decline and recovery | Async-failure event simulated; **not equivalent to a card decline** | BLOCKED |
| Cancellation | Historical direct cancellation-page UI pass; **not a hosted Checkout cancellation** | BLOCKED |
| Abandoned checkout / expiry | Synthetic expired event changes local donation to failed | BLOCKED — no real Session expiry |
| Stale webhook replay rejection | Historical signature unit tests plus new signed-handler rejection with no DB claim | BLOCKED for captured provider delivery replay |
| Event deduplication / concurrent redelivery | Real local ledger, synthetic event, one processing attempt | BLOCKED for Stripe redelivery |
| Failed delivery and retry | Handler returns 500 for missing donation, same event succeeds after local repair, attempts=2 | BLOCKED for Stripe-scheduled retry/CLI delivery |
| Donation and event state transitions | Real local PostgREST with simulated event payloads | BLOCKED for end-to-end Stripe transitions |

No provider-backed payment result is claimed. No provider tests were silently counted as passing. The forwarding launcher’s `start` branch is authored but **not executed**, because it requires fresh account credentials.

## Remaining prerequisites and limitations

- Existing Stripe CLI configuration contains only a test key, with recorded expiry **17 May 2026**. It was not loaded into the app, sent to Stripe, or printed. Refresh account authentication or provide a fresh test-mode key privately. No live key is acceptable.
- Google OAuth completion requires a Google test OAuth client enabled in the isolated Supabase Auth configuration and matching local callback/redirect URLs. Existing disabled configuration was not changed.
- Mailpit verifies local email issuance and consumption; external SMTP deliverability and production redirects remain unverified.
- The report’s civic-data/live-data blockers still require verified records and external feeds. Do not populate them with invented fixtures and call them verified data.
- Staking, nomination, comments and live civic-action dialogs with no truthful reachable entry point remain outside available interactive coverage. Previously passing wallet/stake/RLS checks were not repeated; no new feature or artificial UI entry point was introduced to expose dormant dialogs.
- The isolated agent check runs the existing database-only zero-report path; it does not certify external ingestion, real moderation outcomes, financial logic, or all seven agent implementations.
- No production access, hosted migrations, commits, pushes or deployments occurred. No new migrations were created. No live Stripe credentials or real payments were used.

## Stripe handoff

1. Authenticate locally with `npx --yes @stripe/cli@1.53.1 login`, selecting test/sandbox access only, or supply a fresh `sk_test_` secret privately in the process environment. Do not paste credentials into chat. [Stripe authentication documentation](https://docs.stripe.com/cli/api_keys.md).
2. Stop the earlier local Next.js QA process before starting a second dev server in this checkout (Next uses a shared dev lock). Keep the local Supabase stack running.
3. With an explicit fresh `STRIPE_SECRET_KEY`, run `node scripts/qa-stripe-local.mjs start`. Default webhook destination is `http://127.0.0.1:3001/api/donations/webhook`; checkout UI is `http://localhost:3001/donate`. The launcher obtains the matching signing secret privately and starts test-only forwarding. [Stripe forwarding documentation](https://docs.stripe.com/cli/listen.md).
4. Execute the provider matrix above with Stripe test cards and actual Checkout Sessions linked to disposable local donation records. Preserve the distinction between a CLI-generated fixture and a real hosted Checkout payment. Cleanup only IDs created by that test run.
5. Ctrl-C stops app and listener; no hosted endpoint registration needs rollback. The local credential bridge lives outside the repository at `/private/tmp/stickee-qa-env.json` (mode 0600). If missing after restart, regenerate it from the **local** Supabase CLI status; never substitute the saved remote `.env.local` configuration.

Completion ledger: eight local/preparation/reporting outcomes met; one provider outcome handed off for fresh Stripe test credentials. This is not full provider verification.

## Follow-up: Forecasts Realtime runtime error

The user subsequently reported `cannot add postgres_changes callbacks ... after subscribe()` in `PredictionsPageClient`. The earlier navigation checks did not collect browser `pageerror` events, so they did not establish absence of runtime errors.

Fixed the component’s subscription lifecycle: synchronous setup makes cleanup available immediately, and a unique topic per effect prevents Strict Mode/remounts from reusing a subscribed channel while removal is pending. Retained the pre-existing Supabase configuration guard. No wallet, staking, permissions or database behavior changed.

Added `src/lib/__tests__/prediction-realtime-lifecycle.test.ts`: **3/3 passed**. Tests retain the installed SDK’s real channel lookup and callback guard, while replacing socket connection/removal to model pending teardown. They reproduce the old topic-reuse error and cover remount plus simultaneous instances. TypeScript, targeted ESLint and diff check passed. A fresh anonymous Chromium context against the isolated local server completed **five Forecasts remounts and a reload with zero browser runtime errors**, collected through `pageerror`. No database writes, migrations, production operations, commits or deployments were performed for this fix.
