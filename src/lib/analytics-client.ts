/**
 * Analytics adapter — the ONLY place measurement runs from.
 *
 * Rules (see docs/tracking-spec.md):
 * - No PII is ever sent: no names, emails, phones, free text.
 * - With no PUBLIC_GTM_ID configured, nothing loads and events are
 *   logged to the console in dev only.
 * - With a GTM ID, the container loads only after explicit consent;
 *   events queue until consent is granted.
 */

type EventParams = Record<string, string | number | boolean | undefined>;

interface QueuedEvent {
  event: string;
  params: EventParams;
}

const CONSENT_KEY = 'fd_consent';
const FIRST_TOUCH_KEY = 'fd_first_touch';
const LAST_TOUCH_KEY = 'fd_last_touch';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;

/** A stored attribution snapshot (UTMs plus landing page and referrer). */
type Touch = Record<string, string>;

const gtmId = document.body.dataset.gtmId ?? '';
const queue: QueuedEvent[] = [];
let gtmLoaded = false;

declare global {
  interface Window {
    dataLayer?: unknown[];
    fdTrack?: (event: string, params?: EventParams) => void;
  }
}

/* ---------- attribution (UTM) capture — stored locally, only ever
   attached to the lead form payload, never sent to analytics ---------- */

function captureTouch(): void {
  try {
    const params = new URLSearchParams(location.search);
    const touch: Record<string, string> = {};
    let hasUtm = false;
    for (const key of UTM_KEYS) {
      const value = params.get(key);
      if (value) {
        touch[key] = value.slice(0, 200);
        hasUtm = true;
      }
    }
    touch.landing_page = location.pathname;
    touch.referrer = document.referrer.slice(0, 300);
    touch.ts = new Date().toISOString();

    if (!localStorage.getItem(FIRST_TOUCH_KEY)) {
      localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(touch));
    }
    if (hasUtm || !sessionStorage.getItem(LAST_TOUCH_KEY)) {
      sessionStorage.setItem(LAST_TOUCH_KEY, JSON.stringify(touch));
    }
  } catch {
    /* storage unavailable (private mode) — attribution is optional */
  }
}

/* ---------- consent + GTM ---------- */

function consentState(): string {
  try {
    return localStorage.getItem(CONSENT_KEY) ?? 'unset';
  } catch {
    return 'unset';
  }
}

function loadGtm(): void {
  if (gtmLoaded || !gtmId) return;
  gtmLoaded = true;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`;
  document.head.appendChild(script);
}

function flushQueue(): void {
  window.dataLayer = window.dataLayer ?? [];
  while (queue.length > 0) {
    const item = queue.shift();
    if (item) window.dataLayer.push({ event: item.event, ...item.params });
  }
}

/**
 * Deduplication: one user action must produce exactly one event.
 * Keyed by event name + its identifying params, with a short window that
 * absorbs double-clicks and repeated handlers.
 */
const DEDUPE_WINDOW_MS = 1200;
const recentEvents = new Map<string, number>();

function isDuplicate(key: string): boolean {
  const now = Date.now();
  for (const [k, t] of recentEvents) {
    if (now - t > DEDUPE_WINDOW_MS) recentEvents.delete(k);
  }
  if (recentEvents.has(key)) return true;
  recentEvents.set(key, now);
  return false;
}

function newEventId(): string {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function track(event: string, params: EventParams = {}): void {
  const dedupeKey = [event, params.offer, params.route, params.service, params.destination].join('|');
  if (isDuplicate(dedupeKey)) return;

  const enriched: EventParams = {
    language: 'en',
    page: location.pathname,
    event_id: newEventId(),
    ...params,
  };
  if (!gtmId) {
    if (import.meta.env.DEV) console.debug('[analytics:dev]', event, enriched);
    return;
  }
  if (consentState() === 'granted') {
    loadGtm();
    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push({ event, ...enriched });
  } else if (consentState() === 'unset') {
    queue.push({ event, params: enriched });
  }
  // consent 'denied' → drop silently
}

window.fdTrack = track;

/* ---------- consent banner ---------- */

function initConsentBanner(): void {
  const banner = document.getElementById('consent-banner');
  if (!banner || !gtmId) return;
  if (consentState() === 'unset') banner.hidden = false;

  banner.querySelectorAll<HTMLButtonElement>('[data-consent]').forEach((button) => {
    button.addEventListener('click', () => {
      const choice = button.dataset.consent === 'granted' ? 'granted' : 'denied';
      try {
        localStorage.setItem(CONSENT_KEY, choice);
      } catch {
        /* ignore */
      }
      banner.hidden = true;
      if (choice === 'granted') {
        loadGtm();
        flushQueue();
      } else {
        queue.length = 0;
      }
    });
  });
}

/* ---------- declarative click tracking ---------- */

function initClickTracking(): void {
  document.addEventListener('click', (e) => {
    if (!(e.target instanceof Element)) return;
    const el = e.target.closest<HTMLElement>('[data-track-event]');
    if (!el) return;
    const { trackEvent, trackRoute, trackService, trackOrigin, trackDestination } = el.dataset;
    if (!trackEvent) return;
    track(trackEvent, {
      route: trackRoute,
      service: trackService,
      origin: trackOrigin,
      destination: trackDestination,
    });
  });
}

/* ---------- cross-domain campaign hand-off ----------
   Links leaving for the service hub carry the campaign that brought the
   visitor here, so freediving.meregrupp.ee can attribute the enquiry to
   the right source. Campaign metadata only — never an identifier, and
   never anything the visitor typed. Documented on /privacy/. */

const BRAND_HOSTS = new Set(['freediving.meregrupp.ee', 'meregrupp.ee', 'www.meregrupp.ee']);

function decorateOutboundLinks(): void {
  const touch = readStoredTouch();

  document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((link) => {
    let url: URL;
    try {
      url = new URL(link.href, location.href);
    } catch {
      return;
    }
    if (!BRAND_HOSTS.has(url.hostname)) return;

    // Never overwrite parameters the link already declares.
    const setIfAbsent = (key: string, value: string | undefined) => {
      if (value && !url.searchParams.has(key)) url.searchParams.set(key, value);
    };

    for (const key of UTM_KEYS) setIfAbsent(key, touch?.[key]);
    // Fall back to describing this site as the source.
    setIfAbsent('utm_source', 'freedive.ee');
    setIfAbsent('utm_medium', 'referral');
    setIfAbsent('utm_campaign', link.dataset.trackService ?? 'destination_gateway');

    link.href = url.toString(); // URL keeps the #fragment intact
  });
}

function readStoredTouch(): Touch | null {
  try {
    const raw = sessionStorage.getItem(LAST_TOUCH_KEY) ?? localStorage.getItem(FIRST_TOUCH_KEY);
    return raw ? (JSON.parse(raw) as Touch) : null;
  } catch {
    return null;
  }
}

/* ---------- page-level view_offer ---------- */

function initViewOffer(): void {
  const offer = document.body.dataset.offer;
  if (offer) track('view_offer', { offer });
}

captureTouch();
decorateOutboundLinks();
initConsentBanner();
initClickTracking();
initViewOffer();
