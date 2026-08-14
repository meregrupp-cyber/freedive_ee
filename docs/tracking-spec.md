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

### Events in the shared schema that this site does not fire

The audit's scheme spans all Meregrupp portals. These three belong to
the service site, which owns dates, qualification and bookings:

| Event | Why not here | Canonical owner |
| --- | --- | --- |
| `select_date` | freedive.ee publishes no dates by design | freediving.meregrupp.ee |
| `qualified_lead` | requires a CRM/human qualification step | CRM, server-side |
| `booking_confirmed` | freedive.ee collects enquiries, never confirms a place | freediving.meregrupp.ee / CRM |

`outbound_service_click` and `select_route` are additions specific to a
gateway site whose main job is handing visitors over.

### Deduplication

Every event carries a generated `event_id`. `track()` additionally
suppresses a repeat of the same event + identifying params within
1200 ms, so a double-click or a doubled handler cannot produce two
events. `view_offer` and `start_form` are additionally guarded to fire
once per page view.

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

Outbound CTAs to `freediving.meregrupp.ee` and `meregrupp.ee` are plain
links (same tab — one brand journey).

`decorateOutboundLinks()` in `src/lib/analytics-client.ts` appends the
campaign that brought the visitor here, so the service site can
attribute the enquiry to the right source:

- stored UTM values (last touch, falling back to first touch) are copied
  onto the outgoing URL;
- anything missing falls back to `utm_source=freedive.ee`,
  `utm_medium=referral`, `utm_campaign=<service>`;
- parameters the link already declares are never overwritten, and the
  `#fragment` is preserved — the service anchors depend on it;
- campaign metadata only: no identifier, nothing the visitor typed.
  This is exactly what `/privacy/` describes to the visitor.

Decoration runs regardless of analytics consent because it carries no
identifiers — it is attribution for the destination, not measurement
here. When GA4/GTM is introduced, also configure the GTM cross-domain
linker for both hosts.
