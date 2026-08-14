# Launch checklist — freedive.ee

## STATUS: LIVE since 2026-08-14

The site is served on `https://freedive.ee` from GitHub Pages
(`gh-pages` branch) behind Cloudflare's proxy (orange cloud).
Verified live: all 8 routes 200, unknown paths 404, `www.` → apex 301,
`http://` → HTTPS 301, canonicals correct, `/thank-you/` noindex,
sitemap + robots served, hero video plays, mobile menu and form
validation work, no JS errors.

## Cloudflare proxy settings (orange cloud)

Orange is the intended end state — Cloudflare Rules only apply to
proxied traffic, so the security headers below need it.

- [x] Apex `A` records + `www` CNAME proxied (orange).
- [x] SSL/TLS mode is Full or Full (strict) — confirmed working; never
      set Flexible, it causes a redirect loop with Pages' HTTPS.
- [ ] **Certificate renewal exception**: add a Configuration Rule that
      turns OFF "Always Use HTTPS" for URI path starting with
      `/.well-known/acme-challenge/`. Without it GitHub cannot renew its
      Let's Encrypt certificate over HTTP-01 and the origin cert expires
      (~90 days), which breaks Full (strict).
- [ ] **Turn off Rocket Loader** (Speed → Optimization). It currently
      rewrites Astro's `type="module"` scripts. Everything still works
      (tested), but it adds an unnecessary third-party script and is a
      known source of module-script fragility.
- [ ] Consider turning off Email Address Obfuscation: it rewrites the
      footer and Plan Ahead `mailto:` links into `/cdn-cgi/l/email-
      protection` links that need JS to decode. Relevant while the
      mailto fallback is the only working enquiry path.

## From the four-portal audit (2026-08-14)

Applied in this repo — see the PR for detail:

- [x] Auto-confirmation promise now depends on `PUBLIC_LEAD_ENDPOINT`;
      with no endpoint the site promises only a personal reply and
      offers the email route. A smoke test enforces this.
- [x] Word-join bugs fixed (`day.The`, `guide.A`, `here.Current`,
      `share onfreedive.ee`) and a smoke test now fails the build if a
      word joins across an inline tag anywhere.
- [x] "same a personal reply…" phrasing fixed.
- [x] `fundive` defined at first use.
- [x] `robots.txt`: `OAI-SearchBot` and `ChatGPT-User` explicitly
      allowed. No Cloudflare-managed block is injected on this host, so
      there is no conflicting rule to resolve (unlike the other two
      domains).
- [x] `llms.txt` added with absolute links and the canonical
      fact-ownership table; carries no price, depth or AIDA claim.
- [x] `FAQPage` JSON-LD on the home and Rummu pages, generated from the
      same array that renders the visible FAQ so the two cannot diverge.
- [x] Cross-domain campaign hand-off: outbound links to the service hub
      carry the visitor's UTMs (or `utm_source=freedive.ee` as
      fallback), preserving the `#fragment`.
- [x] `event_id` on every event plus 1200 ms deduplication — verified in
      a browser: three rapid clicks produce one event.
- [x] Verified: no range media queries (`@media (width >= …)`) are used,
      so the old-iOS-Safari risk the audit flags does not apply here.

**Owner actions this repo cannot perform** (not faked, not stubbed):

- [ ] **Lead endpoint** — GitHub Pages has no serverless runtime, so the
      audit's "create a Pages Function/Worker" is not available on this
      host. Either move hosting to Cloudflare Pages (Functions
      available) or point `PUBLIC_LEAD_ENDPOINT` at an external form
      backend. The client contract is in `docs/tracking-spec.md`.
- [ ] **GPTBot training policy** — deliberately left at the general
      rule. Meregrupp decides whether to opt out of training while
      keeping ChatGPT Search visibility; the exact block to paste is
      commented in `public/robots.txt`.
- [ ] **One response-time standard** — freedive.ee promises a personal
      reply within two working days (matching the concept);
      freediving.meregrupp.ee currently promises no response time. Pick
      one and apply it on both.
- [ ] **Search Console / Bing Webmaster** verification, sitemap
      submission and re-indexing requests for all three domains.
- [ ] **Facebook page work** — intro, categories, main link order, CTA,
      pinned three-route post, cover-image safe areas.
- [ ] **Real-device acceptance testing** (iOS Safari, Android Chrome,
      Windows Edge/Chrome, macOS Safari) — emulation does not substitute.
- [ ] Items for the other two repos (`meregrupp.ee`,
      `freediving.meregrupp.ee`): mailto-submit forms, `MG_FORM_ENDPOINT`,
      the `mgEventQueue` no-op sender, production notes still in public
      text, hero MP4 ≈7.7 MB, heading hierarchy, touch targets, the
      `/en/freediving/` meta-refresh that must become a real 301/308,
      Cloudflare robots.txt conflicts, and the `llms.txt` claim that
      freedive.ee sends booking traffic to meregrupp.ee.

## Launch blockers (must be resolved before go-live)

- [ ] **Lead endpoint**: set `PUBLIC_LEAD_ENDPOINT` (form backend / CRM
      webhook), test required/invalid/success/server-error/double-submit,
      confirm the automatic confirmation email and the two-working-day
      reply promise are real. Until then the live form shows an honest
      "still being connected" notice with an email fallback — it never
      fakes success.
- [ ] **Server-side validation + rate limiting** on the endpoint
      (honeypot, `seconds_on_page`, email format, per-IP limits) — the
      static site cannot do this part.
- [x] **Cloudflare DNS → GitHub Pages** — done, site resolves and serves.
- [x] **Host redirects** — `www.` → apex and `http://` → HTTPS both
      return 301 (docs/url-redirect-map.csv rows now satisfied).
- [ ] **Security headers** via a Cloudflare Transform Rule (Rules →
      Transform Rules → Modify Response Header). Currently **0 of 4**
      are served — GitHub Pages cannot set custom headers, so this only
      works through the orange cloud. Copy the values from
      `public/_headers`: `Content-Security-Policy`,
      `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
      Add the lead-endpoint origin to `connect-src` when it exists.
- [ ] **Meregrupp sign-off on facts**: trust badge still excluded
      ("Tallinn & open water"), instructor credentials,
      Rummu access/logistics wording — see docs/content-and-facts.md.

## Strongly recommended before launch

- [ ] Decide on analytics: set `PUBLIC_GTM_ID` (consent banner then
      appears automatically) or leave analytics off. If on, configure
      cross-domain measurement with freediving.meregrupp.ee
      (docs/tracking-spec.md).
- [ ] Real `rummu-shore` photo for the Rummu logistics slot
      (docs/asset-requirements.md).
- [ ] Share-test the OG image (Facebook/WhatsApp/Slack preview).
- [ ] Verify Search Console: submit `https://freedive.ee/sitemap-index.xml`.
- [ ] Confirm freediving.meregrupp.ee keeps its section anchors
      (`#start`, `#rummu-form`, `#ongoing`, `#safety`) — all outbound
      CTAs point at them.
- [ ] Run the full QA suite on the final build:
      `npm run test` (build + smoke) and `node scripts/qa-visual.mjs`
      (viewports + axe), plus a Lighthouse mobile pass on the deployed
      preview.
- [ ] HSTS: enable at the host only after confirming full-domain HTTPS.

## Post-launch

- [ ] Watch Search Console coverage for the first weeks (the old site
      returned 200 for every path; the new site 404s unknown paths —
      stray URLs indexed in the past will drop out naturally, or add
      301s to `public/_redirects` if any get real traffic).
- [ ] Revisit `docs/content-and-facts.md` quarterly (`lastReviewed`).
