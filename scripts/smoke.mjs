#!/usr/bin/env node
/**
 * Smoke tests over the production build in dist/.
 * Run: npm run build && npm run test:smoke
 *
 * Checks:
 * - every core route built (the static equivalent of "responds 200");
 * - exactly one <h1> and a correct absolute canonical per indexable page;
 * - thank-you and 404 are noindex and excluded from the sitemap;
 * - the three route cards exist on the home page;
 * - the Plan Ahead form has every required field + separate consents;
 * - no empty hrefs, "#" placeholders, [TODO] markers or unverified CTAs;
 * - all internal links and asset references resolve inside dist/;
 * - robots.txt and sitemap are consistent.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const SITE = 'https://freedive.ee';

let failures = 0;
let checks = 0;

function ok(condition, label) {
  checks += 1;
  if (condition) return;
  failures += 1;
  console.error(`  ✗ ${label}`);
}

function html(path) {
  return readFileSync(join(DIST, path), 'utf8');
}

const PAGES = [
  { file: 'index.html', path: '/', indexable: true },
  { file: 'rummu-quarry/index.html', path: '/rummu-quarry/', indexable: true },
  { file: 'seasons-and-conditions/index.html', path: '/seasons-and-conditions/', indexable: true },
  { file: 'plan-your-trip/index.html', path: '/plan-your-trip/', indexable: true },
  { file: 'start-here/index.html', path: '/start-here/', indexable: true },
  { file: 'privacy/index.html', path: '/privacy/', indexable: true },
  { file: 'thank-you/index.html', path: '/thank-you/', indexable: false },
  { file: '404.html', path: '/404/', indexable: false },
];

console.log('smoke: page existence + head rules');
for (const page of PAGES) {
  ok(existsSync(join(DIST, page.file)), `${page.path} built (${page.file})`);
  if (!existsSync(join(DIST, page.file))) continue;
  const doc = html(page.file);

  const h1Count = (doc.match(/<h1[\s>]/g) ?? []).length;
  ok(h1Count === 1, `${page.path} has exactly one <h1> (found ${h1Count})`);

  const canonical = doc.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  ok(canonical === `${SITE}${page.path}`, `${page.path} canonical is ${SITE}${page.path} (found ${canonical})`);

  const hasNoindex = /<meta name="robots" content="noindex/.test(doc);
  ok(hasNoindex === !page.indexable, `${page.path} noindex=${!page.indexable}`);

  ok(/<html lang="en"/.test(doc), `${page.path} has lang="en"`);
  ok(/<meta name="description" content="[^"]{20,}"/.test(doc), `${page.path} has a real meta description`);
  ok(/<meta property="og:image" content="https:\/\/freedive\.ee\//.test(doc), `${page.path} has absolute og:image`);
  ok((doc.match(/<title>/g) ?? []).length === 1, `${page.path} has one <title>`);

  ok(!doc.includes('[TODO]'), `${page.path} has no [TODO] markers`);
  ok(!/href="#"(?![\w-])/.test(doc), `${page.path} has no bare href="#" placeholders`);
  ok(!/href=""/.test(doc), `${page.path} has no empty hrefs`);
}

console.log('smoke: home page route cards + legacy anchors');
{
  const home = html('index.html');
  for (const route of ['start', 'rummu', 'plan_ahead']) {
    ok(home.includes(`data-route="${route}"`), `home has route card "${route}"`);
  }
  for (const anchor of ['id="courses"', 'id="method"', 'id="training"', 'id="youth"', 'id="rummu"', 'id="routes"']) {
    ok(home.includes(anchor), `home preserves legacy anchor ${anchor}`);
  }
  ok(html('index.html').includes('id="contact"'), 'footer preserves legacy anchor id="contact"');
}

console.log('smoke: plan-ahead form fields');
{
  const plan = html('plan-your-trip/index.html');
  const requiredFields = ['name', 'email', 'country', 'preferred_language', 'travel_window', 'group_size', 'experience_level'];
  for (const name of requiredFields) {
    const re = new RegExp(`name="${name}"[^>]*required|required[^>]*name="${name}"`);
    ok(re.test(plan), `form field "${name}" is required`);
  }
  for (const name of ['phone', 'days', 'certification', 'equipment_needs', 'budget_range', 'message']) {
    ok(plan.includes(`name="${name}"`), `form has optional field "${name}"`);
  }
  ok(plan.includes('name="consent_privacy"') && /name="consent_privacy"[^>]*required|required[^>]*name="consent_privacy"/.test(plan), 'privacy consent present and required');
  ok(plan.includes('name="marketing_opt_in"') && !/name="marketing_opt_in"[^>]*checked/.test(plan), 'marketing opt-in present, separate, unchecked');
  ok(plan.includes('name="website"'), 'honeypot field present');
  const labelForCount = (plan.match(/<label for="pf-/g) ?? []).length;
  ok(labelForCount >= 15, `every field has a real <label> (found ${labelForCount})`);
}

console.log('smoke: sitemap + robots');
{
  ok(existsSync(join(DIST, 'sitemap-index.xml')), 'sitemap-index.xml exists');
  const sitemapFile = readdirSync(DIST).find((f) => /^sitemap-\d+\.xml$/.test(f));
  ok(Boolean(sitemapFile), 'sitemap partition exists');
  if (sitemapFile) {
    const sitemap = readFileSync(join(DIST, sitemapFile), 'utf8');
    for (const page of PAGES) {
      const inSitemap = sitemap.includes(`<loc>${SITE}${page.path}</loc>`);
      ok(inSitemap === page.indexable, `${page.path} ${page.indexable ? 'in' : 'excluded from'} sitemap`);
    }
    ok(!sitemap.includes('/404'), 'no 404 URL in sitemap');
  }
  const robots = readFileSync(join(DIST, 'robots.txt'), 'utf8');
  ok(robots.includes(`Sitemap: ${SITE}/sitemap-index.xml`), 'robots.txt points at sitemap');
  ok(!/Disallow: \/(?:\s|$)/m.test(robots), 'robots.txt does not block the whole site');
}

console.log('smoke: internal links + assets resolve');
{
  const seen = new Set();
  for (const page of PAGES) {
    if (!existsSync(join(DIST, page.file))) continue;
    const doc = html(page.file);
    const refs = [...doc.matchAll(/(?:href|src|srcset)="([^"]+)"/g)].flatMap((m) =>
      m[1].split(',').map((part) => part.trim().split(' ')[0])
    );
    for (const ref of refs) {
      if (!ref.startsWith('/') || ref.startsWith('//')) continue;
      const clean = ref.split('#')[0].split('?')[0];
      if (!clean || seen.has(clean)) continue;
      seen.add(clean);
      const candidates = [clean, `${clean}index.html`, `${clean.replace(/\/$/, '')}/index.html`];
      ok(
        candidates.some((c) => existsSync(join(DIST, c.replace(/^\//, '')))),
        `internal ref resolves: ${clean} (on ${page.path})`
      );
    }
  }
}

console.log('smoke: external CTAs only point at verified destinations');
{
  const allowedHosts = new Set([
    'freediving.meregrupp.ee',
    'meregrupp.ee',
    'www.facebook.com',
    'freedive.ee',
    'www.googletagmanager.com',
    'schema.org',
  ]);
  for (const page of PAGES) {
    if (!existsSync(join(DIST, page.file))) continue;
    const doc = html(page.file);
    for (const m of doc.matchAll(/href="https?:\/\/([^/"]+)/g)) {
      ok(allowedHosts.has(m[1]), `${page.path}: external host allowed: ${m[1]}`);
    }
  }
}

console.log(`\nsmoke: ${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  console.error(`${failures} failure(s)`);
  process.exit(1);
}
