const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function fixture() {
    const context = {
        console: { log() {}, warn() {}, error() {} },
        document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: () => ({}) },
        Tone: { Transport: { bpm: { value: 120 }, cancel() {}, start() {}, stop() {}, scheduleRepeat() {} }, now: () => 0, Draw: { schedule() {} } },
        window: {}
    };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(path.join(root, 'js/songDesigner.js'), 'utf8') + '\nwindow.App=SongDesignerApp;', context);
    vm.runInContext(fs.readFileSync(path.join(root, 'js/songDesigner.patch.js'), 'utf8'), context);
    const app = Object.create(context.window.App.prototype);
    Object.assign(app, {
        tempo: 120,
        currentKey: { root: 'C', pitchClass: 0, mode: 'major', preferFlats: false, name: 'C Major' },
        keyScaleIds: {},
        scales: {},
        harmonicNotes: ['C3', 'E3', 'G3', 'C4', 'E4', 'G4', 'B4', 'D5'],
        bassNotes: ['C1', 'D1', 'E1', 'F1', 'G1', 'A1', 'B1', 'C2', 'D2', 'E2', 'F2', 'G2'],
        effectAutomation: {},
        melodyVelocity: new Map(), leadVelocity: new Map(), bassVelocity: new Map(), harmonyVelocity: new Map(),
        rhythmVelocity: {},
        showNotification: () => {},
        melodyEnabled: true, leadEnabled: true, bassEnabled: true, harmonicsEnabled: false,
        rhythmEnabled: false, percussionEnabled: false,
        patternGroups: {
            harmonics: [new Set()],
            melody: [new Map()],
            bass: [new Map()],
            lead: [new Map()],
            rhythm: [{ kick: new Set(), snare: new Set(), hihat: new Set(), tom: new Set(), conga: new Set(), bongo: new Set(), shaker: new Set(), cymbal: new Set() }]
        }
    });
    app.setMusicalKey('C Major', { updateSelect: false });
    return app;
}

test('parseKeyName understands major, minor, flat and shorthand keys', () => {
    const app = fixture();
    const cases = [
        ['E Minor', 'E', 'minor', false],
        ['Bb Major', 'Bb', 'major', true],
        ['C# Minor', 'C#', 'minor', false],
        ['Am', 'A', 'minor', false],
        ['F Major', 'F', 'major', true],
        ['D# Minor', 'D#', 'minor', false]
    ];
    for (const [name, rootName, mode, preferFlats] of cases) {
        const key = app.parseKeyName(name);
        assert.deepEqual([key.root, key.mode, key.preferFlats], [rootName, mode, preferFlats], name);
    }
    assert.equal(app.parseKeyName('not a key'), null);
});

test('setMusicalKey produces an in-key melody, bass and chord palette', () => {
    const app = fixture();
    assert.equal(app.setMusicalKey('E Minor'), true);
    assert.deepEqual(Array.from(app.getCurrentScale()), ['E4', 'F#4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5', 'A5', 'B5', 'C6', 'D6', 'E6', 'F#6']);
    assert.deepEqual(Array.from(app.bassNotes), ['E1', 'F#1', 'G1', 'A1', 'B1', 'C2', 'D2', 'E2', 'F#2', 'G2', 'A2', 'B2']);
    assert.deepEqual(Array.from(app.harmonicNotes), ['E3', 'G3', 'B3', 'E4', 'G4', 'B4', 'D5', 'F#5']);
    assert.equal(app.currentKey.name, 'E Minor');
});

test('legacy root/fifth/ninth chords gain the key third', () => {
    const app = fixture();
    app.setMusicalKey('E Minor');
    const chord = Array.from(app.ensureChordHasThird([0, 3, 5, 7]));
    assert(chord.includes(1));
    const pcs = chord.map(index => app.notePitchClass(app.harmonicNotes[index]));
    assert(pcs.includes(7)); // G, the minor third of E
    assert.deepEqual(Array.from(app.ensureChordHasThird([0, 1, 3, 5])), [0, 1, 3, 5]);
});

test('_voiceChord builds a close voicing and lifts colour tones above it', () => {
    const app = fixture();
    assert.deepEqual(Array.from(app._voiceChord(['C3', 'C4', 'G4', 'D5'])), ['C3', 'G3', 'D4']);
    assert.deepEqual(Array.from(app._voiceChord(['C3', 'E3', 'G3', 'B4'])), ['C3', 'E3', 'G3', 'B4']);
    assert.deepEqual(Array.from(app._voiceChord(['E3', 'G3', 'B3', 'D5'])), ['E3', 'G3', 'B3', 'D5']);
});

