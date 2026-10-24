import json
import os
import sys


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

BULK_FILE = os.path.join(
    BASE_DIR,
    "tools",
    "data",
    "all-cards.jsonl"
)

OUTPUT_DIR = os.path.join(
    BASE_DIR,
    "data"
)

ARTWORKS_FILE = os.path.join(
    OUTPUT_DIR,
    "artworks.json"
)

SETS_FILE = os.path.join(
    OUTPUT_DIR,
    "sets.json"
)


# ============================================================
# SETTINGS
# ============================================================

EXCLUDED_LAYOUTS = {
    "token",
    "art_series",
    "double_faced_token",
    "emblem",
    "planar",
    "scheme",
    "vanguard",
}


# ============================================================
# READ + PROCESS JSONL
# ============================================================

def process_cards():

    print()
    print("======================================")
    print("MTG Artist Gallery v2")
    print("Scryfall Bulk Data Generator")
    print("======================================")
    print()

    print("Reading local Scryfall JSONL:")
    print(BULK_FILE)
    print()

    # --------------------------------------------------------
    # CHECK FILE
    # --------------------------------------------------------

    if not os.path.exists(BULK_FILE):

        print("ERROR: JSONL file not found.")
        print()
        print("Expected:")
        print(BULK_FILE)
        print()

        sys.exit(1)

    file_size = os.path.getsize(BULK_FILE)

    print(
        f"File size: "
        f"{file_size / 1024 / 1024:.1f} MB"
    )

    print()
    print("Processing cards...")
    print()

    # --------------------------------------------------------
    # DATA
    # --------------------------------------------------------

    artworks = {}
    sets = {}

    total_cards = 0
    valid_cards = 0
    skipped_cards = 0
    english_cards = 0

    # --------------------------------------------------------
    # READ JSONL
    # --------------------------------------------------------

    with open(
        BULK_FILE,
        "r",
        encoding="utf-8"
    ) as file:

        for line_number, line in enumerate(
            file,
            start=1
        ):

            line = line.strip()

            if not line:
                continue

            # ------------------------------------------------
            # PARSE JSON
            # ------------------------------------------------

            try:

                card = json.loads(line)

            except json.JSONDecodeError as error:

                print(
                    f"Invalid JSON on line "
                    f"{line_number}: {error}"
                )

                continue

            total_cards += 1

            # ------------------------------------------------
            # ENGLISH ONLY
            # ------------------------------------------------

            if card.get("lang") != "en":

                skipped_cards += 1
                continue

            english_cards += 1

            # ------------------------------------------------
            # PAPER ONLY
            # ------------------------------------------------

            if "paper" not in card.get(
                "games",
                []
            ):

                skipped_cards += 1
                continue

            # ------------------------------------------------
            # EXCLUDED LAYOUTS
            # ------------------------------------------------

            if card.get(
                "layout"
            ) in EXCLUDED_LAYOUTS:

                skipped_cards += 1
                continue

            # ------------------------------------------------
            # SET INFORMATION
            # ------------------------------------------------

            set_code = card.get(
                "set"
            )

            set_name = card.get(
                "set_name"
            )

            released_at = card.get(
                "released_at",
                ""
            )

            year = None

            if len(released_at) >= 4:

                try:

                    year = int(
                        released_at[:4]
                    )

                except ValueError:

                    year = None

            # ------------------------------------------------
            # ADD SET
            # ------------------------------------------------

            if set_code and set_name:

                if set_code not in sets:

                    sets[set_code] = {

                        "code": set_code,

                        "name": set_name,

                        "year": year
                    }

            # ------------------------------------------------
            # NORMAL CARD ARTWORK
            # ------------------------------------------------

            process_card_artwork(
                card,
                artworks,
                year
            )

            # ------------------------------------------------
            # CARD FACES
            # ------------------------------------------------

            faces = card.get(
                "card_faces"
            )

            if faces:

                for face_index, face in enumerate(
                    faces
                ):

                    process_card_face_artwork(
                        card,
                        face,
                        face_index,
                        artworks,
                        year
                    )

            valid_cards += 1

            # ------------------------------------------------
            # PROGRESS
            # ------------------------------------------------

            if total_cards % 10000 == 0:

                print(
                    f"Processed "
                    f"{total_cards:,} cards..."
                )

    # ========================================================
    # COMPLETE
    # ========================================================

    print()
    print("Processing complete.")
    print()

    print(
        f"Total cards:      {total_cards:,}"
    )

    print(
        f"English cards:    {english_cards:,}"
    )

    print(
        f"Valid cards:      {valid_cards:,}"
    )

    print(
        f"Skipped cards:    {skipped_cards:,}"
    )

    print(
        f"Unique artworks:  {len(artworks):,}"
    )

    print(
        f"Sets:             {len(sets):,}"
    )

    return artworks, sets


