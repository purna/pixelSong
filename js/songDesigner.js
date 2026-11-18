// Song Designer App
class SongDesignerApp {
    constructor() {
        this.audioEngine = null;
        this.polySynth = null;
        this.melodySynth = null;
        this.drums = null;
        this.effects = null;
        this.isPlaying = false;
        this.tempo = 120;
        this.timeSignature = '4/4';
        this.swing = 0;
        this.currentStep = 0;
        this.loopInterval = null;
        this.harmonicsEnabled = true;
        this.melodyEnabled = true;
        this.rhythmEnabled = true;
        this.effectsEnabled = true;
        this.patternLength = 16; // 16, 32, or 64 steps
        this.harmonicRows = new Map(); // step -> Set of harmonic indices
        this.melodyRows = new Map();
        this.rhythm = { 
            kick: new Set(), 
            snare: new Set(), 
            hihat: new Set(), 
            tom: new Set(),
            conga: new Set(),
            bongo: new Set(),
            shaker: new Set(),
            cymbal: new Set()
        };
        this.scales = {
            'c-major': ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6', 'D6'],
            'g-major': ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5', 'A5', 'B5', 'C6', 'D6', 'E6', 'F#6', 'G6', 'A6'],
            'f-major': ['F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'Bb5', 'C6', 'D6', 'E6', 'F6', 'G6'],
            'd-minor': ['D4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'Bb5', 'C6', 'D6', 'E6'],
            'a-minor': ['A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6', 'D6', 'E6', 'F6', 'G6', 'A6', 'B6']
        };
        this.harmonicNotes = ['C3', 'E3', 'G3', 'C4', 'E4', 'G4', 'B4', 'D5'];
        
        // Instrument configurations
        this.harmonicInstruments = {
            'fm': { synth: Tone.FMSynth, opts: { harmonicity: 3, modulationIndex: 10, oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 1.5 } } },
            'piano': { synth: Tone.PolySynth, opts: { synth: Tone.Synth, envelope: { attack: 0.005, decay: 0.5, sustain: 0.3, release: 1.5 } } },
            'pad': { synth: Tone.PolySynth, opts: { synth: Tone.AMSynth, envelope: { attack: 0.5, decay: 0.5, sustain: 0.8, release: 2 }, modulation: { type: 'sine' } } },
            'bell': { synth: Tone.PolySynth, opts: { synth: Tone.MetalSynth, envelope: { attack: 0.001, decay: 1, sustain: 0, release: 0.5 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000 } },
            'pluck': { synth: Tone.PolySynth, opts: { synth: Tone.PluckSynth, envelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.5 } } }
        };
        
        this.melodyInstruments = {
            'saw': { synth: Tone.PolySynth, opts: { oscillator: { type: 'fatsawtooth', count: 3, spread: 30 }, envelope: { attack: 0.02, decay: 0.1, sustain: 0.4, release: 0.8 } } },
            'square': { synth: Tone.PolySynth, opts: { oscillator: { type: 'fatsquare', count: 2, spread: 10 }, envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.5 } } },
            'sine': { synth: Tone.PolySynth, opts: { oscillator: { type: 'fatsine', count: 2, spread: 20 }, envelope: { attack: 0.02, decay: 0.2, sustain: 0.5, release: 1 } } },
            'triangle': { synth: Tone.PolySynth, opts: { oscillator: { type: 'fattriangle', count: 2, spread: 15 }, envelope: { attack: 0.02, decay: 0.15, sustain: 0.4, release: 0.6 } } },
            'supersaw': { synth: Tone.PolySynth, opts: { oscillator: { type: 'fatsawtooth', count: 5, spread: 20 }, envelope: { attack: 0.03, decay: 0.2, sustain: 0.4, release: 0.6 } } }
        };
        
        this.drumKits = {
            'acoustic': {
                kick: { synth: Tone.MembraneSynth, opts: { pitchDecay: 0.05, octaves: 8, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1 } } },
                snare: { synth: Tone.NoiseSynth, opts: { noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.15 } } },
                hihat: { synth: Tone.MetalSynth, opts: { frequency: 200, envelope: { attack: 0.001, decay: 0.08, release: 0.01 }, harmonicity: 5.1, modulationIndex: 32, resonance: 5000, octaves: 2 } },
                tom: { synth: Tone.MembraneSynth, opts: { pitchDecay: 0.06, octaves: 5, oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.25, sustain: 0.01, release: 0.25 } } }
            },
            'electronic': {
                kick: { synth: Tone.MembraneSynth, opts: { pitchDecay: 0.02, octaves: 10, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.3 } } },
                snare: { synth: Tone.NoiseSynth, opts: { noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 } } },
                hihat: { synth: Tone.MetalSynth, opts: { frequency: 800, envelope: { attack: 0.001, decay: 0.05, release: 0.01 }, harmonicity: 3, modulationIndex: 10, resonance: 8000, octaves: 1.5 } },
                tom: { synth: Tone.MembraneSynth, opts: { pitchDecay: 0.03, octaves: 8, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 } } }
            },
            '808': {
                kick: { synth: Tone.MembraneSynth, opts: { pitchDecay: 0.008, octaves: 12, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.25 } } },
                snare: { synth: Tone.NoiseSynth, opts: { noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 } } },
                hihat: { synth: Tone.MetalSynth, opts: { frequency: 1000, envelope: { attack: 0.001, decay: 0.03, release: 0.01 }, harmonicity: 2, modulationIndex: 5, resonance: 10000, octaves: 1 } },
                tom: { synth: Tone.MembraneSynth, opts: { pitchDecay: 0.01, octaves: 10, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 } } }
            }
        };
        
        this.currentHarmonicInstrument = 'fm';
        this.currentMelodyInstrument = 'supersaw';
        this.currentBassInstrument = 'synth';
        this.currentLeadInstrument = 'saw';
        this.currentDrumKit = 'electronic';

        // Tonal centre applied by song presets. The fixed tables above remain the
        // fallback for hand-built patterns.
        this.currentKey = { root: 'C', pitchClass: 0, mode: 'major', preferFlats: false, name: 'C Major' };
        this.keyScaleIds = {};
        this.currentPercussionKit = 'latin';
        this.bassOctave = 1;
        
        // Pattern groups for multi-16-step navigation
        this.currentGroupIndex = 0;
        this.patternGroups = {
            harmonics: [new Set(), new Set(), new Set(), new Set()],
            melody: [new Map(), new Map(), new Map(), new Map()],
            bass: [new Map(), new Map(), new Map(), new Map()],
            lead: [new Map(), new Map(), new Map(), new Map()],
            rhythm: [
                { kick: new Set(), snare: new Set(), hihat: new Set(), tom: new Set(), conga: new Set(), bongo: new Set(), shaker: new Set(), cymbal: new Set() },
                { kick: new Set(), snare: new Set(), hihat: new Set(), tom: new Set(), conga: new Set(), bongo: new Set(), shaker: new Set(), cymbal: new Set() },
                { kick: new Set(), snare: new Set(), hihat: new Set(), tom: new Set(), conga: new Set(), bongo: new Set(), shaker: new Set(), cymbal: new Set() },
                { kick: new Set(), snare: new Set(), hihat: new Set(), tom: new Set(), conga: new Set(), bongo: new Set(), shaker: new Set(), cymbal: new Set() }
            ]
        };
        
        // Explicit per-bar chords generated by the progression builder. When a
        // slot is null the harmonics grid for that bar is used instead.
        this.groupChords = [null, null, null, null];

        this.harmonics = this.patternGroups.harmonics[0];
        this.melodyRows = this.patternGroups.melody[0];
        this.bassRows = this.patternGroups.bass[0];
        this.leadRows = this.patternGroups.lead[0];
        this.rhythm = this.patternGroups.rhythm[0];
        
        this.bassInstruments = {
            'sub': { synth: Tone.MonoSynth, opts: { oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.5 }, filterEnvelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.5, baseFrequency: 200, octaves: 2 } } },
            'synth': { synth: Tone.MonoSynth, opts: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.4 }, filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.4, baseFrequency: 300, octaves: 3 } } },
            'fm': { synth: Tone.FMSynth, opts: { harmonicity: 3, modulationIndex: 10, oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.8 } } },
            'square': { synth: Tone.MonoSynth, opts: { oscillator: { type: 'square' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.3 } } }
        };
        
        this.leadInstruments = {
            'saw': { synth: Tone.PolySynth, opts: { oscillator: { type: 'fatsawtooth', count: 3, spread: 30 }, envelope: { attack: 0.02, decay: 0.1, sustain: 0.4, release: 0.8 } } },
            'square': { synth: Tone.PolySynth, opts: { oscillator: { type: 'fatsquare', count: 2, spread: 10 }, envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.5 } } },
            'sine': { synth: Tone.PolySynth, opts: { oscillator: { type: 'fatsine', count: 2, spread: 20 }, envelope: { attack: 0.02, decay: 0.2, sustain: 0.5, release: 1 } } },
            'triangle': { synth: Tone.PolySynth, opts: { oscillator: { type: 'fattriangle', count: 2, spread: 15 }, envelope: { attack: 0.02, decay: 0.15, sustain: 0.4, release: 0.6 } } },
            'pulse': { synth: Tone.PolySynth, opts: { oscillator: { type: 'pulse', width: 0.2 }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.4 } } },
            'supersaw': { synth: Tone.PolySynth, opts: { oscillator: { type: 'fatsawtooth', count: 5, spread: 20 }, envelope: { attack: 0.03, decay: 0.2, sustain: 0.4, release: 0.6 } } }
        };
        
        this.percussionKits = {
            'latin': {
                conga: { synth: Tone.MembraneSynth, opts: { pitchDecay: 0.04, octaves: 4, oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.2 } } },
                bongo: { synth: Tone.MembraneSynth, opts: { pitchDecay: 0.03, octaves: 3, oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 } } },
                shaker: { synth: Tone.NoiseSynth, opts: { noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.05, sustain: 0.02, release: 0.05 } } },
                cymbal: { synth: Tone.MetalSynth, opts: { frequency: 400, envelope: { attack: 0.001, decay: 0.3, sustain: 0.05, release: 0.3 }, harmonicity: 3, modulationIndex: 8, resonance: 6000, octaves: 2 } }
            },
            'acoustic': {
                conga: { synth: Tone.MembraneSynth, opts: { pitchDecay: 0.05, octaves: 4, oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.25, sustain: 0, release: 0.25 } } },
                bongo: { synth: Tone.MembraneSynth, opts: { pitchDecay: 0.04, octaves: 3, oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.15, sustain: 0, release: 0.15 } } },
                shaker: { synth: Tone.NoiseSynth, opts: { noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.08, sustain: 0.01, release: 0.08 } } },
                cymbal: { synth: Tone.MetalSynth, opts: { frequency: 300, envelope: { attack: 0.001, decay: 0.4, sustain: 0.03, release: 0.4 }, harmonicity: 2.5, modulationIndex: 10, resonance: 5000, octaves: 3 } }
            },
            'electronic': {
                conga: { synth: Tone.MembraneSynth, opts: { pitchDecay: 0.02, octaves: 5, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.15 } } },
                bongo: { synth: Tone.MembraneSynth, opts: { pitchDecay: 0.02, octaves: 4, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 } } },
                shaker: { synth: Tone.NoiseSynth, opts: { noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.03, sustain: 0.01, release: 0.03 } } },
                cymbal: { synth: Tone.MetalSynth, opts: { frequency: 600, envelope: { attack: 0.001, decay: 0.2, sustain: 0.02, release: 0.2 }, harmonicity: 4, modulationIndex: 6, resonance: 8000, octaves: 1.5 } }
            }
        };
        
        this.chordProgressions = {
            'c-major': {
                name: 'C Major', key: 'C', scale: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
                chords: {
                    'I': ['C', 'E', 'G'], 'ii': ['D', 'F', 'A'], 'iii': ['E', 'G', 'B'],
                    'IV': ['F', 'A', 'C'], 'V': ['G', 'B', 'D'], 'vi': ['A', 'C', 'E'], 'vii°': ['B', 'D', 'F']
                },
                progressions: [
                    ['I', 'IV', 'V', 'I'], ['I', 'vi', 'IV', 'V'], ['I', 'IV', 'I', 'V'],
                    ['vi', 'IV', 'I', 'V'], ['I', 'V', 'vi', 'IV'], ['IV', 'I', 'V', 'vi'],
                    ['I', 'IV', 'vi', 'V'], ['ii', 'V', 'I']
                ]
            },
            'g-major': {
                name: 'G Major', key: 'G', scale: ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
                chords: {
                    'I': ['G', 'B', 'D'], 'ii': ['A', 'C', 'E'], 'iii': ['B', 'D', 'F#'],
                    'IV': ['C', 'E', 'G'], 'V': ['D', 'F#', 'A'], 'vi': ['E', 'G', 'B'], 'vii°': ['F#', 'A', 'C']
                },
                progressions: [['I', 'IV', 'V', 'I'], ['I', 'vi', 'IV', 'V'], ['I', 'V', 'vi', 'IV'], ['IV', 'I', 'V', 'vi']]
            },
            'f-major': {
                name: 'F Major', key: 'F', scale: ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
                chords: {
                    'I': ['F', 'A', 'C'], 'ii': ['G', 'Bb', 'D'], 'iii': ['A', 'C', 'E'],
                    'IV': ['Bb', 'D', 'F'], 'V': ['C', 'E', 'G'], 'vi': ['D', 'F', 'A'], 'vii°': ['E', 'G', 'Bb']
                },
                progressions: [['I', 'IV', 'V', 'I'], ['I', 'vi', 'IV', 'V'], ['IV', 'V', 'I', 'vi']]
            },
            'd-minor': {
                name: 'D Minor', key: 'Dm', scale: ['D', 'E', 'F', 'G', 'A', 'Bb', 'C'],
                chords: {
                    'i': ['D', 'F', 'A'], 'ii°': ['E', 'G', 'Bb'], 'III': ['F', 'A', 'C'],
                    'iv': ['G', 'Bb', 'D'], 'v': ['A', 'C', 'E'], 'VI': ['Bb', 'D', 'F'], 'VII': ['C', 'E', 'G']
                },
                progressions: [['i', 'iv', 'v', 'i'], ['i', 'VI', 'III', 'VII'], ['i', 'iv', 'i', 'v'], ['VI', 'iv', 'i', 'v']]
            },
            'a-minor': {
                name: 'A Minor', key: 'Am', scale: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
                chords: {
                    'i': ['A', 'C', 'E'], 'ii°': ['B', 'D', 'F'], 'III': ['C', 'E', 'G'],
                    'iv': ['D', 'F', 'A'], 'v': ['E', 'G', 'B'], 'VI': ['F', 'A', 'C'], 'VII': ['G', 'B', 'D']
                },
                progressions: [['i', 'iv', 'v', 'i'], ['i', 'VI', 'III', 'VII'], ['i', 'v', 'iv', 'i']]
            }
        };
        
        this.scaleToChordKey = { 'c-major': 'c-major', 'g-major': 'g-major', 'f-major': 'f-major', 'd-minor': 'd-minor', 'a-minor': 'a-minor' };
        
        this.melodyVelocity = new Map();
        this.harmonyVelocity = new Map();
        this.leadVelocity = new Map();
        this.bassVelocity = new Map();
        this.rhythmVelocity = { kick: new Map(), snare: new Map(), hihat: new Map(), tom: new Map(), conga: new Map(), bongo: new Map(), shaker: new Map(), cymbal: new Map() };
        
        this.effectAutomation = { lowpass: new Map() };
        
        this.bassEnabled = true;
        this.leadEnabled = true;
        this.percussionEnabled = false;
        
        this.bassRows = new Map();
        this.leadRows = new Map();
        this.bassNotes = ['C1', 'D1', 'E1', 'F1', 'G1', 'A1', 'B1', 'C2', 'D2', 'E2', 'F2', 'G2'];
        
        this.harmonyPanner = null;
        this.melodyPanner = null;
        this.leadPanner = null;
        this.bassPanner = null;
        this.drumPanners = {};
        this.percussionPanners = {};
        
        this.copyMode = false;
        this.pasteMode = false;
        this.copiedCells = [];
        this.sourceGroupIndex = null;
        
        this.groupLoopCounts = [1, 1, 1, 1];
        this.groupLoopCurrent = [0, 0, 0, 0];
        this.sectionVisibility = {
            harmonics: true,
            melody: true,
            rhythm: true,
            bass: true,
            lead: true,
            percussion: true
        };
    }
    
    getStepGroupDefinitions() {
        const stepsPerBar = this.getStepsPerBar();
        const barCount = this.getBarCount();
        const namedSections = {
            1: ['Peak'],
            2: ['Develop', 'Peak'],
            4: ['Build Up', 'Develop', 'Peak', 'Resolve']
        };
        const names = namedSections[barCount] || Array.from({ length: barCount }, (_, i) => `Bar ${i + 1}`);
        const colors = ['#34d399', '#60a5fa', '#f472b6', '#a78bfa'];

        return names.map((name, index) => {
            const start = index * stepsPerBar;
            const end = start + stepsPerBar - 1;
            return {
                name,
                color: colors[index % colors.length],
                range: `${start + 1}-${end + 1}`,
                start,
                end,
                sourceStart: start,
                sourceEnd: end
            };
        });
    }
    
    setGroupLoopCount(groupIndex, count) {
        this.groupLoopCounts[groupIndex] = parseInt(count);
        this.showNotification(`Group ${this.getStepGroupDefinitions()[groupIndex].name}: ${count}x loop`, 'info');
    }
    
    toggleCopyMode(instrument) {
        if (this.copyMode && this.sourceGroupIndex !== null) {
            this.finalizeCopy(instrument);
        } else {
            this.copyMode = true;
            this.pasteMode = false;
            this.sourceGroupIndex = this.currentGroupIndex;
            this.copiedCells = [];
            this.showNotification('Copy mode: Click cells to select, then click Copy again', 'info');
        }
        this.updateCopyPasteUI();
    }
    
    togglePasteMode(instrument) {
        if (this.copyMode) this.cancelCopy();
        if (this.pasteMode) {
            this.pasteMode = false;
            this.showNotification('Paste mode cancelled', 'info');
        } else {
            if (this.copiedCells.length === 0) {
                this.showNotification('No cells copied! Use Copy first', 'warning');
                return;
            }
            this.pasteMode = true;
            this.showNotification('Paste mode: Click target position to paste', 'info');
        }
        this.updateCopyPasteUI();
    }
    
    toggleCellSelection(row, col, instrument) {
        if (!this.copyMode) return;
        const existingIndex = this.copiedCells.findIndex(cell => cell.row === row && cell.col === col);
        if (existingIndex >= 0) {
            this.copiedCells.splice(existingIndex, 1);
        } else {
            this.copiedCells.push({ row, col });
        }
        this.updateCopyPasteUI();
    }
    
    finalizeCopy(instrument) {
        if (this.copiedCells.length === 0) {
            this.showNotification('No cells selected!', 'warning');
            this.cancelCopy();
            return;
        }
        this.copyMode = false;
        const sourceName = this.getStepGroupDefinitions()[this.sourceGroupIndex].name;
        this.showNotification(`Copied ${this.copiedCells.length} cells from ${sourceName}`, 'success');
        this.pasteMode = true;
        this.showNotification('Click target position to paste', 'info');
    }
    
    cancelCopy() {
        this.copyMode = false;
        this.pasteMode = false;
        this.copiedCells = [];
        this.sourceGroupIndex = null;
        this.updateCopyPasteUI();
    }
    
    pasteCells(targetRow, targetCol, instrument) {
        if (!this.pasteMode || this.copiedCells.length === 0) return;
        const targetGroup = this.patternGroups[instrument][this.currentGroupIndex];
        const minRow = Math.min(...this.copiedCells.map(c => c.row));
        const minCol = Math.min(...this.copiedCells.map(c => c.col));
        this.copiedCells.forEach(cell => {
            const newRow = targetRow + (cell.row - minRow);
            const newCol = targetCol + (cell.col - minCol);
            const maxRow = instrument === 'melody' || instrument === 'lead' ? 16 : instrument === 'bass' ? this.bassNotes.length : 8;
            if (newRow >= 0 && newRow < maxRow && newCol >= 0 && newCol < this.patternLength) {
                targetGroup.set(newCol, newRow);
            }
        });
        const targetName = this.getStepGroupDefinitions()[this.currentGroupIndex].name;
        this.showNotification(`Pasted ${this.copiedCells.length} cells to ${targetName}`, 'success');
        this.pasteMode = false;
        this.updateCopyPasteUI();
        this.rebuildGrids();
    }
    
    isCellSelected(row, col) {
        return this.copiedCells.some(cell => cell.row === row && cell.col === col);
    }
    
    updateCopyPasteUI() {
        document.querySelectorAll('.copy-paste-container').forEach(container => {
            const buttons = container.querySelectorAll('.cp-btn');
            buttons.forEach(btn => btn.classList.remove('active'));
            if (this.copyMode) container.querySelector('.copy-btn')?.classList.add('active');
            if (this.pasteMode) container.querySelector('.paste-btn')?.classList.add('active');
        });
        document.querySelectorAll('.grid-cell').forEach(cell => cell.classList.remove('copy-selected'));
        this.copiedCells.forEach(({row, col}) => {
            const cellEl = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
            if (cellEl) cellEl.classList.add('copy-selected');
        });
    }
    
    initAudio() {
        return Tone.start().then(() => {
            // Initialize Rhythm Visualizer
            this.rhythmVisualizer = new RhythmVisualizer(this);
            this.rhythmVisualizer.init();
            
            // Fallback to Tone.js for advanced synthesis
            this.audioEngine = new SimpleAudioEngine();
            this.compressor = new Tone.Compressor({ threshold: -14, ratio: 2.5, knee: 6, attack: 0.005, release: 0.2 });
            this.limiter = new Tone.Limiter(-1).toDestination();
            this.compressor.connect(this.limiter);
            
            this.effects = {
                chorus: new Tone.Chorus({ frequency: 4, delayTime: 2.5, depth: 0.5, wet: 0.16, type: 'sine' }).start(),
                echo: new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.22, wet: 0.12 }),
                reverb: new Tone.Reverb({ decay: 1.8, wet: 0.18 }),
                lowpass: new Tone.Filter({ frequency: 20000, type: 'lowpass', rolloff: -12, Q: 1 }),
                highpass: new Tone.Filter({ frequency: 60, type: 'highpass', rolloff: -12, Q: 1 }),
                distortion: new Tone.Distortion({ distortion: 0, wet: 0 }),
                bitcrush: new Tone.BitCrusher({ bits: 16, wet: 0 }),
                tremolo: new Tone.Tremolo({ frequency: 10, depth: 0, wet: 0 }).start(),
                vibrato: new Tone.Vibrato({ frequency: 5, depth: 0, wet: 0 })
            };
            
            this.effects.lowpass.connect(this.effects.highpass);
            this.effects.highpass.connect(this.effects.distortion);
            this.effects.distortion.connect(this.effects.bitcrush);
            this.effects.bitcrush.connect(this.effects.tremolo);
            this.effects.tremolo.connect(this.effects.vibrato);
            this.effects.vibrato.connect(this.effects.chorus);
            this.effects.chorus.connect(this.effects.echo);
            this.effects.echo.connect(this.effects.reverb);
            this.effects.reverb.connect(this.compressor);

            // Bus layout: kick, bass, hats and melodic parts no longer share one
            // effects chain. Bass/kick/hat stay dry and tight; only the melodic
            // buses feed chorus/echo/reverb.
            this.kickBus = new Tone.Filter({ frequency: 180, type: 'lowpass', rolloff: -12, Q: 0.5 }).connect(this.compressor);
            this.bassBus = new Tone.Filter({ frequency: 260, type: 'lowpass', rolloff: -12, Q: 0.5 }).connect(this.compressor);
            this.drumBus = new Tone.Filter({ frequency: 35, type: 'highpass', rolloff: -12, Q: 0.5 }).connect(this.compressor);
            this.hatBus = new Tone.Filter({ frequency: 500, type: 'highpass', rolloff: -12, Q: 0.5 }).connect(this.compressor);
            this.percussionBus = new Tone.Filter({ frequency: 120, type: 'highpass', rolloff: -12, Q: 0.5 }).connect(this.compressor);
            this.harmonyBus = new Tone.Gain().connect(this.effects.lowpass);
            this.melodyBus = new Tone.Gain().connect(this.effects.lowpass);
            this.leadBus = new Tone.Gain().connect(this.effects.lowpass);

            this.harmonyPanner = new Tone.Panner().connect(this.harmonyBus);
            this.melodyPanner = new Tone.Panner().connect(this.melodyBus);
            this.leadPanner = new Tone.Panner().connect(this.leadBus);
            this.bassPanner = new Tone.Panner().connect(this.bassBus);
            this.drumPanners = {
                kick: new Tone.Panner().connect(this.kickBus),
                snare: new Tone.Panner().connect(this.drumBus),
                hihat: new Tone.Panner().connect(this.hatBus),
                tom: new Tone.Panner().connect(this.drumBus)
            };
            this.percussionPanners = {
                conga: new Tone.Panner().connect(this.percussionBus),
                bongo: new Tone.Panner().connect(this.percussionBus),
                shaker: new Tone.Panner().connect(this.percussionBus),
                cymbal: new Tone.Panner().connect(this.percussionBus)
            };
            
            this.createHarmonicSynth();
            this.createMelodySynth();
            this.createBassSynth();
            this.createLeadSynth();
            this.createDrumKit();
            this.createPercussionKit();
            console.log('Audio engine initialised (Tone synthesis, single AudioContext).');
        });
    }
    
    buildSynthFromConfig(config, { polyphonic = false } = {}) {
        if (!config || !config.synth) return null;
        if (polyphonic || config.synth === Tone.PolySynth) {
            const voice = config.opts?.voice || config.opts?.synth || (config.synth === Tone.PolySynth ? Tone.Synth : config.synth);
            const opts = { ...(config.opts || {}) };
            delete opts.voice;
            delete opts.synth;
            return new Tone.PolySynth(voice, opts);
        }
        return new config.synth(config.opts);
    }

    createHarmonicSynth() {
        const config = this.harmonicInstruments[this.currentHarmonicInstrument] || this.harmonicInstruments.fm;
        this.polySynth = this.buildSynthFromConfig(config, { polyphonic: true });
        this.polySynth.connect(this.harmonyPanner);
        this.polySynth.volume.value = -6;
    }
    
    createMelodySynth() {
        const config = this.melodyInstruments[this.currentMelodyInstrument] || this.melodyInstruments.supersaw;
        this.melodySynth = this.buildSynthFromConfig(config, { polyphonic: true });
        this.melodySynth.connect(this.melodyPanner);
        this.melodySynth.volume.value = -5;
    }
    
    createBassSynth() {
        const config = this.bassInstruments[this.currentBassInstrument] || this.bassInstruments.synth;
        this.bassSynth = this.buildSynthFromConfig(config);
        this.bassSynth.connect(this.bassPanner);
        this.bassSynth.volume.value = -3;
    }
    
    createLeadSynth() {
        const config = this.leadInstruments[this.currentLeadInstrument] || this.leadInstruments.saw;
        this.leadSynth = this.buildSynthFromConfig(config, { polyphonic: true });
        this.leadSynth.connect(this.leadPanner);
        this.leadSynth.volume.value = -5;
    }
    
    createPercussionKit() {
        const kit = this.currentPercussionKit;
        const config = this.percussionKits[kit];
        this.percussion = {};
        Object.keys(config).forEach(inst => {
            const instConfig = config[inst];
            if (instConfig.synth) this.percussion[inst] = new instConfig.synth(instConfig.opts);
        });
        Object.keys(this.percussion).forEach(inst => {
            if (this.percussionPanners[inst]) this.percussion[inst].connect(this.percussionPanners[inst]);
        });
        if (this.percussion.conga) this.percussion.conga.volume.value = -8;
        if (this.percussion.bongo) this.percussion.bongo.volume.value = -10;
        if (this.percussion.shaker) this.percussion.shaker.volume.value = -12;
        if (this.percussion.cymbal) this.percussion.cymbal.volume.value = -10;
    }
    
    createDrumKit() {
        const kit = this.drumKits[this.currentDrumKit] || this.drumKits.acoustic;
        this.drums = {};
        Object.keys(kit).forEach(inst => {
            const config = kit[inst];
            if (config?.synth) this.drums[inst] = new config.synth(config.opts);
        });
        Object.keys(this.drums).forEach(inst => {
            if (this.drumPanners[inst]) this.drums[inst].connect(this.drumPanners[inst]);
        });
        if (this.drums.kick) this.drums.kick.volume.value = -4;
        if (this.drums.snare) this.drums.snare.volume.value = -10;
        if (this.drums.hihat) this.drums.hihat.volume.value = -15;
        if (this.drums.tom) this.drums.tom.volume.value = -6;
    }
    
    setHarmonicInstrument(instrument) {
        if (this.harmonicInstruments[instrument] && this.effects) {
            this.currentHarmonicInstrument = instrument;
            this.polySynth?.dispose();
            this.createHarmonicSynth();
        }
    }
    
    setMelodyInstrument(instrument) {
        if (this.melodyInstruments[instrument] && this.effects) {
            this.currentMelodyInstrument = instrument;
            this.melodySynth?.dispose();
            this.createMelodySynth();
        }
    }
    
    setBassInstrument(instrument) {
        if (this.bassInstruments[instrument] && this.effects) {
            this.currentBassInstrument = instrument;
            this.bassSynth?.dispose();
            this.createBassSynth();
        }
    }
    
    setLeadInstrument(instrument) {
        if (this.leadInstruments[instrument] && this.effects) {
            this.currentLeadInstrument = instrument;
            this.leadSynth?.dispose();
            this.createLeadSynth();
        }
    }
    
    setPercussionKit(kit) {
        if (this.percussionKits[kit] && this.effects) {
            this.currentPercussionKit = kit;
            Object.values(this.percussion || {}).forEach(p => p?.dispose());
            this.createPercussionKit();
        }
    }
    
    setDrumKit(kit) {
        if (this.drumKits[kit] && this.effects) {
            this.currentDrumKit = kit;
            Object.values(this.drums || {}).forEach(d => d?.dispose());
            this.createDrumKit();
        }
    }
    
    setTempo(value) {
        const tempo = Number(value);
        if (!Number.isFinite(tempo) || tempo <= 0) return false;
        this.tempo = tempo;
        const slider = document.getElementById('tempoSlider');
        if (slider) {
            // Expand the range before assigning, so the browser does not clamp song BPM.
            slider.min = Math.min(30, tempo);
            slider.max = Math.max(300, tempo);
            slider.value = tempo;
        }
        const label = document.getElementById('tempoValue');
        if (label) label.textContent = `${tempo} BPM`;
        if (typeof Tone !== 'undefined' && Tone.Transport?.bpm) Tone.Transport.bpm.value = tempo;
        if (this.rhythmVisualizer?.enabled) this.rhythmVisualizer.setTempo(tempo);
        return true;
    }

    parseTimeSignature(signature = this.timeSignature) {
        const match = String(signature || '4/4').match(/^\s*(\d+)\s*\/\s*(\d+)\s*$/);
        if (!match) return { numerator: 4, denominator: 4, stepsPerBar: 16 };
        const numerator = Number(match[1]);
        const denominator = Number(match[2]);
        if (!numerator || !denominator) return { numerator: 4, denominator: 4, stepsPerBar: 16 };
        // Keep the sequencer's 16th-note resolution, but let the bar length follow
        // the meter. 4/4 = 16 steps, 3/4 = 12, 2/4 = 8, 5/4 = 20, 6/8 = 12.
        return {
            numerator,
            denominator,
            stepsPerBar: Math.max(1, Math.round(numerator * 16 / denominator))
        };
    }

    getStepsPerBar() {
        return this.parseTimeSignature().stepsPerBar;
    }

    getStepsPerBeat() {
        const { numerator, stepsPerBar } = this.parseTimeSignature();
        return Math.max(1, Math.round(stepsPerBar / numerator));
    }

    getBarCount() {
        const stepsPerBar = this.getStepsPerBar();
        return Math.max(1, Math.round((this.patternLength || stepsPerBar) / stepsPerBar));
    }

    getBarQuarterNotes() {
        const { numerator, denominator } = this.parseTimeSignature();
        return numerator * (4 / denominator);
    }

    setSwingForGenre(genre) {
        const swingByGenre = {
            blues: 0.18, jazz: 0.22, funk: 0.12, reggae: 0.16,
            'hip-hop': 0.08, disco: 0.06, country: 0.06,
            electronic: 0.04, indie: 0.04, rock: 0.02,
            pop: 0, metal: 0, classical: 0
        };
        this.swing = swingByGenre[genre] || 0;
        if (typeof Tone !== 'undefined' && Tone.Transport) {
            Tone.Transport.swing = this.swing;
            Tone.Transport.swingSubdivision = '16n';
        }
        return this.swing;
    }

    setPatternLength(length, { addedSteps = 'preserve' } = {}) {
        const stepsPerBar = this.getStepsPerBar();
        const validLength = [16, 32, 64].includes(length) || length % stepsPerBar === 0;
        if (!Number.isInteger(length) || length <= 0 || !validLength || length % stepsPerBar !== 0) return;
        this._applyPatternLength(length, { addedSteps });
    }

    setPatternBars(barCount, { addedSteps = 'preserve' } = {}) {
        const bars = Math.max(1, Math.round(Number(barCount) || 1));
        this._applyPatternLength(bars * this.getStepsPerBar(), { addedSteps });
    }

    _applyPatternLength(length, { addedSteps = 'preserve' } = {}) {
        this._songLoadRequest = (this._songLoadRequest || 0) + 1;
        this._helperRequest = (this._helperRequest || 0) + 1;
        if (this.isPlaying) this.stop();
        const previousLength = this.patternLength;
        const stepsPerBar = this.getStepsPerBar();
        const oldBarCount = Math.max(1, Math.round(previousLength / stepsPerBar));
        const newBarCount = Math.max(1, Math.round(length / stepsPerBar));
        if (length > previousLength && ['repeat', 'empty'].includes(addedSteps)) {
            if (!Array.isArray(this.groupChords)) this.groupChords = [];
            for (let group = oldBarCount; group < newBarCount; group++) {
                const source = group % oldBarCount;
                for (const part of ['harmonics', 'melody', 'bass', 'lead']) {
                    this.patternGroups[part][group] = addedSteps === 'repeat'
                        ? structuredClone(this.patternGroups[part][source])
                        : part === 'harmonics' ? new Set() : new Map();
                }
                this.groupChords[group] = addedSteps === 'repeat' && Array.isArray(this.groupChords[source])
                    ? structuredClone(this.groupChords[source])
                    : null;
                const rhythm = this.patternGroups.rhythm[source];
                this.patternGroups.rhythm[group] = addedSteps === 'repeat'
                    ? structuredClone(rhythm)
                    : Object.fromEntries(Object.keys(rhythm).map(name => [name, new Set()]));
                this.groupLoopCounts[group] = addedSteps === 'repeat' ? (this.groupLoopCounts[source] || 1) : 1;
            }
            // Copy note strength and per-step effect data alongside the notes.
            const maps = [this.melodyVelocity, this.harmonyVelocity, this.bassVelocity, this.leadVelocity,
                ...Object.values(this.rhythmVelocity || {}), ...Object.values(this.effectAutomation || {})];
            for (const map of maps) {
                if (!map) continue;
                for (let step = previousLength; step < length; step++) {
                    const source = step % previousLength;
                    if (addedSteps === 'repeat' && map.has(source)) map.set(step, structuredClone(map.get(source)));
                    else map.delete(step);
                }
            }
        }
        this.patternLength = length;
        this.initializePatternGroups();
        this.rebuildGrids();
        this.createStepTimeline();
        this.createSectionTimelines();
        this.updatePatternLengthUI();
        this.createSectionRepeatsControl();
        this.showNotification(`Pattern length: ${length} steps (${newBarCount} bar${newBarCount === 1 ? '' : 's'})${length > previousLength && addedSteps === 'repeat' ? ' — existing pattern copied into the added steps' : ''}`, 'success');
    }

    setTimeSignature(signature, { resize = true } = {}) {
        const parsed = this.parseTimeSignature(signature);
        const next = `${parsed.numerator}/${parsed.denominator}`;
        const oldStepsPerBar = this.getStepsPerBar();
        const barCount = this.getBarCount();
        if (!resize || oldStepsPerBar === parsed.stepsPerBar) {
            this.timeSignature = next;
            this.syncTimeSignatureUI();
            return next;
        }

        if (this.isPlaying) this.stop();
        const remapStep = (step) => {
            const bar = Math.floor(step / oldStepsPerBar);
            const local = step % oldStepsPerBar;
            if (bar >= barCount) return null;
            const scaled = Math.min(parsed.stepsPerBar - 1, Math.round(local * parsed.stepsPerBar / oldStepsPerBar));
            return bar * parsed.stepsPerBar + scaled;
        };

        for (const part of ['melody', 'bass', 'lead']) {
            this.patternGroups[part] = this.patternGroups[part].slice(0, barCount).map(group => {
                const nextGroup = new Map();
                for (const [step, row] of group || []) {
                    const nextStep = remapStep(step);
                    if (nextStep !== null) nextGroup.set(nextStep % parsed.stepsPerBar, row);
                }
                return nextGroup;
            });
            while (this.patternGroups[part].length < barCount) this.patternGroups[part].push(new Map());
        }
        this.patternGroups.harmonics = this.patternGroups.harmonics.slice(0, barCount).map(group => new Set(group || []));
        while (this.patternGroups.harmonics.length < barCount) this.patternGroups.harmonics.push(new Set());
        this.patternGroups.rhythm = this.patternGroups.rhythm.slice(0, barCount).map(group => {
            const nextGroup = {};
            for (const [name, steps] of Object.entries(group || {})) {
                nextGroup[name] = new Set(Array.from(steps || [])
                    .map(step => Math.min(parsed.stepsPerBar - 1, Math.round(step * parsed.stepsPerBar / oldStepsPerBar))));
            }
            return nextGroup;
        });
        while (this.patternGroups.rhythm.length < barCount) {
            this.patternGroups.rhythm.push({ kick: new Set(), snare: new Set(), hihat: new Set(), tom: new Set(), conga: new Set(), bongo: new Set(), shaker: new Set(), cymbal: new Set() });
        }

        const remapMap = (map) => {
            const nextMap = new Map();
            for (const [step, value] of map || []) {
                const nextStep = remapStep(step);
                if (nextStep !== null) nextMap.set(nextStep, value);
            }
            return nextMap;
        };
        this.melodyVelocity = remapMap(this.melodyVelocity);
        this.harmonyVelocity = remapMap(this.harmonyVelocity);
        this.bassVelocity = remapMap(this.bassVelocity);
        this.leadVelocity = remapMap(this.leadVelocity);
        this.rhythmVelocity = Object.fromEntries(Object.entries(this.rhythmVelocity || {}).map(([name, map]) => [name, remapMap(map)]));
        this.effectAutomation = Object.fromEntries(Object.entries(this.effectAutomation || {}).map(([name, map]) => [name, remapMap(map)]));

        this.groupChords = Array.from({ length: barCount }, (_, index) => this.groupChords?.[index] || null);
        this.groupLoopCounts = Array.from({ length: barCount }, (_, index) => this.groupLoopCounts?.[index] || 1);
        this.groupLoopCurrent = Array.from({ length: barCount }, () => 0);
        this.currentGroupIndex = Math.min(this.currentGroupIndex || 0, barCount - 1);
        this.timeSignature = next;
        this.patternLength = barCount * parsed.stepsPerBar;
        this.initializePatternGroups();
        this.rebuildGrids();
        this.createStepTimeline();
        this.createSectionTimelines();
        this.updatePatternLengthUI();
        this.createSectionRepeatsControl();
        this.syncTimeSignatureUI();
        if (typeof Tone !== 'undefined' && Tone.Transport) {
            try { Tone.Transport.timeSignature = [parsed.numerator, parsed.denominator]; } catch (_) {}
        }
        this.showNotification(`Meter: ${next} — ${barCount} bar${barCount === 1 ? '' : 's'} of ${parsed.stepsPerBar} steps`, 'success');
        return next;
    }

    syncTimeSignatureUI() {
        const select = document.getElementById('timeSignature');
        if (select) select.value = this.timeSignature;
    }

    initializePatternGroups() {
        const groupCount = this.getBarCount();
        if (!Array.isArray(this.groupChords)) this.groupChords = [];
        if (!Array.isArray(this.groupLoopCounts)) this.groupLoopCounts = [];
        if (!Array.isArray(this.groupLoopCurrent)) this.groupLoopCurrent = [];
        for (let i = 0; i < groupCount; i++) {
            if (this.groupChords[i] === undefined) this.groupChords[i] = null;
            if (this.groupLoopCounts[i] === undefined) this.groupLoopCounts[i] = 1;
            if (this.groupLoopCurrent[i] === undefined) this.groupLoopCurrent[i] = 0;
            if (!this.patternGroups.harmonics[i]) this.patternGroups.harmonics[i] = new Set();
            if (!this.patternGroups.melody[i]) this.patternGroups.melody[i] = new Map();
            if (!this.patternGroups.bass[i]) this.patternGroups.bass[i] = new Map();
            if (!this.patternGroups.lead[i]) this.patternGroups.lead[i] = new Map();
            if (!this.patternGroups.rhythm[i]) {
                this.patternGroups.rhythm[i] = { kick: new Set(), snare: new Set(), hihat: new Set(), tom: new Set(), conga: new Set(), bongo: new Set(), shaker: new Set(), cymbal: new Set() };
            }
        }
        if (this.currentGroupIndex >= groupCount) this.currentGroupIndex = 0;
        this.harmonics = this.patternGroups.harmonics[this.currentGroupIndex];
        this.melodyRows = this.patternGroups.melody[this.currentGroupIndex];
        this.bassRows = this.patternGroups.bass[this.currentGroupIndex];
        this.leadRows = this.patternGroups.lead[this.currentGroupIndex];
        this.rhythm = this.patternGroups.rhythm[this.currentGroupIndex];
    }
    
    loadPatternGroup(groupIndex) {
        const groupCount = this.getBarCount();
        if (groupIndex < 0 || groupIndex >= groupCount) return;
        this.currentGroupIndex = groupIndex;
        this.harmonics = this.patternGroups.harmonics[groupIndex];
        this.melodyRows = this.patternGroups.melody[groupIndex];
        this.bassRows = this.patternGroups.bass[groupIndex];
        this.leadRows = this.patternGroups.lead[groupIndex];
        this.rhythm = this.patternGroups.rhythm[groupIndex];
        this.rebuildGrids();
        this.createSectionTimelines();
        this.updateHarmonicsUI();
        this.updateSectionRepeatsControl();
        const stepGroups = this.getStepGroupDefinitions();
        this.showNotification(`Loaded: ${stepGroups[groupIndex].name}`, 'info');
    }
    
    saveCurrentGroup() {}
    
    rebuildGrids() {
        // Clear any hidden class and add show class only for enabled sections
        document.querySelectorAll('.melody-group-row').forEach(row => {
            row.classList.remove('hidden');
            row.classList.toggle('show', this.melodyEnabled);
        });
        
        document.querySelectorAll('.bass-group-row').forEach(row => {
            row.classList.remove('hidden');
            row.classList.toggle('show', this.bassEnabled);
        });
        
        document.querySelectorAll('.lead-group-row').forEach(row => {
            row.classList.remove('hidden');
            row.classList.toggle('show', this.leadEnabled);
        });
        
        document.querySelectorAll('.rhythm-group-row').forEach(row => {
            row.classList.remove('hidden');
            row.classList.toggle('show', this.rhythmEnabled);
        });
        
        // Handle percussion rows separately (they're in #percussionGrid)
        document.querySelectorAll('#percussionGrid .rhythm-group-row').forEach(row => {
            row.classList.remove('hidden');
            row.classList.toggle('show', this.percussionEnabled);
        });
        
        // Ensure grid containers have correct display
        const bassGrid = document.getElementById('bassGrid');
        if (bassGrid) bassGrid.style.display = this.bassEnabled ? 'block' : 'none';
        const leadGrid = document.getElementById('leadGrid');
        if (leadGrid) leadGrid.style.display = this.leadEnabled ? 'block' : 'none';
        const percussionGrid = document.getElementById('percussionGrid');
        if (percussionGrid) percussionGrid.style.display = this.percussionEnabled ? 'block' : 'none';
        
        const melodyGrid = document.getElementById('stringsGrid');
        melodyGrid.innerHTML = '';
        this.createMelodyGrid();
        const bassGridEl = document.getElementById('bassGrid');
        if (bassGridEl) { bassGridEl.innerHTML = ''; this.createBassGrid(); }
        const leadGridEl = document.getElementById('leadGrid');
        if (leadGridEl) { leadGridEl.innerHTML = ''; this.createLeadGrid(); }
        const rhythmGridEl = document.getElementById('rhythmGrid');
        rhythmGridEl.innerHTML = '';
        this.createRhythmGrid();
        this.melodyRows.forEach((row, col) => {
            const cell = document.querySelector(`.string-cell[data-col="${col}"][data-row="${row}"]`);
            if (cell) cell.classList.add('active');
        });
        this.bassRows.forEach((row, col) => {
            const cell = document.querySelector(`.bass-cell[data-col="${col}"][data-row="${row}"][data-group-index="${this.currentGroupIndex}"]`);
            if (cell) cell.classList.add('active');
        });
        this.leadRows.forEach((row, col) => {
            const cell = document.querySelector(`.lead-cell[data-col="${col}"][data-row="${row}"][data-group-index="${this.currentGroupIndex}"]`);
            if (cell) cell.classList.add('active');
        });
        Object.keys(this.rhythm).forEach(inst => {
            this.rhythm[inst].forEach(step => {
                const cell = document.querySelector(`.rhythm-cell[data-instrument="${inst}"][data-step="${step}"]`);
                if (cell) cell.classList.add('active');
            });
        });
        const percussionGridEl = document.getElementById('percussionGrid');
        if (percussionGridEl) {
            percussionGridEl.innerHTML = '';
            this.createPercussionGrid();
            ['conga', 'bongo', 'shaker', 'cymbal'].forEach(inst => {
                this.rhythm[inst].forEach(step => {
                    const cell = document.querySelector(`.rhythm-cell[data-instrument="${inst}"][data-step="${step}"]`);
                    if (cell) cell.classList.add('active');
                });
            });
        }
        this.updateTimelineState();
        
        // Re-initialize tooltips for dynamically added elements
        if (typeof initTooltips === 'function') {
            initTooltips();
        }
        
        // Force show enabled grids
        if (this.bassEnabled) {
            document.querySelectorAll('.bass-group-row').forEach(row => {
                row.classList.remove('hidden');
                row.classList.add('show');
            });
        } else {
            document.querySelectorAll('.bass-group-row').forEach(row => {
                row.classList.remove('show');
                row.classList.add('hidden');
            });
        }
        if (this.leadEnabled) {
            document.querySelectorAll('.lead-group-row').forEach(row => {
                row.classList.remove('hidden');
                row.classList.add('show');
            });
        } else {
            document.querySelectorAll('.lead-group-row').forEach(row => {
                row.classList.remove('show');
                row.classList.add('hidden');
            });
        }
        if (this.percussionEnabled) {
            document.querySelectorAll('#percussionGrid .rhythm-group-row').forEach(row => {
                row.classList.remove('hidden');
                row.classList.add('show');
            });
        } else {
            document.querySelectorAll('#percussionGrid .rhythm-group-row').forEach(row => {
                row.classList.remove('show');
                row.classList.add('hidden');
            });
        }
    }
    
    updatePatternLengthUI() {
        const indicator = document.getElementById('patternLengthValue');
        const bars = this.getBarCount();
        if (indicator) indicator.textContent = `${this.patternLength} steps (${bars} bar${bars === 1 ? '' : 's'})`;
        document.querySelectorAll('[data-pattern-length]').forEach(btn => {
            const buttonBars = Math.max(1, Math.round(parseInt(btn.dataset.patternLength) / 16));
            btn.classList.toggle('active', buttonBars === bars);
        });
    }
    
    createHarmonicsGrid() {
        const grid = document.getElementById('harmonicsGrid');
        grid.innerHTML = '';
        this.harmonicNotes.forEach((note, index) => {
            const cell = document.createElement('div');
            cell.className = 'harmonic-cell';
            cell.innerHTML = `<span>${note}</span>`;
            cell.onclick = () => this.toggleHarmonic(index, cell);
            
            // Mark as active if this harmonic is selected in the current group
            if (this.harmonics.has(index)) {
                cell.classList.add('active');
            }
            
            grid.appendChild(cell);
        });
    }
    
    createMelodyGrid() {
        const grid = document.getElementById('stringsGrid');
        if (!grid) return;
        grid.innerHTML = '';
        const groupCount = this.getBarCount();
        const scale = this.getCurrentScale();
        grid.className = 'strings-grid';
        
        for (let g = 0; g < groupCount; g++) {
            const groupRow = document.createElement('div');
            groupRow.className = `melody-group-row${g === this.currentGroupIndex ? ' active' : ''}`;
            groupRow.dataset.groupIndex = g;
            
            const groupHeader = document.createElement('div');
            groupHeader.className = 'melody-group-header';
            
            const groupLabel = document.createElement('div');
            groupLabel.className = 'melody-group-label';
            const stepGroups = this.getStepGroupDefinitions();
            groupLabel.innerHTML = `<span>${stepGroups[g].name}</span>`;
            groupHeader.appendChild(groupLabel);
            
            for (let col = 0; col < this.getStepsPerBar(); col++) {
                const column = document.createElement('div');
                column.className = 'string-column';
                column.dataset.col = col;
                column.dataset.groupIndex = g;
                for (let row = 0; row < 16; row++) {
                    const cell = document.createElement('div');
                    cell.className = 'string-cell';
                    cell.dataset.col = col;
                    cell.dataset.row = row;
                    cell.dataset.groupIndex = g;
                    cell.title = scale[row] || `Row ${row + 1}`;
                    if (this.patternGroups.melody[g]?.has(col) && this.patternGroups.melody[g].get(col) === row) {
                        cell.classList.add('active');
                    }
                    cell.onclick = () => this.toggleMelody(g, col, row, cell);
                    column.appendChild(cell);
                }
                groupRow.appendChild(column);
            }
            grid.appendChild(groupRow);
        }
        this.createSectionRepeatsControl();
    }
    createBassGrid() {
        const grid = document.getElementById('bassGrid');
        if (!grid) return;
        grid.innerHTML = '';
        const groupCount = this.getBarCount();
        const rowCount = 8;
        
        for (let g = 0; g < groupCount; g++) {
            const groupRow = document.createElement('div');
            groupRow.className = `bass-group-row${g === this.currentGroupIndex ? ' active' : ''}`;
            groupRow.dataset.groupIndex = g;
            
            const groupHeader = document.createElement('div');
            groupHeader.className = 'bass-group-header';
            
            const groupLabel = document.createElement('div');
            groupLabel.className = 'bass-group-label';
            const stepGroups = this.getStepGroupDefinitions();
            groupLabel.innerHTML = `<span>${stepGroups[g].name}</span>`;
            groupHeader.appendChild(groupLabel);
            groupRow.appendChild(groupHeader);
            
            const columnsWrapper = document.createElement('div');
            columnsWrapper.className = 'bass-columns-wrapper';
            columnsWrapper.style.display = 'flex';
            columnsWrapper.style.flex = '1';
            columnsWrapper.style.minWidth = '0';
            
            for (let col = 0; col < this.getStepsPerBar(); col++) {
                const column = document.createElement('div');
                column.className = 'bass-column';
                column.dataset.col = col;
                column.dataset.groupIndex = g;
                column.style.display = 'flex';
                column.style.flexDirection = 'column';
                column.style.flex = '1';
                column.style.minWidth = '0';
                
                let activeRow = -1;
                if (this.patternGroups.bass[g]?.has(col)) {
                    activeRow = this.patternGroups.bass[g].get(col);
                }
                
                for (let row = 0; row < rowCount; row++) {
                    const cell = document.createElement('div');
                    cell.className = 'bass-cell';
                    cell.dataset.col = col;
                    cell.dataset.row = row;
                    cell.dataset.groupIndex = g;
                    
                    if (row === activeRow) {
                        cell.classList.add('active');
                        if (row < this.bassNotes.length) cell.title = this.bassNotes[row];
                    }
                    
                    cell.onclick = () => this.toggleBass(g, col, row, cell);
                    column.appendChild(cell);
                }
                columnsWrapper.appendChild(column);
            }
            groupRow.appendChild(columnsWrapper);
            grid.appendChild(groupRow);
        }
        
        // Set initial visibility based on enabled state
        const bassGridEl = document.getElementById('bassGrid');
        if (bassGridEl) {
            bassGridEl.querySelectorAll('.bass-group-row').forEach(row => {
                if (this.bassEnabled) {
                    row.classList.remove('hidden');
                    row.classList.add('show');
                } else {
                    row.classList.remove('show');
                    row.classList.add('hidden');
                }
            });
        }
    }
    
    createLeadGrid() {
        const grid = document.getElementById('leadGrid');
        if (!grid) return;
        grid.innerHTML = '';
        const groupCount = this.getBarCount();
        const rowCount = 16;
        const leadScale = this.getLeadScale();
        
        for (let g = 0; g < groupCount; g++) {
            const groupRow = document.createElement('div');
            groupRow.className = `lead-group-row${g === this.currentGroupIndex ? ' active' : ''}`;
            groupRow.dataset.groupIndex = g;
            
            const groupHeader = document.createElement('div');
            groupHeader.className = 'lead-group-header';
            
            const groupLabel = document.createElement('div');
            groupLabel.className = 'lead-group-label';
            const stepGroups = this.getStepGroupDefinitions();
            groupLabel.innerHTML = `<span>${stepGroups[g].name}</span>`;
            groupHeader.appendChild(groupLabel);
            groupRow.appendChild(groupHeader);
            
            const columnsWrapper = document.createElement('div');
            columnsWrapper.className = 'lead-columns-wrapper';
            columnsWrapper.style.display = 'flex';
            columnsWrapper.style.flex = '1';
            columnsWrapper.style.minWidth = '0';
            
            for (let col = 0; col < this.getStepsPerBar(); col++) {
                const column = document.createElement('div');
                column.className = 'lead-column';
                column.dataset.col = col;
                column.dataset.groupIndex = g;
                column.style.display = 'flex';
                column.style.flexDirection = 'column';
                column.style.flex = '1';
                column.style.minWidth = '0';
                
                let activeRow = -1;
                if (this.patternGroups.lead[g]?.has(col)) {
                    activeRow = this.patternGroups.lead[g].get(col);
                }
                
                for (let row = 0; row < rowCount; row++) {
                    const cell = document.createElement('div');
                    cell.className = 'lead-cell';
                    cell.dataset.col = col;
                    cell.dataset.row = row;
                    cell.dataset.groupIndex = g;
                    cell.title = leadScale[row] || `Row ${row + 1}`;
                    
                    if (row === activeRow) cell.classList.add('active');
                    
                    cell.onclick = () => this.toggleLead(g, col, row, cell);
                    column.appendChild(cell);
                }
                columnsWrapper.appendChild(column);
            }
            groupRow.appendChild(columnsWrapper);
            grid.appendChild(groupRow);
        }
        
        // Set initial visibility based on enabled state
        const leadGridEl = document.getElementById('leadGrid');
        if (leadGridEl) {
            leadGridEl.querySelectorAll('.lead-group-row').forEach(row => {
                if (this.leadEnabled) {
                    row.classList.remove('hidden');
                    row.classList.add('show');
                } else {
                    row.classList.remove('show');
                    row.classList.add('hidden');
                }
            });
        }
    }
    
    createRhythmGrid() {
        const grid = document.getElementById('rhythmGrid');
        grid.innerHTML = '';
        const groupCount = this.getBarCount();
        const instruments = ['kick', 'snare', 'hihat', 'tom'];
        const labels = ['🥾 Kick', '🥁 Snare', '🎩 Hi-Hat', '🪘 Tom'];
        
        instruments.forEach((instrument, instIdx) => {
            for (let g = 0; g < groupCount; g++) {
                const row = document.createElement('div');
                row.className = `rhythm-group-row${g === this.currentGroupIndex ? ' active' : ''}`;
                row.dataset.groupIndex = g;
                row.dataset.instrument = instrument;
                
                const label = document.createElement('div');
                label.className = 'rhythm-group-label';
                const stepGroups = this.getStepGroupDefinitions();
                label.innerHTML = `${labels[instIdx]}<span>${stepGroups[g].name}</span>`;
                row.appendChild(label);
                
                for (let step = 0; step < this.getStepsPerBar(); step++) {
                    const cell = document.createElement('div');
                    cell.className = 'rhythm-cell';
                    cell.dataset.instrument = instrument;
                    cell.dataset.step = step;
                    cell.dataset.groupIndex = g;
                    
                    if (this.patternGroups.rhythm[g]?.[instrument]?.has(step)) {
                        cell.classList.add('active');
                    }
                    
                    cell.onclick = () => this.toggleRhythm(g, instrument, step, cell);
                    row.appendChild(cell);
                }
                grid.appendChild(row);
            }
        });
    }
    
    createPercussionGrid() {
        const grid = document.getElementById('percussionGrid');
        if (!grid) return;
        grid.innerHTML = '';
        const groupCount = this.getBarCount();
        const instruments = ['conga', 'bongo', 'shaker', 'cymbal'];
        const labels = ['🥁 Conga', '🥁 Bongo', '🎲 Shaker', '🔔 Cymbal'];
        
        instruments.forEach((instrument, instIdx) => {
            for (let g = 0; g < groupCount; g++) {
                const row = document.createElement('div');
                row.className = `rhythm-group-row${g === this.currentGroupIndex ? ' active' : ''}`;
                row.dataset.groupIndex = g;
                row.dataset.instrument = instrument;
                
                const label = document.createElement('div');
                label.className = 'rhythm-group-label';
                const stepGroups = this.getStepGroupDefinitions();
                label.innerHTML = `${labels[instIdx]}<span>${stepGroups[g].name}</span>`;
                row.appendChild(label);
                
                for (let step = 0; step < this.getStepsPerBar(); step++) {
                    const cell = document.createElement('div');
                    cell.className = 'rhythm-cell';
                    cell.dataset.instrument = instrument;
                    cell.dataset.step = step;
                    cell.dataset.groupIndex = g;
                    
                    if (this.patternGroups.rhythm[g]?.[instrument]?.has(step)) {
                        cell.classList.add('active');
                    }
                    
                    cell.onclick = () => this.toggleRhythm(g, instrument, step, cell);
                    row.appendChild(cell);
                }
                grid.appendChild(row);
            }
        });
        
        // Set initial visibility based on enabled state
        const percussionGridEl = document.getElementById('percussionGrid');
        if (percussionGridEl) {
            percussionGridEl.querySelectorAll('.rhythm-group-row').forEach(row => {
                if (this.percussionEnabled) {
                    row.classList.remove('hidden');
                    row.classList.add('show');
                } else {
                    row.classList.remove('show');
                    row.classList.add('hidden');
                }
            });
        }
    }
    
    isMobileSectionLayout() {
        return window.matchMedia
            ? window.matchMedia('(max-width: 767px)').matches
            : window.innerWidth <= 767;
    }

    updateSectionCollapseButton(section) {
        const button = section?.querySelector(':scope > .section-header > .section-collapse-btn');
        if (!button) return;
        const collapsed = section.classList.contains('mobile-collapsed');
        button.setAttribute('aria-expanded', String(!collapsed));
        button.setAttribute('aria-label', collapsed ? 'Expand section' : 'Collapse section');
        button.title = collapsed ? 'Expand section' : 'Collapse section';
    }

    updateMobileNavActive() {
        const nav = document.getElementById('mobileSectionNav');
        if (!nav) return;
        const targets = [
            ...nav.querySelectorAll('[data-section-target]'),
            ...document.querySelectorAll('#sectionsMenuPanel [data-section-target]')
        ];
        targets.forEach(button => {
            const section = document.getElementById(button.dataset.sectionTarget);
            const active = Boolean(section && (this.isMobileSectionLayout()
                ? !section.classList.contains('mobile-collapsed')
                : true));
            button.classList.toggle('active', active && this.isMobileSectionLayout());
        });
    }

    updateMobileNavMetrics() {
        const nav = document.getElementById('mobileSectionNav');
        if (!nav) return;
        const header = document.querySelector('.fixed-header');
        const headerHeight = header ? header.getBoundingClientRect().height : 96;
        document.documentElement.style.setProperty('--section-menu-top', `${Math.round(headerHeight + 8)}px`);
        if (!this.isMobileSectionLayout()) {
            nav.style.removeProperty('top');
            document.documentElement.style.removeProperty('--mobile-jump-offset');
            document.documentElement.style.setProperty('--section-jump-offset', `${Math.round(headerHeight + 24)}px`);
            return;
        }
        nav.style.top = `${Math.round(headerHeight + 8)}px`;
        const offset = Math.round(headerHeight + nav.offsetHeight + 24);
        document.documentElement.style.setProperty('--mobile-jump-offset', `${offset}px`);
        document.documentElement.style.setProperty('--section-jump-offset', `${offset}px`);
    }

    setMobileSectionCollapsed(sectionId, collapsed, { remember = true } = {}) {
        const section = document.getElementById(sectionId);
        if (!section) return;
        section.classList.toggle('mobile-collapsed', Boolean(collapsed));
        if (remember) {
            this._mobileSectionCollapsed = this._mobileSectionCollapsed || {};
            this._mobileSectionCollapsed[sectionId] = Boolean(collapsed);
        }
        this.updateSectionCollapseButton(section);
        this.updateMobileNavActive();
        this.updateMobileNavMetrics();
    }

    openMobileSection(sectionId) {
        const sections = Array.from(document.querySelectorAll('.container > .section[id]'));
        const target = document.getElementById(sectionId);
        if (!target) return;
        if (this.isMobileSectionLayout()) {
            sections.forEach(section => this.setMobileSectionCollapsed(section.id, section.id !== sectionId));
        }
        target.scrollIntoView({ behavior: 'auto', block: 'start' });
    }

    toggleMobileSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return;
        if (section.classList.contains('mobile-collapsed')) {
            this.openMobileSection(sectionId);
        } else {
            this.setMobileSectionCollapsed(sectionId, true);
        }
    }

    applyMobileSectionLayout() {
        const sections = Array.from(document.querySelectorAll('.container > .section[id]'));
        const nav = document.getElementById('mobileSectionNav');
        const mobile = this.isMobileSectionLayout();
        if (!mobile) {
            sections.forEach(section => section.classList.remove('mobile-collapsed'));
            nav?.querySelectorAll('[data-section-target]').forEach(button => button.classList.remove('active'));
            this.updateMobileNavMetrics();
            return;
        }
        this._mobileSectionCollapsed = this._mobileSectionCollapsed || {};
        sections.forEach((section, index) => {
            const remembered = this._mobileSectionCollapsed[section.id];
            const collapsed = remembered === undefined ? index !== 0 : remembered;
            section.classList.toggle('mobile-collapsed', collapsed);
            this.updateSectionCollapseButton(section);
        });
        this.updateMobileNavActive();
        requestAnimationFrame(() => this.updateMobileNavMetrics());
    }

    setupMobileSectionNavigation() {
        if (this._mobileSectionNavReady) return;
        const nav = document.getElementById('mobileSectionNav');
        if (!nav) return;
        this._mobileSectionNavReady = true;

        const labels = {
            harmonicsSection: { label: 'Harmonics', icon: '🎹' },
            stringsSection: { label: 'Melody', icon: '🎻' },
            rhythmSection: { label: 'Drums', icon: '🥁' },
            bassSection: { label: 'Bass', icon: '🎸' },
            leadSection: { label: 'Lead', icon: '🎤' },
            percussionSection: { label: 'Percussion', icon: '🎶' },
            mainStageSection: { label: 'Stage', icon: '🎭' },
            sectionRepeatsSection: { label: 'Repeats', icon: '🔄' },
            effectsSection: { label: 'Effects', icon: '✨' }
        };
        const sections = Array.from(document.querySelectorAll('.container > .section[id]'));
        const menuButton = document.getElementById('sectionsMenuBtn');
        const menuPanel = document.getElementById('sectionsMenuPanel');
        const setSectionsMenuOpen = (open) => {
            if (!menuButton || !menuPanel) return;
            menuPanel.hidden = !open;
            menuButton.setAttribute('aria-expanded', String(open));
            menuButton.classList.toggle('active', open);
        };
        this._closeSectionsMenu = () => setSectionsMenuOpen(false);

        sections.forEach(section => {
            const header = section.querySelector(':scope > .section-header');
            const content = section.querySelector(':scope > .section-content');
            if (!header) return;
            if (content && !content.id) content.id = `${section.id}Content`;

            let collapseButton = header.querySelector('.section-collapse-btn');
            if (!collapseButton) {
                collapseButton = document.createElement('button');
                collapseButton.type = 'button';
                collapseButton.className = 'section-collapse-btn';
                collapseButton.innerHTML = '<i class="fas fa-chevron-down" aria-hidden="true"></i>';
                header.appendChild(collapseButton);
            }
            if (content) collapseButton.setAttribute('aria-controls', content.id);
            collapseButton.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.toggleMobileSection(section.id);
            });
            header.addEventListener('click', (event) => {
                if (!this.isMobileSectionLayout()) return;
                if (event.target.closest('.section-collapse-btn')) return;
                if (event.target.closest('button, select, input, textarea, a, label')) return;
                this.toggleMobileSection(section.id);
            });

            const meta = labels[section.id] || { label: section.id, icon: '•' };
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'mobile-section-nav__btn';
            button.dataset.sectionTarget = section.id;
            button.innerHTML = `<span aria-hidden="true">${meta.icon}</span><span>${meta.label}</span>`;
            button.addEventListener('click', () => {
                const isOpen = !section.classList.contains('mobile-collapsed');
                const isActive = button.classList.contains('active');
                if (isOpen && isActive) {
                    this.setMobileSectionCollapsed(section.id, true);
                } else {
                    this.openMobileSection(section.id);
                }
            });
            nav.appendChild(button);

            if (menuPanel) {
                const menuItem = document.createElement('button');
                menuItem.type = 'button';
                menuItem.className = 'section-menu-item';
                menuItem.dataset.sectionTarget = section.id;
                menuItem.setAttribute('role', 'menuitem');
                menuItem.innerHTML = `<span class="section-menu-icon" aria-hidden="true">${meta.icon}</span><span>${meta.label}</span>`;
                menuItem.addEventListener('click', () => {
                    setSectionsMenuOpen(false);
                    this.openMobileSection(section.id);
                });
                menuPanel.appendChild(menuItem);
            }
        });

        if (menuButton && menuPanel) {
            menuButton.addEventListener('click', (event) => {
                event.stopPropagation();
                setSectionsMenuOpen(menuPanel.hidden);
            });
            menuPanel.addEventListener('click', (event) => event.stopPropagation());
            document.addEventListener('click', () => setSectionsMenuOpen(false));
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') setSectionsMenuOpen(false);
            });
        }

        this._mobileSectionQuery = window.matchMedia?.('(max-width: 767px)');
        const handleLayoutChange = () => this.applyMobileSectionLayout();
        if (this._mobileSectionQuery?.addEventListener) {
            this._mobileSectionQuery.addEventListener('change', handleLayoutChange);
        } else if (this._mobileSectionQuery?.addListener) {
            this._mobileSectionQuery.addListener(handleLayoutChange);
        }
        window.addEventListener('resize', () => this.updateMobileNavMetrics());
        this.applyMobileSectionLayout();
        requestAnimationFrame(() => this.updateMobileNavMetrics());
    }

    setupEventListeners() {
        this.setupMobileSectionNavigation();
        document.querySelectorAll('[data-preset]').forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.dataset.preset;
                this.loadHarmonicPreset(preset);
            });
        });
        document.querySelectorAll('[data-melody-preset]').forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.dataset.melodyPreset;
                this.loadMelodyPreset(preset);
            });
        });
        document.querySelectorAll('[data-rhythm-preset]').forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.dataset.rhythmPreset;
                this.loadRhythmPreset(preset);
            });
        });
        document.querySelectorAll('[data-bass-preset]').forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.dataset.bassPreset;
                this.loadBassPreset(preset);
            });
        });
        document.querySelectorAll('[data-lead-preset]').forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.dataset.leadPreset;
                this.loadLeadPreset(preset);
            });
        });
        document.querySelectorAll('[data-percussion-preset]').forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.dataset.percussionPreset;
                this.loadPercussionPreset(preset);
            });
        });
        
        document.getElementById('clearHarmonicsBtn')?.addEventListener('click', () => {
            this.harmonics.clear();
            document.querySelectorAll('.harmonic-cell').forEach(c => c.classList.remove('active'));
        });
        document.getElementById('clearMelodyBtn')?.addEventListener('click', () => {
            this.melodyRows.clear();
            document.querySelectorAll('.string-cell').forEach(c => c.classList.remove('active'));
        });
        document.getElementById('clearRhythmBtn')?.addEventListener('click', () => {
            Object.keys(this.rhythm).forEach(inst => this.rhythm[inst].clear());
            document.querySelectorAll('.rhythm-cell').forEach(c => c.classList.remove('active'));
        });
        
        // Toggle Drum Controls visibility using checkbox toggle switch
        document.getElementById('toggleDrumControls')?.addEventListener('change', function() {
            const drumControls = document.getElementById('drumControls');
            if (!drumControls) return;
            drumControls.style.display = this.checked ? 'flex' : 'none';
        });
        
        // Toggle Strings Controls visibility using checkbox toggle switch
        document.getElementById('toggleStringsControls')?.addEventListener('change', function() {
            const stringsControls = document.getElementById('stringsControls');
            if (!stringsControls) return;
            stringsControls.style.display = this.checked ? 'flex' : 'none';
        });
        
        // Toggle Bass Controls visibility using checkbox toggle switch
        document.getElementById('toggleBassControls')?.addEventListener('change', function() {
            const bassControls = document.getElementById('bassControls');
            if (!bassControls) return;
            bassControls.style.display = this.checked ? 'flex' : 'none';
        });
        
        // Toggle Lead Controls visibility using checkbox toggle switch
        document.getElementById('toggleLeadControls')?.addEventListener('change', function() {
            const leadControls = document.getElementById('leadControls');
            if (!leadControls) return;
            leadControls.style.display = this.checked ? 'flex' : 'none';
        });
        
        // Toggle Percussion Controls visibility using checkbox toggle switch
        document.getElementById('togglePercussionControls')?.addEventListener('change', function() {
            const percussionControls = document.getElementById('percussionControls');
            if (!percussionControls) return;
            percussionControls.style.display = this.checked ? 'flex' : 'none';
        });
        document.getElementById('clearBassBtn')?.addEventListener('click', () => {
            this.bassRows.clear();
            document.querySelectorAll('.bass-cell').forEach(c => c.classList.remove('active'));
        });
        document.getElementById('clearLeadBtn')?.addEventListener('click', () => {
            this.leadRows.clear();
            document.querySelectorAll('.lead-cell').forEach(c => c.classList.remove('active'));
        });
        
        document.getElementById('tempoSlider')?.addEventListener('input', (e) => {
            this.setTempo(e.target.value);
            if (this.isPlaying) { this.stop(); this.play(); }
        });

        const timeSignatureSelect = document.getElementById('timeSignature');
        if (timeSignatureSelect) {
            timeSignatureSelect.value = this.timeSignature;
            timeSignatureSelect.addEventListener('change', (e) => this.setTimeSignature(e.target.value));
        }
        
        document.getElementById('melodyScale')?.addEventListener('change', () => {
            const select = document.getElementById('melodyScale');
            const descriptor = this.getKeyDescriptorForScaleId(select?.value);
            if (descriptor) this.setMusicalKey(descriptor, { updateSelect: false });
            this.populateChordProgressionSelect();
        });
        // Keep the chosen progression visible; Apply generates and previews it.
        document.getElementById('applyChordProgressionBtn')?.addEventListener('click', () => {
            const select = document.getElementById('chordProgressionSelect');
            if (select && select.value !== '') {
                this.generateHarmonyFromChordProgression(select.value);
            } else {
                this.showNotification('Please select a chord progression first', 'info');
            }
        });
        
        document.getElementById('genreSelect')?.addEventListener('change', (e) => {
            this._songLoadRequest = (this._songLoadRequest || 0) + 1;
            this.setSwingForGenre(e.target.value);
            this.populateSongSelect(e.target.value);
        });
        document.getElementById('songSelect')?.addEventListener('change', (e) => { if (e.target.value) this.loadSongPreset(e.target.value); });
        document.getElementById('randomBtn')?.addEventListener('click', () => this.randomize());
        document.getElementById('helpBtn')?.addEventListener('click', () => this.showHelp());
        
        document.getElementById('harmonicsToggle')?.addEventListener('click', (e) => {
            this.harmonicsEnabled = !this.harmonicsEnabled;
            e.target.textContent = this.harmonicsEnabled ? 'ON' : 'OFF';
            e.target.classList.toggle('active', this.harmonicsEnabled);
            
            // Show/hide harmonics grid
            const harmonicsGrid = document.getElementById('harmonicsGrid');
            if (harmonicsGrid) {
                harmonicsGrid.style.display = this.harmonicsEnabled ? 'grid' : 'none';
            }
            
            // Disable/enable all controls within section-content
            const harmonicsSectionContent = document.querySelector('#harmonicsSection .section-content');
            if (harmonicsSectionContent) {
                harmonicsSectionContent.classList.toggle('disabled', !this.harmonicsEnabled);
                harmonicsSectionContent.querySelectorAll('select, button, input[type="range"]').forEach(el => {
                    el.disabled = !this.harmonicsEnabled;
                });
            }
        });
        
        document.getElementById('stringsToggle')?.addEventListener('click', (e) => {
            this.melodyEnabled = !this.melodyEnabled;
            e.target.textContent = this.melodyEnabled ? 'ON' : 'OFF';
            e.target.classList.toggle('active', this.melodyEnabled);
            
            // Show/hide strings/melody grid
            const stringsGrid = document.getElementById('stringsGrid');
            if (stringsGrid) {
                stringsGrid.style.display = this.melodyEnabled ? 'block' : 'none';
            }
            
            // Disable/enable all controls within section-content
            const stringsSectionContent = document.querySelector('#stringsSection .section-content');
            if (stringsSectionContent) {
                stringsSectionContent.classList.toggle('disabled', !this.melodyEnabled);
                stringsSectionContent.querySelectorAll('select, button, input[type="range"]').forEach(el => {
                    el.disabled = !this.melodyEnabled;
                });
            }
        });
        // Rhythm Section Toggle (for enabling/disabling drums)
        document.getElementById('rhythmSectionToggle')?.addEventListener('click', (e) => {
            this.rhythmEnabled = !this.rhythmEnabled;
            e.target.textContent = this.rhythmEnabled ? 'ON' : 'OFF';
            e.target.classList.toggle('active', this.rhythmEnabled);
            
            // Show/hide rhythm grid
            const rhythmGrid = document.getElementById('rhythmGrid');
            if (rhythmGrid) {
                rhythmGrid.style.display = this.rhythmEnabled ? 'block' : 'none';
            }
            
            // Disable/enable all controls within section-content
            const rhythmSectionContent = document.querySelector('#rhythmSection .section-content');
            if (rhythmSectionContent) {
                rhythmSectionContent.classList.toggle('disabled', !this.rhythmEnabled);
                rhythmSectionContent.querySelectorAll('select, button, input[type="range"]').forEach(el => {
                    el.disabled = !this.rhythmEnabled;
                });
            }
        });
        document.getElementById('effectsToggle')?.addEventListener('click', (e) => { this.toggleEffects(); });
        
        document.getElementById('masterVolume')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            const normalizedValue = value / 100;
            
            // Update Tone.js destination
            Tone.Destination.volume.value = Tone.gainToDb(normalizedValue);
            
            // Update individual Tone.js synth volumes
            const baseVolumes = {
                polySynth: -6,
                melodySynth: -4,
                bassSynth: -2,
                leadSynth: -3,
                'drums.kick': -4,
                'drums.snare': -10,
                'drums.hihat': -15,
                'drums.tom': -6,
                'percussion.conga': -8,
                'percussion.bongo': -10,
                'percussion.shaker': -12,
                'percussion.cymbal': -10
            };
            
            Object.entries(baseVolumes).forEach(([key, baseDb]) => {
                const parts = key.split('.');
                let synth = this;
                for (const part of parts) {
                    synth = synth?.[part];
                }
                if (synth && typeof synth.volume !== 'undefined') {
                    // Calculate final volume: base dB + (master percentage adjustment)
                    // At 100% master, use base volume; at 50% master, reduce by ~6dB
                    const masterAdjust = (normalizedValue - 1) * 20; // ±20dB range
                    const finalDb = baseDb + masterAdjust;
                    if (typeof synth.volume.setValueAtTime === 'function') {
                        synth.volume.setValueAtTime(finalDb, Tone.now());
                    } else {
                        synth.volume.value = finalDb;
                    }
                }
            });
            
            document.getElementById('masterValue').textContent = value + '%';
            this.updateEffectCardStates();
        });
        
        // === EFFECT SLIDER EVENT LISTENERS ===
        // Reverb Amount
        document.getElementById('reverbAmount')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('reverbValue').textContent = value + '%';
            if (this.effects?.reverb) {
                this.effects.reverb.wet.value = value / 100;
            }
            this.updateEffectCardStates();
        });
        
        // Echo Amount
        document.getElementById('echoAmount')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('echoValue').textContent = value + '%';
            if (this.effects?.echo) {
                this.effects.echo.wet.value = value / 100;
            }
            this.updateEffectCardStates();
        });
        
        // Chorus Amount
        document.getElementById('chorusAmount')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('chorusValue').textContent = value + '%';
            if (this.effects?.chorus) {
                this.effects.chorus.wet.value = value / 100;
            }
            this.updateEffectCardStates();
        });
        
        // Low-Pass Filter Amount
        document.getElementById('lowpassAmount')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('lowpassValue').textContent = value + '%';
            if (this.effects?.lowpass) {
                // Map 0-100 to frequency range 200Hz - 20000Hz (exponential)
                const freq = 200 + (20000 - 200) * Math.pow(value / 100, 2);
                this.effects.lowpass.frequency.value = freq;
            }
            this.updateEffectCardStates();
        });
        
        // High-Pass Filter Amount
        document.getElementById('highpassAmount')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('highpassValue').textContent = value + '%';
            if (this.effects?.highpass) {
                // Map 0-100 to frequency range 20Hz - 2000Hz (exponential)
                const freq = 20 + (2000 - 20) * Math.pow(value / 100, 2);
                this.effects.highpass.frequency.value = freq;
            }
            this.updateEffectCardStates();
        });
        
        // Distortion Amount
        document.getElementById('distortionAmount')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('distortionValue').textContent = value + '%';
            if (this.effects?.distortion) {
                this.effects.distortion.wet.value = value / 100;
                this.effects.distortion.distortion = value / 100; // 0 to 1
            }
            this.updateEffectCardStates();
        });
        
        // Bitcrush Amount
        document.getElementById('bitcrushAmount')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('bitcrushValue').textContent = value + '%';
            if (this.effects?.bitcrush) {
                this.effects.bitcrush.wet.value = value / 100;
                // Map 0-100 to bits: 16 (no crush) to 1 (heavy crush)
                const bits = Math.round(16 - (value / 100) * 15);
                this.effects.bitcrush.bits.value = Math.max(1, bits);
            }
            this.updateEffectCardStates();
        });
        
        // Tremolo Amount
        document.getElementById('tremoloAmount')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('tremoloValue').textContent = value + '%';
            if (this.effects?.tremolo) {
                this.effects.tremolo.wet.value = value / 100;
                this.effects.tremolo.depth = value / 100;
            }
            this.updateEffectCardStates();
        });
        
        // Vibrato Amount
        document.getElementById('vibratoAmount')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('vibratoValue').textContent = value + '%';
            if (this.effects?.vibrato) {
                this.effects.vibrato.wet.value = value / 100;
                this.effects.vibrato.depth = value / 100;
            }
            this.updateEffectCardStates();
        });
        
        document.querySelectorAll('[data-pattern-length]').forEach(btn => {
            btn.addEventListener('click', () => {
                const length = parseInt(btn.dataset.patternLength);
                const bars = Math.max(1, Math.round(length / 16));
                const genre = document.getElementById('genreSelect')?.value;
                const song = document.getElementById('songSelect')?.value;
                const mode = document.getElementById('patternExpansionMode')?.value || 'repeat';
                this.setPatternBars(bars, { addedSteps: mode === 'repeat' ? 'repeat' : 'empty' });
                if (genre) {
                    // Repeating or extending a tune keeps the user's edits instead of reloading a preset.
                    this.populateSongSelect(genre, mode === 'song' ? song : '');
                    if (mode === 'song' && song) this.loadSongPreset(song);
                }
                if (mode === 'song' && !song) this.showNotification('Choose a song in Tune Helper to load its version at this length.', 'info');
            });
        });
        
        document.getElementById('bassToggle')?.addEventListener('click', (e) => {
            this.bassEnabled = !this.bassEnabled;
            e.target.textContent = this.bassEnabled ? 'ON' : 'OFF';
            e.target.classList.toggle('active', this.bassEnabled);
            
            // Show/hide bass grid
            const bassGrid = document.getElementById('bassGrid');
            if (bassGrid) {
                bassGrid.style.display = this.bassEnabled ? 'block' : 'none';
            }
            
            // Remove hidden class and add show class from bass rows when showing
            if (this.bassEnabled) {
                document.querySelectorAll('.bass-group-row').forEach(row => {
                    row.classList.remove('hidden');
                    row.classList.add('show');
                });
            } else {
                document.querySelectorAll('.bass-group-row').forEach(row => {
                    row.classList.remove('show');
                    row.classList.add('hidden');
                });
            }
            
            // Disable/enable all controls within section-content
            const bassSectionContent = document.querySelector('#bassSection .section-content');
            if (bassSectionContent) {
                bassSectionContent.classList.toggle('disabled', !this.bassEnabled);
                bassSectionContent.querySelectorAll('select, button, input[type="range"]').forEach(el => {
                    el.disabled = !this.bassEnabled;
                });
            }
        });
        document.getElementById('leadToggle')?.addEventListener('click', (e) => {
            this.leadEnabled = !this.leadEnabled;
            e.target.textContent = this.leadEnabled ? 'ON' : 'OFF';
            e.target.classList.toggle('active', this.leadEnabled);
            
            // Show/hide lead grid
            const leadGrid = document.getElementById('leadGrid');
            if (leadGrid) {
                leadGrid.style.display = this.leadEnabled ? 'block' : 'none';
            }
            
            // Remove hidden class and add show class from lead rows when showing
            if (this.leadEnabled) {
                document.querySelectorAll('.lead-group-row').forEach(row => {
                    row.classList.remove('hidden');
                    row.classList.add('show');
                });
            } else {
                document.querySelectorAll('.lead-group-row').forEach(row => {
                    row.classList.remove('show');
                    row.classList.add('hidden');
                });
            }
            
            // Disable/enable all controls within section-content
            const leadSectionContent = document.querySelector('#leadSection .section-content');
            if (leadSectionContent) {
                leadSectionContent.classList.toggle('disabled', !this.leadEnabled);
                leadSectionContent.querySelectorAll('select, button, input[type="range"]').forEach(el => {
                    el.disabled = !this.leadEnabled;
                });
            }
        });
        document.getElementById('percussionToggle')?.addEventListener('click', (e) => {
            this.percussionEnabled = !this.percussionEnabled;
            e.target.textContent = this.percussionEnabled ? 'ON' : 'OFF';
            e.target.classList.toggle('active', this.percussionEnabled);
            
            // Show/hide percussion grid
            const percussionGrid = document.getElementById('percussionGrid');
            if (percussionGrid) {
                percussionGrid.style.display = this.percussionEnabled ? 'block' : 'none';
            }
            
            // Remove hidden class and add show class from percussion rows when showing
            if (this.percussionEnabled) {
                document.querySelectorAll('#percussionGrid .rhythm-group-row').forEach(row => {
                    row.classList.remove('hidden');
                    row.classList.add('show');
                });
            } else {
                document.querySelectorAll('#percussionGrid .rhythm-group-row').forEach(row => {
                    row.classList.remove('show');
                    row.classList.add('hidden');
                });
            }
            
            // Disable/enable all controls within section-content
            const percussionSectionContent = document.querySelector('#percussionSection .section-content');
            if (percussionSectionContent) {
                percussionSectionContent.classList.toggle('disabled', !this.percussionEnabled);
                percussionSectionContent.querySelectorAll('select, button, input[type="range"]').forEach(el => {
                    el.disabled = !this.percussionEnabled;
                });
            }
        });
        
        document.getElementById('harmonicInstrument')?.addEventListener('change', (e) => { this.setHarmonicInstrument(e.target.value); });
        document.getElementById('melodyInstrument')?.addEventListener('change', (e) => { this.setMelodyInstrument(e.target.value); });
        document.getElementById('bassInstrument')?.addEventListener('change', (e) => { this.setBassInstrument(e.target.value); });
        document.getElementById('leadInstrument')?.addEventListener('change', (e) => { this.setLeadInstrument(e.target.value); });
        document.getElementById('drumKit')?.addEventListener('change', (e) => { this.setDrumKit(e.target.value); });
        document.getElementById('percussionKit')?.addEventListener('change', (e) => { this.setPercussionKit(e.target.value); });
        
        // Drum Volume Control
        document.getElementById('drumVolume')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('drumVolumeValue').textContent = value + '%';
            
            // Update drum volumes
            const baseVolumes = {
                'drums.kick': -4,
                'drums.snare': -10,
                'drums.hihat': -15,
                'drums.tom': -6
            };
            
            const normalizedValue = value / 100;
            Object.entries(baseVolumes).forEach(([key, baseDb]) => {
                const parts = key.split('.');
                let synth = this;
                for (const part of parts) {
                    synth = synth?.[part];
                }
                if (synth && typeof synth.volume !== 'undefined') {
                    const masterAdjust = (normalizedValue - 1) * 20;
                    const finalDb = baseDb + masterAdjust;
                    if (typeof synth.volume.setValueAtTime === 'function') {
                        synth.volume.setValueAtTime(finalDb, Tone.now());
                    } else {
                        synth.volume.value = finalDb;
                    }
                }
            });
        });
        
        // Drum Cutoff Control
        document.getElementById('drumCutoff')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('drumCutoffValue').textContent = value + '%';
            // Cutoff is handled by global filter effect
        });
        
        // Drum Pan Control
        document.getElementById('drumPan')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            const panValue = value / 100;
            document.getElementById('drumPanValue').textContent = value === 0 ? 'C' : (value < 0 ? `L${Math.abs(value)}` : `R${value}`);
            
            // Update drum panners
            Object.keys(this.drumPanners).forEach(inst => {
                if (this.drumPanners[inst]) {
                    this.drumPanners[inst].pan.value = panValue;
                }
            });
            
            // Update Stage Positioning controls
            if (typeof StageManager !== 'undefined' && StageManager.updateFromSectionControls) {
                StageManager.updateFromSectionControls('rhythm');
            }
        });
        
        // Percussion Volume Control
        document.getElementById('percussionVolume')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('percussionVolumeValue').textContent = value + '%';
            
            // Update percussion volumes
            const baseVolumes = {
                'percussion.conga': -8,
                'percussion.bongo': -10,
                'percussion.shaker': -12,
                'percussion.cymbal': -10
            };
            
            const normalizedValue = value / 100;
            Object.entries(baseVolumes).forEach(([key, baseDb]) => {
                const parts = key.split('.');
                let synth = this;
                for (const part of parts) {
                    synth = synth?.[part];
                }
                if (synth && typeof synth.volume !== 'undefined') {
                    const masterAdjust = (normalizedValue - 1) * 20;
                    const finalDb = baseDb + masterAdjust;
                    if (typeof synth.volume.setValueAtTime === 'function') {
                        synth.volume.setValueAtTime(finalDb, Tone.now());
                    } else {
                        synth.volume.value = finalDb;
                    }
                }
            });
        });
        
        // Percussion Cutoff Control
        document.getElementById('percussionCutoff')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('percussionCutoffValue').textContent = value + '%';
            // Cutoff is handled by global filter effect
        });
        
        // Percussion Pan Control
        document.getElementById('percussionPan')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            const panValue = value / 100;
            document.getElementById('percussionPanValue').textContent = value === 0 ? 'C' : (value < 0 ? `L${Math.abs(value)}` : `R${value}`);
            
            // Update percussion panners
            Object.keys(this.percussionPanners).forEach(inst => {
                if (this.percussionPanners[inst]) {
                    this.percussionPanners[inst].pan.value = panValue;
                }
            });
            
            // Update Stage Positioning controls
            if (typeof StageManager !== 'undefined' && StageManager.updateFromSectionControls) {
                StageManager.updateFromSectionControls('percussion');
            }
        });
        
        // Strings Volume Control
        document.getElementById('stringsVolume')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('stringsVolumeValue').textContent = value + '%';
            
            // Update melody synth volume
            if (this.melodySynth) {
                const baseDb = -4;
                const normalizedValue = value / 100;
                const masterAdjust = (normalizedValue - 1) * 20;
                const finalDb = baseDb + masterAdjust;
                if (typeof this.melodySynth.volume.setValueAtTime === 'function') {
                    this.melodySynth.volume.setValueAtTime(finalDb, Tone.now());
                } else {
                    this.melodySynth.volume.value = finalDb;
                }
            }
            
            // Update Stage Positioning controls
            if (typeof StageManager !== 'undefined' && StageManager.updateFromSectionControls) {
                StageManager.updateFromSectionControls('strings');
            }
        });
        
        // Strings Cutoff Control
        document.getElementById('stringsCutoff')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('stringsCutoffValue').textContent = value + '%';
            
            // Update Stage Positioning controls
            if (typeof StageManager !== 'undefined' && StageManager.updateFromSectionControls) {
                StageManager.updateFromSectionControls('strings');
            }
        });
        
        // Strings Pan Control
        document.getElementById('stringsPan')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('stringsPanValue').textContent = value === 0 ? 'C' : (value < 0 ? `${Math.abs(value)}%L` : `${value}%R`);
            
            // Update melody panner
            if (this.melodyPanner) {
                this.melodyPanner.pan.value = value / 100;
            }
            
            // Update Stage Positioning controls
            if (typeof StageManager !== 'undefined' && StageManager.updateFromSectionControls) {
                StageManager.updateFromSectionControls('strings');
            }
        });
        
        // Bass Volume Control
        document.getElementById('bassVolume')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('bassVolumeValue').textContent = value + '%';
            
            // Update bass synth volume
            if (this.bassSynth) {
                const baseDb = -2;
                const normalizedValue = value / 100;
                const masterAdjust = (normalizedValue - 1) * 20;
                const finalDb = baseDb + masterAdjust;
                if (typeof this.bassSynth.volume.setValueAtTime === 'function') {
                    this.bassSynth.volume.setValueAtTime(finalDb, Tone.now());
                } else {
                    this.bassSynth.volume.value = finalDb;
                }
            }
            
            // Update Stage Positioning controls
            if (typeof StageManager !== 'undefined' && StageManager.updateFromSectionControls) {
                StageManager.updateFromSectionControls('bass');
            }
        });
        
        // Bass Cutoff Control
        document.getElementById('bassCutoff')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('bassCutoffValue').textContent = value + '%';
            
            // Update Stage Positioning controls
            if (typeof StageManager !== 'undefined' && StageManager.updateFromSectionControls) {
                StageManager.updateFromSectionControls('bass');
            }
        });
        
        // Bass Pan Control
        document.getElementById('bassPan')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('BassPanValue').textContent = value === 0 ? 'C' : (value < 0 ? `${Math.abs(value)}%L` : `${value}%R`);
            
            // Update bass panner
            if (this.bassPanner) {
                this.bassPanner.pan.value = value / 100;
            }
            
            // Update Stage Positioning controls
            if (typeof StageManager !== 'undefined' && StageManager.updateFromSectionControls) {
                StageManager.updateFromSectionControls('bass');
            }
        });
        
        // Lead Volume Control
        document.getElementById('leadVolume')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('leadVolumeValue').textContent = value + '%';
            
            // Update lead synth volume
            if (this.leadSynth) {
                const baseDb = -3;
                const normalizedValue = value / 100;
                const masterAdjust = (normalizedValue - 1) * 20;
                const finalDb = baseDb + masterAdjust;
                if (typeof this.leadSynth.volume.setValueAtTime === 'function') {
                    this.leadSynth.volume.setValueAtTime(finalDb, Tone.now());
                } else {
                    this.leadSynth.volume.value = finalDb;
                }
            }
            
            // Update Stage Positioning controls
            if (typeof StageManager !== 'undefined' && StageManager.updateFromSectionControls) {
                StageManager.updateFromSectionControls('lead');
            }
        });
        
        // Lead Cutoff Control
        document.getElementById('leadCutoff')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('pleadCutoffValue').textContent = value + '%';
            
            // Update Stage Positioning controls
            if (typeof StageManager !== 'undefined' && StageManager.updateFromSectionControls) {
                StageManager.updateFromSectionControls('lead');
            }
        });
        
        // Lead Pan Control
        document.getElementById('leadPan')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('leadPanValue').textContent = value === 0 ? 'C' : (value < 0 ? `${Math.abs(value)}%L` : `${value}%R`);
            
            // Update lead panner
            if (this.leadPanner) {
                this.leadPanner.pan.value = value / 100;
            }
            
            // Update Stage Positioning controls
            if (typeof StageManager !== 'undefined' && StageManager.updateFromSectionControls) {
                StageManager.updateFromSectionControls('lead');
            }
        });
        
        // Initialize section repeats control
        this.createSectionRepeatsControl();
    }
    
    toggleHarmonic(index, cell) {
        if (this.harmonics.has(index)) {
            this.harmonics.delete(index);
            cell.classList.remove('active');
        } else {
            this.harmonics.add(index);
            cell.classList.add('active');
            if (this.polySynth) this.polySynth.triggerAttackRelease(this.harmonicNotes[index], '8n');
            // Trigger visual pulse for individual cell click
            if (this.rhythmVisualizer && this.rhythmVisualizer.enabled) {
                this.rhythmVisualizer.pulseHarmonics();
            }
        }
        if (index < this.patternLength) {
            this.updateSectionTimelineForStep(index);
        }
    }
    
    toggleMelody(groupIndex, col, row, cell) {
        if (this.copyMode) {
            this.toggleCellSelection(row, col, 'melody');
            cell.classList.toggle('copy-selected');
            return;
        }
        if (this.pasteMode) {
            this.pasteCells(row, col, 'melody');
            return;
        }
        
        const groupData = this.patternGroups.melody[groupIndex];
        
        if (groupData.has(col) && groupData.get(col) === row) {
            groupData.delete(col);
            cell.classList.remove('active');
        } else {
            const existingRow = groupData.get(col);
            if (existingRow !== undefined) {
                const existingCell = document.querySelector(`.string-cell[data-col="${col}"][data-row="${existingRow}"][data-group-index="${groupIndex}"]`);
                if (existingCell) existingCell.classList.remove('active');
            }
            groupData.set(col, row);
            cell.classList.add('active');
            if (this.melodySynth) {
                const scale = this.getCurrentScale();
                this.melodySynth.triggerAttackRelease(scale[row], '16n');
            }
            // Trigger visual pulse for individual cell click
            if (this.rhythmVisualizer && this.rhythmVisualizer.enabled) {
                this.rhythmVisualizer.pulseMelody();
            }
        }
        
        const globalStep = groupIndex * this.getStepsPerBar() + col;
        this.updateTimelineForStep(globalStep);
        this.updateSectionTimelineForStep(globalStep);
        this.updateAccordionActivity();
    }
    
    toggleBass(groupIndex, col, row, cell) {
        if (this.copyMode) {
            this.toggleCellSelection(row, col, 'bass');
            cell.classList.toggle('copy-selected');
            return;
        }
        if (this.pasteMode) {
            this.pasteCells(row, col, 'bass');
            return;
        }
        
        const groupData = this.patternGroups.bass[groupIndex];
        
        if (groupData.has(col) && groupData.get(col) === row) {
            groupData.delete(col);
            cell.classList.remove('active');
        } else {
            const column = cell.parentElement;
            const activeCell = column.querySelector('.bass-cell.active');
            if (activeCell) activeCell.classList.remove('active');
            
            groupData.set(col, row);
            cell.classList.add('active');
            
            if (this.bassSynth && row < this.bassNotes.length) {
                const bassNote = this.bassNotes[row];
                this.bassSynth.triggerAttackRelease(bassNote, '8n');
            }
            // Trigger visual pulse for individual cell click
            if (this.rhythmVisualizer && this.rhythmVisualizer.enabled) {
                this.rhythmVisualizer.pulseBass();
            }
        }
        
        const globalStep = groupIndex * this.getStepsPerBar() + col;
        this.updateTimelineForStep(globalStep);
        this.updateSectionTimelineForStep(globalStep);
        this.updateAccordionActivity();
    }
    
    toggleLead(groupIndex, col, row, cell) {
        if (this.copyMode) {
            this.toggleCellSelection(row, col, 'lead');
            cell.classList.toggle('copy-selected');
            return;
        }
        if (this.pasteMode) {
            this.pasteCells(row, col, 'lead');
            return;
        }
        
        const groupData = this.patternGroups.lead[groupIndex];
        
        if (groupData && groupData.has(col) && groupData.get(col) === row) {
            groupData.delete(col);
            cell.classList.remove('active');
        } else {
            if (groupData) {
                const column = cell.parentElement;
                const activeCell = column.querySelector('.lead-cell.active');
                if (activeCell) activeCell.classList.remove('active');
                
                groupData.set(col, row);
                cell.classList.add('active');
                
                if (this.leadSynth) {
                    const leadScale = this.getLeadScale();
                    if (row < leadScale.length) {
                        this.leadSynth.triggerAttackRelease(leadScale[row], '16n');
                    }
                }
                // Trigger visual pulse for individual cell click
                if (this.rhythmVisualizer && this.rhythmVisualizer.enabled) {
                    this.rhythmVisualizer.pulseLead();
                }
            }
        }
        
        const globalStep = groupIndex * this.getStepsPerBar() + col;
        this.updateTimelineForStep(globalStep);
        this.updateSectionTimelineForStep(globalStep);
        this.updateAccordionActivity();
    }
    
    toggleRhythm(groupIndex, instrument, step, cell) {
        const groupData = this.patternGroups.rhythm[groupIndex];
        
        if (groupData[instrument].has(step)) {
            groupData[instrument].delete(step);
            cell.classList.remove('active');
        } else {
            groupData[instrument].add(step);
            cell.classList.add('active');
            if (this.drums?.[instrument]) this.drums[instrument].triggerAttackRelease('16n');
            // Trigger visual pulse for individual cell click
            if (this.rhythmVisualizer && this.rhythmVisualizer.enabled) {
                this.rhythmVisualizer.pulseDrums();
            }
        }
        
        const globalStep = groupIndex * this.getStepsPerBar() + step;
        this.updateTimelineForStep(globalStep);
        this.updateSectionTimelineForStep(globalStep);
    }
    
    play() {
        if (this.isPlaying) return;
        
        // Sync rhythm visualizer tempo
        if (this.rhythmVisualizer?.enabled) {
            this.rhythmVisualizer.setTempo(this.tempo);
        }
        
        this.isPlaying = true;
        this.currentStep = 0;
        this.groupLoopCurrent = [0, 0, 0, 0];
        
        const stepTime = (60 / this.tempo) * (this.getBarQuarterNotes() / this.getStepsPerBar()) * 1000;
        this.loopInterval = setInterval(() => {
            this.playStep(this.currentStep);
            
            const groupCount = this.getBarCount();
            const currentGroup = Math.floor(this.currentStep / this.getStepsPerBar());
            const localStep = this.currentStep % this.getStepsPerBar();
            
            if (localStep === this.getStepsPerBar() - 1) {
                this.groupLoopCurrent[currentGroup]++;
                
                if (this.groupLoopCurrent[currentGroup] < this.groupLoopCounts[currentGroup]) {
                    this.currentStep = currentGroup * this.getStepsPerBar();
                } else {
                    this.groupLoopCurrent[currentGroup] = 0;
                    
                    if (currentGroup < groupCount - 1) {
                        this.currentStep = (currentGroup + 1) * this.getStepsPerBar();
                    } else {
                        this.currentStep = 0;
                    }
                }
            } else {
                this.currentStep++;
            }
        }, stepTime);
        
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.classList.remove('btn-play');
            playBtn.classList.add('btn-stop');
            const playText = playBtn.querySelector('#playText');
            if (playText) playText.textContent = 'Stop';
            else playBtn.innerHTML = '<i class="fas fa-stop"></i> Stop';
        }
        
        // Pulse the rhythm section toggle button
        const rhythmSectionBtn = document.getElementById('rhythmSectionToggle');
        if (rhythmSectionBtn) {
            rhythmSectionBtn.classList.add('pulsing');
            setTimeout(() => rhythmSectionBtn.classList.remove('pulsing'), 500);
        }
    }
    
    stop() {
        this.isPlaying = false;
        clearInterval(this.loopInterval);
        this.currentStep = 0;
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.classList.remove('btn-stop');
            playBtn.classList.add('btn-play');
            const playText = playBtn.querySelector('#playText');
            if (playText) playText.textContent = 'Play';
            else playBtn.innerHTML = '<i class="fas fa-play"></i> Play';
        }
        document.querySelectorAll('.rhythm-cell').forEach(c => c.classList.remove('playing'));
        document.querySelectorAll('.timeline-step').forEach(c => c.classList.remove('playing'));
        document.querySelectorAll('.nav-step.playing').forEach(c => c.classList.remove('playing'));
    }
    
    playStep(step) {
        if (!this.polySynth) return;
        
        // Trigger rhythm visualizer pulse
        if (this.rhythmVisualizer?.enabled) {
            this.rhythmVisualizer.onStepPlay(step);
        }
        
        const groupIndex = Math.floor(step / this.getStepsPerBar());
        const localStep = step % this.getStepsPerBar();
        
        const groupMelody = this.patternGroups.melody[groupIndex];
        const groupBass = this.patternGroups.bass[groupIndex];
        const groupLead = this.patternGroups.lead[groupIndex];
        const groupRhythm = this.patternGroups.rhythm[groupIndex];
        
        const melodyVel = this.melodyVelocity.get(step) ?? 0.8;
        const harmonyVel = this.harmonyVelocity.get(step) ?? 0.8;
        const leadVel = this.leadVelocity.get(step) ?? 0.7;
        const bassVel = this.bassVelocity.get(step) ?? 0.8;
        
        const lowpassVal = this.effectAutomation.lowpass?.get(step);
        
        if (lowpassVal !== undefined && this.effects?.lowpass) {
            const freq = 200 + (20000 - 200) * Math.pow(lowpassVal / 100, 2);
            this.effects.lowpass.frequency.rampTo(freq, 0.05);
        }
        
        // Drums use the same Tone clock and mixer as the melodic parts.
        if (this.rhythmEnabled && groupRhythm) {
            Object.keys(this.drums || {}).forEach(instrument => {
                if (this.drums[instrument] && groupRhythm[instrument]?.has(localStep)) {
                    const vel = this.rhythmVelocity[instrument]?.get(step) ?? 0.8;
                    this.drums[instrument].triggerAttackRelease('16n', undefined, vel);

                    const cell = document.querySelector(`.rhythm-cell[data-instrument="${instrument}"][data-step="${localStep}"]`);
                    if (cell) {
                        cell.classList.add('playing');
                        setTimeout(() => cell.classList.remove('playing'), 150);
                    }
                }
            });
        }

        // Tone.js for melodic instruments (harmony, melody, bass, lead)
        if (this.harmonicsEnabled && step === 0 && this.harmonics.size > 0) {
            const notes = Array.from(this.harmonics).map(i => this.harmonicNotes[i]);
            this.polySynth.triggerAttackRelease(notes, '1m', undefined, harmonyVel);
        }
        
        if (this.melodyEnabled && groupMelody?.has(localStep)) {
            const row = groupMelody.get(localStep);
            const scale = this.getCurrentScale();
            if (row < scale.length) {
                this.melodySynth.triggerAttackRelease(scale[row], '16n', undefined, melodyVel);
            }
        }
        
        if (this.bassEnabled && groupBass?.has(localStep)) {
            const row = groupBass.get(localStep);
            if (row < this.bassNotes.length) {
                const bassNote = this.bassNotes[row];
                this.bassSynth.triggerAttackRelease(bassNote, '8n', undefined, bassVel);
            }
        }
        
        if (this.leadEnabled && groupLead?.has(localStep)) {
            const row = groupLead.get(localStep);
            const leadScale = this.getLeadScale();
            if (row < leadScale.length) {
                this.leadSynth.triggerAttackRelease(leadScale[row], '16n', undefined, leadVel);
            }
        }
        
        if (this.percussionEnabled && groupRhythm) {
            Object.keys(this.percussion || {}).forEach(instrument => {
                if (this.percussion[instrument] && groupRhythm[instrument]?.has(localStep)) {
                    const vel = this.rhythmVelocity[instrument]?.get(step) ?? 0.7;
                    this.percussion[instrument].triggerAttackRelease('16n', undefined, vel);
                    
                    const cell = document.querySelector(`.rhythm-cell[data-instrument="${instrument}"][data-step="${localStep}"]`);
                    if (cell) {
                        cell.classList.add('playing');
                        setTimeout(() => cell.classList.remove('playing'), 150);
                    }
                }
            });
        }
        
        this.updateTimelineState();
        this.updateSectionTimelinesPlaying();
    }
    
    clearAll() {
        this._songLoadRequest = (this._songLoadRequest || 0) + 1;
        this._helperRequest = (this._helperRequest || 0) + 1;
        this.stop();
        
        this.patternGroups.harmonics.forEach(g => g.clear());
        this.groupChords = Array.from({length: this.getBarCount()}, () => null);
        this.patternGroups.melody.forEach(g => g.clear());
        this.patternGroups.bass.forEach(g => g.clear());
        this.patternGroups.lead.forEach(g => g.clear());
        this.patternGroups.rhythm.forEach(g => {
            Object.keys(g).forEach(inst => g[inst].clear());
        });
        
        this.harmonics = this.patternGroups.harmonics[this.currentGroupIndex];
        this.melodyRows = this.patternGroups.melody[this.currentGroupIndex];
        this.bassRows = this.patternGroups.bass[this.currentGroupIndex];
        this.leadRows = this.patternGroups.lead[this.currentGroupIndex];
        this.rhythm = this.patternGroups.rhythm[this.currentGroupIndex];
        
        document.querySelectorAll('.harmonic-cell').forEach(c => c.classList.remove('active'));
        document.querySelectorAll('.string-cell').forEach(c => c.classList.remove('active'));
        document.querySelectorAll('.bass-cell').forEach(c => c.classList.remove('active'));
        document.querySelectorAll('.lead-cell').forEach(c => c.classList.remove('active'));
        document.querySelectorAll('.rhythm-cell').forEach(c => c.classList.remove('active'));
        
        this.updateTimelineState();
        this.updateSectionTimelineState();
    }
    
    getCurrentScale() {
        const select = document.getElementById('melodyScale');
        const scaleId = select ? select.value : (this.activeScaleId || 'c-major');
        return this.scales?.[scaleId] || this.scales?.['c-major'] || ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
    }

    // The lead palette is the melody palette transposed by one octave. Applying
    // the shift to the whole palette keeps the 16 rows in ascending pitch order;
    // shifting only the first eight rows made rows 7 and 8 overlap.
    getLeadScale() {
        return this.getCurrentScale().map(note => this.transposeNote(note, 1));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TONAL CENTRE / KEY HANDLING
    // Song files store a keyName such as "E Minor" or "Bb Major". These helpers
    // turn that into scale, chord and bass palettes so every part follows the key.
    // ─────────────────────────────────────────────────────────────────────────

    parseKeyName(keyName) {
        if (keyName && typeof keyName === 'object' && keyName.root) return keyName;
        const raw = String(keyName || '').trim();
        const match = raw.match(/^([A-Ga-g])([#b]?)\s*(major|minor|maj|min|m)?\b/i);
        if (!match) return null;

        const pitchClasses = {
            C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5,
            'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11
        };
        const rootName = match[1].toUpperCase() + (match[2] || '');
        const pitchClass = pitchClasses[rootName];
        if (pitchClass === undefined) return null;

        let mode = (match[3] || '').toLowerCase();
        if (mode === 'm' || mode === 'min') mode = 'minor';
        else if (mode === 'maj') mode = 'major';
        else if (!mode) mode = /m$/i.test(raw) && !/major/i.test(raw) ? 'minor' : 'major';

        // Choose a readable spelling from the key signature rather than only the
        // accidental on the tonic (F major needs Bb, for example).
        const flatMajorPcs = new Set([5, 10, 3, 8, 1, 6]);
        const flatMinorPcs = new Set([2, 7, 0, 5, 10, 3]);
        const preferFlats = /b/.test(rootName) || (!/#/.test(rootName) && (mode === 'minor' ? flatMinorPcs : flatMajorPcs).has(pitchClass));

        return {
            root: rootName,
            pitchClass,
            mode,
            preferFlats,
            name: `${rootName} ${mode === 'minor' ? 'Minor' : 'Major'}`
        };
    }

    midiToNoteName(midi, preferFlats = false) {
        const sharp = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const flat = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
        const names = preferFlats ? flat : sharp;
        const value = Math.round(midi);
        const pc = ((value % 12) + 12) % 12;
        const octave = Math.floor(value / 12) - 1;
        return `${names[pc]}${octave}`;
    }

    notePitchClass(note) {
        const match = String(note || '').match(/^([A-G])([#b]?)/);
        if (!match) return null;
        const values = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
        let pc = values[match[1]];
        if (match[2] === '#') pc += 1;
        if (match[2] === 'b') pc -= 1;
        return ((pc % 12) + 12) % 12;
    }

    buildKeyPalette(descriptor) {
        const intervals = descriptor.mode === 'minor'
            ? [0, 2, 3, 5, 7, 8, 10, 12]
            : [0, 2, 4, 5, 7, 9, 11, 12];
        const pc = descriptor.pitchClass;
        const flats = descriptor.preferFlats;

        const melody = [];
        for (let i = 0; i < 16; i++) {
            const octaveOffset = Math.floor(i / 7);
            const interval = intervals[i % 7] + octaveOffset * 12;
            melody.push(this.midiToNoteName(12 * 5 + pc + interval, flats));
        }

        const bass = [];
        for (let i = 0; i < 12; i++) {
            const degree = i % 7;
            const octave = Math.floor(i / 7);
            bass.push(this.midiToNoteName(12 * 2 + pc + intervals[degree] + octave * 12, flats));
        }

        const third = descriptor.mode === 'minor' ? 3 : 4;
        const seventh = descriptor.mode === 'minor' ? 10 : 11;
        const harmonicIntervals = [0, third, 7, 12, 12 + third, 19, 12 + seventh, 26];
        const harmonic = harmonicIntervals.map(interval =>
            this.midiToNoteName(12 * 4 + pc + interval, flats));

        return { melody, bass, harmonic };
    }

    scaleIdForKey(descriptor) {
        const root = descriptor.root.replace('#', 'sharp').replace('b', 'flat');
        return `key-${root.toLowerCase()}-${descriptor.mode}`;
    }

    setMusicalKey(keyNameOrDescriptor, { updateSelect = true } = {}) {
        const descriptor = typeof keyNameOrDescriptor === 'string'
            ? this.parseKeyName(keyNameOrDescriptor)
            : keyNameOrDescriptor;
        if (!descriptor) return false;

        const palette = this.buildKeyPalette(descriptor);
        this.currentKey = descriptor;
        this.scales = this.scales || {};
        this.keyScaleIds = this.keyScaleIds || {};

        const scaleId = this.scaleIdForKey(descriptor);
        this.scales[scaleId] = palette.melody;
        this.keyScaleIds[scaleId] = descriptor;
        this.activeScaleId = scaleId;
        this.harmonicNotes = palette.harmonic;
        this.bassNotes = palette.bass;

        if (updateSelect) {
            const select = document.getElementById('melodyScale');
            if (select) {
                let option = Array.from(select.options || []).find(item => item.value === scaleId);
                if (!option) {
                    option = document.createElement('option');
                    option.value = scaleId;
                    option.textContent = descriptor.name;
                    select.appendChild(option);
                }
                select.value = scaleId;
            }
        }

        if (document.getElementById('harmonicsGrid')) this.createHarmonicsGrid();
        return true;
    }

    getKeyDescriptorForScaleId(scaleId) {
        if (this.keyScaleIds?.[scaleId]) return this.keyScaleIds[scaleId];
        const staticKeys = {
            'c-major': { root: 'C', pitchClass: 0, mode: 'major', preferFlats: false, name: 'C Major' },
            'g-major': { root: 'G', pitchClass: 7, mode: 'major', preferFlats: false, name: 'G Major' },
            'f-major': { root: 'F', pitchClass: 5, mode: 'major', preferFlats: true, name: 'F Major' },
            'd-minor': { root: 'D', pitchClass: 2, mode: 'minor', preferFlats: true, name: 'D Minor' },
            'a-minor': { root: 'A', pitchClass: 9, mode: 'minor', preferFlats: false, name: 'A Minor' }
        };
        return staticKeys[scaleId] || null;
    }

    // Keep every chord recognisably major or minor. Some legacy presets store
    // root/fifth/ninth shapes with the third omitted.
    ensureChordHasThird(indices) {
        const unique = Array.from(new Set(indices || [])).filter(index => index >= 0 && index < this.harmonicNotes.length);
        if (unique.length < 2) return unique;
        const thirdPc = (this.currentKey.pitchClass + (this.currentKey.mode === 'minor' ? 3 : 4)) % 12;
        const hasThird = unique.some(index => this.notePitchClass(this.harmonicNotes[index]) === thirdPc);
        if (!hasThird) unique.push(1);
        return Array.from(new Set(unique)).sort((a, b) => a - b);
    }

    transposeNote(note, octaves = 0) {
        const match = String(note || '').match(/^([A-G][#b]?)(-?\d+)$/);
        if (!match) return note;
        return `${match[1]}${parseInt(match[2], 10) + octaves}`;
    }

    // Deterministic note lengths: hold each note until the next onset in its
    // part, capped so a lone note does not ring for an entire phrase.
    nextOnsetStep(stepMap, localStep, groupSize = null) {
        const barSteps = groupSize || this.getStepsPerBar();
        let next = null;
        for (const step of stepMap.keys()) {
            if (step > localStep && (next === null || step < next)) next = step;
        }
        return next === null ? barSteps : next;
    }

    noteLengthSeconds(stepMap, localStep, stepSeconds, maxSteps = 8, groupSize = null) {
        const gap = Math.max(1, this.nextOnsetStep(stepMap, localStep, groupSize) - localStep);
        return Math.max(0.03, Math.min(maxSteps, gap) * stepSeconds * 0.92);
    }
    
    showHelp() {
        const helpModal = document.getElementById('helpModal');
        helpModal?.classList.remove('hidden');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-size: 14px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            background: ${type === 'success' ? '#00c853' : type === 'error' ? '#ff5252' : '#2196f3'};
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // Step Timeline Methods
    createStepTimeline() {
        const container = document.getElementById('timelineContainer');
        if (!container) return;
        
        container.innerHTML = '';
        const stepGroups = this.getStepGroupDefinitions();
        
        stepGroups.forEach((group, index) => {
            const section = this.createTimelineSection(group, index);
            container.appendChild(section);
        });
        
        this.updateTimelineState();
    }
    
    createTimelineSection(group, index) {
        const section = document.createElement('div');
        section.className = 'timeline-section expanded';
        section.dataset.groupIndex = index;
        section.dataset.start = group.start;
        section.dataset.end = group.end;
        
        const header = document.createElement('div');
        header.className = 'timeline-header';
        header.innerHTML = `
            <span class="timeline-label">${group.name}</span>
            <button class="timeline-toggle" title="Toggle expansion">
                <i class="fas fa-compress-arrows-alt"></i>
            </button>
        `;
        
        const stepsContainer = document.createElement('div');
        stepsContainer.className = 'timeline-steps';
        
        const barSteps = group.end - group.start + 1;
        for (let i = 0; i < barSteps; i++) {
            const step = group.start + i;
            const stepCell = document.createElement('div');
            stepCell.className = 'timeline-step';
            stepCell.dataset.step = step;
            stepCell.title = `Step ${step}`;
            
            if (this.hasStepActivity(step)) {
                stepCell.classList.add('active');
            }
            
            stepsContainer.appendChild(stepCell);
        }
        
        const description = document.createElement('div');
        description.className = 'timeline-description';
        description.textContent = group.description;
        
        section.appendChild(header);
        section.appendChild(stepsContainer);
        section.appendChild(description);
        
        section.addEventListener('click', (e) => {
            if (e.target.closest('.timeline-toggle')) return;
            this.toggleTimelineSection(section);
        });
        
        return section;
    }
    
    hasStepActivity(step) {
        const groupIndex = Math.floor(step / this.getStepsPerBar());
        const localStep = step % this.getStepsPerBar();
        const groupData = this.patternGroups;
        
        if (groupData.melody[groupIndex]?.has(localStep)) return true;
        if (groupData.bass[groupIndex]?.has(localStep)) return true;
        if (groupData.lead[groupIndex]?.has(localStep)) return true;
        if (groupData.rhythm[groupIndex]) {
            for (const inst of Object.keys(groupData.rhythm[groupIndex])) {
                if (groupData.rhythm[groupIndex][inst].has(localStep)) return true;
            }
        }
        return false;
    }
    
    toggleTimelineSection(section) {
        const isExpanded = section.classList.contains('expanded');
        
        document.querySelectorAll('.timeline-section').forEach(s => {
            s.classList.remove('expanded');
            s.classList.add('collapsed');
            s.classList.remove('active');
        });
        
        if (!isExpanded) {
            section.classList.remove('collapsed');
            section.classList.add('expanded');
            section.classList.add('active');
        } else {
            section.classList.remove('collapsed');
            section.classList.add('expanded');
            section.classList.add('active');
        }
    }
    
    updateTimelineState() {
        document.querySelectorAll('.timeline-step').forEach(cell => {
            const step = parseInt(cell.dataset.step);
            cell.classList.toggle('active', this.hasStepActivity(step));
        });
        
        if (this.isPlaying) {
            document.querySelectorAll('.timeline-step.playing').forEach(c => c.classList.remove('playing'));
            const currentCell = document.querySelector(`.timeline-step[data-step="${this.currentStep}"]`);
            if (currentCell) currentCell.classList.add('playing');
        }
    }
    
    updateTimelineForStep(step) {
        const cell = document.querySelector(`.timeline-step[data-step="${step}"]`);
        if (cell) {
            cell.classList.toggle('active', this.hasStepActivity(step));
        }
    }
    
    // Section Timeline Methods
    createSectionTimelines() {
        const sections = [
            { id: 'harmonics', name: 'Harmonics', data: this.harmonics },
            { id: 'melody', name: 'Melody', data: this.melodyRows },
            { id: 'rhythm', name: 'Rhythm', data: this.rhythm },
            { id: 'bass', name: 'Bass', data: this.bassRows },
            { id: 'lead', name: 'Lead', data: this.leadRows },
            { id: 'percussion', name: 'Percussion', data: this.percussionEnabled ? this.rhythm : null }
        ];
        
        const stepGroups = this.getStepGroupDefinitions();
        
        sections.forEach(section => {
            const container = document.getElementById(`${section.id}Timeline`);
            if (!container) return;
            
            container.innerHTML = '';
            
            // Store section visibility state
            if (!this.sectionVisibility) {
                this.sectionVisibility = {};
            }
            if (this.sectionVisibility[section.id] === undefined) {
                this.sectionVisibility[section.id] = true; // Default to visible
            }
            
            stepGroups.forEach((group, groupIndex) => {
                const groupRow = document.createElement('div');
                groupRow.className = `group-grid-row${groupIndex === this.currentGroupIndex ? ' active' : ''}`;
                groupRow.dataset.groupIndex = groupIndex;
                
                const groupLabel = document.createElement('div');
                groupLabel.className = 'group-grid-label';
                groupLabel.innerHTML = `<span class="group-name">${group.name}</span><span class="group-range">${group.start + 1}-${group.end + 1}</span>`;
                groupRow.appendChild(groupLabel);
                
                const stepsGrid = document.createElement('div');
                stepsGrid.className = 'group-grid-steps';
                
                const timelineCells = Math.ceil(this.getStepsPerBar() / 2);
                stepsGrid.style.gridTemplateColumns = `repeat(${timelineCells}, minmax(0, 1fr))`;
                for (let i = 0; i < timelineCells; i++) {
                    const stepCell = document.createElement('div');
                    stepCell.className = 'group-step';
                    stepCell.dataset.step = i;
                    
                    if (this.hasSectionActivity(section, groupIndex, i)) {
                        stepCell.classList.add('active');
                    }
                    
                    stepsGrid.appendChild(stepCell);
                }
                
                groupRow.appendChild(stepsGrid);
                
                
                // Timeline cells are now purely for display - no click interaction
                
                container.appendChild(groupRow);
            });
        });
        
        this.updateSectionTimelineState();
    }
    
    // Hide all rows for a specific section type
    hideSectionType(sectionId) {
        switch(sectionId) {
            case 'melody':
                document.querySelectorAll('.melody-group-row').forEach(row => {
                    row.classList.remove('show');
                    row.classList.add('hidden');
                });
                break;
            case 'bass':
                document.querySelectorAll('.bass-group-row').forEach(row => {
                    row.classList.remove('show');
                    row.classList.add('hidden');
                });
                break;
            case 'lead':
                document.querySelectorAll('.lead-group-row').forEach(row => {
                    row.classList.remove('show');
                    row.classList.add('hidden');
                });
                break;
            case 'rhythm':
                document.querySelectorAll('#rhythmGrid .rhythm-group-row').forEach(row => {
                    row.classList.remove('show');
                    row.classList.add('hidden');
                });
                break;
            case 'percussion':
                document.querySelectorAll('#percussionGrid .rhythm-group-row').forEach(row => {
                    row.classList.remove('show');
                    row.classList.add('hidden');
                });
                break;
            case 'harmonics':
                const harmonicsGrid = document.getElementById('harmonicsGrid');
                if (harmonicsGrid) {
                    harmonicsGrid.style.display = 'none';
                }
                break;
        }
    }
    
    hasSectionActivity(section, groupIndex, step) {
        // step now represents a pair of steps (0-1, 2-3, 4-5, etc.)
        const step1 = step * 2;
        const step2 = step * 2 + 1;
        
        if (!section.data) return false;
        
        switch(section.id) {
            case 'harmonics':
                // Harmonics is a static chord selector (not step-based)
                return this.patternGroups.harmonics[groupIndex]?.size > 0;
            case 'melody':
                return this.patternGroups.melody[groupIndex]?.has(step1) || this.patternGroups.melody[groupIndex]?.has(step2);
            case 'bass':
                return this.patternGroups.bass[groupIndex]?.has(step1) || this.patternGroups.bass[groupIndex]?.has(step2);
            case 'lead':
                return this.patternGroups.lead[groupIndex]?.has(step1) || this.patternGroups.lead[groupIndex]?.has(step2);
            case 'rhythm':
            case 'percussion':
                const rhythmData = this.patternGroups.rhythm[groupIndex];
                if (rhythmData) {
                    // Check if either step in the pair has activity
                    for (const inst of Object.keys(rhythmData)) {
                        if (rhythmData[inst].has(step1) || rhythmData[inst].has(step2)) return true;
                    }
                }
                return false;
            default:
                return false;
        }
    }
    
    updateSectionTimelineState() {
        const sections = ['harmonics', 'melody', 'rhythm', 'bass', 'lead', 'percussion'];
        const stepGroups = this.getStepGroupDefinitions();
        
        sections.forEach(sectionId => {
            const container = document.getElementById(`${sectionId}Timeline`);
            if (!container) return;
            
            const rows = container.querySelectorAll('.group-grid-row');
            rows.forEach((row, index) => {
                row.classList.toggle('active', index === this.currentGroupIndex);
            });
            
            const sectionData = this.getSectionData(sectionId);
            rows.forEach((row, groupIndex) => {
                const stepCells = row.querySelectorAll('.group-step');
                stepCells.forEach((cell, stepIndex) => {
                    cell.classList.toggle('active', this.hasSectionActivity({ id: sectionId, data: sectionData }, groupIndex, stepIndex));
                });
            });
        });
        
        this.updateSectionTimelinesPlaying();
    }
    
    getSectionData(sectionId) {
        switch(sectionId) {
            case 'harmonics': return this.harmonics;
            case 'melody': return this.melodyRows;
            case 'rhythm': return this.rhythm;
            case 'bass': return this.bassRows;
            case 'lead': return this.leadRows;
            case 'percussion': return this.percussionEnabled ? this.rhythm : null;
            default: return null;
        }
    }
    
    updateSectionTimelinesPlaying() {
        const sections = ['harmonics', 'melody', 'rhythm', 'bass', 'lead', 'percussion'];
        
        sections.forEach(sectionId => {
            const container = document.getElementById(`${sectionId}Timeline`);
            if (!container) return;
            
            container.querySelectorAll('.group-step.playing').forEach(c => c.classList.remove('playing'));
            
            if (this.isPlaying) {
                const groupIndex = Math.floor(this.currentStep / this.getStepsPerBar());
                const localStep = this.currentStep % this.getStepsPerBar();
                // Convert to cell index
                const cellIndex = Math.floor(localStep / 2);
                
                const activeRow = container.querySelectorAll('.group-grid-row')[groupIndex];
                if (activeRow) {
                    const playingCell = activeRow.querySelector(`.group-step[data-step="${cellIndex}"]`);
                    if (playingCell) playingCell.classList.add('playing');
                }
            }
        });
    }
    
    updateSectionTimelineForStep(step) {
        const stepsPerBar = this.getStepsPerBar();
        const groupIndex = Math.floor(step / stepsPerBar);
        const localStep = step % stepsPerBar;
        // Convert the local step to a paired timeline cell.
        const cellIndex = Math.floor(localStep / 2);
        
        const sections = ['harmonics', 'melody', 'rhythm', 'bass', 'lead', 'percussion'];
        
        sections.forEach(sectionId => {
            const container = document.getElementById(`${sectionId}Timeline`);
            if (!container) return;
            
            const rows = container.querySelectorAll('.group-grid-row');
            const activeRow = rows[groupIndex];
            if (activeRow) {
                const stepCell = activeRow.querySelector(`.group-step[data-step="${cellIndex}"]`);
                if (stepCell) {
                    stepCell.classList.toggle('active', this.hasSectionActivity({ id: sectionId, data: this.getSectionData(sectionId) }, groupIndex, cellIndex));
                }
            }
        });
    }
    
    updateAccordionActivity() {
        // Override in subclass if needed
    }
    
    toggleSectionVisibility(sectionId, groupIndex) {
        // Hide all rows for all sections
        this.hideAllSectionRows();
        
        // Show only the selected group's rows for this section
        this.showSectionRows(sectionId, groupIndex);
        
        // Update timeline active state
        this.updateTimelineActiveState(sectionId, groupIndex);
    }
    
    hideAllSectionRows() {
        // Hide all melody group rows
        document.querySelectorAll('.melody-group-row').forEach(row => {
            row.classList.remove('show');
            row.classList.add('hidden');
        });
        
        // Hide all bass group rows
        document.querySelectorAll('.bass-group-row').forEach(row => {
            row.classList.remove('show');
            row.classList.add('hidden');
        });
        
        // Hide all lead group rows
        document.querySelectorAll('.lead-group-row').forEach(row => {
            row.classList.remove('show');
            row.classList.add('hidden');
        });
        
        // Hide all rhythm group rows
        document.querySelectorAll('.rhythm-group-row').forEach(row => {
            row.classList.remove('show');
            row.classList.add('hidden');
        });
        
        // Hide percussion grid if it exists
        const percussionGrid = document.getElementById('percussionGrid');
        if (percussionGrid) {
            percussionGrid.querySelectorAll('.rhythm-group-row').forEach(row => {
                row.classList.remove('show');
                row.classList.add('hidden');
            });
        }
    }
    
    showSectionRows(sectionId, groupIndex) {
        switch(sectionId) {
            case 'melody':
                const melodyRow = document.querySelector(`.melody-group-row[data-group-index="${groupIndex}"]`);
                if (melodyRow) {
                    melodyRow.classList.remove('hidden');
                    melodyRow.classList.add('show');
                }
                break;
            case 'bass':
                const bassRow = document.querySelector(`.bass-group-row[data-group-index="${groupIndex}"]`);
                if (bassRow) {
                    bassRow.classList.remove('hidden');
                    bassRow.classList.add('show');
                }
                break;
            case 'lead':
                const leadRow = document.querySelector(`.lead-group-row[data-group-index="${groupIndex}"]`);
                if (leadRow) {
                    leadRow.classList.remove('hidden');
                    leadRow.classList.add('show');
                }
                break;
            case 'rhythm':
                const rhythmRows = document.querySelectorAll(`.rhythm-group-row[data-group-index="${groupIndex}"]`);
                rhythmRows.forEach(row => {
                    // Only show rhythm rows that are in the rhythmGrid (not percussionGrid)
                    if (row.closest('#rhythmGrid')) {
                        row.classList.remove('hidden');
                        row.classList.add('show');
                    }
                });
                break;
            case 'percussion':
                const percussionRows = document.querySelectorAll(`.rhythm-group-row[data-group-index="${groupIndex}"]`);
                percussionRows.forEach(row => {
                    // Only show percussion rows that are in the percussionGrid
                    if (row.closest('#percussionGrid')) {
                        row.classList.remove('hidden');
                        row.classList.add('show');
                    }
                });
                break;
            case 'harmonics':
                // Harmonics doesn't have group rows - it's a single static grid
                break;
        }
    }
    
    updateTimelineActiveState(sectionId, groupIndex) {
        // Update the active state in the timeline for the clicked section
        const container = document.getElementById(`${sectionId}Timeline`);
        if (!container) return;
        
        const rows = container.querySelectorAll('.group-grid-row');
        rows.forEach((row, index) => {
            if (index === groupIndex) {
                row.classList.add('active');
            } else {
                row.classList.remove('active');
            }
        });
    }
    
    showAllSectionRows() {
        // Show all rows for all sections
        document.querySelectorAll('.melody-group-row, .bass-group-row, .lead-group-row, .rhythm-group-row').forEach(row => {
            row.classList.remove('hidden');
            row.classList.add('show');
        });
    }
    
    // Chord Progression Builder methods
    getChordKeyForScale(scaleKey) {
        return this.scaleToChordKey[scaleKey] || 'c-major';
    }
    
    getChordProgressionForKey(key) {
        return this.chordProgressions[key] || this.chordProgressions['c-major'];
    }
    
    getKeyIntervals() {
        return this.currentKey?.mode === 'minor'
            ? [0, 2, 3, 5, 7, 8, 10, 12]
            : [0, 2, 4, 5, 7, 9, 11, 12];
    }

    degreeMidi(degree, octave = 3) {
        const intervals = this.getKeyIntervals();
        const pc = this.currentKey?.pitchClass ?? 0;
        const octaveOffset = Math.floor(degree / 7);
        const scaleDegree = ((degree % 7) + 7) % 7;
        return 12 * (octave + 1) + pc + intervals[scaleDegree] + octaveOffset * 12;
    }

    buildDiatonicChord(degree, octave = 3, size = 3) {
        return [0, 2, 4, 6].slice(0, size).map(offset =>
            this.midiToNoteName(this.degreeMidi(degree + offset, octave), this.currentKey?.preferFlats));
    }

    romanNumeralForDegree(degree) {
        const base = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][((degree % 7) + 7) % 7];
        const third = (this.degreeMidi(degree + 2) - this.degreeMidi(degree) + 120) % 12;
        const fifth = (this.degreeMidi(degree + 4) - this.degreeMidi(degree) + 120) % 12;
        let numeral = third === 3 ? base.toLowerCase() : base;
        if (fifth === 6) numeral += '°';
        else if (fifth === 8) numeral += '+';
        return numeral;
    }

    getChordCatalogForCurrentKey() {
        const catalog = {};
        for (let degree = 0; degree < 7; degree++) {
            catalog[this.romanNumeralForDegree(degree)] = this.buildDiatonicChord(degree);
        }
        return catalog;
    }

    getChordProgressionsForCurrentKey() {
        const major = [
            [0, 3, 4, 0], [0, 5, 3, 4], [0, 3, 0, 4],
            [5, 3, 0, 4], [0, 4, 5, 3], [1, 4, 0, 0]
        ];
        const minor = [
            [0, 3, 4, 0], [0, 5, 2, 6], [0, 3, 0, 4],
            [5, 3, 0, 4], [0, 6, 5, 4]
        ];
        const sequences = this.currentKey?.mode === 'minor' ? minor : major;
        return sequences.map(degrees => ({
            degrees,
            label: degrees.map(degree => this.romanNumeralForDegree(degree)).join(' - '),
            chords: degrees.map(degree => this.buildDiatonicChord(degree))
        }));
    }

    // Assign one chord to each 16-step bar instead of unioning the whole
    // progression into a single static cluster.
    applyChordSequence(chords) {
        const usable = (chords || []).filter(chord => Array.isArray(chord) && chord.length > 0);
        if (usable.length === 0) return false;
        const groupCount = this.getBarCount();
        this.groupChords = Array.from({length: groupCount}, (_, group) => usable[group % usable.length].slice());
        this.patternGroups.harmonics.forEach((set, group) => {
            set.clear();
            const pitchClasses = new Set(this.groupChords[group].map(note => this.notePitchClass(note)));
            this.harmonicNotes.forEach((note, index) => {
                if (pitchClasses.has(this.notePitchClass(note))) set.add(index);
            });
        });
        this.harmonics = this.patternGroups.harmonics[this.currentGroupIndex];
        this.harmonicsEnabled = true;
        this.updateHarmonicsUI();
        if (document.getElementById('harmonicsGrid')) this.createHarmonicsGrid();
        return true;
    }

    populateChordProgressionSelect() {
        const select = document.getElementById('chordProgressionSelect');
        if (!select) return;

        const progressions = this.getChordProgressionsForCurrentKey();
        select.innerHTML = '<option value="">-- Select Progression --</option>';
        progressions.forEach((progression, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = progression.label;
            select.appendChild(option);
        });

        const customOption = document.createElement('option');
        customOption.value = 'custom';
        customOption.textContent = '+ Create Custom';
        select.appendChild(customOption);
    }

    generateHarmonyFromChordProgression(progressionIndex) {
        if (progressionIndex === 'custom') {
            this.showCustomProgressionBuilder();
            return;
        }
        const progression = this.getChordProgressionsForCurrentKey()[Number(progressionIndex)];
        if (!progression) return;

        this.applyChordSequence(progression.chords);
        this.playChordProgression(progression.chords);
        this.showNotification(`Chord progression: ${progression.label}`, 'success');
    }

    playChordProgression(chords) {
        if (!this.polySynth) return;
        chords.forEach((chord, index) => {
            if (!Array.isArray(chord) || chord.length === 0) return;
            setTimeout(() => {
                if (this.harmonicsEnabled) {
                    this.polySynth.triggerAttackRelease(this._voiceChord(chord), '2n');
                }
            }, index * 500);
        });
    }

    showCustomProgressionBuilder(progressionData) {
        const catalog = progressionData?.chords || this.getChordCatalogForCurrentKey();
        const modal = document.getElementById('customProgressionModal');
        if (!modal) {
            this.createCustomProgressionModal(progressionData);
        }
        document.getElementById('customProgressionModal')?.classList.remove('hidden');
        this.populateCustomProgressionOptions(catalog);
    }

    createCustomProgressionModal(progressionData) {
        const modal = document.createElement('div');
        modal.id = 'customProgressionModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-music"></i> Build Custom Progression</h2>
                    <button class="btn-close" onclick="document.getElementById('customProgressionModal').classList.add('hidden')">✕</button>
                </div>
                <div class="settings-section">
                    <p style="margin-bottom: 1rem;">Select chords to build your progression:</p>
                    <div id="customProgressionOptions" style="display: flex; flex-wrap: wrap; gap: 0.5rem;"></div>
                </div>
                <div class="settings-section">
                    <p><strong>Your Progression:</strong> <span id="customProgressionDisplay">None</span></p>
                </div>
                <div style="display: flex; gap: 0.75rem; margin-top: 1rem;">
                    <button class="btn btn-secondary" style="flex: 1;" onclick="document.getElementById('customProgressionModal').classList.add('hidden')">Cancel</button>
                    <button class="btn" style="flex: 1;" onclick="songApp.applyCustomProgression()">Apply</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    populateCustomProgressionOptions(catalog) {
        const container = document.getElementById('customProgressionOptions');
        if (!container) return;

        container.innerHTML = '';
        this.customProgression = [];
        document.getElementById('customProgressionDisplay').textContent = 'None';

        Object.keys(catalog).forEach(chordSymbol => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-secondary';
            btn.style.padding = '0.5rem 1rem';
            btn.style.fontSize = '0.85rem';
            btn.textContent = chordSymbol;
            btn.onclick = () => this.addToCustomProgression(chordSymbol, catalog);
            container.appendChild(btn);
        });
    }

    addToCustomProgression(chordSymbol, catalog) {
        if (!this.customProgression) this.customProgression = [];
        this.customProgression.push(chordSymbol);

        document.getElementById('customProgressionDisplay').textContent = this.customProgression.join(' - ');

        const chord = catalog?.[chordSymbol];
        if (chord && this.polySynth) {
            this.polySynth.triggerAttackRelease(this._voiceChord(chord), '4n');
        }
    }

    applyCustomProgression() {
        if (!this.customProgression || this.customProgression.length === 0) {
            this.showNotification('Please select at least one chord', 'error');
            return;
        }

        const catalog = this.getChordCatalogForCurrentKey();
        const chords = this.customProgression.map(symbol => catalog[symbol]).filter(Boolean);
        if (!this.applyChordSequence(chords)) {
            this.showNotification('Those chords are not available in the current key', 'error');
            return;
        }

        this.playChordProgression(chords);
        document.getElementById('customProgressionModal')?.classList.add('hidden');
        this.showNotification(`Custom progression: ${this.customProgression.join(' - ')}`, 'success');
    }
    
    updateHarmonicsUI() {
        document.querySelectorAll('.harmonic-cell').forEach((c, i) => {
            c.classList.toggle('active', this.harmonics.has(i));
        });
    }
    
    // Create Section Repeats Control UI
    createSectionRepeatsControl() {
        const container = document.getElementById('sectionRepeatsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        const stepGroups = this.getStepGroupDefinitions();
        
        stepGroups.forEach((group, index) => {
            const item = document.createElement('div');
            item.className = `section-repeat-item${index === this.currentGroupIndex ? ' active' : ''}`;
            item.dataset.groupIndex = index;
            
            item.innerHTML = `
                <div class="section-repeat-name">${group.name}</div>
                <div class="section-repeat-range">${group.start + 1}-${group.end + 1}</div>
                <div class="section-repeat-select">
                    <label title="Loop count"><i class="fas fa-redo"></i></label>
                    <select onchange="app.setGroupLoopCount(${index}, this.value)">
                        <option value="1" ${this.groupLoopCounts[index] === 1 ? 'selected' : ''}>1x <i class="fas fa-redo"></i></option>
                        <option value="2" ${this.groupLoopCounts[index] === 2 ? 'selected' : ''}>2x</option>
                        <option value="4" ${this.groupLoopCounts[index] === 4 ? 'selected' : ''}>4x</option>
                        <option value="8" ${this.groupLoopCounts[index] === 8 ? 'selected' : ''}>8x</option>
                        <option value="16" ${this.groupLoopCounts[index] === 16 ? 'selected' : ''}>16x</option>
                    </select>
                </div>
            `;
            
            item.addEventListener('click', (e) => {
                if (e.target.tagName !== 'SELECT') {
                    this.loadPatternGroup(index);
                }
            });
            
            container.appendChild(item);
        });
    }
    
    // Update Section Repeats Control UI
    updateSectionRepeatsControl() {
        const container = document.getElementById('sectionRepeatsContainer');
        if (!container) return;
        
        const items = container.querySelectorAll('.section-repeat-item');
        items.forEach((item, index) => {
            item.classList.toggle('active', index === this.currentGroupIndex);
            const select = item.querySelector('select');
            if (select) {
                select.value = this.groupLoopCounts[index];
            }
        });
    }
    
    // Preset loading methods
    loadHarmonicPreset(preset) {
        if (!this.polySynth) {
            window.showAudioPrompt?.();
            return;
        }
        this.harmonics.clear();
        document.querySelectorAll('.harmonic-cell').forEach(c => c.classList.remove('active'));
        if (preset === 'clear') return;
        const presets = { major: [0, 2, 4], minor: [0, 3, 5], power: [0, 7], ambient: [0, 2, 4, 6] };
        if (presets[preset]) {
            presets[preset].forEach(idx => {
                this.harmonics.add(idx);
                document.querySelectorAll('.harmonic-cell')[idx]?.classList.add('active');
            });
        }
        this.polySynth.triggerAttackRelease(['C3', 'E3', 'G3'], '2n');
    }
    
    loadMelodyPreset(preset) {
        if (!this.melodySynth) {
            window.showAudioPrompt?.();
            return;
        }
        this.melodyRows.clear();
        document.querySelectorAll('.string-cell').forEach(c => c.classList.remove('active'));
        if (preset === 'clear') return;
        const patterns = {
            scale: [[0,0],[1,1],[2,2],[3,3],[4,4],[5,5],[6,6],[7,7],[8,8],[9,9],[10,10],[11,11],[12,12],[13,13],[14,14],[15,15]],
            arpeggio: [[0,0],[1,2],[2,4],[3,6],[4,8],[5,10],[6,12],[7,14],[8,12],[9,10],[10,8],[11,6],[12,4],[13,2],[14,0],[15,2]],
            happy: [[0,4],[1,3],[2,4],[3,2],[4,4],[5,3],[6,4],[7,2],[8,9],[9,8],[10,9],[11,7],[12,10],[13,9],[14,10],[15,8]],
            mysterious: [[0,7],[1,5],[2,7],[3,4],[4,6],[5,4],[6,6],[7,3],[8,12],[9,10],[10,12],[11,9],[12,11],[13,9],[14,11],[15,8]]
        };
        const stepsPerBar = this.getStepsPerBar();
        if (patterns[preset]) {
            patterns[preset].forEach(([col, row]) => {
                if (col >= stepsPerBar) return;
                this.melodyRows.set(col, row);
                document.querySelector(`.string-cell[data-col="${col}"][data-row="${row}"]`)?.classList.add('active');
            });
        }
    }
    
    loadRhythmPreset(preset) {
        if (!this.drums) {
            window.showAudioPrompt?.();
            return;
        }
        Object.keys(this.rhythm).forEach(inst => {
            if (this.rhythm[inst]) this.rhythm[inst].clear();
        });
        document.querySelectorAll('.rhythm-cell').forEach(c => c.classList.remove('active'));
        
        if (preset === 'clear') return;
        
        const patterns = {
            basic: { kick: [0, 4, 8, 12], snare: [4, 12], hihat: [0, 2, 4, 6, 8, 10, 12, 14], tom: [] },
            rock: { kick: [0, 4, 8, 12], snare: [4, 12], hihat: [0, 2, 4, 6, 8, 10, 12, 14], tom: [] },
            hiphop: { kick: [0, 6, 10, 14], snare: [3, 11], hihat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], tom: [] },
            electronic: { kick: [0, 2, 4, 6, 8, 10, 12, 14], snare: [4, 12], hihat: [1, 3, 5, 7, 9, 11, 13, 15], tom: [8] },
            game: { kick: [0, 3, 6, 9, 12, 15], snare: [5, 13], hihat: [1, 3, 5, 7, 9, 11, 13, 15], tom: [2, 10] },
            dance: { kick: [0, 4, 8, 12], snare: [4, 12], hihat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], tom: [] }
        };
        
        if (patterns[preset]) {
            Object.keys(patterns[preset]).forEach(inst => {
                if (this.rhythm[inst]) {
                    patterns[preset][inst].forEach(step => {
                        if (step >= this.getStepsPerBar()) return;
                        this.rhythm[inst].add(step);
                        const cell = document.querySelector(`.rhythm-cell[data-instrument="${inst}"][data-step="${step}"]`);
                        if (cell) cell.classList.add('active');
                    });
                }
            });
        }
    }
    
    loadBassPreset(preset) {
        if (!this.bassSynth) {
            window.showAudioPrompt?.();
            return;
        }
        
        this.bassRows.clear();
        document.querySelectorAll('.bass-cell').forEach(c => c.classList.remove('active'));
        
        if (preset === 'clear') return;
        
        const patterns = {
            'basic': [[0, 0], [3, 0], [6, 1], [9, 1], [12, 0], [15, 0]],
            'walking': [[0, 0], [2, 1], [4, 2], [6, 1], [8, 0], [10, 3], [12, 1], [14, 2]],
            'groove': [[0, 0], [3, 1], [6, 0], [9, 2], [12, 0], [14, 1]],
            'syncopated': [[0, 0], [2, 2], [5, 1], [7, 3], [10, 0], [12, 2], [14, 1]]
        };
        
        const stepsPerBar = this.getStepsPerBar();
        if (patterns[preset]) {
            patterns[preset].forEach(([col, row]) => {
                if (col >= stepsPerBar) return;
                this.bassRows.set(col, row);
                const cell = document.querySelector(`.bass-cell[data-col="${col}"][data-row="${row}"]`);
                if (cell) cell.classList.add('active');
            });
        }
        
        if (this.bassEnabled) {
            patterns[preset]?.forEach(([col, row]) => {
                if (col >= stepsPerBar) return;
                setTimeout(() => {
                    if (row < this.bassNotes.length) {
                        this.bassSynth.triggerAttackRelease(this.bassNotes[row], '8n');
                    }
                }, col * 125);
            });
        }
    }
    
    loadLeadPreset(preset) {
        if (!this.leadSynth) {
            window.showAudioPrompt?.();
            return;
        }
        
        this.leadRows.clear();
        document.querySelectorAll('.lead-cell').forEach(c => c.classList.remove('active'));
        
        if (preset === 'clear') return;
        
        const leadScale = this.getLeadScale();
        const patterns = {
            'melodic': [[0, 0], [2, 2], [4, 4], [6, 2], [8, 3], [10, 7], [12, 9], [14, 7]],
            'arpeggio': [[0, 0], [1, 2], [2, 4], [3, 6], [4, 8], [5, 10], [6, 12], [7, 14], [8, 12], [9, 10], [10, 8], [11, 6], [12, 4], [13, 2], [14, 0], [15, 2]],
            'stabs': [[0, 4], [3, 7], [6, 4], [9, 9], [12, 11], [15, 7]],
            'plucks': [[0, 0], [2, 5], [4, 2], [6, 7], [8, 4], [10, 9], [12, 2], [14, 7]]
        };
        
        const stepsPerBar = this.getStepsPerBar();
        if (patterns[preset]) {
            patterns[preset].forEach(([col, row]) => {
                if (col < stepsPerBar && row < leadScale.length) {
                    this.leadRows.set(col, row);
                    const cell = document.querySelector(`.lead-cell[data-col="${col}"][data-row="${row}"]`);
                    if (cell) cell.classList.add('active');
                }
            });
        }
        
        if (this.leadEnabled) {
            patterns[preset]?.forEach(([col, row]) => {
                if (col >= stepsPerBar) return;
                setTimeout(() => {
                    if (row < leadScale.length) {
                        this.leadSynth.triggerAttackRelease(leadScale[row], '16n');
                    }
                }, col * 125);
            });
        }
    }
    
    loadPercussionPreset(preset) {
        // Load percussion presets into the Peak section (group index 2) for 64-step patterns
        const peakGroupIndex = 2;
        const peakRhythm = this.patternGroups.rhythm[peakGroupIndex] || this.rhythm;
        
        ['conga', 'bongo', 'shaker', 'cymbal'].forEach(inst => {
            if (peakRhythm[inst]) peakRhythm[inst].clear();
        });
        
        // Also clear percussion grid cells
        document.querySelectorAll('#percussionGrid .rhythm-cell').forEach(c => c.classList.remove('active'));
        
        if (preset === 'clear') {
            this.showNotification('Percussion cleared', 'info');
            return;
        }
        
        const patterns = {
            'latin': {
                conga: [0, 3, 6, 9, 12],
                bongo: [2, 10],
                shaker: [0, 2, 4, 6, 8, 10, 12, 14],
                cymbal: [8, 15]
            },
            'african': {
                conga: [0, 2, 4, 6, 8, 10, 12, 14],
                bongo: [3, 11],
                shaker: [1, 3, 5, 7, 9, 11, 13, 15],
                cymbal: [0, 8]
            },
            'electronic': {
                conga: [0, 4, 8, 12],
                bongo: [6, 14],
                shaker: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
                cymbal: [4, 12]
            }
        };
        
        if (patterns[preset]) {
            Object.keys(patterns[preset]).forEach(inst => {
                if (peakRhythm[inst]) {
                    patterns[preset][inst].forEach(step => {
                        peakRhythm[inst].add(step);
                        const cell = document.querySelector(`.rhythm-cell[data-instrument="${inst}"][data-step="${step}"][data-group-index="${peakGroupIndex}"]`);
                        if (cell) cell.classList.add('active');
                    });
                }
            });
        }
        
        // Switch to Peak section to show the loaded pattern
        this.loadPatternGroup(peakGroupIndex);
        this.showNotification(`Percussion '${preset}' loaded to Peak section`, 'success');
    }
    
    // Effect toggle method
    toggleEffects() {
        this.effectsEnabled = !this.effectsEnabled;
        const btn = document.getElementById('effectsToggle');
        btn.textContent = this.effectsEnabled ? 'ON' : 'OFF';
        btn.classList.toggle('active', this.effectsEnabled);
        
        // Hide/show effects section content
        const effectsSectionContent = document.querySelector('#effectsSection .section-content');
        if (effectsSectionContent) {
            effectsSectionContent.style.display = this.effectsEnabled ? '' : 'none';
        }
        
        // Disable/enable all controls within section-content
        if (effectsSectionContent) {
            effectsSectionContent.classList.toggle('disabled', !this.effectsEnabled);
            effectsSectionContent.querySelectorAll('select, button, input[type="range"]').forEach(el => {
                el.disabled = !this.effectsEnabled;
            });
        }
        
        if (!this.audioEngine) return;

        // Only the melodic buses sit behind the FX chain. Switching effects off
        // bypasses that chain; the kick, bass, hat and percussion buses keep
        // their dedicated destinations instead of being folded into one chain.
        const melodicDestination = this.effectsEnabled ? this.effects.lowpass : this.compressor;
        [this.harmonyBus, this.melodyBus, this.leadBus].forEach(bus => {
            if (!bus) return;
            bus.disconnect();
            bus.connect(melodicDestination);
        });
        
        if (this.effectsEnabled) {
            this.updateEffectCardStates();
        }
    }
    
    updateEffectCardStates() {
        const effectCards = [
            { id: 'masterVolume', card: 'masterVolume' },
            { id: 'reverbAmount', card: 'reverbAmount' },
            { id: 'echoAmount', card: 'echoAmount' },
            { id: 'chorusAmount', card: 'chorusAmount' },
            { id: 'lowpassAmount', card: 'lowpassAmount' },
            { id: 'highpassAmount', card: 'highpassAmount' },
            { id: 'distortionAmount', card: 'distortionAmount' },
            { id: 'bitcrushAmount', card: 'bitcrushAmount' },
            { id: 'tremoloAmount', card: 'tremoloAmount' },
            { id: 'vibratoAmount', card: 'vibratoAmount' }
        ];
        
        effectCards.forEach(({ id, card }) => {
            const slider = document.getElementById(id);
            const cardEl = slider?.closest('.effect-card');
            if (cardEl) {
                const value = parseInt(slider?.value || 0);
                if (value === 0) {
                    cardEl.classList.add('disabled');
                } else {
                    cardEl.classList.remove('disabled');
                }
            }
        });
    }
    
    // Filter automation methods
    drawFilterAutomation() {
        const canvas = document.getElementById('filterCanvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(0, 0, width, height);
        
        ctx.strokeStyle = '#4b5563';
        ctx.lineWidth = 1;
        const stepWidth = width / this.patternLength;
        for (let i = 0; i <= this.patternLength; i++) {
            ctx.beginPath();
            ctx.moveTo(i * stepWidth, 0);
            ctx.lineTo(i * stepWidth, height);
            ctx.stroke();
        }
        
        ctx.strokeStyle = '#f472b6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const automation = this.effectAutomation.lowpass;
        for (let i = 0; i <= this.patternLength; i++) {
            const value = automation.get(i) ?? 50;
            const x = i * stepWidth;
            const y = height - (value / 100 * height);
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        automation.forEach((value, step) => {
            const x = step * stepWidth;
            const y = height - (value / 100 * height);
            ctx.fillStyle = '#f472b6';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        
        canvas.onclick = (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const step = Math.floor((x / width) * this.patternLength);
            const value = 100 - ((e.clientY - rect.top) / height * 100);
            
            this.effectAutomation.lowpass.set(step, Math.max(0, Math.min(100, value)));
            this.drawFilterAutomation();
        };
        
        canvas.onmousedown = (e) => {
            const isDragging = true;
            const handleDrag = (moveEvent) => {
                const rect = canvas.getBoundingClientRect();
                const x = moveEvent.clientX - rect.left;
                const step = Math.floor((x / width) * this.patternLength);
                const value = 100 - ((moveEvent.clientY - rect.top) / height * 100);
                
                this.effectAutomation.lowpass.set(step, Math.max(0, Math.min(100, value)));
                this.drawFilterAutomation();
            };
            
            const stopDrag = () => {
                isDragging = false;
                document.removeEventListener('mousemove', handleDrag);
                document.removeEventListener('mouseup', stopDrag);
            };
            
            document.addEventListener('mousemove', handleDrag);
            document.addEventListener('mouseup', stopDrag);
        };
    }
    
    smoothFilterAutomation() {
        const automation = this.effectAutomation.lowpass;
        const smoothed = new Map();
        
        for (let i = 0; i < this.patternLength; i++) {
            const prev = automation.get(i - 1) ?? automation.get(i) ?? 50;
            const curr = automation.get(i) ?? 50;
            const next = automation.get(i + 1) ?? automation.get(i) ?? 50;
            smoothed.set(i, (prev + curr * 2 + next) / 4);
        }
        
        smoothed.forEach((value, step) => {
            this.effectAutomation.lowpass.set(step, value);
        });
        
        this.drawFilterAutomation();
    }
    
    // Genre and song preset methods
    populateGenreSelect() {
        const select = document.getElementById('genreSelect');
        if (!select) return;
        
        // Check if getAllGenres is available, if not, wait for it
        if (typeof window.getAllGenres !== 'function') {
            console.warn('getAllGenres not loaded yet, retrying...');
            setTimeout(() => this.populateGenreSelect(), 100);
            return;
        }
        
        window.getAllGenres().forEach(genre => {
            const option = document.createElement('option');
            option.value = genre;
            option.textContent = window.GENRE_METADATA?.[genre]?.name || genre;
            select.appendChild(option);
        });
    }
    
    async populateSongSelect(genre, selectedKey = '') {
        const select = document.getElementById('songSelect');
        const request = this._songListRequest = (this._songListRequest || 0) + 1;
        const length = this.patternLength;
        select.innerHTML = '<option value="">-- Select --</option>';
        select.disabled = true;
        if (!genre) return;
        try {
            const presets = await getPresetsByGenre(genre, length);
            if (request !== this._songListRequest || length !== this.patternLength) return;
            Object.entries(presets).forEach(([key, preset]) => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = `${preset.name} - ${preset.artist}`;
                select.appendChild(option);
            });
            select.value = selectedKey in presets ? selectedKey : '';
            select.disabled = false;
        } catch (error) {
            if (request === this._songListRequest) {
                this.showNotification(error.message, 'error');
                // Leave Genre usable so selecting it again can retry.
            }
        }
    }

    async loadSongPreset(presetKey) {
        // The shipped song library is 4/4 at 16 steps per bar. Keep the current
        // number of bars when loading so a 3/4 or 5/4 session does not request a
        // non-existent step count from the catalogue.
        const barCount = this.getBarCount();
        const dataStepsPerBar = 16;
        const length = barCount * dataStepsPerBar;
        const request = this._songLoadRequest = (this._songLoadRequest || 0) + 1;
        const genre = document.getElementById('genreSelect')?.value || undefined;
        try {
            const preset = await getSongPreset(presetKey, length, genre);
            if (request !== this._songLoadRequest || this.getBarCount() !== barCount || (document.getElementById('genreSelect')?.value || undefined) !== genre) return;
            const names = ['kick', 'snare', 'hihat', 'tom', 'conga', 'bongo', 'shaker', 'cymbal'];
            if (preset.patternLength !== length || (!Number.isFinite(preset.tempo) || preset.tempo <= 0) || !Array.isArray(preset.harmonics) || preset.harmonics.some(row => !Number.isInteger(row) || row < 0 || row >= 8)) throw new Error('Invalid song preset.');

            const keyDescriptor = preset.keyName ? this.parseKeyName(preset.keyName) : null;
            if (preset.keyName && !keyDescriptor) throw new Error('Invalid song key.');

            // Catalogue files always use 16 subdivisions per bar, even when the
            // song is in 3/4, 2/4, 5/4 or 3/8. Remap those subdivisions onto the
            // song's real meter before the pattern reaches the sequencer.
            const signature = preset.timeSignature || '4/4';
            const songStepsPerBar = this.parseTimeSignature(signature).stepsPerBar;
            const songBarCount = length / 16;
            const remapStep = (step) => {
                const bar = Math.floor(step / 16);
                const local = step % 16;
                const scaled = Math.min(songStepsPerBar - 1, Math.round(local * songStepsPerBar / 16));
                return { bar, local: scaled };
            };

            // Validate everything before mutating the current tune or its key.
            const noteGroups = {
                melody: Array.from({length: songBarCount}, () => new Map()),
                bass: Array.from({length: songBarCount}, () => new Map()),
                lead: Array.from({length: songBarCount}, () => new Map())
            };
            for (const name of ['melody', 'bass', 'lead']) {
                for (const [key, active] of Object.entries(preset[name] || {})) {
                    if (!active) continue;
                    const [step, row] = key.split('-').map(Number);
                    const rows = name === 'bass' ? 12 : 16;
                    if (!Number.isInteger(step) || step < 0 || step >= length || !Number.isInteger(row) || row < 0 || row >= rows) throw new Error('Invalid notes in song preset.');
                    const mapped = remapStep(step);
                    noteGroups[name][mapped.bar].set(mapped.local, row);
                }
            }
            const rhythmGroups = Array.from({length: songBarCount}, () => Object.fromEntries(names.map(name => [name, new Set()])));
            for (const name of names) {
                for (const step of preset.rhythm?.[name] || []) {
                    if (!Number.isInteger(step) || step < 0 || step >= length) throw new Error('Invalid rhythm in song preset.');
                    const mapped = remapStep(step);
                    rhythmGroups[mapped.bar][name].add(mapped.local);
                }
            }

            // Apply the saved key before building chords/bass so rows resolve in-key.
            if (keyDescriptor) this.setMusicalKey(keyDescriptor);
            const chordIndices = this.ensureChordHasThird(preset.harmonics);
            const groups = {
                harmonics: Array.from({length: songBarCount}, () => new Set(chordIndices)),
                melody: noteGroups.melody,
                bass: noteGroups.bass,
                lead: noteGroups.lead,
                rhythm: rhythmGroups
            };

            // A successful load replaces every group; no old notes leak into longer tunes.
            this._helperRequest = (this._helperRequest || 0) + 1;
            this.stop();
            this.patternGroups = groups;
            this.groupChords = Array.from({length: songBarCount}, () => null);
            this.currentGroupIndex = 0;
            this.patternLength = songBarCount * songStepsPerBar;
            this.groupLoopCounts = Array.from({ length: songBarCount }, () => 1);
            this.setTempo(preset.tempo);
            this.timeSignature = signature;
            this.syncTimeSignatureUI();
            this.setSwingForGenre(preset.genre || genre);
            for (const part of ['melody', 'bass', 'lead', 'harmony']) this[part + 'Velocity'] = new Map();
            this.rhythmVelocity = Object.fromEntries(names.map(name => [name, new Map()]));
            this.harmonicsEnabled = preset.harmonics.length > 0;
            for (const part of ['melody', 'bass', 'lead']) this[part + 'Enabled'] = groups[part].some(group => group.size > 0);
            this.rhythmEnabled = groups.rhythm.some(group => names.slice(0, 4).some(name => group[name].size > 0));
            this.percussionEnabled = groups.rhythm.some(group => names.slice(4).some(name => group[name].size > 0));
            this.refreshTuneParts();
            if (this.effectAutomation) this.effectAutomation.lowpass = new Map();
            if (document.getElementById('harmonicsGrid')) this.createHarmonicsGrid();
            this.populateChordProgressionSelect();
            this.showNotification(`Loaded: ${preset.name} (${this.patternLength} steps, ${this.timeSignature})`, 'success');
            if (this.audioEngine) {
                await Tone.start();
                if (request === this._songLoadRequest && this.getBarCount() === barCount) this.play();
            } else {
                window.showAudioPrompt?.();
            }
        } catch (error) {
            if (request === this._songLoadRequest) this.showNotification(error.message, 'error');
        }
    }

    randomize() {
        const scale = this.getCurrentScale();
        const groupCount = this.getBarCount();
        this.groupChords = Array.from({length: groupCount}, () => null);
        
        for (let g = 0; g < groupCount; g++) {
            const groupBass = this.patternGroups.bass[g];
            const bassDensity = 0.3 + Math.random() * 0.4;
            
            for (let col = 0; col < this.getStepsPerBar(); col++) {
                if (Math.random() < bassDensity) {
                    const row = Math.floor(Math.random() * 6);
                    groupBass.set(col, row);
                }
            }
        }
        
        for (let g = 0; g < groupCount; g++) {
            const groupLead = this.patternGroups.lead[g];
            const leadDensity = 0.2 + Math.random() * 0.5;
            
            for (let col = 0; col < this.getStepsPerBar(); col++) {
                if (Math.random() < leadDensity) {
                    const row = Math.floor(Math.random() * Math.min(16, this.getLeadScale().length));
                    groupLead.set(col, row);
                }
            }
        }
        
        for (let g = 0; g < groupCount; g++) {
            const groupRhythm = this.patternGroups.rhythm[g];
            
            for (let step = 0; step < this.getStepsPerBar(); step++) {
                if (step % 4 === 0 || (step === 10 && Math.random() > 0.5)) {
                    groupRhythm.kick.add(step);
                }
            }
            
            for (let step = 0; step < this.getStepsPerBar(); step++) {
                if (step === 4 || step === 12 || (step === 14 && Math.random() > 0.5)) {
                    groupRhythm.snare.add(step);
                }
            }
            
            for (let step = 0; step < this.getStepsPerBar(); step++) {
                if (step % 2 === 0 || Math.random() > 0.6) {
                    groupRhythm.hihat.add(step);
                }
            }
            
            for (let step = 0; step < this.getStepsPerBar(); step++) {
                if (Math.random() > 0.85) {
                    groupRhythm.tom.add(step);
                }
            }
            
            if (this.percussionEnabled) {
                for (let step = 0; step < this.getStepsPerBar(); step++) {
                    if (Math.random() > 0.7) groupRhythm.conga.add(step);
                    if (Math.random() > 0.8) groupRhythm.bongo.add(step);
                    if (Math.random() > 0.6) groupRhythm.shaker.add(step);
                    if (Math.random() > 0.85) groupRhythm.cymbal.add(step);
                }
            }
        }
        
        for (let step = 0; step < this.patternLength; step++) {
            this.melodyVelocity.set(step, 0.5 + Math.random() * 0.4);
            this.leadVelocity.set(step, 0.4 + Math.random() * 0.5);
            this.bassVelocity.set(step, 0.6 + Math.random() * 0.3);
            ['kick', 'snare', 'hihat', 'tom'].forEach(inst => {
                this.rhythmVelocity[inst].set(step, 0.5 + Math.random() * 0.4);
            });
            const progress = step / this.patternLength;
            this.effectAutomation.lowpass.set(step, 30 + progress * 50 + Math.random() * 20);
        }
        
        const savedBassPatterns = JSON.parse(JSON.stringify(this.patternGroups.bass.map(g => Array.from(g.entries()))));
        const savedLeadPatterns = JSON.parse(JSON.stringify(this.patternGroups.lead.map(g => Array.from(g.entries()))));
        const savedRhythmPatterns = JSON.parse(JSON.stringify(this.patternGroups.rhythm.map(g => {
            const result = {};
            Object.keys(g).forEach(inst => {
                result[inst] = Array.from(g[inst]);
            });
            return result;
        })));
        
        const genres = window.getAllGenres();
        const randomGenre = genres[Math.floor(Math.random() * genres.length)];
        
        this.showNotification('Generating random pattern...', 'info');
        
        getPresetsByGenre(randomGenre).then(presets => {
            const keys = Object.keys(presets);
            if (keys.length > 0) {
                const randomKey = keys[Math.floor(Math.random() * keys.length)];
                
                const tempBass = JSON.parse(JSON.stringify(this.patternGroups.bass));
                const tempLead = JSON.parse(JSON.stringify(this.patternGroups.lead));
                const tempRhythm = JSON.parse(JSON.stringify(this.patternGroups.rhythm));
                
                this.loadSongPreset(randomKey);
                
                this.patternGroups.bass = tempBass;
                this.patternGroups.lead = tempLead;
                this.patternGroups.rhythm = tempRhythm;
                
                this.bassRows = this.patternGroups.bass[this.currentGroupIndex];
                this.leadRows = this.patternGroups.lead[this.currentGroupIndex];
                this.rhythm = this.patternGroups.rhythm[this.currentGroupIndex];
                
                this.rebuildGrids();
                this.createSectionTimelines();
                
                this.showNotification(`Random pattern: ${presets[randomKey].name}`, 'success');
            } else {
                this.rebuildGrids();
                this.createSectionTimelines();
                this.showNotification('Random pattern generated!', 'success');
            }
        });
    }
    
    // Filter automation event listeners
    clearFilterBtnClick() {
        this.effectAutomation.lowpass.clear();
        this.drawFilterAutomation();
        this.showNotification('Filter automation cleared', 'success');
    }
    
    smoothFilterBtnClick() {
        this.smoothFilterAutomation();
        this.showNotification('Filter automation smoothed', 'success');
    }
    
    expandAllGroups() {
        document.querySelectorAll('.timeline-section').forEach(s => {
            s.classList.remove('collapsed');
            s.classList.add('expanded');
            s.classList.add('active');
        });
    }
    
    collapseAllGroups() {
        document.querySelectorAll('.timeline-section').forEach(s => {
            s.classList.remove('expanded');
            s.classList.add('collapsed');
            s.classList.remove('active');
        });
    }
    
    // Pan position display helper
    getPanDisplayValue(panValue) {
        if (panValue === 0) return 'Center';
        if (panValue < 0) return `${Math.abs(Math.round(panValue))}L`;
        return `${Math.round(panValue)}R`;
    }
    
    // Update pan display values
    updatePanDisplays() {
        const panControls = ['harmonyPan', 'melodyPan', 'kickPan', 'snarePan'];
        panControls.forEach(controlId => {
            const slider = document.getElementById(controlId);
            const display = document.getElementById(controlId + 'Value');
            if (slider && display) {
                display.textContent = this.getPanDisplayValue(parseInt(slider.value));
            }
        });
    }
    
    // Apply pan preset
    applyPanPreset(preset) {
        let harmonyPan = 0, melodyPan = 0, kickPan = 0, snarePan = 0;
        
        switch(preset) {
            case 'center':
                harmonyPan = 0;
                melodyPan = 0;
                kickPan = 0;
                snarePan = 0;
                this.showNotification('All instruments centered', 'info');
                break;
            case 'wide':
                harmonyPan = -60;
                melodyPan = 60;
                kickPan = -30;
                snarePan = 30;
                this.showNotification('Wide stereo positioning applied', 'info');
                break;
            case 'classic':
                harmonyPan = -20;
                melodyPan = 20;
                kickPan = -10;
                snarePan = 10;
                this.showNotification('Classic mix positioning applied', 'info');
                break;
            default:
                return;
        }
        
        // Update sliders
        const sliders = {
            harmonyPan: harmonyPan,
            melodyPan: melodyPan,
            kickPan: kickPan,
            snarePan: snarePan
        };
        
        Object.keys(sliders).forEach(id => {
            const slider = document.getElementById(id);
            const display = document.getElementById(id + 'Value');
            if (slider) {
                slider.value = sliders[id];
                if (display) {
                    display.textContent = this.getPanDisplayValue(sliders[id]);
                }
            }
        });
        
        // Apply to audio
        this.applyAllPanValues();
    }
    
    // Apply all pan values from sliders
    applyAllPanValues() {
        const harmonyPan = parseInt(document.getElementById('harmonyPan')?.value || 0);
        const melodyPan = parseInt(document.getElementById('melodyPan')?.value || 0);
        const kickPan = parseInt(document.getElementById('kickPan')?.value || 0);
        const snarePan = parseInt(document.getElementById('snarePan')?.value || 0);
        
        if (this.harmonyPanner) this.harmonyPanner.pan.value = harmonyPan / 100;
        if (this.melodyPanner) this.melodyPanner.pan.value = melodyPan / 100;
        if (this.leadPanner) this.leadPanner.pan.value = melodyPan / 100;
        if (this.bassPanner) this.bassPanner.pan.value = harmonyPan / 100;
        if (this.drumPanners?.kick) this.drumPanners.kick.pan.value = kickPan / 100;
        if (this.drumPanners?.snare) this.drumPanners.snare.pan.value = snarePan / 100;
    }
    
    // Apply velocity pattern preset
    applyVelocityPattern(pattern) {
        // Get all active notes in all groups
        const activeNotes = [];
        
        // Collect melody notes
        this.patternGroups.melody.forEach((group, gIdx) => {
            group.forEach((row, col) => {
                activeNotes.push({ type: 'melody', group: gIdx, step: col, row: row });
            });
        });
        
        // Collect bass notes
        this.patternGroups.bass.forEach((group, gIdx) => {
            group.forEach((row, col) => {
                activeNotes.push({ type: 'bass', group: gIdx, step: col, row: row });
            });
        });
        
        // Collect lead notes
        this.patternGroups.lead.forEach((group, gIdx) => {
            group.forEach((row, col) => {
                activeNotes.push({ type: 'lead', group: gIdx, step: col, row: row });
            });
        });
        
        if (activeNotes.length === 0) {
            this.showNotification('No notes in pattern - create some notes first!', 'warning');
            return;
        }
        
        switch(pattern) {
            case 'crescendo':
                // Gradually increase velocity from quiet to loud
                activeNotes.forEach((note, idx) => {
                    const velocity = 0.3 + (idx / activeNotes.length) * 0.7;
                    this.setNoteVelocity(note, velocity);
                });
                this.showNotification('Crescendo: Notes getting louder', 'info');
                break;
                
            case 'decrescendo':
                // Gradually decrease velocity from loud to quiet
                activeNotes.forEach((note, idx) => {
                    const velocity = 1.0 - (idx / activeNotes.length) * 0.7;
                    this.setNoteVelocity(note, velocity);
                });
                this.showNotification('Decrescendo: Notes getting quieter', 'info');
                break;
                
            case 'accent':
                // Emphasize beat 1 (first step of each group)
                activeNotes.forEach(note => {
                    if (note.step === 0 || note.step === 8) {
                        this.setNoteVelocity(note, 1.0);
                    } else {
                        this.setNoteVelocity(note, 0.6);
                    }
                });
                this.showNotification('Accent: Strong beats emphasized', 'info');
                break;
                
            case 'normal':
                // Reset all to default velocity
                activeNotes.forEach(note => {
                    this.setNoteVelocity(note, 0.8);
                });
                this.showNotification('All notes reset to normal volume', 'info');
                break;
                
            default:
                return;
        }
        
        // Update velocity slider display
        const velocitySlider = document.getElementById('velocitySlider');
        const velocityValue = document.getElementById('velocityValue');
        if (velocitySlider) velocitySlider.value = 80;
        if (velocityValue) velocityValue.textContent = '80%';
    }
    
    // Set velocity for a specific note
    setNoteVelocity(note, velocity) {
        const globalStep = note.group * this.getStepsPerBar() + note.step;
        switch(note.type) {
            case 'melody':
                this.melodyVelocity.set(globalStep, velocity);
                break;
            case 'bass':
                this.bassVelocity.set(globalStep, velocity);
                break;
            case 'lead':
                this.leadVelocity.set(globalStep, velocity);
                break;
        }
    }
    
    // Get velocity for a specific note
    getNoteVelocity(note) {
        const globalStep = note.group * this.getStepsPerBar() + note.step;
        switch(note.type) {
            case 'melody':
                return this.melodyVelocity.get(globalStep) ?? 0.8;
            case 'bass':
                return this.bassVelocity.get(globalStep) ?? 0.8;
            case 'lead':
                return this.leadVelocity.get(globalStep) ?? 0.7;
            default:
                return 0.8;
        }
    }
    
    // Setup pan slider event listeners
    setupPanSliders() {
        const panControls = ['harmonyPan', 'melodyPan', 'kickPan', 'snarePan'];
        panControls.forEach(controlId => {
            const slider = document.getElementById(controlId);
            const display = document.getElementById(controlId + 'Value');
            if (slider) {
                slider.addEventListener('input', () => {
                    if (display) {
                        display.textContent = this.getPanDisplayValue(parseInt(slider.value));
                    }
                    this.applyAllPanValues();
                });
            }
        });
    }
    
    // Setup velocity slider listener
    setupVelocitySlider() {
        const slider = document.getElementById('velocitySlider');
        const value = document.getElementById('velocityValue');
        if (slider && value) {
            slider.addEventListener('input', () => {
                const vel = parseInt(slider.value);
                value.textContent = vel + '%';
                value.style.color = vel >= 80 ? 'var(--accent)' : vel >= 50 ? 'var(--text-primary)' : 'var(--text-secondary)';
            });
        }
    }
    
    // Advanced automation toggle
    setupAdvancedAutomationToggle() {
        const toggle = document.getElementById('enableAdvancedAutomation');
        const advanced = document.getElementById('advancedAutomation');
        if (toggle && advanced) {
            toggle.addEventListener('change', () => {
                advanced.style.display = toggle.checked ? 'block' : 'none';
                this.showNotification(
                    toggle.checked ? 'Advanced mode enabled' : 'Advanced mode disabled',
                    'info'
                );
            });
        }
    }
    
    createStepGroupsAccordion() {
        // Override if needed
    }
}

class SimpleAudioEngine {
    constructor() {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.sampleRate = this.context.sampleRate;
    }
}
