# Government V1 — Senate Interactive Australia Map

Governed by [`AGENTS.md`](AGENTS.md) and [`docs/philosophy/STICKEE_CHARTER.md`](docs/philosophy/STICKEE_CHARTER.md). An information-architecture change within the already-shipped Government V1 batch (`GOVERNMENT_V1_SIMPLIFICATION_REPORT.md`), not a visual redesign: the Senate's horizontal party-composition bar is replaced with an interactive map of Australia, so the Senate's actual constitutional structure — equal representation per state, regardless of population — is immediately legible to someone who has never studied Australian politics. Nothing was staged, committed, pushed, or deployed. Production was not accessed. No unrelated Parliament functionality was touched.

---

## 1. Implementation plan (produced before writing code, per instructions)

A full plan — component architecture, data flow, interaction flow, accessibility plan — was written and approved before implementation began, including one revision round. See §2 for the truthfulness finding that drove that revision, and §3–§5 for the plan as implemented.

## 2. Critical finding, made before any code was written: no real per-state Senate data exists anywhere in this codebase

Confirmed by reading the DB schema, the live sync route, and every Senate data file:

- **`members` table** (`supabase/migrations/002_external_data.sql`): `tvfy_id, name, electorate, party, house, image_url, synced_at`. No `state` column.
- **`/api/parliament/members`** (real TVFY/Supabase sync): fetches `name, electorate, party, house` only — never a state/territory for senators.
- **`SENATE_SEAT_COUNTS`/`senateBillVoteRows`** (`mock-senate-data.ts`): national party-level totals only, with zero state attribution for any senator.
- The only genuinely real, state-level Senate data anywhere in the codebase is `ElectionSenateState` (`aec-election-types.ts`) — real AEC live-count data, but only during an active federal election count, and even then it's party vote shares per state, not individual senator identities.

**Conclusion: "which senators sit for NSW" and "NSW's current party composition" are not answerable from any real data source in this codebase.** This directly conflicts with the task brief's example panel content ("Current party composition… List of senators… for NSW only"). Per the Charter's non-negotiables ("Stickee does not fabricate… under any circumstance," "never invent information"), this took precedence over the literal example. This was surfaced explicitly before implementation, and the owner's response tightened the resolution further than my first draft (see §3).

## 3. Truthfulness resolution — as implemented, after owner revision

1. **The state-selection panel (`SenateStateDetailPanel.tsx`) contains only what's genuinely known for that state — never the national composition.** Selecting Queensland shows exactly: state/territory name, the real constitutional senator count (12 or 2 — Constitution ss7/122, *Senate (Representation of Territories) Act 1973*), one sentence ("Queensland is represented by 12 senators."), and a truthful unavailable notice ("Stickee does not yet have a verified senator-to-state dataset, so individual Queensland senator records are not available here yet."). Nothing else — no party breakdown, no senator list, no inference.

   **Overall Senate composition is a separate, explicitly national section** (`NationalCompositionSection`, inside `SenateView.tsx`), reusing `SENATE_SEAT_COUNTS`/live `countsByParty` exactly as the old bar did — not duplicated, not re-derived — and titled "Senate composition — nationally," with an explicit line stating it is not any individual state's breakdown.

2. **AEC live-election data is never called "current votes" and never appears alongside anything that could read as a parliamentary result.** When `liveElection.active` is true, a distinctly titled section appears inside the state panel: **"Live Senate election count — {State}"**, using the real `ElectionSenateState` data. When no election is live — true today, since `ChamberSummaryCard.tsx` never actually passes `showLiveResults`/`liveElection` into `<SenateView>` (confirmed by reading the file; that path is currently unreachable in the live app) — the section is **omitted entirely**, not replaced with a placeholder line. `ChamberSummaryCard.tsx` was not touched (out of scope); the map is simply correctly capable of using this data if it's ever wired.

