# MTG Unframed Art Quiz

The quiz is a standalone, solo-play static app served at `/quiz/`. It reads only its own generated `data/questions.json`; the gallery application files are not used or modified by the quiz UI. It has no room codes or shared multiplayer state.

## Build quiz data

From the repository root, run:

```bash
python3 quiz/tools/build_data.py
```

The builder reads the existing `data/artists/*.json` shards and writes a compact quiz index to `quiz/data/questions.json`. It keeps one question per unique artwork and its valid named printings. Re-run it after refreshing gallery artwork data. No card type or color is required.

The quiz asks for a card name and lets the player choose a set from a dropdown populated with sets that have printings in the selected year range. For each question, any set where that artwork has a printing within the selected year range is accepted; the results list all accepted sets. Card names are accepted at 80% normalized Levenshtein similarity; set names are matched case-insensitively after punctuation and whitespace normalization. A correct card name is worth 5 points, and a correct set is worth 1 point. Answers and totals are evaluated in the browser because this version is single-player.

## Multiplayer later

To support players joining with a code, add a separate shared backend or realtime service for quiz rooms, question synchronization, submitted answers, and scores. The current solo quiz does not provide room codes or shared leaderboards.
