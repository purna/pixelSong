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

    proto.refreshTuneParts = function () { refresh(this); };

    proto.createHelperTune = async function ({ mood = 'bright', energy = 'steady', scope = 'full' } = {}) {
        const length = this.patternLength;
        this._songLoadRequest = (this._songLoadRequest || 0) + 1;
        if (!['bright', 'dreamy', 'moody'].includes(mood) || !['gentle', 'steady', 'lively'].includes(energy) || !['full', 'melody'].includes(scope) || ![16, 32, 64].includes(length)) throw new Error('Choose a supported tune option and 16, 32 or 64 steps.');
        const scale = [...this.getCurrentScale()];
        const request = this._helperRequest = (this._helperRequest || 0) + 1;
        const preset = await window.loadPresetData(`data/tune-helper/${mood}-${energy}-${length}.json`);
        if (request !== this._helperRequest || this.patternLength !== length || this.getCurrentScale().join() !== scale.join()) throw new Error('Your selection changed while loading. Press Create tune again.');
        // Validate and prepare every part before replacing the current tune.
        if (preset.schemaVersion !== 1 || preset.patternLength !== length || preset.mood !== mood || preset.energy !== energy || preset.groups?.length !== length / 16) throw new Error('This tune file does not match the selected options.');
        const validStep = step => Number.isInteger(step) && step >= 0 && step < 16;
        const validVelocity = value => Number.isFinite(value) && value >= 0 && value <= 1;
        const degreeValid = degree => Number.isInteger(degree) && degree >= 0 && degree < scale.length;
        const pitch = note => note.replace(/-?\d+$/, '');
        const groups = preset.groups.map(group => {
            const prepared = {};
            if (!Array.isArray(group.harmonyDegrees) || !group.harmonyDegrees.length || !group.harmonyDegrees.every(degreeValid) || !validVelocity(group.harmonyVelocity)) throw new Error('Invalid harmony in tune file.');
            prepared.harmonics = new Set(this.harmonicNotes.flatMap((note, i) => group.harmonyDegrees.some(degree => pitch(scale[degree]) === pitch(note)) ? [i] : []));
            for (const name of ['melody', 'lead', 'bass']) {
                if (!Array.isArray(group[name]) || !group[name].length) throw new Error('Missing tune part.');
                const seen = new Set();
                prepared[name] = group[name].map(entry => {
                    if (!Array.isArray(entry) || entry.length !== 3 || !validStep(entry[0]) || !degreeValid(entry[1]) || !validVelocity(entry[2]) || seen.has(entry[0])) throw new Error('Invalid notes in tune file.');
                    seen.add(entry[0]);
                    const row = name === 'bass' ? this.bassNotes.findIndex(note => pitch(note) === pitch(scale[entry[1]])) : entry[1];
                    if (row < 0) throw new Error('This tune uses a bass note unavailable in the selected scale.');
                    return [entry[0], row, entry[2]];
                });
            }
            prepared.rhythm = {};
            for (const name of drums) {
                const entries = group.rhythm?.[name];
                if (!Array.isArray(entries) || entries.some(entry => !Array.isArray(entry) || entry.length !== 2 || !validStep(entry[0]) || !validVelocity(entry[1]))) throw new Error('Invalid rhythm in tune file.');
                prepared.rhythm[name] = entries;
            }
            return prepared;
        });
        for (const name of ['melody', 'rhythm', 'bass', 'lead', 'percussion']) {
            const position = preset.stage?.positions?.[name];
            if (!Array.isArray(position) || position.length !== 2 || position.some(value => !Number.isFinite(value) || value < 0 || value > 100)) throw new Error('Invalid stage layout in tune file.');
        }
        if (this.isPlaying) this.stop();
        this._tuneHelperUndo = structuredClone(Object.fromEntries(fields.map(key => [key, this[key]])));
        const stage = window.StageManager;
        this._tuneHelperStageUndo = scope === 'full' && stage?.stageArea ? {
            instruments: structuredClone(stage.instruments),
            active: stage.stageToggle?.classList.contains('active') ?? true
        } : null;
        const parts = scope === 'full' ? ['melody', 'lead', 'bass'] : ['melody'];
        for (const name of parts) this[name + 'Velocity'] = new Map();
        if (scope === 'full') {
            this.harmonyVelocity = new Map();
            this.rhythmVelocity = Object.fromEntries(drums.map(name => [name, new Map()]));
            this.groupLoopCounts = [1, 1, 1, 1];
        }
        groups.forEach((group, g) => {
            for (const name of parts) {
                this.patternGroups[name][g] = new Map(group[name].map(([step, row]) => [step, row]));
                group[name].forEach(([step, , velocity]) => this[name + 'Velocity'].set(g * 16 + step, velocity));
            }
            if (scope === 'melody') return;
            this.patternGroups.harmonics[g] = group.harmonics;
            this.harmonyVelocity.set(g * 16, preset.groups[g].harmonyVelocity);
            this.patternGroups.rhythm[g] = Object.fromEntries(drums.map(name => [name, new Set(group.rhythm[name].map(([step]) => step))]));
            drums.forEach(name => group.rhythm[name].forEach(([step, velocity]) => this.rhythmVelocity[name].set(g * 16 + step, velocity)));
        });
        this.melodyEnabled = true;
        if (scope === 'full') {
            this.harmonicsEnabled = this.bassEnabled = this.rhythmEnabled = this.leadEnabled = this.percussionEnabled = true;
            if (stage?.stageArea) {
                Object.entries(preset.stage.positions).forEach(([name, [x, y]]) => {
                    Object.assign(stage.instruments[name], {x, y, startPos: (x - 50) * 2, endPos: 0, movement: 'static'});
                });
                stage.renderMarkers();
                if (stage.selectedInstrument) stage.selectInstrument(stage.selectedInstrument);
                if (stage.stageToggle && !stage.stageToggle.classList.contains('active')) stage.toggleStage();
                stage.saveToStorage();
            }
        }
        this.setTempo(this.tempo);
        refresh(this);
        return `${scope === 'melody' ? 'Melody' : 'Full tune'} loaded: ${length} steps (${length / 16} bar${length > 16 ? 's' : ''}).${scope === 'full' && stage?.stageArea ? ' All musical parts and stage positions are ready.' : ''} Press Play to listen, or edit the notes below.`;
    };

    proto.setupEventListeners = function () {
        setup.call(this);
        const status = document.getElementById('tuneHelperStatus');
        const undo = document.getElementById('undoHelperTune');
        const create = document.getElementById('createHelperTune');
        create?.addEventListener('click', async () => {
            create.disabled = true;
            status.textContent = 'Loading your tune…';
            try {
                status.textContent = await this.createHelperTune({
                    mood: document.getElementById('tuneMood').value,
                    energy: document.getElementById('tuneEnergy').value,
                    scope: document.getElementById('tuneScope').value
                });
                undo.disabled = false;
                const song = document.getElementById('songSelect');
                if (song) song.value = ''; // This tune is now independent of the song catalogue.
            } catch (error) {
                status.textContent = error.message;
            } finally {
                create.disabled = false;
            }
        });
        undo?.addEventListener('click', () => {
            this._helperRequest = (this._helperRequest || 0) + 1;
            if (!this._tuneHelperUndo) return;
            if (this.isPlaying) this.stop();
            Object.assign(this, this._tuneHelperUndo);
            this._tuneHelperUndo = null;
            const stage = window.StageManager;
            if (this._tuneHelperStageUndo && stage?.stageArea) {
                stage.instruments = this._tuneHelperStageUndo.instruments;
                stage.renderMarkers();
                if (stage.selectedInstrument) stage.selectInstrument(stage.selectedInstrument);
                if (stage.stageToggle && stage.stageToggle.classList.contains('active') !== this._tuneHelperStageUndo.active) stage.toggleStage();
                stage.saveToStorage();
            }
            this._tuneHelperStageUndo = null;
            refresh(this);
            undo.disabled = true;
            status.textContent = 'Your previous patterns and any replaced stage layout have been restored.';
        });
    };
})();