# ============================================================
# NORMAL CARD ARTWORK
# ============================================================

def process_card_artwork(
    card,
    artworks,
    year
):

    # --------------------------------------------------------
    # IMAGE URIS
    # --------------------------------------------------------

    image_uris = card.get(
        "image_uris"
    )

    if not image_uris:
        return

    # --------------------------------------------------------
    # ART CROP
    # --------------------------------------------------------

    art_crop = image_uris.get(
        "art_crop"
    )

    if not art_crop:
        return

    # --------------------------------------------------------
    # ILLUSTRATION ID
    # --------------------------------------------------------

    illustration_id = card.get(
        "illustration_id"
    )

    if not illustration_id:
        return

    # --------------------------------------------------------
    # ARTIST
    # --------------------------------------------------------

    artist = card.get(
        "artist"
    )

    if not artist:
        return

    # --------------------------------------------------------
    # ADD
    # --------------------------------------------------------

    add_artwork(
        artworks=artworks,
        illustration_id=illustration_id,
        artist=artist,
        image=art_crop,
        card=card,
        year=year
    )


# ============================================================
# CARD FACE ARTWORK
# ============================================================

def process_card_face_artwork(
    card,
    face,
    face_index,
    artworks,
    year
):

    # --------------------------------------------------------
    # IMAGE URIS
    # --------------------------------------------------------

    image_uris = face.get(
        "image_uris"
    )

    if not image_uris:
        return

    # --------------------------------------------------------
    # ART CROP
    # --------------------------------------------------------

    art_crop = image_uris.get(
        "art_crop"
    )

    if not art_crop:
        return

    # --------------------------------------------------------
    # ILLUSTRATION ID
    # --------------------------------------------------------

    illustration_id = face.get(
        "illustration_id"
    )

    if not illustration_id:

        illustration_id = card.get(
            "illustration_id"
        )

    if not illustration_id:
        return

    # --------------------------------------------------------
    # ARTIST
    # --------------------------------------------------------

    artist = face.get(
        "artist"
    )

    if not artist:

        artist = card.get(
            "artist"
        )

    if not artist:
        return

    # --------------------------------------------------------
    # ADD
    # --------------------------------------------------------

    add_artwork(
        artworks=artworks,
        illustration_id=illustration_id,
        artist=artist,
        image=art_crop,
        card=card,
        year=year,
        face=face,
        face_index=face_index
    )


# ============================================================
# ADD ARTWORK
# ============================================================

