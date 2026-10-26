# MTG Artist Gallery — Backlog

## Status legend

- [ ] Todo
- [~] In progress
- [x] Done
- [!] Blocked
- [w] Won’t do

---

# P0 — Core

## ART-001 — Query parameter routing

Status: [x]

Use query parameters instead of server-side paths.

Requirements:

- [x] Artist URL uses `?artist=`
- [x] Set URL uses `?set=`
- [x] Home URL has no parameters
- [x] Browser back/forward works
- [w] Direct URLs work in MAMP
- [w] Direct URLs work on static hosting
- [x] Remove dependency on `.htaccess`

## ART-002 — Subtle fade in animation to grid

Status: [ ] Todo

- [ ] There's an animation when the grid images appear to user

## ART-003 — Fixed navigation header

Status: [x] Done

### Goal
Keep navigation accessible without wasting screen space:

- Header is fixed at the top.
- Header hides while scrolling down.
- Header reappears when scrolling up.

### Acceptance criteria

- [x] Header uses fixed positioning at top of viewport on all pages/views.
- [x] Main content starts below header (no overlap with first row/content).
- [x] On downward scroll past a small threshold, header slides out of view.
- [x] On upward scroll past a small threshold, header slides back into view.
- [x] At page top (`scrollY <= 0`), header is always visible.
- [x] No flicker/jitter during slow scroll or tiny scroll deltas.
- [x] Behavior works on desktop and mobile widths.
- [x] Transitions are smooth and subtle (no abrupt jump).

### Suggested implementation notes (non-binding)

- Track:
  - `lastScrollY`
  - `isHeaderHidden`
- Use thresholds to prevent jitter:
  - `HIDE_THRESHOLD` (e.g. 12px)
  - `SHOW_THRESHOLD` (e.g. 8px)
- Add body/content top padding equal to header height.
- Toggle a class such as:
  - `.site-header--hidden` => `transform: translateY(-100%)`
- Use CSS transition:
  - `transition: transform 180ms ease`
- Respect reduced motion:
  - Disable/shorten transition under `prefers-reduced-motion`.

### Manual test checklist

- [x] Load home view: header visible, content not under header.
- [x] Scroll down slowly: header hides once threshold exceeded.
- [x] Scroll up slightly: header reappears once threshold exceeded.
- [x] Jump to top: header visible.
- [x] Navigate between `?artist=` and `?set=` views: behavior preserved.
- [x] Mobile viewport test (DevTools): same behavior, no overlap.

### Definition of done

- [x] All acceptance criteria checked.
- [x] No regressions in routing/navigation.
- [x] Mark task status to `[x] Done`.

---

## ART-004 — Artist info links

Status: [ ] Todo

### Goal
Let users follow an artist to suitable external channels from the artist info modal.

### Spec
- [ ] Each artist may have an optional `links` object (from ART-008), e.g. `website`, `wikipedia`, `instagram`, `twitter`/`x`, `bluesky`, `artstation`, `facebook`, `youtube`, `patreon`, `store`.
- [ ] Artist info modal (`renderArtistInfo`) renders a "Links" list; only links present in data are shown, with readable labels.
- [ ] Links open in a new tab with `rel="noopener noreferrer"`.
- [ ] Only `https://` URLs are rendered; values are escaped.
- [ ] Artists without links show no empty "Links" section.
- [ ] Links are touch-friendly (min ~44px tap target) on mobile.
- [ ] Data comes from `data/artist-links.json` (see ART-008); no live API calls; missing data must not break the page.

## ART-005 — Artwork modal scrolls with long content

Status: [ ] Todo

### Spec
- [ ] Modal content is capped to the viewport height (use `dvh` with `vh` fallback) and scrolls vertically when content exceeds it.
- [ ] Close control stays reachable while scrolling (sticky or outside the scroll area).
- [ ] Page behind does not scroll while the modal is open (scroll lock, restored on close).
- [ ] Scroll position resets to top when a different artwork is opened.
- [ ] Use `overscroll-behavior: contain`.
- [ ] Works on desktop and mobile widths.

## ART-006 — Collapsible reprints in artwork modal

Status: [ ] Todo

