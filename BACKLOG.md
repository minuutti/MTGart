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

Status: [ ] Todo

### Goal
Keep navigation accessible without wasting screen space:

- Header is fixed at the top.
- Header hides while scrolling down.
- Header reappears when scrolling up.

### Acceptance criteria

- [ ] Header uses fixed positioning at top of viewport on all pages/views.
- [ ] Main content starts below header (no overlap with first row/content).
- [ ] On downward scroll past a small threshold, header slides out of view.
- [ ] On upward scroll past a small threshold, header slides back into view.
- [ ] At page top (`scrollY <= 0`), header is always visible.
- [ ] No flicker/jitter during slow scroll or tiny scroll deltas.
- [ ] Behavior works on desktop and mobile widths.
- [ ] Transitions are smooth and subtle (no abrupt jump).

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

- [ ] Load home view: header visible, content not under header.
- [ ] Scroll down slowly: header hides once threshold exceeded.
- [ ] Scroll up slightly: header reappears once threshold exceeded.
- [ ] Jump to top: header visible.
- [ ] Navigate between `?artist=` and `?set=` views: behavior preserved.
- [ ] Mobile viewport test (DevTools): same behavior, no overlap.

### Definition of done

- [ ] All acceptance criteria checked.
- [ ] No regressions in routing/navigation.
- [ ] Mark task status to `[x] Done`.

---

## PER-001 — Remove unused CSS Styles

Requirements:

- [ ] All the unused CSS styles are removed

---

# BUGS

## BUG-001 - The image grid is below the navigation

- [x] The image grid should have padding or margin so it's not below the header/navigation