3. **The fabricated Senate bill result is no longer presented as verified.** This was flagged as a new, previously-undocumented finding, and the owner's explicit direction was to fix it now rather than defer it, since "it cannot remain merely because it was initially declared out of scope" once proven fabricated. Confirmed: `ChamberSummaryCard.tsx` passes only `selectedBillId` into `<SenateView>` — no real `bills`/`voteMatrix` — so `senateBillVoteRows` (hand-authored vote splits attached to real senator names: Penny Wong, Pauline Hanson, David Pocock, Lidia Thorpe, Fatima Payman, Jacqui Lambie, Ralph Babet, and others) was the *only* source the old "Passes 42/39" result block ever rendered from. Also confirmed: the `divisions` table schema already supports `house = 'senate'` (`002_external_data.sql:19`) — schema-ready, but nothing in the codebase queries it. Per the explicit instruction not to build a new pipeline, and since no genuine recorded Senate division reaches this component through any wired path today, the result block now **always** renders:

   > No verified Senate division data is available for this item.

   …whenever a bill is selected. `senateBillVoteRows`, `BillVoteRow`/`VoteDirection` usage, `VOTE_COLORS`, `DIR_LABELS`, and `DIR_STATUS` were all dropped from `SenateView.tsx`. `senateBillVoteRows` itself remains exported from `mock-senate-data.ts`, unused, per this codebase's established convention of leaving orphaned code in place rather than deleting it (confirmed via grep: it was, and remains, imported nowhere else).

## 4. Future Data Requirement (documented, not built)

**SENATE REPRESENTATION DATA PIPELINE** — named, scoped future work, not attempted in this batch:

