# Gates: Phase 3 remaining workflow verification

Scope: complete outstanding local checks, prepare Stripe test tooling, and report provider prerequisites without repeating the passing Phase 3 suite.

- [x] G1: recovery email completes a browser password change and old password is rejected
  CHECK: node scripts/qa-phase4-browser.mjs 'recovery|magic|mobile'
  EXPECT: PASS recovery browser completion and password replacement
  EVIDENCE: Actual filtered recovery|magic|mobile run exited 0, emitted the named PASS and PHASE4_BROWSER_PASS; browser-results.json and password-reset.png. Real loopback GoTrue and Mailpit.
- [x] G2: authenticated ordinary and administrator mobile navigation preserves sessions
  CHECK: node scripts/qa-phase4-browser.mjs 'recovery|magic|mobile'
  EXPECT: PASS admin authenticated mobile navigation
  EVIDENCE: Actual recovery|magic|mobile run exited 0 with both mobile PASS markers; administrator-only screenshot refinement also exited 0. Primary headings loaded, active states, refresh, Back and sign-out asserted.
- [x] G3: valid administrator agent detail, toggle and local run persist actual records; fixtures are restored
  EVIDENCE: Browser run printed named PASS and cleanup PASS; enclosing run exited 1 solely for separately repaired auth/mobile failures. PostgreSQL run asserted status=ok, trigger=manual and finished_at; original agent restored exactly. Manual review of the independently completed subcheck, not a successful aggregate run; preserving passing work as requested rather than rerunning it for the ledger. Screenshot agent-detail.png.
- [x] G4: existing local magic-link and OAuth configuration is exercised to its safe boundary
  EVIDENCE: Magic completion passed in the final filtered run (exit 0); OAuth disabled-provider assertion passed earlier. Google completion still requires a test OAuth client. No external OAuth session attempted.
- [x] G5: Stripe CLI and isolated test forwarding launcher are ready at the account-authentication boundary
  CHECK: node scripts/qa-stripe-local.mjs check
  EXPECT: STRIPE_LOCAL_PREFLIGHT_PASS
  EVIDENCE: Exit 0; CLI version 1.53.1 and help verified, loopback preflight passed; live-key-shaped input rejected. Existing stored test-key expiry is 2026-05-17. Start/forwarding branch intentionally unexecuted pending fresh credentials.
- [ ] G6: provider-backed payment matrix is executed once test credentials are available
  EVIDENCE: No provider-backed checkout or payment performed; expired test configuration not used. Exact matrix and manual handoff are in WORKFLOW_QA_REPORT.md.
- [x] G7: report distinguishes local real-service, simulated and provider-backed evidence; pre-existing work and production are preserved
  EVIDENCE: Report reviewed against actual outputs; source changes limited to four auth files, test scripts, tests and QA evidence. No schema changes, commits, push, hosted operations or production access. Saved env files untouched.
- [x] G8: synthetic signed events exercise the actual webhook handler and real local database transitions
  CHECK: STICKEE_LOCAL_WEBHOOK_QA=1 npx vitest run src/lib/__tests__/webhook-local.integration.test.ts
  EXPECT: Tests  6 passed (6)
  EVIDENCE: Exit 0, 6/6 tests passed; synthetic events only, loopback PostgREST/RPC, cleanup assertions. No Stripe API request made.
- [x] G9: the four-step signup form creates an authenticated ordinary account
  CHECK: node scripts/qa-phase4-browser.mjs signup
  EXPECT: PASS four-step signup browser completion
  EVIDENCE: Exit 0, named PASS and PHASE4_BROWSER_PASS; browser-results-signup.json. Disposable account deleted.

ABANDON: G6 Fresh Stripe test account authentication or a fresh sk_test_ key is required; stop at the user's explicit credentials boundary. This is a handoff, not a passing provider test.
