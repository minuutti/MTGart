# Tools

Utility scripts for generating and maintaining project data.

## `update_data.py`

Builds `data/artworks.json` and `data/sets.json` from the local Scryfall bulk JSONL file.

Expected input file:

- `tools/data/all-cards.jsonl`

Run from project root:

```bash
python3 tools/update_data.py
```
