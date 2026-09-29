# The Christmas Tower

*A Story of Migdal Eder, the Tower of the Flock*, by David Haines.

An old stone tower on a hill above Bethlehem tells how it held the lambs, then held the Lamb, and was given a new name. The site is set up for families to read the book aloud together across two evenings.

**Read it:** <https://ireaneus.github.io/ChristmasTower/>

This README explains how the website is built and walks through the changes you are most likely to make.

- [Quick start](#quick-start)
- [How the site works](#how-the-site-works)
- [Where everything lives](#where-everything-lives)
- [Tutorial: common changes](#tutorial-common-changes)
- [Adding and updating art](#adding-and-updating-art)
- [Checking your work](#checking-your-work)
- [Publishing](#publishing)
- [Troubleshooting](#troubleshooting)

## Quick start

You need [Node.js](https://nodejs.org/) 20 or newer and Python 3 (for the preview server).

```sh
npm ci            # install the one dependency (markdown-it), first time only
npm run preview   # build the site and serve it at http://localhost:8080
```

Open <http://localhost:8080/> in a browser. After you change a file, stop the server with **Ctrl+C**, run `npm run preview` again, and reload the page.

## How the site works

The whole website is generated from one file: the manuscript, `content/christmas-tower-v11.md`. You never edit web pages by hand. You edit the manuscript, the templates, or the settings files, then a build script produces the finished pages.

```text
content/christmas-tower-v11.md ─┐
content/art.json               ─┤
content/asides.json            ─┼─►  src/build.mjs  ─►  _site/  ─►  GitHub Pages
content/redirects.json         ─┤    (npm run build)    (the finished website)
src/templates/, styles.css     ─┘
```

### From manuscript to pages

The build script reads the manuscript and turns each part into web pages:

| In the manuscript | On the website |
| --- | --- |
| `## Prologue: ...`, `## Chapter N: ...`, `## Epilogue: ...`, `## For the Adults` | A section of the book, with its title |
| `---` | A page break. Each section is split into pages at every `---`. |
| `## Dedication`, `## A Personal Note from the Author` | The About page |
| A blockquote that starts with `**Reference (ESV)**` | A Scripture card labeled "Narrator voice · Reference (ESV)" |
| A paragraph that is all **bold** | A large "payoff" line |
| An italic paragraph ending in `?`, or an italic bullet list | A "Talk about it" card |
| Any other italic paragraph | Italic text in the Tower's voice |
| `#### *Full-Page Illustration: ...*` | The "End of Evening One" page between Chapters 7 and 8 |
| `## Version History` and the "Working manuscript" line | Left out of the website |

### The pages it makes

| Address | Page |
| --- | --- |
| `/` | Home: hero, reading plan, two voices, Amazon link |
| `/read/prologue/` | Prologue, page 1 |
| `/read/01/` to `/read/11/` | Chapters 1 to 11, page 1 |
| `/read/08/2/`, `/read/08/3/`, ... | Later pages of a chapter |
| `/read/interlude/` | End of Evening One |
| `/read/epilogue/`, `/read/for-the-adults/` | Epilogue and For the Adults |
| `/about/` | Dedication, Personal Note, Scripture notice |
| `/blog/...` | Small forwarding pages that send the old site's links to the new pages |
| `/404.html` | Shown for any address that does not exist |

The live site sits under `/ChristmasTower/`, so Chapter 8 is at `https://ireaneus.github.io/ChristmasTower/read/08/`. The local preview drops that prefix, so the same page is at `http://localhost:8080/read/08/`.

### Reading on the site

- **Previous and Next** at the bottom of each page turn one page. On the last page of a chapter, Next goes to the next chapter.
- The **left and right arrow keys** and a **sideways swipe** on a phone or tablet also turn pages.
- The **Light / Dark** button switches themes. The first visit follows the device's setting; after that the choice is remembered.
- The home page shows **Continue with Chapter N, page M** for readers who have already started.
- **Reading times** on the home page are calculated from word count at 150 words per minute.

## Where everything lives

```text
content/
  christmas-tower-v11.md   the manuscript (the source of all story text)
  art.json                 which illustration goes on which page
  asides.json              overrides for italic paragraphs (card or Tower voice)
  redirects.json           old site addresses and where they now point
assets/
  art/                     illustrations (WebP)
  video/                   videos from the original site (not published yet)
  ornaments/               star divider, sun and moon icons (SVG)
  favicon.svg              browser tab icon
  og.jpg                   picture shown when a link is shared by text or on Facebook
src/
  build.mjs                the build script
  check.mjs                the verification script
  contrast.mjs             color contrast calculator
  styles.css               all colors, fonts, sizes, and layout
  site.js                  theme button, page turning, continue reading
  templates/
    layout.html            the frame around every page: top bar, footer, <head>
    home.html              home page
    evening.html           one reading-plan card on the home page
    chapter.html           a reading page
    interlude.html         End of Evening One
    about.html             About page
    notfound.html          404 page
    redirect.html          forwarding page for old addresses
    hero.svg               the drawn tower scene on the home page
.github/workflows/pages.yml  builds, checks, and publishes the site on every push to main
_site/                       the finished website (generated; never edit)
```

Generated for you on every build (safe to read, pointless to edit):

- `ART_PAGES.md`: every page's art key, first words, and current art
- `ASIDES_REVIEW.md`: every italic paragraph and how it is shown

Notes for you to review:

- `MANUSCRIPT_FLAGS.md`: possible typos and questions about the manuscript
- `MIGRATION_NOTES.md`: how the old site's addresses map to the new pages

## Tutorial: common changes

Each of these follows the same loop: **edit the file, run `npm run preview`, reload the browser, then run `npm run check`** before you publish.

### 1. Change the story text

Edit `content/christmas-tower-v11.md`. Everything on the reading pages comes from it, including chapter titles (from the `## Chapter N: Title` lines) and the reading plan on the home page.

- To add a page break, put `---` on a line by itself, with a blank line above and below.
- To remove a page break, delete that `---` line.
- Two `---` lines in a row never make an empty page.

### 2. Change words on the home page

Edit `src/templates/home.html`. It holds the hero text, the "Read together tonight" button, the two-voices strip, and the Amazon section.

Anything inside `{{double braces}}` is filled in by the build script, so leave those in place. For example, `{{subtitle}}` becomes "A Story of Migdal Eder, the Tower of the Flock" from the manuscript.

The two reading-plan headings, "The tower receives its name" and "Heaven breaks in", are in `src/build.mjs` (search for "Heaven breaks in").

### 3. Change the top bar or footer

Edit `src/templates/layout.html`. It is shared by every page. The menu links (Reading plan, Two voices, For grown-ups) and the footer text live here.

### 4. Change colors, fonts, or sizes

Edit `src/styles.css`.

- **Colors** are near the top, in two blocks: `:root[data-theme="dark"]` and `:root[data-theme="light"]`. Change a value such as `--accent-text: #8A6516;` and every place that uses it updates.
- **Text sizes** are the `--fs-...` values at the top, with smaller phone sizes in the `@media (max-width: 640px)` block just below.
- **Fonts** are the `--display` (titles) and `--body` (reading text) values. The fonts load from Google Fonts in `src/templates/layout.html`.

After changing colors, run `npm run contrast` to see whether every text color is still easy to read (4.5:1 or better).

### 5. Decide which italic paragraphs become "Talk about it" cards

Open `ASIDES_REVIEW.md` to see how each italic paragraph is shown. To change one, add its opening words to `content/asides.json`:

```json
{
  "Same little boy": "tower",
  "Micah was talking about": "aside"
}
```

`"aside"` makes a Talk about it card. `"tower"` makes italic text in the Tower's voice. A few opening words are enough, as long as they are unique.

### 6. Change the Amazon link or the Scripture notice

Both are near the top of `src/build.mjs`: `KDP_URL` and `ESV_NOTICE`.

### 7. Point an old address somewhere else

Edit `content/redirects.json`. Each line maps an old address to a new page:

```json
"blog/chapter4-page2/": "read/05/"
```

An empty target (`""`) sends visitors to the home page.

## Adding and updating art

Illustrations live in `assets/art/`. The file `content/art.json` decides which one appears on which page.

### Step 1: Prepare the image

- Save it as **WebP**. The build accepts only `.webp` files.
- Aim for about **1600 pixels wide** and **under 300 KB**.
- To convert with ImageMagick:

  ```sh
  magick my-picture.png -resize 1600x -quality 80 assets/art/ch08-angels.webp
  ```

### Step 2: Find the page's key

Open `ART_PAGES.md`. It lists every page with its key and first words, so you can find the right page.

| Key | Page |
| --- | --- |
| `home-hero` | The large picture at the top of the home page |
| `prologue`, `ch01` ... `ch11`, `epilogue`, `for-the-adults` | The first page of that section |
| `ch08-2`, `ch08-3`, `prologue-3`, `for-the-adults-2`, ... | A later page of that section |
| `interlude` | The End of Evening One page |

### Step 3: Add or change the entry in `content/art.json`

```json
"ch08-2": { "file": "ch08-angels.webp", "alt": "A great company of angels filling the sky above the fields" }
```

- `file` is the file name inside `assets/art/`.
- `alt` describes the picture for readers who cannot see it and for screen readers. Describe what is in the picture. House style: no em dashes.
- Every entry except the last ends with a comma.

### Step 4: Preview it

Run `npm run preview` and open the page. The build works out the image's width and height by itself.

### How art behaves

- **The first page of each section** always has an art slot. Until its file exists, it shows a styled placeholder with the `alt` text as a caption, so the site looks finished before the art is done.
- **Later pages** show art only when `art.json` has an entry for them. Pages without an entry stay plain text.
- Art appears at the top of the page, under the heading.
- **Tall (portrait) pictures** are centered at a comfortable height instead of stretched across the page.
- **The home hero** shows the drawn tower scene (`src/templates/hero.svg`) until the `home-hero` file exists. Its title text sits on top of the picture, so a dark night image reads best.
- Only images named in `art.json` are published. Other files in `assets/art/` stay in the repository.
- A key that matches no page stops the build with a message, for example: `content/art.json has keys that match no page: ch8-2`. Check `ART_PAGES.md` for the right spelling (`ch08-2`).

### Replacing or removing art

- **Replace:** save the new file over the old one with the same name, or change `file` to the new name.
- **Remove from a later page:** delete its line from `art.json`.
- **Return a first page to the placeholder:** point `file` at a name that does not exist yet, such as `ch08.webp`.

## Checking your work

```sh
npm run build   # build the site for the live address (/ChristmasTower/)
npm run check   # verify it
```

The check confirms that:

1. Every Scripture reference in the manuscript appears as a Scripture card (37 today).
2. Every section has all of its pages, and Previous/Next links form one unbroken chain from the Prologue to For the Adults.
3. No "Version History" or "Working manuscript" text reached the website.
4. The words on the website match the manuscript word for word, so nothing was dropped or added.
5. Every link inside the site leads to a real page.

It also checks that every page has one main heading, alt text on every image, a title and description for link previews, and readable color contrast in both themes.

The check compares the website against the manuscript. It cannot tell whether a change to the manuscript itself was intended, so review your manuscript edits before publishing.

## Publishing

The site publishes itself through GitHub Actions whenever changes reach the `main` branch:

```sh
npm run build && npm run check   # make sure everything passes first
git add -A
git commit -m "Describe what you changed"
git push origin main
```

GitHub then builds the site, runs the check, and publishes it, usually within a minute or two. Watch progress on the repository's **Actions** tab. If the check fails there, nothing is published and the live site stays as it was.

If your browser still shows the old version afterwards, do a hard refresh (**Ctrl+Shift+R**).

## Troubleshooting

| Message or symptom | What it means |
| --- | --- |
| `content/art.json has keys that match no page` | A key is misspelled. Compare it with `ART_PAGES.md`. |
| `art.json "..." must point to a .webp file` | Convert the image to WebP (see Step 1 above). |
| A page shows the placeholder instead of the picture | The file name in `art.json` does not match a file in `assets/art/`. Names are case sensitive. |
| `Unexpected token` in `art.json` or `asides.json` | A missing or extra comma, or a missing quote mark. |
| `Unrecognized section heading` | A `##` heading in the manuscript is not one the site knows. Use the patterns in [From manuscript to pages](#from-manuscript-to-pages). |
| `Chapter 8: word 205 differs` | Something changed the text between the manuscript and the website. The message shows the manuscript's words and the site's words at the first difference. |
| Changes do not appear in the preview | Stop the server (Ctrl+C) and run `npm run preview` again. |
| Links break in the preview | Run `npm run preview`, which builds for the preview address. `npm run build` builds for the live address. |

## Background

- `CLAUDE.md` records the project rules: the manuscript is locked to its author, the site is always built from source, and copy follows the house style.
- `SITE_BRIEF.md` is the original specification.
- The original site is preserved at the git tag `original-site` (`git checkout original-site` to see it).

Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.
