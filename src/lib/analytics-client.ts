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

function track(event: string, params: EventParams = {}): void {
  const enriched: EventParams = { language: 'en', page: location.pathname, ...params };
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

/* ---------- page-level view_offer ---------- */

function initViewOffer(): void {
  const offer = document.body.dataset.offer;
  if (offer) track('view_offer', { offer });
}

captureTouch();
initConsentBanner();
initClickTracking();
initViewOffer();
