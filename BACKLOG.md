
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

---

## ART-002 — Artist information modal

Status: [~]

Move artist information into a modal.

Requirements:

- [ ] Artist info remains rendered through `#artistInfo`
- [ ] Add "About the artist" button below title
- [ ] Button visible only in Artist view
- [ ] Button hidden in Set view
- [ ] Modal can be closed
- [ ] Clicking backdrop closes modal
- [ ] Escape closes modal
- [ ] Existing artist information remains intact

---

## ART-003 — Set search modal

Status: [~]

Create a set search experience matching Artist Search.

Requirements:

- [ ] Search set name
- [ ] Search set code
- [ ] Show full set list when opened
- [ ] Select set
- [ ] Close modal after selection
- [ ] Keyboard focus search field
- [ ] Match Artist Search interaction

---

## ART-004 — Artwork modal sample card

Status: [~]

Show the sample card associated with artwork.

Requirements:

- [ ] Show artwork image
- [ ] Show artist
- [ ] Show sample card image
- [ ] Do not show Reprints section
- [ ] Use the card image stored in artwork JSON
- [ ] Handle missing card image gracefully

---

# P1 — Artist experience

## ART-010 — Improve artist profile

Status: [ ]

Improve the information shown in the artist modal.

Potential information:

- Biography
- Location
- Date of birth
- First Magic artwork
- First Magic set
- Keywords
- Portrait

---

## ART-011 — Artist portrait

Status: [ ]

Add portrait support to artist profiles.

Requirements:

- [ ] Portrait URL support
- [ ] Graceful fallback when no portrait exists
- [ ] Appropriate modal layout

---

## ART-012 — Artist discovery

Status: [ ]

Improve ways of discovering artists.

Ideas:

- Random artist
- Search
- Keyword browsing
- Era browsing
- First appearance
- Artists by set

---

# P1 — Set experience

## ART-020 — Improve set information

Status: [ ]

Add useful context to Set view.

Potential information:

- Set release year
- Set type
- Number of unique artworks
- Artists represented
- Visual characteristics

---

## ART-021 — Set visual exploration

Status: [ ]

Make it easier to explore the visual identity of a set.

Ideas:

- Artist grouping
- Artwork count
- Visual statistics
- Set comparison

---

# P1 — UI / UX

## ART-030 — Mobile layout

Status: [ ]

Optimize the gallery for mobile devices.

Requirements:

- [ ] Navigation
- [ ] Search modals
- [ ] Artwork modal
- [ ] Artist modal
- [ ] Gallery grid

---

## ART-031 — Modal refinement

Status: [ ]

Create a consistent modal system.

Requirements:

- [ ] Consistent spacing
- [ ] Consistent close controls
- [ ] Escape key support
- [ ] Backdrop interaction
- [ ] Mobile behavior

---

## ART-032 — Gallery refinement

Status: [ ]

Improve visual presentation of artwork.

Potential improvements:

- Image spacing
- Hover effects
- Loading transitions
- Responsive columns
- Artwork-focused layout

---

# P2 — Exploration

## ART-040 — Random artwork

Status: [ ]

Allow users to discover a random artwork regardless of artist or set.

---

## ART-041 — Artist timeline

Status: [ ]

Explore an artist's work chronologically.

---

## ART-042 — Visual evolution of Magic

Status: [ ]

Create an experience for exploring how Magic's visual language has changed over time.

Potential dimensions:

- Year
- Set
- Artist
- Style
- Era

---

## ART-043 — Artist keywords

Status: [ ]

Allow users to explore artists through manually assigned keywords.

Examples:

- fantasy
- creature
- landscape
- horror
- surreal
- classic

---

# P2 — Data

## ART-050 — Improve artwork dataset

Status: [ ]

Review generated artwork data for consistency.

---

## ART-051 — Improve artist dataset

Status: [ ]

Expand manually maintained artist information.

---

## ART-052 — Data validation

Status: [ ]

Create validation checks for generated JSON.

Potential checks:

- Missing artist
- Missing image
- Missing illustration ID
- Duplicate artwork
- Invalid set code
- Missing card image

---

# P2 — Deployment

## ART-060 — GitHub Pages

Status: [ ]

Deploy the application as a static site.

Requirements:

- [ ] Confirm relative/static asset paths
- [ ] Confirm query parameter routing
- [ ] Test artist URLs
- [ ] Test set URLs
- [ ] Test images
- [ ] Test JSON loading
- [ ] Test mobile layout

---

# P3 — Future

## ART-070 — Favorites

Status: [ ]

Allow users to save favorite artists or artworks locally.

---

## ART-071 — Collections

Status: [ ]

Allow users to build personal artwork collections.

---

## ART-072 — Artist comparison

Status: [ ]

Explore two artists side by side.

---

# Bugs

## BUG-001 — Sample card preview

Status: [ ]

Verify that sample card images consistently appear in the artwork modal.

---

# Ideas

Ideas that are not yet committed to the roadmap.

- Artist-to-artist discovery
- Related artists
- Visual similarity
- Set-to-set visual comparison
- Artist collaborations
- Most represented artists by era
- Artwork map/timeline
- "Surprise me" exploration