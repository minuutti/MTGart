# Tools

Utility scripts for generating and maintaining project data.

## `update_data.py`

Builds `data/artists/<slug>.json`, `data/sets/<code>.json`, `data/sets.json` and `data/manifest.json` from the local Scryfall bulk JSONL file.

Expected input file:

- `tools/data/all-cards.jsonl`

Run from project root:

```bash
python3 tools/update_data.py
```

## `validate_links.py`

Validates the hand-maintained `data/artist-links.json` (never touched by `update_data.py`).

```bash
python3 tools/validate_links.py
```

Format: an object keyed by artist slug (as used in `?artist=`), each value an object of links.

```json
{
  "artist-slug": {
    "website": "https://example.com",
    "wikipedia": "https://en.wikipedia.org/wiki/Example"
  }
}
```

Allowed keys: `website`, `wikipedia`, `instagram`, `twitter`, `bluesky`, `artstation`, `facebook`, `youtube`, `patreon`, `store`. Values must be `https://` URLs and the slug must exist in `data/artists.json`. Only add URLs you have checked.
