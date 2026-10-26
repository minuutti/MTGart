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

## PER-001 — Remove unused CSS Styles

Requirements:

- [ ] All the unused CSS styles are removed

---

# BUGS

## BUG-001 - The image grid is below the navigation

- [x] The image grid should have padding or margin so it's not below the header/navigation
