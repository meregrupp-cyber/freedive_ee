#!/usr/bin/env node
/**
 * Visual + accessibility QA over the built site.
 * Serves dist/ locally, screenshots every page at several widths,
 * checks for horizontal overflow, and runs axe-core on each page.
 *
 * Usage: node scripts/qa-visual.mjs [--shots-dir <dir>]
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';

const DIST = new URL('../dist/', import.meta.url).pathname;
const shotsDirArg = process.argv.indexOf('--shots-dir');
const SHOTS = shotsDirArg > -1 ? process.argv[shotsDirArg + 1] : 'qa-shots';
mkdirSync(SHOTS, { recursive: true });

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
};

const server = createServer(async (req, res) => {
  let path = decodeURIComponent((req.url ?? '/').split('?')[0]);
  if (path.endsWith('/')) path += 'index.html';
  const file = join(DIST, path);
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    const notFound = await readFile(join(DIST, '404.html'));
    res.writeHead(404, { 'content-type': 'text/html' });
    res.end(notFound);
  }
});

await new Promise((resolve) => server.listen(4321, resolve));

const PAGES = ['/', '/rummu-quarry/', '/seasons-and-conditions/', '/plan-your-trip/', '/start-here/', '/privacy/', '/thank-you/', '/definitely-missing/'];
const WIDTHS = [360, 768, 1024, 1440];
const axeSource = readFileSync(new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');

const executablePath = existsSync('/opt/pw-browsers/chromium')
  ? '/opt/pw-browsers/chromium'
  : undefined;
const browser = await chromium.launch(executablePath ? { executablePath } : {});
let problems = 0;

for (const path of PAGES) {
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(`http://localhost:4321${path}`, { waitUntil: 'networkidle' });

    // Trigger lazy-loaded images, wait for them, then return to top.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo({ top: y, behavior: 'instant' });
        await new Promise((r) => setTimeout(r, 40));
      }
      await Promise.all(
        [...document.images].map((img) =>
          img.complete ? null : new Promise((r) => img.addEventListener('load', r, { once: true }))
        )
      );
      window.scrollTo({ top: 0, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 120));
    });
    const brokenImages = await page.evaluate(() =>
      [...document.images]
        .filter((img) => img.complete && img.naturalWidth === 0 && img.getAttribute('src'))
        .map((img) => img.getAttribute('src'))
    );
    if (brokenImages.length > 0) {
      problems += brokenImages.length;
      console.error(`✗ broken images on ${path} @ ${width}px:`, brokenImages);
    }

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    if (overflow > 1) {
      problems += 1;
      console.error(`✗ horizontal overflow ${overflow}px on ${path} @ ${width}px`);
    }

    const slug = path === '/' ? 'home' : path.replaceAll('/', '').replace('definitely-missing', '404');
    await page.screenshot({ path: join(SHOTS, `${slug}-${width}.png`), fullPage: width === 360 || width === 1440 });

    if (width === 1440) {
      await page.addScriptTag({ content: axeSource });
      const axe = await page.evaluate(async () => {
        // eslint-disable-next-line no-undef
        const results = await window.axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag22aa'] },
        });
        return results.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.length,
          help: v.help,
        }));
      });
      if (axe.length > 0) {
        problems += axe.length;
        console.error(`✗ axe violations on ${path}:`, JSON.stringify(axe, null, 2));
      }
    }
    await page.close();
  }
  console.log(`checked ${path}`);
}

await browser.close();
server.close();

if (problems > 0) {
  console.error(`\n${problems} visual/accessibility problem(s)`);
  process.exit(1);
}
console.log('\nvisual + axe: all clean');
