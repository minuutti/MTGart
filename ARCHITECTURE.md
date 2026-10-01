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