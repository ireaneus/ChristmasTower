# The Christmas Tower Website: Build Brief for Claude Code

## Goal

Replace the existing GitHub Pages site for the original *The Christmas Tower* with a new website for the v11 rewrite, so family and friends can read it together, on phones, tablets, and computers, across two evenings.

Success means a grandparent can open the site on a tablet, tap "Read together tonight," and read Evening One aloud without fighting the layout.

## Ground rules

- **Manuscript text is locked.** Reproduce every word of the story, Scripture, and author notes exactly as written. Fix nothing in the prose. If you spot a problem (typo, stray character, odd markup), list it in `MANUSCRIPT_FLAGS.md` for Dave to decide.
- **Single source of truth.** The manuscript markdown file in `content/` is the source. A build script turns it into the site. Hand-editing generated HTML is off limits.
- **Copy you write** (buttons, labels, page titles, alt text) follows two house rules: no em dashes, and state things affirmatively (avoid sentences that define something by first saying what it is not).
- **No frameworks.** Plain HTML, CSS, and a small amount of vanilla JavaScript in the output. The build script may use Node with a markdown parser (`markdown-it`) and nothing heavier.
- **Nothing loads from third parties at runtime** except Google Fonts.
- Ask Dave before any step that deletes history, force-pushes, or changes repo settings.

## Step 1: Preserve the old site

1. Confirm the repo is clean (`git status`).
2. Tag the current state: `git tag original-site` then `git push origin original-site`. The original site stays recoverable forever.
3. Record in `MIGRATION_NOTES.md`:
    - The current Pages source (Settings, Pages: "Deploy from a branch" or "GitHub Actions"), which Dave checks and tells you.
    - Whether a `CNAME` file exists. If it does, keep it in the published output.
    - Every URL path the old site serves. Any path that may appear in the printed book, the KDP listing, or a QR code gets a redirect stub (a small HTML page with `<meta http-equiv="refresh">` and a visible link) pointing to the matching new page, or to the home page.
4. Remove the old site files in one commit on a branch named `v11-site`.

## Step 2: Project layout

```text
content/
  christmas-tower-v11.md      # copied from ~/Public/christmastower-projectfiles (Dave supplies the current file)
  art.json                    # art manifest (see Step 5)
  asides.json                 # second-voice overrides (see Step 4)
assets/
  art/                        # WebP illustrations, added over time
  ornaments/                  # SVG dividers and icons
src/
  build.mjs                   # the build script
  templates/                  # HTML partials: layout, home, chapter
  styles.css
  site.js                     # theme toggle, continue-reading
.github/workflows/pages.yml
package.json
_site/                        # build output, gitignored
```

## Step 3: Pages to generate

| Path | Content |
| --- | --- |
| `/` | Home: hero, two-evening reading plan, two-voices explainer, link to Amazon |
| `/read/prologue/` | Prologue: The Tower Speaks |
| `/read/01/` to `/read/11/` | One page per chapter |
| `/read/interlude/` | Full-page illustration between Chapters 7 and 8, with an "End of Evening One" message and a link to start Evening Two |
| `/read/epilogue/` | Epilogue: The One Who Gives the Names |
| `/read/for-the-adults/` | For the Adults, including the gospel verses |
| `/about/` | Dedication and A Personal Note from the Author |
| `/404.html` | Friendly not-found page linking home |

Evening One is the Prologue through Chapter 7. Evening Two is Chapter 8 through the Epilogue, followed by For the Adults. Compute read-aloud minutes per evening from word count at 150 words per minute and show them on the home page.

Every chapter page has: evening label and chapter number, chapter title, a header illustration slot, the chapter body, and previous/next links at the bottom. The next link on Chapter 7 goes to the interlude.

## Step 4: Manuscript parsing rules

The manuscript uses consistent markdown. Map it like this:

