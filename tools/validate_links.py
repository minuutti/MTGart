import json
import re
import sys
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent.parent
ALLOWED = {
    "website", "wikipedia", "instagram", "twitter", "bluesky",
    "artstation", "facebook", "youtube", "patreon", "store",
}


def slugify(value):
    # Must match slugify() in app.js
    return re.sub(r"^-+|-+$", "", re.sub(r"[^a-z0-9]+", "-", value.lower().strip()))


def validate_links(links, slugs):
    errors = []

    if not isinstance(links, dict):
        return ["Top level must be an object keyed by artist slug"]

    for slug, entry in links.items():
        if slug not in slugs:
            errors.append(f"{slug}: unknown artist slug")
        if not isinstance(entry, dict):
            errors.append(f"{slug}: value must be an object")
            continue

        for key, url in entry.items():
            if key not in ALLOWED:
                errors.append(f"{slug}: unknown key '{key}'")
            if not isinstance(url, str):
                errors.append(f"{slug}.{key}: must be an https:// URL")
                continue

            try:
                parsed_url = urlsplit(url)
                valid_url = (
                    parsed_url.scheme == "https"
                    and bool(parsed_url.hostname)
                    and not any(character.isspace() for character in url)
                )
                parsed_url.port
            except ValueError:
                valid_url = False

            if not valid_url:
                errors.append(f"{slug}.{key}: must be a valid https:// URL")

    return errors


def load_json(path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise ValueError(f"Could not read {path.relative_to(ROOT)}: {error}") from error


def main():
    links = load_json(ROOT / "data" / "artist-links.json")
    artists = load_json(ROOT / "data" / "artists.json")
    manifest = load_json(ROOT / "data" / "manifest.json")
    overrides = manifest.get("artistSlugOverrides", {})
    slugs = {overrides.get(a["name"]) or slugify(a["name"]) for a in artists}

    errors = validate_links(links, slugs)
    for error in errors:
        print(error)
    print(f"{len(links)} artists with links, {len(errors)} errors")
    return 1 if errors else 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except ValueError as error:
        print(error, file=sys.stderr)
        sys.exit(1)
