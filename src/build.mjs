// Builds the static site in _site/ from content/christmas-tower-v11.md.
// Run with `npm run build`. SITE_BASE overrides the path prefix (default /ChristmasTower/).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import MarkdownIt from 'markdown-it';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, '_site');
const BASE = process.env.SITE_BASE ?? '/ChristmasTower/';
const ORIGIN = 'https://ireaneus.github.io';
const SITE_URL = ORIGIN + '/ChristmasTower/';
const KDP_URL = 'https://www.amazon.com/dp/B0FWX3T8SM';
const WORDS_PER_MINUTE = 150;
const FONTS_HREF = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,500;1,600&family=Source+Serif+4:ital,wght@0,400;0,600;0,700;1,400&display=swap';
const ESV_NOTICE = 'Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.';

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const readJson = (p) => JSON.parse(read(p));

// Site-only structure. The manuscript's --- breaks are the printed book's; the website pages by subject instead.
const TITLES = readJson('content/titles.json');
const BREAKS = readJson('content/pages.json');

// ---------- Manuscript ----------

// Display cleanup only: escaped quotes become plain quotes so markdown-it can curl them.
export function loadManuscript() {
  let src = read('content/christmas-tower-v11.md').replace(/\r\n/g, '\n');
  const vh = src.search(/^## Version History\s*$/m);
  if (vh !== -1) src = src.slice(0, vh);
  src = src.replace(/^.*Working manuscript.*$/m, '');
  src = src.replace(/^\/\*Note:.*\*\/\s*$/gm, '');
  return src.replace(/\\"/g, '"');
}

// Splits the manuscript into its title block and ## sections.
export function splitSections(src) {
  const parts = src.split(/^## /m);
  const front = parts.shift();
  const sections = parts.map((part) => {
    const nl = part.indexOf('\n');
    return { heading: part.slice(0, nl).trim(), md: part.slice(nl + 1) };
  });
  return { front, sections };
}

// Maps each ## heading to a page definition.
export function classify(sections) {
  const pages = [];
  const about = {};
  let interlude = null;
  for (const { heading, md } of sections) {
    let m;
    if (heading === 'Dedication') about.dedication = md;
    else if (heading === 'A Personal Note from the Author') about.note = md;
    else if ((m = heading.match(/^Prologue: (.+)$/))) {
      pages.push({ key: 'prologue', slug: 'prologue', chip: 'P', label: 'Prologue', continueLabel: 'the Prologue', title: m[1], md, evening: 1 });
    } else if ((m = heading.match(/^Chapter (\d+): (.+)$/))) {
      const n = Number(m[1]);
      const nn = String(n).padStart(2, '0');
      let body = md;
      const ill = md.match(/^#{3,4} \*Full-Page Illustration: (.+?)\*\s*\n+([\s\S]*)$/m);
      if (ill) {
        body = md.slice(0, ill.index);
        const desc = ill[2].trim().split(/\n\s*\n/)[0].trim();
        interlude = { title: ill[1].trim(), description: desc.replace(/^\*|\*$/g, ''), afterChapter: n };
      }
      pages.push({ key: 'ch' + nn, slug: nn, chip: String(n), num: n, label: `Chapter ${n}`, continueLabel: `Chapter ${n}`, title: m[2], md: body, evening: n <= 7 ? 1 : 2 });
    } else if ((m = heading.match(/^Epilogue: (.+)$/))) {
      pages.push({ key: 'epilogue', slug: 'epilogue', chip: 'E', label: 'Epilogue', continueLabel: 'the Epilogue', title: m[1], md, evening: 2 });
    } else if (heading === 'For the Adults') {
      pages.push({ key: 'for-the-adults', slug: 'for-the-adults', chip: 'A', label: 'For the Adults', continueLabel: 'For the Adults', title: 'For the Adults', md, evening: 'after' });
    } else {
      throw new Error(`Unrecognized section heading: "## ${heading}"`);
    }
  }
  const keys = new Set(pages.map((p) => p.key));
  for (const [file, map] of [['titles.json', TITLES], ['pages.json', BREAKS]]) {
    const unknown = Object.keys(map).filter((k) => !keys.has(k));
    if (unknown.length) throw new Error(`content/${file} has keys that match no section: ${unknown.join(', ')}`);
  }
  for (const p of pages) if (TITLES[p.key]) p.title = TITLES[p.key];
  if (interlude) {
    const at = pages.findIndex((p) => p.num === interlude.afterChapter) + 1;
    pages.splice(at, 0, { key: 'interlude', slug: 'interlude', title: interlude.title, description: interlude.description, isInterlude: true, evening: 1 });
  }
  return { pages, about, interlude };
}

// Word tokens used for read-aloud time and the word-count check.
export function tokens(text) {
  return text
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .split(/\s+/)
    .filter((t) => /[\p{L}\p{N}]/u.test(t));
}

export function manuscriptTokens(md) {
  const text = md
    .split('\n')
    .filter((l) => !/^\s*---\s*$/.test(l))
    .map((l) => l.replace(/^\s*>\s?/, '').replace(/^\s*[-*]\s+(?=\S)/, '').replace(/^#+\s+/, ''))
    .join('\n')
    .replace(/\\/g, '')
    .replace(/\*/g, '');
  return tokens(text);
}

// ---------- Markdown rendering ----------

const md = new MarkdownIt({ html: false, typographer: true, quotes: '“”‘’' });
md.disable('replacements');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Groups a flat token stream into top-level blocks.
function topLevelBlocks(toks) {
  const blocks = [];
  let i = 0;
  while (i < toks.length) {
    const start = i;
    if (toks[i].nesting === 1) {
      let depth = 0;
      do {
        depth += toks[i].nesting;
        i++;
      } while (depth > 0);
    } else i++;
    blocks.push(toks.slice(start, i));
  }
  return blocks;
}

// True when an inline token's children are wrapped start to finish in one open/close pair.
// markdown-it emits empty text tokens around emphasis; ignore them at the edges.
function trimmed(inline) {
  const ch = inline.children.slice();
  while (ch.length && ch[0].type === 'text' && ch[0].content === '') ch.shift();
  while (ch.length && ch.at(-1).type === 'text' && ch.at(-1).content === '') ch.pop();
  return ch;
}

function wrappedBy(inline, open) {
  const ch = trimmed(inline);
  if (!ch || ch.length < 3 || ch[0].type !== open + '_open' || ch.at(-1).type !== open + '_close') return false;
  let depth = 0;
  for (let i = 0; i < ch.length; i++) {
    if (ch[i].type === open + '_open') depth++;
    if (ch[i].type === open + '_close') depth--;
    if (depth === 0 && i < ch.length - 1) return false;
  }
  return true;
}

const renderInline = (children) => md.renderer.renderInline(children, md.options, {});
const unwrap = (inline) => renderInline(trimmed(inline).slice(1, -1));
const plainText = (inline) => inline.children.filter((c) => c.type === 'text' || c.type === 'softbreak').map((c) => (c.type === 'softbreak' ? ' ' : c.content)).join('');

const ORNAMENT = read('assets/ornaments/star-divider.svg').trim();

function loadAsides() {
  const raw = readJson('content/asides.json');
  const norm = (s) => s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  return Object.entries(raw).map(([k, v]) => [norm(k), v]);
}
const ASIDES = loadAsides();

// Plain text of a rendered block, for matching the opening words in content/pages.json.
const normQuotes = (s) => s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
function blockText(html) {
  const text = html
    .replace(/<span class="chrome">[^<]*<\/span>|<p class="talk-label chrome">[^<]*<\/p>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  return normQuotes(text).replace(/\s+/g, ' ').trim();
}

// Renders a section as a list of page bodies.
// With `breaks` (opening words from content/pages.json), a new page starts at each block that begins with one of them
// and the manuscript's --- lines are ignored. Without it, each --- is a page break.
// Records italic paragraphs and unlabeled quotes in `log`.
export function renderPages(source, pageLabel, log, breaks) {
  const toks = md.parse(source, {});
  const blocks = topLevelBlocks(toks);
  const out = [];
  for (const b of blocks) {
    const t = b[0].type;
    if (t === 'hr') {
      out.push({ kind: 'hr' });
    } else if (t === 'paragraph_open') {
      const inline = b[1];
      if (wrappedBy(inline, 'strong')) {
        out.push({ kind: 'payoff', html: `<p class="payoff">${unwrap(inline)}</p>` });
      } else if (wrappedBy(inline, 'em')) {
        const text = plainText(inline).replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
        const override = ASIDES.find(([k]) => text.startsWith(k));
        const byDefault = /\?["']?$/.test(text.trim()) ? 'aside' : 'tower';
        const kind = override ? override[1] : byDefault;
        log.italics.push({ page: pageLabel, text, kind, source: override ? 'asides.json' : 'default rule' });
        out.push(kind === 'aside'
          ? { kind: 'aside', html: talkCard(`<p>${unwrap(inline)}</p>`) }
          : { kind: 'tower-em', html: `<p class="tower-em">${renderInline(inline.children)}</p>` });
      } else {
        out.push({ kind: 'p', html: `<p>${renderInline(inline.children)}</p>` });
      }
    } else if (t === 'blockquote_open') {
      const inner = topLevelBlocks(b.slice(1, -1));
      const first = inner[0];
      const isRef = first && first[0].type === 'paragraph_open' && wrappedBy(first[1], 'strong') && /\(ESV\)$/.test(plainText(first[1]).trim());
      if (isRef) {
        const ref = plainText(first[1]).trim();
        const verse = md.renderer.render(inner.slice(1).flat(), md.options, {});
        out.push({ kind: 'scripture', html: `<blockquote class="scripture"><p class="scripture-ref"><span class="chrome">Narrator voice · </span>${esc(ref)}</p><div class="verse">${verse}</div></blockquote>` });
      } else {
        const html = md.renderer.render(inner.flat(), md.options, {});
        log.unlabeled.push({ page: pageLabel, text: html.replace(/<[^>]+>/g, '').trim() });
        out.push({ kind: 'quote', html: `<blockquote class="second-voice-quote"><div class="verse">${html}</div></blockquote>` });
      }
    } else if (t === 'bullet_list_open' || t === 'ordered_list_open') {
      const items = topLevelBlocks(b.slice(1, -1));
      const inlines = items.map((it) => it.find((x) => x.type === 'inline'));
      const allItalic = inlines.every((il) => il && wrappedBy(il, 'em'));
      if (allItalic) {
        for (const il of inlines) log.italics.push({ page: pageLabel, text: plainText(il), kind: 'aside', source: 'italic list' });
        out.push({ kind: 'aside', html: talkCard(`<ul>${inlines.map((il) => `<li>${unwrap(il)}</li>`).join('')}</ul>`) });
      } else {
        out.push({ kind: 'p', html: md.renderer.render(b, md.options, {}) });
      }
    } else {
      throw new Error(`${pageLabel}: unexpected block "${t}"`);
    }
  }
  if (breaks) {
    const blocks = out.filter((blk) => blk.kind !== 'hr');
    const starts = breaks.map((key) => {
      const hits = blocks.flatMap((blk, i) => (blockText(blk.html).startsWith(normQuotes(key)) ? [i] : []));
      if (hits.length !== 1) throw new Error(`content/pages.json: "${key}" matches ${hits.length} blocks in ${pageLabel}. Use opening words that match exactly one.`);
      if (hits[0] === 0) throw new Error(`content/pages.json: "${key}" is the first block of ${pageLabel}, which already starts a page.`);
      return hits[0];
    });
    if (starts.some((at, i) => i && at <= starts[i - 1])) throw new Error(`content/pages.json: the breaks for ${pageLabel} are out of reading order.`);
    return [0, ...starts].map((at, i) => blocks.slice(at, starts[i] ?? blocks.length).map((blk) => blk.html).join('\n'));
  }
  // Each --- is a page break. Repeated breaks and breaks at the edges never make an empty page.
  const pages = [[]];
  for (const blk of out) {
    if (blk.kind === 'hr') {
      if (pages.at(-1).length) pages.push([]);
    } else pages.at(-1).push(blk.html);
  }
  if (!pages.at(-1).length) pages.pop();
  return pages.map((blocks) => blocks.join('\n'));
}

// Renders a reading section into its pages, using its breaks from content/pages.json when it has an entry.
export function renderSection(p, log) {
  return renderPages(p.md, p.label, log, BREAKS[p.key]);
}

// Renders a section with no page breaks (Dedication, Personal Note).
export function renderBody(source, pageLabel, log) {
  return renderPages(source, pageLabel, log).join('\n');
}

function talkCard(inner) {
  return `<div class="talk" role="note"><p class="talk-label chrome">Talk about it</p>${inner}</div>`;
}

// ---------- Art ----------

function webpSize(file) {
  const d = fs.readFileSync(file);
  const kind = d.toString('ascii', 12, 16);
  if (kind === 'VP8X') return { width: d.readUIntLE(24, 3) + 1, height: d.readUIntLE(27, 3) + 1 };
  if (kind === 'VP8 ') return { width: d.readUInt16LE(26) & 0x3fff, height: d.readUInt16LE(28) & 0x3fff };
  if (kind === 'VP8L') {
    const v = d.readUInt32LE(21);
    return { width: (v & 0x3fff) + 1, height: ((v >> 14) & 0x3fff) + 1 };
  }
  throw new Error(`Unrecognized WebP file: ${file}`);
}

const ART = readJson('content/art.json');
const usedArt = new Set();

function artEntry(key) {
  const e = ART[key];
  if (!e?.file) return null;
  const file = path.join(ROOT, 'assets/art', e.file);
  if (!fs.existsSync(file)) return null;
  if (!e.file.endsWith('.webp')) throw new Error(`art.json "${key}" must point to a .webp file`);
  usedArt.add(e.file);
  return { ...e, ...webpSize(file) };
}

function artSlot(key, fallbackAlt, { eager = true } = {}) {
  const entry = artEntry(key);
  const alt = ART[key]?.alt || fallbackAlt;
  if (entry) {
    const orient = entry.height > entry.width ? ' art-portrait' : '';
    return `<figure class="art${orient}"><img src="${BASE}assets/art/${esc(entry.file)}" alt="${esc(alt)}" width="${entry.width}" height="${entry.height}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></figure>`;
  }
  return `<figure class="art art-placeholder"><span class="art-placeholder-star">${STAR}</span><figcaption>${esc(alt)}</figcaption></figure>`;
}

// ---------- Pages ----------

const STAR = read('assets/ornaments/star.svg').trim();
const SUN = read('assets/ornaments/sun.svg').trim();
const MOON = read('assets/ornaments/moon.svg').trim();

function tpl(name) {
  return read(`src/templates/${name}`);
}
function fill(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => {
    if (!(k in vars)) throw new Error(`Template variable "${k}" is missing`);
    return vars[k];
  });
}

const hash = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 10);

function firstSentences(html, max = 155) {
  const text = html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const stop = cut.lastIndexOf('. ');
  return stop > 60 ? cut.slice(0, stop + 1) : cut.slice(0, cut.lastIndexOf(' ')) + '…';
}

function writePage(rel, html) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

function main() {
  const src = loadManuscript();
  const { front, sections } = splitSections(src);
  const subtitle = (front.match(/^\*(.+)\*\s*$/m) || [])[1] || '';
  const { pages, about } = classify(sections);
  const reading = pages;
  const log = { italics: [], unlabeled: [] };

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT, 'assets/art'), { recursive: true });

  const css = read('src/styles.css');
  const js = read('src/site.js');
  fs.writeFileSync(path.join(OUT, 'assets/site.js'), js);
  fs.copyFileSync(path.join(ROOT, 'assets/favicon.svg'), path.join(OUT, 'assets/favicon.svg'));
  fs.copyFileSync(path.join(ROOT, 'assets/og.jpg'), path.join(OUT, 'assets/og.jpg'));
  fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
  if (fs.existsSync(path.join(ROOT, 'CNAME'))) fs.copyFileSync(path.join(ROOT, 'CNAME'), path.join(OUT, 'CNAME'));

  const href = (p) => `${BASE}read/${p.slug}/`;
  const layout = tpl('layout.html');
  const page = ({ rel, title, description, main, bodyClass = '', bodyData = '', ogType = 'article' }) => {
    const urlPath = rel.replace(/index\.html$/, '');
    writePage(rel, fill(layout, {
      title: esc(title === 'The Christmas Tower' ? title : `${title} · The Christmas Tower`),
      ogTitle: esc(title),
      description: esc(description),
      canonical: SITE_URL + urlPath,
      ogImage: SITE_URL + 'assets/og.jpg',
      ogType,
      base: BASE,
      fontsHref: FONTS_HREF.replace(/&/g, '&amp;'),
      inlineCss: css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*\n\s*/g, '\n').trim(),
      jsVersion: hash(js),
      bodyClass,
      bodyData,
      sunIcon: SUN,
      moonIcon: MOON,
      main,
      esvNotice: ESV_NOTICE,
      kdpUrl: KDP_URL,
    }));
  };

  // Reading pages: content/pages.json says where each section turns the page.
  const eveningWords = { 1: 0, 2: 0 };
  const sheets = [];
  for (const p of reading) {
    const bodies = p.isInterlude ? [null] : renderSection(p, log);
    if (p.evening === 1 || p.evening === 2) eveningWords[p.evening] += p.isInterlude ? 0 : manuscriptTokens(p.md).length;
    bodies.forEach((body, k) => {
      const sub = k === 0 ? '' : `${k + 1}/`;
      const artKey = p.isInterlude ? 'interlude' : k === 0 ? p.key : `${p.key}-${k + 1}`;
      sheets.push({ p, body, n: k + 1, total: bodies.length, artKey, rel: `read/${p.slug}/${sub}index.html`, href: `${href(p)}${sub}` });
    });
  }
  // Every art.json key must name a real page, so a typo fails loudly instead of silently showing nothing.
  const artKeys = new Set(['home-hero', ...sheets.map((sh) => sh.artKey)]);
  const unknown = Object.keys(ART).filter((k) => !artKeys.has(k));
  if (unknown.length) {
    throw new Error(`content/art.json has keys that match no page: ${unknown.join(', ')}. See ART_PAGES.md for the valid keys.`);
  }
  writeArtPages(sheets);

  const chapterName = (q) => (q.isInterlude ? 'End of Evening One' : q.num ? `Chapter ${q.num}: ${q.title}` : q.evening === 'after' ? q.title : `${q.label}: ${q.title}`);

  sheets.forEach((sh, i) => {
    const { p } = sh;
    const prev = sheets[i - 1];
    const next = sheets[i + 1];
    const turn = (to, dir) => {
      if (!to) {
        return dir === 'prev'
          ? `<a class="pager-prev" href="${BASE}#plan"><span class="pager-label chrome">Back</span><span>Reading plan</span></a>`
          : `<a class="pager-next" href="${BASE}about/"><span class="pager-label chrome">The end</span><span>About the book</span></a>`;
      }
      const same = to.p === p;
      const label = same ? (dir === 'prev' ? 'Previous page' : 'Next page') : dir === 'prev' ? 'Back to' : 'Next';
      const text = same ? `Page ${to.n} of ${to.total}` : chapterName(to.p);
      return `<a class="pager-${dir}" href="${to.href}" rel="${dir}"><span class="pager-label chrome">${label}</span><span>${esc(text)}</span></a>`;
    };
    const count = sh.total > 1 ? `<p class="pager-count chrome" aria-hidden="true">${sh.n} / ${sh.total}</p>` : '';
    const pager = `<nav class="pager" aria-label="Turn the page">${turn(prev, 'prev')}${count}${turn(next, 'next')}</nav>`;

    if (p.isInterlude) {
      const main = fill(tpl('interlude.html'), {
        title: esc(p.title),
        art: artSlot('interlude', p.description),
        starIcon: STAR,
        nextHref: next.href,
        pager,
      });
      page({ rel: sh.rel, title: 'End of Evening One', description: `The end of Evening One of The Christmas Tower. ${p.title}.`, main, bodyClass: 'page-interlude' });
      return;
    }

    const first = sh.n === 1;
    const last = sh.n === sh.total;
    const where = p.evening === 'after' ? 'After Evening Two' : `Evening ${p.evening === 1 ? 'one' : 'two'} · ${p.label}`;
    const eyebrow = sh.total > 1 ? `${where} · Page ${sh.n} of ${sh.total}` : where;
    const main = fill(tpl('chapter.html'), {
      headClass: first ? 'reading-head' : 'reading-head continued',
      eyebrow: esc(eyebrow),
      title: esc(p.title),
      // Page 1 always has an art slot (placeholder until the file exists); later pages only when art.json names one.
      art: first || ART[sh.artKey] ? artSlot(sh.artKey, ART[sh.artKey]?.alt || `Illustration for ${p.label}`) : '',
      body: sh.body,
      end: last ? `<div class="section-break chapter-end">${ORNAMENT}</div>` : '',
      pager,
    });
    const firstPara = (sh.body.match(/<p>([\s\S]*?)<\/p>/) || (sh.body.match(/<div class="verse"><p>([\s\S]*?)<\/p>/) || [, '']))[1];
    const baseTitle = p.evening === 'after' ? p.title : `${p.label}: ${p.title}`;
    const pageLabel = sh.total > 1 && !first ? `, page ${sh.n}` : '';
    page({
      rel: sh.rel,
      title: first ? baseTitle : `${baseTitle} (page ${sh.n})`,
      description: firstSentences(firstPara) || `${baseTitle}. The Christmas Tower.`,
      main,
      bodyClass: 'page-reading',
      bodyData: ` data-continue-href="${sh.href}" data-continue-label="${esc(p.continueLabel + pageLabel)}"`,
    });
  });

  // Home
  const row = (p) => `<li><a href="${href(p)}"><span class="num-chip" aria-hidden="true">${p.chip}</span><span><span class="visually-hidden">${esc(p.label)}: </span>${esc(p.title)}</span></a></li>`;
  const listed = reading.filter((p) => !p.isInterlude);
  const evening = (name, heading, items, words) => fill(tpl('evening.html'), {
    eveningName: name,
    minutes: Math.round(words / WORDS_PER_MINUTE),
    heading,
    rows: items.map(row).join('\n'),
  });
  const chapterCount = listed.filter((p) => p.num).length;
  const numberWords = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen'];
  const heroEntry = artEntry('home-hero');
  const heroArt = heroEntry
    ? `<img src="${BASE}assets/art/${esc(heroEntry.file)}" alt="${esc(heroEntry.alt)}" width="${heroEntry.width}" height="${heroEntry.height}" fetchpriority="high">`
    : tpl('hero.svg');
  const home = fill(tpl('home.html'), {
    base: BASE,
    heroArt,
    subtitle: esc(subtitle),
    chapterCountWord: numberWords[chapterCount] || String(chapterCount),
    eveningOne: evening('Evening one', 'The tower receives its name', listed.filter((p) => p.evening === 1), eveningWords[1]),
    eveningTwo: evening('Evening two', 'Heaven breaks in', listed.filter((p) => p.evening !== 1), eveningWords[2]),
    kdpUrl: KDP_URL,
  });
  page({
    rel: 'index.html',
    title: 'The Christmas Tower',
    description: 'A read-aloud Christmas story for families in two evenings. An old stone tower above Bethlehem tells how it held the lambs, then held the Lamb, and was given a new name.',
    main: home,
    bodyClass: 'page-home',
    ogType: 'website',
  });

  // About
  const aboutMain = fill(tpl('about.html'), {
    subtitle: esc(subtitle),
    dedication: renderBody(about.dedication, 'Dedication', log),
    note: renderBody(about.note, 'A Personal Note', log),
    esvNotice: ESV_NOTICE,
    base: BASE,
    kdpUrl: KDP_URL,
  });
  page({ rel: 'about/index.html', title: 'About the book', description: 'The dedication and a personal note from David Haines, author of The Christmas Tower.', main: aboutMain });

  // 404
  page({ rel: '404.html', title: 'Page not found', description: 'This page is off the path. The Christmas Tower is on the home page.', main: fill(tpl('notfound.html'), { starIcon: STAR, base: BASE }) });

  // Redirect stubs for old URLs
  const redirectTpl = tpl('redirect.html');
  const labelFor = (target) => {
    if (target === '') return 'the home page';
    if (target === 'about/') return 'About the book';
    const sh = sheets.find((q) => q.href === BASE + target);
    if (!sh) throw new Error(`redirects.json points to a missing page: ${target}`);
    const p = sh.p;
    const name = p.label === 'For the Adults' ? p.title : `${p.label}: ${p.title}`;
    return sh.n > 1 ? `${name}, page ${sh.n}` : name;
  };
  for (const [from, to] of Object.entries(readJson('content/redirects.json'))) {
    if (sheets.some((sh) => sh.rel === path.join(from, 'index.html'))) throw new Error(`redirects.json would replace a real page: ${from}`);
    const target = BASE + to;
    writePage(path.join(from, 'index.html'), fill(redirectTpl, { label: esc(labelFor(to)), target, canonical: SITE_URL + to }));
  }

  // Art actually used
  for (const f of usedArt) fs.copyFileSync(path.join(ROOT, 'assets/art', f), path.join(OUT, 'assets/art', f));

  // Sitemap
  const urls = ['', 'about/', ...sheets.map((sh) => sh.href.slice(BASE.length))];
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${SITE_URL}${u}</loc></url>`).join('\n')}\n</urlset>\n`);

  writeAsidesReview(log);
  if (log.unlabeled.length) {
    console.log(`Note: ${log.unlabeled.length} blockquote(s) without a reference line (listed in MANUSCRIPT_FLAGS.md).`);
  }
  console.log(`Built ${sheets.length + 3} pages (${sheets.length} reading pages) into ${path.relative(ROOT, OUT)}/ with base ${BASE}`);
  console.log(`Evening one: ${eveningWords[1]} words (~${Math.round(eveningWords[1] / WORDS_PER_MINUTE)} min). Evening two: ${eveningWords[2]} words (~${Math.round(eveningWords[2] / WORDS_PER_MINUTE)} min).`);
}

function writeArtPages(sheets) {
  const status = (key) => {
    const e = ART[key];
    if (!e?.file) return '';
    return fs.existsSync(path.join(ROOT, 'assets/art', e.file)) ? `\`${e.file}\`` : `\`${e.file}\` (missing, shows placeholder)`;
  };
  const lines = [
    '# Art keys for every page',
    '',
    'Generated by `npm run build`. Use the key in `content/art.json` to put an illustration on that page:',
    '',
    '```json',
    '"ch09-3": { "file": "ch09-3.webp", "alt": "The shepherds walking back from the manger, praising God" }',
    '```',
    '',
    'Page 1 of every chapter always has an art slot, which shows a placeholder until its file exists. Any other page shows art only when it has an entry. The art sits at the top of the page, under the heading. The home page hero uses the key `home-hero`.',
    '',
    'House rules, enforced by `npm run check`: page 1 of each section has art. A section of 4 or more pages has one more picture, with at least one full page of text between the two. Each file is named after its key, for example `ch08.webp` and `ch08-3.webp`.',
    '',
    '| Key | Page | Starts with | Art |',
    '| --- | --- | --- | --- |',
    ...sheets.map((sh) => {
      const words = sh.body === null ? sh.p.title : sh.body.replace(/<span class="chrome">[^<]*<\/span>|<p class="talk-label chrome">[^<]*<\/p>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').slice(0, 9).join(' ') + '…';
      const where = sh.p.isInterlude ? 'Interlude' : `${sh.p.label}, page ${sh.n} of ${sh.total}`;
      return `| \`${sh.artKey}\` | ${where} | ${words.replace(/\|/g, '\\|')} | ${status(sh.artKey)} |`;
    }),
    '',
  ];
  fs.writeFileSync(path.join(ROOT, 'ART_PAGES.md'), lines.join('\n'));
}

function writeAsidesReview(log) {
  const lines = [
    '# Asides review',
    '',
    'Generated by `npm run build`. Every italic paragraph in the manuscript, with how the site renders it.',
    '',
    '- **aside** renders as a "Talk about it" card (second voice).',
    '- **tower** renders as italic text in the Tower\'s voice.',
    '',
    'To change one, add or edit its opening words in `content/asides.json`, for example `{"Same little boy": "tower"}`, then rebuild.',
    'Rows marked `asides.json` are already overridden there. Delete the key to fall back to the default rule (ends with `?` means aside).',
    '',
    '| # | Page | Renders as | Decided by | Text |',
    '| --- | --- | --- | --- | --- |',
    ...log.italics.map((it, i) => `| ${i + 1} | ${it.page} | ${it.kind} | ${it.source} | ${it.text.replace(/\|/g, '\\|')} |`),
    '',
  ];
  fs.writeFileSync(path.join(ROOT, 'ASIDES_REVIEW.md'), lines.join('\n'));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