def add_artwork(
    artworks,
    illustration_id,
    artist,
    image,
    card,
    year,
    face=None,
    face_index=None
):

    # ========================================================
    # CREATE ARTWORK
    # ========================================================

    if illustration_id not in artworks:

        artworks[illustration_id] = {

            "id": illustration_id,

            "artist": artist,

            "image": image,

            "firstYear": year,

            "cards": []
        }

    artwork = artworks[
        illustration_id
    ]

    # ========================================================
    # UPDATE FIRST YEAR
    # ========================================================

    current_first_year = artwork.get(
        "firstYear"
    )

    if year:

        if (
            not current_first_year
            or year < current_first_year
        ):

            artwork["firstYear"] = year

    # ========================================================
    # GET SAMPLE CARD IMAGE
    # ========================================================

    if face is not None:

        face_image_uris = face.get(
            "image_uris",
            {}
        )

        card_image = face_image_uris.get(
            "normal",
            ""
        )

    else:

        card_image_uris = card.get(
            "image_uris",
            {}
        )

        card_image = card_image_uris.get(
            "normal",
            ""
        )

    # ========================================================
    # CARD INFORMATION
    # ========================================================

    card_data = {

        "name": card.get(
            "name",
            ""
        ),

        "setCode": card.get(
            "set",
            ""
        ),

        "setName": card.get(
            "set_name",
            ""
        ),

        "year": year,

        "rarity": card.get(
            "rarity",
            ""
        ),

        "image": card_image
    }

    # ========================================================
    # FACE INFORMATION
    # ========================================================

    if face is not None:

        card_data["face"] = face.get(
            "name",
            ""
        )

        card_data["faceIndex"] = (
            face_index
        )

    # ========================================================
    # AVOID DUPLICATE PRINT
    # ========================================================

    already_exists = False

    for existing in artwork["cards"]:

        if (
            existing.get("name")
            == card_data.get("name")

            and

            existing.get("setCode")
            == card_data.get("setCode")

            and

            existing.get("faceIndex")
            == card_data.get("faceIndex")
        ):

            already_exists = True

            break

    # ========================================================
    # ADD CARD
    # ========================================================

    if not already_exists:

        artwork["cards"].append(
            card_data
        )


# ============================================================
# SORT ARTWORKS
# ============================================================

def sort_artworks(artworks):

    result = list(
        artworks.values()
    )

    # --------------------------------------------------------
    # SORT CARDS INSIDE EACH ARTWORK
    # --------------------------------------------------------

    for artwork in result:

        artwork["cards"].sort(

            key=lambda card: (

                card.get("year")
                if card.get("year")
                else 9999,

                card.get(
                    "setName",
                    ""
                ),

                card.get(
                    "name",
                    ""
                )
            )
        )

    # --------------------------------------------------------
    # SORT ARTWORKS
    # --------------------------------------------------------

    result.sort(

        key=lambda artwork: (

            artwork.get(
                "artist",
                ""
            ).lower(),

            artwork.get(
                "firstYear"
            )
            if artwork.get("firstYear")
            else 9999
        )
    )

    return result


# ============================================================
# SORT SETS
# ============================================================

def sort_sets(sets):

    result = list(
        sets.values()
    )

    result.sort(

        key=lambda item:

            item.get(
                "name",
                ""
            ).lower()
    )

    return result


# ============================================================
# WRITE JSON
# ============================================================

def write_json(
    filename,
    data
):

    # --------------------------------------------------------
    # CREATE OUTPUT DIRECTORY
    # --------------------------------------------------------

    os.makedirs(
        OUTPUT_DIR,
        exist_ok=True
    )

    print(
        f"Writing: {filename}"
    )

    # --------------------------------------------------------
    # WRITE
    # --------------------------------------------------------

    with open(
        filename,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            data,
            file,
            ensure_ascii=False,
            indent=2
        )

    print(
        f"  {len(data):,} records"
    )


# ============================================================
# MAIN
# ============================================================

def main():

    # --------------------------------------------------------
    # PROCESS
    # --------------------------------------------------------

    artworks, sets = process_cards()

    # --------------------------------------------------------
    # SORT
    # --------------------------------------------------------

    print()
    print("Sorting data...")

    artworks_list = sort_artworks(
        artworks
    )

    sets_list = sort_sets(
        sets
    )

    # --------------------------------------------------------
    # WRITE
    # --------------------------------------------------------

    print()
    print("Writing output files...")
    print()

    write_json(
        ARTWORKS_FILE,
        artworks_list
    )

    write_json(
        SETS_FILE,
        sets_list
    )

    # ========================================================
    # DONE
    # ========================================================

    print()
    print("======================================")
    print("UPDATE COMPLETE")
    print("======================================")
    print()

    print(
        f"Artwork records: "
        f"{len(artworks_list):,}"
    )

    print(
        f"Set records:     "
        f"{len(sets_list):,}"
    )

    print()

    print("Generated:")
    print(
        ARTWORKS_FILE
    )

    print(
        SETS_FILE
    )

    print()


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    main()