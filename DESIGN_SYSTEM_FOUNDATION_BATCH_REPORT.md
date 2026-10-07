# Design System Foundation Batch Report — Phase 1 + Phase 2

Date: 2026-08-05. Scope: `CIVIC_DESIGN_SYSTEM.md` Phase 1 (token foundation) and Phase 2 (shared primitives) only, per `DESIGN_SYSTEM_MIGRATION_ROADMAP.md`. No pages were migrated to the new primitives — that is Phase 3+.

## 1. Approved creative direction (as given, Phase 0)

Serious, academic, historically durable, futuristic, modern, highly structured, database-like but readable, calm, clean, consistent. Not retro, not Bloomberg Terminal, not government-bureaucratic, not crypto/gambling, not generic SaaS, not gamified. Kalshi referenced for design *quality* (hierarchy, density, polish) only — not visual identity or trading language.

## 2. Final token decisions implemented

All in `src/app/globals.css` (`:root`, mirrored in `.dark` — no real dark theme shipped this batch) and `src/app/layout.tsx`.

| Token | Value | Notes |
|---|---|---|
| `--paper` (page bg) | `#F7F7F4` | replaces `#0a0a0b` |
| `--paper-raised` (card/surface) | `#FFFFFF` | |
| `--ink` (primary text) | `#15171B` | |
| `--ink-muted` (secondary text) | `#52555C` | |
| `--ink-faint` (timestamps/disabled) | `#8B8E94` | |
| `--line` (hairline border) | `#E1E3E7` | |
| `--line-strong` (emphasis border) | `#C7CACF` | |
| `--civic-accent` | `#2E3A8C` (deep indigo) | replaces `#d85f36` orange everywhere it was in circulation, incl. off-theme utility tokens |
| `--status-positive` / `--status-negative` / `--status-pending` | `#1F6C4A` / `#8A2A2A` / `= --ink-muted` | text-first, never a fill |
| `--radius` | `0.375rem` (6px) | Phase 0 explicitly overrides `CIVIC_DESIGN_SYSTEM.md` Part 3.4's 0–2px recommendation |
| `--shadow-overlay` | `0 12px 32px -8px rgba(15,17,26,.18)` | the **only** shadow token; applied to `DialogContent` only |
| `--font-heading` | `var(--font-serif)` (IBM Plex Serif) | was `var(--font-sans)` |
| Motion | `color, background-color, border-color, opacity`, 170ms, `cubic-bezier(.2,0,0,1)` | no transform-based transitions added anywhere in this batch |

These are mapped onto the *existing* shadcn variable names (`--background`, `--foreground`, `--card`, `--muted-foreground`, `--accent`, `--destructive`, `--border`, `--ring`, etc.), so every component already reading those (Button, Card, Badge, Dialog, Tooltip, and every page) repaints automatically — no component-level edits were needed for the base palette to take effect.

**Type scale** — new `@layer components` utility classes: `.text-page-title`, `.text-section-title`, `.text-card-title`, `.text-body-copy`, `.text-metadata`, `.text-micro-label` (serif/sans/mono per `CIVIC_DESIGN_SYSTEM.md` Part 3.2).

**Removed from the foundation** (confirmed via grep to have zero live consumers except where noted):
- `.k-grade-a/b/c/d/f`, `.impact-high/medium/low`, `.sentiment-positive/negative`, `.trending-pill`, `.decision-title/meta/summary` — all dead CSS except `.k-grade-*`, which had one consumer (`TickerBar.tsx`); removing it degrades that badge to plain unstyled text (no colour), not a breakage. `TickerBar` is flagged for full removal in Phase 4 regardless.
- `.gradient-text`, `.glow-primary`, `.glow-sm`, `.hero-gradient` (already neutered, now deleted outright).
- The `--color-k-green/red/amber/dim/subdim` off-palette Tailwind theme tokens (unused in any `.tsx`).

**`.simple-*` (Home/Navbar/BottomNav)** — kept, not deleted. Deleting the classnames would have broken the already-in-flight, uncommitted homepage/nav redesign markup, and Phase 1's scope is explicitly "no page-level markup changes." Instead every property value was rewritten onto the civic tokens and every Part 5 ban-list violation was dropped in place: no more `box-shadow` (score card, hover-lift issue/forecast cards), no more `radial-gradient` (hero background), no more `border-radius: 999px` (buttons, badges, trend pills — now `var(--radius)`), no more `transform: translateY` hover-lift, no more `backdrop-filter: blur` on the nav, no more `#d85f36` orange or off-palette amber/tan fills. Verified by a repo-wide grep and by fetching the compiled CSS from the running dev server (see §6).

## 3. Shared primitives created or extended

New, under `src/components/ui/`:

