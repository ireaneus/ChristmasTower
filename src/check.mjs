// Verifies the built site in _site/ against the manuscript. Run with `npm run check` after `npm run build`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadManuscript, splitSections, classify, manuscriptTokens, tokens } from './build.mjs';
import { contrastFailures } from './contrast.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, '_site');
const SITE_URL = 'https://ireaneus.github.io/ChristmasTower/';

const failures = [];
const pass = (msg) => console.log(`  ok  ${msg}`);
const fail = (msg) => { failures.push(msg); console.log(`  FAIL ${msg}`); };

if (!fs.existsSync(path.join(OUT, 'index.html'))) {
  console.error('No _site/index.html. Run `npm run build` first.');
  process.exit(1);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}
const files = walk(OUT);
const htmlFiles = files.filter((f) => f.endsWith('.html'));
const html = Object.fromEntries(htmlFiles.map((f) => [path.relative(OUT, f), fs.readFileSync(f, 'utf8')]));
const pageFor = (slug) => html[`read/${slug}/index.html`];

// Detect the base path the site was built with from the favicon link.
const base = (html['index.html'].match(/href="([^"]*)assets\/favicon\.svg/) || [])[1];

const src = loadManuscript();
const { sections } = splitSections(src);
const { pages, about, interlude } = classify(sections);
const reading = pages;

console.log('Checking _site/ against content/christmas-tower-v11.md');

