# The Stickee Charter

Governed by [`AGENTS.md`](../../AGENTS.md), the Stickee project constitution. `AGENTS.md` is the operating constitution — engineering discipline, security, production safety, verified infrastructure. This Charter is Stickee's other governing document: the beliefs, reasoning habits, and boundaries that should shape a judgement call when no rule already covers it. Where the two overlap, `AGENTS.md` wins and this Charter should be corrected. Where this Charter is silent, the Stickee Governance Council (`docs/STICKEE_COUNCIL.md`) applies it.

New to Stickee? [`HOW_STICKEE_THINKS.md`](HOW_STICKEE_THINKS.md) is a short, plain-language front door to this Charter — read it first if you want the two-minute version before this one.

This Charter does not replace any existing standard — `AGENTS.md`'s truthfulness classification, `docs/STICKEE_COUNCIL.md`'s review process, `docs/MP_SCORE_METHODOLOGY_REQUIREMENTS.md`'s scoring bar, `docs/page-audits/CIVIC_ACTION_MODEL.md`'s action model, or `docs/page-audits/RESPONSIBILITY_MAP_SPEC.md`'s accountability structure. It is the *why* underneath all of them, written down once so it doesn't have to be re-derived from scratch every time someone builds something new.

Read this before product, editorial, AI, moderation, or civic-data work. It is written for every engineer, designer, academic, journalist, policy researcher, moderator, open-source contributor, and AI agent who touches Stickee — present or not yet arrived.

**A note on tense.** Every principle below is stated as a standard Stickee is held to, not a claim that every mechanism it implies is already built. Where a principle describes something not yet implemented (a correction log, a revision history, a verification tier), that gap is tracked in the relevant architecture or product document, not restated here — this Charter says what "done" looks like, not what's already done. Treat any present-tense principle here as binding intent, and check `docs/architecture/`, `docs/audits/`, or `docs/PRODUCT_PATTERN_LIBRARY.md` for actual build status before assuming a described mechanism exists in the product today.

**A note on revision.** This Charter itself is expected to be revised as Stickee's understanding deepens. A material change to it should be dated and explained in the commit or PR that makes it, per Section 9's own standard applied to itself — not silently rewritten with no trace of what it said before.

---

## 1. Preamble

Stickee has a founder, and it has a philosophy. They are not the same thing, and this Charter keeps them separate on purpose.

The founder's motivation is personal: a belief that most Australians go through political life without a clear picture of how it actually works, who is actually responsible, or how they might actually change something — and that this is fixable. That belief is why Stickee exists. It is not, by itself, platform policy, and nothing in this Charter asks a contributor to share it as a matter of loyalty.

What *is* platform policy is what follows from taking that belief seriously: that understanding should come before judgement, that evidence should outrank opinion, that mistakes should be visible rather than hidden, and that Australia's civic life is worth building for on its own terms — not as a wrapper for someone's politics, including the founder's.

Read the personal motivation as the reason this project exists. Read everything after this section as the standard it must be held to, independent of who is holding the pen on a given day.

## 2. Why Stickee exists

Most people are not disengaged from politics because they don't care. They're disengaged because the system is genuinely hard to follow: who decided what, who's responsible, what the alternatives were, whether it worked. Complaining is easy. Understanding is not. Stickee exists to close that gap — not by simplifying politics into something it isn't, but by doing the work of making it navigable.

Stickee is built first for the Australian with little or no formal political background — not because expert readers don't matter, but because a platform that works for a beginner works for everyone, and a platform that only works for the already-informed has failed the people who need it most.

**Essential civic knowledge remains free.** Understanding what your government has done, who represents you, and what's likely to happen next is not a premium feature. Stickee may build sustainability through donations, grants, institutional partnerships, professional tools, or API access — but the core of "help me understand my democracy" never sits behind a paywall. If a funding model would require withholding basic civic understanding to make money, that funding model is wrong for Stickee, not the other way around.

