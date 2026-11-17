import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
ARTIST_DIR = ROOT / "data" / "artists"
OUTPUT = Path(__file__).resolve().parents[1] / "data" / "questions.json"


def build_question_index(artist_dir):
    artworks = {}

    for shard_path in sorted(Path(artist_dir).glob("*.json")):
        with shard_path.open(encoding="utf-8") as shard_file:
            shard = json.load(shard_file)

        if not isinstance(shard, list):
            raise ValueError(f"{shard_path} must contain an array")

        for artwork in shard:
            artwork_id = artwork.get("id")
            image = artwork.get("image")
            if not isinstance(artwork_id, str) or not artwork_id:
                continue
            if not isinstance(image, str) or not image:
                continue

            entry = artworks.setdefault(artwork_id, {
                "id": artwork_id,
                "artist": artwork.get("artist", ""),
                "image": image,
                "printings": set(),
            })

            for card in artwork.get("cards", []):
                name = card.get("name")
                set_name = card.get("setName")
                year = card.get("year")
                if (
                    isinstance(name, str) and name.strip()
                    and isinstance(set_name, str) and set_name.strip()
                    and isinstance(year, int) and not isinstance(year, bool) and year > 0
                ):
                    entry["printings"].add((name.strip(), set_name.strip(), year))

    questions = []
    all_years = set()
    for entry in artworks.values():
        printings = sorted(entry["printings"], key=lambda item: (item[2], item[1], item[0]))
        if not printings:
            continue
        all_years.update(printing[2] for printing in printings)
        questions.append({
            "id": entry["id"],
            "artist": entry["artist"],
            "image": entry["image"],
            "printings": [
                {"name": name, "set": set_name, "year": year}
                for name, set_name, year in printings
            ],
        })

    questions.sort(key=lambda question: question["id"])
    years = sorted(all_years)
    if not years:
        raise ValueError("No artwork printings with valid years were found")
    return {"years": years, "questions": questions}


def main():
    if not ARTIST_DIR.is_dir():
        raise FileNotFoundError(f"Artist data directory not found: {ARTIST_DIR}")

    quiz_data = build_question_index(ARTIST_DIR)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", encoding="utf-8") as output_file:
        json.dump(quiz_data, output_file, ensure_ascii=False, separators=(",", ":"))

    print(
        f"Wrote {len(quiz_data['questions']):,} artworks and "
        f"{len(quiz_data['years'])} years to {OUTPUT.relative_to(ROOT)}"
    )


if __name__ == "__main__":
    try:
        main()
    except (OSError, json.JSONDecodeError, ValueError) as error:
        print(f"Could not build quiz data: {error}", file=sys.stderr)
        sys.exit(1)