### Spec
- [ ] Reprints list is hidden by default in the artwork modal.
- [ ] A "Show reprints (N)" button reveals the list; it toggles to "Hide reprints".
- [ ] Button is a real `<button>` with `aria-expanded` and `aria-controls`.
- [ ] State resets to collapsed whenever a new artwork opens.
- [ ] If an artwork has no reprints, the button is not shown.
- [ ] Existing reprint links (set navigation) keep working.
- [ ] Depends on ART-005 for scrolling of the expanded list.

## ART-007 — Mobile-optimized artwork modal

Status: [ ] Todo

### Spec
- [ ] On narrow screens (<= 600px) the modal uses (near) full width/height with safe-area padding.
- [ ] Artwork image fits the width without horizontal scroll; info is stacked below it.
- [ ] Text sizes and buttons are readable and have touch targets of ~44px.
- [ ] Close button is large and easy to reach.
- [ ] Works in portrait and landscape.
- [ ] Verify at 360px, 390px and 768px widths.
- [ ] Depends on ART-005 and ART-006.

## ART-008 — Artist links data file

Status: [~] In progress

### Goal
Provide the data that ART-004 renders. The generated artist data has no links, and `tools/update_data.py` rewrites `data/artists/` on every run, so links must live outside the generated output.

### Spec
- [x] Add a hand-maintained `data/artist-links.json`, keyed by artist slug, e.g. `{ "artist-slug": { "website": "https://...", "wikipedia": "https://..." } }`.
- [x] Allowed keys: `website`, `wikipedia`, `instagram`, `twitter`, `bluesky`, `artstation`, `facebook`, `youtube`, `patreon`, `store`. Values are `https://` URLs.
- [x] The file is not generated or overwritten by `tools/update_data.py`.
- [x] The app loads it once at startup (static fetch) and merges it into the artist info by slug. A missing or invalid file must not break the app.
- [ ] Seed with a small set of well-known artists (verified URLs only) and add a way to validate the file (keys, `https://`, slugs exist in `artists.json`), e.g. `python tools/validate_links.py`.
- [x] Document the format and how to add links in `tools/README.md` and `ARCHITECTURE.md`.
- [ ] Blocks ART-004.

## ART-009 — About page

Status: [~] In progress

### Goal
Add a text-only "About" page explaining the purpose of the gallery.

### Spec
- [ ] Add an "About" link to the header navigation.
- [ ] Route uses query parameters: `/?page=about` (no server-side routing, no `.htaccess`); navigation via `history.pushState()` and `popstate`, so back/forward works.
- [ ] Direct load of `/?page=about` shows the page; home, `?artist=` and `?set=` keep working.
- [ ] Page is static text in the existing layout (no new framework, no API requests), content below the fixed header (ART-003).
- [ ] Readable on mobile and desktop (comfortable line length, responsive font sizes).
- [ ] Semantic structure: one `<h1>`, `<h2>` for sections.
- [ ] Set the document title to "About — MTG Artist Gallery" and restore it on leaving.

### Content

# About MTG Artist Gallery

The artists have always been one of my favorite parts of Magic: The Gathering. This project started from a simple desire to see their work together — not as isolated cards, but as bodies of work that span sets, years, and changing visual directions.

## Look beyond the card

### The people behind the images

Thousands of artists have helped shape the visual identity of Magic. Their work tells stories of the game's history that can easily disappear behind the cards themselves.

This gallery is a place to bring those artists forward, explore their contributions, and simply spend some time looking at the art.

MTG Artist Gallery puts the artists behind Magic in the foreground.

Explore an artist's work across different sets and discover how their style contributes to very different worlds, themes, and eras. Instead of focusing on the cards themselves, the gallery invites you to look at the artwork as a body of work.

## Explore Magic through its art

Move between sets and discover how their aesthetics change over time. See the different artistic directions Magic has taken, from its early years to the present, and how new worlds have brought new visual languages with them.

The artwork offers another way to experience the evolution of the game — through styles, ideas, colors, characters, creatures, and worlds rather than mechanics and card lists.

---

## PER-001 — Remove unused CSS Styles

Requirements:

- [ ] All the unused CSS styles are removed

---

# BUGS

## BUG-001 - The image grid is below the navigation

- [x] The image grid should have padding or margin so it's not below the header/navigation