Stickee's ambition beyond understanding is participation: helping someone move from knowing what happened to being able to act on it, and from acting on it to being able to see, later, whether it mattered. A platform that stops at "here's what happened" has done half the job.

## 3. Who Stickee serves

Stickee serves the Australian who has never opened a Hansard transcript, the one who reads the news every day and still can't say who's accountable for a given decision, and the one who has given up trying to follow politics at all. It serves them first, and it serves the journalist, academic, policy researcher, and expert reader by building the same evidence deep enough that they can go further with it — not by building two separate products.

This is a design constraint, not a slogan: the same underlying evidence should be available to a beginner and an expert, presented at progressively deeper levels of the same page rather than gated into separate tiers. A beginner gets the plain-language summary; a specialist gets the citation trail underneath it. Both are looking at the same fact.

Stickee also serves people who are not its daily users: the politicians, officials, and institutions its content describes. They are owed accuracy, fair characterisation, and a real correction pathway — not because they are customers, but because getting them wrong undermines the trust of everyone who *is* a user.

## 4. What role Stickee chooses to play

Stickee does not tell Australians what to think.

Stickee is a facilitator — a place to understand, question, forecast, participate, and express a view safely, surrounded by evidence rather than instructed by it. It is not a political actor. It does not hold positions on parties, candidates, or policy outcomes, and it does not build features designed to move opinion in a particular direction.

This is a deliberate, load-bearing choice, not an absence of conviction. Choosing not to advocate is itself a position — one that trades the reach of a persuasive platform for the durability of a trusted one. A platform that picks sides eventually serves only the side it picked. Stickee is choosing to be useful to everyone who wants to understand, for as long as the platform exists, over being powerful for one faction for as long as that faction is ascendant.

**Impartial in process, not indifferent to evidence.** Neutrality does not mean treating every claim as equally supported — see Section 5. It means the *process* by which Stickee evaluates claims doesn't change depending on who's making them.

## 5. How Stickee approaches truth

Ideas are evaluated by evidence, reasoning, and relevance — not by popularity, media attention, institutional power, or ideological label. An unpopular idea is not wrong because it's unpopular, and a popular one is not right because it's popular. Labels are not arguments; "that's just a [label]" is never, on its own, a rebuttal Stickee treats as sufficient, and neither is Stickee's own use of a label a substitute for stating the actual claim and evidence underneath it.

**Impartial in process, not indifferent to evidence.** When the evidence genuinely differs in strength between two positions, Stickee says so. Manufacturing the appearance of a fair fight between a well-evidenced claim and a poorly-evidenced one is not neutrality — it's a different kind of distortion, one that misleads by omission instead of by commission. The test is not "did we give both sides equal space" but "did we represent the actual state of the evidence."

**The harder truth over the easier wrong.** A wrong answer that's simple, satisfying, and confirms what the reader already believed is not preferable to a right answer that's more complicated. Stickee's job gets harder, not easier, as a topic gets more contested — that is exactly when the discipline of evidence-first reasoning matters most.

Every public factual claim is classified as one of: verified fact, sourced analysis, forecast, community opinion, AI-generated interpretation, disputed claim, demo content, or unknown/no verified data available. This is not a stylistic nicety — it is the mechanism that makes "impartial in process, not indifferent to evidence" operational rather than aspirational. A claim without a classification has not actually been evaluated; it has just been published.

Truth, on Stickee, is not a static final page. Understanding grows as evidence accumulates, as questions get better, and as the connections between issues, decisions, and outcomes become clearer over time. A page is a current best understanding, dated and sourced — not a permanent verdict.

## 6. How Stickee handles disagreement

A contested political question is represented through the strongest form of each competing position: its best evidence, its stated assumptions, its acknowledged uncertainties, and how it responds to the strongest criticism against it — not through a caricature that's easy to dismiss. Steelmanning every side is a discipline, applied even to positions the person writing the page personally finds unpersuasive.

This does not produce false balance. If one position rests on established evidence and another rests on a hypothesis or a debunked premise, Stickee says that plainly, while still representing the weaker position's actual argument fairly rather than misrepresenting it to make it easier to dismiss. Fair representation and equal weighting are different things; Stickee commits to the first, not the second.

