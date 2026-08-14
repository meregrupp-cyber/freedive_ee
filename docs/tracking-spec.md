# Tracking specification — freedive.ee

One analytics abstraction (`src/lib/analytics-client.ts`) handles all
measurement. Components never call `gtag`/`dataLayer` directly — they
declare events with `data-track-*` attributes or call `window.fdTrack`.

## Ground rules

- **No PII, ever.** Event parameters never contain names, emails, phone
  numbers or free text. The smoke of this rule: `submit_lead` carries only
  `offer: plan_ahead`.
- **Nothing loads without consent.** With `PUBLIC_GTM_ID` unset, no
  analytics script loads at all (dev builds log events to the console).
  With a GTM ID set, the container loads only after the visitor clicks
  "Allow analytics" in the consent banner; events fired before the choice
  queue in memory and flush on consent, or are dropped on decline.
- UTM attribution (first-touch in `localStorage.fd_first_touch`,
  last-touch in `sessionStorage.fd_last_touch`) is attached **only to the
  lead form payload** — it is never pushed to analytics.

## Events

| Event | Trigger | Parameters | How to test |
| --- | --- | --- | --- |
| `view_offer` | Page load of an offer page: `/rummu-quarry/` (`rummu`), `/plan-your-trip/` (`plan_ahead`), `/start-here/` (`start`). Fired once per page view via `<body data-offer>`. | `offer`, `language`, `page` | Open the page with dev build → console shows `[analytics:dev] view_offer`. |
| `select_route` | Click on any internal route card / route CTA (`data-track-event="select_route"`). | `route` (`start`\|`rummu`\|`plan_ahead`\|`seasons`\|`start_here`\|`choose`), `origin` (e.g. `home_routes`, `hero`, `start_here`), `destination`, `language`, `page` | Click a route card on `/` → console line with route + origin. |
| `outbound_service_click` | Click on any CTA leaving for `freediving.meregrupp.ee` or `meregrupp.ee` (`data-track-event="outbound_service_click"`). | `service` (`start_freediving`, `rummu_suitability`, `ongoing_training`, `service_home`, `hub_portal`, `safety`), `destination`, `origin`, `language`, `page` | Click "Start freediving" on `/start-here/`. |
| `start_form` | First meaningful input in the Plan Ahead form (once per page view). | `offer: plan_ahead`, `language`, `page` | Type one character into any form field. |
| `submit_lead` | **Only after the lead endpoint returns 2xx.** Never on validation failure, spam-trap swallow, or endpoint error. | `offer: plan_ahead`, `language`, `page` | Set `PUBLIC_LEAD_ENDPOINT` to a test endpoint, submit; event fires only on success response. |
| `join_waitlist` | Reserved — no waitlist exists yet. Do not implement until one does. | — | — |

## Lead endpoint contract

`POST ${PUBLIC_LEAD_ENDPOINT}` with `Content-Type: application/json`:

```json
{
  "offer": "plan_ahead",
  "language": "en",
  "name": "…", "email": "…", "phone": "…",
  "country": "…", "preferred_language": "…",
  "travel_window": "…", "days": "…", "group_size": "…",
  "experience_level": "none|beginner|certified_entry|certified_advanced|instructor",
  "certification": "…", "interests": ["rummu", "course"],
  "equipment_needs": "…", "budget_range": "…", "message": "…",
  "consent_privacy": true, "marketing_opt_in": false,
  "honeypot": "", "seconds_on_page": 42,
  "first_touch": { "utm_source": "…", "landing_page": "/", "referrer": "…", "ts": "…" },
  "last_touch": { "…": "…" },
  "landing_page": "/plan-your-trip/", "referrer": "…",
  "submitted_at": "2026-08-14T12:00:00.000Z"
}
```

The endpoint MUST re-validate server-side: reject non-empty `honeypot`,
reject implausible `seconds_on_page` (< 4), validate email format,
normalise input, never render user HTML, and rate-limit per IP. The
static site cannot do server-side validation itself.

Optional spam protection: `PUBLIC_SPAM_PROTECTION_SITE_KEY` is reserved
for a Turnstile/hCaptcha widget; wire it into the form and verify the
token server-side when a provider is chosen.

## Cross-domain

Outbound CTAs to `freediving.meregrupp.ee` are plain links (same tab, as
they are part of one brand journey). When GA4/GTM is introduced, set up
cross-domain measurement between `freedive.ee` and
`freediving.meregrupp.ee` in the GTM container configuration, and keep
campaign parameters intact — the links themselves carry no UTM decoration
by default so the service site's own attribution stays clean.
