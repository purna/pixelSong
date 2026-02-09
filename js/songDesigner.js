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
        this.harmonics = new Set();
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
            'triangle': { synth: Tone.PolySynth, opts: { oscillator: { type: 'fattriangle', count: 2, spread: 15 }, envelope: { attack: 0.02, decay: 0.15, sustain: 0.4, release: 0.6 } } }
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
        this.currentMelodyInstrument = 'saw';
        this.currentBassInstrument = 'sub';
        this.currentLeadInstrument = 'saw';
        this.currentDrumKit = 'acoustic';
        this.currentPercussionKit = 'latin';
        this.bassOctave = 1; // 1 = one octave down, 2 = two octaves down
        
        // Pattern groups for multi-16-step navigation
        this.currentGroupIndex = 0; // Currently loaded group (0-3 for 64 steps)
        this.patternGroups = {
            harmonics: [new Set(), new Set(), new Set(), new Set()], // 4 groups for 64 steps
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
        
        // Backward compatibility - use first group as active pattern
        this.harmonics = this.patternGroups.harmonics[0];
        this.melodyRows = this.patternGroups.melody[0];
        this.bassRows = this.patternGroups.bass[0];
        this.leadRows = this.patternGroups.lead[0];
        this.rhythm = this.patternGroups.rhythm[0];
        
        // Bass instruments
        this.bassInstruments = {
            'sub': { synth: Tone.MonoSynth, opts: { oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.5 }, filterEnvelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.5, baseFrequency: 200, octaves: 2 } } },
            'synth': { synth: Tone.MonoSynth, opts: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.4 }, filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.4, baseFrequency: 300, octaves: 3 } } },
            'fm': { synth: Tone.FMSynth, opts: { harmonicity: 3, modulationIndex: 10, oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.8 } } },
            'square': { synth: Tone.MonoSynth, opts: { oscillator: { type: 'square' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.3 } } }
        };
        
        // Lead instruments
        this.leadInstruments = {
            'saw': { synth: Tone.PolySynth, opts: { oscillator: { type: 'fatsawtooth', count: 3, spread: 30 }, envelope: { attack: 0.02, decay: 0.1, sustain: 0.4, release: 0.8 } } },
            'square': { synth: Tone.PolySynth, opts: { oscillator: { type: 'fatsquare', count: 2, spread: 10 }, envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.5 } } },
            'sine': { synth: Tone.PolySynth, opts: { oscillator: { type: 'fatsine', count: 2, spread: 20 }, envelope: { attack: 0.02, decay: 0.2, sustain: 0.5, release: 1 } } },
            'triangle': { synth: Tone.PolySynth, opts: { oscillator: { type: 'fattriangle', count: 2, spread: 15 }, envelope: { attack: 0.02, decay: 0.15, sustain: 0.4, release: 0.6 } } },
            'pulse': { synth: Tone.PolySynth, opts: { oscillator: { type: 'pulse', width: 0.2 }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.4 } } },
            'supersaw': { synth: Tone.PolySynth, opts: { oscillator: { type: 'fatsawtooth', count: 5, spread: 20 }, envelope: { attack: 0.03, decay: 0.2, sustain: 0.4, release: 0.6 } } }
        };
        
        // Additional percussion kits
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
        
        // Chord Progression Builder
        this.chordProgressions = {
            'c-major': {
                name: 'C Major',
                key: 'C',
                scale: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
                chords: {
                    'I': ['C', 'E', 'G'],
                    'ii': ['D', 'F', 'A'],
                    'iii': ['E', 'G', 'B'],
                    'IV': ['F', 'A', 'C'],
                    'V': ['G', 'B', 'D'],
                    'vi': ['A', 'C', 'E'],
                    'vii°': ['B', 'D', 'F']
                },
                progressions: [
                    ['I', 'IV', 'V', 'I'],
                    ['I', 'vi', 'IV', 'V'],
                    ['I', 'IV', 'I', 'V'],
                    ['vi', 'IV', 'I', 'V'],
                    ['I', 'V', 'vi', 'IV'],
                    ['IV', 'I', 'V', 'vi'],
                    ['I', 'IV', 'vi', 'V'],
                    ['ii', 'V', 'I']
                ]
            },
            'g-major': {
                name: 'G Major',
                key: 'G',
                scale: ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
                chords: {
                    'I': ['G', 'B', 'D'],
                    'ii': ['A', 'C', 'E'],
                    'iii': ['B', 'D', 'F#'],
                    'IV': ['C', 'E', 'G'],
                    'V': ['D', 'F#', 'A'],
                    'vi': ['E', 'G', 'B'],
                    'vii°': ['F#', 'A', 'C']
                },
                progressions: [
                    ['I', 'IV', 'V', 'I'],
                    ['I', 'vi', 'IV', 'V'],
                    ['I', 'V', 'vi', 'IV'],
                    ['IV', 'I', 'V', 'vi']
                ]
            },
            'f-major': {
                name: 'F Major',
                key: 'F',
                scale: ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
                chords: {
                    'I': ['F', 'A', 'C'],
                    'ii': ['G', 'Bb', 'D'],
                    'iii': ['A', 'C', 'E'],
                    'IV': ['Bb', 'D', 'F'],
                    'V': ['C', 'E', 'G'],
                    'vi': ['D', 'F', 'A'],
                    'vii°': ['E', 'G', 'Bb']
                },
                progressions: [
                    ['I', 'IV', 'V', 'I'],
                    ['I', 'vi', 'IV', 'V'],
                    ['IV', 'V', 'I', 'vi']
                ]
            },
            'd-minor': {
                name: 'D Minor',
                key: 'Dm',
                scale: ['D', 'E', 'F', 'G', 'A', 'Bb', 'C'],
                chords: {
                    'i': ['D', 'F', 'A'],
                    'ii°': ['E', 'G', 'Bb'],
                    'III': ['F', 'A', 'C'],
                    'iv': ['G', 'Bb', 'D'],
                    'v': ['A', 'C', 'E'],
                    'VI': ['Bb', 'D', 'F'],
                    'VII': ['C', 'E', 'G']
                },
                progressions: [
                    ['i', 'iv', 'v', 'i'],
                    ['i', 'VI', 'III', 'VII'],
                    ['i', 'iv', 'i', 'v'],
                    ['VI', 'iv', 'i', 'v']
                ]
            },
            'a-minor': {
                name: 'A Minor',
                key: 'Am',
                scale: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
                chords: {
                    'i': ['A', 'C', 'E'],
                    'ii°': ['B', 'D', 'F'],
                    'III': ['C', 'E', 'G'],
                    'iv': ['D', 'F', 'A'],
                    'v': ['E', 'G', 'B'],
                    'VI': ['F', 'A', 'C'],
                    'VII': ['G', 'B', 'D']
                },
                progressions: [
                    ['i', 'iv', 'v', 'i'],
                    ['i', 'VI', 'III', 'VII'],
                    ['i', 'v', 'iv', 'i']
                ]
            }
        };
        
        // Map scales to chord progression keys
        this.scaleToChordKey = {
            'c-major': 'c-major',
            'g-major': 'g-major',
            'f-major': 'f-major',
            'd-minor': 'd-minor',
            'a-minor': 'a-minor'
        };
        
        // Per-step automation data
        this.melodyVelocity = new Map(); // col -> velocity (0-1)
        this.harmonyVelocity = new Map(); // index -> velocity (0-1)
        this.leadVelocity = new Map();
        this.bassVelocity = new Map();
        this.rhythmVelocity = {
            kick: new Map(),
            snare: new Map(),
            hihat: new Map(),
            tom: new Map(),
            conga: new Map(),
            bongo: new Map(),
            shaker: new Map(),
            cymbal: new Map()
        };
        
        // Effect automation data
        this.effectAutomation = {
            lowpass: new Map()
        };
        
        // Enable/disable flags
        this.bassEnabled = true;
        this.leadEnabled = true;
        this.percussionEnabled = false;
        
        // Bass pattern data
        this.bassRows = new Map();
        
        // Lead pattern data
        this.leadRows = new Map();
        
        // Bass notes for 2-octave range
        this.bassNotes = ['C1', 'D1', 'E1', 'F1', 'G1', 'A1', 'B1', 'C2', 'D2', 'E2', 'F2', 'G2'];
        
        // Pan panners for each instrument
        this.harmonyPanner = null;
        this.melodyPanner = null;
        this.leadPanner = null;
        this.bassPanner = null;
        this.drumPanners = {};
        this.percussionPanners = {};
        
        // Accordion state
        this.expandedGroups = new Set([0]); // First group expanded by default
        
        // Copy/Paste state
        this.copyMode = false;
        this.pasteMode = false;
        this.copiedCells = []; // Array of {row, col} relative positions
        this.sourceGroupIndex = null; // Group where cells were copied from
    }
    
    // Step group definitions with names and colors
    getStepGroupDefinitions() {
        const definitions = {
            16: [
                { name: 'Main Pattern', color: '#f472b6', range: '1-16' }
            ],
            32: [
                { name: 'Original', color: '#f472b6', range: '1-16' },
                { name: 'Variation', color: '#a78bfa', range: '17-32' }
            ],
            64: [
                { name: 'Build Up', color: '#34d399', range: '1-16' },
                { name: 'Develop', color: '#60a5fa', range: '17-32' },
                { name: 'Peak', color: '#f472b6', range: '33-48' },
                { name: 'Resolve', color: '#a78bfa', range: '49-64' }
            ]
        };
        return definitions[this.patternLength] || definitions[16];
    }
    
    // Create the horizontal accordion for step groups
    createStepGroupsAccordion() {
        const container = document.getElementById('accordionContainer');
        if (!container) return;
        
        container.innerHTML = '';
        const groupCount = this.patternLength / 16;
        const stepGroups = this.getStepGroupDefinitions();
        
        for (let i = 0; i < groupCount; i++) {
            const group = stepGroups[i];
            const isExpanded = this.expandedGroups.has(i);
            const isActive = this.currentGroupIndex === i;
            
            const groupEl = document.createElement('div');
            groupEl.className = `accordion-group${isExpanded ? ' expanded' : ''}${isActive ? ' active' : ''}`;
            groupEl.dataset.groupIndex = i;
            
            groupEl.innerHTML = `
                <div class="accordion-group-header" data-group="${i}">
                    <div class="group-info">
                        <span class="group-name">${group.name}</span>
                        <span class="group-range">Steps ${group.range}</span>
                    </div>
                    <div class="group-activity">
                        <div class="activity-indicator"></div>
                        <i class="fas fa-chevron-down expand-icon"></i>
                    </div>
                </div>
                <div class="accordion-group-content">
                    <div class="group-details">
                        <div class="detail-row">
                            <span class="detail-label"><i class="fas fa-music"></i> Melody</span>
                            <span class="detail-value" id="group${i}MelodyCount">0</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label"><i class="fas fa-drum"></i> Drums</span>
                            <span class="detail-value" id="group${i}DrumsCount">0</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label"><i class="fas fa-bass"></i> Bass</span>
                            <span class="detail-value" id="group${i}BassCount">0</span>
                        </div>
                        <div class="automation-controls">
                            <div class="automation-row">
                                <span class="automation-label"><i class="fas fa-volume-up"></i> Vel</span>
                                <input type="range" class="group-velocity-slider" id="group${i}Velocity" min="0" max="100" value="80">
                                <span class="automation-value" id="group${i}VelocityValue">80%</span>
                            </div>
                            <div class="automation-row">
                                <span class="automation-label"><i class="fas fa-filter"></i> Filt</span>
                                <input type="range" class="group-filter-slider" id="group${i}Filter" min="0" max="100" value="50">
                                <span class="automation-value" id="group${i}FilterValue">50%</span>
                            </div>
                        </div>
                        <div class="effect-controls">
                            <div class="effect-row">
                                <span class="effect-label"><i class="fas fa-water"></i> Reverb</span>
                                <input type="range" class="group-reverb-slider" id="group${i}Reverb" min="0" max="100" value="30">
                                <span class="effect-value" id="group${i}ReverbValue">30%</span>
                            </div>
                            <div class="effect-row">
                                <span class="effect-label"><i class="fas fa-echo"></i> Echo</span>
                                <input type="range" class="group-echo-slider" id="group${i}Echo" min="0" max="100" value="20">
                                <span class="effect-value" id="group${i}EchoValue">20%</span>
                            </div>
                        </div>
                        <div class="pan-controls">
                            <div class="pan-row">
                                <span class="pan-label"><i class="fas fa-arrows-alt-h"></i> Pan</span>
                                <input type="range" class="group-pan-slider" id="group${i}Pan" min="-100" max="100" value="0">
                                <span class="pan-value" id="group${i}PanValue">0</span>
                            </div>
                        </div>
                    </div>
                    <div class="group-visual" id="group${i}Visual"></div>
                </div>
            `;
            
            container.appendChild(groupEl);
            
            // Create visual steps
            this.createGroupVisual(i);
            
            // Add click handler
            groupEl.querySelector('.accordion-group-header').addEventListener('click', () => {
                this.toggleGroupExpansion(i);
            });
            
            // Add velocity slider handler
            const velocitySlider = groupEl.querySelector('.group-velocity-slider');
            if (velocitySlider) {
                velocitySlider.addEventListener('input', (e) => {
                    const value = parseInt(e.target.value);
                    document.getElementById(`group${i}VelocityValue`).textContent = value + '%';
                    this.applyGroupVelocity(i, value / 100);
                });
            }
            
            // Add filter slider handler
            const filterSlider = groupEl.querySelector('.group-filter-slider');
            if (filterSlider) {
                filterSlider.addEventListener('input', (e) => {
                    const value = parseInt(e.target.value);
                    document.getElementById(`group${i}FilterValue`).textContent = value + '%';
                    this.applyGroupFilter(i, value);
                });
            }
            
            // Add reverb slider handler
            const reverbSlider = groupEl.querySelector('.group-reverb-slider');
            if (reverbSlider) {
                reverbSlider.addEventListener('input', (e) => {
                    const value = parseInt(e.target.value);
                    document.getElementById(`group${i}ReverbValue`).textContent = value + '%';
                    this.applyGroupReverb(i, value / 100);
                });
            }
            
            // Add echo slider handler
            const echoSlider = groupEl.querySelector('.group-echo-slider');
            if (echoSlider) {
                echoSlider.addEventListener('input', (e) => {
                    const value = parseInt(e.target.value);
                    document.getElementById(`group${i}EchoValue`).textContent = value + '%';
                    this.applyGroupEcho(i, value / 100);
                });
            }
            
            // Add pan slider handler
            const panSlider = groupEl.querySelector('.group-pan-slider');
            if (panSlider) {
                panSlider.addEventListener('input', (e) => {
                    const value = parseInt(e.target.value);
                    document.getElementById(`group${i}PanValue`).textContent = value;
                    this.applyGroupPan(i, value / 100);
                });
            }
        }
        
        // Update activity indicators
        this.updateAccordionActivity();
    }
    
    // Apply velocity to all melody steps in a group
    applyGroupVelocity(groupIndex, value) {
        const startStep = groupIndex * 16;
        const endStep = Math.min(startStep + 16, this.patternLength);
        
        // Store velocity automation per step for melody
        for (let step = startStep; step < endStep; step++) {
            this.melodyVelocity.set(step, value);
        }
        
        this.showNotification(`${this.getStepGroupDefinitions()[groupIndex].name}: Velocity ${Math.round(value * 100)}%`, 'success');
    }
    
    // Apply filter cutoff to all steps in a group
    applyGroupFilter(groupIndex, value) {
        const startStep = groupIndex * 16;
        const endStep = Math.min(startStep + 16, this.patternLength);
        
        // Store filter automation per step
        for (let step = startStep; step < endStep; step++) {
            this.effectAutomation.lowpass.set(step, value);
        }
        
        this.showNotification(`${this.getStepGroupDefinitions()[groupIndex].name}: Filter ${value}%`, 'success');
    }
    
    // Apply reverb to all steps in a group
    applyGroupReverb(groupIndex, value) {
        const startStep = groupIndex * 16;
        const endStep = Math.min(startStep + 16, this.patternLength);
        
        // Store reverb automation per step
        if (!this.effectAutomation.reverb) {
            this.effectAutomation.reverb = new Map();
        }
        
        for (let step = startStep; step < endStep; step++) {
            this.effectAutomation.reverb.set(step, value);
        }
        
        this.showNotification(`${this.getStepGroupDefinitions()[groupIndex].name}: Reverb ${Math.round(value * 100)}%`, 'success');
    }
    
    // Apply echo to all steps in a group
    applyGroupEcho(groupIndex, value) {
        const startStep = groupIndex * 16;
        const endStep = Math.min(startStep + 16, this.patternLength);
        
        // Store echo automation per step
        if (!this.effectAutomation.echo) {
            this.effectAutomation.echo = new Map();
        }
        
        for (let step = startStep; step < endStep; step++) {
            this.effectAutomation.echo.set(step, value);
        }
        
        this.showNotification(`${this.getStepGroupDefinitions()[groupIndex].name}: Echo ${Math.round(value * 100)}%`, 'success');
    }
    
    // Apply pan to all instruments in a group
    applyGroupPan(groupIndex, value) {
        // Store pan automation per group
        if (!this.groupPanValues) {
            this.groupPanValues = [0, 0, 0, 0]; // Default center for 4 groups
        }
        
        this.groupPanValues[groupIndex] = value;
        
        // Apply pan to all instruments
        if (this.harmonyPanner) this.harmonyPanner.pan.value = value;
        if (this.melodyPanner) this.melodyPanner.pan.value = value;
        if (this.bassPanner) this.bassPanner.pan.value = value;
        if (this.leadPanner) this.leadPanner.pan.value = value;
        
        this.showNotification(`${this.getStepGroupDefinitions()[groupIndex].name}: Pan ${value >= 0 ? 'R' : 'L'}${Math.abs(Math.round(value * 100))}`, 'success');
    }
    
    // Create visual step representation for a group
    createGroupVisual(groupIndex) {
        const visualEl = document.getElementById(`group${groupIndex}Visual`);
        if (!visualEl) return;
        
        visualEl.innerHTML = '';
        
        for (let step = 0; step < 16; step++) {
            const globalStep = groupIndex * 16 + step;
            const stepEl = document.createElement('div');
            stepEl.className = 'visual-step';
            stepEl.dataset.globalStep = globalStep;
            
            // Check if this step has any activity
            const hasActivity = this.hasStepActivity(groupIndex, step);
            if (hasActivity) {
                stepEl.classList.add('active');
            }
            
            visualEl.appendChild(stepEl);
        }
    }
    
    // Check if a step has any activity
    hasStepActivity(groupIndex, localStep) {
        // Check melody
        if (this.patternGroups.melody[groupIndex]?.has(localStep)) {
            return true;
        }
        
        // Check bass
        if (this.patternGroups.bass[groupIndex]?.has(localStep)) {
            return true;
        }
        
        // Check lead
        if (this.patternGroups.lead[groupIndex]?.has(localStep)) {
            return true;
        }
        
        // Check rhythm
        const rhythm = this.patternGroups.rhythm[groupIndex];
        if (rhythm) {
            for (const inst of Object.keys(rhythm)) {
                if (rhythm[inst]?.has(localStep)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    // Toggle group expansion
    toggleGroupExpansion(groupIndex) {
        const groupEl = document.querySelector(`.accordion-group[data-group-index="${groupIndex}"]`);
        if (!groupEl) return;
        
        if (this.expandedGroups.has(groupIndex)) {
            this.expandedGroups.delete(groupIndex);
            groupEl.classList.remove('expanded');
        } else {
            this.expandedGroups.add(groupIndex);
            groupEl.classList.add('expanded');
        }
    }
    
    // Expand all groups
    expandAllGroups() {
        const groupCount = this.patternLength / 16;
        for (let i = 0; i < groupCount; i++) {
            this.expandedGroups.add(i);
        }
        this.createStepGroupsAccordion();
    }
    
    // Collapse all groups
    collapseAllGroups() {
        this.expandedGroups.clear();
        this.createStepGroupsAccordion();
    }
    
    // Update activity indicators and counts
    updateAccordionActivity() {
        const groupCount = this.patternLength / 16;
        
        for (let i = 0; i < groupCount; i++) {
            const groupEl = document.querySelector(`.accordion-group[data-group-index="${i}"]`);
            if (!groupEl) continue;
            
            let melodyCount = 0;
            let drumsCount = 0;
            let bassCount = 0;
            
            // Count melody
            this.patternGroups.melody[i]?.forEach((row, col) => {
                if (row !== undefined) melodyCount++;
            });
            
            // Count bass
            this.patternGroups.bass[i]?.forEach((row, col) => {
                if (row !== undefined) bassCount++;
            });
            
            // Count drums
            const rhythm = this.patternGroups.rhythm[i];
            if (rhythm) {
                for (const inst of Object.keys(rhythm)) {
                    rhythm[inst]?.forEach(step => {
                        drumsCount++;
                    });
                }
            }
            
            // Update UI
            const melodyEl = document.getElementById(`group${i}MelodyCount`);
            const drumsEl = document.getElementById(`group${i}DrumsCount`);
            const bassEl = document.getElementById(`group${i}BassCount`);
            
            if (melodyEl) melodyEl.textContent = melodyCount;
            if (drumsEl) drumsEl.textContent = drumsCount;
            if (bassEl) bassEl.textContent = bassCount;
            
            // Update activity indicator
            const hasActivity = melodyCount > 0 || drumsCount > 0 || bassCount > 0;
            groupEl.classList.toggle('has-activity', hasActivity);
            
            // Update visual steps
            const visualSteps = groupEl.querySelectorAll('.visual-step');
            visualSteps.forEach((stepEl, localStep) => {
                const globalStep = i * 16 + localStep;
                const hasStepAct = this.hasStepActivity(i, localStep);
                stepEl.classList.toggle('active', hasStepAct);
            });
        }
    }
    
    // Update playing state for accordion
    updateAccordionPlayingState() {
        document.querySelectorAll('.visual-step').forEach(stepEl => {
            stepEl.classList.remove('playing');
        });
        
        const playingStep = document.querySelector(`.visual-step[data-global-step="${this.currentStep}"]`);
        if (playingStep) {
            playingStep.classList.add('playing');
        }
    }
    
    
    // ===== COPY/PASTE METHODS =====
    
    // Toggle copy mode
    toggleCopyMode(instrument) {
        if (this.copyMode && this.sourceGroupIndex !== null) {
            // Already in copy mode - finalize selection
            this.finalizeCopy(instrument);
        } else {
            // Enter copy mode
            this.copyMode = true;
            this.pasteMode = false;
            this.sourceGroupIndex = this.currentGroupIndex;
            this.copiedCells = [];
            this.showNotification('Copy mode: Click cells to select, then click Copy again', 'info');
        }
        this.updateCopyPasteUI();
    }
    
    // Toggle paste mode
    togglePasteMode(instrument) {
        if (this.copyMode) {
            // If in copy mode, cancel it
            this.cancelCopy();
        }
        
        if (this.pasteMode) {
            // Already in paste mode - exit
            this.pasteMode = false;
            this.showNotification('Paste mode cancelled', 'info');
        } else {
            // Enter paste mode
            if (this.copiedCells.length === 0) {
                this.showNotification('No cells copied! Use Copy first', 'warning');
                return;
            }
            this.pasteMode = true;
            this.showNotification('Paste mode: Click target position to paste', 'info');
        }
        this.updateCopyPasteUI();
    }
    
    // Toggle cell selection in copy mode
    toggleCellSelection(row, col, instrument) {
        if (!this.copyMode) return;
        
        const existingIndex = this.copiedCells.findIndex(cell => cell.row === row && cell.col === col);
        if (existingIndex >= 0) {
            this.copiedCells.splice(existingIndex, 1);
        } else {
            this.copiedCells.push({ row, col });
        }
        
        // Visual feedback handled by cell click handler
        this.updateCopyPasteUI();
    }
    
    // Finalize copy operation
    finalizeCopy(instrument) {
        if (this.copiedCells.length === 0) {
            this.showNotification('No cells selected!', 'warning');
            this.cancelCopy();
            return;
        }
        
        this.copyMode = false;
        const sourceName = this.getStepGroupDefinitions()[this.sourceGroupIndex].name;
        this.showNotification(`Copied ${this.copiedCells.length} cells from ${sourceName}`, 'success');
        
        // Auto-enter paste mode
        this.pasteMode = true;
        this.showNotification('Click target position to paste', 'info');
    }
    
    // Cancel copy operation
    cancelCopy() {
        this.copyMode = false;
        this.pasteMode = false;
        this.copiedCells = [];
        this.sourceGroupIndex = null;
        this.updateCopyPasteUI();
    }
    
    // Paste cells at target position
    pasteCells(targetRow, targetCol, instrument) {
        if (!this.pasteMode || this.copiedCells.length === 0) return;
        
        const targetGroup = this.patternGroups[instrument][this.currentGroupIndex];
        
        // Calculate offset from first copied cell
        const minRow = Math.min(...this.copiedCells.map(c => c.row));
        const minCol = Math.min(...this.copiedCells.map(c => c.col));
        
        // Paste each cell with relative offset
        this.copiedCells.forEach(cell => {
            const newRow = targetRow + (cell.row - minRow);
            const newCol = targetCol + (cell.col - minCol);
            
            // Ensure within bounds
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < this.patternLength) {
                targetGroup.set(newCol, newRow);
            }
        });
        
        const targetName = this.getStepGroupDefinitions()[this.currentGroupIndex].name;
        this.showNotification(`Pasted ${this.copiedCells.length} cells to ${targetName}`, 'success');
        
        // Exit paste mode
        this.pasteMode = false;
        this.updateCopyPasteUI();
        
        // Rebuild grids
        this.rebuildGrids();
    }
    
    // Check if cell is selected for copy
    isCellSelected(row, col) {
        return this.copiedCells.some(cell => cell.row === row && cell.col === col);
    }
    
    // Update UI states for copy/paste
    updateCopyPasteUI() {
        // Update copy/paste button states
        document.querySelectorAll('.copy-paste-container').forEach(container => {
            const buttons = container.querySelectorAll('.cp-btn');
            buttons.forEach(btn => {
                btn.classList.remove('active');
            });
            
            if (this.copyMode) {
                container.querySelector('.copy-btn')?.classList.add('active');
            }
            if (this.pasteMode) {
                container.querySelector('.paste-btn')?.classList.add('active');
            }
        });
        
        // Update cell selection states
        document.querySelectorAll('.grid-cell').forEach(cell => {
            cell.classList.remove('copy-selected');
        });
        
        this.copiedCells.forEach(({row, col}) => {
            const cellEl = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
            if (cellEl) cellEl.classList.add('copy-selected');
        });
    }
    
    // ===== END COPY/PASTE METHODS =====
    
    initAudio() {
        return Tone.start().then(() => {
            // Set up audio context with better quality
            this.audioEngine = new SimpleAudioEngine();
            
            // Master compressor for better dynamic range
            this.compressor = new Tone.Compressor({
                threshold: -24,
                ratio: 4,
                attack: 0.003,
                release: 0.25
            }).toDestination();
            
            // High quality effects chain with all additional effects
            this.effects = {
                // Original effects
                chorus: new Tone.Chorus({
                    frequency: 4,
                    delayTime: 2.5,
                    depth: 0.5,
                    wet: 0.3,
                    type: 'sine'
                }).start(),
                echo: new Tone.FeedbackDelay({ 
                    delayTime: '8n', 
                    feedback: 0.3, 
                    wet: 0.2 
                }),
                reverb: new Tone.Reverb({ 
                    decay: 2, 
                    wet: 0.3
                }),
                // New additional effects from pixelMusic
                lowpass: new Tone.Filter({
                    frequency: 20000,
                    type: 'lowpass',
                    rolloff: -12,
                    Q: 1
                }),
                highpass: new Tone.Filter({
                    frequency: 20,
                    type: 'highpass',
                    rolloff: -12,
                    Q: 1
                }),
                distortion: new Tone.Distortion({
                    distortion: 0,
                    wet: 0
                }),
                bitcrush: new Tone.BitCrusher({
                    bits: 16,
                    wet: 0
                }),
                tremolo: new Tone.Tremolo({
                    frequency: 10,
                    depth: 0,
                    wet: 0
                }).start(),
                vibrato: new Tone.Vibrato({
                    frequency: 5,
                    depth: 0,
                    wet: 0
                })
            };
            
            // Connect effects chain: filters -> modulation -> time -> reverb -> compressor
            // Order: LowPass -> HighPass -> Distortion -> Bitcrush -> Tremolo -> Vibrato -> Chorus -> Echo -> Reverb -> Compressor
            this.effects.lowpass.connect(this.effects.highpass);
            this.effects.highpass.connect(this.effects.distortion);
            this.effects.distortion.connect(this.effects.bitcrush);
            this.effects.bitcrush.connect(this.effects.tremolo);
            this.effects.tremolo.connect(this.effects.vibrato);
            this.effects.vibrato.connect(this.effects.chorus);
            this.effects.chorus.connect(this.effects.echo);
            this.effects.echo.connect(this.effects.reverb);
            this.effects.reverb.connect(this.compressor);
            
            // Create panners for stereo positioning
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
            
            // Initialize harmonic instrument
            this.createHarmonicSynth();
            
            // Initialize melody instrument
            this.createMelodySynth();
            
            // Initialize bass synth
            this.createBassSynth();
            
            // Initialize lead synth
            this.createLeadSynth();
            
            // Initialize drum kit
            this.createDrumKit();
            
            // Initialize percussion kit
            this.createPercussionKit();
            
            console.log('Audio engine initialized with all effects!');
        });
    }
    
    createHarmonicSynth() {
        switch(this.currentHarmonicInstrument) {
            case 'fm':
                this.polySynth = new Tone.PolySynth(Tone.FMSynth, {
                    harmonicity: 3,
                    modulationIndex: 10,
                    oscillator: { type: 'sine' },
                    envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 1.5 },
                    modulation: { type: 'square' },
                    modulationEnvelope: { attack: 0.5, decay: 0, sustain: 1, release: 0.5 }
                });
                break;
            case 'piano':
                this.polySynth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: 'triangle' },
                    envelope: { attack: 0.005, decay: 0.5, sustain: 0.3, release: 1.5 }
                });
                break;
            case 'pad':
                this.polySynth = new Tone.PolySynth(Tone.AMSynth, {
                    oscillator: { type: 'sine' },
                    envelope: { attack: 0.5, decay: 0.5, sustain: 0.8, release: 2 },
                    modulation: { type: 'sine' },
                    modulationEnvelope: { attack: 0.5, decay: 0.5, sustain: 0.8, release: 2 }
                });
                break;
            case 'bell':
                this.polySynth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: 'sine' },
                    envelope: { attack: 0.001, decay: 0.8, sustain: 0, release: 0.3 }
                });
                break;
            case 'pluck':
                this.polySynth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: 'triangle' },
                    envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 }
                });
                break;
            default:
                this.polySynth = new Tone.PolySynth(Tone.FMSynth, {
                    harmonicity: 3,
                    modulationIndex: 10,
                    oscillator: { type: 'sine' },
                    envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 1.5 }
                });
        }
        
        // Connect to effects chain through panner
        this.polySynth.connect(this.harmonyPanner);
        this.polySynth.volume.value = -6;
    }
    
    createMelodySynth() {
        switch(this.currentMelodyInstrument) {
            case 'saw':
                this.melodySynth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: 'fatsawtooth', count: 3, spread: 30 },
                    envelope: { attack: 0.02, decay: 0.1, sustain: 0.4, release: 0.8 }
                });
                break;
            case 'square':
                this.melodySynth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: 'fatsquare', count: 2, spread: 10 },
                    envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.5 }
                });
                break;
            case 'sine':
                this.melodySynth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: 'fatsine', count: 2, spread: 20 },
                    envelope: { attack: 0.02, decay: 0.2, sustain: 0.5, release: 1 }
                });
                break;
            case 'triangle':
                this.melodySynth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: 'fattriangle', count: 2, spread: 15 },
                    envelope: { attack: 0.02, decay: 0.15, sustain: 0.4, release: 0.6 }
                });
                break;
            default:
                this.melodySynth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: 'fatsawtooth', count: 3, spread: 30 },
                    envelope: { attack: 0.02, decay: 0.1, sustain: 0.4, release: 0.8 }
                });
        }
        
        // Connect to effects chain through panner
        this.melodySynth.connect(this.melodyPanner);
        this.melodySynth.volume.value = -4;
    }
    
    createBassSynth() {
        switch(this.currentBassInstrument) {
            case 'sub':
                this.bassSynth = new Tone.MonoSynth({
                    oscillator: { type: 'sine' },
                    envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.5 },
                    filterEnvelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.5, baseFrequency: 200, octaves: 2 }
                });
                break;
            case 'synth':
                this.bassSynth = new Tone.MonoSynth({
                    oscillator: { type: 'sawtooth' },
                    envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.4 },
                    filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.4, baseFrequency: 300, octaves: 3 }
                });
                break;
            case 'fm':
                this.bassSynth = new Tone.FMSynth({
                    harmonicity: 3,
                    modulationIndex: 10,
                    oscillator: { type: 'sine' },
                    envelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.8 }
                });
                break;
            case 'square':
                this.bassSynth = new Tone.MonoSynth({
                    oscillator: { type: 'square' },
                    envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.3 }
                });
                break;
            default:
                this.bassSynth = new Tone.MonoSynth({
                    oscillator: { type: 'sine' },
                    envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.5 }
                });
        }
        
        // Connect to effects chain through panner
        this.bassSynth.connect(this.bassPanner);
        this.bassSynth.volume.value = -2;
    }
    
    createLeadSynth() {
        switch(this.currentLeadInstrument) {
            case 'saw':
                this.leadSynth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: 'fatsawtooth', count: 3, spread: 30 },
                    envelope: { attack: 0.02, decay: 0.1, sustain: 0.4, release: 0.8 }
                });
                break;
            case 'square':
                this.leadSynth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: 'fatsquare', count: 2, spread: 10 },
                    envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.5 }
                });
                break;
            case 'sine':
                this.leadSynth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: 'fatsine', count: 2, spread: 20 },
                    envelope: { attack: 0.02, decay: 0.2, sustain: 0.5, release: 1 }
                });
                break;
            case 'triangle':
                this.leadSynth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: 'fattriangle', count: 2, spread: 15 },
                    envelope: { attack: 0.02, decay: 0.15, sustain: 0.4, release: 0.6 }
                });
                break;
            case 'pulse':
                this.leadSynth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: 'pulse', width: 0.2 },
                    envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.4 }
                });
                break;
            case 'supersaw':
                this.leadSynth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: 'fatsawtooth', count: 5, spread: 20 },
                    envelope: { attack: 0.03, decay: 0.2, sustain: 0.4, release: 0.6 }
                });
                break;
            default:
                this.leadSynth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: 'fatsawtooth', count: 3, spread: 30 },
                    envelope: { attack: 0.02, decay: 0.1, sustain: 0.4, release: 0.8 }
                });
        }
        
        // Connect to effects chain through panner
        this.leadSynth.connect(this.leadPanner);
        this.leadSynth.volume.value = -3;
    }
    
    createPercussionKit() {
        const kit = this.currentPercussionKit;
        const config = this.percussionKits[kit];
        
        this.percussion = {};
        
        Object.keys(config).forEach(inst => {
            const instConfig = config[inst];
            if (instConfig.synth) {
                this.percussion[inst] = new instConfig.synth(instConfig.opts);
            }
        });
        
        // Connect percussion to effects chain through panners
        Object.keys(this.percussion).forEach(inst => {
            if (this.percussionPanners[inst]) {
                this.percussion[inst].connect(this.percussionPanners[inst]);
            }
        });
        
        // Set percussion volumes
        if (this.percussion.conga) this.percussion.conga.volume.value = -8;
        if (this.percussion.bongo) this.percussion.bongo.volume.value = -10;
        if (this.percussion.shaker) this.percussion.shaker.volume.value = -12;
        if (this.percussion.cymbal) this.percussion.cymbal.volume.value = -10;
    }
    
    createDrumKit() {
        switch(this.currentDrumKit) {
            case 'electronic':
                this.drums = {
                    kick: new Tone.MembraneSynth({
                        pitchDecay: 0.02, octaves: 10, oscillator: { type: 'sine' },
                        envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.3 }
                    }),
                    snare: new Tone.NoiseSynth({
                        noise: { type: 'pink' },
                        envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 }
                    }),
                    hihat: new Tone.MetalSynth({
                        frequency: 800, envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
                        harmonicity: 3, modulationIndex: 10, resonance: 8000, octaves: 1.5
                    }),
                    tom: new Tone.MembraneSynth({
                        pitchDecay: 0.03, octaves: 8, oscillator: { type: 'sine' },
                        envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 }
                    })
                };
                break;
            case '808':
                this.drums = {
                    kick: new Tone.MembraneSynth({
                        pitchDecay: 0.008, octaves: 12, oscillator: { type: 'sine' },
                        envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.25 }
                    }),
                    snare: new Tone.NoiseSynth({
                        noise: { type: 'white' },
                        envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 }
                    }),
                    hihat: new Tone.MetalSynth({
                        frequency: 1000, envelope: { attack: 0.001, decay: 0.03, release: 0.01 },
                        harmonicity: 2, modulationIndex: 5, resonance: 10000, octaves: 1
                    }),
                    tom: new Tone.MembraneSynth({
                        pitchDecay: 0.01, octaves: 10, oscillator: { type: 'sine' },
                        envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 }
                    })
                };
                break;
            default: // acoustic
                this.drums = {
                    kick: new Tone.MembraneSynth({
                        pitchDecay: 0.05, octaves: 8, oscillator: { type: 'sine' },
                        envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1 }
                    }),
                    snare: new Tone.NoiseSynth({
                        noise: { type: 'white' },
                        envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.15 }
                    }),
                    hihat: new Tone.MetalSynth({
                        frequency: 200, envelope: { attack: 0.001, decay: 0.08, release: 0.01 },
                        harmonicity: 5.1, modulationIndex: 32, resonance: 5000, octaves: 2
                    }),
                    tom: new Tone.MembraneSynth({
                        pitchDecay: 0.06, octaves: 5, oscillator: { type: 'sine' },
                        envelope: { attack: 0.01, decay: 0.25, sustain: 0.01, release: 0.25 }
                    })
                };
        }
        
        // Connect drums to effects chain through panners
        Object.keys(this.drums).forEach(inst => {
            if (this.drumPanners[inst]) {
                this.drums[inst].connect(this.drumPanners[inst]);
            }
        });
        
        // Set drum volumes
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
        
        // Stop playback if playing
        if (this.isPlaying) this.stop();
        
        // Clear current pattern data beyond new length
        this.patternLength = length;
        
        // Initialize pattern groups based on new length
        this.initializePatternGroups();
        
        // Rebuild grids
        this.rebuildGrids();
        
        // Rebuild step timeline for new pattern length
        this.createStepTimeline();
        
        // Rebuild section timelines for new pattern length
        this.createSectionTimelines();
        
        // Update UI
        this.updatePatternLengthUI();
        
        // Rebuild step groups accordion
        this.createStepGroupsAccordion();
        
        this.showNotification(`Pattern length: ${length} steps`, 'success');
    }
    
    initializePatternGroups() {
        // Initialize pattern groups based on pattern length
        const groupCount = this.patternLength / 16; // 1, 2, or 4 groups
        
        // Reinitialize only if needed
        for (let i = 0; i < groupCount; i++) {
            if (!this.patternGroups.harmonics[i]) {
                this.patternGroups.harmonics[i] = new Set();
            }
            if (!this.patternGroups.melody[i]) {
                this.patternGroups.melody[i] = new Map();
            }
            if (!this.patternGroups.bass[i]) {
                this.patternGroups.bass[i] = new Map();
            }
            if (!this.patternGroups.lead[i]) {
                this.patternGroups.lead[i] = new Map();
            }
            if (!this.patternGroups.rhythm[i]) {
                this.patternGroups.rhythm[i] = { 
                    kick: new Set(), 
                    snare: new Set(), 
                    hihat: new Set(), 
                    tom: new Set(),
                    conga: new Set(),
                    bongo: new Set(),
                    shaker: new Set(),
                    cymbal: new Set()
                };
            }
        }
        
        // Ensure current group is valid
        if (this.currentGroupIndex >= groupCount) {
            this.currentGroupIndex = 0;
        }
        
        // Sync active references to current group
        this.harmonics = this.patternGroups.harmonics[this.currentGroupIndex];
        this.melodyRows = this.patternGroups.melody[this.currentGroupIndex];
        this.bassRows = this.patternGroups.bass[this.currentGroupIndex];
        this.leadRows = this.patternGroups.lead[this.currentGroupIndex];
        this.rhythm = this.patternGroups.rhythm[this.currentGroupIndex];
    }
    
    // Load a specific pattern group into the active grid
    loadPatternGroup(groupIndex) {
        const groupCount = this.patternLength / 16;
        if (groupIndex < 0 || groupIndex >= groupCount) return;
        
        // Update current group index
        this.currentGroupIndex = groupIndex;
        
        // Sync active references to new group
        this.harmonics = this.patternGroups.harmonics[groupIndex];
        this.melodyRows = this.patternGroups.melody[groupIndex];
        this.bassRows = this.patternGroups.bass[groupIndex];
        this.leadRows = this.patternGroups.lead[groupIndex];
        this.rhythm = this.patternGroups.rhythm[groupIndex];
        
        // Rebuild grids with new data
        this.rebuildGrids();
        
        // Rebuild section timelines for new pattern length
        this.createSectionTimelines();
        
        // Update accordion activity and visual states
        this.updateAccordionActivity();
        
        // Show notification
        const stepGroups = this.getStepGroupDefinitions();
        this.showNotification(`Loaded: ${stepGroups[groupIndex].name}`, 'info');
    }
    
    // Save current group data
    saveCurrentGroup() {
        // Current references are already pointing to the correct group
        // This method exists for explicit save operations if needed
    }
    
    rebuildGrids() {
        // Clear and rebuild melody grid
        const melodyGrid = document.getElementById('stringsGrid');
        melodyGrid.innerHTML = '';
        this.createMelodyGrid();
        
        // Clear and rebuild bass grid
        const bassGrid = document.getElementById('bassGrid');
        if (bassGrid) {
            bassGrid.innerHTML = '';
            this.createBassGrid();
        }
        
        // Clear and rebuild lead grid
        const leadGrid = document.getElementById('leadGrid');
        if (leadGrid) {
            leadGrid.innerHTML = '';
            this.createLeadGrid();
        }
        
        // Clear and rebuild rhythm grid
        const rhythmGrid = document.getElementById('rhythmGrid');
        rhythmGrid.innerHTML = '';
        this.createRhythmGrid();
        
        // Restore active cells
        this.melodyRows.forEach((row, col) => {
            const cell = document.querySelector(`.string-cell[data-col="${col}"][data-row="${row}"]`);
            if (cell) cell.classList.add('active');
        });
        
        // Restore bass cells
        this.bassRows.forEach((row, col) => {
            const cell = document.querySelector(`.bass-cell[data-col="${col}"][data-row="${row}"][data-group-index="${this.currentGroupIndex}"]`);
            if (cell) cell.classList.add('active');
        });
        
        // Restore lead cells
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
        
        // Rebuild percussion grid
        const percussionGrid = document.getElementById('percussionGrid');
        if (percussionGrid) {
            percussionGrid.innerHTML = '';
            this.createPercussionGrid();
            
            // Restore percussion cells
            ['conga', 'bongo', 'shaker', 'cymbal'].forEach(inst => {
                this.rhythm[inst].forEach(step => {
                    const cell = document.querySelector(`.rhythm-cell[data-instrument="${inst}"][data-step="${step}"]`);
                    if (cell) cell.classList.add('active');
                });
            });
        }
        
        // Update step timeline
        this.updateTimelineState();
    }
    
    updatePatternLengthUI() {
        // Update pattern length indicator if it exists
        const indicator = document.getElementById('patternLengthValue');
        if (indicator) {
            indicator.textContent = `${this.patternLength} steps`;
        }
        
        // Update button states
        document.querySelectorAll('[data-pattern-length]').forEach(btn => {
            const length = parseInt(btn.dataset.patternLength);
            btn.classList.toggle('active', length === this.patternLength);
        });
    }
    
    createHarmonicsGrid() {
        const grid = document.getElementById('harmonicsGrid');
        this.harmonicNotes.forEach((note, index) => {
            const cell = document.createElement('div');
            cell.className = 'harmonic-cell';
            cell.innerHTML = `<span>${note}</span>`;
            cell.onclick = () => this.toggleHarmonic(index, cell);
            grid.appendChild(cell);
        });
    }
    
    createMelodyGrid() {
        const grid = document.getElementById('stringsGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        const groupCount = this.patternLength / 16;
        
        // Create a container for all groups
        grid.className = 'strings-grid';
        
        for (let g = 0; g < groupCount; g++) {
            const groupRow = document.createElement('div');
            groupRow.className = `melody-group-row${g === this.currentGroupIndex ? ' active' : ''}`;
            groupRow.dataset.groupIndex = g;
            
            // Group header with controls
            const groupHeader = document.createElement('div');
            groupHeader.className = 'melody-group-header';
            
            // Group label
            const groupLabel = document.createElement('div');
            groupLabel.className = 'melody-group-label';
            const stepGroups = this.getStepGroupDefinitions();
            groupLabel.innerHTML = `<span>${stepGroups[g].name}</span>`;
            groupHeader.appendChild(groupLabel);
            
            // Copy/Paste buttons
            const cpContainer = document.createElement('div');
            cpContainer.className = 'copy-paste-container';
            cpContainer.innerHTML = `
                <button class="cp-btn copy-btn" onclick="app.toggleCopyMode('melody')" title="Copy cells">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="cp-btn paste-btn" onclick="app.togglePasteMode('melody')" title="Paste cells">
                    <i class="fas fa-paste"></i>
                </button>
            `;
            groupHeader.appendChild(cpContainer);
            
            // Vertical Loop Controls Accordion
            const controlsContainer = document.createElement('div');
            controlsContainer.className = 'loop-controls-accordion';
            controlsContainer.innerHTML = `
                <div class="loop-control-vertical">
                    <span class="loop-control-label-v" title="Velocity"><i class="fas fa-volume-up"></i></span>
                    <input type="range" class="loop-velocity-slider-v" data-group="${g}" min="0" max="100" value="80" orient="vertical">
                    <span class="loop-control-value-v" id="loop${g}VelocityValue">80</span>
                </div>
                <div class="loop-control-vertical">
                    <span class="loop-control-label-v" title="Filter"><i class="fas fa-filter"></i></span>
                    <input type="range" class="loop-filter-slider-v" data-group="${g}" min="0" max="100" value="50" orient="vertical">
                    <span class="loop-control-value-v" id="loop${g}FilterValue">50</span>
                </div>
                <div class="loop-control-vertical">
                    <span class="loop-control-label-v" title="Pan"><i class="fas fa-arrows-alt-h"></i></span>
                    <input type="range" class="loop-pan-slider-v" data-group="${g}" min="-100" max="100" value="0" orient="vertical">
                    <span class="loop-control-value-v" id="loop${g}PanValue">0</span>
                </div>
            `;
            groupHeader.appendChild(controlsContainer);
            groupRow.appendChild(groupHeader);
            
            // 16-step columns for this group
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
                    
                    // Check if this cell has activity
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
        
        // Add event listeners for loop controls
        this.addLoopControlListeners();
        
        // Update visibility based on settings
        this.updateMainLoopControlsVisibility();
    }
    
    // Add event listeners for Main Loop controls (Melody, Bass, Lead)
    addLoopControlListeners() {
        // Melody velocity slider
        document.querySelectorAll('.loop-velocity-slider-v').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const group = parseInt(e.target.dataset.group);
                const value = parseInt(e.target.value);
                document.getElementById(`loop${group}VelocityValue`).textContent = value;
                // Update velocity without notification
                const startStep = group * 16;
                const endStep = Math.min(startStep + 16, this.patternLength);
                for (let step = startStep; step < endStep; step++) {
                    this.melodyVelocity.set(step, value / 100);
                }
            });
        });
        
        // Melody filter slider
        document.querySelectorAll('.loop-filter-slider-v').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const group = parseInt(e.target.dataset.group);
                const value = parseInt(e.target.value);
                document.getElementById(`loop${group}FilterValue`).textContent = value;
                // Update filter without notification
                const startStep = group * 16;
                const endStep = Math.min(startStep + 16, this.patternLength);
                for (let step = startStep; step < endStep; step++) {
                    this.effectAutomation.lowpass.set(step, value);
                }
            });
        });
        
        // Melody pan slider
        document.querySelectorAll('.loop-pan-slider-v').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const group = parseInt(e.target.dataset.group);
                const value = parseInt(e.target.value);
                document.getElementById(`loop${group}PanValue`).textContent = value;
                // Update pan without notification
                if (!this.groupPanValues) {
                    this.groupPanValues = [0, 0, 0, 0];
                }
                this.groupPanValues[group] = value / 100;
                if (this.harmonyPanner) this.harmonyPanner.pan.value = value / 100;
                if (this.melodyPanner) this.melodyPanner.pan.value = value / 100;
                if (this.bassPanner) this.bassPanner.pan.value = value / 100;
                if (this.leadPanner) this.leadPanner.pan.value = value / 100;
            });
        });
        
        // Bass velocity slider
        document.querySelectorAll('.loop-bass-velocity-slider-v').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const group = parseInt(e.target.dataset.group);
                const value = parseInt(e.target.value);
                document.getElementById(`bassLoop${group}VelocityValue`).textContent = value;
                // Update bass velocity without notification
                const startStep = group * 16;
                const endStep = Math.min(startStep + 16, this.patternLength);
                for (let step = startStep; step < endStep; step++) {
                    this.bassVelocity.set(step, value / 100);
                }
            });
        });
        
        // Bass filter slider
        document.querySelectorAll('.loop-bass-filter-slider-v').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const group = parseInt(e.target.dataset.group);
                const value = parseInt(e.target.value);
                document.getElementById(`bassLoop${group}FilterValue`).textContent = value;
                // Update filter without notification (shared across instruments)
                const startStep = group * 16;
                const endStep = Math.min(startStep + 16, this.patternLength);
                for (let step = startStep; step < endStep; step++) {
                    this.effectAutomation.lowpass.set(step, value);
                }
            });
        });
        
        // Bass pan slider
        document.querySelectorAll('.loop-bass-pan-slider-v').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const group = parseInt(e.target.dataset.group);
                const value = parseInt(e.target.value);
                document.getElementById(`bassLoop${group}PanValue`).textContent = value;
                // Update bass pan without notification
                if (!this.groupPanValues) {
                    this.groupPanValues = [0, 0, 0, 0];
                }
                this.groupPanValues[group] = value / 100;
                if (this.bassPanner) this.bassPanner.pan.value = value / 100;
            });
        });
        
        // Lead velocity slider
        document.querySelectorAll('.loop-lead-velocity-slider-v').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const group = parseInt(e.target.dataset.group);
                const value = parseInt(e.target.value);
                document.getElementById(`leadLoop${group}VelocityValue`).textContent = value;
                // Update lead velocity without notification
                const startStep = group * 16;
                const endStep = Math.min(startStep + 16, this.patternLength);
                for (let step = startStep; step < endStep; step++) {
                    this.leadVelocity.set(step, value / 100);
                }
            });
        });
        
        // Lead filter slider
        document.querySelectorAll('.loop-lead-filter-slider-v').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const group = parseInt(e.target.dataset.group);
                const value = parseInt(e.target.value);
                document.getElementById(`leadLoop${group}FilterValue`).textContent = value;
                // Update filter without notification (shared across instruments)
                const startStep = group * 16;
                const endStep = Math.min(startStep + 16, this.patternLength);
                for (let step = startStep; step < endStep; step++) {
                    this.effectAutomation.lowpass.set(step, value);
                }
            });
        });
        
        // Lead pan slider
        document.querySelectorAll('.loop-lead-pan-slider-v').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const group = parseInt(e.target.dataset.group);
                const value = parseInt(e.target.value);
                document.getElementById(`leadLoop${group}PanValue`).textContent = value;
                // Update lead pan without notification
                if (!this.groupPanValues) {
                    this.groupPanValues = [0, 0, 0, 0];
                }
                this.groupPanValues[group] = value / 100;
                if (this.leadPanner) this.leadPanner.pan.value = value / 100;
            });
        });
    }
    
    // Update Main Loop controls visibility based on settings
    updateMainLoopControlsVisibility() {
        const showControls = document.getElementById('mainLoopControlsToggle')?.checked ?? true;
        document.querySelectorAll('.loop-controls-accordion').forEach(el => {
            if (showControls) {
                el.classList.add('visible');
            } else {
                el.classList.remove('visible');
            }
        });
    }
    
    createBassGrid() {
        const grid = document.getElementById('bassGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        const groupCount = this.patternLength / 16;
        const rowCount = 8; // 8 bass note rows
        
        for (let g = 0; g < groupCount; g++) {
            const groupRow = document.createElement('div');
            groupRow.className = `bass-group-row${g === this.currentGroupIndex ? ' active' : ''}`;
            groupRow.dataset.groupIndex = g;
            
            // Group header with controls
            const groupHeader = document.createElement('div');
            groupHeader.className = 'bass-group-header';
            
            // Group label
            const groupLabel = document.createElement('div');
            groupLabel.className = 'bass-group-label';
            const stepGroups = this.getStepGroupDefinitions();
            groupLabel.innerHTML = `<span>${stepGroups[g].name}</span>`;
            groupHeader.appendChild(groupLabel);
            
            // Copy/Paste buttons
            const cpContainer = document.createElement('div');
            cpContainer.className = 'copy-paste-container';
            cpContainer.innerHTML = `
                <button class="cp-btn copy-btn" onclick="app.toggleCopyMode('bass')" title="Copy cells">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="cp-btn paste-btn" onclick="app.togglePasteMode('bass')" title="Paste cells">
                    <i class="fas fa-paste"></i>
                </button>
            `;
            groupHeader.appendChild(cpContainer);
            
            // Vertical Loop Controls Accordion
            const controlsContainer = document.createElement('div');
            controlsContainer.className = 'loop-controls-accordion';
            controlsContainer.innerHTML = `
                <div class="loop-control-vertical">
                    <span class="loop-control-label-v" title="Velocity"><i class="fas fa-volume-up"></i></span>
                    <input type="range" class="loop-bass-velocity-slider-v" data-group="${g}" min="0" max="100" value="80" orient="vertical">
                    <span class="loop-control-value-v" id="bassLoop${g}VelocityValue">80</span>
                </div>
                <div class="loop-control-vertical">
                    <span class="loop-control-label-v" title="Filter"><i class="fas fa-filter"></i></span>
                    <input type="range" class="loop-bass-filter-slider-v" data-group="${g}" min="0" max="100" value="50" orient="vertical">
                    <span class="loop-control-value-v" id="bassLoop${g}FilterValue">50</span>
                </div>
                <div class="loop-control-vertical">
                    <span class="loop-control-label-v" title="Pan"><i class="fas fa-arrows-alt-h"></i></span>
                    <input type="range" class="loop-bass-pan-slider-v" data-group="${g}" min="-100" max="100" value="0" orient="vertical">
                    <span class="loop-control-value-v" id="bassLoop${g}PanValue">0</span>
                </div>
            `;
            groupHeader.appendChild(controlsContainer);
            groupRow.appendChild(groupHeader);
            
            // Create wrapper for columns
            const columnsWrapper = document.createElement('div');
            columnsWrapper.className = 'bass-columns-wrapper';
            columnsWrapper.style.display = 'flex';
            columnsWrapper.style.flex = '1';
            columnsWrapper.style.minWidth = '0';
            
            // 16 columns (one per step), each with 8 rows (bass notes)
            for (let col = 0; col < 16; col++) {
                const column = document.createElement('div');
                column.className = 'bass-column';
                column.dataset.col = col;
                column.dataset.groupIndex = g;
                column.style.display = 'flex';
                column.style.flexDirection = 'column';
                column.style.flex = '1';
                column.style.minWidth = '0';
                
                // Find the active row for this column in this group
                let activeRow = -1;
                if (this.patternGroups.bass[g]?.has(col)) {
                    activeRow = this.patternGroups.bass[g].get(col);
                }
                
                // Create 8 cells for this column (one per bass note row)
                for (let row = 0; row < rowCount; row++) {
                    const cell = document.createElement('div');
                    cell.className = 'bass-cell';
                    cell.dataset.col = col;
                    cell.dataset.row = row;
                    cell.dataset.groupIndex = g;
                    
                    if (row === activeRow) {
                        cell.classList.add('active');
                        if (row < this.bassNotes.length) {
                            cell.title = this.bassNotes[row];
                        }
                    }
                    
                    cell.onclick = () => this.toggleBass(g, col, row, cell);
                    column.appendChild(cell);
                }
                
                columnsWrapper.appendChild(column);
            }
            
            groupRow.appendChild(columnsWrapper);
            grid.appendChild(groupRow);
        }
        
        // Update visibility based on settings
        this.updateMainLoopControlsVisibility();
    }
    
    createLeadGrid() {
        const grid = document.getElementById('leadGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        const groupCount = this.patternLength / 16;
        const rowCount = 8; // 8 lead note rows
        
        for (let g = 0; g < groupCount; g++) {
            const groupRow = document.createElement('div');
            groupRow.className = `lead-group-row${g === this.currentGroupIndex ? ' active' : ''}`;
            groupRow.dataset.groupIndex = g;
            
            // Group header with controls
            const groupHeader = document.createElement('div');
            groupHeader.className = 'lead-group-header';
            
            // Group label
            const groupLabel = document.createElement('div');
            groupLabel.className = 'lead-group-label';
            const stepGroups = this.getStepGroupDefinitions();
            groupLabel.innerHTML = `<span>${stepGroups[g].name}</span>`;
            groupHeader.appendChild(groupLabel);
            
            // Copy/Paste buttons
            const cpContainer = document.createElement('div');
            cpContainer.className = 'copy-paste-container';
            cpContainer.innerHTML = `
                <button class="cp-btn copy-btn" onclick="app.toggleCopyMode('lead')" title="Copy cells">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="cp-btn paste-btn" onclick="app.togglePasteMode('lead')" title="Paste cells">
                    <i class="fas fa-paste"></i>
                </button>
            `;
            groupHeader.appendChild(cpContainer);
            
            // Vertical Loop Controls Accordion
            const controlsContainer = document.createElement('div');
            controlsContainer.className = 'loop-controls-accordion';
            controlsContainer.innerHTML = `
                <div class="loop-control-vertical">
                    <span class="loop-control-label-v" title="Velocity"><i class="fas fa-volume-up"></i></span>
                    <input type="range" class="loop-lead-velocity-slider-v" data-group="${g}" min="0" max="100" value="80" orient="vertical">
                    <span class="loop-control-value-v" id="leadLoop${g}VelocityValue">80</span>
                </div>
                <div class="loop-control-vertical">
                    <span class="loop-control-label-v" title="Filter"><i class="fas fa-filter"></i></span>
                    <input type="range" class="loop-lead-filter-slider-v" data-group="${g}" min="0" max="100" value="50" orient="vertical">
                    <span class="loop-control-value-v" id="leadLoop${g}FilterValue">50</span>
                </div>
                <div class="loop-control-vertical">
                    <span class="loop-control-label-v" title="Pan"><i class="fas fa-arrows-alt-h"></i></span>
                    <input type="range" class="loop-lead-pan-slider-v" data-group="${g}" min="-100" max="100" value="0" orient="vertical">
                    <span class="loop-control-value-v" id="leadLoop${g}PanValue">0</span>
                </div>
            `;
            groupHeader.appendChild(controlsContainer);
            groupRow.appendChild(groupHeader);
            
            // Create wrapper for columns
            const columnsWrapper = document.createElement('div');
            columnsWrapper.className = 'lead-columns-wrapper';
            columnsWrapper.style.display = 'flex';
            columnsWrapper.style.flex = '1';
            columnsWrapper.style.minWidth = '0';
            
            // 16 columns (one per step), each with 8 rows (scale notes)
            for (let col = 0; col < 16; col++) {
                const column = document.createElement('div');
                column.className = 'lead-column';
                column.dataset.col = col;
                column.dataset.groupIndex = g;
                column.style.display = 'flex';
                column.style.flexDirection = 'column';
                column.style.flex = '1';
                column.style.minWidth = '0';
                
                // Find the active row for this column in this group
                let activeRow = -1;
                if (this.patternGroups.lead[g]?.has(col)) {
                    activeRow = this.patternGroups.lead[g].get(col);
                }
                
                // Create 8 cells for this column (one per scale note row)
                for (let row = 0; row < rowCount; row++) {
                    const cell = document.createElement('div');
                    cell.className = 'lead-cell';
                    cell.dataset.col = col;
                    cell.dataset.row = row;
                    cell.dataset.groupIndex = g;
                    
                    if (row === activeRow) {
                        cell.classList.add('active');
                    }
                    
                    cell.onclick = () => this.toggleLead(g, col, row, cell);
                    column.appendChild(cell);
                }
                
                columnsWrapper.appendChild(column);
            }
            
            groupRow.appendChild(columnsWrapper);
            grid.appendChild(groupRow);
        }
        
        // Update visibility based on settings
        this.updateMainLoopControlsVisibility();
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
                
                // Group label
                const label = document.createElement('div');
                label.className = 'rhythm-group-label';
                const stepGroups = this.getStepGroupDefinitions();
                label.innerHTML = `${g === 0 ? labels[instIdx] : ''}<span>${stepGroups[g].name}</span>`;
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
                
                // Group label
                const label = document.createElement('div');
                label.className = 'rhythm-group-label';
                const stepGroups = this.getStepGroupDefinitions();
                label.innerHTML = `${g === 0 ? labels[instIdx] : ''}<span>${stepGroups[g].name}</span>`;
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
    
    setupEventListeners() {
        // Preset button event delegation
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
        
        // Clear button event listeners
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
        
        // Chord Progression Builder event listeners
        document.getElementById('melodyScale')?.addEventListener('change', () => {
            this.populateChordProgressionSelect();
        });
        
        document.getElementById('chordProgressionSelect')?.addEventListener('change', (e) => {
            if (e.target.value !== '') {
                this.generateHarmonyFromChordProgression(e.target.value);
                e.target.value = ''; // Reset selection
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
        document.getElementById('harmonicsToggle')?.addEventListener('click', (e) => { this.harmonicsEnabled = !this.harmonicsEnabled; e.target.textContent = this.harmonicsEnabled ? 'ON' : 'OFF'; e.target.classList.toggle('active', this.harmonicsEnabled); });
        document.getElementById('stringsToggle')?.addEventListener('click', (e) => { this.melodyEnabled = !this.melodyEnabled; e.target.textContent = this.melodyEnabled ? 'ON' : 'OFF'; e.target.classList.toggle('active', this.melodyEnabled); });
        document.getElementById('rhythmToggle')?.addEventListener('click', (e) => { this.rhythmEnabled = !this.rhythmEnabled; e.target.textContent = this.rhythmEnabled ? 'ON' : 'OFF'; e.target.classList.toggle('active', this.rhythmEnabled); });
        document.getElementById('effectsToggle')?.addEventListener('click', (e) => { this.toggleEffects(); });
        document.getElementById('automationToggle')?.addEventListener('click', (e) => {
            const section = document.querySelector('.automation-grid');
            if (section) {
                section.style.display = section.style.display === 'none' ? 'grid' : 'none';
                e.target.textContent = section.style.display === 'none' ? 'OFF' : 'ON';
                e.target.classList.toggle('active', section.style.display !== 'none');
            }
        });
        
        // Original effect sliders
        document.getElementById('masterVolume')?.addEventListener('input', (e) => {
            Tone.Destination.volume.value = Tone.gainToDb(e.target.value / 100);
            document.getElementById('masterValue').textContent = e.target.value + '%';
            this.updateEffectCardStates();
        });
        document.getElementById('reverbAmount')?.addEventListener('input', (e) => {
            if (this.effects?.reverb) {
                this.effects.reverb.wet.value = e.target.value / 100;
                document.getElementById('reverbValue').textContent = e.target.value + '%';
                this.updateEffectCardStates();
            }
        });
        document.getElementById('echoAmount')?.addEventListener('input', (e) => {
            if (this.effects?.echo) {
                this.effects.echo.wet.value = e.target.value / 100;
                document.getElementById('echoValue').textContent = e.target.value + '%';
                this.updateEffectCardStates();
            }
        });
        document.getElementById('chorusAmount')?.addEventListener('input', (e) => {
            if (this.effects?.chorus) {
                this.effects.chorus.wet.value = e.target.value / 100;
                document.getElementById('chorusValue').textContent = e.target.value + '%';
                this.updateEffectCardStates();
            }
        });
        
        // New additional effect sliders from pixelMusic
        document.getElementById('lowpassAmount')?.addEventListener('input', (e) => {
            if (this.effects?.lowpass) {
                // Map 0-100 to frequency range 200Hz - 20000Hz (logarithmic)
                const value = parseInt(e.target.value);
                const freq = 200 + (20000 - 200) * Math.pow(value / 100, 2);
                this.effects.lowpass.frequency.value = freq;
                document.getElementById('lowpassValue').textContent = value + '%';
                this.updateEffectCardStates();
            }
        });
        
        document.getElementById('highpassAmount')?.addEventListener('input', (e) => {
            if (this.effects?.highpass) {
                // Map 0-100 to frequency range 20Hz - 5000Hz (logarithmic)
                const value = parseInt(e.target.value);
                const freq = 20 + (5000 - 20) * Math.pow(value / 100, 2);
                this.effects.highpass.frequency.value = freq;
                document.getElementById('highpassValue').textContent = value + '%';
                this.updateEffectCardStates();
            }
        });
        
        document.getElementById('distortionAmount')?.addEventListener('input', (e) => {
            if (this.effects?.distortion) {
                const value = parseInt(e.target.value);
                this.effects.distortion.distortion = value / 100;
                this.effects.distortion.wet.value = value / 100;
                document.getElementById('distortionValue').textContent = value + '%';
                this.updateEffectCardStates();
            }
        });
        
        document.getElementById('bitcrushAmount')?.addEventListener('input', (e) => {
            if (this.effects?.bitcrush) {
                const value = parseInt(e.target.value);
                // Map 0-100 to bit depth 1-16 (lower value = more crushing)
                const bits = 16 - Math.floor(value / 100 * 15);
                this.effects.bitcrush.bits.value = bits;
                this.effects.bitcrush.wet.value = value / 100;
                document.getElementById('bitcrushValue').textContent = value + '%';
                this.updateEffectCardStates();
            }
        });
        
        document.getElementById('tremoloAmount')?.addEventListener('input', (e) => {
            if (this.effects?.tremolo) {
                const value = parseInt(e.target.value);
                this.effects.tremolo.depth = value / 100;
                this.effects.tremolo.wet.value = value / 100;
                document.getElementById('tremoloValue').textContent = value + '%';
                this.updateEffectCardStates();
            }
        });
        
        document.getElementById('vibratoAmount')?.addEventListener('input', (e) => {
            if (this.effects?.vibrato) {
                const value = parseInt(e.target.value);
                this.effects.vibrato.depth = value / 100;
                this.effects.vibrato.wet.value = value / 100;
                document.getElementById('vibratoValue').textContent = value + '%';
                this.updateEffectCardStates();
            }
        });
        
        // Instrument selector event listeners
        document.getElementById('harmonicInstrument')?.addEventListener('change', (e) => { this.setHarmonicInstrument(e.target.value); });
        document.getElementById('melodyInstrument')?.addEventListener('change', (e) => { this.setMelodyInstrument(e.target.value); });
        document.getElementById('bassInstrument')?.addEventListener('change', (e) => { this.setBassInstrument(e.target.value); });
        document.getElementById('leadInstrument')?.addEventListener('change', (e) => { this.setLeadInstrument(e.target.value); });
        document.getElementById('drumKit')?.addEventListener('change', (e) => { this.setDrumKit(e.target.value); });
        document.getElementById('percussionKit')?.addEventListener('change', (e) => { this.setPercussionKit(e.target.value); });
        
        // Bass octave control
        document.getElementById('bassOctave')?.addEventListener('change', (e) => {
            this.bassOctave = parseInt(e.target.value);
        });
        
        // Bass, Lead, and Percussion toggle buttons
        document.getElementById('bassToggle')?.addEventListener('click', (e) => { 
            this.bassEnabled = !this.bassEnabled; 
            e.target.textContent = this.bassEnabled ? 'ON' : 'OFF'; 
            e.target.classList.toggle('active', this.bassEnabled); 
        });
        document.getElementById('leadToggle')?.addEventListener('click', (e) => { 
            this.leadEnabled = !this.leadEnabled; 
            e.target.textContent = this.leadEnabled ? 'ON' : 'OFF'; 
            e.target.classList.toggle('active', this.leadEnabled); 
        });
        document.getElementById('percussionToggle')?.addEventListener('click', (e) => { 
            this.percussionEnabled = !this.percussionEnabled; 
            e.target.textContent = this.percussionEnabled ? 'ON' : 'OFF'; 
            e.target.classList.toggle('active', this.percussionEnabled); 
        });
        
        // Pattern length toggle event listeners
        document.querySelectorAll('[data-pattern-length]').forEach(btn => {
            btn.addEventListener('click', () => {
                const length = parseInt(btn.dataset.patternLength);
                this.setPatternLength(length);
            });
        });
        
        // Automation event listeners
        document.getElementById('velocitySlider')?.addEventListener('input', (e) => {
            document.getElementById('velocityValue').textContent = e.target.value + '%';
        });
        
        document.getElementById('copyVelocityBtn')?.addEventListener('click', () => {
            const velocity = parseInt(document.getElementById('velocitySlider').value);
            // Copy to all melody steps
            for (let i = 0; i < this.patternLength; i++) {
                this.melodyVelocity.set(i, velocity / 100);
            }
            // Copy to all rhythm steps
            Object.keys(this.rhythmVelocity).forEach(inst => {
                for (let i = 0; i < this.patternLength; i++) {
                    this.rhythmVelocity[inst].set(i, velocity / 100);
                }
            });
            this.showNotification(`Velocity ${velocity}% copied to all steps`, 'success');
        });
        
        // Pan controls
        document.getElementById('harmonyPan')?.addEventListener('input', (e) => {
            const panValue = e.target.value / 100;
            document.getElementById('harmonyPanValue').textContent = e.target.value;
            if (this.harmonyPanner) this.harmonyPanner.pan.value = panValue;
        });
        
        document.getElementById('melodyPan')?.addEventListener('input', (e) => {
            const panValue = e.target.value / 100;
            document.getElementById('melodyPanValue').textContent = e.target.value;
            if (this.melodyPanner) this.melodyPanner.pan.value = panValue;
        });
        
        ['kick', 'snare', 'hihat', 'tom'].forEach(inst => {
            document.getElementById(`${inst}Pan`)?.addEventListener('input', (e) => {
                const panValue = e.target.value / 100;
                document.getElementById(`${inst}PanValue`).textContent = e.target.value;
                if (this.drumPanners?.[inst]) this.drumPanners[inst].pan.value = panValue;
            });
        });
        
        // Bass, Lead, and Percussion pan controls
        document.getElementById('bassPan')?.addEventListener('input', (e) => {
            const panValue = e.target.value / 100;
            document.getElementById('bassPanValue').textContent = e.target.value;
            if (this.bassPanner) this.bassPanner.pan.value = panValue;
        });
        
        document.getElementById('leadPan')?.addEventListener('input', (e) => {
            const panValue = e.target.value / 100;
            document.getElementById('leadPanValue').textContent = e.target.value;
            if (this.leadPanner) this.leadPanner.pan.value = panValue;
        });
        
        ['conga', 'bongo', 'shaker', 'cymbal'].forEach(inst => {
            document.getElementById(`${inst}Pan`)?.addEventListener('input', (e) => {
                const panValue = e.target.value / 100;
                document.getElementById(`${inst}PanValue`).textContent = e.target.value;
                if (this.percussionPanners?.[inst]) this.percussionPanners[inst].pan.value = panValue;
            });
        });
        
        // Filter automation
        document.getElementById('clearFilterBtn')?.addEventListener('click', () => {
            this.effectAutomation.lowpass.clear();
            this.drawFilterAutomation();
            this.showNotification('Filter automation cleared', 'success');
        });
        
        document.getElementById('smoothFilterBtn')?.addEventListener('click', () => {
            this.smoothFilterAutomation();
            this.showNotification('Filter automation smoothed', 'success');
        });
        
        // Accordion event listeners
        document.getElementById('expandAllGroupsBtn')?.addEventListener('click', () => {
            this.expandAllGroups();
            this.showNotification('All sections expanded', 'info');
        });
        
        document.getElementById('collapseAllGroupsBtn')?.addEventListener('click', () => {
            this.collapseAllGroups();
            this.showNotification('All sections collapsed', 'info');
        });
    }
    
    toggleHarmonic(index, cell) {
        if (this.harmonics.has(index)) { this.harmonics.delete(index); cell.classList.remove('active'); }
        else { this.harmonics.add(index); cell.classList.add('active'); if (this.polySynth) this.polySynth.triggerAttackRelease(this.harmonicNotes[index], '8n'); }
        
        // Update section timeline for harmonics
        if (index < this.patternLength) {
            this.updateSectionTimelineForStep(index);
        }
    }
    
    toggleMelody(groupIndex, col, row, cell) {
        // Handle copy mode - toggle cell selection
        if (this.copyMode) {
            this.toggleCellSelection(row, col, 'melody');
            cell.classList.toggle('copy-selected');
            return;
        }
        
        // Handle paste mode - paste cells
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
            if (this.melodySynth) { const scale = this.getCurrentScale(); this.melodySynth.triggerAttackRelease(scale[row], '16n'); }
        }
        
        // Update timeline for this step
        const globalStep = groupIndex * 16 + col;
        this.updateTimelineForStep(globalStep);
        
        // Update section timeline
        this.updateSectionTimelineForStep(globalStep);
        
        // Update accordion activity
        this.updateAccordionActivity();
    }
    
    toggleBass(groupIndex, col, row, cell) {
        // Handle copy mode - toggle cell selection
        if (this.copyMode) {
            this.toggleCellSelection(row, col, 'bass');
            cell.classList.toggle('copy-selected');
            return;
        }
        
        // Handle paste mode - paste cells
        if (this.pasteMode) {
            this.pasteCells(row, col, 'bass');
            return;
        }
        
        const groupData = this.patternGroups.bass[groupIndex];
        
        // Toggle: if this cell is active, turn it off; otherwise turn on (only one active per column)
        if (groupData.has(col) && groupData.get(col) === row) {
            // Turn off
            groupData.delete(col);
            cell.classList.remove('active');
        } else {
            // Turn on - first deactivate any active cell in this column
            const column = cell.parentElement;
            const activeCell = column.querySelector('.bass-cell.active');
            if (activeCell) activeCell.classList.remove('active');
            
            groupData.set(col, row);
            cell.classList.add('active');
            
            if (this.bassSynth && row < this.bassNotes.length) {
                const bassNote = this.bassNotes[row];
                this.bassSynth.triggerAttackRelease(bassNote, '8n');
            }
        }
        
        const globalStep = groupIndex * 16 + col;
        this.updateTimelineForStep(globalStep);
        this.updateSectionTimelineForStep(globalStep);
        
        // Update accordion activity
        this.updateAccordionActivity();
    }
    
    getBassRowFromCell(cell) {
        // Calculate row from cell's position in the bass-column wrapper
        const column = cell.parentElement;
        const cells = column.querySelectorAll('.bass-cell');
        return Array.from(cells).indexOf(cell);
    }
    
    toggleLead(groupIndex, col, row, cell) {
        // Handle copy mode - toggle cell selection
        if (this.copyMode) {
            this.toggleCellSelection(row, col, 'lead');
            cell.classList.toggle('copy-selected');
            return;
        }
        
        // Handle paste mode - paste cells
        if (this.pasteMode) {
            this.pasteCells(row, col, 'lead');
            return;
        }
        
        const groupData = this.patternGroups.lead[groupIndex];
        
        // Toggle: if this cell is active, turn it off; otherwise turn on (only one active per column)
        if (groupData && groupData.has(col) && groupData.get(col) === row) {
            // Turn off
            groupData.delete(col);
            cell.classList.remove('active');
        } else {
            if (groupData) {
                // Turn on - first deactivate any active cell in this column
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
            }
        }
        
        const globalStep = groupIndex * 16 + col;
        this.updateTimelineForStep(globalStep);
        this.updateSectionTimelineForStep(globalStep);
        
        // Update accordion activity
        this.updateAccordionActivity();
    }
    
    getLeadRowFromCell(cell) {
        // Calculate row from cell's position in the lead-column wrapper
        const column = cell.parentElement;
        const cells = column.querySelectorAll('.lead-cell');
        return Array.from(cells).indexOf(cell);
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
        }
        
        const globalStep = groupIndex * 16 + step;
        this.updateTimelineForStep(globalStep);
        this.updateSectionTimelineForStep(globalStep);
        
        // Update accordion activity
        this.updateAccordionActivity();
    }
    
    togglePlay() {
        if (this.isPlaying) this.stop();
        else this.play();
    }
    
    play() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.currentStep = 0;
        const stepTime = (60 / this.tempo) * 250;
        this.loopInterval = setInterval(() => { this.playStep(this.currentStep); this.currentStep = (this.currentStep + 1) % this.patternLength; }, stepTime);
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.classList.remove('btn-play');
            playBtn.classList.add('btn-stop');
            const playText = playBtn.querySelector('#playText');
            if (playText) playText.textContent = 'Stop';
            else playBtn.innerHTML = '<i class="fas fa-stop"></i> Stop';
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
        
        // Clear playing state from section timelines
        document.querySelectorAll('.nav-step.playing').forEach(c => c.classList.remove('playing'));
    }
    
    toggleEffects() {
        this.effectsEnabled = !this.effectsEnabled;
        const btn = document.getElementById('effectsToggle');
        btn.textContent = this.effectsEnabled ? 'ON' : 'OFF';
        btn.classList.toggle('active', this.effectsEnabled);
        
        if (!this.audioEngine) return;
        
        const effectStart = this.effectsEnabled ? this.effects.lowpass : this.compressor;
        
        // Reconnect harmony panner
        if (this.harmonyPanner) {
            this.harmonyPanner.disconnect();
            this.harmonyPanner.connect(effectStart);
        }
        
        // Reconnect melody panner
        if (this.melodyPanner) {
            this.melodyPanner.disconnect();
            this.melodyPanner.connect(effectStart);
        }
        
        // Reconnect drum panners
        Object.keys(this.drumPanners).forEach(inst => {
            if (this.drumPanners[inst]) {
                this.drumPanners[inst].disconnect();
                this.drumPanners[inst].connect(effectStart);
            }
        });
        
        // Reconnect bass panner
        if (this.bassPanner) {
            this.bassPanner.disconnect();
            this.bassPanner.connect(effectStart);
        }
        
        // Reconnect lead panner
        if (this.leadPanner) {
            this.leadPanner.disconnect();
            this.leadPanner.connect(effectStart);
        }
        
        // Reconnect percussion panners
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
        // Update visual disabled state for all effect cards based on their values
        const effectCards = [
            { id: 'masterVolume', card: 'masterVolume', cardId: 'masterValue' },
            { id: 'reverbAmount', card: 'reverbAmount', cardId: 'reverbValue' },
            { id: 'echoAmount', card: 'echoAmount', cardId: 'echoValue' },
            { id: 'chorusAmount', card: 'chorusAmount', cardId: 'chorusValue' },
            { id: 'lowpassAmount', card: 'lowpassAmount', cardId: 'lowpassValue' },
            { id: 'highpassAmount', card: 'highpassAmount', cardId: 'highpassValue' },
            { id: 'distortionAmount', card: 'distortionAmount', cardId: 'distortionValue' },
            { id: 'bitcrushAmount', card: 'bitcrushAmount', cardId: 'bitcrushValue' },
            { id: 'tremoloAmount', card: 'tremoloAmount', cardId: 'tremoloValue' },
            { id: 'vibratoAmount', card: 'vibratoAmount', cardId: 'vibratoValue' }
        ];
        
        effectCards.forEach(({ id, card, cardId }) => {
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
    
    playStep(step) {
        if (!this.polySynth) return;
        
        // Calculate which group this step belongs to
        const groupIndex = Math.floor(step / 16);
        const localStep = step % 16;
        
        // Get the appropriate pattern group data
        const groupMelody = this.patternGroups.melody[groupIndex];
        const groupBass = this.patternGroups.bass[groupIndex];
        const groupLead = this.patternGroups.lead[groupIndex];
        const groupRhythm = this.patternGroups.rhythm[groupIndex];
        
        // Get automation values for this step
        const melodyVel = this.melodyVelocity.get(step) ?? 0.8;
        const harmonyVel = this.harmonyVelocity.get(step) ?? 0.8;
        const leadVel = this.leadVelocity.get(step) ?? 0.7;
        const bassVel = this.bassVelocity.get(step) ?? 0.8;
        
        // Get filter automation for this step
        const lowpassVal = this.effectAutomation.lowpass?.get(step);
        
        // Apply filter automation
        if (lowpassVal !== undefined && this.effects?.lowpass) {
            const freq = 200 + (20000 - 200) * Math.pow(lowpassVal / 100, 2);
            this.effects.lowpass.frequency.rampTo(freq, 0.05);
        }
        
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
        
        // Play bass line
        if (this.bassEnabled && groupBass?.has(localStep)) {
            const row = groupBass.get(localStep);
            if (row < this.bassNotes.length) {
                const bassNote = this.bassNotes[row];
                this.bassSynth.triggerAttackRelease(bassNote, '8n', undefined, bassVel);
            }
        }
        
        // Play lead line
        if (this.leadEnabled && groupLead?.has(localStep)) {
            const row = groupLead.get(localStep);
            const scale = this.getCurrentScale();
            if (row < scale.length) {
                this.leadSynth.triggerAttackRelease(scale[row], '16n', undefined, leadVel);
            }
        }
        
        if (this.rhythmEnabled && groupRhythm) {
            Object.keys(this.drums || {}).forEach(instrument => {
                if (this.drums[instrument] && groupRhythm[instrument]?.has(localStep)) {
                    const vel = this.rhythmVelocity[instrument]?.get(step) ?? 0.8;
                    this.drums[instrument].triggerAttackRelease('16n', undefined, vel);
                    
                    const cell = document.querySelector(`.rhythm-cell[data-instrument="${instrument}"][data-step="${step}"]`);
                    if (cell) { 
                        cell.classList.add('playing'); 
                        setTimeout(() => cell.classList.remove('playing'), 150); 
                    }
                }
            });
        }
        
        // Play percussion
        if (this.percussionEnabled && groupRhythm) {
            Object.keys(this.percussion || {}).forEach(instrument => {
                if (this.percussion[instrument] && groupRhythm[instrument]?.has(localStep)) {
                    const vel = this.rhythmVelocity[instrument]?.get(step) ?? 0.7;
                    this.percussion[instrument].triggerAttackRelease('16n', undefined, vel);
                    
                    const cell = document.querySelector(`.rhythm-cell[data-instrument="${instrument}"][data-step="${step}"]`);
                    if (cell) { 
                        cell.classList.add('playing'); 
                        setTimeout(() => cell.classList.remove('playing'), 150); 
                    }
                }
            });
        }
        
        // Update global timeline playback state
        this.updateTimelineState();
        
        // Update section timelines playing state
        this.updateSectionTimelinesPlaying();
    }
    
    clearAll() {
        this.stop();
        
        // Clear all pattern groups
        this.patternGroups.harmonics.forEach(g => g.clear());
        this.patternGroups.melody.forEach(g => g.clear());
        this.patternGroups.bass.forEach(g => g.clear());
        this.patternGroups.lead.forEach(g => g.clear());
        this.patternGroups.rhythm.forEach(g => {
            Object.keys(g).forEach(inst => g[inst].clear());
        });
        
        // Sync active references
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
        
        // Update timeline to reflect cleared steps
        this.updateTimelineState();
        
        // Update section timelines to reflect cleared steps
        this.updateSectionTimelineState();
        
        // Update accordion activity
        this.updateAccordionActivity();
    }
    
    getCurrentScale() {
        const select = document.getElementById('melodyScale');
        return this.scales[select ? select.value : 'c-major'];
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
        
        // Add custom option
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
            // Show custom progression builder
            this.showCustomProgressionBuilder(progressionData);
            return;
        }
        
        const progression = progressionData.progressions[progressionIndex];
        if (!progression) return;
        
        // Clear existing harmonics
        this.harmonics.clear();
        
        // Generate harmonics based on chord progression
        const chordCount = progression.length;
        const stepsPerChord = Math.floor(this.patternLength / chordCount);
        
        progression.forEach((chordSymbol, index) => {
            const chord = progressionData.chords[chordSymbol];
            if (chord) {
                // Map chord notes to harmonic indices
                chord.forEach((note, noteIndex) => {
                    const harmonicIndex = this.harmonicNotes.findIndex(n => n.startsWith(note.split('/')[0]));
                    if (harmonicIndex !== -1) {
                        this.harmonics.add(harmonicIndex);
                    }
                });
            }
        });
        
        // Update UI
        this.updateHarmonicsUI();
        
        // Play the harmonic progression
        this.playChordProgression(progression, progressionData);
        
        this.showNotification(`Chord progression: ${progression.join(' - ')}`, 'success');
    }
    
    playChordProgression(progression, progressionData) {
        if (!this.polySynth) return;
        
        progression.forEach((chordSymbol, index) => {
            const chord = progressionData.chords[chordSymbol];
            if (chord) {
                // Add octave to match harmonic notes
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
        
        // Preview chord
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
        
        // Generate harmonics from custom progression
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
    
    // Filter Automation Methods
    drawFilterAutomation() {
        const canvas = document.getElementById('filterCanvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(0, 0, width, height);
        
        // Draw grid
        ctx.strokeStyle = '#4b5563';
        ctx.lineWidth = 1;
        const stepWidth = width / this.patternLength;
        for (let i = 0; i <= this.patternLength; i++) {
            ctx.beginPath();
            ctx.moveTo(i * stepWidth, 0);
            ctx.lineTo(i * stepWidth, height);
            ctx.stroke();
        }
        
        // Draw automation curve
        ctx.strokeStyle = '#f472b6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const automation = this.effectAutomation.lowpass;
        for (let i = 0; i <= this.patternLength; i++) {
            const value = automation.get(i) ?? 50;
            const x = i * stepWidth;
            const y = height - (value / 100 * height);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        
        // Draw points
        automation.forEach((value, step) => {
            const x = step * stepWidth;
            const y = height - (value / 100 * height);
            ctx.fillStyle = '#f472b6';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Setup click handler
        canvas.onclick = (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const step = Math.floor((x / width) * this.patternLength);
            const value = 100 - ((e.clientY - rect.top) / height * 100);
            
            this.effectAutomation.lowpass.set(step, Math.max(0, Math.min(100, value)));
            this.drawFilterAutomation();
        };
        
        // Setup drag handler
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
    
    populateGenreSelect() {
        const select = document.getElementById('genreSelect');
        window.getAllGenres().forEach(genre => {
            const option = document.createElement('option');
            option.value = genre;
            option.textContent = GENRE_METADATA[genre].name;
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
    
    loadSongPreset(presetKey) {
        if (!this.audioEngine) { 
            window.showAudioPrompt?.();
            return; 
        }
        // First check if presets are loaded, if not wait for them
        if (Object.keys(window.SONG_PRESETS).length === 0) {
            setTimeout(() => this.loadSongPreset(presetKey), 100);
            return;
        }
        const preset = window.SONG_PRESETS[presetKey];
        if (!preset) return;
        
        const targetPatternLength = this.patternLength;
        const presetPatternLength = preset.patternLength || 16;
        
        this.clearAll();
        this.tempo = preset.tempo;
        document.getElementById('tempoSlider').value = this.tempo;
        document.getElementById('tempoValue').textContent = this.tempo + ' BPM';
        
        // Set pattern length to match preset if needed
        if (presetPatternLength !== targetPatternLength) {
            this.patternLength = presetPatternLength;
            this.setPatternLength(presetPatternLength);
        }
        
        // Calculate repeat factor (16 -> 32 = 2x, 16 -> 64 = 4x)
        const repeatFactor = targetPatternLength / presetPatternLength;
        
        this.harmonics = new Set(preset.harmonics);
        
        // Extend melody: repeat the pattern across all groups
        Object.entries(preset.melody || {}).forEach(([key]) => {
            const [col, row] = key.split('-').map(Number);
            const groupIndex = Math.floor(col / 16);
            const localCol = col % 16;
            if (groupIndex < this.patternGroups.melody.length) {
                this.patternGroups.melody[groupIndex].set(localCol, row);
            }
        });
        
        // Extend bass: repeat the pattern across all groups
        Object.entries(preset.bass || {}).forEach(([key]) => {
            const [col, row] = key.split('-').map(Number);
            const groupIndex = Math.floor(col / 16);
            const localCol = col % 16;
            if (groupIndex < this.patternGroups.bass.length) {
                this.patternGroups.bass[groupIndex].set(localCol, row);
            }
        });
        
        // Extend lead: repeat the pattern across all groups
        Object.entries(preset.lead || {}).forEach(([key]) => {
            const [col, row] = key.split('-').map(Number);
            const groupIndex = Math.floor(col / 16);
            const localCol = col % 16;
            if (groupIndex < this.patternGroups.lead.length) {
                this.patternGroups.lead[groupIndex].set(localCol, row);
            }
        });
        
        // Extend rhythm: repeat the pattern across all groups
        Object.keys(this.patternGroups.rhythm[0]).forEach(inst => {
            const originalSteps = preset.rhythm?.[inst] || [];
            for (let i = 0; i < repeatFactor; i++) {
                originalSteps.forEach(step => {
                    const newStep = step + (i * presetPatternLength);
                    if (newStep < targetPatternLength) {
                        const groupIndex = Math.floor(newStep / 16);
                        const localStep = newStep % 16;
                        if (groupIndex < this.patternGroups.rhythm.length) {
                            this.patternGroups.rhythm[groupIndex][inst].add(localStep);
                        }
                    }
                });
            }
        });
        
        // Sync active references to current group
        this.harmonics = this.patternGroups.harmonics[this.currentGroupIndex];
        this.melodyRows = this.patternGroups.melody[this.currentGroupIndex];
        this.bassRows = this.patternGroups.bass[this.currentGroupIndex];
        this.leadRows = this.patternGroups.lead[this.currentGroupIndex];
        this.rhythm = this.patternGroups.rhythm[this.currentGroupIndex];
        
        // Rebuild grids
        this.rebuildGrids();
        this.updatePatternLengthUI();
        
        // Create section timelines
        this.createSectionTimelines();
        
        // Update accordion activity
        this.updateAccordionActivity();
        
        // Restore active states
        document.querySelectorAll('.harmonic-cell').forEach((c, i) => c.classList.toggle('active', this.harmonics.has(i)));
        
        // Restore melody states
        this.patternGroups.melody.forEach((group, gIdx) => {
            group.forEach((row, col) => {
                const cell = document.querySelector(`.string-cell[data-col="${col}"][data-row="${row}"][data-group-index="${gIdx}"]`);
                if (cell) cell.classList.add('active');
            });
        });
        
        // Restore bass states
        this.patternGroups.bass.forEach((group, gIdx) => {
            group.forEach((row, col) => {
                const cell = document.querySelector(`.bass-cell[data-col="${col}"][data-row="${row}"][data-group-index="${gIdx}"]`);
                if (cell) cell.classList.add('active');
            });
        });
        
        // Restore lead states
        this.patternGroups.lead.forEach((group, gIdx) => {
            group.forEach((row, col) => {
                const cell = document.querySelector(`.lead-cell[data-col="${col}"][data-row="${row}"][data-group-index="${gIdx}"]`);
                if (cell) cell.classList.add('active');
            });
        });
        
        // Restore rhythm states
        this.patternGroups.rhythm.forEach((group, gIdx) => {
            Object.keys(group).forEach(inst => {
                group[inst].forEach(step => {
                    const cell = document.querySelector(`.rhythm-cell[data-instrument="${inst}"][data-step="${step}"][data-group-index="${gIdx}"]`);
                    if (cell) cell.classList.add('active');
                });
            });
        });
        
        this.play();
    }
    
    randomize() {
        // Get current settings
        const scale = this.getCurrentScale();
        const groupCount = this.patternLength / 16;
        
        // Generate random patterns for all instruments
        
        // 1. Generate random bass patterns for all groups
        for (let g = 0; g < groupCount; g++) {
            const groupBass = this.patternGroups.bass[g];
            const bassDensity = 0.3 + Math.random() * 0.4; // 30-70% fill
            
            for (let col = 0; col < 16; col++) {
                if (Math.random() < bassDensity) {
                    // Pick a random row (prefer lower notes for bass)
                    const row = Math.floor(Math.random() * 6); // Prefer rows 0-5 (lower notes)
                    groupBass.set(col, row);
                }
            }
        }
        
        // 2. Generate random lead patterns for all groups
        for (let g = 0; g < groupCount; g++) {
            const groupLead = this.patternGroups.lead[g];
            const leadDensity = 0.2 + Math.random() * 0.5; // 20-70% fill
            
            for (let col = 0; col < 16; col++) {
                if (Math.random() < leadDensity) {
                    const row = Math.floor(Math.random() * 8);
                    groupLead.set(col, row);
                }
            }
        }
        
        // 3. Generate random percussion patterns for all groups
        for (let g = 0; g < groupCount; g++) {
            const groupRhythm = this.patternGroups.rhythm[g];
            
            // Kick: standard pattern
            for (let step = 0; step < 16; step++) {
                if (step % 4 === 0 || (step === 10 && Math.random() > 0.5)) {
                    groupRhythm.kick.add(step);
                }
            }
            
            // Snare: backbeat pattern
            for (let step = 0; step < 16; step++) {
                if (step === 4 || step === 12 || (step === 14 && Math.random() > 0.5)) {
                    groupRhythm.snare.add(step);
                }
            }
            
            // Hi-hat: driving pattern
            for (let step = 0; step < 16; step++) {
                if (step % 2 === 0 || Math.random() > 0.6) {
                    groupRhythm.hihat.add(step);
                }
            }
            
            // Tom: occasional fills
            for (let step = 0; step < 16; step++) {
                if (Math.random() > 0.85) {
                    groupRhythm.tom.add(step);
                }
            }
            
            // Percussion instruments (if enabled)
            if (this.percussionEnabled) {
                for (let step = 0; step < 16; step++) {
                    if (Math.random() > 0.7) {
                        groupRhythm.conga.add(step);
                    }
                    if (Math.random() > 0.8) {
                        groupRhythm.bongo.add(step);
                    }
                    if (Math.random() > 0.6) {
                        groupRhythm.shaker.add(step);
                    }
                    if (Math.random() > 0.85) {
                        groupRhythm.cymbal.add(step);
                    }
                }
            }
        }
        
        // 4. Generate random automation values
        for (let step = 0; step < this.patternLength; step++) {
            // Random velocity for melody
            this.melodyVelocity.set(step, 0.5 + Math.random() * 0.4);
            
            // Random velocity for lead
            this.leadVelocity.set(step, 0.4 + Math.random() * 0.5);
            
            // Random velocity for bass
            this.bassVelocity.set(step, 0.6 + Math.random() * 0.3);
            
            // Random velocity for rhythm
            ['kick', 'snare', 'hihat', 'tom'].forEach(inst => {
                this.rhythmVelocity[inst].set(step, 0.5 + Math.random() * 0.4);
            });
            
            // Filter automation: gradual sweep
            const progress = step / this.patternLength;
            this.effectAutomation.lowpass.set(step, 30 + progress * 50 + Math.random() * 20);
        }
        
        // 5. Load a random song preset for harmony and melody
        // Save our generated patterns before preset loading
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
        
        // Show loading notification
        this.showNotification('Generating random pattern...', 'info');
        
        getPresetsByGenre(randomGenre).then(presets => {
            const keys = Object.keys(presets);
            if (keys.length > 0) {
                const randomKey = keys[Math.floor(Math.random() * keys.length)];
                
                // Temporarily save generated patterns
                const tempBass = JSON.parse(JSON.stringify(this.patternGroups.bass));
                const tempLead = JSON.parse(JSON.stringify(this.patternGroups.lead));
                const tempRhythm = JSON.parse(JSON.stringify(this.patternGroups.rhythm));
                
                // Load preset (this will clear and regenerate patternGroups)
                this.loadSongPreset(randomKey);
                
                // Restore bass, lead, percussion patterns
                this.patternGroups.bass = tempBass;
                this.patternGroups.lead = tempLead;
                this.patternGroups.rhythm = tempRhythm;
                
                // Sync active references
                this.bassRows = this.patternGroups.bass[this.currentGroupIndex];
                this.leadRows = this.patternGroups.lead[this.currentGroupIndex];
                this.rhythm = this.patternGroups.rhythm[this.currentGroupIndex];
                
                // Rebuild grids to show restored patterns
                this.rebuildGrids();
                this.createSectionTimelines();
                
                this.showNotification(`Random pattern: ${presets[randomKey].name}`, 'success');
            } else {
                // Just use our generated patterns
                this.rebuildGrids();
                this.createSectionTimelines();
                this.showNotification('Random pattern generated!', 'success');
            }
        });
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
    
    getSongData() {
        // Collect data from all pattern groups
        const groupCount = this.patternLength / 16;
        
        // Merge all groups into single pattern
        const allMelody = {};
        const allRhythm = {
            kick: [],
            snare: [],
            hihat: [],
            tom: []
        };
        
        for (let g = 0; g < groupCount; g++) {
            // Merge melody
            this.patternGroups.melody[g].forEach((row, col) => {
                const globalCol = g * 16 + col;
                allMelody[`${globalCol}-${row}`] = true;
            });
            
            // Merge rhythm
            Object.keys(allRhythm).forEach(inst => {
                this.patternGroups.rhythm[g][inst].forEach(step => {
                    const globalStep = g * 16 + step;
                    if (!allRhythm[inst].includes(globalStep)) {
                        allRhythm[inst].push(globalStep);
                    }
                });
            });
        }
        
        // Get harmonics from all groups
        const allHarmonics = new Set();
        this.patternGroups.harmonics.forEach(group => {
            group.forEach(idx => allHarmonics.add(idx));
        });
        
        return {
            tempo: this.tempo,
            patternLength: this.patternLength,
            harmonics: Array.from(allHarmonics),
            melody: allMelody,
            rhythm: allRhythm,
            scale: document.getElementById('melodyScale').value
        };
    }
    
    loadSongData(data) {
        this.clearAll();
        
        // Initialize pattern groups
        this.initializePatternGroups();
        
        this.tempo = data.tempo || 120;
        document.getElementById('tempoSlider').value = this.tempo;
        document.getElementById('tempoValue').textContent = this.tempo + ' BPM';
        if (data.scale) document.getElementById('melodyScale').value = data.scale;
        
        // Set pattern length first, then rebuild grids
        const length = data.patternLength || 16;
        if (length !== this.patternLength) {
            this.patternLength = length;
            this.rebuildGrids();
            this.createStepTimeline();
            this.createSectionTimelines();
            this.updatePatternLengthUI();
        }
        
        // Calculate group count and distribute pattern across groups
        const groupCount = this.patternLength / 16;
        
        // Load harmonics - distribute across groups
        const harmonicsData = data.harmonics || [];
        harmonicsData.forEach((idx, i) => {
            const groupIndex = i % groupCount;
            this.patternGroups.harmonics[groupIndex].add(idx);
        });
        
        // Load melody - distribute across groups
        const melodyData = data.melody || {};
        Object.entries(melodyData).forEach(([key]) => {
            const [col, row] = key.split('-').map(Number);
            const groupIndex = Math.floor(col / 16);
            const localCol = col % 16;
            if (groupIndex < groupCount) {
                this.patternGroups.melody[groupIndex].set(localCol, row);
            }
        });
        
        // Load rhythm - distribute across groups
        const rhythmData = data.rhythm || {};
        Object.keys(this.patternGroups.rhythm[0]).forEach(inst => {
            const steps = rhythmData[inst] || [];
            steps.forEach(step => {
                const groupIndex = Math.floor(step / 16);
                const localStep = step % 16;
                if (groupIndex < groupCount) {
                    this.patternGroups.rhythm[groupIndex][inst].add(localStep);
                }
            });
        });
        
        // Sync active references to current group
        this.harmonics = this.patternGroups.harmonics[this.currentGroupIndex];
        this.melodyRows = this.patternGroups.melody[this.currentGroupIndex];
        this.bassRows = this.patternGroups.bass[this.currentGroupIndex];
        this.leadRows = this.patternGroups.lead[this.currentGroupIndex];
        this.rhythm = this.patternGroups.rhythm[this.currentGroupIndex];
        
        document.querySelectorAll('.harmonic-cell').forEach((c, i) => c.classList.toggle('active', this.harmonics.has(i)));
        
        this.melodyRows.forEach((row, col) => {
            const cell = document.querySelector(`.string-cell[data-col="${col}"][data-row="${row}"]`);
            if (cell) cell.classList.add('active');
        });
        
        Object.keys(this.rhythm).forEach(inst => {
            this.rhythm[inst].forEach(step => {
                const cell = document.querySelector(`.rhythm-cell[data-instrument="${inst}"][data-step="${step}"]`);
                if (cell) cell.classList.add('active');
            });
        });
        
        // Update timeline with new data
        this.updateTimelineState();
        
        // Update section timelines with new data
        this.updateSectionTimelineState();
        
        // Update accordion activity
        this.updateAccordionActivity();
    }
    
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
            presets[preset].forEach(idx => { this.harmonics.add(idx); document.querySelectorAll('.harmonic-cell')[idx]?.classList.add('active'); });
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
            patterns[preset].forEach(([col, row]) => { this.melodyRows.set(col, row); document.querySelector(`.string-cell[data-col="${col}"][data-row="${row}"]`)?.classList.add('active'); });
        }
    }
    
    loadRhythmPreset(preset) {
        if (!this.drums) {
            window.showAudioPrompt?.();
            return;
        }
        // Clear existing rhythm
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
        
        // Clear existing bass pattern
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
        
        // Play the bass pattern
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
        
        // Clear existing lead pattern
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
        
        // Play the lead pattern
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
        if (!this.percussion) {
            window.showAudioPrompt?.();
            return;
        }
        
        // Clear existing percussion
        ['conga', 'bongo', 'shaker', 'cymbal'].forEach(inst => {
            if (this.rhythm[inst]) this.rhythm[inst].clear();
        });
        document.querySelectorAll('.rhythm-cell').forEach(c => c.classList.remove('active'));
        
        if (preset === 'clear') return;
        
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
                if (this.rhythm[inst]) {
                    patterns[preset][inst].forEach(step => {
                        this.rhythm[inst].add(step);
                        const cell = document.querySelector(`.rhythm-cell[data-instrument="${inst}"][data-step="${step}"]`);
                        if (cell) cell.classList.add('active');
                    });
                }
            });
        }
        
        // Play the percussion pattern
        if (this.percussionEnabled) {
            Object.keys(patterns[preset] || {}).forEach(inst => {
                patterns[preset][inst].forEach(step => {
                    setTimeout(() => {
                        if (this.percussion[inst]) {
                            this.percussion[inst].triggerAttackRelease('16n');
                        }
                    }, step * 125);
                });
            });
        }
    }
    
    // Step Timeline Accordion Methods
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
    
    getStepGroupDefinitions() {
        const definitions = {
            16: [
                { start: 0, end: 15, name: 'Main Loop', description: 'One measure' }
            ],
            32: [
                { start: 0, end: 15, name: 'Original', description: 'Measure 1' },
                { start: 16, end: 31, name: 'Variation', description: 'Measure 2' }
            ],
            64: [
                { start: 0, end: 15, name: 'Build Up', description: 'Intro' },
                { start: 16, end: 31, name: 'Develop', description: 'Bridge' },
                { start: 32, end: 47, name: 'Peak', description: 'Climax' },
                { start: 48, end: 63, name: 'Resolve', description: 'Outro' }
            ]
        };
        return definitions[this.patternLength] || definitions[16];
    }
    
    createTimelineSection(group, index) {
        const section = document.createElement('div');
        section.className = 'timeline-section expanded';
        section.dataset.groupIndex = index;
        section.dataset.start = group.start;
        section.dataset.end = group.end;
        
        // Header with label and toggle
        const header = document.createElement('div');
        header.className = 'timeline-header';
        header.innerHTML = `
            <span class="timeline-label">${group.name}</span>
            <button class="timeline-toggle" title="Toggle expansion">
                <i class="fas ${index === 0 ? 'fa-compress-arrows-alt' : 'fa-compress-arrows-alt'}"></i>
            </button>
        `;
        
        // Steps grid (4x4 for 16 steps per group)
        const stepsContainer = document.createElement('div');
        stepsContainer.className = 'timeline-steps';
        
        for (let i = 0; i < 16; i++) {
            const step = group.start + i;
            const stepCell = document.createElement('div');
            stepCell.className = 'timeline-step';
            stepCell.dataset.step = step;
            stepCell.title = `Step ${step}`;
            
            // Check if this step has any activity
            if (this.hasStepActivity(step)) {
                stepCell.classList.add('active');
            }
            
            stepsContainer.appendChild(stepCell);
        }
        
        // Description
        const description = document.createElement('div');
        description.className = 'timeline-description';
        description.textContent = group.description;
        
        section.appendChild(header);
        section.appendChild(stepsContainer);
        section.appendChild(description);
        
        // Click handler for expansion/collapse
        section.addEventListener('click', (e) => {
            if (e.target.closest('.timeline-toggle')) return;
            this.toggleTimelineSection(section);
        });
        
        return section;
    }
    
    hasStepActivity(step) {
        // Calculate which group this step belongs to
        const groupIndex = Math.floor(step / 16);
        const localStep = step % 16;
        
        // Get the appropriate pattern group
        const groupData = this.patternGroups;
        
        // Check melody in the corresponding group
        if (groupData.melody[groupIndex]?.has(localStep)) return true;
        
        // Check bass in the corresponding group
        if (groupData.bass[groupIndex]?.has(localStep)) return true;
        
        // Check lead in the corresponding group
        if (groupData.lead[groupIndex]?.has(localStep)) return true;
        
        // Check rhythm in the corresponding group
        if (groupData.rhythm[groupIndex]) {
            for (const inst of Object.keys(groupData.rhythm[groupIndex])) {
                if (groupData.rhythm[groupIndex][inst].has(localStep)) return true;
            }
        }
        
        return false;
    }
    
    toggleTimelineSection(section) {
        const isExpanded = section.classList.contains('expanded');
        
        // Close all other sections first
        document.querySelectorAll('.timeline-section').forEach(s => {
            s.classList.remove('expanded');
            s.classList.add('collapsed');
            s.classList.remove('active');
        });
        
        // Toggle clicked section
        if (!isExpanded) {
            section.classList.remove('collapsed');
            section.classList.add('expanded');
            section.classList.add('active');
        } else {
            // If clicking on already expanded, keep it expanded
            section.classList.remove('collapsed');
            section.classList.add('expanded');
            section.classList.add('active');
        }
    }
    
    updateTimelineState() {
        // Update active states based on current step
        document.querySelectorAll('.timeline-step').forEach(cell => {
            const step = parseInt(cell.dataset.step);
            cell.classList.toggle('active', this.hasStepActivity(step));
        });
        
        // Highlight currently playing step
        if (this.isPlaying) {
            document.querySelectorAll('.timeline-step.playing').forEach(c => c.classList.remove('playing'));
            const currentCell = document.querySelector(`.timeline-step[data-step="${this.currentStep}"]`);
            if (currentCell) {
                currentCell.classList.add('playing');
            }
        }
    }
    
    updateTimelineForStep(step) {
        // Update active state for a specific step
        const cell = document.querySelector(`.timeline-step[data-step="${step}"]`);
        if (cell) {
            cell.classList.toggle('active', this.hasStepActivity(step));
        }
    }
    
    // Per-section timeline navigation methods
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
            
            // Create stacked grid rows for each pattern group
            stepGroups.forEach((group, groupIndex) => {
                const groupRow = document.createElement('div');
                groupRow.className = `group-grid-row${groupIndex === this.currentGroupIndex ? ' active' : ''}`;
                groupRow.dataset.groupIndex = groupIndex;
                
                // Group label
                const groupLabel = document.createElement('div');
                groupLabel.className = 'group-grid-label';
                groupLabel.innerHTML = `<span class="group-name">${group.name}</span><span class="group-range">${group.start + 1}-${group.end + 1}</span>`;
                groupRow.appendChild(groupLabel);
                
                // 16-step grid for this group
                const stepsGrid = document.createElement('div');
                stepsGrid.className = 'group-grid-steps';
                
                for (let i = 0; i < 16; i++) {
                    const stepCell = document.createElement('div');
                    stepCell.className = 'group-step';
                    stepCell.dataset.step = i;
                    
                    // Check if this step has activity in this section and group
                    if (this.hasSectionActivity(section, groupIndex, i)) {
                        stepCell.classList.add('active');
                    }
                    
                    stepsGrid.appendChild(stepCell);
                }
                
                groupRow.appendChild(stepsGrid);
                
                // Click handler to load this group
                groupRow.addEventListener('click', () => {
                    this.loadPatternGroup(groupIndex);
                });
                
                container.appendChild(groupRow);
            });
        });
        
        this.updateSectionTimelineState();
    }
    

    
    hasSectionActivity(section, groupIndex, step) {
        // step is 0-15 (local to group), groupIndex is the pattern group
        
        if (!section.data) return false;
        
        switch(section.id) {
            case 'harmonics':
                // Check specific group
                return this.patternGroups.harmonics[groupIndex]?.has(step);
            case 'melody':
                return this.patternGroups.melody[groupIndex]?.has(step);
            case 'bass':
                return this.patternGroups.bass[groupIndex]?.has(step);
            case 'lead':
                return this.patternGroups.lead[groupIndex]?.has(step);
            case 'rhythm':
            case 'percussion':
                const rhythmData = this.patternGroups.rhythm[groupIndex];
                if (rhythmData) {
                    for (const inst of Object.keys(rhythmData)) {
                        if (rhythmData[inst].has(step)) return true;
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
            
            // Update active row
            const rows = container.querySelectorAll('.group-grid-row');
            rows.forEach((row, index) => {
                row.classList.toggle('active', index === this.currentGroupIndex);
            });
            
            // Update step cells in each row
            const sectionData = this.getSectionData(sectionId);
            rows.forEach((row, groupIndex) => {
                const stepCells = row.querySelectorAll('.group-step');
                stepCells.forEach((cell, stepIndex) => {
                    cell.classList.toggle('active', this.hasSectionActivity({ id: sectionId, data: sectionData }, groupIndex, stepIndex));
                });
            });
        });
        
        // Update playing state
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
            
            // Clear playing state from all
            container.querySelectorAll('.group-step.playing').forEach(c => c.classList.remove('playing'));
            
            if (this.isPlaying) {
                // Calculate which group and local step
                const groupIndex = Math.floor(this.currentStep / 16);
                const localStep = this.currentStep % 16;
                
                const activeRow = container.querySelectorAll('.group-grid-row')[groupIndex];
                if (activeRow) {
                    const playingCell = activeRow.querySelector(`.group-step[data-step="${localStep}"]`);
                    if (playingCell) {
                        playingCell.classList.add('playing');
                    }
                }
            }
        });
    }
    
    updateSectionTimelineForStep(step) {
        const sections = ['harmonics', 'melody', 'rhythm', 'bass', 'lead', 'percussion'];
        
        sections.forEach(sectionId => {
            const container = document.getElementById(`${sectionId}Timeline`);
            if (!container) return;
            
            // Calculate which group and local step
            const groupIndex = Math.floor(step / 16);
            const localStep = step % 16;
            
            const rows = container.querySelectorAll('.group-grid-row');
            const activeRow = rows[groupIndex];
            if (activeRow) {
                const stepCell = activeRow.querySelector(`.group-step[data-step="${localStep}"]`);
                if (stepCell) {
                    stepCell.classList.toggle('active', this.hasSectionActivity({ id: sectionId, data: this.getSectionData(sectionId) }, groupIndex, localStep));
                }
            }
        });
    }
}

class SimpleAudioEngine {
    constructor() { 
        this.context = new (window.AudioContext || window.webkitAudioContext)(); 
        this.sampleRate = this.context.sampleRate; 
    }
}