**Understanding before judgement.** A reader should be able to see why a position is held — its logic and its evidence — before Stickee (or the reader) reaches a verdict on it. Context comes before conclusion, structurally: on a page, the background and the competing arguments appear before any synthesis or "what the evidence shows" statement, never as an afterthought bolted onto a predetermined conclusion.

## 7. How Stickee communicates uncertainty

**Uncertainty is information, not a defect to be hidden.** A confident-sounding wrong answer is worse than an honest "this is disputed" or "this is not yet known." Every substantive answer should make visible: what is established, what is genuinely disputed, what remains uncertain, what evidence each position rests on, and what questions naturally follow.

**Every answer should generate better questions, not manufacture certainty.** A page that closes a topic down — that makes a reader feel there's nothing left to ask — has usually done so by hiding complexity rather than resolving it. A page that leaves a reader with a sharper, more specific question than the one they arrived with has usually told the truth.

This applies to Stickee's own outputs, including forecasts and AI-generated interpretation: a probability is a statement of uncertainty, not a prediction dressed up as fact, and it is labelled as exactly what it is.

## 8. How Stickee uses AI

AI may draft, classify, summarise, and explain. People remain accountable for what gets published. This is not a soft preference — it is the line that decides what AI is allowed to publish without a human checking it first.

AI may publish automatically only where all of the following are true: the input is structured and already verified, the transformation applied to it is deterministic or tightly constrained (not open-ended interpretation), safeguards exist to catch a failure, the provenance of the output is visible to the reader, a failure is reversible, and the overall risk of getting it wrong is low. A civic alert generated from a confirmed division result is a reasonable candidate. An open-ended AI-written characterisation of a contested political dispute is not.

High-risk content always requires human review before publication, without exception: accusations against a real person, legal interpretation, medical claims, anything affecting a public figure's accountability record, disputed historical claims, moderation decisions, and anything resembling election or democratic-process guidance. These categories are named specifically because getting them wrong causes a different order of harm than a typo — reputational, legal, or civic harm that a later correction only partially undoes.

Every piece of AI-generated interpretation is labelled as exactly that on the page itself, not just in a methodology document nobody reads, and it never inherits the confidence of the verified source material it was built from. An AI summary of a real vote record is still an interpretation, not the vote record.

**AI may assist; people remain accountable.** If an AI-assisted page turns out to be wrong, "the AI wrote it" is not an answer to who's responsible — a person is.

## 9. How Stickee corrects mistakes

Mistakes are inevitable at Stickee's scale and ambition. Concealing them is not a mistake — it's a choice, and it's the one thing this platform cannot survive making twice.

Corrections are public, dated, explained, and linked to the evidence that prompted them. They are never silently applied — a value quietly changing between one visit and the next, with no trace that it was ever different, is exactly the failure mode this section exists to prevent. Where a correction changes a material fact on a canonical page (a decision, a bill, an MP record, a forecast resolution), the standard Stickee holds itself to is that the prior version stays visible in the page's history, not because every past state is precious, but because a reader should be able to see that Stickee got something wrong and how it was fixed — that visibility is what makes the correction trustworthy rather than merely convenient. Where the revision-history mechanism this implies does not yet exist for a given content type, that is a real, tracked product gap (see `docs/PRODUCT_PATTERN_LIBRARY.md`'s "Canonical page revision history" and "Evidence-based public corrections" entries) — not a reason to lower the standard once it's built.

Stickee itself is accountable for its mistakes on the same terms it holds public figures accountable for theirs: visibly, with evidence, without spin. A platform that demands transparency from politicians while quietly editing its own record has forfeited the standard it's asking others to meet.

## 10. How Stickee thinks about accountability

**Accountability follows the decision**, not simply the most recognisable name attached to it. A backbench MP and a minister do not hold the same institutional power, and treating them as interchangeable — because one is more visible or more quotable — misinforms the reader about how government actually works.

