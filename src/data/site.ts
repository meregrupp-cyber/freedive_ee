/**
 * Central site configuration — the single source of truth for contact
 * details, external service links, brand naming and confirmed facts.
 * Components must import from here instead of hard-coding values.
 *
 * Fact policy: anything with status 'needs_confirmation' is NEVER
 * rendered in the public build. See docs/content-and-facts.md.
 */

export type FactStatus = 'confirmed' | 'needs_confirmation';

export interface Fact {
  label: string;
  status: FactStatus;
  /** Where the confirmed value was verified. */
  source?: string;
  lastReviewed?: string; // ISO date
}

export const SITE = {
  name: 'Freedive Estonia',
  tagline: 'Freediving in Estonia',
  url: 'https://freedive.ee',
  language: 'en',
  brand: {
    /** Operating team behind the site. */
    parent: 'MEREGRUPP',
    parentFull: 'Meregrupp / Allvee Akadeemia',
  },
} as const;

/**
 * Contact details.
 * Verified against the current production freedive.ee and
 * freediving.meregrupp.ee pages on 2026-08-14.
 */
export const CONTACT = {
  email: 'meregrupp@gmail.com',
  phoneDisplay: '+372 510 5573',
  phoneHref: 'tel:+3725105573',
  facebook: 'https://www.facebook.com/meregrupp/',
} as const;

/**
 * External destinations in the brand family.
 * Service-page anchors verified against production
 * freediving.meregrupp.ee on 2026-08-14 (single-page service hub with
 * section anchors #start, #start-form, #rummu, #rummu-form, #ongoing,
 * #plan, #safety, #faq).
 */
export const SERVICES = {
  hubPortal: 'https://meregrupp.ee/en/',
  serviceHome: 'https://freediving.meregrupp.ee/',
  /** First course / beginner path. */
  startFreediving: 'https://freediving.meregrupp.ee/#start',
  /** Rummu guided-dive service section. */
  rummuService: 'https://freediving.meregrupp.ee/#rummu',
  /** Rummu suitability check form. */
  rummuSuitability: 'https://freediving.meregrupp.ee/#rummu-form',
  /** Ongoing / regular training in Estonia. */
  ongoingTraining: 'https://freediving.meregrupp.ee/#ongoing',
  /** Safety approach on the service site. */
  safety: 'https://freediving.meregrupp.ee/#safety',
} as const;

/**
 * Trust bar items. Only status==='confirmed' entries are rendered.
 * Confirmation basis: current production freedive.ee and
 * freediving.meregrupp.ee content, reviewed 2026-08-14.
 */
export const TRUST_FACTS: Fact[] = [
  {
    label: 'English-led training',
    status: 'confirmed',
    source: 'Production freedive.ee + freediving.meregrupp.ee are English-first',
    lastReviewed: '2026-08-14',
  },
  {
    label: 'Safety-first',
    status: 'confirmed',
    source: 'Production freedive.ee: "Training is practical and safety-first"',
    lastReviewed: '2026-08-14',
  },
  {
    label: 'Year-round practice',
    status: 'confirmed',
    source: 'Production freedive.ee: "open-water sessions throughout the year (including winter)"',
    lastReviewed: '2026-08-14',
  },
  {
    label: 'Tallinn & open water',
    status: 'needs_confirmation',
    source: 'Not stated on current production sites — confirm training locations with Meregrupp',
  },
  {
    label: 'Since 2018',
    status: 'needs_confirmation',
    source: 'Founding year not verifiable from public sources — confirm with Meregrupp',
  },
];

export const CONFIRMED_TRUST = TRUST_FACTS.filter((f) => f.status === 'confirmed');

/** Realistic reply promise used on the Plan Ahead form and thank-you page. */
export const REPLY_PROMISE = 'a personal reply within two working days';
