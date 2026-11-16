import contextlib
import io
import json
import unittest
from pathlib import Path
from unittest.mock import patch

from tools import update_data


ROOT = Path(__file__).resolve().parents[1]


class SetAvailabilityTest(unittest.TestCase):
    def test_set_index_matches_available_shards(self):
        sets = json.loads((ROOT / "data/sets.json").read_text(encoding="utf-8"))
        for item in sets:
            with self.subTest(code=item["code"]):
                shard = ROOT / "data/sets" / f"{item['code'].lower()}.json"
                self.assertEqual(item.get("hasArtworks") is not False, shard.is_file())

    def test_generator_marks_sets_without_artwork_shards(self):
        sets = {
            "dmu": {"code": "dmu", "name": "Dominaria United", "year": 2022},
            "empty": {"code": "empty", "name": "Empty Set", "year": 2022},
        }
        written = {}
        with (
            patch.object(update_data, "process_cards", return_value=({}, sets)),
            patch.object(update_data, "sort_artworks", return_value=[]),
            patch.object(update_data, "write_shards", return_value=({}, {"dmu": []}, {})),
            patch.object(update_data, "write_json", side_effect=lambda name, data: written.update({name: data})),
            patch.object(update_data.os.path, "exists", return_value=False),
            contextlib.redirect_stdout(io.StringIO()),
        ):
            update_data.main()

        result = {item["code"]: item for item in written[update_data.SETS_FILE]}
        self.assertNotIn("hasArtworks", result["dmu"])
        self.assertIs(result["empty"]["hasArtworks"], False)


if __name__ == "__main__":
    unittest.main()
