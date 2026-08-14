/**
 * Plan Your Trip form behaviour.
 *
 * - Client-side validation with an error summary and per-field messages.
 * - Honeypot + time-on-page spam checks (server must re-validate).
 * - Double-submit guard.
 * - Attribution (UTM first/last touch) attached to the payload —
 *   never sent to analytics.
 * - start_form fires on first meaningful interaction; submit_lead only
 *   after the endpoint confirms success.
 * - On success: summary stored for /thank-you/, then redirect.
 * - No PII is ever logged to the console or sent to analytics.
 */

const form = document.getElementById('plan-form') as HTMLFormElement | null;

const MIN_SECONDS_BEFORE_SUBMIT = 4;

interface Touch {
  [key: string]: string;
}

function readTouch(storage: Storage, key: string): Touch | null {
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as Touch) : null;
  } catch {
    return null;
  }
}

function track(event: string, params: Record<string, string | undefined> = {}): void {
  window.fdTrack?.(event, params);
}

if (form) {
  const endpoint = form.dataset.endpoint ?? '';
  const isDev = form.dataset.dev === 'true';
  const renderedAt = Date.now();
  const submitButton = document.getElementById('pf-submit') as HTMLButtonElement | null;
  const errorBox = document.getElementById('form-errors');
  const errorList = document.getElementById('form-errors-list');
  let submitting = false;
  let startFired = false;

  // start_form — first meaningful interaction only
  form.addEventListener(
    'input',
    () => {
      if (!startFired) {
        startFired = true;
        track('start_form', { offer: 'plan_ahead' });
      }
    },
    { once: false }
  );

  interface FieldRule {
    id: string;
    name: string;
    label: string;
    validate?: (value: string) => boolean;
  }

  const rules: FieldRule[] = [
    { id: 'pf-name', name: 'name', label: 'Name' },
    {
      id: 'pf-email',
      name: 'email',
      label: 'Email',
      validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v),
    },
    { id: 'pf-country', name: 'country', label: 'Country' },
    { id: 'pf-language', name: 'preferred_language', label: 'Preferred language' },
    { id: 'pf-window', name: 'travel_window', label: 'Travel window' },
    { id: 'pf-group', name: 'group_size', label: 'Group size' },
    { id: 'pf-experience', name: 'experience_level', label: 'Experience level' },
  ];

  function setInvalid(el: HTMLElement, invalid: boolean): void {
    const wrapper = el.closest('.field');
    el.setAttribute('aria-invalid', invalid ? 'true' : 'false');
    wrapper?.classList.toggle('is-invalid', invalid);
  }

  function validate(): string[] {
    const failures: string[] = [];
    for (const rule of rules) {
      const el = document.getElementById(rule.id) as HTMLInputElement | HTMLSelectElement | null;
      if (!el) continue;
      const value = el.value.trim();
      const ok = value.length > 0 && (!rule.validate || rule.validate(value));
      setInvalid(el, !ok);
      if (!ok) failures.push(rule.label);
    }

    const consent = document.getElementById('pf-consent') as HTMLInputElement | null;
    const consentErr = document.getElementById('pf-consent-err');
    const consentOk = Boolean(consent?.checked);
    consentErr?.classList.toggle('is-visible', !consentOk);
    consent?.setAttribute('aria-invalid', consentOk ? 'false' : 'true');
    if (!consentOk) failures.push('Privacy consent');

    return failures;
  }

  function showErrors(labels: string[]): void {
    if (!errorBox || !errorList) return;
    errorList.textContent = '';
    for (const label of labels) {
      const li = document.createElement('li');
      li.textContent = label;
      errorList.appendChild(li);
    }
    errorBox.hidden = false;
    errorBox.focus();
  }

  function buildPayload(): Record<string, unknown> {
    const data = new FormData(form!);
    const interests = data.getAll('interests').map(String);
    return {
      offer: 'plan_ahead',
      language: 'en',
      name: String(data.get('name') ?? '').trim(),
      email: String(data.get('email') ?? '').trim(),
      phone: String(data.get('phone') ?? '').trim(),
      country: String(data.get('country') ?? '').trim(),
      preferred_language: String(data.get('preferred_language') ?? '').trim(),
      travel_window: String(data.get('travel_window') ?? '').trim(),
      days: String(data.get('days') ?? '').trim(),
      group_size: String(data.get('group_size') ?? '').trim(),
      experience_level: String(data.get('experience_level') ?? ''),
      certification: String(data.get('certification') ?? '').trim(),
      interests,
      equipment_needs: String(data.get('equipment_needs') ?? '').trim(),
      budget_range: String(data.get('budget_range') ?? '').trim(),
      message: String(data.get('message') ?? '').trim(),
      consent_privacy: data.get('consent_privacy') === 'on',
      marketing_opt_in: data.get('marketing_opt_in') === 'on',
      // spam signals — the endpoint must verify these server-side too
      honeypot: String(data.get('website') ?? ''),
      seconds_on_page: Math.round((Date.now() - renderedAt) / 1000),
      // attribution
      first_touch: readTouch(localStorage, 'fd_first_touch'),
      last_touch: readTouch(sessionStorage, 'fd_last_touch'),
      landing_page: location.pathname,
      referrer: document.referrer.slice(0, 300),
      submitted_at: new Date().toISOString(),
    };
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitting) return; // double-submit guard

    const failures = validate();
    if (failures.length > 0) {
      showErrors(failures);
      return;
    }
    if (errorBox) errorBox.hidden = true;

    // Spam checks: silently succeed for bots (no data sent).
    const honeypot = (document.getElementById('pf-website') as HTMLInputElement | null)?.value;
    const tooFast = (Date.now() - renderedAt) / 1000 < MIN_SECONDS_BEFORE_SUBMIT;
    if (honeypot || tooFast) {
      window.location.assign('/thank-you/');
      return;
    }

    if (!endpoint) {
      if (isDev) {
        showErrors(['Developer: PUBLIC_LEAD_ENDPOINT is not configured — submission not delivered.']);
      } else {
        showErrors(['The form is temporarily unavailable. Please use the direct email link below.']);
      }
      return;
    }

    submitting = true;
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Sending…';
    }

    try {
      const payload = buildPayload();
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`endpoint returned ${response.status}`);

      // submit_lead only after confirmed success — and no PII in params.
      track('submit_lead', { offer: 'plan_ahead' });

      try {
        sessionStorage.setItem(
          'fd_lead_summary',
          JSON.stringify({
            travel_window: payload.travel_window,
            group_size: payload.group_size,
            experience_level: payload.experience_level,
            interests: payload.interests,
          })
        );
      } catch {
        /* summary is a nice-to-have */
      }

      window.location.assign('/thank-you/');
    } catch {
      submitting = false;
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Plan with a local freediving team';
      }
      showErrors([
        'Sending failed — please try again in a moment, or use the direct email link below.',
      ]);
    }
  });
}
