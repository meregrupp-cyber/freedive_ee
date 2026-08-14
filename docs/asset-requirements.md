# Asset requirements — photography & video

Current state: one real branded banner has been supplied (diver at Rummu
surface + routes strip, `src/assets/hero-rummu.png`, 1942×809). It powers
the home hero, the Rummu teaser crop (`src/assets/rummu-building.png`)
and the OG image (`public/og/og-default.jpg`). Everything else renders a
neutral layered-water placeholder via `src/components/MediaSlot.astro`
(`data-media-slot` attribute identifies the slot). Placeholders are never
presented as final photos.

Every delivered image needs a publication permission on file (people
recognisable in the frame must have agreed to marketing use).

## Slots to fill

| slot_id | Page | Subject | Format | Orientation | Min resolution |
| --- | --- | --- | --- | --- | --- |
| `rummu-shore` | /rummu-quarry/ (logistics) | Shore/entry area at Rummu on a training day: gear staging, people preparing, honest weather | JPEG/AVIF | landscape 16:9 | 1600×900 |

## Upgrades wanted (slots currently using the supplied banner or none)

| Purpose | Current | Wanted |
| --- | --- | --- |
| Home hero | supplied banner (baked-in text) | ideally a clean photo version without baked-in text, so headline/CTAs stay HTML (better for localisation + accessibility); keep the banner as fallback |
| OG image | letterboxed banner (`public/og/og-default.jpg`) | 1200×630 crop of a real Rummu photo without small text (baked route strip is unreadable at share size) |
| Per-page OG images | default OG everywhere | one per page: Rummu (ruins), seasons (winter/summer contrast), plan (map/planning vibe) — 1200×630 |
| Seasons page | no imagery (text-first by design) | optional: 4 seasonal shots of the same site, landscape 3:2, ≥1600px wide |
| Team section (home) | text only | buddy-contact photo: two divers at the surface, human faces, cold light, landscape, ≥1600px wide |
| Hero video (optional) | none | only with a high-quality file + poster: muted, playsinline, respects reduced-motion, must not cover H1/lead/CTA; mobile gets the poster image |

## Adding a photo to a slot

1. Drop the file in `src/assets/`.
2. Replace the `<MediaSlot slot_id="…"/>` with `<Picture>` from
   `astro:assets` (see the hero in `src/pages/index.astro` for the
   pattern: `widths`, `sizes`, `formats={['avif','webp']}`, real `alt`).
3. Decorative images get `alt=""`; informative ones get a sentence that
   works without the picture.
4. Update this file and `docs/content-and-facts.md`.
