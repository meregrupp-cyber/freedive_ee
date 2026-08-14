# Launch checklist — freedive.ee

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
- [ ] **Cloudflare DNS → GitHub Pages** (host is GitHub Pages, DNS is
      Cloudflare): apex `A` records to the four GitHub Pages IPs +
      `www` CNAME to `meregrupp-cyber.github.io`; then set custom
      domain + "Enforce HTTPS" in the repo's Pages settings once the
      certificate is issued.
- [ ] **Host redirects**: `www.` → apex 301 via a Cloudflare Redirect
      Rule; HTTP → HTTPS via GitHub Pages "Enforce HTTPS" (and
      Cloudflare "Always Use HTTPS" once proxied)
      (docs/url-redirect-map.csv rows marked `pending_host_config`).
- [ ] **Security headers** via a Cloudflare Transform Rule — GitHub
      Pages cannot set custom headers; `public/_headers` holds the
      values to copy. Add the lead-endpoint origin to `connect-src`.
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
