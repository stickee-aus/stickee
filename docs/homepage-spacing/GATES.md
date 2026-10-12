# Gates: homepage spacing

Scope: Measure the reference, preview in isolation, apply scoped homepage spacing and compare desktop/mobile without changing content or services.

- [x] G1: Reference measurements distinguish computed facts from visual interpretation.
  EVIDENCE: REPORT.md and reference-measurements.json record computed bounds, styles, viewport units and time-dependent carousel variation.
- [x] G2: Isolated baseline and proposal are visually compared at 1440×900 and 390×844.
  EVIDENCE: Reviewed before/after desktop and mobile full-page captures; comparison.html presents equal-scale pairs; isolated copy created and measured before working-tree transfer.
- [x] G3: Homepage hero and introductory sections expand with content, dense sections retain natural heights, and mobile content remains accessible.
  CHECK: node docs/homepage-spacing/verify-measurements.mjs
  EXPECT: HOMEPAGE_MEASUREMENTS_PASS
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/jacksontaylor/stickee; path=e8795c643ac4/28 entries; EXPECT=matched; output-sha256=81aa8b4b03c7bd9171f8f22582153fcd9967794110eb01e594862b62b5e3a92d; output-bytes=27
- [x] G4: Existing content, destinations and forecast eligibility are preserved; scoped checks pass.
  CHECK: node node_modules/vitest/vitest.mjs run src/lib/__tests__/homepage-forecasts.test.ts
  EXPECT: Tests  24 passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/jacksontaylor/stickee; path=e8795c643ac4/28 entries; EXPECT=matched; output-sha256=d50d968d12b426f1fd4437f78649a9bcc69866e06c6cf789e2f325e1cbd61c5a; output-bytes=290
- [x] G5: Only homepage presentation and its evidence are changed; no production, migration, commit, push or deployment occurs.
  EVIDENCE: Scoped diff only touches page.tsx, new home.module.css and docs/homepage-spacing; no service, credential, schema or production operations.
