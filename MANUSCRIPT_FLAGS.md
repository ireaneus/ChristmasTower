# Manuscript flags

Things noticed in `content/christmas-tower-v11.md` (v11.3) while building the site. **Nothing here has been changed.** The site reproduces the manuscript exactly. Each item is for Dave to accept or fix in the manuscript; the site picks up any fix on the next build.

Line numbers refer to the manuscript file as of 28 Sep 2026.

## Blockquotes without a reference line

The site renders these as an unlabeled second-voice quote (gold rule on the left, no "Second voice · Reference" label).

| Line | Chapter | Text | Note |
| --- | --- | --- | --- |
| 49 | Prologue | *"And you, O tower of the flock..."* | The voice in the storm, echoing Micah 4:8. Rendering it unlabeled feels right, since it is part of the Tower's vision. |
| 238–239 | Chapter 5 | *And you tower of the flock.. A loud voice called out in the night, waking the Tower from it's slumber.* | Starts with an empty `>` line. Also see the typos below. Reads as narration (third person, "the Tower") inside a first-person chapter. |

## Likely typos

| Line | Chapter | Text | Suggestion |
| --- | --- | --- | --- |
| 239 | Chapter 5 | "flock.. A loud voice" | One period, or an ellipsis ("flock..."). |
| 239 | Chapter 5 | "from it's slumber" | "its" |
| 239 | Chapter 5 | "And you tower of the flock" | Micah 4:8 has "And you, O tower of the flock". Intentional paraphrase? |
| 226 | Chapter 5 | "alone.  He had put" | Double space (invisible on the site, which collapses spaces). |
| 190 | Chapter 3 | "...he came back to the field a shepherd king" | No closing period. Also a comma splice ("from that day on, he came back"). |
| 275 | Chapter 6 | "The world had no room, The Master Stonemason made room anyway" | Capital "The" after a comma. |
| 291 | Chapter 7 | "The same cloths, The same manger, I held a thousand" | Capital "The" after a comma. |
| 389 | Chapter 9 | "How many names were given to the baby?, can you name them all?" | "?," reads oddly. Perhaps "How many names were given to the baby? Can you name them all?" |
| 489 | Chapter 11 | "strong sturdy, steadfast" | Missing comma: "strong, sturdy, steadfast". |
| 94 | Chapter 1 | "heavenly books that have our names written in it" | "books ... in them", or "a heavenly book ... in it". |
| 41 | Prologue | "This same tower pictures God, in that we can run to Him and He will provide you safety." | Person shifts from "we" to "you". |
| 41 | Prologue | "Micah was talking about Migdal Eder, the Bible actually records this very special tower." | Comma splice. |
| 23 | Prologue | "My foundation was laid so long ago, that it feels" | Comma before "that" is optional; flagging only. |

## Voice and consistency

| Line | Chapter | Note |
| --- | --- | --- |
| 245 | Chapter 5 | *"The Tower did not rest that night. Something in its stones had come awake when that man looked at him..."* Third person ("The Tower", "its stones") in a first-person chapter, and "looked at him" refers to the Tower (probably "at it" or "at me"). The site currently renders it as italic Tower-voice text. |
| 337 | Chapter 8 | *"swaddling cloths, and a manger!"* starts lowercase. The approved design mock capitalized it ("Swaddling"). The site keeps the manuscript's lowercase. |
| 533 | Epilogue | *"The Narrator speaks. These pages carry a different voice."* This reads like a production note for the graphic novel. The site shows it as italic text at the top of the Epilogue. Keep, cut, or restyle? |
| 7 / 667 | Front matter | The version line says v11.3; the newest Version History entry is v11.3.1. Neither appears on the site. |

## Em dashes in the manuscript

The v11.3.1 note says "no em dashes found", but four remain. They appear on the site as written.

| Line | Where |
| --- | --- |
| 13 | Dedication: "To my beloved wife — she has always loved me the mostestes." |
| 317 | Full-page illustration description (used as the interlude art description; not visible while the old NightTower art fills the slot) |
| 645 | For the Adults signature: "— David Haines" |
| 657 | Personal Note signature: "— David Haines, Author of *The Christmas Tower*" |

## Display cleanup applied (words unchanged)

- Escaped quotes (`\"`) become curly quotes, and straight apostrophes become curly apostrophes.
- Each horizontal rule (`---`) is a page break: the site starts a new page there. Two rules together (Chapter 7, lines 311–313) or a rule at the start or end of a section never make an empty page. A gold star divider marks the end of each chapter.
- The "Working manuscript" line and the Version History section are left out.
