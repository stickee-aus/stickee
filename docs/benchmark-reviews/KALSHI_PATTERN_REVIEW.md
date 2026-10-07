# Benchmark Pattern Review — Kalshi

Documentation-only review by the **Product Intelligence & Benchmarking Advisor**, using the [Product Benchmark Review](../../agents/templates/product-benchmark-review.md) template and the standards in [docs/PRODUCT_BENCHMARKING_METHOD.md](../PRODUCT_BENCHMARKING_METHOD.md). No application code was changed to produce this review.

## Input

```
User problem or product area under study: How should Stickee present a forecast so
  a reader can judge its credibility, not just its current number?
Products considered: Kalshi (regulated event-contract exchange; publicly observable
  market pages and published platform documentation)
Evidence gathered: Public-facing market page structure and platform documentation,
  as observed/described in general prediction-market industry practice. No
  authenticated account, trading interface, or restricted data was used.
Restricted access note: Confirmed — no scraping, no authenticated access.
```

Kalshi is a real-money, CFTC-regulated event-contract exchange. Every pattern below is reviewed specifically for what transfers to a **virtual-points-only, editorial, non-trading** context — Stickee's mission filter and AGENTS.md's rejection of gambling-first/real-money framing apply throughout.

---

## 1. Question-centred market page

