// Tune Helper: a short motif, musical repetition, and an editable backing groove.
(function () {
    const proto = SongDesignerApp.prototype;
    const setup = proto.setupEventListeners;
    const drums = ['kick', 'snare', 'hihat', 'tom', 'conga', 'bongo', 'shaker', 'cymbal'];
    const fields = ['patternLength', 'currentGroupIndex', 'groupLoopCounts', 'patternGroups', 'melodyVelocity', 'bassVelocity', 'leadVelocity', 'harmonyVelocity', 'rhythmVelocity', 'harmonicsEnabled', 'melodyEnabled', 'bassEnabled', 'leadEnabled', 'rhythmEnabled', 'percussionEnabled'];

    function refresh(app) {
        app.initializePatternGroups();
        app.rebuildGrids();
        app.createSectionTimelines();
        app.createStepTimeline();
        app.updatePatternLengthUI();
        app.createSectionRepeatsControl();
        app.updateHarmonicsUI();
        ['harmonics', 'melody', 'bass', 'lead', 'rhythm', 'percussion'].forEach(name => {
            const buttonId = name === 'melody' ? 'stringsToggle' : name === 'rhythm' ? 'rhythmSectionToggle' : name + 'Toggle';
            const button = document.getElementById(buttonId);
            if (button) {
                button.classList.toggle('active', app[name + 'Enabled']);
                button.textContent = app[name + 'Enabled'] ? 'ON' : 'OFF';
            }
            const sectionId = name === 'melody' ? 'stringsSection' : name + 'Section';
            const content = document.querySelector('#' + sectionId + ' .section-content');
            if (content) {
                content.classList.toggle('disabled', !app[name + 'Enabled']);
                content.querySelectorAll('select, button, input[type="range"]').forEach(control => {
                    control.disabled = !app[name + 'Enabled'];
                });
            }
        });
    }

    proto.createHelperTune = function ({ mood = 'bright', energy = 'steady', scope = 'full' } = {}) {
        if (this.isPlaying) this.stop();
        this._tuneHelperUndo = structuredClone(Object.fromEntries(fields.map(key => [key, this[key]])));
        const scale = this.getCurrentScale();
        const count = this.patternLength / 16;
        const pick = values => values[Math.floor(Math.random() * values.length)];
        const busy = energy === 'lively', calm = energy === 'gentle';
        const steps = calm ? [0, 4, 8, 12] : busy ? [0, 2, 3, 6, 8, 10, 11, 14] : [0, 2, 4, 8, 10, 12];
        const contours = mood === 'dreamy' ? [[4, 2, 4, 6], [2, 4, 6, 4]] : mood === 'moody' ? [[4, 3, 2, 0], [6, 4, 3, 2]] : [[0, 2, 4, 2], [2, 4, 6, 4]];
        const contour = pick(contours);
        const motif = steps.map((step, i) => [step, contour[i % contour.length]]);
        const pitch = note => note.replace(/-?\d+$/, '');
        const bassIndex = degree => this.bassNotes.findIndex(note => pitch(note) === pitch(scale[degree]));
        const tonicHarmony = this.harmonicNotes.map((note, i) => [note, i]).filter(([note]) => [0, 2, 4].some(degree => pitch(scale[degree]) === pitch(note))).map(([, i]) => i);

        for (let g = 0; g < count; g++) {
            const melody = new Map(motif);
            // Repeat the idea, then give alternate bars an answering phrase.
            if (g % 2) melody.set(steps[steps.length - 2], mood === 'moody' ? 1 : 4);
            melody.set(steps[steps.length - 1], g === count - 1 ? 0 : 2);
            this.patternGroups.melody[g] = melody;
            for (const [step] of melody) this.melodyVelocity.set(g * 16 + step, step % 4 === 0 ? 0.8 : 0.64);
            if (scope === 'melody') continue;
            this.patternGroups.harmonics[g] = new Set(tonicHarmony);
            this.patternGroups.lead[g] = new Map();
            this.patternGroups.bass[g] = new Map();
            (calm ? [0, 8] : [0, 6, 8, 14]).forEach((step, i) => {
                const row = bassIndex(i % 2 ? 4 : 0);
                if (row >= 0) this.patternGroups.bass[g].set(step, row);
                this.bassVelocity.set(g * 16 + step, i % 2 ? 0.65 : 0.8);
            });
            const rhythm = Object.fromEntries(drums.map(name => [name, new Set()]));
            (busy ? [0, 4, 8, 12] : [0, 8]).forEach(step => rhythm.kick.add(step));
            [4, 12].forEach(step => rhythm.snare.add(step));
            for (let step = 0; step < 16; step += calm ? 4 : 2) rhythm.hihat.add(step);
            if (busy && g === count - 1) [14, 15].forEach(step => rhythm.tom.add(step));
            this.patternGroups.rhythm[g] = rhythm;
            drums.forEach(name => rhythm[name].forEach(step => this.rhythmVelocity[name].set(g * 16 + step, name === 'hihat' ? (step % 4 ? 0.38 : 0.52) : 0.75)));
        }
        this.melodyEnabled = true;
        if (scope === 'full') {
            this.harmonicsEnabled = tonicHarmony.length > 0;
            this.bassEnabled = this.rhythmEnabled = true;
            this.leadEnabled = this.percussionEnabled = false;
        }
        refresh(this);
        return `${scope === 'melody' ? 'Melody' : 'Tune'} created in your selected scale across ${count} bar${count > 1 ? 's' : ''}. Press Play to listen, or edit the notes below.`;
    };

    proto.setupEventListeners = function () {
        setup.call(this);
        const status = document.getElementById('tuneHelperStatus');
        const undo = document.getElementById('undoHelperTune');
        document.getElementById('createHelperTune')?.addEventListener('click', () => {
            status.textContent = this.createHelperTune({
                mood: document.getElementById('tuneMood').value,
                energy: document.getElementById('tuneEnergy').value,
                scope: document.getElementById('tuneScope').value
            });
            undo.disabled = false;
        });
        undo?.addEventListener('click', () => {
            if (!this._tuneHelperUndo) return;
            if (this.isPlaying) this.stop();
            Object.assign(this, this._tuneHelperUndo);
            this._tuneHelperUndo = null;
            refresh(this);
            undo.disabled = true;
            status.textContent = 'Your previous patterns have been restored.';
        });
    };
})();
