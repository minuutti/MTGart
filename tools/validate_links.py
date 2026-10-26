import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ALLOWED = {
    "website", "wikipedia", "instagram", "twitter", "bluesky",
    "artstation", "facebook", "youtube", "patreon", "store",
}


def slugify(value):
    # Must match slugify() in app.js
    import re
    return re.sub(r"^-+|-+$", "", re.sub(r"[^a-z0-9]+", "-", value.lower().strip()))


def main():
    links = json.loads((ROOT / "data" / "artist-links.json").read_text(encoding="utf-8"))
    artists = json.loads((ROOT / "data" / "artists.json").read_text(encoding="utf-8"))
    manifest = json.loads((ROOT / "data" / "manifest.json").read_text(encoding="utf-8"))
    overrides = manifest.get("artistSlugOverrides", {})
    slugs = {overrides.get(a["name"]) or slugify(a["name"]) for a in artists}

    errors = []
    if not isinstance(links, dict):
        errors.append("Top level must be an object keyed by artist slug")
        links = {}

    for slug, entry in links.items():
        if slug not in slugs:
            errors.append(f"{slug}: unknown artist slug")
        if not isinstance(entry, dict):
            errors.append(f"{slug}: value must be an object")
            continue
        for key, url in entry.items():
            if key not in ALLOWED:
                errors.append(f"{slug}: unknown key '{key}'")
            if not isinstance(url, str) or not url.startswith("https://"):
                errors.append(f"{slug}.{key}: must be an https:// URL")

    for error in errors:
        print(error)
    print(f"{len(links)} artists with links, {len(errors)} errors")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
