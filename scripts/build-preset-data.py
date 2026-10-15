"""Build the JSON presets used by Tune Helper and Genre/Song selection.
Run from the project root: python3 scripts/build-preset-data.py
"""
import json
from pathlib import Path
import argparse


def build(source, output):
    def write(path, data):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data, indent=2) + '\n')

    for mood in ['bright', 'dreamy', 'moody']:
        for energy in ['gentle', 'steady', 'lively']:
            calm, busy = energy == 'gentle', energy == 'lively'
            steps = [0, 4, 8, 12] if calm else [0, 2, 3, 6, 8, 10, 11, 14] if busy else [0, 2, 4, 8, 10, 12]
            contour = {'bright': [0, 2, 4, 2], 'dreamy': [4, 2, 4, 6], 'moody': [4, 3, 2, 0]}[mood]
            for length in [16, 32, 64]:
                groups = []
                for g in range(length // 16):
                    melody = {step: contour[i % 4] for i, step in enumerate(steps)}
                    if g % 2:
                        melody[steps[-2]] = 1 if mood == 'moody' else 4
                    # Four-bar versions develop the motif before returning home.
                    if g == 2:
                        melody[steps[1]] = min(6, melody[steps[1]] + 2)
                    melody[steps[-1]] = 0 if g == length // 16 - 1 else 2
                    lead_steps = [6, 14] if calm else [1, 5, 7, 9, 13, 15] if busy else [3, 7, 11, 15]
                    rhythm = {
                        'kick': [0, 4, 8, 12] if busy else [0, 8], 'snare': [4, 12],
                        'hihat': list(range(0, 16, 4 if calm else 2)),
                        'tom': ([14, 15] if busy else [15]) if g == length // 16 - 1 else [],
                        'conga': [10] if calm else [3, 6, 10, 14] if busy else [6, 10],
                        'bongo': [14] if calm else [7, 11, 15] if busy else [7, 15],
                        'shaker': list(range(2, 16, 8 if calm else 2 if busy else 4)), 'cymbal': [0]
                    }
                    groups.append({
                        'harmonyDegrees': [0, 2, 4], 'harmonyVelocity': 0.65,
                        'melody': [[step, degree, 0.8 if step % 4 == 0 else 0.64] for step, degree in melody.items()],
                        'lead': [[step, 0 if g == length // 16 - 1 and i == len(lead_steps) - 1 else [4, 2, 6, 4][(i + g) % 4], 0.42 if calm else 0.62 if busy else 0.52] for i, step in enumerate(lead_steps)],
                        'bass': [[step, 4 if i % 2 else 0, 0.65 if i % 2 else 0.8] for i, step in enumerate([0, 8] if calm else [0, 6, 8, 14])],
                        'rhythm': {name: [[step, (0.38 if step % 4 else 0.52) if name == 'hihat' else (0.25 if calm else 0.45 if busy else 0.35) if name in ['conga', 'bongo', 'shaker', 'cymbal'] else 0.75] for step in values] for name, values in rhythm.items()}
                    })
                formation = 'orchestra' if mood == 'dreamy' else 'call-response' if mood == 'moody' else 'spread' if busy else 'rock-band'
                layouts = {
                    'orchestra': [[40, 35], [25, 85], [50, 85], [50, 25], [50, 55]],
                    'call-response': [[25, 45], [75, 70], [50, 80], [75, 35], [25, 25]],
                    'spread': [[50, 40], [30, 80], [50, 80], [50, 25], [50, 60]],
                    'rock-band': [[40, 45], [30, 80], [50, 80], [60, 35], [50, 20]]
                }
                write(output / 'tune-helper' / f'{mood}-{energy}-{length}.json', {
                    'schemaVersion': 1, 'mood': mood, 'energy': energy, 'patternLength': length,
                    'groups': groups, 'stage': {'formation': formation, 'positions': dict(zip(['melody', 'rhythm', 'bass', 'lead', 'percussion'], layouts[formation]))}
                })
    for file in sorted((source / 'docs').glob('*_64step.json')):
        original = json.loads(file.read_text())
        genre = original['genre']
        variations = json.loads((source / 'docs' / f'{genre}.json').read_text())['song_variations']
        shorter_versions = {}
        for length in [16, 32, 64]:
            songs = []
            for song in original['songs']:
                variant = next(v for v in variations[song['key']] if v['patternLength'] == length)
                arranged = {**song, **variant, 'key': song['key'], 'name': song['name'], 'genre': genre}
                # The melody grid has eight scale rows; fold higher degrees down an octave.
                arranged['melody'] = {f'{step}-{int(row) % 7 if int(row) > 7 else row}': active
                                       for key, active in arranged.get('melody', {}).items()
                                       for step, row in [key.split('-')]}
                arranged['harmonics'] = [row for row in arranged.get('harmonics', []) if 0 <= row < 8]
                shorter = shorter_versions.get(song['key'])
                if shorter:
                    boundary = shorter['patternLength']
                    # Develop the same phrase instead of changing the opening at each length.
                    for part in ['melody', 'bass', 'lead']:
                        tail = {key: value for key, value in arranged.get(part, {}).items()
                                if int(key.split('-')[0]) >= boundary}
                        arranged[part] = {**shorter.get(part, {}), **tail}
                    arranged['rhythm'] = {
                        name: sorted(set(shorter.get('rhythm', {}).get(name, []))
                                     | {step for step in arranged.get('rhythm', {}).get(name, []) if step >= boundary})
                        for name in sorted(set(shorter.get('rhythm', {})) | set(arranged.get('rhythm', {})))}
                shorter_versions[song['key']] = arranged
                songs.append(arranged)
            write(output / 'songs' / f'{genre}_{length}step.json', {'genre': genre, 'patternLength': length, 'songs': songs})

    write_bundle(output)


def write_bundle(output):
    # Classic scripts can be loaded from file://, unlike fetch() requests for JSON.
    bundle = {f'data/{file.relative_to(output).as_posix()}': json.loads(file.read_text())
              for folder in ['songs', 'tune-helper'] for file in sorted((output / folder).glob('*.json'))}
    (output / 'presetBundle.js').write_text('// Generated from the JSON presets by scripts/build-preset-data.py.\n'
                                          + 'window.PIXELSONG_PRESET_DATA = '
                                          + json.dumps(bundle, separators=(',', ':')) + ';\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--output', type=Path)
    parser.add_argument('--bundle-only', action='store_true', help='Rebuild the local-file bundle without changing JSON presets')
    args = parser.parse_args()
    output = args.output or args.source / 'data'
    if args.bundle_only:
        write_bundle(output)
    else:
        build(args.source, output)