test('note lengths follow the next onset and wrap at the phrase end', () => {
    const app = fixture();
    const notes = new Map([[0, 0], [4, 2], [6, 4]]);
    assert.equal(app.noteLengthSeconds(notes, 0, 0.125), 0.46);
    assert.equal(app.noteLengthSeconds(notes, 4, 0.125), 0.23);
    assert.equal(app.nextOnsetStep(notes, 6), 16);
});

test('playback uses deterministic lengths and separates lead from melody', () => {
    const app = fixture();
    const played = [];
    app.melodySynth = { triggerAttackRelease: (note, duration, time, velocity) => played.push(['melody', note, duration]) };
    app.leadSynth = { triggerAttackRelease: (note, duration, time, velocity) => played.push(['lead', note, duration]) };
    app.bassSynth = { triggerAttackRelease: () => {} };
    app.polySynth = { triggerAttackRelease: () => {} };
    app.patternGroups.melody[0].set(0, 2);
    app.patternGroups.lead[0].set(0, 2);
    app.patternGroups.lead[0].set(2, 3);

    app._playStepAtTime(0, 10);
    app._playStepAtTime(2, 20);

    assert.deepEqual(played.filter(([part]) => part === 'melody'), [['melody', 'E4', 0.92]]);
    assert.deepEqual(played.filter(([part]) => part === 'lead'), [['lead', 'E5', 0.23], ['lead', 'F5', 0.92]]);
    for (const [, , duration] of played) assert.equal(typeof duration, 'number');
});

test('chord progressions assign a different in-key chord to each bar', () => {
    const app = fixture();
    app.setMusicalKey('E Minor', { updateSelect: false });
    app.patternLength = 32;
    app.currentGroupIndex = 0;
    app.patternGroups.harmonics = [new Set(), new Set()];
    app.patternGroups.melody = [new Map(), new Map()];
    app.patternGroups.bass = [new Map(), new Map()];
    app.patternGroups.lead = [new Map(), new Map()];
    app.groupChords = [null, null];
    app.harmonicNotes = app.buildKeyPalette(app.currentKey).harmonic;

    app.generateHarmonyFromChordProgression(0);

    assert.deepEqual(Array.from(app.groupChords[0]), ['E3', 'G3', 'B3']);
    assert.deepEqual(Array.from(app.groupChords[1]), ['A3', 'C4', 'E4']);
    assert.notDeepEqual(app.groupChords[0], app.groupChords[1]);
    assert.equal(app.harmonicsEnabled, true);
    assert(app.patternGroups.harmonics[0].size > 0);
    assert(app.patternGroups.harmonics[1].size > 0);
});

test('groove maps genres to deterministic swing amounts', () => {
    const app = fixture();
    assert.equal(app.setSwingForGenre('jazz'), 0.22);
    assert.equal(app.setSwingForGenre('rock'), 0.02);
    assert.equal(app.setSwingForGenre('pop'), 0);
    assert.equal(app.setSwingForGenre('unknown'), 0);
});

test('meter-aware step timing covers 4/4, 3/4, 2/4, 5/4 and 3/8', () => {
    const app = fixture();
    const cases = [
        ['4/4', 4, 16], ['3/4', 3, 12], ['2/4', 2, 8],
        ['3/8', 1.5, 6], ['5/4', 5, 20], ['bad', 4, 16]
    ];
    for (const [signature, quarterNotes, stepsPerBar] of cases) {
        app.timeSignature = signature;
        assert.equal(app.getBarQuarterNotes(), quarterNotes, signature);
        assert.equal(app.getStepsPerBar(), stepsPerBar, signature);
    }
});