Government is a system of distributed responsibility, not a simple ladder with one person at the top of every question. Political responsibility, legislative responsibility, administrative responsibility, regulatory responsibility, oversight responsibility, and delivery responsibility are frequently held by different people or institutions for the same outcome, and Stickee's job is to show which is which — not to collapse them into "the government did this" when the honest answer is more specific.

Stickee never reduces a person's accountability record to "everything this person did wrong." A fair record shows: what they're responsible for, what they've committed to, the decisions they've actually made, the evidence behind each, the outcomes that followed, the criticism they've faced, how they responded to it, any inquiries, any corrections, and their current status. A record built only from someone's worst moments is not accountability — it's a hit piece with better sourcing, and it fails the same standard this section sets for Stickee's own conduct in Section 9.

## 11. How Stickee teaches politics

Stickee starts with the citizen's lived question, not an institutional org chart. Nobody opens Stickee wondering how Parliament's bicameral structure works in the abstract — they open it wondering why their rent is expensive, why a hospital wait is long, or what a specific announcement actually means for them. That question is the entry point, every time.

From "why is my rent so expensive," a reader should be led through the actual contributing causes, which level and branch of government is genuinely responsible, the relevant ministers, departments, and institutions, what's already been decided, what was promised versus what happened, what's forecast to happen next, and what a realistic civic action looks like from here. Institutions are explained only when they become relevant to the question at hand — never as a prerequisite the reader has to clear before Stickee will answer them.

**Start with the citizen's question, not the institution.** A user should never need to understand how Parliament works before Stickee becomes useful to them. If a page requires prior civic literacy to make sense of, that page has failed its first-time reader, regardless of how accurate it is.

## 12. How Stickee supports civic action

Contacting an MP is one civic action among several, and it is never presented as guaranteed influence. Stickee can confirm that an email was drafted and sent from a reader's device; it cannot confirm that the MP's office read it, and it must never imply otherwise.

Civic action is contextual and stage-aware: what a reader can meaningfully do about a bill in committee is different from what they can do about a bill that already passed. The available actions — understanding the issue, seeing who decides, following it, tracking a vote, contacting a representative or the responsible minister, making a committee submission, participating in a consultation, submitting evidence, supporting a structured proposal, following a forecast, receiving verified updates — are only ever shown where they genuinely apply to the object's current stage, never as decorative buttons that exist because a page "should" have a call to action.

Every civic action states, in plain language before the reader commits to it: who receives it, what it can realistically achieve, what Stickee can confirm actually happened, what Stickee cannot confirm, and what happens after. A "contact your MP" button that quietly does nothing, or a participation counter built from a number nobody actually computed, is not a smaller version of this standard — it's a different thing entirely: a trust failure wearing a civic-action costume.

## 13. How Stickee protects Australian civic participation

Stickee exists to serve Australian democracy, Australian institutions, and the people participating authentically in Australian public life. That focus is civic, not ethnic — it is never defined by ancestry, surname, religion, or race, and no feature should be built or interpreted in a way that makes it so.

Foreign influence and coordinated manipulation are real risks to a platform like this, and they are handled as exactly what they are: an authenticity, funding, coordination, and manipulation problem. They are not handled by testing anyone's background — that substitutes a discriminatory proxy for the actual problem and would betray the civic (not ethnic) focus this section commits to.

Public reading of Stickee stays open to anyone. Where a specific feature claims to measure "what Australians think" — an aggregate opinion signal, a forecast market's implied public view, a civic sentiment number — that claim carries real weight, and real weight requires it to actually be true. Features that make this kind of claim may require proportionate, privacy-preserving verification that a participant is a real, authentic Australian participant, collecting the minimum fact necessary and avoiding retention of identity documents or exact addresses wherever the goal can be achieved without them. Stickee should be able to distinguish, at minimum: the public reader, the account holder, the verified Australian participant, the verified organisation, the verified public figure, and the international observer — because these are different trust levels, and a metric described as "what Australians think" that secretly includes bots, undisclosed organisations, or unverified overseas participation is a fabricated claim wearing real numbers, no better than any other invented statistic this platform refuses to publish.

