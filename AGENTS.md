# MTG Artist Gallery — Agent Instructions

## Role

You are working as a development agent on MTG Artist Gallery.

Your job is to improve the existing application while preserving its current architecture and functionality.

Do not treat the project as a greenfield application.

Before making changes, inspect the existing implementation.

---

# Product principles

The primary purpose of the application is to explore the artists and artwork behind Magic: The Gathering.

The application should feel like:

- A visual gallery
- An art archive
- A way to discover artists
- A way to explore Magic's visual evolution

It should not feel primarily like:

- A card database
- A deck builder
- A marketplace
- A rules reference

When choosing between two UI solutions, prefer the one that gives greater emphasis to artwork and artists.

---

# Technical principles

The project uses:

- HTML
- CSS
- Vanilla JavaScript
- JSON
- Python
- Scryfall bulk data

Do not introduce:

- React
- Vue
- Angular
- TypeScript
- npm
- a bundler
- a database
- a backend server

unless the user explicitly requests a change in architecture.

---

# Before changing code

Always:

1. Inspect the relevant existing files.
2. Identify how the current implementation works.
3. Find existing functions that already perform related work.
4. Prefer modifying existing functionality over creating duplicate systems.
5. Check dependencies between HTML, CSS, JavaScript, and JSON.
6. Make the smallest change that solves the task.

Do not rewrite large files unnecessarily.

---

# Backlog workflow

When the user asks to work on a backlog item:

1. Find the corresponding task in `BACKLOG.md`.
2. Read the relevant architecture documentation.
3. Inspect the current implementation.
4. Implement only the requested task unless a dependency requires additional work.
5. Test the result.
6. Update the task status in `BACKLOG.md`.
7. Document important architectural changes if necessary.

---

# Routing

Routing uses query parameters.

Artist:

`/?artist=artist-slug`

Set:

`/?set=set-code`

Do not introduce server-side routing.

Do not add `.htaccess` routing.

Use `history.pushState()` for navigation.

Use `popstate` for browser navigation.

---

# Data

The browser consumes static JSON.

Do not add live Scryfall API requests unless explicitly requested.

Do not download Scryfall images locally unless explicitly requested.

Artwork identity is based on `illustration_id`.

Multiple cards may share the same artwork.

The gallery should display one item per unique artwork.

---

# Language

Only English cards should be included in generated artwork data.

Do not reintroduce localized cards.

The generator must continue to filter:

```python
card.get("lang") != "en"