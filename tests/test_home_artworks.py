import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class HomeArtworkSelectionTest(unittest.TestCase):
    def test_selection_resolves_to_unique_artworks(self):
        selection = json.loads((ROOT / "data/home-artworks.json").read_text())
        self.assertGreaterEqual(len(selection), 12)
        self.assertEqual(len({entry["illustration_id"] for entry in selection}), len(selection))

        for entry in selection:
            with self.subTest(entry=entry):
                shard = ROOT / "data/artists" / (entry["artistSlug"] + ".json")
                artworks = json.loads(shard.read_text())
                matches = [artwork for artwork in artworks if artwork["id"] == entry["illustration_id"]]
                self.assertEqual(len(matches), 1)
                self.assertTrue(matches[0]["image"])
                self.assertTrue(matches[0]["artist"])
                self.assertTrue(matches[0]["cards"])

    def test_requested_artworks(self):
        expected = {
            ("Contagion", "Mike Raabe"),
            ("Bitterblossom", "Rebecca Guay"),
            ("Mountain", "John Avon"),
            ("Ad Nauseam", "Jeremy Jarvis"),
            ("Gaea's Balance", "Rebecca Guay"),
            ("Phyrexian Unlife", "Jason Chan"),
            ("Thoughtseize", "Aleksi Briclot"),
            ("Ethersworn Canonist", "Izzy"),
            ("Vibrance", "Jakub Kasper"),
            ("Soulherder", "Seb McKinnon"),
            ("Mox Emerald", "Dan Frazier"),
            ("Force of Nature", "Douglas Shuler"),
            ("Squee, Goblin Nabob", "David Monette"),
            ("Recurring Nightmare", "Jeff Laubenstein"),
            ("Reanimate", "Robert Bliss"),
            ("Force of Will", "Terese Nielsen"),
            ("Show and Tell", "Jeff Laubenstein"),
            ("Darkpact", "Quinton Hoover"),
            ("Dandân", "Drew Tucker"),
            ("Mindstab Thrull", "Mark Tedin"),
            ("Wyluli Wolf", "Susan Van Camp"),
            ("Desolation Angel", "Brom"),
            ("Cuombajj Witches", "Kaja Foglio"),
            ("Unmask", "rk post"),
            ("Avatar of Woe", "rk post"),
            ("Persecute", "D. Alexander Gregory"),
            ("Island", "Sam Burley"),
            ("Bog Raiders", "Carl Critchlow"),
            ("Foot Soldiers", "Kev Walker"),
            ("Plains", "Nils Hamm"),
            ("Millstone", "Yeong-Hao Han"),
            ("Diamond Mare", "Alayna Danner"),
            ("Castle Ardenvale", "Volkan Baǵa"),
            ("Pride of the Clouds", "Rebecca Guay"),
            ("Magnetic Web", "Adam Rex"),
            ("Spirit Mirror", "D. Alexander Gregory"),
            ("Flubs, the Fool", "Adam Rex"),
            ("Exotic Orchard", "Ron Spears"),
            ("Evolving Wilds", "Alayna Danner"),
            ("Primeval Bounty", "Christine Choi"),
            ("Squirrel Nest", "Daniel Ljunggren"),
            ("Ferrous Lake", "Grady Frederick"),
            ("Plains", "John Avon"),
            ("Mind Peel", "Adam Rex"),
            ("Bandage", "Rebecca Guay"),
            ("Field of Souls", "Richard Kane Ferguson"),
            ("Recumbent Bliss", "Todd Lockwood"),
            ("Suture Spirit", "Larry MacDougall"),
            ("Quicksilver Fountain", "Trevor Hairsine"),
        }
        selection = json.loads((ROOT / "data/home-artworks.json").read_text())
        actual = set()
        for entry in selection:
            shard = ROOT / "data/artists" / (entry["artistSlug"] + ".json")
            artwork = next(item for item in json.loads(shard.read_text())
                           if item["id"] == entry["illustration_id"])
            actual.update((card["name"], artwork["artist"]) for card in artwork["cards"])
        self.assertEqual(actual, expected)

    def test_selected_new_land_artworks(self):
        selection = json.loads((ROOT / "data/home-artworks.json").read_text())
        cases = [
            ("20c3148e-70bc-4750-b51b-a4815278828c", "alayna-danner", "Evolving Wilds", "woe"),
            ("c0675583-b5c8-40ab-ab0a-585396f156b5", "john-avon", "Plains", "m15"),
        ]
        for artwork_id, slug, name, set_code in cases:
            with self.subTest(name=name):
                self.assertIn({"illustration_id": artwork_id, "artistSlug": slug}, selection)
                artworks = json.loads((ROOT / "data/artists" / (slug + ".json")).read_text())
                artwork = next(item for item in artworks if item["id"] == artwork_id)
                self.assertTrue(any(card["name"] == name and card["setCode"] == set_code
                                    for card in artwork["cards"]))

    def test_sam_burley_island_is_the_selected_battle_for_zendikar_artwork(self):
        selection = json.loads((ROOT / "data/home-artworks.json").read_text())
        self.assertIn({
            "illustration_id": "89549c3b-1ce0-4c8b-88d5-8fc0931d1c10",
            "artistSlug": "sam-burley",
        }, selection)

    def test_john_avon_mountain_is_the_selected_urzas_saga_artwork(self):
        selection = json.loads((ROOT / "data/home-artworks.json").read_text())
        self.assertIn({
            "illustration_id": "1ad82961-4668-4628-ae2b-f74d78f03c7b",
            "artistSlug": "john-avon",
        }, selection)
        artworks = json.loads((ROOT / "data/artists/john-avon.json").read_text())
        artwork = next(item for item in artworks
                       if item["id"] == "1ad82961-4668-4628-ae2b-f74d78f03c7b")
        self.assertTrue(any(card["name"] == "Mountain" and card["setCode"] == "usg"
                            for card in artwork["cards"]))


if __name__ == "__main__":
    unittest.main()
