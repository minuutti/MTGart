import importlib.util
import json
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BUILDER_PATH = ROOT / "quiz" / "tools" / "build_data.py"
SPEC = importlib.util.spec_from_file_location("quiz_data_builder", BUILDER_PATH)
BUILDER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BUILDER)


class QuizDataBuilderTest(unittest.TestCase):
    def test_builds_unique_artwork_with_valid_printings(self):
        with tempfile.TemporaryDirectory() as temporary:
            artist_dir = Path(temporary)
            (artist_dir / "one.json").write_text(json.dumps([
                {
                    "id": "art-1",
                    "artist": "Artist One",
                    "image": "https://example.test/art.jpg",
                    "cards": [
                        {"name": "Card", "setName": "Set A", "year": 2000},
                        {"name": "Card", "setName": "Set A", "year": 2000},
                        {"name": "Card", "setName": "Set B", "year": 2003},
                        {"name": "Unknown year", "setName": "Set C", "year": None},
                    ],
                }
            ]), encoding="utf-8")
            (artist_dir / "two.json").write_text(json.dumps([
                {
                    "id": "art-2",
                    "artist": "Artist Two",
                    "image": "https://example.test/other.jpg",
                    "cards": [{"name": "Other", "setName": "Set D", "year": 2001}],
                }
            ]), encoding="utf-8")

            result = BUILDER.build_question_index(artist_dir)

        self.assertEqual(result["years"], [2000, 2001, 2003])
        self.assertEqual([question["id"] for question in result["questions"]], ["art-1", "art-2"])
        self.assertEqual(
            result["questions"][0]["printings"],
            [
                {"name": "Card", "set": "Set A", "year": 2000},
                {"name": "Card", "set": "Set B", "year": 2003},
            ],
        )

    def test_requires_printings_with_valid_years(self):
        with tempfile.TemporaryDirectory() as temporary:
            artist_dir = Path(temporary)
            (artist_dir / "empty.json").write_text(json.dumps([
                {"id": "art", "image": "https://example.test/art.jpg", "cards": []}
            ]), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "No artwork printings"):
                BUILDER.build_question_index(artist_dir)


if __name__ == "__main__":
    unittest.main()