Problem solved: A reader wants a direct answer to a specific, falsifiable question, not a page organized around an institution or a general topic.
Observed implementation: Each market's page is headed by the literal yes/no question, with all supporting content (rules, price, activity) subordinate to it.
Transferability to Stickee: High — Stickee's forecast pages could adopt "the question as headline" directly; this requires no gambling-adjacent framing to work.
Risks: None specific to this pattern in isolation; risk appears when combined with trading-style aesthetics (see #2).
What not to copy: Nothing structurally risky here — the question-first heading is a content-organization principle, not a visual or commercial one.
Recommended adaptation: Restructure forecast detail pages so the question is the H1, with editorial framing ("what we're tracking") replacing trading language ("what you're betting on"). See `Question-centric forecast page` in `docs/PRODUCT_PATTERN_LIBRARY.md`.
Smallest experiment: Rework one existing forecast's heading/structure; no data changes required.
Relevant council reviewers: UX Researcher (does it read clearly), Editorial Advisor (tone).
Decision recommendation: **Adapt**

## 2. Trading-floor visual language (reject)

Problem solved: N/A — this is a pattern to explicitly exclude, not adopt.
Observed implementation: Buy/sell buttons, green-up/red-down price movement, ticker-style numeric emphasis, urgency cues around market close.
Transferability to Stickee: None. This is precisely the "gambling-first framing" and "green/red betting aesthetics" AGENTS.md's monochrome editorial design principle and the Global Council Principles explicitly reject.
Risks: Adopting this would misrepresent Stickee's virtual-points forecasts as financial instruments — both a mission-identity risk and a Legal Advisor "Do not launch before legal review" trigger per `agents/legal-regulatory-advisor.md`'s existing gambling-adjacent-risk mandate.
What not to copy: All of it — buy/sell language, red/green colour-coding, urgency countdowns, real-money framing.
Recommended adaptation: None; use neutral, editorial number presentation (see the monochrome design principle) instead.
Smallest experiment: Not applicable — this is a reject, not an experiment candidate.
Relevant council reviewers: Legal Advisor, Product Strategist.
Decision recommendation: **Reject**

## 3. Transparent resolution criteria

Problem solved: A reader can't judge whether a forecast is meaningful without knowing exactly what would resolve it, and when.
Observed implementation: Every market states, before the event occurs, a specific, checkable condition for YES/NO resolution.
Transferability to Stickee: High in principle, but political events are frequently more ambiguous than sports or economic-data events (Kalshi's typical fare) — "did the government implement X" can have genuinely contested answers even after the fact.
Risks: A resolution rule that *looks* precise but glosses over real political ambiguity could itself mislead, and would need case-by-case Public Policy review rather than a single fixed rule.
What not to copy: Kalshi's real-money dispute/settlement process — irrelevant and inappropriate for virtual points; also don't imply resolution is always purely mechanical when it sometimes requires editorial judgement.
Recommended adaptation: Add a visible "How this resolves" section to every forecast, with Public Policy Advisor review per forecast (not a one-time template), and an explicit note when judgement was required. See `Transparent resolution criteria` in the pattern library.
Smallest experiment: Add resolution criteria to one existing forecast, reviewed by Public Policy before publishing.
Relevant council reviewers: Public Policy Advisor (mandatory), Legal Advisor, Editorial Advisor.
Decision recommendation: **Experiment first**

## 4. Probability history chart

Problem solved: A single current number hides whether opinion is stable or shifting, and gives no way to audit the number.
Observed implementation: A time-series chart of the market's probability sits alongside the current value.
Transferability to Stickee: Already partially built — **`src/components/FeaturedMarketCard.tsx` already renders a `ProbabilityHistoryChart`** fed by a 14-day `history` array in `src/lib/mock-market-data.ts`. This is not a net-new pattern to adopt; it's an existing implementation that needs a truthfulness fix, not a design fix.
Risks: The existing `history` array is entirely hardcoded mock data with no real prediction volume behind it — displaying it without a "demo data" label is the same fabricated-signal problem the government-page dry review already flagged for `/decisions` sentiment bars.
What not to copy: Presenting the chart with unqualified authority when the underlying sample is mock or thin.
Recommended adaptation: Add a one-line methodology/demo-data disclosure beneath the existing chart; no new chart component needed. See `Probability history with methodology` in the pattern library (updated after this discovery).
Smallest experiment: Add the disclosure line to one market card.
Relevant council reviewers: Editorial Advisor, Product Strategist, Software Architect (confirm no duplicate chart component exists elsewhere before any further UI work).
Decision recommendation: **Adapt** (of the disclosure, not the chart — the chart already exists)

## 5. Event lifecycle (open / closed / resolved)

Problem solved: A reader needs to know at a glance whether a forecast is still active, awaiting resolution, or settled — and old, resolved markets shouldn't be presented with the same urgency as live ones.
Observed implementation: Clear state badges and different page treatment for open, closed-awaiting-resolution, and resolved markets.
Transferability to Stickee: High — this is a straightforward information-state pattern with no gambling-specific baggage, and it's directly useful for a forecast archive.
Risks: Low. Main risk is reusing Kalshi's specific state-badge colour conventions (which lean toward trading-style green/red) rather than Stickee's monochrome system.
What not to copy: Colour-coded state badges implying financial win/loss.
Recommended adaptation: A neutral, text-forward status label (e.g. "Open" / "Awaiting resolution" / "Resolved: Yes") using Stickee's existing typographic hierarchy rather than colour.
Smallest experiment: Apply status labelling to a handful of existing forecasts.
Relevant council reviewers: UX Researcher, Software Architect (check `DecisionStatus`-style enum precedent already used in `src/types/government.ts` before creating a parallel one).
Decision recommendation: **Adapt**

## 6. Evidence attached to a forecast

Problem solved: A probability number alone doesn't tell a reader *why* — what evidence or reasoning underlies the current estimate.
Observed implementation: Some market pages link out to relevant news/data sources related to the underlying event.
Transferability to Stickee: High, and directly reinforces Stickee's own sourcing priorities (AGENTS.md Tier 4/5: improve sourcing, improve political accuracy).
Risks: Low, provided sources are genuinely cited (not fabricated) — same evidence-classification discipline as any other Stickee content.
What not to copy: N/A — no specific Kalshi execution to avoid here; the principle itself is safe.
Recommended adaptation: A "relevant evidence" section per forecast, using the same citation-first standard proposed for decisions (see `Citation-first claim presentation` in the pattern library).
Smallest experiment: Add 2–3 cited sources to one forecast page.
Relevant council reviewers: Editorial Advisor, Public Policy Advisor.
Decision recommendation: **Adapt**

## 7. Portfolio / participation clarity

Problem solved: A user who has made several predictions wants a clear, honest view of what they predicted and how it's tracking — without the framing of a financial portfolio.
Observed implementation: A personal dashboard of positions, current value, and realized/unrealized gains.
Transferability to Stickee: Moderate — the underlying need (see my own prediction history) is legitimate, but "portfolio," "gains," and "value" framing is exactly the financial-return emphasis AGENTS.md rejects for virtual points.
Risks: Value/gains language could imply real monetary stakes even if none exist — an Australian Consumer Law "reasonable user belief" risk per the Legal Advisor's mandate.
What not to copy: "Portfolio," "P&L," "gains/losses," or any cash-value framing of virtual points.
Recommended adaptation: A neutral "your predictions" history — what you predicted, current status, and whether resolved predictions were accurate — framed as a personal accuracy record, not a financial position.
Smallest experiment: A simple list view of a test user's past predictions and outcomes, no monetary language.
Relevant council reviewers: Legal Advisor (mandatory — value-framing risk), UX Researcher, Product Strategist.
Decision recommendation: **Experiment first**

## 8. Urgency and closing-soon pressure (reject)

Problem solved: N/A — exclusion pattern.
Observed implementation: Visual and copy emphasis on markets nearing close, encouraging action before the window shuts.
Transferability to Stickee: None — this is engagement-pressure mechanics, explicitly excluded by the mission filter's "avoid... addictive... design" criterion.
Risks: Directly conflicts with Stickee's calm, editorial identity; risks normalising urgency-driven interaction patterns Stickee is trying to avoid across the whole product.
What not to copy: Countdown timers, "closing soon" emphasis, push-style urgency copy.
Recommended adaptation: None — if a resolution date needs to be shown, state it plainly ("resolves 12 March 2026") with no urgency styling.
Smallest experiment: Not applicable.
Relevant council reviewers: Product Strategist, UX Researcher.
Decision recommendation: **Reject**

---

## Summary

Eight patterns reviewed (within the 10-pattern cap). Two are explicit rejects (trading-floor aesthetics, urgency pressure) — both flagged because they directly conflict with AGENTS.md's product-identity and design principles, not because Kalshi executes them poorly. Two patterns (probability history chart, market lifecycle framing) turned out to already exist in some form in the codebase (`ProbabilityHistoryChart`, `resolvesBy`) — the real gap is truthful disclosure of mock data, not new construction. The remaining four (question-first structure, resolution criteria, evidence attachment, participation history) are genuine, well-evidenced adaptation candidates, none stronger than "Experiment first" or "Adapt" pending the named specialist reviews (chiefly Public Policy for resolution criteria and Legal for any participation/value framing).

No pattern here is marked "Adopt" — per `docs/PRODUCT_BENCHMARKING_METHOD.md`, that requires evidence at "established convention" or above *and* clearance from every relevant specialist agent, which has not happened in this documentation-only exercise.
