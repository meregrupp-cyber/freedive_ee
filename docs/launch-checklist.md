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
