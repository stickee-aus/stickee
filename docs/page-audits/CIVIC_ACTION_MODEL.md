# Civic Action Model — "How can I influence this?"

Governed by [`AGENTS.md`](../../AGENTS.md). New in this audit generation. Replaces the ad hoc "Email your MP" / "Contact MP" / "Take a Stance" / "My Campaign" scatter with one contextual model, per the audit brief's explicit instruction not to treat email as the default or only civic action.

## Audit of current mechanisms

| Mechanism | Where | Real? | Works end-to-end? |
|---|---|---|---|
| `EmailMPButton`/`EmailMPModal` | `/issues`, `/issue/[id]`, `/parliament` (three separate modal instances) | Real mailto resolution | **Yes** — opens the user's mail client with a real, addressed draft. This is the one genuinely working contact mechanism in the app. |
| `CampaignModal`'s "Contact MP" action | `/parliament` only | **No** — has no `mailto:` resolution anywhere in the file; copies text to the clipboard and stops (`STICKEE_V1_EXECUTIVE_SUMMARY.md` Consensus C3) | **No** — a user who clicks this reasonably believes they've contacted their MP; nothing was sent anywhere |
| `CampaignModal`'s participant counter | `/parliament` | **No** — hardcoded per-bill in `mock-parliament-data.ts`, while a real aggregation endpoint (`/api/bills/pressure-summary`) sits unused nearby | **No** — the number shown does not reflect real participation |
| `/campaigns`' join/propose/share mechanics | `/campaigns` | **No**, but now honestly labeled illustrative post-Batch-1 | **No** — disabled by design, correctly so |
| `bill_pressures` write path (`POST /api/bills/[billId]/pressure`) | Backing API only — no page currently calls it correctly end-to-end | **Yes**, real, persisted | **Partially** — the API is real and works; no current UI component reliably calls it and displays the real resulting count (`CampaignModal` calls a *different*, mock-backed count for display) |
| Community-leader "Endorse" (`EndorsementPanel.tsx`) | `/leaders/[id]` | Real write (`leader_supports`), fictional profile content | **Partially** — the write is real; what it's endorsing is currently labeled-fictional content |
| Committee submissions, consultation attendance, amendment-following | Nowhere | Not built | **No** — genuine feature gaps, not broken mechanisms |

**The core finding:** two different "contact your MP" implementations exist, one real (`EmailMPButton`) and one broken (`CampaignModal`'s contact action), on different pages, with no way for a user to tell which is which before clicking. This is the same "real system + disconnected fake stand-in" pattern found throughout this audit (wallets, leaderboards, campaigns-the-page vs. campaigns-the-modal) — see `docs/architecture/STICKEE_SYSTEM_ARCHITECTURE.md` System 7.

## The model

Every civic object page (Issue, Bill, Government Decision, MP, Forecast) that offers action should present a **"How can I influence this?"** block, not a single "Email your MP" button. Actions available depend on the object's current stage (see `RESPONSIBILITY_MAP_SPEC.md`'s stage indicator) — a bill in committee offers different real actions than one about to face a floor vote.

For each action: when it's available, who receives it, what outcome it can reasonably achieve, what happens after completion, what confirmation Stickee can truthfully provide, and what follow-up can be tracked.

### 1. Understand the issue

- **When available:** Always.
- **Who receives it:** No one — this is reading, not acting.
- **Realistic outcome:** Informs the user; no external effect.
- **After completion:** Nothing to confirm.
- **Truthful confirmation:** N/A.
- **Follow-up tracked:** N/A.
- **Status today:** Real (the editorial content itself, once sourced — see `ISSUES_PAGE_AUDIT.md`).

### 2. See who decides

- **When available:** Always, once the Responsibility Map exists on the object page.
- **Who receives it:** No one — informational.
- **Realistic outcome:** Informs the user which institution/role to direct further action toward.
- **Truthful confirmation:** N/A.
- **Status today:** Not built — see `RESPONSIBILITY_MAP_SPEC.md`.

### 3. Follow the bill / follow the forecast / follow the issue

- **When available:** Always, for any real object.
- **Who receives it:** No one directly — this subscribes the user to updates.
- **Realistic outcome:** The user is notified of real status changes (via the real Notification system, `notifications`, or a future "what changed" strip on Today).
- **After completion:** User is added to a watch list for this object.
- **Truthful confirmation:** "You're following this issue — we'll notify you when its status changes."
- **Follow-up tracked:** Yes, if the `saved_topics`/watchlist gap (`docs/architecture/DOMAIN_MODEL.md`'s "Saved Topic / Watchlist" entry — confirmed **not currently modeled**) is built.
- **Status today:** **Does not exist.** A genuine, real feature gap, not a broken mechanism — `user_follows` exists but only for following other *users*, not topics. See `USER_JOURNEY_MAPS.md` Journey 7.

### 4. Track the vote

- **When available:** Once a bill has a scheduled or completed division.
- **Who receives it:** No one — informational/tracking.
- **Realistic outcome:** User sees the real recorded vote once it happens (via Notification or the object page itself).
- **Truthful confirmation:** "This bill's vote is scheduled for [date]" / "This bill passed/failed [date] — see how each MP voted."
- **Status today:** The underlying data (`divisions`, real) exists; no dedicated "track this specific vote" subscription exists — folds into item 3 once built.

### 5. Contact your MP

- **When available:** Always, for any real Issue/Bill/Decision with a clear electorate/representation angle.
- **Who receives it:** The user's own local MP (via the real `EmailMPButton`/`EmailMPModal` mailto flow — the working one, not `CampaignModal`'s broken clipboard-copy version).
- **Realistic outcome:** The MP's office *may* read and respond — Stickee cannot promise a response, cannot promise the MP will change their vote, and must never imply either.
- **After completion:** The user's mail client sends (or the user chooses not to send) a real email.
- **Truthful confirmation:** "Your email client has been opened with a draft addressed to [MP name]." **Never** "Your MP has been notified" or any language implying Stickee itself delivered or confirmed receipt of the message — Stickee has no visibility into whether the email was actually sent or read.
- **Follow-up tracked:** None — Stickee cannot track a `mailto:` send. State this limitation plainly rather than fabricating a "sent" confirmation.
- **Status today:** Real and working via `EmailMPButton`. **Fix required:** retire `CampaignModal`'s separate, broken contact action in favour of this one working implementation — do not maintain two.

