"""Audit all song arrangements. Structural checks are not recording verification."""
import argparse
import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path


def signature(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True).encode()).hexdigest()


def notes_before(song, part, end):
    if part == 'rhythm':
        return {name: sorted(step for step in steps if step < end) for name, steps in song.get(part, {}).items() if any(step < end for step in steps)}
    return {key: value for key, value in song.get(part, {}).items() if value and int(key.split('-')[0]) < end}


def audit(data):
    catalogue = defaultdict(dict)
    patterns = {length: {part: defaultdict(list) for part in ['melody', 'bass', 'rhythm']} for length in [16, 32, 64]}
    for file in sorted((data / 'songs').glob('*.json')):
        content = json.loads(file.read_text())
        for song in content['songs']:
            length = content['patternLength']
            catalogue[(content['genre'], song['key'])][length] = song
            for part in patterns[length]:
                patterns[length][part][signature(song.get(part, {}))].append(f"{content['genre']}/{song['key']}")
    entries = []
    for (genre, key), variants in sorted(catalogue.items()):
        song = variants[16]
        continuity = {part: all(notes_before(variants[a], part, a) == notes_before(variants[b], part, a)
                                for a, b in [(16, 32), (32, 64)]) for part in ['melody', 'bass', 'lead', 'rhythm']}
        issues = ['Hook pitches and rhythm require a score or recording reference; no verified transcription source is supplied.',
                  'Saved key is metadata; song playback currently uses the selected melody scale.',
                  'Note lengths, ties, swing and accents are not encoded in the legacy song patterns.',
                  'Harmony is one static set of note tiles, without timed chord changes.']
        if not all(continuity.values()):
            issues.append('Longer versions change the opening material instead of retaining the shorter phrase.')
        if song['timeSignature'] != '4/4':
            issues.append(f"Saved meter is {song['timeSignature']}; the player still groups sixteenth-note steps in sets of 16.")
        entries.append({'genre': genre, 'id': key, 'name': song['name'], 'artist': song['artist'],
                        'savedKey': song['keyName'], 'savedTempo': song['tempo'], 'savedMeter': song['timeSignature'],
                        'referenceStatus': 'not_recording_verified', 'continuity': continuity, 'issues': issues,
                        'versions': {str(length): {'steps': length, 'melodyNotes': len(variant.get('melody', {})),
                                                  'leadNotes': len(variant.get('lead', {})),
                                                  'sameMelodyAs': [peer for peer in patterns[length]['melody'][signature(variant['melody'])] if peer != f'{genre}/{key}']}
                                     for length, variant in variants.items()}})
    return {'scope': 'All saved song JSON files; no listening comparison of every recording has been performed.',
            'summary': {'catalogueEntries': len(entries), 'arrangements': sum(len(v) for v in catalogue.values()),
                        'nonFourFourEntries': sum(e['savedMeter'] != '4/4' for e in entries),
                        'openingMismatchEntries': sum(not all(e['continuity'].values()) for e in entries),
                        'verifiedHooks': 0,
                        'uniquePatterns': {str(length): {part: len(values) for part, values in groups.items()} for length, groups in patterns.items()}},
            'entries': entries}


def report(result, path):
    summary = result['summary']
    lines = ['# Song arrangement review', '',
             f"All {summary['catalogueEntries']} catalogue entries and {summary['arrangements']} saved arrangements were structurally audited. This is not a claim that the original recordings were all heard or their hooks transcribed.", '',
             '## Findings', '',
             '- The legacy generation notes describe melodies generated from song titles. Their claimed authenticity is unsupported by transcription sources.',
             '- Every entry still needs a verified hook reference before it can be described as a close rendition of its recording.',
             '- The player ignores the saved song key, uses an eight-note melody grid, and has no saved note durations or timed chord changes. These limit fidelity even after the data is corrected.',
             f"- {summary['nonFourFourEntries']} entries specify a meter other than 4/4, but the player treats 16 sixteenth-note steps as a group. Meter-aware timing is needed for them.", '',
             '## Structural changes applied', '',
             '- The 16-step phrase is retained at the beginning of the 32-step version.',
             '- The complete 32-step phrase is retained at the beginning of the 64-step version.',
             '- This applies to melody, bass, lead and drum/percussion patterns. Existing material beyond the shared prefix is retained.',
             '- No additional melodies were invented or labelled as verified hooks.', '',
             '## Pattern diversity after the continuity fix', '',
             '| Steps | Unique melody patterns | Unique bass patterns | Unique rhythm patterns |',
             '|---|---:|---:|---:|']
    for length, parts in summary['uniquePatterns'].items():
        lines.append(f"| {length} | {parts['melody']} | {parts['bass']} | {parts['rhythm']} |")
    lines += ['', 'Shared patterns are review signals, not proof that a song is wrong; deliberate stylistic similarities and duplicate catalogue entries exist.', '',
              '## Reference spot-check', '',
              '[The Library of Congress identifies Take Five as a 5/4 composition](https://blogs.loc.gov/nls-music-notes/2020/05/song-stories-time-out-for-take-five/). Its saved meter agrees, but the app does not use it for grouping. This is a confirmed playback limitation, not a verified melody transcription.', '',
              '## What each version should become', '',
              '- **16 steps:** a verified identifying phrase or riff, with its real pitches and timing.',
              '- **32 steps:** preserve that phrase, then add its answer or continuation.',
              '- **64 steps:** preserve the complete 32-step phrase and develop the next musical passage, with appropriate harmony, bass and groove.', '',
              'Correct note palettes, durations, accents, meter and chord changes need support in the player. Sources and recording/score locations should be attached to each revised hook.', '',
              '## Song-by-song review', '', '| Genre | Song | Artist | Meter | Shared opening | Hook verification |', '|---|---|---|---|---|---|']
    for entry in result['entries']:
        values = [entry['genre'], entry['name'], entry['artist'], entry['savedMeter'],
                  'Consistent' if all(entry['continuity'].values()) else 'Needs repair', 'Reference needed']
        lines.append('| ' + ' | '.join(str(value).replace('|', '\\|') for value in values) + ' |')
    path.write_text('\n'.join(lines) + '\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--data', type=Path, default=Path(__file__).resolve().parents[1] / 'data')
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    output = args.output or args.data / 'reviews'
    output.mkdir(parents=True, exist_ok=True)
    result = audit(args.data)
    (output / 'song-audit.json').write_text(json.dumps(result, indent=2) + '\n')
    report(result, output / 'song-review.md')
    print(json.dumps(result['summary'], indent=2))
