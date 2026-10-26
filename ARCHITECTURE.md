# MTG Artist Gallery — Architecture

## Technology

The application is intentionally simple.

- HTML
- CSS
- Vanilla JavaScript
- JSON
- Python for data generation
- Scryfall bulk data
- MAMP for local development
- Static hosting compatible

No JavaScript framework is currently used.

## Directory structure

```text
MTGart-main/
│
├── index.html
├── app.js
├── styles.css
├── artists.json
│
├── data/
│   ├── artworks.json
│   └── sets.json
│
└── tools/
    ├── update_data.py
    └── data/
        └── all-cards.jsonl

## Artist links

`data/artist-links.json` is hand-maintained and keyed by artist slug. It is not generated or overwritten by `tools/update_data.py`. At startup `loadData()` fetches it and `mergeArtistLinks()` attaches a filtered `links` object (allowed keys, `https://` only) to each matching artist. A missing or invalid file is ignored. Validate with `python3 tools/validate_links.py`.
