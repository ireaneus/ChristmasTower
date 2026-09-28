# Migration notes: original site to v11

## Original site

- **Preserved at tag `original-site`** (commit `399b217`), pushed to `origin` on 28 Sep 2026. To look at it again: `git checkout original-site`.
- **Stack:** Astro 5 with Svelte and MDX, built by `.github/workflows/astro.yml` and deployed through GitHub Actions.
- **Pages source:** "GitHub Actions" (confirmed by Dave, 28 Sep 2026). The new workflow, `.github/workflows/pages.yml`, uses the same source, so no settings change is needed.
- **URL:** `https://ireaneus.github.io/ChristmasTower/` (Astro `base: '/ChristmasTower/'`).
- **CNAME:** none. The build copies a `CNAME` file into `_site/` automatically if one is ever added at the repo root.

## Paths the old site served

All paths are under `/ChristmasTower/`.

| Old path | What it was | New site |
| --- | --- | --- |
| `/` | Home | New home page |
| `/about/` | About page | New `/about/` (same path, no redirect needed) |
| `/blog/` | Post index | Redirect to home |
| `/blog/table-of-contents/` | Table of contents | Redirect to home (reading plan) |
| `/blog/label/christmastower/` | Label index | Redirect to home |
| `/blog/chapter1-page1/` | Ch 1: Before Jacob was, I Am | Redirect to `/read/prologue/` |
| `/blog/chapter1-page2/` | Ch 1: Jacob buries Rachel and names Benjamin | Redirect to `/read/01/` |
| `/blog/chapter1-page3/` | Ch 1: Israel and the tower of Migdal Eder | Redirect to `/read/01/` |
| `/blog/chapter2-page1/` to `chapter2-page3/` | Ruth | Redirect to `/read/02/` |
| `/blog/chapter3-page1/`, `chapter3-page2/` | David | Redirect to `/read/03/` |
| `/blog/chapter3-page4/` | For the kids | Redirect to home |
| `/blog/kids/` | Dead link in the old epilogue and TOC | Redirect to home |
| `/blog/chapter4-page1/` | Sacred shepherds raise spotless lambs | Redirect to `/read/04/` |
| `/blog/chapter4-page2/` | The Promised One | Redirect to `/read/05/` |
| `/blog/chapter5-page1/` | The census, road to Bethlehem | Redirect to `/read/05/` |
| `/blog/chapter6-page1/` | Turned away in Bethlehem | Redirect to `/read/06/` |
| `/blog/chapter6-page2/` | The birth inside the tower | Redirect to `/read/07/` |
| `/blog/chapter7-page1/`, `chapter7-page2/` | Shepherds and angels | Redirect to `/read/08/` |
| `/blog/chapter8-page1/`, `chapter8-page2/` | Shepherds run to the tower | Redirect to `/read/09/` |
| `/blog/chapter9-page1/`, `chapter9-page2/` | Jesus and the leper, the Good Shepherd | Redirect to `/read/10/` |
| `/blog/epilogue/` | Epilogue | Redirect to `/read/epilogue/` |
| `/blog/adults/` | For the adults | Redirect to `/read/for-the-adults/` |
| `/blog/coloring/` | Coloring page | Redirect to home (no v11 equivalent) |
| `/sitemap-index.xml` | Astro sitemap | Replaced by `/sitemap.xml` |
| `/images/*.webp`, `/videos/*.mp4` | Media | No longer served at these paths (see below) |

The map lives in `content/redirects.json`. Each entry becomes a small page with `<meta http-equiv="refresh">`, a canonical link, `noindex`, and a visible "Continue to ..." link. Old chapters were matched to v11 chapters by story content, since the old book had nine chapters split across several pages each. Edit `content/redirects.json` if any mapping should change.

Per Dave, the printed book, the KDP listing, and any QR codes may point to `/blog/` or `/about/`. Both resolve.

## Media

- `public/images/` moved to `assets/art/` and `public/videos/` moved to `assets/video/`, with history kept (`git mv`).
- Illustrations in use through `content/art.json`: `MaryJoseph.webp` (Chapter 5), `MaryJosephinn.webp` (Chapter 6), `MaryJosepbaby.webp` (Chapter 7), `NightTower.webp` (interlude), `JesusLeper.webp` (Chapter 10).
- Kept but unused: `TowerFlockSunrise.webp` (403px), `JesusFace.webp` (345px), `JesusSaint.webp` (358px), `JesusKidsSheep.webp` (358px), `ColoringCover.webp`, `TheChristmasTowerD2D.webp` (the cover, also the source of `assets/og.jpg`), and `MaryJoseph.png`. The small ones are below the size a header slot needs.
- The 14 videos (43 MB) stay in `assets/video/` and are not published yet. The build copies only the art that `art.json` references.

## Removed in the `v11-site` branch

The Astro sources (`src/`, `astro.config.mjs`, `tsconfig.json`), the old workflow `astro.yml`, `package.json`/`package-lock.json`, `.npmrc`, `sandbox.config.json`, `.stackblitzrc`, the Astro VS Code configuration, `public/robots.txt` (it pointed at another project), and `public/favicon.ico` (replaced by `assets/favicon.svg`). Dave is removing `staging/` separately.
