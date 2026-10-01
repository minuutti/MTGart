
---

# `BACKLOG.md`

I'd make this one a little more operational so the agent can actually work from it.

```markdown
# MTG Artist Gallery — Backlog

## Status legend

- [ ] Todo
- [~] In progress
- [x] Done
- [!] Blocked

---

# P0 — Core

## ART-001 — Query parameter routing

Status: [~]

Use query parameters instead of server-side paths.

Requirements:

- [ ] Artist URL uses `?artist=`
- [ ] Set URL uses `?set=`
- [ ] Home URL has no parameters
- [ ] Browser back/forward works
- [ ] Direct URLs work in MAMP
- [ ] Direct URLs work on static hosting
- [ ] Remove dependency on `.htaccess`

## ART-002 — Subtle fade in animation to grid
- [ ] There's an animation when the grid images appear to user

## ART-003 — Fixed navigation header
- [ ] The top navigation header is fixed on top.
- [ ] The top navigation is not visible when scrolling down
- [ ] The top navigation header becomes visible when scrolling up





---

## PER-001 — Remove unused CSS Styles

Requirements:

- [ ] All the unused CSS styles are removed

--------


BUGS

## BUG-001 - The image grid is below the navigation
- [ ] The image grid should have padding or margin so it's not below the header/navigation
