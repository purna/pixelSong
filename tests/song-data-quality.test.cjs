const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function loadApp() {
    const context = {
        console: { log() {}, warn() {}, error() {} },
        document: { getElementById: () => null, querySelector: () => null, createElement: () => ({}) },
        Tone: { Transport: { bpm: { value: 120 } } },
        window: {}
    };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(path.join(root, 'js/songDesigner.js'), 'utf8') + '\nwindow.App=SongDesignerApp;', context);
    const app = Object.create(context.window.App.prototype);
    app.scales = {};
    app.keyScaleIds = {};
    return app;
}

test('every catalogue key parses and every song chord is playable in that key', () => {
    const app = loadApp();
    const files = fs.readdirSync(path.join(root, 'data/songs')).filter(file => file.endsWith('.json'));
    let arrangements = 0;
    const keys = new Set();

    for (const file of files) {
        const data = JSON.parse(fs.readFileSync(path.join(root, 'data/songs', file), 'utf8'));
        assert.equal(data.genre, file.split('_')[0], file);
        for (const song of data.songs) {
            keys.add(song.keyName);
            const key = app.parseKeyName(song.keyName);
            assert(key, `${file}/${song.key}: unparseable key ${song.keyName}`);
            app.setMusicalKey(key, { updateSelect: false });

            const chord = Array.from(app.ensureChordHasThird(song.harmonics));
            assert(chord.length >= 3, `${song.key}: chord is too small`);
            const thirdPc = (key.pitchClass + (key.mode === 'minor' ? 3 : 4)) % 12;
            assert(
                chord.some(index => app.notePitchClass(app.harmonicNotes[index]) === thirdPc),
                `${song.key}: chord has no third`
            );

            for (const [noteKey, active] of Object.entries(song.melody || {})) {
                if (!active) continue;
                const [step, row] = noteKey.split('-').map(Number);
                assert(step >= 0 && step < song.patternLength, `${song.key}: melody step ${step}`);
                assert(row >= 0 && row < 8, `${song.key}: melody row ${row}`);
            }
            for (const [noteKey, active] of Object.entries(song.lead || {})) {
                if (!active) continue;
                const [step, row] = noteKey.split('-').map(Number);
                assert(step >= 0 && step < song.patternLength, `${song.key}: lead step ${step}`);
                assert(row >= 0 && row < 8, `${song.key}: lead row ${row}`);
            }
            for (const [noteKey, active] of Object.entries(song.bass || {})) {
                if (!active) continue;
                const [step, row] = noteKey.split('-').map(Number);
                assert(step >= 0 && step < song.patternLength, `${song.key}: bass step ${step}`);
                assert(row >= 0 && row < 12, `${song.key}: bass row ${row}`);
            }
            arrangements++;
        }
    }

    assert.equal(arrangements, 840);
    assert(keys.size >= 20);
});

test('every key palette spans the full octave and two-octave bass range', () => {
    const app = loadApp();
    const keyNames = ['C Major', 'E Minor', 'Bb Major', 'C# Minor', 'F Major', 'D Minor', 'Am', 'D# Minor'];
    for (const keyName of keyNames) {
        const key = app.parseKeyName(keyName);
        app.setMusicalKey(key, { updateSelect: false });
        const scale = Array.from(app.getCurrentScale());
        assert.equal(scale.length, 16, keyName);
        assert.equal(app.bassNotes.length, 12, keyName);
        assert.equal(app.harmonicNotes.length, 8, keyName);
        assert.equal(app.notePitchClass(scale[0]), key.pitchClass, keyName);
        assert.equal(app.notePitchClass(scale[7]), key.pitchClass, keyName);
        assert.equal(app.notePitchClass(scale[14]), key.pitchClass, keyName);
        assert.equal(app.notePitchClass(app.bassNotes[0]), key.pitchClass, keyName);
        assert.equal(app.notePitchClass(app.bassNotes[7]), key.pitchClass, keyName);
    }
});
