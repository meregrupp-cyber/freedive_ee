import { SERVICES } from './site';

/**
 * The three-route model is the core navigation and conversion element
 * of the site. Every route card everywhere renders from this data.
 */
export interface Route {
  id: 'start' | 'rummu' | 'plan_ahead';
  eyebrow: string;
  question: string;
  text: string;
  cta: string;
  href: string;
  /** true when the CTA leaves freedive.ee for the service hub. */
  external: boolean;
}

export const ROUTES: Route[] = [
  {
    id: 'start',
    eyebrow: 'START NOW',
    question: 'New to freediving?',
    text: 'Begin with a calm, guided first step in English.',
    cta: 'Start freediving',
    href: SERVICES.startFreediving,
    external: true,
  },
  {
    id: 'rummu',
    eyebrow: 'DIVE RUMMU',
    question: 'Already trained?',
    text: 'See Rummu with local guidance and a suitability check before depth.',
    cta: 'Explore Rummu',
    href: '/rummu-quarry/',
    external: false,
  },
  {
    id: 'plan_ahead',
    eyebrow: 'PLAN AHEAD',
    question: 'Looking six to twelve months ahead?',
    text: 'Share your level, group size and travel window to plan Estonia with local knowledge.',
    cta: 'Plan your trip',
    href: '/plan-your-trip/',
    external: false,
  },
];
