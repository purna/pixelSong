# Music preset data

- `tune-helper/<mood>-<energy>-<steps>.json`: 27 saved arrangements covering three moods, three energy levels, and 16/32/64 steps. Each 16-step group includes harmony degrees, melody, bass, lead, drum and percussion notes with velocities. Stage positions are included. Notes use scale degrees so they adapt to the scale selected in the app. Melody only loads the melody from the same arrangement.
- `songs/<genre>_<steps>step.json`: 39 genre files covering all 13 genres at each step length, with 280 songs and 840 total arrangements. Song IDs stay the same across lengths, so switching Steps reloads the same song's matching arrangement. Original artist, tempo and other metadata are retained.

Tune note entries are `[localStep, scaleDegree, velocity]`; rhythm entries are `[localStep, velocity]`. Local steps run from 0 to 15. Velocities range from 0 to 1. The number of groups must equal `patternLength / 16`.

Song note keys are `absoluteStep-row`, and rhythm arrays contain absolute step numbers, starting at zero. No 64-step source remapping happens at runtime. Legacy melody rows above 7 are folded down one scale octave to fit the eight-row melody grid. Unavailable harmony tile indices are omitted.

Run `python3 scripts/build-preset-data.py` from the project root to rebuild these files. The legacy files in `docs/` are retained as source material; the app loads presets from `data/`.