test('setTimeSignature keeps the bar count and remaps notes into the new bar length', () => {
    const app = fixture();
    app.patternLength = 32;
    app.timeSignature = '4/4';
    app.patternGroups.melody = [new Map([[0, 0], [8, 2], [15, 4]]), new Map([[2, 1]])];
    app.patternGroups.bass = [new Map(), new Map()];
    app.patternGroups.lead = [new Map(), new Map()];
    app.patternGroups.harmonics = [new Set(), new Set()];
    app.patternGroups.rhythm = [
        { kick: new Set([0, 8]), snare: new Set(), hihat: new Set(), tom: new Set(), conga: new Set(), bongo: new Set(), shaker: new Set(), cymbal: new Set() },
        { kick: new Set([4]), snare: new Set(), hihat: new Set(), tom: new Set(), conga: new Set(), bongo: new Set(), shaker: new Set(), cymbal: new Set() }
    ];
    app.groupChords = [null, null];
    app.groupLoopCounts = [1, 1];
    app.melodyVelocity = new Map([[0, 0.5], [24, 0.7]]);
    app.harmonyVelocity = new Map();
    app.bassVelocity = new Map();
    app.leadVelocity = new Map();
    app.rhythmVelocity = { kick: new Map([[0, 0.6]]) };
    app.effectAutomation = { lowpass: new Map([[24, 50]]) };
    for (const name of ['rebuildGrids', 'createStepTimeline', 'createSectionTimelines', 'updatePatternLengthUI', 'createSectionRepeatsControl']) {
        app[name] = () => {};
    }

    app.setTimeSignature('3/4');

    assert.equal(app.timeSignature, '3/4');
    assert.equal(app.patternLength, 24);
    assert.equal(app.getBarCount(), 2);
    assert.equal(app.patternGroups.melody.length, 2);
    assert.deepEqual(Array.from(app.patternGroups.melody[0].entries(), ([step, row]) => [step, row]), [[0, 0], [6, 2], [11, 4]]);
    assert.deepEqual(Array.from(app.patternGroups.melody[1].entries(), ([step, row]) => [step, row]), [[2, 1]]);
    assert.deepEqual(Array.from(app.patternGroups.rhythm[0].kick), [0, 6]);
    assert.equal(app.melodyVelocity.get(18), 0.7);
    assert.equal(app.effectAutomation.lowpass.get(18), 50);
});

test('lead palette is one octave above melody and stays in ascending pitch order', () => {
    const app = fixture();
    app.setMusicalKey('C Major', { updateSelect: false });
    const scale = Array.from(app.getCurrentScale());
    const lead = Array.from(app.getLeadScale());
    const midi = note => {
        const match = note.match(/^([A-G])([#b]?)(-?\d+)$/);
        const pcs = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
        let pc = pcs[match[1]] + (match[2] === '#' ? 1 : match[2] === 'b' ? -1 : 0);
        return 12 * (Number(match[3]) + 1) + ((pc % 12) + 12) % 12;
    };
    assert.equal(lead.length, 16);
    for (let i = 0; i < lead.length; i++) {
        assert.equal(midi(lead[i]), midi(scale[i]) + 12);
        if (i) assert.ok(midi(lead[i]) > midi(lead[i - 1]), `lead row ${i} is not above row ${i - 1}`);
    }
});

test('playback durations follow the selected meter', () => {
    const app = fixture();
    const played = [];
    app.melodySynth = { triggerAttackRelease: (note, duration) => played.push([note, duration]) };
    app.bassSynth = { triggerAttackRelease: () => {} };
    app.leadSynth = { triggerAttackRelease: () => {} };
    app.polySynth = { triggerAttackRelease: () => {} };
    app.patternGroups.melody[0].set(0, 0);
    app.patternGroups.melody[0].set(4, 1);
    app.timeSignature = '3/4';
    app.tempo = 120;
    app._playStepAtTime(0, 0);
    // 12 sixteenth-note steps span 3 quarter notes at 120 BPM: 4 steps = 0.5s before the 0.92 factor.
    assert.ok(Math.abs(played[0][1] - 0.46) < 1e-9);
});

test('bar variation adds ghost hats and a fourth-bar fill deterministically', () => {
    const app = fixture();
    app._barPlayCount = 1;
    assert.equal(app._drumVariationVelocity('hihat', 3, false), 0.28);
    assert.equal(app._drumVariationVelocity('hihat', 4, false), 0);
    app._barPlayCount = 3;
    assert.equal(app._drumVariationVelocity('snare', 13, false), 0.5);
    assert.equal(app._drumVariationVelocity('snare', 15, false), 0.5);
    assert.equal(app._drumVariationVelocity('tom', 14, false), 0.55);
    assert.equal(app._drumVariationVelocity('tom', 14, true), null);
    app.timeSignature = '3/4';
    assert.equal(app._drumVariationVelocity('snare', 9, false), 0.5);
    assert.equal(app._drumVariationVelocity('snare', 11, false), 0.5);
    assert.equal(app._drumVariationVelocity('tom', 10, false), 0.55);
    assert.equal(app._drumVariationVelocity('snare', 13, false), 0);
});
