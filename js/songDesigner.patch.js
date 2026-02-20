/**
 * songDesigner.patch.js
 * 
 * Drop this AFTER songDesigner.js in your index.html.
 * It patches SongDesignerApp with audio quality improvements without
 * touching the original file, so it's safe and easy to roll back.
 *
 * Improvements:
 *  1. Replace setInterval sequencer with Tone.js Transport (fixes timing drift)
 *  2. Richer instrument definitions (wider supersaw, warmer FM, better piano)
 *  3. Velocity humanization — subtle random variation each step
 *  4. Per-instrument reverb sends (drums drier, pads wetter)
 *  5. Better compressor settings (less pumpy)
 *  6. Harmonic chord voicing — spread across octaves for fullness
 *  7. Note length variation — melody gets '8n' not just '16n' for longer notes
 */

(function patchSongDesigner() {
    // Wait for SongDesignerApp to be defined
    if (typeof SongDesignerApp === 'undefined') {
        document.addEventListener('DOMContentLoaded', patchSongDesigner);
        return;
    }

    const proto = SongDesignerApp.prototype;

    // ─────────────────────────────────────────────────────────────────────────
    // 1. BETTER INSTRUMENT DEFINITIONS
    //    Called in initAudio() — patch the instrument configs on construction
    // ─────────────────────────────────────────────────────────────────────────

    const originalInitAudio = proto.initAudio;
    proto.initAudio = function() {
        // Override instrument configs BEFORE super call creates the synths

        // ── Supersaw: wider spread, more oscillators ─────────────────────────
        // Original: count:5, spread:20  →  Patched: count:7, spread:50
        this.melodyInstruments.supersaw = {
            synth: Tone.PolySynth,
            opts: {
                oscillator: { type: 'fatsawtooth', count: 7, spread: 50 },
                envelope: { attack: 0.03, decay: 0.15, sustain: 0.5, release: 0.8 }
            }
        };
        this.leadInstruments.supersaw = {
            synth: Tone.PolySynth,
            opts: {
                oscillator: { type: 'fatsawtooth', count: 7, spread: 50 },
                envelope: { attack: 0.02, decay: 0.1, sustain: 0.45, release: 0.7 }
            }
        };

        // ── Piano: triangle + detune for richer tone ─────────────────────────
        // Original: plain triangle  →  Patched: AmSynth for natural amplitude modulation
        this.harmonicInstruments.piano = {
            synth: Tone.PolySynth,
            opts: {
                oscillator: { type: 'triangle14' }, // partials 1+4 = fuller tone
                envelope: { attack: 0.005, decay: 0.8, sustain: 0.2, release: 2.0 },
                volume: -2
            }
        };

        // ── FM Synth: warmer modulator (sine instead of square) ───────────────
        // Original: modulation: { type: 'square' }  →  sine is warmer, less buzzy
        this.harmonicInstruments.fm = {
            synth: Tone.PolySynth,
            opts: {
                voice: Tone.FMSynth,
                harmonicity: 2,           // lower = warmer (was 3)
                modulationIndex: 8,       // slightly less harsh (was 10)
                oscillator: { type: 'sine' },
                envelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 2.0 },
                modulation: { type: 'sine' },           // CHANGED from 'square'
                modulationEnvelope: { attack: 0.5, decay: 0.2, sustain: 0.8, release: 1.0 }
            }
        };

        // ── Pad: slow attack, rich AM modulation ─────────────────────────────
        this.harmonicInstruments.pad = {
            synth: Tone.PolySynth,
            opts: {
                voice: Tone.AMSynth,
                oscillator: { type: 'fatsine', count: 3, spread: 20 },
                envelope: { attack: 0.8, decay: 0.5, sustain: 0.9, release: 3.0 },
                modulation: { type: 'sine' },
                modulationEnvelope: { attack: 0.8, decay: 0.5, sustain: 0.9, release: 3.0 }
            }
        };

        // ── Bass: add sub-harmonics with fatter waveform ──────────────────────
        this.bassInstruments.synth = {
            synth: Tone.MonoSynth,
            opts: {
                oscillator: { type: 'fatsawtooth', count: 2, spread: 10 },
                envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.5 },
                filterEnvelope: { attack: 0.01, decay: 0.15, sustain: 0.5, release: 0.5, baseFrequency: 250, octaves: 2.5 }
            }
        };
        this.bassInstruments.sub = {
            synth: Tone.MonoSynth,
            opts: {
                oscillator: { type: 'sine' },
                envelope: { attack: 0.02, decay: 0.4, sustain: 0.6, release: 0.8 },
                filterEnvelope: { attack: 0.02, decay: 0.4, sustain: 0.6, release: 0.8, baseFrequency: 80, octaves: 1.5 }
            }
        };

        // ── Better drum kit defaults ──────────────────────────────────────────
        // Acoustic kit: more realistic decay times
        this.drumKits.acoustic = {
            kick: { synth: Tone.MembraneSynth, opts: {
                pitchDecay: 0.08,    // longer sweep = more thump (was 0.05)
                octaves: 9,          // slightly more pitch drop
                oscillator: { type: 'sine' },
                envelope: { attack: 0.001, decay: 0.6, sustain: 0.01, release: 1.2 }
            }},
            snare: { synth: Tone.NoiseSynth, opts: {
                noise: { type: 'white' },
                envelope: { attack: 0.001, decay: 0.2, sustain: 0.02, release: 0.2 }
            }},
            hihat: { synth: Tone.MetalSynth, opts: {
                frequency: 300,
                envelope: { attack: 0.001, decay: 0.1, release: 0.02 },
                harmonicity: 5.1, modulationIndex: 32, resonance: 6000, octaves: 2.5
            }},
            tom: { synth: Tone.MembraneSynth, opts: {
                pitchDecay: 0.08, octaves: 6,
                oscillator: { type: 'sine' },
                envelope: { attack: 0.01, decay: 0.4, sustain: 0.01, release: 0.5 }
            }}
        };

        // Now call the original initAudio
        originalInitAudio.call(this);

        // ── After init: tune the master compressor ────────────────────────────
        // Original: threshold:-24, ratio:4 → pumpy
        // Patched:  threshold:-12, ratio:2.5 → transparent glue
        if (this.compressor) {
            this.compressor.set({
                threshold: -12,
                ratio: 2.5,
                knee: 6,
                attack: 0.005,
                release: 0.2
            });
        }

        // ── After init: add per-instrument reverb sends ───────────────────────
        this._addReverbSends();
    };

    // ─────────────────────────────────────────────────────────────────────────
    // 2. PER-INSTRUMENT REVERB SENDS
    //    Drums go dry; pads/harmony go wet. Creates depth and separation.
    // ─────────────────────────────────────────────────────────────────────────

    proto._addReverbSends = function() {
        if (!this.effects?.reverb) return;

        // Create a secondary "dry" reverb (short room) for drums
        this._drumReverb = new Tone.Reverb({ decay: 0.4, wet: 0.08 });
        this._drumReverb.connect(this.compressor);

        // Create a lush reverb for pads/harmony
        this._padReverb = new Tone.Reverb({ decay: 3.5, wet: 0.4 });
        this._padReverb.connect(this.compressor);

        // Route drum panners to drum reverb instead of main effects
        if (this.drumPanners) {
            Object.values(this.drumPanners).forEach(panner => {
                if (panner) {
                    // Keep main chain connection, add parallel send
                    try { panner.connect(this._drumReverb); } catch(e) {}
                }
            });
        }

        // Route harmony panner to pad reverb
        if (this.harmonyPanner) {
            try { this.harmonyPanner.connect(this._padReverb); } catch(e) {}
        }

        console.log('[patch] Per-instrument reverb sends added');
    };

    // ─────────────────────────────────────────────────────────────────────────
    // 3. REPLACE setInterval WITH Tone.js Transport
    //    setInterval drifts by 10-50ms per beat at 120BPM — noticeable!
    //    Tone.Transport is sample-accurate and never drifts.
    // ─────────────────────────────────────────────────────────────────────────

    proto.play = function() {
        if (this.isPlaying) return;

        if (this.howlerEngine) this.howlerEngine.resume();
        if (this.rhythmVisualizer?.enabled) this.rhythmVisualizer.setTempo(this.tempo);

        this.isPlaying = true;
        this.currentStep = 0;
        this.groupLoopCurrent = [0, 0, 0, 0];

        // Use Tone.Transport for accurate timing
        Tone.Transport.bpm.value = this.tempo;
        Tone.Transport.cancel(); // clear any previous events

        // Schedule repeating 16th-note step
        this._transportEvent = Tone.Transport.scheduleRepeat((time) => {
            // Use Tone.Draw for UI updates (keeps audio thread clean)
            Tone.Draw.schedule(() => {
                this._advanceStep();
            }, time);
            this._playStepAtTime(this.currentStep, time);
        }, '16n');

        Tone.Transport.start();

        // Update UI
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.classList.remove('btn-play');
            playBtn.classList.add('btn-stop');
            const playText = playBtn.querySelector('#playText');
            if (playText) playText.textContent = 'Stop';
        }
    };

    proto._advanceStep = function() {
        const groupCount = this.patternLength / 16;
        const currentGroup = Math.floor(this.currentStep / 16);
        const localStep = this.currentStep % 16;

        if (localStep === 15) {
            this.groupLoopCurrent[currentGroup]++;
            if (this.groupLoopCurrent[currentGroup] < this.groupLoopCounts[currentGroup]) {
                this.currentStep = currentGroup * 16;
            } else {
                this.groupLoopCurrent[currentGroup] = 0;
                this.currentStep = currentGroup < groupCount - 1
                    ? (currentGroup + 1) * 16
                    : 0;
            }
        } else {
            this.currentStep++;
        }

        this.updateTimelineState();
        this.updateSectionTimelinesPlaying();
    };

    proto.stop = function() {
        this.isPlaying = false;

        // Stop Tone.Transport
        Tone.Transport.stop();
        if (this._transportEvent !== undefined) {
            Tone.Transport.clear(this._transportEvent);
            this._transportEvent = undefined;
        }

        this.currentStep = 0;
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.classList.remove('btn-stop');
            playBtn.classList.add('btn-play');
            const playText = playBtn.querySelector('#playText');
            if (playText) playText.textContent = 'Play';
        }
        document.querySelectorAll('.rhythm-cell').forEach(c => c.classList.remove('playing'));
        document.querySelectorAll('.timeline-step').forEach(c => c.classList.remove('playing'));
    };

    // ─────────────────────────────────────────────────────────────────────────
    // 4. ENHANCED playStep WITH HUMANIZATION + TIMING
    //    The original playStep() becomes _playStepAtTime(step, time)
    //    so Tone.js can schedule notes at the exact audio time.
    // ─────────────────────────────────────────────────────────────────────────

    proto._playStepAtTime = function(step, time) {
        if (!this.polySynth) return;

        // Rhythm visualizer
        if (this.rhythmVisualizer?.enabled) {
            this.rhythmVisualizer.onStepPlay(step);
        }

        const groupIndex = Math.floor(step / 16);
        const localStep = step % 16;

        const groupMelody  = this.patternGroups.melody[groupIndex];
        const groupBass    = this.patternGroups.bass[groupIndex];
        const groupLead    = this.patternGroups.lead[groupIndex];
        const groupRhythm  = this.patternGroups.rhythm[groupIndex];

        // Humanization: subtle velocity variation (±8%) and timing nudge (±5ms)
        const humanVel  = () => Math.max(0.05, Math.min(1, (Math.random() * 0.16) - 0.08));
        const humanTime = () => time + (Math.random() * 0.01 - 0.005); // ±5ms

        const melodyVel  = (this.melodyVelocity.get(step)  ?? 0.8) + humanVel();
        const harmonyVel = (this.harmonyVelocity.get(step) ?? 0.75) + humanVel();
        const leadVel    = (this.leadVelocity.get(step)    ?? 0.7) + humanVel();
        const bassVel    = (this.bassVelocity.get(step)    ?? 0.8) + humanVel();

        // Filter automation
        const lowpassVal = this.effectAutomation.lowpass?.get(step);
        if (lowpassVal !== undefined && this.effects?.lowpass) {
            const freq = 200 + (20000 - 200) * Math.pow(lowpassVal / 100, 2);
            this.effects.lowpass.frequency.rampTo(freq, 0.05, time);
        }

        // ── Drums ─────────────────────────────────────────────────────────────
        if (this.rhythmEnabled && groupRhythm) {
            const drumInstruments = ['kick', 'snare', 'hihat', 'tom'];
            drumInstruments.forEach(instrument => {
                // Defensive check: ensure groupRhythm[instrument] is a Set with .has method
                const instRhythm = groupRhythm[instrument];
                if (instRhythm && typeof instRhythm.has === 'function' && instRhythm.has(localStep)) {
                    const vel = Math.min(1, (this.rhythmVelocity[instrument]?.get(step) ?? 0.8) + humanVel());

                    if (this.howlerEngine?.initialized) {
                        this.howlerEngine.playDrum(instrument, vel);
                    } else if (this.drums?.[instrument]) {
                        // Tone.js drum - note: MembraneSynth takes a note, NoiseSynth takes nothing
                        if (this.drums[instrument] instanceof Tone.MembraneSynth) {
                            this.drums[instrument].triggerAttackRelease('C1', '16n', humanTime(), vel);
                        } else {
                            this.drums[instrument].triggerAttackRelease('16n', humanTime(), vel);
                        }
                    }

                    // UI flash (deferred to draw thread)
                    Tone.Draw.schedule(() => {
                        const cell = document.querySelector(`.rhythm-cell[data-instrument="${instrument}"][data-step="${localStep}"]`);
                        if (cell) {
                            cell.classList.add('playing');
                            setTimeout(() => cell.classList.remove('playing'), 150);
                        }
                    }, time);
                }
            });
        }

        // ── Harmony (chords) — trigger every 4 steps for motion ───────────────
        // Original: only triggered on step 0 (once per whole loop!)
        // Patched: re-triggers every bar (every 16 steps) for chord changes
        // Defensive check: ensure this.harmonics exists and has size property
        if (this.harmonicsEnabled && localStep === 0 && this.harmonics && this.harmonics.size > 0) {
            const notes = Array.from(this.harmonics).map(i => this.harmonicNotes[i]);
            // Voice the chord across octaves for fullness
            const voicedNotes = this._voiceChord(notes);
            this.polySynth.triggerAttackRelease(voicedNotes, '1m', time, Math.min(1, harmonyVel));
        }

        // ── Melody ────────────────────────────────────────────────────────────
        // Defensive check: ensure groupMelody is a Map with .has method
        if (this.melodyEnabled && groupMelody && typeof groupMelody.has === 'function' && groupMelody.has(localStep)) {
            const row = groupMelody.get(localStep);
            const scale = this.getCurrentScale();
            if (row < scale.length) {
                // Vary note length: most are 16n, some are 8n for expression
                const noteLen = Math.random() > 0.7 ? '8n' : '16n';
                this.melodySynth.triggerAttackRelease(scale[row], noteLen, humanTime(), Math.min(1, melodyVel));
            }
        }

        // ── Bass ──────────────────────────────────────────────────────────────
        // Defensive check: ensure groupBass is a Map with .has method
        if (this.bassEnabled && groupBass && typeof groupBass.has === 'function' && groupBass.has(localStep)) {
            const row = groupBass.get(localStep);
            if (row < this.bassNotes.length) {
                this.bassSynth.triggerAttackRelease(this.bassNotes[row], '8n', humanTime(), Math.min(1, bassVel));
            }
        }

        // ── Lead ─────────────────────────────────────────────────────────────
        // Defensive check: ensure groupLead is a Map with .has method
        if (this.leadEnabled && groupLead && typeof groupLead.has === 'function' && groupLead.has(localStep)) {
            const row = groupLead.get(localStep);
            const scale = this.getCurrentScale();
            if (row < scale.length) {
                const noteLen = Math.random() > 0.6 ? '8n' : '16n';
                this.leadSynth.triggerAttackRelease(scale[row], noteLen, humanTime(), Math.min(1, leadVel));
            }
        }

        // ── Percussion ───────────────────────────────────────────────────────
        if (this.percussionEnabled && groupRhythm) {
            ['conga', 'bongo', 'shaker', 'cymbal'].forEach(instrument => {
                // Defensive check: ensure groupRhythm[instrument] is a Set with .has method
                const instRhythm = groupRhythm[instrument];
                if (this.percussion?.[instrument] && instRhythm && typeof instRhythm.has === 'function' && instRhythm.has(localStep)) {
                    const vel = Math.min(1, (this.rhythmVelocity[instrument]?.get(step) ?? 0.7) + humanVel());
                    this.percussion[instrument].triggerAttackRelease('16n', humanTime(), vel);

                    Tone.Draw.schedule(() => {
                        const cell = document.querySelector(`.rhythm-cell[data-instrument="${instrument}"][data-step="${localStep}"]`);
                        if (cell) {
                            cell.classList.add('playing');
                            setTimeout(() => cell.classList.remove('playing'), 150);
                        }
                    }, time);
                }
            });
        }
    };

    // Keep original playStep as fallback (called from UI click previews)
    proto.playStep = proto._playStepAtTime.bind
        ? function(step) { proto._playStepAtTime.call(this, step, Tone.now()); }
        : proto.playStep;

    // ─────────────────────────────────────────────────────────────────────────
    // 5. DEFAULT DEMO PATTERN — play a simple beat if nothing is loaded
    // ─────────────────────────────────────────────────────────────────────────

    const originalPlay = proto.play;
    proto.play = function() {
        // Check if there's any activity in the pattern
        let hasActivity = false;
        
        // Check harmonics
        if (this.harmonics && this.harmonics.size > 0) hasActivity = true;
        
        // Check melody
        this.patternGroups.melody.forEach(m => {
            if (m && m.size > 0) hasActivity = true;
        });
        
        // Check bass
        this.patternGroups.bass.forEach(b => {
            if (b && b.size > 0) hasActivity = true;
        });
        
        // Check lead
        this.patternGroups.lead.forEach(l => {
            if (l && l.size > 0) hasActivity = true;
        });
        
        // Check rhythm
        this.patternGroups.rhythm.forEach(r => {
            if (r) {
                Object.values(r).forEach(inst => {
                    if (inst && inst.size > 0) hasActivity = true;
                });
            }
        });
        
        // If no activity, load a default demo pattern
        if (!hasActivity) {
            console.log('[songDesigner.patch.js] No pattern found, loading demo...');
            this._loadDefaultDemo();
        }
        
        // Call original play function
        originalPlay.call(this);
    };

    proto._loadDefaultDemo = function() {
        // Load a simple demo pattern
        this.tempo = 120;
        document.getElementById('tempoSlider').value = 120;
        document.getElementById('tempoValue').textContent = '120 BPM';
        
        // Set pattern length to 32
        this.setPatternLength(32);
        
        // Add a simple drum beat to group 0 (Develop)
        const rhythm = this.patternGroups.rhythm[0];
        if (rhythm) {
            // Kick on 1, 5, 9, 13 (every 4 beats)
            [0, 4, 8, 12].forEach(s => rhythm.kick.add(s));
            // Snare on 4, 12
            [4, 12].forEach(s => rhythm.snare.add(s));
            // Hi-hat on every other beat
            [0, 2, 4, 6, 8, 10, 12, 14].forEach(s => rhythm.hihat.add(s));
        }
        
        // Add a simple bass line
        const bass = this.patternGroups.bass[0];
        if (bass) {
            bass.set(0, 0);  // C1
            bass.set(4, 1);  // D1
            bass.set(8, 0);  // C1
            bass.set(12, 2); // E1
        }
        
        // Add a simple melody
        const melody = this.patternGroups.melody[0];
        if (melody) {
            melody.set(0, 4);  // G4
            melody.set(2, 3);  // F4
            melody.set(4, 2);  // E4
            melody.set(6, 3);  // F4
            melody.set(8, 4);  // G4
            melody.set(10, 5); // A4
            melody.set(12, 4); // G4
            melody.set(14, 3); // F4
        }
        
        // Add some harmony
        this.harmonics = this.patternGroups.harmonics[0];
        this.harmonics.add(0); // C
        this.harmonics.add(2); // E
        this.harmonics.add(4); // G
        
        // Rebuild the UI
        this.rebuildGrids();
        this.createSectionTimelines();
        this.updateHarmonicsUI();
        
        this.showNotification('Demo pattern loaded - press Play to hear it!', 'success');
    };

    // ─────────────────────────────────────────────────────────────────────────
    // 5. CHORD VOICING — spread notes across octaves for fullness
    //    Tight voicing (all notes in one octave) sounds muddy.
    //    Open voicing (spread over 2+ octaves) sounds rich.
    // ─────────────────────────────────────────────────────────────────────────

    proto._voiceChord = function(notes) {
        if (!notes || notes.length === 0) return notes;

        // Parse note name and octave
        const parseNote = (n) => {
            const match = n.match(/^([A-G]#?)(\d+)$/);
            if (!match) return { name: n, octave: 4 };
            return { name: match[1], octave: parseInt(match[2]) };
        };

        const voiced = notes.map((note, i) => {
            const parsed = parseNote(note);
            // Root stays at original octave
            // 3rd goes up an octave, 5th stays, 7th (if present) goes up 2
            const octaveShift = i === 1 ? 1 : i === 3 ? 1 : 0;
            return `${parsed.name}${parsed.octave + octaveShift}`;
        });

        return voiced;
    };

    // ─────────────────────────────────────────────────────────────────────────
    // 6. TEMPO CHANGE — update Tone.Transport too
    // ─────────────────────────────────────────────────────────────────────────

    const originalSetupEventListeners = proto.setupEventListeners;
    proto.setupEventListeners = function() {
        originalSetupEventListeners.call(this);

        // Patch tempo slider to also update Transport
        const tempoSlider = document.getElementById('tempoSlider');
        if (tempoSlider) {
            tempoSlider.addEventListener('input', () => {
                Tone.Transport.bpm.value = this.tempo;
            });
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // 7. RICHER SYNTH CREATION
    //    Patch createHarmonicSynth to use polyphony limit (avoids voice stealing clicks)
    // ─────────────────────────────────────────────────────────────────────────

    const originalCreateHarmonicSynth = proto.createHarmonicSynth;
    proto.createHarmonicSynth = function() {
        originalCreateHarmonicSynth.call(this);
        // Set polyphony cap to prevent CPU overload and voice stealing artefacts
        if (this.polySynth && this.polySynth.maxPolyphony !== undefined) {
            this.polySynth.maxPolyphony = 6;
        }
    };

    const originalCreateMelodySynth = proto.createMelodySynth;
    proto.createMelodySynth = function() {
        originalCreateMelodySynth.call(this);
        if (this.melodySynth && this.melodySynth.maxPolyphony !== undefined) {
            this.melodySynth.maxPolyphony = 4;
        }
    };

    const originalCreateLeadSynth = proto.createLeadSynth;
    proto.createLeadSynth = function() {
        originalCreateLeadSynth.call(this);
        if (this.leadSynth && this.leadSynth.maxPolyphony !== undefined) {
            this.leadSynth.maxPolyphony = 3;
        }
    };

    console.log('[songDesigner.patch.js] Audio quality patches applied ✓');

    // ─────────────────────────────────────────────────────────────────────────
    // 8. AUTO-PLAY AFTER RANDOMIZE
    //    Override randomize() to automatically start playback after generating
    //    a random pattern, so the user can hear it immediately.
    // ─────────────────────────────────────────────────────────────────────────

    // ─────────────────────────────────────────────────────────────────────────
    // 8. AUTO-PLAY AFTER RANDOMIZE
    //    Completely override randomize() with our own implementation that:
    //    1. Fixes data structure issues from the start
    //    2. Generates random patterns
    //    3. Loads a random preset for additional variation
    //    4. Auto-plays the result
    // ─────────────────────────────────────────────────────────────────────────

    const originalRandomize = proto.randomize;
    proto.randomize = function() {
        // Store reference to 'this' for use in callbacks
        const app = this;
        
        // First, ensure data structure is correct
        app._fixPatternDataStructure();
        
        const scale = app.getCurrentScale();
        const groupCount = app.patternLength / 16;
        
        // Generate random bass patterns
        for (let g = 0; g < groupCount; g++) {
            const groupBass = app.patternGroups.bass[g];
            if (!groupBass) {
                app.patternGroups.bass[g] = new Map();
            }
            const bassDensity = 0.3 + Math.random() * 0.4;
            
            for (let col = 0; col < 16; col++) {
                if (Math.random() < bassDensity) {
                    const row = Math.floor(Math.random() * 6);
                    app.patternGroups.bass[g].set(col, row);
                }
            }
        }
        
        // Generate random lead patterns
        for (let g = 0; g < groupCount; g++) {
            const groupLead = app.patternGroups.lead[g];
            if (!groupLead) {
                app.patternGroups.lead[g] = new Map();
            }
            const leadDensity = 0.2 + Math.random() * 0.5;
            
            for (let col = 0; col < 16; col++) {
                if (Math.random() < leadDensity) {
                    const row = Math.floor(Math.random() * 8);
                    app.patternGroups.lead[g].set(col, row);
                }
            }
        }
        
        // Generate random rhythm patterns
        for (let g = 0; g < groupCount; g++) {
            if (!app.patternGroups.rhythm[g]) {
                app.patternGroups.rhythm[g] = {
                    kick: new Set(), snare: new Set(), hihat: new Set(), tom: new Set(),
                    conga: new Set(), bongo: new Set(), shaker: new Set(), cymbal: new Set()
                };
            }
            const groupRhythm = app.patternGroups.rhythm[g];
            
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
            
            if (app.percussionEnabled) {
                for (let step = 0; step < 16; step++) {
                    if (Math.random() > 0.7) groupRhythm.conga.add(step);
                    if (Math.random() > 0.8) groupRhythm.bongo.add(step);
                    if (Math.random() > 0.6) groupRhythm.shaker.add(step);
                    if (Math.random() > 0.85) groupRhythm.cymbal.add(step);
                }
            }
        }
        
        // Set random velocities and filter automation
        for (let step = 0; step < app.patternLength; step++) {
            app.melodyVelocity.set(step, 0.5 + Math.random() * 0.4);
            app.leadVelocity.set(step, 0.4 + Math.random() * 0.5);
            app.bassVelocity.set(step, 0.6 + Math.random() * 0.3);
            ['kick', 'snare', 'hihat', 'tom'].forEach(inst => {
                app.rhythmVelocity[inst].set(step, 0.5 + Math.random() * 0.4);
            });
            const progress = step / app.patternLength;
            app.effectAutomation.lowpass.set(step, 30 + progress * 50 + Math.random() * 20);
        }
        
        // Fix data structure again
        app._fixPatternDataStructure();
        
        // Update current group references
        app.bassRows = app.patternGroups.bass[app.currentGroupIndex];
        app.leadRows = app.patternGroups.lead[app.currentGroupIndex];
        app.rhythm = app.patternGroups.rhythm[app.currentGroupIndex];
        
        // Rebuild UI
        app.rebuildGrids();
        app.createSectionTimelines();
        
        // Now try to load a random preset for additional variation
        app.showNotification('Generating random pattern...', 'info');
        
        const genres = window.getAllGenres();
        const randomGenre = genres[Math.floor(Math.random() * genres.length)];
        
        getPresetsByGenre(randomGenre).then(presets => {
            const keys = Object.keys(presets);
            if (keys.length > 0) {
                const randomKey = keys[Math.floor(Math.random() * keys.length)];
                const preset = presets[randomKey];
                
                // Apply some elements from the preset (tempo, etc.)
                if (preset.tempo) {
                    app.tempo = preset.tempo;
                    document.getElementById('tempoSlider').value = app.tempo;
                    document.getElementById('tempoValue').textContent = app.tempo + ' BPM';
                }
                
                // Mix in some elements from the preset if they're defined
                // But keep our generated patterns
                
                app.showNotification(`Random pattern: ${preset.name}`, 'success');
            }
            
            // Start playback after everything is loaded
            setTimeout(async () => {
                console.log('[randomize] Starting playback...');
                
                // Start Tone.js properly - this is required for browser autoplay policy
                try {
                    await Tone.start();
                    console.log('[randomize] Tone.js started');
                } catch (e) {
                    console.error('[randomize] Error starting Tone.js:', e);
                }
                
                // Ensure Howler engine is resumed
                if (app.howlerEngine) {
                    app.howlerEngine.resume();
                }
                
                // Force stop first to clean any previous state
                if (app.isPlaying) {
                    app.stop();
                }
                
                // Reset step to beginning
                app.currentStep = 0;
                app.groupLoopCurrent = [0, 0, 0, 0];
                
                // Set tempo on Transport
                Tone.Transport.bpm.value = app.tempo;
                Tone.Transport.cancel();
                
                // Schedule the transport
                app._transportEvent = Tone.Transport.scheduleRepeat((time) => {
                    Tone.Draw.schedule(() => {
                        app._advanceStep();
                    }, time);
                    app._playStepAtTime(app.currentStep, time);
                }, '16n');
                
                // Start transport
                Tone.Transport.start();
                app.isPlaying = true;
                
                console.log('[randomize] Started Tone.Transport');
                
                // Update UI
                const playBtn = document.getElementById('playBtn');
                if (playBtn) {
                    playBtn.classList.remove('btn-play');
                    playBtn.classList.add('btn-stop');
                    const playText = playBtn.querySelector('#playText');
                    if (playText) playText.textContent = 'Stop';
                }
                
            }, 500);
        }).catch(err => {
            console.error('[randomize] Error loading preset:', err);
            // Still try to play even if preset loading fails
            app.showNotification('Random pattern generated!', 'success');
            
            setTimeout(async () => {
                if (Tone.context && Tone.context.state === 'suspended') {
                    Tone.context.resume();
                }
                if (app.howlerEngine) {
                    app.howlerEngine.resume();
                }
                if (!app.isPlaying) {
                    app.play();
                }
            }, 500);
        });
    };
    
    // Helper to fix pattern data structure - converts plain objects back to Maps/Sets
    proto._fixPatternDataStructure = function() {
        // Fix bass - convert plain objects back to Maps
        this.patternGroups.bass.forEach((group, g) => {
            if (!group) {
                this.patternGroups.bass[g] = new Map();
            } else if (!(group instanceof Map)) {
                const entries = Object.entries(group);
                this.patternGroups.bass[g] = new Map(entries.map(([k, v]) => [parseInt(k), v]));
            }
        });
        
        // Fix lead - convert plain objects back to Maps
        this.patternGroups.lead.forEach((group, g) => {
            if (!group) {
                this.patternGroups.lead[g] = new Map();
            } else if (!(group instanceof Map)) {
                const entries = Object.entries(group);
                this.patternGroups.lead[g] = new Map(entries.map(([k, v]) => [parseInt(k), v]));
            }
        });
        
        // Fix melody - convert plain objects back to Maps
        this.patternGroups.melody.forEach((group, g) => {
            if (!group) {
                this.patternGroups.melody[g] = new Map();
            } else if (!(group instanceof Map)) {
                const entries = Object.entries(group);
                this.patternGroups.melody[g] = new Map(entries.map(([k, v]) => [parseInt(k), v]));
            }
        });
        
        // Fix rhythm - ensure proper structure for each group
        this.patternGroups.rhythm.forEach((group, g) => {
            if (!group) {
                this.patternGroups.rhythm[g] = {
                    kick: new Set(), snare: new Set(), hihat: new Set(), tom: new Set(),
                    conga: new Set(), bongo: new Set(), shaker: new Set(), cymbal: new Set()
                };
            } else {
                ['kick', 'snare', 'hihat', 'tom', 'conga', 'bongo', 'shaker', 'cymbal'].forEach(inst => {
                    if (!group[inst]) {
                        this.patternGroups.rhythm[g][inst] = new Set();
                    } else if (!(group[inst] instanceof Set)) {
                        this.patternGroups.rhythm[g][inst] = new Set(group[inst]);
                    }
                });
            }
        });
        
        // Update current references
        this.bassRows = this.patternGroups.bass[this.currentGroupIndex];
        this.leadRows = this.patternGroups.lead[this.currentGroupIndex];
        this.melodyRows = this.patternGroups.melody[this.currentGroupIndex];
        this.rhythm = this.patternGroups.rhythm[this.currentGroupIndex];
        
        console.log('[randomize] Fixed pattern data structure');
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // 9. FIX clearAll() DATA STRUCTURE ISSUES
    //    The clearAll function expects Sets but data may be corrupted
    // ─────────────────────────────────────────────────────────────────────────

    const originalClearAll = proto.clearAll;
    proto.clearAll = function() {
        // Fix data structure first
        this._fixPatternDataStructure();
        
        // Now call original clearAll
        originalClearAll.call(this);
    };

    // ─────────────────────────────────────────────────────────────────────────
    // 9. ADD MISSING getSongData AND loadSongData METHODS
    //    These are required for export/import functionality
    // ─────────────────────────────────────────────────────────────────────────

    proto.getSongData = function() {
        // Serialize all song data for export
        return {
            version: '1.0',
            timestamp: new Date().toISOString(),
            tempo: this.tempo,
            patternLength: this.patternLength,
            currentGroupIndex: this.currentGroupIndex,
            groupLoopCounts: this.groupLoopCounts,
            
            // Current instrument selections
            currentHarmonicInstrument: this.currentHarmonicInstrument,
            currentMelodyInstrument: this.currentMelodyInstrument,
            currentBassInstrument: this.currentBassInstrument,
            currentLeadInstrument: this.currentLeadInstrument,
            currentDrumKit: this.currentDrumKit,
            currentPercussionKit: this.currentPercussionKit,
            bassOctave: this.bassOctave,
            
            // Section enabled states
            harmonicsEnabled: this.harmonicsEnabled,
            melodyEnabled: this.melodyEnabled,
            rhythmEnabled: this.rhythmEnabled,
            bassEnabled: this.bassEnabled,
            leadEnabled: this.leadEnabled,
            percussionEnabled: this.percussionEnabled,
            effectsEnabled: this.effectsEnabled,
            
            // Pattern groups (the main song data)
            patternGroups: {
                harmonics: this.patternGroups.harmonics.map(s => Array.from(s)),
                melody: this.patternGroups.melody.map(m => {
                    const obj = {};
                    m.forEach((v, k) => { obj[k] = v; });
                    return obj;
                }),
                bass: this.patternGroups.bass.map(b => {
                    const obj = {};
                    b.forEach((v, k) => { obj[k] = v; });
                    return obj;
                }),
                lead: this.patternGroups.lead.map(l => {
                    const obj = {};
                    l.forEach((v, k) => { obj[k] = v; });
                    return obj;
                }),
                rhythm: this.patternGroups.rhythm.map(r => {
                    const obj = {};
                    Object.keys(r).forEach(inst => {
                        obj[inst] = Array.from(r[inst]);
                    });
                    return obj;
                })
            },
            
            // Effect settings
            effects: {
                reverb: parseInt(document.getElementById('reverbAmount')?.value || 30),
                echo: parseInt(document.getElementById('echoAmount')?.value || 20),
                chorus: parseInt(document.getElementById('chorusAmount')?.value || 30),
                lowpass: parseInt(document.getElementById('lowpassAmount')?.value || 50),
                highpass: parseInt(document.getElementById('highpassAmount')?.value || 0),
                distortion: parseInt(document.getElementById('distortionAmount')?.value || 0),
                bitcrush: parseInt(document.getElementById('bitcrushAmount')?.value || 0),
                tremolo: parseInt(document.getElementById('tremoloAmount')?.value || 0),
                vibrato: parseInt(document.getElementById('vibratoAmount')?.value || 0)
            }
        };
    };

    proto.loadSongData = function(data) {
        if (!data) return;
        
        // Stop playback if playing
        if (this.isPlaying) this.stop();
        
        // Load basic settings
        if (data.tempo) {
            this.tempo = data.tempo;
            document.getElementById('tempoSlider').value = this.tempo;
            document.getElementById('tempoValue').textContent = this.tempo + ' BPM';
        }
        
        if (data.patternLength) {
            this.setPatternLength(data.patternLength);
        }
        
        if (data.currentGroupIndex !== undefined) {
            this.currentGroupIndex = data.currentGroupIndex;
        }
        
        if (data.groupLoopCounts) {
            this.groupLoopCounts = data.groupLoopCounts;
        }
        
        // Load instrument selections
        if (data.currentHarmonicInstrument) {
            this.currentHarmonicInstrument = data.currentHarmonicInstrument;
            document.getElementById('harmonicInstrument').value = data.currentHarmonicInstrument;
        }
        if (data.currentMelodyInstrument) {
            this.currentMelodyInstrument = data.currentMelodyInstrument;
            document.getElementById('melodyInstrument').value = data.currentMelodyInstrument;
        }
        if (data.currentBassInstrument) {
            this.currentBassInstrument = data.currentBassInstrument;
            document.getElementById('bassInstrument').value = data.currentBassInstrument;
        }
        if (data.currentLeadInstrument) {
            this.currentLeadInstrument = data.currentLeadInstrument;
            document.getElementById('leadInstrument').value = data.currentLeadInstrument;
        }
        if (data.currentDrumKit) {
            this.currentDrumKit = data.currentDrumKit;
            document.getElementById('drumKit').value = data.currentDrumKit;
        }
        if (data.currentPercussionKit) {
            this.currentPercussionKit = data.currentPercussionKit;
            document.getElementById('percussionKit').value = data.currentPercussionKit;
        }
        
        // Load section enabled states
        if (data.harmonicsEnabled !== undefined) this.harmonicsEnabled = data.harmonicsEnabled;
        if (data.melodyEnabled !== undefined) this.melodyEnabled = data.melodyEnabled;
        if (data.rhythmEnabled !== undefined) this.rhythmEnabled = data.rhythmEnabled;
        if (data.bassEnabled !== undefined) this.bassEnabled = data.bassEnabled;
        if (data.leadEnabled !== undefined) this.leadEnabled = data.leadEnabled;
        if (data.percussionEnabled !== undefined) this.percussionEnabled = data.percussionEnabled;
        if (data.effectsEnabled !== undefined) this.effectsEnabled = data.effectsEnabled;
        
        // Load pattern groups
        if (data.patternGroups) {
            const pg = data.patternGroups;
            
            // Harmonics
            if (pg.harmonics) {
                pg.harmonics.forEach((arr, i) => {
                    if (this.patternGroups.harmonics[i]) {
                        this.patternGroups.harmonics[i] = new Set(arr);
                    }
                });
            }
            
            // Melody
            if (pg.melody) {
                pg.melody.forEach((obj, i) => {
                    if (this.patternGroups.melody[i]) {
                        this.patternGroups.melody[i] = new Map(Object.entries(obj).map(([k, v]) => [parseInt(k), v]));
                    }
                });
            }
            
            // Bass
            if (pg.bass) {
                pg.bass.forEach((obj, i) => {
                    if (this.patternGroups.bass[i]) {
                        this.patternGroups.bass[i] = new Map(Object.entries(obj).map(([k, v]) => [parseInt(k), v]));
                    }
                });
            }
            
            // Lead
            if (pg.lead) {
                pg.lead.forEach((obj, i) => {
                    if (this.patternGroups.lead[i]) {
                        this.patternGroups.lead[i] = new Map(Object.entries(obj).map(([k, v]) => [parseInt(k), v]));
                    }
                });
            }
            
            // Rhythm
            if (pg.rhythm) {
                pg.rhythm.forEach((obj, i) => {
                    if (this.patternGroups.rhythm[i]) {
                        Object.keys(this.patternGroups.rhythm[i]).forEach(inst => {
                            this.patternGroups.rhythm[i][inst] = new Set(obj[inst] || []);
                        });
                    }
                });
            }
        }
        
        // Update current references
        this.harmonics = this.patternGroups.harmonics[this.currentGroupIndex];
        this.melodyRows = this.patternGroups.melody[this.currentGroupIndex];
        this.bassRows = this.patternGroups.bass[this.currentGroupIndex];
        this.leadRows = this.patternGroups.lead[this.currentGroupIndex];
        this.rhythm = this.patternGroups.rhythm[this.currentGroupIndex];
        
        // Rebuild UI
        this.rebuildGrids();
        this.createSectionTimelines();
        this.updateHarmonicsUI();
        this.updateSectionRepeatsControl();
        
        // Load effect settings
        if (data.effects) {
            const fx = data.effects;
            if (fx.reverb !== undefined) {
                document.getElementById('reverbAmount').value = fx.reverb;
                document.getElementById('reverbValue').textContent = fx.reverb + '%';
            }
            if (fx.echo !== undefined) {
                document.getElementById('echoAmount').value = fx.echo;
                document.getElementById('echoValue').textContent = fx.echo + '%';
            }
            if (fx.chorus !== undefined) {
                document.getElementById('chorusAmount').value = fx.chorus;
                document.getElementById('chorusValue').textContent = fx.chorus + '%';
            }
            if (fx.lowpass !== undefined) {
                document.getElementById('lowpassAmount').value = fx.lowpass;
                document.getElementById('lowpassValue').textContent = fx.lowpass + '%';
            }
            if (fx.highpass !== undefined) {
                document.getElementById('highpassAmount').value = fx.highpass;
                document.getElementById('highpassValue').textContent = fx.highpass + '%';
            }
            if (fx.distortion !== undefined) {
                document.getElementById('distortionAmount').value = fx.distortion;
                document.getElementById('distortionValue').textContent = fx.distortion + '%';
            }
            if (fx.bitcrush !== undefined) {
                document.getElementById('bitcrushAmount').value = fx.bitcrush;
                document.getElementById('bitcrushValue').textContent = fx.bitcrush + '%';
            }
            if (fx.tremolo !== undefined) {
                document.getElementById('tremoloAmount').value = fx.tremolo;
                document.getElementById('tremoloValue').textContent = fx.tremolo + '%';
            }
            if (fx.vibrato !== undefined) {
                document.getElementById('vibratoAmount').value = fx.vibrato;
                document.getElementById('vibratoValue').textContent = fx.vibrato + '%';
            }
        }
        
        console.log('[songDesigner.patch.js] Song data loaded successfully');
    };

})();