// 1. Scripture cards equal (ESV) reference lines, excluding Version History.
{
  const raw = fs.readFileSync(path.join(ROOT, 'content/christmas-tower-v11.md'), 'utf8');
  const beforeHistory = raw.split(/^## Version History\s*$/m)[0];
  const refs = beforeHistory.split('\n').filter((l) => /\(ESV\)/.test(l)).length;
  const cards = Object.values(html).reduce((n, h) => n + (h.match(/<blockquote class="scripture">/g) || []).length, 0);
  cards === refs ? pass(`Scripture cards: ${cards} of ${refs} (ESV) references`) : fail(`Scripture cards: site has ${cards}, manuscript has ${refs} (ESV) references`);
}

// 2. Every heading has a page, and prev/next form one chain from Prologue to For the Adults.
{
  const missing = reading.filter((p) => !pageFor(p.slug));
  missing.length ? fail(`Missing pages: ${missing.map((p) => p.slug).join(', ')}`) : pass(`All ${reading.length} reading pages exist`);
  if (!html['about/index.html']) fail('Missing /about/');
  if (!html['404.html']) fail('Missing /404.html');

  const relHref = (h, rel) => (h.match(new RegExp(`href="([^"]+)" rel="${rel}"`)) || [])[1];
  const chain = [];
  let slug = 'prologue';
  const seen = new Set();
  while (slug && !seen.has(slug)) {
    seen.add(slug);
    chain.push(slug);
    const h = pageFor(slug);
    const next = h && relHref(h, 'next');
    const nextSlug = next && next.replace(base + 'read/', '').replace(/\/$/, '');
    if (nextSlug) {
      const back = relHref(pageFor(nextSlug) || '', 'prev');
      if (back !== `${base}read/${slug}/`) fail(`Prev link on ${nextSlug} points to ${back}, expected ${base}read/${slug}/`);
    }
    slug = nextSlug;
  }
  const expected = reading.map((p) => p.slug);
  JSON.stringify(chain) === JSON.stringify(expected)
    ? pass(`Prev/next chain: ${chain.join(' > ')}`)
    : fail(`Prev/next chain is ${chain.join(' > ')}, expected ${expected.join(' > ')}`);
  const seven = pageFor('07');
  if (!seven || relHref(seven, 'next') !== `${base}read/interlude/`) fail('Chapter 7 next link must go to the interlude');
}

// 3. No working notes leak into the output.
{
  const leaks = Object.entries(html).filter(([, h]) => /Version History|Working manuscript/i.test(h)).map(([f]) => f);
  leaks.length ? fail(`Working notes found in: ${leaks.join(', ')}`) : pass('No "Version History" or "Working manuscript" in output');
}

// 4. Story words on the site match the manuscript, token for token.
{
  const storyTokens = (h) => {
    const m = h.match(/<!--story:start-->([\s\S]*?)<!--story:end-->/);
    if (!m) return null;
    const text = m[1]
      .replace(/<(\w+)\b[^>]*\bclass="[^"]*\bchrome\b[^"]*"[^>]*>[\s\S]*?<\/\1>/g, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
      .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
      .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    return tokens(text);
  };
  const compare = (name, want, got) => {
    if (!got) return fail(`${name}: no story region found`);
    const n = Math.max(want.length, got.length);
    for (let i = 0; i < n; i++) {
      if (want[i] !== got[i]) {
        return fail(`${name}: word ${i + 1} differs. Manuscript "${want.slice(i, i + 6).join(' ')}", site "${got.slice(i, i + 6).join(' ')}"`);
      }
    }
    return true;
  };
  let total = 0;
  let ok = true;
  for (const p of reading.filter((q) => !q.isInterlude)) {
    const want = manuscriptTokens(p.md);
    total += want.length;
    if (compare(p.label, want, storyTokens(pageFor(p.slug))) !== true) ok = false;
  }
  const aboutWant = [...manuscriptTokens(about.dedication), ...manuscriptTokens(about.note)];
  total += aboutWant.length;
  if (compare('About', aboutWant, storyTokens(html['about/index.html'])) !== true) ok = false;
  if (ok) pass(`Story words match the manuscript: ${total} words across ${reading.length} pages and /about/`);

  if (interlude) {
    const ih = pageFor('interlude');
    const hasTitle = ih.includes(interlude.title);
    const hasArt = /<figure class="art[^"]*">[\s\S]*?(<img|<figcaption)/.test(ih);
    hasTitle && hasArt ? pass('Interlude has its title and art slot') : fail('Interlude is missing its title or art slot');
  }
}

// 5. Every internal link resolves.
{
  const broken = [];
  let count = 0;
  for (const [file, h] of Object.entries(html)) {
    for (const [, attr, url] of h.matchAll(/\b(href|src|content)="([^"]+)"/g)) {
      let target = url.replace(/&amp;/g, '&');
      if (attr === 'content' && !target.startsWith(SITE_URL)) continue;
      if (target.startsWith(SITE_URL)) target = base + target.slice(SITE_URL.length);
      if (/^(https?:|mailto:|data:|#)/.test(target)) continue;
      if (!target.startsWith('/') && attr !== 'content') {
        target = path.posix.join('/', path.posix.dirname(file), target);
        target = base + target.slice(1);
      }
      if (!target.startsWith(base)) { broken.push(`${file}: ${url} (outside ${base})`); continue; }
      const [p] = target.slice(base.length).split(/[?#]/);
      const candidate = path.join(OUT, p);
      const exists = p === '' || p.endsWith('/') ? fs.existsSync(path.join(candidate, 'index.html')) : fs.existsSync(candidate);
      count++;
      if (!exists) broken.push(`${file}: ${url}`);
      const hashPart = target.split('#')[1];
      if (hashPart && exists) {
        const dest = p === '' || p.endsWith('/') ? path.join(candidate, 'index.html') : candidate;
        if (!fs.readFileSync(dest, 'utf8').includes(`id="${hashPart}"`)) broken.push(`${file}: ${url} (no #${hashPart})`);
      }
    }
  }
  broken.length ? fail(`Broken internal links:\n      ${broken.join('\n      ')}`) : pass(`${count} internal links resolve`);
}

// Quality extras: one <h1> per page, alt on every image, titles and descriptions, contrast.
{
  const problems = [];
  for (const [file, h] of Object.entries(html)) {
    if (/http-equiv="refresh"/.test(h)) continue;
    const h1 = (h.match(/<h1[\s>]/g) || []).length;
    if (h1 !== 1) problems.push(`${file}: ${h1} <h1> elements`);
    for (const img of h.match(/<img\b[^>]*>/g) || []) {
      if (!/\balt="[^"]+"/.test(img)) problems.push(`${file}: image without alt text`);
      if (!/\bwidth="\d+"/.test(img) || !/\bheight="\d+"/.test(img)) problems.push(`${file}: image without width/height`);
    }
    if (!/<title>[^<]+<\/title>/.test(h)) problems.push(`${file}: no <title>`);
    if (!/<meta name="description" content="[^"]+"/.test(h)) problems.push(`${file}: no meta description`);
    if (!/property="og:image" content="https:/.test(h)) problems.push(`${file}: no og:image`);
    if (!/class="skip-link"/.test(h)) problems.push(`${file}: no skip link`);
    if (/—/.test(h.replace(/<!--story:start-->[\s\S]*?<!--story:end-->/g, ''))) problems.push(`${file}: em dash in site copy`);
  }
  problems.length ? fail(`Page quality:\n      ${problems.join('\n      ')}`) : pass('One <h1>, alt text, title, description, Open Graph, and skip link on every page');

  const contrast = contrastFailures();
  contrast.length ? fail(`Contrast below 4.5:1:\n      ${contrast.join('\n      ')}`) : pass('All text color pairs meet 4.5:1 in both themes');
}

if (failures.length) {
  console.log(`\n${failures.length} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll checks passed.');
