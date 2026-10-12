# Homepage spacing review — 8 October 2026

## Build a Ballot: measured facts

Source: [Build a Ballot homepage](https://www.buildaballot.org.au/). Read-only browser inspection used getBoundingClientRect() and getComputedStyle() at confirmed CSS viewports of 1440×900 and 390×844. Heights below are measured pixels, rounded to one decimal; no height is a visual estimate. Hidden sections are excluded. Nested wrappers are identified to avoid double-counting.

| Section | Desktop height | Mobile height |
|---|---:|---:|
| Hero including navigation | 900.0 | 844.0 |
| Hero content (nested) | 786.8 | 772.0 |
| How it works | 1064.0 | 1697.4 |
| How it works inner wrapper (nested) | 968.0 | 1649.4 |
| Testimonials | 932.0 | 547.6 |
| Government statement | 534.4 | 479.5 |
| Three feature columns | 589.2 | 771.1 |
| FAQs | 1001.9 | 762.8 |
| Donors | 443.6 | 479.5 |
| Signup | 966.2 | 1195.7 |
| Footer | 549.3 | 893.9 |

The hero wrapper declares `min-height: 100dvh` and `display:flex; flex-flow:column`. Its navigation measures 113.2px desktop and 72.0px mobile; the remaining hero content measures 786.8px and 772.0px. The content uses flex alignment (`align-items:center; justify-content:center`), not a fixed-height text box.

Ordinary `.section-padded` wrappers use 48px padding on every side at desktop and 24px on mobile. Most desktop content is additionally wrapped in `.padding-section-medium` with 80px top/bottom padding: a total 128px inset at each vertical edge. That inner padding becomes 0 on mobile. The desktop main reading container has max-width 1024px; the FAQ container has max-width 768px. These width constraints and generous insets matter as much as viewport sizing.

Most later sections have computed `min-height:0px`, so their heights follow content and padding. Testimonials change height as the carousel runs: the first desktop reading was 887px and the saved later reading is 932px. Treat that section and subsequent document Y positions as time-dependent. The saved JSON records section start positions. The how-it-works section is actually taller than a desktop viewport and roughly two mobile viewports.

No top border is used on the inspected outer sections. Major visual boundaries come from background changes (image, off-white, grey, green, charcoal), spacing and different content arrangements. Document scroll-snap-type is `none`.

**Visual interpretation:** the page feels like a series of broad editorial chapters because it limits each region to one dominant idea, separates it with substantial whitespace, centres the hero and constrains reading widths. That is an interpretation of the composition, not a claim that every region uses viewport heights. Stickee adopts the spacing principles while retaining its monochrome palette, serif headlines, existing cards, hierarchy and copy. None of the reference's images, slogans, coloured panels or testimonial treatment are used.

## Stickee: isolated preview and application

An independent copy in `/tmp/stickee-homepage-preview` was created before editing the working homepage. It excludes environment files and runs on loopback port 3105 with Supabase explicitly disabled and its URL/keys empty. The unchanged baseline is available only in that temporary copy at `/homepage-before`; the proposed layout is at `/`. No preview route was added to the project. The two presentation files were transferred into the working tree only after both viewport comparisons.

Changes:

- Hero: `min-height:calc(100svh - 69px)` with a `vh` fallback, centred using grid. The 69px constant matches the existing 68px navigation row plus 1px border. Content can grow beyond this minimum.
- Desktop introduction and closing guide: `min-height:80svh` with a `vh` fallback; centred vertically. Minimum is removed below 768px.
- All sections reuse the canonical wide PageShell (1152px outer maximum, matching navigation), with 32px desktop and 20px mobile internal gutters. At 1440px the content left edge is 176px and usable width is 1088px; at 390px they are 20px and 350px. Hero copy remains capped at 768px and body copy at its existing narrower measure.
- Introduction/guide vertical padding is `clamp(56px,8svh,96px)`; data sections use `clamp(40px,6svh,64px)` and have no minimum height. Existing 64px inter-section gaps are replaced by explicit section padding.
- Header actions may wrap on mobile instead of forcing the heading into a narrow column. Borders demarcate the introduction and guide without changing branding.
- No fixed content heights, overflow clipping, scroll handlers, snapping or animation. Print media removes viewport minima and reduces vertical padding.

Measured comparisons (original → proposed):

| Section | 1440×900 | 390×844 |
|---|---:|---:|
| Know what’s changing.Know what to do. | 483.9 → 831.0 | 431.7 → 775.0 |
| Where to start | 309.4 → 720.0 | 663.3 → 799.4 |
| National snapshot | 280.5 → 388.5 | 312.5 → 413.8 |
| Government activity | 280.5 → 388.5 | 344.0 → 433.8 |
| Forecasts | 320.5 → 428.5 | 320.5 → 421.8 |
| A short guide to tracking your seat,your issues, and what happens next. | 177.5 → 720.0 | 256.5 → 334.5 |

## Verification and limits

- Inspected full-page screenshots of both layouts at both required sizes. The comparison HTML presents each pair at equal scale. Default onboarding, cookie and push prompts were dismissed through their existing controls for comparison; their implementation is unchanged.
- Exact rendered main text and all 11 content links match baseline at both sizes. Heading order, card components, forecast data function, eligibility filter, two-item cap and empty states are unchanged.
- Additional 320×568, 390×400 and 720×450 checks find no horizontal overflow or out-of-bounds headings, paragraphs or links. At 320×568 the hero grows to 536.4px above its 499px minimum; at 390×400 it grows to 431.7px above a 331px minimum. This exercises content growth, not merely a large empty viewport.
- 76 existing Vitest tests pass (24 homepage/forecasts and 52 design-system foundation). Scoped ESLint and TypeScript `--noEmit --incremental false` pass. The added `verify-measurements.mjs` passes and includes negative controls for overflow/clipping; it validates captured evidence, not a live browser session.
- Authentication and populated forecasts were not exercised against a database: this is a presentation-only task and the isolated preview intentionally has no database access. Auth/navigation code and business logic were not edited. No claim of a full accessibility audit or cross-browser certification is made.
- The header offset must be updated if the shared navigation height changes. Existing optional banners can add their own height above the hero. Mobile bottom navigation is preserved, including the existing bottom-of-page clearance.
- No new dependencies, migrations, commits, pushes or deployments. Production was not accessed. No authored tests remain unexecuted.

## Files and review

Application changes: `src/app/page.tsx`, `src/app/home.module.css`. Evidence and verification: this directory (report, gates, captured JSON, screenshots, comparison HTML and evidence checker). Pre-existing unrelated changes were preserved.

Manual action: review the local preview before approving any commit, push or deployment. To discard this task, restore only the homepage presentation diff and remove its new CSS/evidence files; do not reset unrelated changes. The temporary server can be stopped independently without affecting the existing development server.
