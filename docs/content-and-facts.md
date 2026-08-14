# Content & facts register — confirmed vs needs_confirmation

Policy: nothing with status `needs_confirmation` appears in the public
build. Machine-readable trust facts live in `src/data/site.ts`
(`TRUST_FACTS`); this file is the human-readable register for everything.

## Confirmed (with source)

| Fact | Where used | Source | Last reviewed |
| --- | --- | --- | --- |
| Contact email `meregrupp@gmail.com` | footer, privacy, form fallback | production freedive.ee + freediving.meregrupp.ee | 2026-08-14 |
| Phone `+372 510 5573` | footer, privacy | production freedive.ee + freediving.meregrupp.ee | 2026-08-14 |
| Facebook `facebook.com/meregrupp` | footer | production freedive.ee | 2026-08-14 |
| English-led training | trust bar, copy | both production sites are English-first | 2026-08-14 |
| Safety-first approach | trust bar, copy | production freedive.ee ("practical and safety-first") | 2026-08-14 |
| Year-round open-water practice (incl. winter) | trust bar, seasons page | production freedive.ee ("throughout the year (including winter)") | 2026-08-14 |
| Service CTA anchors `#start`, `#start-form`, `#rummu`, `#rummu-form`, `#ongoing`, `#plan`, `#safety`, `#faq` | all outbound CTAs | production freediving.meregrupp.ee crawl | 2026-08-14 |
| Rummu ≈ 1 hour drive from Tallinn, western Harju county | Rummu logistics section | public geography (Rummu, Vasalemma/Lääne-Harju) — deliberately vague ("roughly an hour") | 2026-08-14 |
| Rummu history: limestone quarry worked by Murru prison inmates, flooded when pumping stopped | Rummu story | widely documented public history, kept general | 2026-08-14 |
| Hero banner image (diver at Rummu + routes strip) | home hero, OG image | supplied by Meregrupp in this project | 2026-08-14 |
| "Since 2018" | trust bar | production meregrupp.ee/en/ hero ("since 2018", MTÜ Meregrupp) | 2026-08-14 |
| Hero video + poster (underwater footage) | home hero (desktop) | meregrupp-cyber/meregrupp001-ee repo, in production use on meregrupp.ee | 2026-08-14 |

## needs_confirmation (NOT in the public build)

| Fact | Blocked from | What is needed |
| --- | --- | --- |
| "Tallinn & open water" trust badge | trust bar | Meregrupp confirms training locations wording |
| Instructor credentials (EOC underwater sports license, AIDA4 Master-Freediver, AIDA cert link) | team section | written confirmation from Meregrupp that these may be republished on freedive.ee; currently the site links to meregrupp.ee for credentials instead |
| Course prices (legacy site: Level 1 €180), depths (5 m / 14 m), swimming prerequisite (100 m), age limits | everywhere | belongs to the service environment (freediving.meregrupp.ee) as the single source of truth — do not republish here |
| AIDA under-16 limits table | everywhere | same — the service environment owns course/participant facts; also needs AIDA source confirmation |
| Numeric water temperatures, visibility ranges, exact season dates | seasons page | measured/confirmed data from Meregrupp; add to `src/data/seasons.ts` with `source`, `lastReviewed`, `status` fields |
| Rummu site access arrangements, facilities, transport partners | Rummu logistics | current-year confirmation from Meregrupp |
| Equipment rental availability | Rummu FAQ, plan page | Meregrupp confirms what can be provided |
| AIDA organisational status / logos | everywhere | written AIDA confirmation — do not use before |
| Testimonials, statistics, client names | everywhere | none exist; never invent |

## Editing content

- Page copy lives in `src/pages/*.astro`; shared copy in `src/data/`.
- Seasons content: `src/data/seasons.ts` (qualitative only until data is confirmed).
- Route cards (the three ways): `src/data/routes.ts`.
- Trust bar: `src/data/site.ts` → `TRUST_FACTS` — flip `status` to
  `confirmed` (with `source` + `lastReviewed`) and the badge appears.
