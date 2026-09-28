// Computes WCAG contrast for every text/background pair the design uses, read from the tokens in styles.css.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function tokensFor(css, theme) {
  const block = css.match(new RegExp(`:root\\[data-theme="${theme}"\\]\\s*\\{([^}]*)\\}`))[1];
  const root = css.match(/:root\s*\{([^}]*)\}/)[1];
  const vars = {};
  for (const [, k, v] of (root + block).matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})/g)) vars[k] = v;
  return vars;
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function ratio(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

// [foreground, background, where it appears]
const PAIRS = [
  ['text', 'bg', 'body text'],
  ['text', 'surface', 'text in cards'],
  ['muted', 'bg', 'muted text, nav links'],
  ['muted', 'surface', 'muted text in cards'],
  ['heading', 'bg', 'headings, payoff lines'],
  ['heading', 'surface', 'card headings'],
  ['accent-text', 'bg', 'links, eyebrow labels'],
  ['accent-text', 'surface', 'Talk about it label, card labels'],
  ['chip-text', 'chip-bg', 'number chips'],
  ['scripture-text', 'scripture-bg', 'Scripture verse'],
  ['gold', 'scripture-bg', 'Scripture reference label'],
  ['placeholder-text', 'placeholder-bg', 'art placeholder caption'],
  ['gold-ink', 'gold', 'gold button'],
];
// Hero is a night scene in both themes.
const FIXED = [
  ['#F4EEDC', '#22335A', 'hero title on lightest sky'],
  ['#D6D0BE', '#22335A', 'hero lede on lightest sky'],
  ['#E3B04B', '#16264A', 'hero eyebrow'],
  ['#F1E6C8', '#22335A', 'hero subtitle'],
];

export function report() {
  const css = fs.readFileSync(path.join(ROOT, 'src/styles.css'), 'utf8');
  const rows = [];
  for (const theme of ['dark', 'light']) {
    const t = tokensFor(css, theme);
    for (const [fg, bg, where] of PAIRS) rows.push({ theme, pair: `${fg} on ${bg}`, where, value: ratio(t[fg], t[bg]) });
  }
  for (const [fg, bg, where] of FIXED) rows.push({ theme: 'both', pair: `${fg} on ${bg}`, where, value: ratio(fg, bg) });
  return rows;
}

export function contrastFailures() {
  return report().filter((r) => r.value < 4.5).map((r) => `${r.theme}: ${r.pair} (${r.where}) is ${r.value.toFixed(2)}:1`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const r of report()) console.log(`${r.value >= 4.5 ? 'ok  ' : 'FAIL'} ${r.value.toFixed(2).padStart(5)}:1  ${r.theme.padEnd(5)} ${r.pair.padEnd(34)} ${r.where}`);
  process.exit(contrastFailures().length ? 1 : 0);
}