| Manuscript pattern | Render as |
| --- | --- |
| `## Prologue: ...`, `## Chapter N: ...`, `## Epilogue: ...`, `## For the Adults` | Page boundary and page title |
| `## Dedication`, `## A Personal Note from the Author` | Content for `/about/` |
| Blockquote whose first line is `**Reference (ESV)**` | Scripture card (second voice), labeled "Second voice · Reference (ESV)" |
| Blockquote with no reference line | Second-voice quote without a label; list each one in `MANUSCRIPT_FLAGS.md` |
| Paragraph that is bold from start to finish | Payoff line in the display face, larger size |
| Paragraph or bullet list that is italic from start to finish | Second-voice aside (see below) |
| `---` | Section break ornament (a small gold star divider), or nothing when it sits directly beside a Scripture card |
| `#### *Full-Page Illustration: ...*` plus the italic paragraph after it | The interlude page: art slot, with the description used as alt text until art exists |
| Regular paragraphs | Tower voice body text |

**Exclude from the site:** the "Working manuscript vN.N" line under the author, and the entire `## Version History` section.

**Normalize** escaped quotes (`\"`) to real curly quotes (“ ”). This counts as display cleanup; the words stay the same.

**Second-voice asides.** Italic paragraphs mostly speak to the children (questions, "Did you notice..."). A few are the Tower's own emphasis (for example "*Same little boy, two names.*", "*The Christmas Tower.*", "*Something has come.*"). Handle this in three steps:

1. Default: an italic paragraph ending in `?`, or an italic bullet list, renders as a **"Talk about it"** card. Any other italic paragraph renders as italic Tower-voice text.
2. `content/asides.json` lets Dave override any paragraph by its first few words: `{"Same little boy": "tower", "Micah was talking about": "aside"}`.
3. Generate `ASIDES_REVIEW.md` listing every italic paragraph, its chapter, and how you classified it, so Dave can check them in one pass.

## Step 5: Art

`content/art.json` maps each page to its illustration:

```json
{
  "home-hero": { "file": "hero.webp", "alt": "The stone tower at night above the shepherds' fields" },
  "ch08": { "file": "ch08.webp", "alt": "An angel standing in the field, the tower lit on the hill" },
  "interlude": { "file": "interlude.webp", "alt": "" }
}
```

When an entry or its file is missing, render a styled placeholder box with the alt text as a caption. The site must look finished with zero art. Until real hero art exists, draw the home hero as an inline SVG: a starry night sky, layered hills, a round stone tower with a battlement top and a glowing gold doorway, and a few sheep. Keep the hero a night scene in both themes.

Images: `loading="lazy"` below the fold, explicit `width` and `height`, WebP. Target 1600px wide and under 300 KB.

## Step 6: Design system

The approved direction combines the Night Watch look with the Family Read-Aloud layout. `design-reference/Family.dc.html` shows the approved layout. It is written in a design-canvas format, so use it as a visual reference only and rebuild it in plain HTML and CSS.

### Fonts

- Display: Cormorant Garamond, weights 600 and 700, plus italic 500/600
- Body: Source Serif 4, weights 400, 600, 700, plus italic 400
- Load both from Google Fonts with `display=swap`

### Type scale (desktop, reduce roughly 20% under 640px)

| Role | Size | Notes |
| --- | --- | --- |
| Site title in hero | 92px | Display 700, line-height 0.95 |
| Chapter title | 62px | Display 700 |
| Section heading | 44px | Display 700 |
| Payoff line | 36px | Display 700 |
| Scripture text | 29px | Display italic 600, line-height 1.45 |
| Body | 22px | Body 400, line-height 1.75, measure about 760px |
| Labels | 16 to 17px | Body 700 |

### Color tokens

Define these as CSS custom properties on `:root[data-theme="dark"]` and `:root[data-theme="light"]`.

| Token | Dark | Light |
| --- | --- | --- |
| `--bg` | #0B1426 | #FBF6EC |
| `--surface` | #121F38 | #FFFFFF |
| `--border` | #24324F | #EADFC6 |
| `--text` | #E8E2D0 | #262A33 |
| `--muted` | #B4BCCB | #5A5F6B |
| `--heading` | #F4EEDC | #22335A |
| `--accent-text` | #E3B04B | #8A6516 |
| `--chip-bg` | #1E2C48 | #F1E7CF |
| `--chip-text` | #E8E2D0 | #22335A |
| `--scripture-bg` | #101B31 | #22335A |
| `--scripture-text` | #F1E6C8 | #FBF6EC |
| `--scripture-rule` | #E3B04B | #E3B04B |
| `--placeholder-border` | #3A4A6B | #CDBB93 |
| `--placeholder-bg` | #101B31 | #F5EDDB |
| `--placeholder-text` | #8E99B0 | #7A6A48 |

