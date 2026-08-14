# freedive.ee — Freediving in Estonia

International, English-language destination site for freediving in
Estonia: Rummu, seasons, and trip planning with the local
Meregrupp / Allvee Akadeemia team. Detailed courses, prices and booking
live on **freediving.meregrupp.ee** — this site's job is to spark
interest and route visitors down one of three paths: **Start Now /
Dive Rummu / Plan Ahead**.

## Stack & architecture

- [Astro](https://astro.build) (static output, `trailingSlash: 'always'`),
  strict TypeScript, scoped component CSS over a small global stylesheet.
- No UI framework; client JS is limited to the mobile menu, the analytics
  adapter and the trip-planning form.
- Images run through `astro:assets`/sharp (AVIF/WebP, responsive widths).
- `@astrojs/sitemap` generates `sitemap-index.xml` (noindex pages excluded).

```text
src/
  components/   Header, Footer, RouteCards, TrustBar, Faq, MediaSlot
  layouts/      Base.astro — head/SEO/JSON-LD, consent banner, skip link
  pages/        index, rummu-quarry, seasons-and-conditions,
                plan-your-trip, start-here, privacy, thank-you, 404
  data/         site.ts (central config + confirmed facts), routes.ts, seasons.ts
  lib/          analytics-client.ts (all measurement), plan-form.ts
  styles/       global.css (palette, layout primitives)
  assets/       source images (optimized at build)
public/         robots.txt, favicon, og image, _headers, _redirects
docs/           redirect map, tracking spec, facts register,
                asset requirements, launch checklist
scripts/        smoke.mjs (build assertions), qa-visual.mjs (viewports + axe)
```

**Single sources of truth** — never hard-code these in components:

- Contact details, external service links, trust facts: `src/data/site.ts`
- The three routes: `src/data/routes.ts`
- Confirmed vs unconfirmed facts policy: `docs/content-and-facts.md`

## Commands

```bash
npm ci               # clean install
npm run dev          # dev server (http://localhost:4321)
npm run build        # production build → dist/
npm run preview      # serve the production build
npm run check        # astro check (TypeScript)
npm run test:smoke   # assertions over dist/ (run after build)
npm run test         # build + smoke
node scripts/qa-visual.mjs   # screenshots @360/768/1024/1440 + axe (needs Chromium)
```

## Environment variables

Copy `.env.example` → `.env`. All are optional for local dev; the lead
endpoint is a **launch blocker** for production.

| Variable | Purpose |
| --- | --- |
| `PUBLIC_LEAD_ENDPOINT` | JSON POST target for the Plan Your Trip form. Empty → form shows an honest "being connected" notice + email fallback; it never fakes success. Contract: `docs/tracking-spec.md`. |
| `PUBLIC_GTM_ID` | GTM container. Empty → zero analytics loads. Set → consent banner appears; GTM loads only after consent. |
| `PUBLIC_SPAM_PROTECTION_SITE_KEY` | Reserved for Turnstile/hCaptcha wiring. |

## Content & facts

Public copy may only contain confirmed facts. The register of what is
confirmed (with sources) and what is blocked pending Meregrupp
confirmation is `docs/content-and-facts.md`. Course prices, depths, age
limits and certification details deliberately live only on
freediving.meregrupp.ee.

## Analytics & form integration

Read `docs/tracking-spec.md` — it defines the five events
(`view_offer`, `select_route`, `outbound_service_click`, `start_form`,
`submit_lead`), the no-PII rule, the consent gate and the lead endpoint
contract (including required server-side validation and rate limiting).

## SEO & redirects

- Canonicals are absolute and self-referential; `robots.txt` +
  `sitemap-index.xml` are generated into `dist/`.
- JSON-LD: Organization + WebSite everywhere, BreadcrumbList on subpages.
- The legacy site was a single page — its fragment anchors are preserved
  on the new front page. Full mapping: `docs/url-redirect-map.csv`.
  Host-level redirect samples: `public/_redirects` (paths) and README
  notes in that file for host variants.

## Deploy assumptions

Any static host works (`dist/` output). The production host must:

1. 301 `http://` and `www.` variants to `https://freedive.ee`;
2. serve `404.html` for unknown paths with status 404;
3. apply the security headers in `public/_headers` (native on
   Cloudflare Pages/Netlify; replicate manually elsewhere);
4. serve real HTTP 301s from `public/_redirects` (or equivalent).

Before go-live, work through `docs/launch-checklist.md`.