## 14. How Stickee treats culture, belonging, and national focus

Stickee is culturally and visually Australian without becoming a vehicle for anyone's version of Australian identity politics. It can foster a shared factual foundation and a sense of civic kinship among people who disagree — that is a genuine ambition, not a decoration — but it does this by building common ground in evidence, not by requiring political agreement as the price of belonging.

Australian history is presented with evidence, context, and respect for its actual complexity. A platform whose entire premise is "understand before judging" cannot flatten its own country's history into something simpler than it was, in either direction. Where history is genuinely contested, the same discipline from Section 6 applies: represent the strongest form of each account, and be honest about where the evidence is stronger on one side.

The goal is a platform where Australians who disagree politically can still recognise a shared set of facts and a shared institutional reality — not agreement, but legibility to each other.

## 15. How Stickee approaches forecasts

Forecasting belongs on Stickee because it gives Australians a structured way to express uncertainty about outcomes and stay engaged with what actually happens next — not as entertainment, but as an extension of evidence-based understanding into the future tense.

A real forecast has: a clear, unambiguous question; objective resolution criteria stated before the outcome is known; a named source that will resolve it; a visible closing date; a public, permanent record of the outcome once resolved; preserved history even after resolution; and honest handling of void/ambiguous cases rather than a quiet reclassification that favours one side.

A forecast is never built on fake urgency, fake volume, fake participants, fabricated movement, or a leaderboard populated by anything other than real participation. If a forecast surface cannot yet meet this bar with real data and a real mechanism, the honest response is to say so plainly — a "demo" label or a smaller, truthful scope — not to simulate the missing parts until real data arrives.

Where a forecast mechanic could plausibly attach real-world redeemable value to virtual participation — directly, through a roadmap, or through any secondary mechanism — that mechanic requires real, professional legal review before it ships, regardless of how the surrounding design looks. This is not a judgement this Charter, or any AI agent, is qualified to resolve on its own; see `agents/legal-regulatory-advisor.md` and the escalation rules in `docs/STICKEE_COUNCIL.md`.

## 16. How Stickee approaches community discussion

Lawful, robust disagreement is welcome. Threats, harassment, doxxing, impersonation, defamation, illegal content, coordinated manipulation, spam, and inauthentic participation are not — and the line between the two does not move depending on whose politics is being disagreed with.

Rules are applied consistently regardless of political viewpoint. A moderation system that is even perceived to enforce its own rules unevenly by side has damaged the thing Stickee exists to build, independent of whether any individual enforcement decision was technically correct.

**Context before conclusion.** A quote, a clip, or a claim links back to its original source, full context, date, and surrounding material wherever that's practically possible — a fragment presented without its context is one of the most common ways true information becomes a false impression, and Stickee's editorial and community surfaces are both held to the same standard on this.

## 17. How Stickee designs experiences

Stickee is a curious investigator, not a broadcaster: it travels widely for evidence, listens to more than one account, checks sources before repeating them, preserves the context around a claim, asks better questions rather than settling for the first plausible answer, and stays willing to revise when better evidence arrives. That posture is a design principle as much as an editorial one — it should be visible in how a page is built, not just in what it says.

Knowledge on Stickee is connected as a graph, not filed away as isolated pages. Issues, promises, decisions, bills, votes, people, portfolios, departments, committees, agencies, evidence, timelines, forecasts, outcomes, and civic actions relate to each other, and the product should make those relationships navigable — a reader following one thread should be able to reach the others it genuinely connects to, not hit a dead end at the edge of a single page's content.

Beauty and simplicity are not decoration; they exist because they improve comprehension. An interface that reduces friction is an interface that makes curiosity effortless instead of exhausting — and effort spent fighting the interface is effort not spent understanding the country's politics, which is the only thing the interface is for.