- **Purpose:** a canonical, verified mapping — Senator → State/Territory → Party → Current term → Profile ID → Verified parliamentary vote record.
- **What already exists, schema-wise:** the `divisions` table already supports `house = 'senate'` — ready, but unused by any sync/fetch code. The `members` table has **no** `state` column at all; this must be added before any senator can be attributed to a state.
- **What's missing:** (1) a real, authoritative source of per-senator state/territory attribution — TheyVoteForYou's exact schema for this needs confirming; not verifiable without network access in this environment, flagged as an open question; (2) a sync path populating `house='senate'` members with state, plus real Senate divisions/member_votes, mirroring `/api/sync/members`/`/api/sync/divisions`'s existing House-side pattern; (3) `parliament-db.ts` (or a Senate-specific equivalent) querying that data and passing it into `SenateView`/`AustraliaSenateMap`/`SenateStateDetailPanel` as real props, exactly mirroring how the House side already receives `bills`/`voteMatrix`/`members`.
- **Not a new, separate id-scheme problem** — it must fold into the MP canonical-identifier reconciliation already tracked in `STICKEE_V1_EXECUTIVE_SUMMARY.md` Owner Decision 10 (currently covering `MPIndex`'s `mp-*`, live `house-live-*`/`senate-*`, and `tvfy-*` schemes). A Senate id scheme would be a fourth scheme needing the same unified treatment, not a fourth separate migration.
- **Intended final experience once built:** hover a state → senator count (unchanged); click a state → real senators for that state, real parties, real terms, real profile links, real recorded divisions.

## 5. Component architecture (as implemented)

```
SenateView.tsx
├─ Header (unchanged: senator count, majority, sync date)
├─ AustraliaSenateMap (new)
│  ├─ Education strip — exactly the two required sentences
│  ├─ Map + Sidebar (desktop: side-by-side · mobile: stacked)
│  │  ├─ SVG map — 7 focusable state/territory regions + 1 ACT marker
│  │  └─ Sidebar list — 8 focusable rows, synced hover/focus with the map
│  └─ SenateStateDetailPanel (new, inline, no modal) — appears when a state is selected
│     ├─ State name, constitutional senator count
│     ├─ "{State} is represented by {N} senators."
│     ├─ Truthful unavailable notice for individual senator records
│     └─ "Live Senate election count — {State}" — only when liveElection.active; omitted otherwise
├─ NationalCompositionSection (new, small) — real SENATE_SEAT_COUNTS/live countsByParty,
│  explicitly labelled national, always separate from whichever state is selected
└─ SenateDivisionResult (replaces MajorityResult) — "No verified Senate division data is
   available for this item." whenever a bill is selected
```

**New files:**
- `src/lib/au-senate-states.ts` — real constitutional reference data (8 states/territories, abbreviations, real senator counts) plus simplified schematic SVG path geometry for the map. This is presentation/reference data, not political content — the same category as `HouseChamber.tsx`'s existing `buildChamberPositions()` geometry helper, not "new mock data" in the Charter's sense. The file's own header comment states this classification explicitly.
- `src/components/AustraliaSenateMap.tsx` — the map, sidebar, and synchronized hover/focus/keyboard state.
- `src/components/SenateStateDetailPanel.tsx` — the state-only detail panel.

**Edited:** `src/components/SenateView.tsx` — `SeatCompositionBar`, `GroupColumn`, `PartyRow`, `GROUPS`, and the now-purposeless Votes/Parties tab toggle (it switched the old bar between vote-colour and party-colour; the map isn't coloured by either, since no real per-state data exists for either) were removed. The old top-level `showLiveResults && liveElection?.active` full-page-replacing branch was removed too — its function is superseded by the more granular, correctly-labelled per-state integration in `SenateStateDetailPanel`. Header and the file's props interface (`selectedBillId`, `showLiveResults`, `liveElection`) are unchanged.

**Map shape approach:** simplified, schematic state silhouettes (hand-authored, ~6–10 vertices per region) — recognizable as Australia, flat-filled, calm. This is explicitly not survey-accurate GIS data; precision was not the goal, legibility and calm were, matching "avoid making it feel like a GIS application." ACT (~2,358 km², too small to be a usable hit target at map scale) is rendered as a marker + leader line with its own ≥24px-radius focusable/clickable target near its real location, not a filled polygon.

## 6. Data flow

```
SENATE_SEAT_COUNTS (mock-senate-data.ts, existing)            ─┐
useLiveParliamentMembers().senate.countsByParty (existing)     ├─→ NationalCompositionSection only
                                                                 │   (reused, not duplicated; never
                                                                 │    rendered inside a state panel)
au-senate-states.ts: SENATE_STATES (new, real/constitutional)  ─→ per-state real senator count (12/2),
                                                                    shown in map, sidebar, and panel
liveElection.chambers.senate.states (existing, real, AEC)      ─→ "Live Senate election count — {State}"
                                                                    section, only when active; omitted
                                                                    entirely otherwise
selectedBillId (existing prop) → no data lookup anymore        ─→ gates whether SenateDivisionResult
                                                                    renders its "not available" notice
```

No new data source. No duplicated data source. No new mock political data.

## 7. Interaction flow (as implemented)

1. Hover a map region → that region highlights (fill change, `--ink`), its sidebar row highlights, every other region fades to 35% opacity (colour/opacity transition only, 150ms — no scale/transform, per the design system's motion rule).
2. Hover a sidebar row → identical synchronized highlight, driven by one shared `hoveredState` value.
3. Keyboard: every region (including the ACT marker) and every sidebar row is `tabIndex={0}`/`role="button"`, with `onFocus`/`onBlur` mirroring `onMouseEnter`/`onMouseLeave` — full keyboard/hover parity. `Enter`/`Space` activates the same selection as a click.
4. Click/activate → `selectedState` is set; `SenateStateDetailPanel` renders inline below (no modal), matching the calm, inline interaction style already used in `PriorityBillFocus`/`MPActionStrip`. Selecting the same state again closes it.
5. ARIA: every region/row has `aria-label="{State full name}, {N} senators"` and `aria-pressed` reflecting selection state; the panel is a `role="region"` with `aria-live="polite"`.

## 8. Design

Flat fills using the same CSS custom properties already in use elsewhere in this file and its siblings (`--ink`, `--ink-muted`, `--line-strong`, `--paper`, `--paper-raised`), with hex fallbacks matching `SenateView.tsx`'s pre-existing dark-token values — no new palette introduced. No gradients, no shadows beyond the outer card's pre-existing `shadow-xl`, no glassmorphism, no party colours on the map itself (confirmed by test — the map regions are never coloured by `PARTY_COLORS`/`SENATE_PARTY_COLORS`, since no real per-state party data exists to colour them by; this also reinforces the required education message — every state reads as equal weight by default, matching "equal representation regardless of population"). The two required education sentences are rendered verbatim, above the map, with no additional explanatory text.

## 9. Accessibility

- All 7 map regions, the ACT marker, and all 8 sidebar rows: `tabIndex={0}`, `role="button"`, descriptive `aria-label`, visible focus (browser default outline preserved — `outline: none` was only applied to remove the default *box* outline in favour of the existing focus-visible pattern already used by `ParliamentMap.tsx`/`HouseChamber.tsx` seat circles in this codebase; no custom suppression without a replacement).
- Hover and focus produce identical highlight behaviour — verified by shared `hoveredState`/`onFocus`/`onBlur` wiring, not two separate implementations.
- No nested interactive controls — sidebar rows are a single `<button>`, map regions are a single focusable `<path>`/`<circle>`.
- Party colour swatches (in `NationalCompositionSection` and the live-election section) always render a text label alongside the colour, never colour-alone.
- Mobile: the map/sidebar grid collapses to a single column (`grid-cols-1 lg:grid-cols-[1fr_260px]`); sidebar rows use full-width `py-3` targets.

## 10. What was not touched

`ChamberSummaryCard.tsx`, `HouseChamber.tsx`, the House chamber, `ChamberToggle`/`UnderlineTabs` usage elsewhere on Parliament, anything on `/leaders`, and `senateBillVoteRows`'s underlying dataset (left in place, unused, per convention — not deleted).

## 11. Files changed

- `src/lib/au-senate-states.ts` — new.
- `src/components/AustraliaSenateMap.tsx` — new.
- `src/components/SenateStateDetailPanel.tsx` — new.
- `src/components/SenateView.tsx` — rewritten (bar/group-column/toggle removed; map, national-composition section, and truthful division-result notice added).
- `src/lib/__tests__/senate-map.test.ts` — new, 26 tests.

No other file was modified.

## 12. Tests and results

```
npx tsc --noEmit               → clean, 0 errors
npx vitest run                 → 339/339 passed (13 files), including the new
                                  senate-map.test.ts (26/26)
npm run build                  → succeeded (Next.js 16.2.1 / Turbopack), all 46
                                  routes compiled, including /parliament
node scripts/secret-scan.mjs   → "no suspicious patterns found in tracked files"
```

The 26 new tests cover: all 8 states/territories present with the real constitutional senator counts (12×6 + 2×2 = 76); ACT has no filled map shape but has its own focusable marker; the map's education copy matches exactly; hover/sidebar synchronization and keyboard (Enter/Space) activation exist; every region/row has a descriptive ARIA label; the map never colours regions by party; state selection never opens a modal; the state panel never renders national composition, only the real senator count and the truthful unavailable notice; live-election data is labelled as an election count and only appears when genuinely active; the fabricated Senate bill-vote numbers and old bar/group-column components are gone; the required "No verified Senate division data is available for this item." notice renders; `senateBillVoteRows` is confirmed orphaned (still exported, no live importer).

## 13. Visual verification method

**No headless-browser/screenshot tooling is installed in this environment**, consistent with every prior batch report — no pixel-level screenshots were taken.

HTTP-level check performed against the already-running local dev server (port 3001, confirmed this project via `lsof`'s `cwd`): `/`, `/parliament`, `/leaders`, `/issues` all return 200 with no server-error text in the response body. **One real limitation, stated plainly:** the Senate map itself is nested two levels of client-side interaction deep on `/parliament` (the chamber card is collapsed by default, and House is the default chamber tab within it) — `curl` cannot expand the card or switch to the Senate tab, so the map's rendered HTML could not be grepped directly the way prior batches verified top-level page content. Correctness was instead verified at the source/component level: the production build compiles and statically analyzes the full component tree with zero errors, and the 26 new tests assert the exact structure, copy, and logic described in this report. A manual click-through (`/parliament` → expand chamber → Senate tab → hover/click a few states, including ACT) is recommended as a follow-up, real-render check once browser tooling is available.

## 14. Owner decisions still required

1. **The Senate Representation Data Pipeline** (§4) — the real fix. Not attempted here, per instructions.
2. **`senateBillVoteRows`'s broader fate** — it's now fully unused (orphaned) by any live component. Whether to delete it outright, keep it as a fixture for the future pipeline's test data, or something else is an open, low-stakes housekeeping decision, not a truthfulness one (it's no longer reachable from any page).
3. Everything already listed as unresolved in `GOVERNMENT_V1_SIMPLIFICATION_REPORT.md`/`PEOPLE_V1_SIMPLIFICATION_REPORT.md`/`STICKEE_V1_EXECUTIVE_SUMMARY.md` Owner Decision 10 is unchanged by this batch, except as corroborated in §4 above.

## 15. Confirmation

- Production was not accessed, modified, or deployed to.
- Nothing was staged, committed, or pushed.
- No migration was created or applied; no database was written to.
- No secret values were printed; `scripts/secret-scan.mjs` found nothing suspicious.
- Only `SenateView.tsx` and the three new files listed in §11 were changed. `ChamberSummaryCard.tsx`, `HouseChamber.tsx`, `/leaders`, and every other core page were not touched.
- No unrelated pre-existing working-tree changes present at session start were modified or overwritten.

---

## 16. Batch 2 — real Australia coastline geometry (Aug 2026)

A geometry-only follow-up. The interaction model from §1–§15 (hover/focus sync, keyboard activation, inline detail panel, ACT as a marker+leader-line callout, truthfulness boundaries) was explicitly out of scope for this batch and was not touched. Only the map's visual geometry — `STATE_SHAPES`, `STATE_LABEL_POSITIONS`, and `ACT_MARKER` in `src/lib/au-senate-states.ts` — was replaced.

### 16.1 The old schematic-map problem

The original `STATE_SHAPES` (§5 of this report, "Map shape approach") were explicitly documented as "hand-authored, ~6–10 vertices per region... not survey-accurate GIS data." In practice this meant every state was a simple 6–8 point polygon with straight edges — recognisable as "roughly where Australia's states are" but visually reading as rough geometric blocks, not a real coastline. No Cape York, no Gulf of Carpentaria, no Great Australian Bight, no south-east coast detail. This was flagged as visually unacceptable and inconsistent with the "calm, premium, civic" bar the rest of the product is held to.

### 16.2 Geometry source and licence

**Source:** Natural Earth, [10m Admin-1 States & Provinces](https://www.naturalearthdata.com) dataset (`ne_10m_admin_1_states_provinces`), fetched from the project's public GitHub mirror (`nvkelso/natural-earth-vector`).

**Licence:** Public domain. Per Natural Earth's terms of use: "All versions of Natural Earth raster + vector map data found on this website are in the public domain... No permission is needed to use Natural Earth. Crediting the authors is unnecessary." Verified directly against `naturalearthdata.com/about/terms-of-use/` before use, per this batch's instruction to confirm licence before adding external geometry.

An official Australian Government dataset (ABS ASGS3 state/territory digital boundaries, CC BY 4.0) was considered first, per the preference for official/open-data sources. It was not used because this environment has no shapefile/GeoPackage tooling (`ogr2ogr`/GDAL not installed) to convert ABS's projected GDA2020 boundary files without a heavier, harder-to-verify pipeline, whereas Natural Earth ships pre-simplified, unrestricted GeoJSON directly usable with the available tooling (`jq`, `mapshaper`, `d3-geo`). Natural Earth is a standard, widely-used source for exactly this kind of illustrative (not survey/cadastral) political map and satisfies the brief's "authoritative/open geographic source" requirement; ABS boundaries remain the better choice for any future feature needing survey-grade precision (e.g. electorate-level geometry).

Eight features were extracted by `admin == "Australia"` and matched by name to WA, NT, SA, QLD, NSW, VIC, TAS, ACT. Three additional Natural Earth features under Australian administration — Jervis Bay Territory, Lord Howe Island, and Macquarie Island — were deliberately excluded from the rendered map: none of them carry Senate representation distinct from their parent state in `SENATE_STATES`, and including small, distant dots would have added clutter without adding correct information (consistent with §16.5's "no fabricated/misleading detail" bar).

### 16.3 Simplification and projection method

1. **Topological simplification** — `mapshaper` (`visvalingam keep-shapes`, 8%), which builds shared-edge topology across all 8 polygons first, so simplifying never opens gaps or creates overlaps along a shared state border (e.g. the WA/NT/SA/QLD quadripoint stays exact).
2. **Small-island stripping** — `mapshaper -filter-islands min-area=2km2` removed one sub-2km² islet; larger, real offshore features (Torres Strait islands, Tiwi Islands, Kangaroo Island, Bruny Island, etc.) were kept, since these are genuine, recognisable parts of the coastline, not noise.
3. **Projection** — `d3-geo`'s `geoConicEqualArea`, standard parallels −18°/−36°, central meridian 134°E: the same projection family (equal-area conic, same parallels) that Geoscience Australia/ABS use for whole-of-Australia thematic mapping (cf. EPSG:3577 "Australian Albers"). Fit to the existing `0 0 1000 800` viewBox via `fitExtent` with a 20px margin, so the component's viewBox and every consumer of `MAP_VIEWBOX` needed no changes.
4. **A real bug hit and fixed during this step, documented since it would otherwise silently corrupt the map:** d3-geo's default preclip stream (`geoClipAntimeridian`) is designed for data that may wrap the ±180° antimeridian. Applied to a purely regional dataset like Australia (112.9°E–153.6°E, nowhere near the antimeridian), it was inserting a spurious 26–65 point ring after every real sub-polygon in each state's `MultiPolygon` — visible as the exact same phantom coordinate repeating across otherwise-distinct states, and inflating `path.bounds()`/`path.centroid()` to nearly the full viewBox for every feature. Fixed by disabling the antimeridian preclip (`projection.preclip(sink => sink)`), which is safe and standard practice for any single-country/regional (non-globe-spanning) map. Root-caused by comparing raw per-feature lon/lat bounds (correct and distinct) against post-projection bounds (identical and wrong for every feature) before finding the duplicated-coordinate pattern.
5. **Centroids** — d3-geo's own `.centroid()`/`.bounds()` were not trusted for label placement even after the preclip fix, since they depend on spherical ring-winding conventions this dataset doesn't cleanly satisfy for tiny island rings. Label positions in `STATE_LABEL_POSITIONS` are instead a planar, area-weighted centroid (shoelace formula) computed directly from each state's largest projected ring, so a small offshore island can never pull a label off the mainland.
6. **Precision** — final path coordinates rounded to 1 decimal place (from d3-geo's default ~3), trading imperceptible visual precision for a smaller file: total path data across all 7 shapes is ~15KB.

No new runtime dependency was added. `d3-geo`, `@mapbox/geojson-rewind`, `mapshaper`, and `playwright` were used only in an ephemeral scratch script to generate static SVG path strings and label coordinates, which are what's actually committed to `au-senate-states.ts` — `package.json` is unchanged.

### 16.4 Files changed

- `src/lib/au-senate-states.ts` — `STATE_SHAPES`, `STATE_LABEL_POSITIONS`, `ACT_MARKER`, and the file's header comment were replaced with real geometry and updated provenance notes. `MAP_VIEWBOX` (`0 0 1000 800`), all type signatures, `SENATE_STATES`, and every other export are unchanged.
- No other file was modified. `AustraliaSenateMap.tsx`, `SenateStateDetailPanel.tsx`, `SenateView.tsx`, and `src/lib/__tests__/senate-map.test.ts` were not touched — the interaction, styling, ARIA structure, and truthfulness behaviour are exactly as documented in §1–§15.

### 16.5 Accessibility verification

Unchanged from §9, re-confirmed against the real component (not just source inspection) via a live local render (see §16.6):

- All 7 state regions and the ACT marker remain individually focusable (`tabIndex={0}`, `role="button"`), each with a descriptive `aria-label` naming the state and its real senator count.
- Hover and keyboard focus produce identical highlighting (shared `hoveredState` state, `onFocus`/`onBlur` mirroring `onMouseEnter`/`onMouseLeave`) — confirmed by hovering the NSW sidebar row and observing the actual NSW coastline polygon highlight in sync (screenshot, §16.6).
- The sidebar list remains a fully independent, complete way to select every state — verified un-changed since only geometry, not the sidebar markup, was touched.
- `npx vitest run` — all 339 tests pass, including all 26 in `senate-map.test.ts` unchanged (it asserts structure/behaviour, not exact path coordinates, so it remains valid against the new geometry).

### 16.6 Visual verification (this time, with real rendering — a limitation resolved from §13)

Unlike the original batch (§13), a Chrome browser was available in this environment via Playwright, so the map was rendered and screenshotted for real against the running local dev server (`localhost:3001`, confirmed as this project via `lsof`), not just verified at the source/test level:

1. **Idle state, light theme, desktop** — a clean, recognisable outline of Australia: Cape York, the Gulf of Carpentaria, the WA coastline, the Great Australian Bight, and Tasmania's south-east coast are all identifiable at a glance, in flat neutral grey with thin dark borders — no gradients, shadows, or per-state colour.
2. **Hover state (map)** — hovering WA fills it solid dark, every other state fades to the existing 35% opacity, label text switches to the light-on-dark variant — matching §7's documented interaction exactly, now against real coastline shapes instead of blocks.
3. **Hover state (sidebar → map sync)** — hovering the "NSW" sidebar row highlights the actual NSW polygon on the map (screenshotted side-by-side), confirming the shared `hoveredState` sync still works correctly against the new geometry.
4. **Click/select** — clicking the Tasmania sidebar row selects it (solid fill on the map) and opens `SenateStateDetailPanel` inline below, unchanged from §7.
5. **ACT marker** — renders at its correct real-world position (projected from Canberra's actual coordinates through the same projection as every state, not eyeballed), with a leader line to a readable callout label placed in open space clear of the NSW coastline (verified geometrically: the label anchor sits ~80px clear of the nearest real coastline point at that latitude, not just visually eyeballed).

**Known limitations, stated plainly:**
- Automated dismissal of this page's first-visit onboarding modal (electorate picker) and push-notification prompt required coordinate-based clicks in the Playwright script rather than a stable ARIA selector, since the modal does not expose `role="dialog"`. This is a pre-existing property of those components, unrelated to this batch.
- **Mobile viewport (390px) was confirmed**: the map renders at reduced width with the existing single-column stacked layout (`grid-cols-1`, unchanged), coastline detail and labels remain legible, no code change was needed since geometry is viewBox-relative.
- **Dark theme was not confirmed by screenshot.** Playwright's `colorScheme: 'dark'` emulation (OS-level `prefers-color-scheme`) did not change this app's rendered theme, which appears to require an explicit in-app toggle (`ThemeProvider.tsx`) rather than following OS preference — finding that toggle and driving it was judged out of scope for a geometry-only batch. This is a lower-risk gap than it might sound: the map's colours come entirely from the pre-existing CSS custom properties (`--ink`, `--paper`, `--line-strong`, etc.) in `AustraliaSenateMap.tsx`, which this batch did not touch — dark-theme rendering is inherited unchanged from the already-shipped §1–§15 implementation, just now painting real coastline paths instead of blocky ones. A manual dark-theme check by the owner is still the more reliable confirmation, and is recommended as a quick follow-up.

### 16.7 What this batch did not do

- Did not touch the interaction model, ARIA structure, truthfulness boundaries, or any data flow from §1–§15 — this was a geometry swap only, per instruction.
- Did not add ABS or any other second geographic data source — one geometry source (Natural Earth), used once, for one purpose.
- Did not change `MAP_VIEWBOX`, so no consumer of it needed updating.
- Did not stage, commit, or push anything; did not access production.