### 6. Contact the responsible minister

- **When available:** Only once Minister is a real, modeled object (see `RESPONSIBILITY_MAP_SPEC.md`#minister) — **not available today**.
- **Status today:** **Does not exist.** Do not fake this by reusing the MP-contact flow against an arbitrary "Minister" label with no real, verified appointment data behind it.

### 7. Make a committee submission / read committee submissions

- **When available:** Only once Committee is a real, modeled object — **not available today**.
- **Status today:** **Does not exist.** Genuine future scope, not scoped for near-term build (`RESPONSIBILITY_MAP_SPEC.md`#committee).

### 8. Attend a consultation

- **When available:** Would depend on real, sourced consultation-schedule data — **not available today**.
- **Status today:** **Does not exist.** No data source identified anywhere in the codebase for public consultation schedules.

### 9. Follow amendments

- **When available:** Once `issue_timeline_events` (the real timeline table, `CONTENT_HIERARCHY.md` §5) exists and `bill-stage-tracker` writes durable amendment-level history to it.
- **Status today:** **Does not exist** — `bill-stage-tracker` currently infers status transitions from a hash rather than writing amendment-level history.

### 10. Support an evidence-backed proposal / submit evidence

- **When available:** Deferred — see `DETAIL_PAGE_AUDIT.md`#civic-proposal and `CORE_PAGE_REDESIGN.md`#Community. Gated on a real `evidence`/`citations` table and a built moderation queue.
- **Status today:** **Does not exist as a real, persisted feature.** `ProposeMarketModal` is the closest precedent and is explicitly cautionary (decorative, never persists).

### 11. Add pressure to this bill (the real participation mechanic)

- **When available:** Any bill with an active `bill_pressures` record.
- **Who receives it:** No one individually — this is aggregated, counted support/opposition, publicly visible as a real number.
- **Realistic outcome:** Contributes to a real, visible tally that MPs' offices *could* see if they choose to look at Stickee — Stickee cannot promise any MP monitors or responds to this tally.
- **After completion:** The user's stance is recorded once (real upsert, keyed by user or session id).
- **Truthful confirmation:** "Your voice has been added — N Australians have registered a position on this bill." **Never** a number not actually computed from `/api/bills/pressure-summary`.
- **Follow-up tracked:** Yes — the real aggregate is queryable and should update live.
- **Status today:** The write path and read path (`/api/bills/[billId]/pressure`, `/api/bills/pressure-summary`) are both real. **Fix required:** `CampaignModal` must read the real summary endpoint instead of the mock-file hardcoded count, and this mechanism must be reachable from Issues and Government/Parliament (not `/parliament`-only) and from the promoted `/campaigns`→real-mechanism merge (see `SECONDARY_PAGES_AUDIT.md`#campaigns).

## What every action must satisfy (non-negotiable, per the audit brief)

- **Genuinely available** — never shown on an object/stage where it cannot actually do anything (e.g. "contact the minister" before Minister is a real object).
- **Appropriate to the current stage** — a bill already passed shouldn't offer "contact your MP to vote against it."
- **Clearly explained** — what happens when you click, in one sentence, before you click.
- **Never presented as guaranteed influence** — no action confirmation implies Stickee has verified a response, a vote change, or any specific downstream effect it cannot actually observe.

## Immediate fixes (no new feature required)

1. **Retire `CampaignModal`'s broken "Contact MP" clipboard-copy action** in favour of the one real `EmailMPButton`/`EmailMPModal` flow — one working mechanism, not two, one broken.
2. **Wire `CampaignModal`'s participant counter to `/api/bills/pressure-summary`**, the real, already-built, currently-unused endpoint — removes a live fabricated-number defect with zero new backend work.
3. **Promote the real `bill_pressures`/`CampaignModal` mechanism beyond `/parliament`-only** — reachable from Issues and the (rebuilt) `/campaigns`, per `SECONDARY_PAGES_AUDIT.md`#campaigns and `CONSOLIDATION_AND_REDIRECT_PLAN.md`'s `/action` proposal.

These three are independent, presentation/wiring-only fixes (same risk class as Batch 1/8) and do not require the Issue/Decision schema merge, the Responsibility Map build-out, or any new object type to ship.
