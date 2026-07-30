# Ideas / backlog

Not scheduled — just notes to revisit later.

## Post-ride recovery card

Small card/section: "after the ride, eat ~X g carbs in the first 30 min"
(1.0–1.2 g/kg body weight), computed from `route.weight`. Complements the
during-ride plan rather than replacing anything. Seen on carbmyride.com.

## Content articles for SEO

carbmyride.com's actual growth lever is a handful of long, well-sourced
articles (bonking science, evidence-based fueling strategies) that Google
indexes and that link back to their calculator. We have nothing like that —
worth writing 1-2 genuinely useful posts (e.g. "why there's a ~90 g/h
absorption ceiling", "bottle vs. gel logistics for long rides") that link
back to `/`. Needs a place to host them (own `/articles` route vs. a
separate blog) — undecided.

## Auto-plan button (v2.0)

Upload a GPX, have products/bottles already configured, click one button and
the app generates the whole plan itself — what to drink/eat, where, when,
how many refills. Basically inverts `domain/fuel.ts`: instead of computing
supply/demand from a plan, generate a plan that satisfies supply/demand.
Edge case (bottle capacity vs. refill frequency) is rare in practice since
a bottle can be drunk in ~10 min and refilled many times — so no need for a
strict feasibility check. Just do the best possible allocation and surface
any remaining gaps (e.g. "short X g carbs on this stretch") rather than
failing outright.

## Combine refills across bottles

At a shop stop you often don't mix each bottle separately — you mix
everything into one jar and pour it out into the bottles from there. Add a
way to mark "sum these bottles" at a refill so the app shows one combined
total (grams/products) to prepare, instead of a separate breakdown per
bottle.