The product should feel calm, modern, serious, trustworthy, Australian, evidence-first, structured, readable, and beautiful — accessible to a genuine political beginner without insulting anyone's intelligence. It should never feel manipulative, casino-like, partisan, elitist, bureaucratic, needlessly technical, socially addictive, or hostile to someone arriving for the first time. Where this Charter's aesthetic language and `CIVIC_DESIGN_SYSTEM.md`'s concrete tokens differ in specificity, the design system is the implementation of the principle stated here, not a competing standard.

## 18. How Stickee measures success

Progress is not measured by features shipped, time on site, comment volume, outrage, or clicks. Those are the metrics of a platform trying to hold attention. Stickee is trying to earn trust, which is measured differently.

Stickee listens before it teaches. User feedback, comprehension testing, and honest bottleneck analysis should continuously improve how something is explained — not just what's covered, but whether an actual reader understood it. Personalisation may adapt what's presented and how relevant it's made to a specific reader; it never adapts the underlying facts themselves. The same evidence is available to a beginner and an expert, at different depths, never as different truths.

Real success looks like a reader who, after using Stickee, can explain what changed, identify who's actually responsible, tell a proposal apart from a decision, find the evidence behind a claim, understand what happens next, complete a meaningful civic action, and later check whether an outcome actually occurred. **Stickee succeeds when a user leaves more informed, more capable, and more connected to Australian civic life than when they arrived** — not when they've spent longer on the page.

## 19. Non-negotiables

These hold regardless of deadline, feature pressure, or how populated a page would look without them:

- Stickee does not fabricate a statistic, score, quote, source, or claim of public opinion, under any circumstance, to make a page look more complete.
- Stickee does not present demo, mock, inferred, or AI-generated content as verified fact.
- Every public political claim carries a classification: verified fact, sourced analysis, forecast, community opinion, AI-generated interpretation, disputed claim, demo content, or unknown.
- Corrections are public, dated, explained, and never silently applied.
- High-risk AI output (accusations, legal or medical claims, public-figure accountability, disputed history, moderation, election guidance) always gets human review before publication.
- Australian focus is civic, never ethnic, ancestral, religious, or based on surname.
- A metric described as reflecting "what Australians think" never knowingly includes bots, undisclosed organisations, or unverified non-Australian participation.
- No civic action is presented as guaranteed to produce a specific outcome Stickee cannot actually verify.
- No forecast mechanic that could carry real-world redeemable value ships without real legal review.
- Moderation and editorial standards apply identically regardless of political viewpoint.
- Stickee's own mistakes are held to the same accountability standard it applies to public figures.

If a proposed feature requires breaking one of these to work, the feature is wrong, not the rule.

## 20. Contributor decision test

Before implementing a feature, every contributor — human or AI — should be able to answer:

1. What user question does this answer?
2. Which civic object owns it?
3. What evidence supports it?
4. How is uncertainty represented?
5. Who is responsible for the underlying decision?
6. Does this improve understanding?
7. Does this reduce cognitive load?
8. Does this duplicate an existing system?
9. Does this create pressure, manipulation, or false urgency?
10. Can a beginner understand it?
11. Can the claim be corrected publicly?
12. Does it serve Australian civic life?
13. Does it treat people consistently regardless of viewpoint?
14. Does it preserve privacy and collect only necessary data?
15. Would Stickee still be proud of this decision in ten years?

If the answer to any of these is unclear, the feature is not ready — not blocked forever, just not ready yet. Get the answer, or route it through the Council (`docs/STICKEE_COUNCIL.md`), before writing the code.

## 21. Closing declaration

Stickee is not trying to win an argument. It is trying to make Australian democracy legible enough that its readers can form their own.

It will get things wrong sometimes — every serious attempt at this does. What distinguishes Stickee is not the absence of mistakes but what happens after one: the correction is visible, the reasoning is shown, and the standard doesn't bend for whoever is inconvenienced by it. That is the whole bet this platform is making, and it is a bet on trust outlasting speed, evidence outlasting attention, and understanding outlasting outrage.

Every contributor who touches this project, on any given day, is a temporary steward of that bet. This Charter exists so the bet survives the people currently holding it.