| Primitive | File | Spec item |
|---|---|---|
| PageShell | `page-shell.tsx` | 1 |
| PageHeader | `page-header.tsx` | 2 |
| SectionHeader | `section-header.tsx` | 3 |
| ArticleCard | `article-card.tsx` | 4 |
| RecordRow (DataRow) | `record-row.tsx` | 5 |
| StatusLabel | `status-label.tsx` | 6 |
| MetadataLine | `metadata-line.tsx` | 7 |
| UnderlineTabs | `underline-tabs.tsx` | 8 |
| EvidenceBlock | `evidence-block.tsx` | 11 |
| DesignSystemShowcase (dev fixture) | `__dev__/design-system-showcase.tsx` + `__dev__/underline-tabs-demo.tsx` | showcase requirement |

Extended in place rather than duplicated (per the constitution's "does this duplicate an existing system" check):
- **EmptyState** (`empty-state.tsx`) — added a `variant` prop (`no-data`, `no-forecasts`, `signed-out`, `unavailable`, `load-error`) with truthful default copy, kept the existing `icon`/`title`/`description`/`action` API so the one live call site (`decisions/page.tsx`) needed no change. Icon container radius changed from `rounded-full` to `var(--radius)`.
- **Button** (`button.tsx`) — audited, not rewritten. It already has exactly the two-variant-plus-link-plus-destructive shape the spec asks for (`default`≈filled primary, `outline`≈secondary, `link`, `destructive`), uses no shadow and no gradient, and its one `translateY(1px)` is an `:active` press-depth micro-interaction, not a `:hover` lift — left as is. It now repaints onto the civic palette for free via the token change.
- **Dialog / overlay shell** (`dialog.tsx`) — added `shadow-[var(--shadow-overlay)]` to `DialogContent`, the one place the spec permits elevation. Everything else (`bg-popover`, `ring-foreground/10`, `rounded-xl` now resolving to the 6px-based radius scale) was already token-driven.
- **Tooltip** (`tooltip.tsx`) — audited, no change needed; already `bg-foreground`/`text-background`, no shadow.

Not built this batch (explicitly out of scope): a rebuilt `Badge`/pill component, and no component-level Button variant renaming — extending the existing primitives was judged sufficient and lower-risk than a parallel system.

## 4. Competing foundation systems removed

- Dark-trading-terminal default token set — gone; `:root` and `.dark` now both resolve to the light civic palette (`.dark` intentionally mirrors `:root`; no second theme shipped).
- `#d85f36` orange accent — zero remaining occurrences (`globals.css` or compiled CSS).
- Kalshi accent Tailwind theme tokens (`--color-k-*`) — removed from `@theme inline`.
- Dead `k-grade-*`/`impact-*`/`sentiment-*`/`trending-pill`/`decision-*` CSS classes — removed.
- Neutered gradient/glow utility classes — removed outright rather than left as no-ops.
- `.simple-*` as a *second, page-scoped design language* — folded into the token system (see §2); the classnames remain as a compatibility surface for the existing home/nav markup, not as an independent palette anymore.

**Confirmed still present, out of this batch's scope** (Phase 3+ debt, unchanged by this batch): ~28 `shadow-*`/`boxShadow` usages and ~225 `rounded-full` usages across page-level components (`MarketCard`, `HouseChamber`, `SenateView`, `CommandPalette`'s `shadow-2xl`/`rounded-2xl`, endorsement buttons, etc.), and dozens of files with hardcoded off-palette hex (`#0a0a0b`-family especially) — e.g. `StakeModal.tsx`, `MarketCard.tsx`, `TwoHousesExplainer.tsx`'s party colours, all the `simulator/*` components. These are unchanged because fixing them means editing page/component markup, which Phase 1/2 explicitly excludes.

## 5. Visual impact on existing pages

Because the base palette is mapped onto the same shadcn variable names every component already reads, **every page repaints automatically** without any markup change — confirmed by fetching the compiled CSS from a running dev server and checking `--civic-accent`, `--radius`, `.simple-nav`'s resolved values, and the absence of `#d85f36`/`#0a0a0b` in the token layer (component-level hardcoded hex, noted above, is untouched and still renders as before).

Concretely, on every page: black/near-black backgrounds are now warm-white; the (mostly unthemed) `border-border`/`bg-card`/`bg-muted` surfaces are now light-on-light instead of dark-on-dark; any element using `--radius`-derived Tailwind classes (`rounded-lg`, `rounded-xl`, etc. — Card, Dialog, Button, Badge all do) now has a small 6px-family corner instead of 0; heading text bound to `font-heading` (Card/Dialog titles) now renders in IBM Plex Serif instead of Sans.

Home page, Navbar, BottomNav specifically: same layout/structure, but the accent is now indigo, all card/button radii are 6px instead of 0/999px, no shadows or hover-lift remain, the hero's radial gradient is gone (flat paper background), and the nav bar is a solid surface instead of a blurred translucent one.

## 6. Tests and results

New file: `src/lib/__tests__/design-system-foundation.test.ts` (51 tests), following this repo's existing grep/`readFileSync`-against-source convention (there is no jsdom/testing-library in this project, so these are source-level assertions, not DOM-rendered component tests). Covers every item in the batch's TESTS section: serif font wiring, single token system, dead-class removal, `.simple-*` ban-list compliance, primitive existence, no pill radius, no glow/gradient/hover-transform (with the one permitted overlay shadow specifically scoped to `Dialog`), `StatusLabel` text-first status, `MetadataLine`/`EvidenceBlock` accessible text rendering, `Dialog` token usage, `:focus-visible` outline, and `prefers-reduced-motion` handling.

