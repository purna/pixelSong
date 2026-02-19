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
            'c-major': ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
            'g-major': ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5'],
            'f-major': ['F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5'],
            'd-minor': ['D4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'C5', 'D5'],
            'a-minor': ['A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5']
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
        this.currentLeadInstrument = 'supersaw';
        this.currentDrumKit = 'electronic';
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
        // Dynamically generate step groups based on pattern length
        // Maps 64-step sections to the current pattern length
        const definitions = {
            16: [
                { name: 'Peak', color: '#f472b6', range: '1-16', start: 0, end: 15, sourceStart: 48, sourceEnd: 63 }
            ],
            32: [
                { name: 'Develop', color: '#60a5fa', range: '1-16', start: 0, end: 15, sourceStart: 32, sourceEnd: 47 },
                { name: 'Peak', color: '#f472b6', range: '17-32', start: 16, end: 31, sourceStart: 48, sourceEnd: 63 }
            ],
            64: [
                { name: 'Build Up', color: '#34d399', range: '1-16', start: 0, end: 15, sourceStart: 0, sourceEnd: 15 },
                { name: 'Develop', color: '#60a5fa', range: '17-32', start: 16, end: 31, sourceStart: 16, sourceEnd: 31 },
                { name: 'Peak', color: '#f472b6', range: '33-48', start: 32, end: 47, sourceStart: 32, sourceEnd: 47 },
                { name: 'Resolve', color: '#a78bfa', range: '49-64', start: 48, end: 63, sourceStart: 48, sourceEnd: 63 }
            ]
        };
        return definitions[this.patternLength] || definitions[16];
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
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < this.patternLength) {
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
            // Initialize Howler Audio Engine as default
            this.howlerEngine = new HowlerAudioEngine();
            this.howlerEngine.init().then(() => {
                console.log('Howler Audio Engine ready');
            });
            
            // Initialize Rhythm Visualizer
            this.rhythmVisualizer = new RhythmVisualizer(this);
            this.rhythmVisualizer.init();
            
            // Initialize custom sound generator
            this.soundGenerator = new SoundGenerator();
            this.soundGenerator.setAudioEngine(this.howlerEngine);
            
            // Fallback to Tone.js for advanced synthesis
            this.audioEngine = new SimpleAudioEngine();
            this.compressor = new Tone.Compressor({ threshold: -24, ratio: 4, attack: 0.003, release: 0.25 }).toDestination();
            
            this.effects = {
                chorus: new Tone.Chorus({ frequency: 4, delayTime: 2.5, depth: 0.5, wet: 0.3, type: 'sine' }).start(),
                echo: new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.3, wet: 0.2 }),
                reverb: new Tone.Reverb({ decay: 2, wet: 0.3 }),
                lowpass: new Tone.Filter({ frequency: 20000, type: 'lowpass', rolloff: -12, Q: 1 }),
                highpass: new Tone.Filter({ frequency: 20, type: 'highpass', rolloff: -12, Q: 1 }),
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
            
            this.harmonyPanner = new Tone.Panner().connect(this.effects.lowpass);
            this.melodyPanner = new Tone.Panner().connect(this.effects.lowpass);
            this.leadPanner = new Tone.Panner().connect(this.effects.lowpass);
            this.bassPanner = new Tone.Panner().connect(this.effects.lowpass);
            this.drumPanners = {
                kick: new Tone.Panner().connect(this.effects.lowpass),
                snare: new Tone.Panner().connect(this.effects.lowpass),
                hihat: new Tone.Panner().connect(this.effects.lowpass),
                tom: new Tone.Panner().connect(this.effects.lowpass)
            };
            this.percussionPanners = {
                conga: new Tone.Panner().connect(this.effects.lowpass),
                bongo: new Tone.Panner().connect(this.effects.lowpass),
                shaker: new Tone.Panner().connect(this.effects.lowpass),
                cymbal: new Tone.Panner().connect(this.effects.lowpass)
            };
            
            this.createHarmonicSynth();
            this.createMelodySynth();
            this.createBassSynth();
            this.createLeadSynth();
            this.createDrumKit();
            this.createPercussionKit();
            console.log('Audio engine initialized with Howler.js as default and Tone.js for synthesis!');
        });
    }
    
    createHarmonicSynth() {
        switch(this.currentHarmonicInstrument) {
            case 'fm':
                this.polySynth = new Tone.PolySynth(Tone.FMSynth, { harmonicity: 3, modulationIndex: 10, oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 1.5 }, modulation: { type: 'square' }, modulationEnvelope: { attack: 0.5, decay: 0, sustain: 1, release: 0.5 } });
                break;
            case 'piano':
                this.polySynth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.5, sustain: 0.3, release: 1.5 } });
                break;
            case 'pad':
                this.polySynth = new Tone.PolySynth(Tone.AMSynth, { oscillator: { type: 'sine' }, envelope: { attack: 0.5, decay: 0.5, sustain: 0.8, release: 2 }, modulation: { type: 'sine' }, modulationEnvelope: { attack: 0.5, decay: 0.5, sustain: 0.8, release: 2 } });
                break;
            case 'bell':
                this.polySynth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.8, sustain: 0, release: 0.3 } });
                break;
            case 'pluck':
                this.polySynth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'triangle' }, envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 } });
                break;
            default:
                this.polySynth = new Tone.PolySynth(Tone.FMSynth, { harmonicity: 3, modulationIndex: 10, oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 1.5 } });
        }
        this.polySynth.connect(this.harmonyPanner);
        this.polySynth.volume.value = -6;
    }
    
    createMelodySynth() {
        switch(this.currentMelodyInstrument) {
            case 'saw':
                this.melodySynth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'fatsawtooth', count: 3, spread: 30 }, envelope: { attack: 0.02, decay: 0.1, sustain: 0.4, release: 0.8 } });
                break;
            case 'square':
                this.melodySynth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'fatsquare', count: 2, spread: 10 }, envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.5 } });
                break;
            case 'sine':
                this.melodySynth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'fatsine', count: 2, spread: 20 }, envelope: { attack: 0.02, decay: 0.2, sustain: 0.5, release: 1 } });
                break;
            case 'triangle':
                this.melodySynth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'fattriangle', count: 2, spread: 15 }, envelope: { attack: 0.02, decay: 0.15, sustain: 0.4, release: 0.6 } });
                break;
            case 'supersaw':
                this.melodySynth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'fatsawtooth', count: 5, spread: 20 }, envelope: { attack: 0.03, decay: 0.2, sustain: 0.4, release: 0.6 } });
                break;
            default:
                this.melodySynth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'fatsawtooth', count: 5, spread: 20 }, envelope: { attack: 0.03, decay: 0.2, sustain: 0.4, release: 0.6 } });
        }
        this.melodySynth.connect(this.melodyPanner);
        this.melodySynth.volume.value = -4;
    }
    
    createBassSynth() {
        switch(this.currentBassInstrument) {
            case 'sub':
                this.bassSynth = new Tone.MonoSynth({ oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.5 }, filterEnvelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.5, baseFrequency: 200, octaves: 2 } });
                break;
            case 'synth':
                this.bassSynth = new Tone.MonoSynth({ oscillator: { type: 'sawtooth' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.4 }, filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.4, baseFrequency: 300, octaves: 3 } });
                break;
            case 'fm':
                this.bassSynth = new Tone.FMSynth({ harmonicity: 3, modulationIndex: 10, oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.8 } });
                break;
            case 'square':
                this.bassSynth = new Tone.MonoSynth({ oscillator: { type: 'square' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.3 } });
                break;
            default:
                this.bassSynth = new Tone.MonoSynth({ oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.5 } });
        }
        this.bassSynth.connect(this.bassPanner);
        this.bassSynth.volume.value = -2;
    }
    
    createLeadSynth() {
        switch(this.currentLeadInstrument) {
            case 'saw':
                this.leadSynth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'fatsawtooth', count: 3, spread: 30 }, envelope: { attack: 0.02, decay: 0.1, sustain: 0.4, release: 0.8 } });
                break;
            case 'square':
                this.leadSynth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'fatsquare', count: 2, spread: 10 }, envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.5 } });
                break;
            case 'sine':
                this.leadSynth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'fatsine', count: 2, spread: 20 }, envelope: { attack: 0.02, decay: 0.2, sustain: 0.5, release: 1 } });
                break;
            case 'triangle':
                this.leadSynth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'fattriangle', count: 2, spread: 15 }, envelope: { attack: 0.02, decay: 0.15, sustain: 0.4, release: 0.6 } });
                break;
            case 'pulse':
                this.leadSynth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'pulse', width: 0.2 }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.4 } });
                break;
            case 'supersaw':
                this.leadSynth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'fatsawtooth', count: 5, spread: 20 }, envelope: { attack: 0.03, decay: 0.2, sustain: 0.4, release: 0.6 } });
                break;
            default:
                this.leadSynth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'fatsawtooth', count: 3, spread: 30 }, envelope: { attack: 0.02, decay: 0.1, sustain: 0.4, release: 0.8 } });
        }
        this.leadSynth.connect(this.leadPanner);
        this.leadSynth.volume.value = -3;
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
        switch(this.currentDrumKit) {
            case 'electronic':
                this.drums = {
                    kick: new Tone.MembraneSynth({ pitchDecay: 0.02, octaves: 10, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.3 } }),
                    snare: new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 } }),
                    hihat: new Tone.MetalSynth({ frequency: 800, envelope: { attack: 0.001, decay: 0.05, release: 0.01 }, harmonicity: 3, modulationIndex: 10, resonance: 8000, octaves: 1.5 }),
                    tom: new Tone.MembraneSynth({ pitchDecay: 0.03, octaves: 8, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 } })
                };
                break;
            case '808':
                this.drums = {
                    kick: new Tone.MembraneSynth({ pitchDecay: 0.008, octaves: 12, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.25 } }),
                    snare: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 } }),
                    hihat: new Tone.MetalSynth({ frequency: 1000, envelope: { attack: 0.001, decay: 0.03, release: 0.01 }, harmonicity: 2, modulationIndex: 5, resonance: 10000, octaves: 1 }),
                    tom: new Tone.MembraneSynth({ pitchDecay: 0.01, octaves: 10, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 } })
                };
                break;
            default:
                this.drums = {
                    kick: new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 8, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1 } }),
                    snare: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.15 } }),
                    hihat: new Tone.MetalSynth({ frequency: 200, envelope: { attack: 0.001, decay: 0.08, release: 0.01 }, harmonicity: 5.1, modulationIndex: 32, resonance: 5000, octaves: 2 }),
                    tom: new Tone.MembraneSynth({ pitchDecay: 0.06, octaves: 5, oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.25, sustain: 0.01, release: 0.25 } })
                };
        }
        Object.keys(this.drums).forEach(inst => {
            if (this.drumPanners[inst]) this.drums[inst].connect(this.drumPanners[inst]);
        });
        this.drums.kick.volume.value = -4;
        this.drums.snare.volume.value = -10;
        this.drums.hihat.volume.value = -15;
        this.drums.tom.volume.value = -6;
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
    
    setPatternLength(length) {
        const validLengths = [16, 32, 64];
        if (!validLengths.includes(length)) return;
        if (this.isPlaying) this.stop();
        this.patternLength = length;
        this.initializePatternGroups();
        this.rebuildGrids();
        this.createStepTimeline();
        this.createSectionTimelines();
        this.updatePatternLengthUI();
        this.createSectionRepeatsControl();
        this.showNotification(`Pattern length: ${length} steps`, 'success');
    }
    
    initializePatternGroups() {
        const groupCount = this.patternLength / 16;
        for (let i = 0; i < groupCount; i++) {
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
        const groupCount = this.patternLength / 16;
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
        if (indicator) indicator.textContent = `${this.patternLength} steps`;
        document.querySelectorAll('[data-pattern-length]').forEach(btn => {
            const length = parseInt(btn.dataset.patternLength);
            btn.classList.toggle('active', length === this.patternLength);
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
        const groupCount = this.patternLength / 16;
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
            
            for (let col = 0; col < 16; col++) {
                const column = document.createElement('div');
                column.className = 'string-column';
                column.dataset.col = col;
                column.dataset.groupIndex = g;
                for (let row = 0; row < 8; row++) {
                    const cell = document.createElement('div');
                    cell.className = 'string-cell';
                    cell.dataset.col = col;
                    cell.dataset.row = row;
                    cell.dataset.groupIndex = g;
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
        const groupCount = this.patternLength / 16;
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
            
            for (let col = 0; col < 16; col++) {
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
        const groupCount = this.patternLength / 16;
        const rowCount = 8;
        
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
            
            for (let col = 0; col < 16; col++) {
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
        const groupCount = this.patternLength / 16;
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
                
                for (let step = 0; step < 16; step++) {
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
        const groupCount = this.patternLength / 16;
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
                
                for (let step = 0; step < 16; step++) {
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
    
    setupEventListeners() {
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
            this.tempo = parseInt(e.target.value);
            document.getElementById('tempoValue').textContent = this.tempo + ' BPM';
            if (this.isPlaying) { this.stop(); this.play(); }
        });
        
        document.getElementById('melodyScale')?.addEventListener('change', () => {
            this.populateChordProgressionSelect();
        });
        document.getElementById('chordProgressionSelect')?.addEventListener('change', (e) => {
            if (e.target.value !== '') {
                this.generateHarmonyFromChordProgression(e.target.value);
                e.target.value = '';
            }
        });
        document.getElementById('applyChordProgressionBtn')?.addEventListener('click', () => {
            const select = document.getElementById('chordProgressionSelect');
            if (select && select.value !== '') {
                this.generateHarmonyFromChordProgression(select.value);
                select.value = '';
            } else {
                this.showNotification('Please select a chord progression first', 'info');
            }
        });
        
        document.getElementById('genreSelect')?.addEventListener('change', (e) => this.populateSongSelect(e.target.value));
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
            
            // Update Howler engine master volume
            if (this.howlerEngine) {
                this.howlerEngine.setMasterVolume(normalizedValue);
            }
            
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
                this.setPatternLength(length);
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
        
        const globalStep = groupIndex * 16 + col;
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
        
        const globalStep = groupIndex * 16 + col;
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
                    const scale = this.getCurrentScale();
                    if (row < scale.length) {
                        this.leadSynth.triggerAttackRelease(scale[row], '16n');
                    }
                }
                // Trigger visual pulse for individual cell click
                if (this.rhythmVisualizer && this.rhythmVisualizer.enabled) {
                    this.rhythmVisualizer.pulseLead();
                }
            }
        }
        
        const globalStep = groupIndex * 16 + col;
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
        
        const globalStep = groupIndex * 16 + step;
        this.updateTimelineForStep(globalStep);
        this.updateSectionTimelineForStep(globalStep);
    }
    
    play() {
        if (this.isPlaying) return;
        
        // Resume audio contexts
        if (this.howlerEngine) {
            this.howlerEngine.resume();
        }
        
        // Sync rhythm visualizer tempo
        if (this.rhythmVisualizer?.enabled) {
            this.rhythmVisualizer.setTempo(this.tempo);
        }
        
        this.isPlaying = true;
        this.currentStep = 0;
        this.groupLoopCurrent = [0, 0, 0, 0];
        
        const stepTime = (60 / this.tempo) * 250;
        this.loopInterval = setInterval(() => {
            this.playStep(this.currentStep);
            
            const groupCount = this.patternLength / 16;
            const currentGroup = Math.floor(this.currentStep / 16);
            const localStep = this.currentStep % 16;
            
            if (localStep === 15) {
                this.groupLoopCurrent[currentGroup]++;
                
                if (this.groupLoopCurrent[currentGroup] < this.groupLoopCounts[currentGroup]) {
                    this.currentStep = currentGroup * 16;
                } else {
                    this.groupLoopCurrent[currentGroup] = 0;
                    
                    if (currentGroup < groupCount - 1) {
                        this.currentStep = (currentGroup + 1) * 16;
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
        
        const groupIndex = Math.floor(step / 16);
        const localStep = step % 16;
        
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
        
        // Use Howler engine for drums if available
        if (this.howlerEngine?.initialized) {
            if (this.rhythmEnabled && groupRhythm) {
                Object.keys(this.drums || {}).forEach(instrument => {
                    if (this.drums[instrument] && groupRhythm[instrument]?.has(localStep)) {
                        const vel = this.rhythmVelocity[instrument]?.get(step) ?? 0.8;
                        
                        // Use Howler engine for drums
                        if (instrument === 'kick') {
                            this.howlerEngine.playDrum('kick', vel);
                        } else if (instrument === 'snare') {
                            this.howlerEngine.playDrum('snare', vel);
                        } else if (instrument === 'hihat') {
                            this.howlerEngine.playDrum('hihat', vel);
                        } else if (instrument === 'tom') {
                            this.howlerEngine.playDrum('tom', vel);
                        } else {
                            this.drums[instrument].triggerAttackRelease('16n', undefined, vel);
                        }
                        
                        const cell = document.querySelector(`.rhythm-cell[data-instrument="${instrument}"][data-step="${localStep}"]`);
                        if (cell) {
                            cell.classList.add('playing');
                            setTimeout(() => cell.classList.remove('playing'), 150);
                        }
                    }
                });
            }
        } else {
            // Fallback to Tone.js drums
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
            const scale = this.getCurrentScale();
            if (row < scale.length) {
                this.leadSynth.triggerAttackRelease(scale[row], '16n', undefined, leadVel);
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
        this.stop();
        
        this.patternGroups.harmonics.forEach(g => g.clear());
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
        return this.scales[select ? select.value : 'c-major'];
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
        
        for (let i = 0; i < 16; i++) {
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
        const groupIndex = Math.floor(step / 16);
        const localStep = step % 16;
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
                
                for (let i = 0; i < 8; i++) {
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
                const groupIndex = Math.floor(this.currentStep / 16);
                const localStep = this.currentStep % 16;
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
        // Convert step to cell index (step 0-1 -> cell 0, step 2-3 -> cell 1, etc.)
        const cellIndex = Math.floor(step / 2);
        
        const sections = ['harmonics', 'melody', 'rhythm', 'bass', 'lead', 'percussion'];
        
        sections.forEach(sectionId => {
            const container = document.getElementById(`${sectionId}Timeline`);
            if (!container) return;
            
            const groupIndex = Math.floor(step / 16);
            
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
    
    populateChordProgressionSelect() {
        const select = document.getElementById('chordProgressionSelect');
        if (!select) return;
        
        const scaleSelect = document.getElementById('melodyScale');
        const scaleKey = scaleSelect ? scaleSelect.value : 'c-major';
        const chordKey = this.getChordKeyForScale(scaleKey);
        const progressionData = this.getChordProgressionForKey(chordKey);
        
        select.innerHTML = '<option value="">-- Select Progression --</option>';
        
        progressionData.progressions.forEach((prog, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = prog.join(' - ');
            select.appendChild(option);
        });
        
        const customOption = document.createElement('option');
        customOption.value = 'custom';
        customOption.textContent = '+ Create Custom';
        select.appendChild(customOption);
    }
    
    generateHarmonyFromChordProgression(progressionIndex) {
        const scaleSelect = document.getElementById('melodyScale');
        const scaleKey = scaleSelect ? scaleSelect.value : 'c-major';
        const chordKey = this.getChordKeyForScale(scaleKey);
        const progressionData = this.getChordProgressionForKey(chordKey);
        
        if (progressionIndex === 'custom') {
            this.showCustomProgressionBuilder(progressionData);
            return;
        }
        
        const progression = progressionData.progressions[progressionIndex];
        if (!progression) return;
        
        this.harmonics.clear();
        
        progression.forEach((chordSymbol, index) => {
            const chord = progressionData.chords[chordSymbol];
            if (chord) {
                chord.forEach((note, noteIndex) => {
                    const harmonicIndex = this.harmonicNotes.findIndex(n => n.startsWith(note.split('/')[0]));
                    if (harmonicIndex !== -1) {
                        this.harmonics.add(harmonicIndex);
                    }
                });
            }
        });
        
        this.updateHarmonicsUI();
        this.playChordProgression(progression, progressionData);
        
        this.showNotification(`Chord progression: ${progression.join(' - ')}`, 'success');
    }
    
    playChordProgression(progression, progressionData) {
        if (!this.polySynth) return;
        
        progression.forEach((chordSymbol, index) => {
            const chord = progressionData.chords[chordSymbol];
            if (chord) {
                const chordNotes = chord.map(note => {
                    const baseNote = this.harmonicNotes.find(n => n.startsWith(note.split('/')[0]));
                    return baseNote || note + '4';
                });
                
                setTimeout(() => {
                    if (this.harmonicsEnabled && chordNotes.length > 0) {
                        this.polySynth.triggerAttackRelease(chordNotes, '2n');
                    }
                }, index * 500);
            }
        });
    }
    
    showCustomProgressionBuilder(progressionData) {
        const modal = document.getElementById('customProgressionModal');
        if (!modal) {
            this.createCustomProgressionModal(progressionData);
        }
        modal.classList.remove('hidden');
        this.populateCustomProgressionOptions(progressionData);
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
    
    populateCustomProgressionOptions(progressionData) {
        const container = document.getElementById('customProgressionOptions');
        if (!container) return;
        
        container.innerHTML = '';
        this.customProgression = [];
        document.getElementById('customProgressionDisplay').textContent = 'None';
        
        Object.keys(progressionData.chords).forEach(chordSymbol => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-secondary';
            btn.style.padding = '0.5rem 1rem';
            btn.style.fontSize = '0.85rem';
            btn.textContent = chordSymbol;
            btn.onclick = () => this.addToCustomProgression(chordSymbol, progressionData);
            container.appendChild(btn);
        });
    }
    
    addToCustomProgression(chordSymbol, progressionData) {
        if (!this.customProgression) this.customProgression = [];
        this.customProgression.push(chordSymbol);
        
        document.getElementById('customProgressionDisplay').textContent = this.customProgression.join(' - ');
        
        const chord = progressionData.chords[chordSymbol];
        if (chord && this.polySynth) {
            const chordNotes = chord.map(note => {
                const baseNote = this.harmonicNotes.find(n => n.startsWith(note.split('/')[0]));
                return baseNote || note + '4';
            });
            this.polySynth.triggerAttackRelease(chordNotes, '4n');
        }
    }
    
    applyCustomProgression() {
        if (!this.customProgression || this.customProgression.length === 0) {
            this.showNotification('Please select at least one chord', 'error');
            return;
        }
        
        const scaleSelect = document.getElementById('melodyScale');
        const scaleKey = scaleSelect ? scaleSelect.value : 'c-major';
        const chordKey = this.getChordKeyForScale(scaleKey);
        const progressionData = this.getChordProgressionForKey(chordKey);
        
        this.harmonics.clear();
        
        this.customProgression.forEach(chordSymbol => {
            const chord = progressionData.chords[chordSymbol];
            if (chord) {
                chord.forEach(note => {
                    const harmonicIndex = this.harmonicNotes.findIndex(n => n.startsWith(note.split('/')[0]));
                    if (harmonicIndex !== -1) {
                        this.harmonics.add(harmonicIndex);
                    }
                });
            }
        });
        
        this.updateHarmonicsUI();
        this.playChordProgression(this.customProgression, progressionData);
        
        document.getElementById('customProgressionModal').classList.add('hidden');
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
            scale: [[0,0],[1,1],[2,2],[3,3],[4,4],[5,5],[6,6],[7,7],[8,6],[9,5],[10,4],[11,3],[12,2],[13,1],[14,0],[15,1]],
            arpeggio: [[0,0],[1,2],[2,4],[3,2],[4,0],[5,2],[6,4],[7,2],[8,0],[9,2],[10,4],[11,2],[12,0],[13,2],[14,4],[15,2]],
            happy: [[0,4],[1,3],[2,4],[3,2],[4,4],[5,3],[6,4],[7,2],[8,4],[9,3],[10,4],[11,2],[12,5],[13,4],[14,5],[15,3]],
            mysterious: [[0,7],[1,5],[2,7],[3,4],[4,6],[5,4],[6,6],[7,3],[8,7],[9,5],[10,7],[11,4],[12,6],[13,4],[14,6],[15,3]]
        };
        if (patterns[preset]) {
            patterns[preset].forEach(([col, row]) => {
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
        
        if (patterns[preset]) {
            patterns[preset].forEach(([col, row]) => {
                this.bassRows.set(col, row);
                const cell = document.querySelector(`.bass-cell[data-col="${col}"][data-row="${row}"]`);
                if (cell) cell.classList.add('active');
            });
        }
        
        if (this.bassEnabled) {
            patterns[preset]?.forEach(([col, row]) => {
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
        
        const scale = this.getCurrentScale();
        const patterns = {
            'melodic': [[0, 0], [2, 2], [4, 4], [6, 2], [8, 3], [10, 5], [12, 4], [14, 2]],
            'arpeggio': [[0, 0], [1, 2], [2, 4], [3, 3], [4, 0], [5, 2], [6, 4], [7, 3], [8, 0], [9, 2], [10, 4], [11, 3], [12, 0], [13, 2], [14, 4], [15, 3]],
            'stabs': [[0, 4], [3, 5], [6, 4], [9, 3], [12, 5], [15, 4]],
            'plucks': [[0, 0], [2, 3], [4, 1], [6, 4], [8, 2], [10, 5], [12, 1], [14, 3]]
        };
        
        if (patterns[preset]) {
            patterns[preset].forEach(([col, row]) => {
                if (row < 8) {
                    this.leadRows.set(col, row);
                    const cell = document.querySelector(`.lead-cell[data-col="${col}"][data-row="${row}"]`);
                    if (cell) cell.classList.add('active');
                }
            });
        }
        
        if (this.leadEnabled) {
            patterns[preset]?.forEach(([col, row]) => {
                setTimeout(() => {
                    if (row < scale.length) {
                        this.leadSynth.triggerAttackRelease(scale[row], '16n');
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
        
        const effectStart = this.effectsEnabled ? this.effects.lowpass : this.compressor;
        
        if (this.harmonyPanner) {
            this.harmonyPanner.disconnect();
            this.harmonyPanner.connect(effectStart);
        }
        if (this.melodyPanner) {
            this.melodyPanner.disconnect();
            this.melodyPanner.connect(effectStart);
        }
        Object.keys(this.drumPanners).forEach(inst => {
            if (this.drumPanners[inst]) {
                this.drumPanners[inst].disconnect();
                this.drumPanners[inst].connect(effectStart);
            }
        });
        if (this.bassPanner) {
            this.bassPanner.disconnect();
            this.bassPanner.connect(effectStart);
        }
        if (this.leadPanner) {
            this.leadPanner.disconnect();
            this.leadPanner.connect(effectStart);
        }
        Object.keys(this.percussionPanners).forEach(inst => {
            if (this.percussionPanners[inst]) {
                this.percussionPanners[inst].disconnect();
                this.percussionPanners[inst].connect(effectStart);
            }
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
    
    populateSongSelect(genre) {
        const select = document.getElementById('songSelect');
        select.innerHTML = '<option value="">-- Select --</option>';
        if (!genre) { select.disabled = true; return; }
        getPresetsByGenre(genre).then(presets => {
            Object.entries(presets).forEach(([key, preset]) => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = `${preset.name} - ${preset.artist}`;
                select.appendChild(option);
            });
            select.disabled = false;
        });
    }
    
    async loadSongPreset(presetKey) {
        // Load song data even if audio isn't initialized
        if (Object.keys(window.SONG_PRESETS).length === 0) {
            setTimeout(() => this.loadSongPreset(presetKey), 100);
            return;
        }
        const preset = window.SONG_PRESETS[presetKey];
        if (!preset) return;
        
        // Get step group definitions for current pattern length
        // The preset always has 64-step data, but we map it to the current pattern length
        const stepGroups = this.getStepGroupDefinitions();
        
        this.clearAll();
        this.tempo = preset.tempo;
        document.getElementById('tempoSlider').value = this.tempo;
        document.getElementById('tempoValue').textContent = this.tempo + ' BPM';
        
        // Don't change pattern length - keep current setting and map 64-step data to it
        // Initialize groups if needed for current pattern length
        if (this.patternGroups.harmonics.length < this.patternLength / 16) {
            this.initializePatternGroups();
            this.rebuildGrids();
            this.createStepTimeline();
            this.createSectionTimelines();
            this.updatePatternLengthUI();
            this.createStepGroupsAccordion();
        }
        
        this.harmonics = new Set(preset.harmonics);
        
        // Map melody data from 64-step to current pattern length
        Object.entries(preset.melody || {}).forEach(([key]) => {
            const [sourceStep, row] = key.split('-').map(Number);
            
            // Find which group this source step belongs to
            for (const group of stepGroups) {
                if (sourceStep >= group.sourceStart && sourceStep <= group.sourceEnd) {
                    // Map to local step within the group
                    const localStep = sourceStep - group.sourceStart;
                    const groupIndex = stepGroups.indexOf(group);
                    
                    if (groupIndex >= 0 && groupIndex < this.patternGroups.melody.length) {
                        this.patternGroups.melody[groupIndex].set(localStep, row);
                    }
                    break;
                }
            }
        });
        
        // Map bass data from 64-step to current pattern length
        Object.entries(preset.bass || {}).forEach(([key]) => {
            const [sourceStep, row] = key.split('-').map(Number);
            
            for (const group of stepGroups) {
                if (sourceStep >= group.sourceStart && sourceStep <= group.sourceEnd) {
                    const localStep = sourceStep - group.sourceStart;
                    const groupIndex = stepGroups.indexOf(group);
                    
                    if (groupIndex >= 0 && groupIndex < this.patternGroups.bass.length) {
                        this.patternGroups.bass[groupIndex].set(localStep, row);
                    }
                    break;
                }
            }
        });
        
        // Map lead data from 64-step to current pattern length
        Object.entries(preset.lead || {}).forEach(([key]) => {
            const [sourceStep, row] = key.split('-').map(Number);
            
            for (const group of stepGroups) {
                if (sourceStep >= group.sourceStart && sourceStep <= group.sourceEnd) {
                    const localStep = sourceStep - group.sourceStart;
                    const groupIndex = stepGroups.indexOf(group);
                    
                    if (groupIndex >= 0 && groupIndex < this.patternGroups.lead.length) {
                        this.patternGroups.lead[groupIndex].set(localStep, row);
                    }
                    break;
                }
            }
        });
        
        // Map rhythm data from 64-step to current pattern length
        const firstRhythmGroup = this.patternGroups.rhythm[0] || {};
        Object.keys(firstRhythmGroup).forEach(inst => {
            const originalSteps = preset.rhythm?.[inst] || [];
            
            originalSteps.forEach(sourceStep => {
                for (const group of stepGroups) {
                    if (sourceStep >= group.sourceStart && sourceStep <= group.sourceEnd) {
                        const localStep = sourceStep - group.sourceStart;
                        const groupIndex = stepGroups.indexOf(group);
                        
                        if (groupIndex >= 0 && groupIndex < this.patternGroups.rhythm.length) {
                            this.patternGroups.rhythm[groupIndex][inst].add(localStep);
                        }
                        break;
                    }
                }
            });
        });
        
        this.harmonics = this.patternGroups.harmonics[this.currentGroupIndex];
        this.melodyRows = this.patternGroups.melody[this.currentGroupIndex];
        this.bassRows = this.patternGroups.bass[this.currentGroupIndex];
        this.leadRows = this.patternGroups.lead[this.currentGroupIndex];
        this.rhythm = this.patternGroups.rhythm[this.currentGroupIndex];
        
        this.rebuildGrids();
        this.createSectionTimelines();
        this.updateAccordionActivity();
        
        document.querySelectorAll('.harmonic-cell').forEach((c, i) => c.classList.toggle('active', this.harmonics.has(i)));
        
        this.patternGroups.melody.forEach((group, gIdx) => {
            group.forEach((row, col) => {
                const cell = document.querySelector(`.string-cell[data-col="${col}"][data-row="${row}"][data-group-index="${gIdx}"]`);
                if (cell) cell.classList.add('active');
            });
        });
        
        this.patternGroups.bass.forEach((group, gIdx) => {
            group.forEach((row, col) => {
                const cell = document.querySelector(`.bass-cell[data-col="${col}"][data-row="${row}"][data-group-index="${gIdx}"]`);
                if (cell) cell.classList.add('active');
            });
        });
        
        this.patternGroups.lead.forEach((group, gIdx) => {
            group.forEach((row, col) => {
                const cell = document.querySelector(`.lead-cell[data-col="${col}"][data-row="${row}"][data-group-index="${gIdx}"]`);
                if (cell) cell.classList.add('active');
            });
        });
        
        this.patternGroups.rhythm.forEach((group, gIdx) => {
            Object.keys(group).forEach(inst => {
                group[inst].forEach(step => {
                    const cell = document.querySelector(`.rhythm-cell[data-instrument="${inst}"][data-step="${step}"][data-group-index="${gIdx}"]`);
                    if (cell) cell.classList.add('active');
                });
            });
        });
        
        this.showNotification(`Loaded: ${preset.name}`, 'success');
        
        // Only play if audio is already initialized
        if (this.audioEngine) {
            if (Tone.context.state === 'suspended') {
                await Tone.context.resume();
            }
            this.play();
        } else {
            // Show prompt to enable audio for playback
            window.showAudioPrompt?.();
        }
    }
    
    randomize() {
        const scale = this.getCurrentScale();
        const groupCount = this.patternLength / 16;
        
        for (let g = 0; g < groupCount; g++) {
            const groupBass = this.patternGroups.bass[g];
            const bassDensity = 0.3 + Math.random() * 0.4;
            
            for (let col = 0; col < 16; col++) {
                if (Math.random() < bassDensity) {
                    const row = Math.floor(Math.random() * 6);
                    groupBass.set(col, row);
                }
            }
        }
        
        for (let g = 0; g < groupCount; g++) {
            const groupLead = this.patternGroups.lead[g];
            const leadDensity = 0.2 + Math.random() * 0.5;
            
            for (let col = 0; col < 16; col++) {
                if (Math.random() < leadDensity) {
                    const row = Math.floor(Math.random() * 8);
                    groupLead.set(col, row);
                }
            }
        }
        
        for (let g = 0; g < groupCount; g++) {
            const groupRhythm = this.patternGroups.rhythm[g];
            
            for (let step = 0; step < 16; step++) {
                if (step % 4 === 0 || (step === 10 && Math.random() > 0.5)) {
                    groupRhythm.kick.add(step);
                }
            }
            
            for (let step = 0; step < 16; step++) {
                if (step === 4 || step === 12 || (step === 14 && Math.random() > 0.5)) {
                    groupRhythm.snare.add(step);
                }
            }
            
            for (let step = 0; step < 16; step++) {
                if (step % 2 === 0 || Math.random() > 0.6) {
                    groupRhythm.hihat.add(step);
                }
            }
            
            for (let step = 0; step < 16; step++) {
                if (Math.random() > 0.85) {
                    groupRhythm.tom.add(step);
                }
            }
            
            if (this.percussionEnabled) {
                for (let step = 0; step < 16; step++) {
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
        const globalStep = note.group * 16 + note.step;
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
        const globalStep = note.group * 16 + note.step;
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
