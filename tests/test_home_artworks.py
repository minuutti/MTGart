import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class HomeArtworkSelectionTest(unittest.TestCase):
    def test_selection_resolves_to_unique_artworks(self):
        selection = json.loads((ROOT / "data/home-artworks.json").read_text())
        self.assertEqual(len(selection), 30)
        self.assertEqual(len({entry["illustration_id"] for entry in selection}), 30)

        for entry in selection:
            with self.subTest(entry=entry):
                shard = ROOT / "data/artists" / (entry["artistSlug"] + ".json")
                artworks = json.loads(shard.read_text())
                matches = [artwork for artwork in artworks if artwork["id"] == entry["illustration_id"]]
                self.assertEqual(len(matches), 1)
                self.assertTrue(matches[0]["image"])
                self.assertTrue(matches[0]["artist"])
                self.assertTrue(matches[0]["cards"])


if __name__ == "__main__":
    unittest.main()