Fixed in both themes: gold `#E3B04B` for the primary button (text `#1A1406`) and the Scripture reference label.

### Components

- **Top bar:** site title left; Reading plan, Two voices, For grown-ups, and the theme button right.
- **Theme button:** a real `<button>` labeled "Light" with a sun icon in dark mode, "Dark" with a moon icon in light mode, and an `aria-label` naming the action.
- **Reading plan:** two cards (Evening one, Evening two) with minutes, a heading, and chapter rows with round number chips. Rows are at least 44px tall.
- **Two voices strip:** a "The Tower speaks" chip, a "Second voice: Scripture and questions" chip, and the line "Give the second voice a different sound, and the children will follow the whole book."
- **Scripture card:** rounded 20px, gold rules top and bottom, reference label in gold, verse in display italic.
- **Talk about it card:** surface background, border, gold "Talk about it" label.
- **Footer:** "Written by David Haines." plus the ESV notice (below) and a link to the Amazon edition. Dave supplies the URL; leave `[KDP LINK]` as a visible TODO until then.

### Theme behavior

1. On first visit, follow `prefers-color-scheme`.
2. When the reader presses the button, save the choice in `localStorage` (wrapped in try/catch) and apply it on every page.
3. Apply the theme from an inline script in `<head>` before first paint, so pages never flash the wrong theme.

### Continue reading

Store the last chapter opened in `localStorage`. On the home page, show a "Continue with Chapter N" button when one exists.

## Step 7: Quality bar

- Responsive from 360px to 1440px. On phones, the reading plan stacks, and the hero text sits above the tower illustration.
- Text contrast at least 4.5:1 in both themes. Verify with a script that computes it from the tokens.
- Semantic HTML: one `<h1>` per page, landmarks, a skip link, alt text on every image.
- Each page has a `<title>`, meta description, and Open Graph tags (title, description, image) so shared links preview nicely in texts and on Facebook.
- Lighthouse scores of 95 or higher for Performance, Accessibility, and Best Practices on the home page and Chapter 8.
- ESV notice on `/about/` and in the footer: "Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved."

## Step 8: Deployment

Switch Pages to deploy through GitHub Actions (Dave changes Settings, Pages, Source to "GitHub Actions"). Workflow `.github/workflows/pages.yml`:

```yaml
name: Deploy site
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - run: npm run check
      - uses: actions/upload-pages-artifact@v3
        with:
          path: _site
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Check the current major versions of these actions before committing and update them if newer ones exist.

## Step 9: Verification (`npm run check`)

The check script fails the build when any of these fail:

1. Scripture card count on the site equals the count of `(ESV)` reference lines in the manuscript, excluding Version History.
2. Every chapter heading in the manuscript has a page, and prev/next links form one unbroken chain from Prologue to For the Adults.
3. No output page contains "Version History" or "Working manuscript".
4. Word count of all story text on the site equals the manuscript's word count for the same sections (proves nothing was dropped).
5. Every internal link resolves.

Then preview locally (`npx serve _site` or `python3 -m http.server -d _site`) and show Dave the home page and Chapter 8 in both themes at phone and desktop widths before merging `v11-site` into `main`.

## Deliverables checklist

- [ ] `original-site` tag pushed
- [ ] `MIGRATION_NOTES.md` with old paths and redirects
- [ ] Site builds from `content/christmas-tower-v11.md` with one command
- [ ] `ASIDES_REVIEW.md` and `MANUSCRIPT_FLAGS.md` for Dave
- [ ] `npm run check` passes
- [ ] Workflow deployed and live
- [ ] A short `CLAUDE.md` at the repo root recording the conventions above (manuscript is locked, build from source, house copy rules) for future sessions