Executed:
- `npx tsc --noEmit` — clean. (Caught and fixed one real bug: a JSDoc comment in `page-shell.tsx` containing a literal `max-w-*/` sequence terminated the comment block early and broke parsing.)
- `npx vitest run` — **173/173 passed** across all 7 test files (51 new, 122 pre-existing — zero regressions).
- `npm run build` (`next build`) — succeeded, all 46 routes compiled (static + dynamic).
- `node scripts/secret-scan.mjs` — no suspicious patterns found.

**Visual verification** — no browser/screenshot tool is available in this environment, so full visual inspection wasn't possible. What was verified instead: started a dev server, fetched `/`, `/issues`, `/decisions`, `/government`, `/predictions`, `/leaders` (all `200`), fetched the compiled CSS bundle, and confirmed `--civic-accent: #2e3a8c`, `--radius: .375rem`, `.simple-nav`'s resolved rule body, and zero occurrences of `#d85f36`/`#0a0a0b` in the token layer (the two remaining `0a0a0b` hits are a pre-existing hardcoded Tailwind arbitrary-value class in unrelated modal components, not the token layer). **Recommend a real browser pass before this ships**, specifically on `/predictions` (heaviest pre-existing hardcoded-colour surface) and the command palette (`⌘K` — still carries its own untouched `shadow-2xl`/`rounded-2xl`, now sitting on light tokens instead of dark ones, worth a look before Phase 6 formally re-themes it).

Note: an existing `next dev` instance for this repo was already running (pid 69265, started earlier the same day) — used that instance for the smoke test rather than force-killing it or leaving a duplicate process running.

## 7. Pages still requiring migration (Phase 3+)

Everything — no page was migrated onto the new primitives in this batch. Per the roadmap, in priority order: Phase 3 (Home correction, Issues, Decisions, Parliament, Government-redirect), Phase 4 (Predictions/Leaderboard/Simulator — highest violation density, gated on Owner Decision 4 for copy), Phase 5 (People/Impact/Account/Feed), Phase 6 (Chrome: Navbar/BottomNav/CommandPalette/modals — note `Navbar.tsx`/`BottomNav.tsx` still carry inline hardcoded hex, e.g. `#17231c`, `#f04747`, not converted to tokens since that's a component-markup change out of Phase 1/2 scope), Phase 7 (Admin), Phase 8 (cleanup/lint).

## 8. Recommended first Phase 3 page

**Issues** (`/issues`), not Home. Reasoning: Home's `.simple-*` markup already got a full token-level repaint this batch and is visually coherent now; Issues already has the best-aligned existing pattern in the app (`IssuesPageClient.tsx`'s underline tabs, per the original audit) making it the lowest-risk first real consumer of `PageShell`/`PageHeader`/`RecordRow`/`UnderlineTabs`, and it's high-traffic enough that fixing it first delivers visible value before tackling the harder `/predictions` copy-governance gate.

## 9. Files changed

Modified:
- `src/app/globals.css` — full token/typography/`.simple-*` rewrite
- `src/app/layout.tsx` — IBM Plex Serif font load
- `src/components/ThemeProvider.tsx` — `defaultTheme` → `"light"`
- `src/components/ui/dialog.tsx` — overlay shadow token
- `src/components/ui/empty-state.tsx` — `variant` prop, radius fix

New:
- `src/components/ui/page-shell.tsx`
- `src/components/ui/page-header.tsx`
- `src/components/ui/section-header.tsx`
- `src/components/ui/article-card.tsx`
- `src/components/ui/record-row.tsx`
- `src/components/ui/status-label.tsx`
- `src/components/ui/metadata-line.tsx`
- `src/components/ui/underline-tabs.tsx`
- `src/components/ui/evidence-block.tsx`
- `src/components/ui/__dev__/design-system-showcase.tsx`
- `src/components/ui/__dev__/underline-tabs-demo.tsx`
- `src/lib/__tests__/design-system-foundation.test.ts`
- `DESIGN_SYSTEM_FOUNDATION_BATCH_REPORT.md` (this file)

Also updated: `CIVIC_DESIGN_SYSTEM.md` (Phase 0 decisions recorded, Part 3/6 annotated as implemented/resolved), `DESIGN_SYSTEM_MIGRATION_ROADMAP.md` (Phase 0/1/2 marked complete).

Not touched: any page under `src/app/*/page.tsx` (beyond the automatic token repaint), any database/migration file, any wallet/settlement/authentication code, any `/predictions` copy.

## 10. Production safety confirmation

No git add/commit/push. No deploy. No database or migration operation of any kind. No environment file, credential, or secret was read, written, or printed. `node scripts/secret-scan.mjs` confirms no suspicious patterns in tracked files. This entire batch is local, uncommitted working-tree changes plus new files, exactly as scoped.
